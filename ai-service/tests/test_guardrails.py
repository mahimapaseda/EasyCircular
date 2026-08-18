from unittest.mock import patch

import pytest
from app.guardrails import verify_summary_dates
from app.pdf_parser import parse_pdf_bytes
from app.ner import extract_entities
from app.summarize import summarize_text
from pathlib import Path


def test_guardrails_accepts_equivalent_date_formats():
    pdf = Path(__file__).resolve().parents[2] / "sample circulars" / "15-2026-En.pdf"
    if not pdf.exists():
        pytest.skip(f"Sample PDF missing: {pdf}")

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


def test_verify_summary_dates_flags_invented_date():
    source = "Circular No. 15/2026\nVesak Week from 26.05.2026 to 02.06.2026."
    summary = {
        "title": "Vesak",
        "sections": [{"heading": "Purpose", "content": "Due 01.01.2099."}],
        "actionItems": [],
        "rawMarkdown": "",
    }
    warnings = verify_summary_dates(source, [], summary)
    assert warnings
    assert any("2099" in warning for warning in warnings)


@patch("app.summarize.llm_is_configured", return_value=True)
@patch("app.summarize.llm_summarize")
def test_invented_dates_discard_llm_summary(mock_llm, _configured):
    source = (
        "Circular No. 15/2026\n"
        "All principals must implement Vesak Week from 26.05.2026 to 02.06.2026."
    )
    mock_llm.return_value = (
        {
            "title": "Vesak Week",
            "circularNumber": "15/2026",
            "sections": [
                {"heading": "Purpose", "content": "Submit reports by 01.01.2099."},
            ],
            "actionItems": ["File by 01.01.2099."],
            "rawMarkdown": "",
            "mode": "llm",
        },
        12,
        1,
    )
    result = summarize_text(source, [], filename="15-2026.pdf")
    assert result["processingMeta"]["mode"] == "fallback"
    assert "invented-dates" in (result["processingMeta"].get("llmError") or "")
    blob = " ".join(
        section.get("content", "")
        for section in (result["summary"] or {}).get("sections") or []
    )
    assert "2099" not in blob
