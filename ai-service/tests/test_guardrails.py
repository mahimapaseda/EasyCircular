from app.guardrails import verify_summary_dates
from app.pdf_parser import parse_pdf_bytes
from app.ner import extract_entities
from pathlib import Path


def test_guardrails_accepts_equivalent_date_formats():
    pdf = Path(__file__).resolve().parents[2] / "sample circulars" / "15-2026-En.pdf"
    if not pdf.exists():
        return

    text = parse_pdf_bytes(pdf.read_bytes()).text
    entities = extract_entities(text)
    llm_like_summary = {
        "title": "Circular No. 15/2026: Vesak Week",
        "sections": [
            {
                "heading": "Purpose",
                "content": (
                    "Vesak Week from 26.05.2026 to 02.06.2026 with events on "
                    "27.05.2026, 29.05.2026, 30.05.2026, 31.05.2026 and 01.06.2026."
                ),
            },
            {"heading": "Deadlines", "content": "Vesak Day falls on 30th of May 2026."},
        ],
        "actionItems": [],
        "rawMarkdown": "",
    }

    warnings = verify_summary_dates(text, entities, llm_like_summary)
    assert warnings == []
