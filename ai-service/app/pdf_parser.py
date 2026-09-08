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
# Higher zoom improves Tesseract on CamScanner/phone-scan PDFs (A4 pages).
RENDER_ZOOM = 3.5

WATERMARK_ONLY_PATTERN = re.compile(
    r"^(?:camscanner|scanned\s+by(?:\s+\w+)?|scanned\s+with(?:\s+\w+)?|scanbot|"
    r"adobe\s+scan|microsoft\s+lens|genius\s+scan)$",
    re.IGNORECASE,
)
SCANNER_FOOTER_LINE = re.compile(
    r"^\s*(?:scanned\s+(?:by|with)\s+)?(?:camscanner|scanbot|adobe\s+scan|"
    r"microsoft\s+lens|genius\s+scan)\s*$",
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
    return normalize_moe_text(_strip_scanner_footers(text))

def _strip_scanner_footers(text: str) -> str:
    """Remove CamScanner-style footer lines without discarding the page body."""
    if not text:
        return ""
    kept = [line for line in text.splitlines() if not SCANNER_FOOTER_LINE.match(line)]
    return "\n".join(kept).strip()

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
    # CamScanner appends a footer to real OCR text. Only reject short watermark-only blobs.
    if len(collapsed) < 80 and WATERMARK_ONLY_PATTERN.match(collapsed):
        return True
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

def _ocr_text_score(text: str) -> tuple[int, int, int]:
    """Higher is better: more content, fewer 1-letter OCR junk tokens, more real words."""
    cleaned = re.sub(r"\s+", " ", (text or "").strip())
    if not cleaned:
        return (0, 0, 0)
    words = cleaned.split()
    singles = sum(1 for word in words if len(word) == 1 and word.isalpha())
    real_words = sum(1 for word in words if len(word) >= 3)
    return (len(cleaned), real_words, -singles)

def _pick_better_ocr(*candidates: str) -> str:
    best = ""
    best_score = _ocr_text_score("")
    for candidate in candidates:
        score = _ocr_text_score(candidate)
        if score > best_score:
            best = candidate or ""
            best_score = score
    return best

def _tesseract_image(image, ocr_lang: str, tess_config: str | None, psm: int) -> str:
    import pytesseract

    config = " ".join(part for part in ((tess_config or "").strip(), f"--psm {psm}") if part)
    return pytesseract.image_to_string(image, lang=ocr_lang, config=config)

def _ocr_image(image, ocr_lang: str, tess_config: str | None) -> str:
    prepared = _preprocess_for_ocr(image)
    # PSM 6 (block) usually beats PSM 4 on MOE circular scans; keep both and pick.
    primary = _tesseract_image(prepared, ocr_lang, tess_config, psm=6)
    secondary = _tesseract_image(prepared, ocr_lang, tess_config, psm=4)
    return _pick_better_ocr(primary, secondary)

def _render_page_image(page, zoom: float = RENDER_ZOOM):
    import fitz
    from PIL import Image

    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    return Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

def _ocr_page(doc, page, ocr_lang: str, tess_config: str | None) -> str:
    from PIL import Image

    candidates: list[str] = []
    embedded = _largest_embedded_image(doc, page)
    if embedded:
        image = Image.open(io.BytesIO(embedded))
        candidates.append(_ocr_image(image, ocr_lang, tess_config))

    # Always OCR a high-zoom page render. Embedded CamScanner images are often
    # ~1000px wide and beat a denser render on "enough characters" even when
    # the render reads dates/words more accurately.
    candidates.append(_ocr_image(_render_page_image(page), ocr_lang, tess_config))

    return _pick_better_ocr(*candidates)

def _ocr_with_pymupdf(data: bytes, filename: str | None = None) -> tuple[list[str], int, str]:
    import fitz

    try:
        import pytesseract
        from PIL import Image
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

        # Misnamed *-En scans of Sinhala circulars OCR as Latin gibberish under eng.
        # If a Sinhala pass recovers real Sinhala letters, prefer it.
        if ocr_lang == "eng" and page_count <= 4:
            combined = "\n\n".join(page_texts)
            if len(SINHALA_RE.findall(combined)) < 15:
                si_lang, si_config = resolve_ocr_settings("probe-Si.pdf")
                if "sin" in si_lang.split("+"):
                    si_pages = [
                        _ocr_page(doc, page, si_lang, si_config) for page in doc
                    ]
                    si_combined = "\n\n".join(si_pages)
                    if len(SINHALA_RE.findall(si_combined)) >= 15 and _ocr_text_score(
                        si_combined
                    ) >= _ocr_text_score(combined):
                        logger.info(
                            "Preferring %s OCR over eng for %s (Sinhala letters recovered)",
                            si_lang,
                            filename,
                        )
                        page_texts = si_pages
                        ocr_lang = si_lang

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

