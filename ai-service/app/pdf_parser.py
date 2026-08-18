import io
import logging
import re
from dataclasses import dataclass

from app.moe_text import normalize_moe_text
from app.ocr_languages import filename_script_hint, missing_ocr_languages, resolve_ocr_settings

logger = logging.getLogger("easycircular.ai.pdf")

TEXT_DENSITY_THRESHOLD = 50
MIN_EMBEDDED_IMAGE_SIDE = 400
MIN_OCR_HEIGHT = 1800
RENDER_ZOOM = 3.0  # ~216 DPI on an A4 page

# Scanner watermarks / near-empty text layers that must never be treated as content.
WATERMARK_ONLY_PATTERN = re.compile(
    r"^(?:camscanner|scanned\s+by|scanned\s+with|scanbot|adobe\s+scan|"
    r"microsoft\s+lens|genius\s+scan|.*?scanner)$",
    re.IGNORECASE,
)
SINHALA_RE = re.compile(r"[\u0D80-\u0DFF]")
TAMIL_RE = re.compile(r"[\u0B80-\u0BFF]")


@dataclass
class ParseResult:
    text: str
    pages: int
    ocr_used: bool
    ocr_lang: str | None
    page_texts: list[str]
    error: str | None = None


def _normalize_text(text: str) -> str:
    return normalize_moe_text(text)


def _average_density(text: str, pages: int) -> float:
    if pages <= 0:
        return 0.0
    return len(text.strip()) / pages


def _is_insufficient_text(text: str, pages: int = 1) -> bool:
    """True when extracted text is empty, watermark-only, or far too short for a circular."""
    cleaned = (text or "").strip()
    if not cleaned:
        return True
    collapsed = re.sub(r"\s+", " ", cleaned)
    if WATERMARK_ONLY_PATTERN.match(collapsed):
        return True
    # A real MOE circular page almost never has fewer than ~80 readable chars.
    if len(collapsed) < 80 and _average_density(cleaned, max(pages, 1)) < TEXT_DENSITY_THRESHOLD:
        return True
    return False


def _missing_expected_script(text: str, filename: str | None) -> bool:
    """After OCR, -Si/-Ta filenames should contain that script, not Latin garbage."""
    hint = filename_script_hint(filename)
    sample = text or ""
    if hint == "sin":
        return len(SINHALA_RE.findall(sample)) < 15
    if hint == "tam":
        return len(TAMIL_RE.findall(sample)) < 15
    return False


def _extract_with_pdfplumber(data: bytes) -> tuple[list[str], int]:
    import pdfplumber

    page_texts: list[str] = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages:
            page_texts.append(page.extract_text() or "")
        page_count = len(pdf.pages)
    return page_texts, page_count


def _extract_with_pymupdf(data: bytes) -> tuple[list[str], int]:
    import fitz

    page_texts: list[str] = []
    with fitz.open(stream=data, filetype="pdf") as doc:
        for page in doc:
            page_texts.append(page.get_text("text") or "")
        page_count = doc.page_count
    return page_texts, page_count


def _preprocess_for_ocr(image):
    from PIL import Image, ImageOps

    gray = ImageOps.autocontrast(image.convert("L"))
    if gray.height < MIN_OCR_HEIGHT:
        scale = MIN_OCR_HEIGHT / max(gray.height, 1)
        gray = gray.resize(
            (max(1, int(gray.width * scale)), MIN_OCR_HEIGHT),
            Image.Resampling.LANCZOS,
        )
    return gray.convert("RGB")


def _largest_embedded_image(doc, page):
    best = None
    best_area = 0
    for img in page.get_images(full=True):
        xref = img[0]
        try:
            info = doc.extract_image(xref)
        except Exception:
            continue
        width = int(info.get("width") or 0)
        height = int(info.get("height") or 0)
        if width < MIN_EMBEDDED_IMAGE_SIDE or height < MIN_EMBEDDED_IMAGE_SIDE:
            continue
        area = width * height
        payload = info.get("image")
        if area > best_area and payload:
            best_area = area
            best = payload
    return best


def _tesseract_image(image, ocr_lang: str, tess_config: str | None, psm: int) -> str:
    import pytesseract

    config = " ".join(part for part in ((tess_config or "").strip(), f"--psm {psm}") if part)
    return pytesseract.image_to_string(image, lang=ocr_lang, config=config)


def _ocr_image(image, ocr_lang: str, tess_config: str | None) -> str:
    prepared = _preprocess_for_ocr(image)
    text = _tesseract_image(prepared, ocr_lang, tess_config, psm=4)
    if _is_insufficient_text(text, 1):
        retry = _tesseract_image(prepared, ocr_lang, tess_config, psm=6)
        if len((retry or "").strip()) > len((text or "").strip()):
            return retry
    return text


def _render_page_image(page, zoom: float = RENDER_ZOOM):
    import fitz
    from PIL import Image

    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    return Image.frombytes("RGB", [pix.width, pix.height], pix.samples)


def _ocr_page(doc, page, ocr_lang: str, tess_config: str | None) -> str:
    from PIL import Image

    text = ""
    embedded = _largest_embedded_image(doc, page)
    if embedded:
        image = Image.open(io.BytesIO(embedded))
        text = _ocr_image(image, ocr_lang, tess_config)

    if _is_insufficient_text(text, 1):
        rendered = _ocr_image(_render_page_image(page), ocr_lang, tess_config)
        if len((rendered or "").strip()) > len((text or "").strip()):
            text = rendered

    return text


