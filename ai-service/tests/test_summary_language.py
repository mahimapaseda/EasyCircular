import json
from unittest.mock import MagicMock, patch

from app.summarize import fallback_summarize, summarize_text, translate_summary
from app.summary_language import (
    apply_glossary,
    detect_output_language,
    leftover_english_dominates,
    map_section_heading,
    summary_looks_degenerate,
    summary_matches_output_language,
    text_looks_degenerate,
    translation_quality_error,
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


def test_apply_glossary_and_heading_map_english_to_sinhala():
    assert "අධ්‍යාපන" in apply_glossary("Ministry of Education", "en", "si")
    assert map_section_heading("Purpose", "si") == "අරමුණ"
    assert map_section_heading("අරමුණ", "en") == "Purpose"


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
    mock_llm.assert_not_called()
    assert result["summary"]["language"] == "si"
    assert result["processingMeta"]["mode"] == "fallback"
    headings = [section["heading"] for section in result["summary"]["sections"]]
    assert "අරමුණ" in headings
    blob = " ".join(section["content"] for section in result["summary"]["sections"])
    assert "විෂය නිර්දේශය" in blob or "අධ්‍යාපන" in blob


@patch("app.summarize.llm_is_configured", return_value=True)
@patch("app.summarize.get_chat_model")
@patch("app.summarize._invoke_with_retry")
def test_translate_summary_keeps_numbers_and_dates(mock_invoke, _model, _configured):
    def fake_invoke(_llm, messages, max_attempts=1):
        user = messages[-1].content
        mapping = [
            ("සාමාන්‍ය පෙළ විභාග විෂය නිර්දේශය", "Ordinary Level Examination syllabus"),
            ("අධ්‍යාපන අමාත්‍යාංශය", "Ministry of Education"),
            ("විදුහල්පතිවරුන්", "All principals"),
            ("විෂය නිර්දේශය දැනුම් දෙයි", "Issues the O/L syllabus."),
            ("ශිෂ්‍යයන් ලියාපදිංචි කරන්න", "Register students."),
        ]
        for src, dst in mapping:
            if src in user:
                return MagicMock(content=json.dumps({"text": dst}))
        return MagicMock(content=json.dumps({"text": "translated"}))

    mock_invoke.side_effect = fake_invoke
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


def test_looping_sinhala_is_degenerate():
    looping = "නොී " * 80
    assert text_looks_degenerate(looping)
    phrase = "සීල ප්රව්ව ප්රව්ව ද වින්යා ප්රව්ව සන්මාර නව අධ්ෂකටක්රය "
    assert text_looks_degenerate(phrase * 20)


def test_short_real_sinhala_brief_is_not_degenerate():
    summary = {
        "title": "සාමාන්‍ය පෙළ විභාග විෂය නිර්දේශය",
        "issuedBy": "අධ්‍යාපන අමාත්‍යාංශය",
        "targetAudience": "විදුහල්පතිවරුන්",
        "sections": [{"heading": "අරමුණ", "content": "විෂය නිර්දේශය දැනුම් දෙයි."}],
        "actionItems": ["ශිෂ්‍යයන් ලියාපදිංචි කරන්න."],
    }
    assert summary_matches_output_language(summary, "si")
    assert not summary_looks_degenerate(summary)
    assert translation_quality_error(summary, summary, "si") is None


def test_translation_quality_error_rejects_looping_sinhala():
    source = {
        "title": "Certificate for new Pirivena teachers",
        "issuedBy": "Ministry of Education",
        "targetAudience": "All Provincial Directors",
        "sections": [{"heading": "Purpose", "content": "Consider the ten-day training certificate."}],
        "actionItems": ["Record the certificate in the letter of appointment."],
    }
    looping = {
        "title": "සීල ප්රව්ව ප්රව්ව ද වින්යා",
        "issuedBy": "සභවසය ආරක්ෂය",
        "targetAudience": "සිංහල ප්රව්ව ආරක්ෂය මර්යා",
        "sections": [
            {
                "heading": "සීල ප්රව්ව",
                "content": "නොී " * 80,
            }
        ],
        "actionItems": ["නොී " * 20],
    }
    error = translation_quality_error(looping, source, "si")
    assert error is not None
    assert "unreadable" in error.lower()


@patch("app.summarize.mt_is_configured", return_value=True)
@patch("app.summarize.translate_text")
@patch("app.summarize.llm_is_configured", return_value=True)
@patch("app.summarize.get_chat_model")
@patch("app.summarize._invoke_with_retry")
def test_translate_en_to_si_uses_nllb_sentences(
    mock_invoke, _model, _configured, mock_mt, _mt_on
):
    mock_invoke.side_effect = AssertionError("LLM must not write Sinhala")

    def fake_mt(text, source="en", target="si"):
        mapping = {
            "Consideration of Certificate Awarded by the Ministry for Trainees as New Teachers": (
                "අමාත්‍යාංශය විසින් පුහුණුලාභීන්ට ප්‍රදානය කරන සහතිකය නව ගුරුවරුන් ලෙස සලකා බැලීම"
            ),
            "Ministry of Education, Higher Education and Vocational Education": (
                "අධ්‍යාපන, උසස් අධ්‍යාපන සහ වෘත්තීය අධ්‍යාපන අමාත්‍යාංශය"
            ),
            "All Provincial Secretaries of Education, All Provincial Directors of Education": (
                "සියලු පළාත් අධ්‍යාපන ලේකම්වරුන්, සියලු පළාත් අධ්‍යාපන අධ්‍යක්ෂවරුන්"
            ),
            "It is mandatory to consider the certificate awarded on 03.06.2026.": (
                "03.06.2026 දින ප්‍රදානය කළ සහතිකය සලකා බැලීම අනිවාර්ය වේ."
            ),
            "All Provincial Secretaries of Education must consider the certificate.": (
                "සියලු පළාත් අධ්‍යාපන ලේකම්වරුන් සහතිකය සලකා බැලිය යුතුය."
            ),
        }
        if text in mapping:
            return mapping[text]
        return "පුහුණු සහතිකය සේවා තහවුරු කිරීමේදී සලකා බලන්න."

    mock_mt.side_effect = fake_mt
    translated = translate_summary(
        {
            "title": "Consideration of Certificate Awarded by the Ministry for Trainees as New Teachers",
            "circularNumber": "26/2026",
            "issuedDate": "03.06.2026",
            "issuedBy": "Ministry of Education, Higher Education and Vocational Education",
            "targetAudience": "All Provincial Secretaries of Education, All Provincial Directors of Education",
            "effectiveDate": "With immediate effect",
            "sections": [
                {
                    "heading": "Purpose",
                    "content": "It is mandatory to consider the certificate awarded on 03.06.2026.",
                }
            ],
            "actionItems": [
                "All Provincial Secretaries of Education must consider the certificate."
            ],
            "language": "en",
            "mode": "llm",
        },
        "si",
    )
    mock_invoke.assert_not_called()
    assert mock_mt.called
    assert translated["language"] == "si"
    assert translated["mode"] == "mt"
    assert translated["circularNumber"] == "26/2026"
    assert translated["issuedDate"] == "03.06.2026"
    assert "Awarded" not in (translated.get("title") or "")
    assert "සහතිකය" in (translated.get("title") or "")
    assert leftover_english_dominates(translated["title"], "si") is False
    assert "03.06.2026" in translated["sections"][0]["content"]
    assert translated["sections"][0]["heading"] == "අරමුණ"
    assert "ක්ෂණිකව" in (translated.get("effectiveDate") or "")
    assert translation_quality_error(translated, translated, "si") is None


@patch("app.summarize.mt_is_configured", return_value=False)
@patch("app.summarize.translate_text")
@patch("app.summarize._invoke_with_retry")
def test_translate_si_without_nllb_fails_closed(mock_invoke, mock_mt, _mt_off):
    mock_invoke.side_effect = AssertionError("LLM must not write Sinhala")
    mock_mt.side_effect = AssertionError("NLLB must not run when extra is missing")
    try:
        translate_summary(
            {
                "title": "Certificate for new teachers",
                "circularNumber": "26/2026",
                "issuedBy": "Ministry of Education",
                "sections": [{"heading": "Purpose", "content": "Consider the training certificate."}],
                "actionItems": ["Record the certificate."],
                "language": "en",
                "mode": "llm",
            },
            "si",
        )
    except RuntimeError as exc:
        assert "NLLB" in str(exc)
    else:
        raise AssertionError("expected RuntimeError when NLLB extra is missing")
    mock_mt.assert_not_called()
    mock_invoke.assert_not_called()


MIXED_SCRIPT_GARBAGE = (
    "඀ි ඿හ෨෼ේ 10-දා ප්‍රවෘසී ශේෂිය "
    r"\frac{\text{தினை}} "
    "ข່າ໊ ඕ඿ අධ்யා ץתיכ ཞಥ ಕಮಿ"
)


def test_mixed_script_moe_garbage_is_rejected():
    assert text_looks_degenerate(MIXED_SCRIPT_GARBAGE)
    garbled = {
        "title": MIXED_SCRIPT_GARBAGE,
        "issuedBy": "කමි, ඡහ තේ ෪7෼ අධ්‍රාපන",
        "targetAudience": "ඐි ඿ හ෼ අධ්‍යාපන சாகிப்து",
        "sections": [
            {"heading": "ප්‍රධාන අවශ්‍යතා", "content": MIXED_SCRIPT_GARBAGE},
        ],
        "actionItems": ["must consider the ඕි඿හ෺ේ awarded by this Ministry"],
        "language": "si",
    }
    source = {
        "title": "Certificate for new Pirivena teachers",
        "issuedBy": "Ministry of Education",
        "targetAudience": "All Provincial Directors",
        "sections": [{"heading": "Purpose", "content": "Consider the ten-day training."}],
        "actionItems": ["Record the certificate."],
    }
    error = translation_quality_error(garbled, source, "si")
    assert error is not None
    assert "unreadable" in error.lower()


@patch("app.summarize.mt_is_configured", return_value=True)
@patch("app.summarize.translate_text")
@patch("app.summarize.llm_is_configured", return_value=True)
@patch("app.summarize.get_chat_model")
@patch("app.summarize._invoke_with_retry")
def test_sinhala_tab_uses_source_text_not_llm(
    mock_invoke, _model, _configured, mock_mt, _mt_on
):
    mock_invoke.side_effect = AssertionError("LLM must not write Sinhala")
    mock_mt.side_effect = AssertionError("NLLB must not run when source is Sinhala")
    english_brief = {
        "title": "Certificate for new teachers",
        "circularNumber": "26/2026",
        "issuedDate": "2026.06.03",
        "issuedBy": "Ministry of Education",
        "targetAudience": "All Provincial Directors of Education",
        "effectiveDate": "With immediate effect",
        "sections": [
            {"heading": "Purpose", "content": "This circular issues the O/L syllabus."}
        ],
        "actionItems": ["Register students."],
        "language": "en",
        "mode": "llm",
    }
    translated = translate_summary(
        english_brief,
        "si",
        source_text=SINHALA_CIRCULAR,
        filename="26-2026-Si.pdf",
    )
    mock_invoke.assert_not_called()
    mock_mt.assert_not_called()
    assert translated["language"] == "si"
    headings = [section["heading"] for section in translated["sections"]]
    assert "අරමුණ" in headings
    blob = " ".join(
        [translated["title"]]
        + [section["content"] for section in translated["sections"]]
    )
    assert "සාමාන්‍ය පෙළ" in blob or "අධ්‍යාපන" in blob
    assert not text_looks_degenerate(blob)
    assert r"\frac" not in blob
    assert translated.get("circularNumber") in ("26/2026", "26 / 2026") or (
        translated.get("circularNumber") or ""
    ).replace(" ", "") == "26/2026"


def test_glossary_word_swap_is_rejected():
    salad = {
        "title": "Consideration of සහතිකය Awarded by the Ministry for Trainees as නව ගුරුවරුන්",
        "issuedBy": "අධ්‍යාපන, උසස් අධ්‍යාපන සහ වෘත්තීය අධ්‍යාපන අමාත්‍යාංශය",
        "targetAudience": "සියලු පළාත් අධ්‍යාපන ලේකම්වරුන්, All Provincial Directors of Education",
        "sections": [
            {
                "heading": "අරමුණ",
                "content": (
                    "It is mandatory to consider the සහතිකය awarded by this Ministry for trainees "
                    "who have successfully completed the ten-day ගුරු පුහුණුව programme as නව ගුරුවරුන්."
                ),
            }
        ],
        "actionItems": [
            "All schools must ensure that the සහතිකය is mentioned in the පත්වීම් ලිපිය."
        ],
        "language": "si",
    }
    source = {
        "title": "Consideration of Certificate Awarded by the Ministry for Trainees as New Teachers",
        "issuedBy": "Ministry of Education",
        "targetAudience": "All Provincial Directors",
        "sections": [{"heading": "Purpose", "content": "Consider the ten-day training."}],
        "actionItems": ["Record the certificate."],
    }
    assert leftover_english_dominates(salad["title"], "si")
    error = translation_quality_error(salad, source, "si")
    assert error is not None
    assert "unreadable" in error.lower()
