from pathlib import Path

import pytest

from app.guardrails import detect_topic_bleed
from app.moe_text import extract_as_at_date, looks_like_staff_register
from app.summarize import (
    _load_fewshot_examples,
    _select_fewshot_examples,
    fallback_summarize,
)

SAMPLE_23_ANNEXURE = """
Annexure 02
Register of the officers who served for more than 06 years in Education, Higher Education
and Vocational Education / National Schools/Institutions under the Central Government - 2027
Please make sure that the details of all the officers who have completed the period of service
stated under No. 04 (4.1.1, 4.1.2, 4.1.3) of the circular are included herein (As at 31.12.2026)
Register of the officers who have served for more than 12 years in the institutions under a
Provincial Council - 2027
Include names in descending order by longest service.
Complete one form per SLEAS grade.
"""

BLEED_SUMMARY = {
    "circularNumber": "23/2026",
    "title": "MOE Circular 23/2026: Staff return of officers with 6+ years of service",
    "sections": [
        {
            "heading": "Purpose",
            "content": (
                "Directs educational institutions to establish Collective Circles to eradicate "
                "toxic drugs under the Drug-free country policy, building on School Friendly Forums."
            ),
        },
        {
            "heading": "Key requirements",
            "content": "Follow Circular No. 10/2026 and Circular No. 35/2023.",
        },
    ],
    "actionItems": [
        "Establish Collective Circles in each educational institution as directed.",
    ],
    "rawMarkdown": "",
}


def test_annexure_excerpt_selects_23_2026_not_10_2026():
    selected = _select_fewshot_examples(
        _load_fewshot_examples(),
        limit=1,
        source_text=SAMPLE_23_ANNEXURE,
        filename="23-2026-En.pdf",
    )
    assert selected
    assert selected[0]["id"] == "23-2026"
    assert all(ex["id"] != "10-2026" for ex in selected)

    overlap_only = _select_fewshot_examples(
        _load_fewshot_examples(),
        limit=2,
        source_text=SAMPLE_23_ANNEXURE,
        filename=None,
    )
    assert overlap_only
    assert overlap_only[0]["id"] == "23-2026"
    assert all(ex["id"] != "10-2026" for ex in overlap_only)


def test_known_circular_never_injects_absent_fewshot_number():
    selected = _select_fewshot_examples(
        _load_fewshot_examples(),
        limit=5,
        source_text="Circular No. 23/2026\n" + SAMPLE_23_ANNEXURE,
        filename=None,
    )
    ids = {ex["id"] for ex in selected}
    assert "23-2026" in ids
    assert "10-2026" not in ids
    assert "15-2026" not in ids


def test_topic_bleed_flags_collective_circles_on_staff_register():
    warnings = detect_topic_bleed(
        SAMPLE_23_ANNEXURE,
        BLEED_SUMMARY,
        filename="23-2026-En.pdf",
        fewshot_examples=_load_fewshot_examples(),
        document_circular="23/2026",
    )
    blob = " ".join(warnings).lower()
    assert warnings
    assert "collective circles" in blob or "10/2026" in blob


def test_faithful_register_summary_is_not_bleed():
    summary = {
        "circularNumber": "23/2026",
        "title": "MOE Circular 23/2026: Service registers for SLEAS officers",
        "sections": [
            {
                "heading": "Purpose",
                "content": (
                    "Requires institutions to complete annexure registers of officers "
                    "by length of service as at 31.12.2026."
                ),
            }
        ],
        "actionItems": [
            "Complete Annexure 02 registers with data as at 31.12.2026.",
        ],
        "rawMarkdown": "",
    }
    warnings = detect_topic_bleed(
        SAMPLE_23_ANNEXURE,
        summary,
        filename="23-2026-En.pdf",
        fewshot_examples=_load_fewshot_examples(),
        document_circular="23/2026",
    )
    assert warnings == []


def test_fallback_register_mentions_cutoff_not_drugs():
    assert looks_like_staff_register(SAMPLE_23_ANNEXURE)
    assert extract_as_at_date(SAMPLE_23_ANNEXURE) == "31.12.2026"

    summary = fallback_summarize(SAMPLE_23_ANNEXURE, [], filename="23-2026-En.pdf")
    blob = " ".join(
        [
            summary.get("title") or "",
            *(section.get("content") or "" for section in summary.get("sections") or []),
            *(summary.get("actionItems") or []),
        ]
    ).lower()
    assert "register" in blob or "annexure" in blob
    assert "31.12.2026" in blob
    assert "drug" not in blob
    assert "collective circles" not in blob
    assert summary.get("effectiveDate") == "As at 31.12.2026"


def test_sample_pdf_23_2026_if_present():
    sample = Path(__file__).resolve().parents[2] / "sample circulars" / "23-2026-En.pdf"
    if not sample.exists():
        pytest.skip(f"Sample PDF missing: {sample}")

    from app.pdf_parser import parse_pdf_bytes

    text = parse_pdf_bytes(sample.read_bytes()).text
    selected = _select_fewshot_examples(
        _load_fewshot_examples(),
        source_text=text,
        filename=sample.name,
    )
    assert selected
    assert selected[0]["id"] == "23-2026"

    summary = fallback_summarize(text, [], filename=sample.name)
    purpose = next(
        (
            section["content"]
            for section in summary["sections"]
            if section.get("heading") == "Purpose"
        ),
        "",
    ).lower()
    assert "collective circles" not in purpose
    assert "drug" not in purpose
    assert "register" in purpose or "annexure" in purpose or "31.12.2026" in purpose
