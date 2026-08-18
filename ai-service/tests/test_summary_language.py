import json
from unittest.mock import MagicMock, patch

from app.summarize import fallback_summarize, summarize_text, translate_summary
from app.summary_language import (
    detect_output_language,
    summary_matches_output_language,
)

SINHALA_CIRCULAR = (
    "චක්‍රලේඛ අංක 26/2026\n"
    "අධ්‍යාපන අමාත්‍යාංශය\n"
    "නිකුත් කළ දිනය: 2026.06.03\n"
    "පළාත් අධ්‍යාපන ලේකම්වරුන්, කලාප අධ්‍යාපන අධ්‍යක්ෂවරුන් සහ විදුහල්පතිවරුන් වෙත.\n"
    "සාමාන්‍ය පෙළ විභාගය සඳහා වූ විෂය නිර්දේශය මෙයින් දැනුම් දෙනු ලැබේ. "
    "සියලුම පාසල් විදුහල්පතිවරුන් ශිෂ්‍ය ලියාපදිංචිය සම්පූර්ණ කළ යුතුය. "
    "ප්‍රතිඵල සතියක් ඇතුළත ඉදිරිපත් කරන්න.\n"
) * 3


def test_detect_output_language_from_moe_filename():
    assert detect_output_language("hello latin only", "26-2026-Si.pdf") == "si"
    assert detect_output_language("hello latin only", "10-2026-En.pdf") == "en"
    assert detect_output_language("hello latin only", "12-2024-Ta.pdf") == "ta"


def test_detect_output_language_from_script_without_filename():
    assert detect_output_language(SINHALA_CIRCULAR, None) == "si"
    assert detect_output_language("Ministry of Education circular text " * 8, None) == "en"


def test_fallback_sinhala_uses_sinhala_headings():
    summary = fallback_summarize(SINHALA_CIRCULAR, [], filename="26-2026-Si.pdf")
    assert summary["language"] == "si"
    headings = [section["heading"] for section in summary["sections"]]
    assert "අරමුණ" in headings
    assert summary_matches_output_language(summary, "si")


def test_fallback_english_keeps_purpose_heading():
    text = (
        "Circular No. 10/2026\n"
        "Ministry of Education\n"
        "All Provincial Education Secretaries\n"
        "This circular establishes Collective Circles in every school. "
        "Principals must implement the programme with immediate effect.\n"
    ) * 4
    summary = fallback_summarize(text, [], filename="10-2026-En.pdf")
    assert summary["language"] == "en"
    headings = [section["heading"] for section in summary["sections"]]
    assert "Purpose" in headings


def test_english_llm_brief_is_wrong_language_for_sinhala_source():
    english_summary = {
        "title": "Syllabus for the Ordinary Level Examination",
        "issuedBy": "Ministry of Education",
        "targetAudience": "All Principals",
        "sections": [
            {"heading": "Purpose", "content": "This circular issues the O/L syllabus."},
        ],
        "actionItems": ["Register students."],
    }
    assert not summary_matches_output_language(english_summary, "si")
    assert summary_matches_output_language(english_summary, "en")


@patch("app.summarize.llm_is_configured", return_value=True)
@patch("app.summarize.llm_summarize")
def test_english_llm_output_discarded_for_sinhala_filename(mock_llm, _configured):
    mock_llm.return_value = (
        {
            "title": "Syllabus for the Ordinary Level Examination",
            "circularNumber": "26/2026",
            "issuedBy": "Ministry of Education",
            "sections": [
                {"heading": "Purpose", "content": "This circular issues the O/L syllabus."},
            ],
            "actionItems": ["Register students."],
            "rawMarkdown": "",
            "mode": "llm",
            "language": "si",
        },
        20,
        1,
    )
    result = summarize_text(SINHALA_CIRCULAR, [], filename="26-2026-Si.pdf")
    assert result["summary"]["language"] == "si"
    assert result["processingMeta"]["mode"] == "fallback"
    assert "wrong-language" in (result["processingMeta"].get("llmError") or "")
    headings = [section["heading"] for section in result["summary"]["sections"]]
    assert "අරමුණ" in headings


@patch("app.summarize.llm_is_configured", return_value=True)
@patch("app.summarize.get_chat_model")
@patch("app.summarize._invoke_with_retry")
def test_translate_summary_keeps_numbers_and_dates(mock_invoke, _model, _configured):
    mock_invoke.return_value = MagicMock(
        content=json.dumps(
            {
                "title": "Ordinary Level Examination syllabus",
                "circularNumber": "CHANGED",
                "issuedDate": "wrong",
                "issuedBy": "Ministry of Education",
                "targetAudience": "All principals",
                "effectiveDate": "wrong",
                "sections": [
                    {"heading": "Purpose", "content": "Issues the O/L syllabus."},
                ],
                "actionItems": ["Register students."],
            }
        )
    )
    translated = translate_summary(
        {
            "title": "සාමාන්‍ය පෙළ විභාග විෂය නිර්දේශය",
            "circularNumber": "26/2026",
            "issuedDate": "2026.06.03",
            "issuedBy": "අධ්‍යාපන අමාත්‍යාංශය",
            "targetAudience": "විදුහල්පතිවරුන්",
            "effectiveDate": "ක්ෂණිකව",
            "sections": [{"heading": "අරමුණ", "content": "විෂය නිර්දේශය දැනුම් දෙයි."}],
            "actionItems": ["ශිෂ්‍යයන් ලියාපදිංචි කරන්න."],
            "language": "si",
            "mode": "fallback",
        },
        "en",
    )
    assert translated["circularNumber"] == "26/2026"
    assert translated["issuedDate"] == "2026.06.03"
    assert translated["effectiveDate"] == "ක්ෂණිකව"
    assert translated["language"] == "en"
    assert translated["title"] == "Ordinary Level Examination syllabus"
