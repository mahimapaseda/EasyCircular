import io
import re
from dataclasses import dataclass

from app.moe_text import normalize_moe_text
from app.ocr_languages import resolve_ocr_settings

TEXT_DENSITY_THRESHOLD = 50


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


def _ocr_with_pymupdf(data: bytes) -> tuple[list[str], int, str]:
    import fitz

    try:
        import pytesseract
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError("OCR dependencies are not installed") from exc

    ocr_lang, tess_config = resolve_ocr_settings()
    page_texts: list[str] = []

    with fitz.open(stream=data, filetype="pdf") as doc:
        for page in doc:
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            page_texts.append(
                pytesseract.image_to_string(
                    image,
                    lang=ocr_lang,
                    config=tess_config or "",
                )
            )
        page_count = doc.page_count

    return page_texts, page_count, ocr_lang


def _is_tesseract_available() -> bool:
    try:
        import pytesseract

        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False


def parse_pdf_bytes(data: bytes) -> ParseResult:
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

    if density < TEXT_DENSITY_THRESHOLD:
        try:
            page_texts, page_count = _extract_with_pymupdf(data)
            combined = _normalize_text("\n\n".join(page_texts))
            density = _average_density(combined, page_count)
        except Exception as exc:
            errors.append(f"PyMuPDF: {exc}")

    if density < TEXT_DENSITY_THRESHOLD:
        if not _is_tesseract_available():
            message = (
                "Low text density and Tesseract OCR is not available. "
                "Install Tesseract OCR on the host or use the Docker image."
            )
            if errors:
                message = f"{message} ({'; '.join(errors)})"
            return ParseResult(
                text=combined,
                pages=page_count,
                ocr_used=False,
                ocr_lang=None,
                page_texts=page_texts,
                error=message if not combined else message,
            )

        try:
            page_texts, page_count, ocr_lang = _ocr_with_pymupdf(data)
            combined = _normalize_text("\n\n".join(page_texts))
            ocr_used = True
        except Exception as exc:
            errors.append(f"OCR: {exc}")
            return ParseResult(
                text=combined,
                pages=page_count,
                ocr_used=False,
                ocr_lang=None,
                page_texts=page_texts,
                error="; ".join(errors) if errors else str(exc),
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
