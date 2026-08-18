import io

from app.ocr_languages import (
    filename_script_hint,
    infer_ocr_languages,
    missing_ocr_languages,
)
from app.pdf_parser import (
    _is_insufficient_text,
    _missing_expected_script,
    _ocr_failure_message,
)


def test_watermark_only_text_is_insufficient():
    assert _is_insufficient_text("CamScanner")
    assert _is_insufficient_text("  scanned by Adobe Scan  ")
    assert _is_insufficient_text("")


def test_real_circular_text_is_sufficient():
    body = (
        "Circular No. 10/2026\n"
        "Ministry of Education\n"
        "Establishing Collective Circles in all government schools with immediate effect.\n"
    )
    assert not _is_insufficient_text(body)


def test_filename_script_hint_from_moe_names():
    assert filename_script_hint("29-2026-Si.pdf") == "sin"
    assert filename_script_hint("1787031813543-55b756d592b0b966-29-2026-Si.pdf") == "sin"
    assert filename_script_hint("12-2024-Ta.pdf") == "tam"
    assert filename_script_hint("10-2026-En.pdf") == "eng"
    assert filename_script_hint("44-2006i-En-1.pdf") == "eng"
    assert filename_script_hint(None) is None


def test_infer_ocr_languages_prefers_filename_script():
    assert infer_ocr_languages("29-2026-Si.pdf") == ["sin", "eng"]
    assert infer_ocr_languages("12-2024-Ta.pdf") == ["tam", "eng"]
    assert infer_ocr_languages("10-2026-En.pdf") == ["eng"]


def test_missing_sinhala_pack_is_reported():
    assert missing_ocr_languages("29-2026-Si.pdf", "eng") == ["sin"]
    assert missing_ocr_languages("29-2026-Si.pdf", "sin+eng") == []


def test_ocr_failure_mentions_missing_sinhala_pack():
    message = _ocr_failure_message(filename="29-2026-Si.pdf", ocr_lang="eng", errors=[])
    assert "Sinhala" in message
    assert "install-tesseract-languages.ps1" in message


def test_sinhala_filename_rejects_latin_ocr_garbage():
    garbage = "aeiou " * 40
    assert _missing_expected_script(garbage, "29-2026-Si.pdf")
    sinhala = "අධ්‍යාපන අමාත්‍යාංශය චක්‍රලේඛය අංක 29/2026 පාසල් "
    assert not _missing_expected_script(sinhala, "29-2026-Si.pdf")
    assert not _missing_expected_script(garbage, "10-2026-En.pdf")


def test_camscanner_image_pdf_recovers_english_text():
    import fitz
    import pytest
    from PIL import Image, ImageDraw, ImageFont

    from app.pdf_parser import _is_tesseract_available, parse_pdf_bytes

    if not _is_tesseract_available():
        pytest.skip("Tesseract is not installed")

    image = Image.new("RGB", (1600, 2000), "white")
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 56)
    except OSError:
        font = ImageFont.load_default()
    for index, line in enumerate(
        [
            "Circular No. 10/2026",
            "Ministry of Education",
            "This scanned page must be read by OCR",
            "instead of the CamScanner watermark.",
        ]
    ):
        draw.text((80, 240 + index * 90), line, fill="black", font=font)
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=95)

    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((72, 36), "CamScanner")
    page.insert_image(fitz.Rect(20, 50, 575, 820), stream=buf.getvalue())
    pdf_bytes = doc.tobytes()
    doc.close()

    result = parse_pdf_bytes(pdf_bytes, filename="10-2026-En.pdf")
    assert result.error is None, result.error
    assert result.ocr_used
    assert "10/2026" in result.text or "Circular" in result.text