def _ocr_with_pymupdf(data: bytes, filename: str | None = None) -> tuple[list[str], int, str]:
    import fitz

    try:
        import pytesseract  # noqa: F401
        from PIL import Image  # noqa: F401
    except ImportError as exc:
        raise RuntimeError("OCR dependencies are not installed") from exc

    ocr_lang, tess_config = resolve_ocr_settings(filename)
    page_texts: list[str] = []

    with fitz.open(stream=data, filetype="pdf") as doc:
        logger.info("OCR starting pages=%s lang=%s file=%s", doc.page_count, ocr_lang, filename)
        for index, page in enumerate(doc, start=1):
            page_texts.append(_ocr_page(doc, page, ocr_lang, tess_config))
            logger.info("OCR page %s/%s chars=%s", index, doc.page_count, len(page_texts[-1].strip()))
        page_count = doc.page_count

    return page_texts, page_count, ocr_lang


def _is_tesseract_available() -> bool:
    try:
        import pytesseract

        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False


def _ocr_failure_message(
    *,
    filename: str | None,
    ocr_lang: str | None,
    errors: list[str],
) -> str:
    message = (
        "OCR did not recover readable circular text from this scanned PDF "
        "(result was empty or only a scanner watermark)."
    )
    missing = missing_ocr_languages(filename, ocr_lang)
    script_langs = [lang for lang in missing if lang in {"sin", "tam"}]
    if script_langs:
        labels = {"sin": "Sinhala (sin)", "tam": "Tamil (tam)"}
        named = ", ".join(labels[lang] for lang in script_langs)
        message += (
            f" Missing Tesseract language pack(s): {named}. "
            "Run scripts/install-tesseract-languages.ps1 and restart the AI service."
        )
    else:
        message += " Try a clearer scan or re-export the PDF."
    if errors:
        message = f"{message} ({'; '.join(errors)})"
    return message


def parse_pdf_bytes(data: bytes, filename: str | None = None) -> ParseResult:
    if not data:
        return ParseResult(
            text="",
            pages=0,
            ocr_used=False,
            ocr_lang=None,
            page_texts=[],
            error="Empty file",
        )

    page_texts: list[str] = []
    page_count = 0
    ocr_used = False
    ocr_lang: str | None = None
    errors: list[str] = []

    try:
        page_texts, page_count = _extract_with_pdfplumber(data)
    except Exception as exc:
        errors.append(f"pdfplumber: {exc}")

    combined = _normalize_text("\n\n".join(page_texts))
    density = _average_density(combined, page_count)

    # Force OCR for watermark-only / tiny text layers even if density math is odd.
    needs_ocr = density < TEXT_DENSITY_THRESHOLD or _is_insufficient_text(combined, page_count)

    if needs_ocr:
        try:
            page_texts, page_count = _extract_with_pymupdf(data)
            combined = _normalize_text("\n\n".join(page_texts))
            density = _average_density(combined, page_count)
            needs_ocr = density < TEXT_DENSITY_THRESHOLD or _is_insufficient_text(combined, page_count)
        except Exception as exc:
            errors.append(f"PyMuPDF: {exc}")

    if needs_ocr:
        if not _is_tesseract_available():
            message = (
                "This looks like a scanned PDF (little or no real text, often only a "
                "'CamScanner' watermark). Tesseract OCR is not available. "
                "Install Tesseract OCR on the host or use the Docker image."
            )
            if errors:
                message = f"{message} ({'; '.join(errors)})"
            return ParseResult(
                text="",
                pages=page_count,
                ocr_used=False,
                ocr_lang=None,
                page_texts=page_texts,
                error=message,
            )

        try:
            page_texts, page_count, ocr_lang = _ocr_with_pymupdf(data, filename)
            combined = _normalize_text("\n\n".join(page_texts))
            ocr_used = True
        except Exception as exc:
            errors.append(f"OCR: {exc}")
            return ParseResult(
                text="",
                pages=page_count,
                ocr_used=False,
                ocr_lang=None,
                page_texts=page_texts,
                error="; ".join(errors) if errors else str(exc),
            )

    insufficient = _is_insufficient_text(combined, page_count)
    if ocr_used and not insufficient:
        insufficient = _missing_expected_script(combined, filename)

    if insufficient:
        return ParseResult(
            text="",
            pages=page_count,
            ocr_used=ocr_used,
            ocr_lang=ocr_lang,
            page_texts=page_texts,
            error=_ocr_failure_message(filename=filename, ocr_lang=ocr_lang, errors=errors),
        )

    if not combined and errors:
        return ParseResult(
            text="",
            pages=page_count,
            ocr_used=ocr_used,
            ocr_lang=ocr_lang,
            page_texts=page_texts,
            error="; ".join(errors),
        )

    return ParseResult(
        text=combined,
        pages=page_count,
        ocr_used=ocr_used,
        ocr_lang=ocr_lang,
        page_texts=page_texts,
        error="; ".join(errors) if errors and not combined else None,
    )
