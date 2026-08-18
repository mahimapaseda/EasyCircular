import pytest
import json
from unittest.mock import MagicMock, patch
from app.output_schema import validate_llm_output, CircularSummaryOutput, SummarySection
from app.moe_text import (
    extract_issued_date,
    extract_target_audience,
    extract_effective_date,
)
from app.chunking import split_text
from app.summarize import (
    _format_entities_for_prompt,
    _invoke_with_retry,
    _parse_llm_json,
    _prioritise_entities,
    summarize_text,
)

def test_validate_llm_output_defaults():
    # Test that missing fields are gracefully handled and defaulted
    raw = {
        "title": "Test Title",
        "sections": [
            {"heading": "Heading 1", "content": "Content 1"},
            {"heading": "", "content": "Content 2"}
        ]
    }
    validated = validate_llm_output(raw)
    assert validated["title"] == "Test Title"
    assert validated["circularNumber"] is None
    assert validated["issuedDate"] is None
    assert validated["issuedBy"] is None
    assert validated["targetAudience"] is None
    assert validated["effectiveDate"] is None
    assert len(validated["sections"]) == 2
    assert validated["sections"][0]["heading"] == "Heading 1"
    assert validated["sections"][0]["content"] == "Content 1"
    assert validated["sections"][1]["heading"] == "Section" # default heading
    assert validated["sections"][1]["content"] == "Content 2"
    assert validated["actionItems"] == []

def test_validate_llm_output_full():
    raw = {
        "circularNumber": "12/2026",
        "issuedDate": "04.05.2026",
        "issuedBy": "Ministry of Education",
        "targetAudience": "All Principals",
        "effectiveDate": "With immediate effect",
        "title": "Circular Title",
        "sections": [{"heading": "Introduction", "content": "Details"}],
        "actionItems": ["Item 1", "Item 2"]
    }
    validated = validate_llm_output(raw)
    assert validated["circularNumber"] == "12/2026"
    assert validated["issuedDate"] == "04.05.2026"
    assert validated["issuedBy"] == "Ministry of Education"
    assert validated["targetAudience"] == "All Principals"
    assert validated["effectiveDate"] == "With immediate effect"
    assert validated["title"] == "Circular Title"
    assert validated["sections"] == [{"heading": "Introduction", "content": "Details"}]
    assert validated["actionItems"] == ["Item 1", "Item 2"]


def test_validate_llm_output_drops_ner_entity_dicts():
    raw = {
        "title": "Syllabus",
        "actionItems": [
            {
                "text": "අධ්‍යාපන මණ්ඩලය විසින් අනිවාර්ය කර ඇත.",
                "label": "ORG",
                "start": 1523,
                "end": 1533,
            },
            "Register students within one week.",
        ],
    }
    validated = validate_llm_output(raw)
    assert validated["actionItems"] == ["Register students within one week."]
    blob = " ".join(validated["actionItems"])
    assert "start" not in blob
    assert "label" not in blob


def test_validate_llm_output_drops_python_repr_entity_dumps():
    dump = str(
        {
            "text": "අධ්‍යාපන මණ්ඩලය විසින් අනිවාර්ය කර ඇත.",
            "label": "ORG",
            "start": 1523,
            "end": 1533,
        }
    )
    validated = validate_llm_output({"title": "Syllabus", "actionItems": [dump]})
    assert validated["actionItems"] == []
    assert "start" not in str(validated["actionItems"])


def test_validate_llm_output_drops_json_string_entity_dumps():
    dump = json.dumps(
        {
            "text": "Ministry of Education",
            "label": "ORG",
            "start": 10,
            "end": 32,
        }
    )
    validated = validate_llm_output({"title": "Syllabus", "actionItems": [dump]})
    assert validated["actionItems"] == []


def test_parse_llm_json_strips_commentary_and_trailing_commas():
    parsed = _parse_llm_json(
        'Here you go:\n{"title": "T", "circularNumber": "10/2026",}\nThanks'
    )
    assert parsed["title"] == "T"
    assert parsed["circularNumber"] == "10/2026"

    fenced = _parse_llm_json('```json\n{"title": "T", "sections": [],}\n```')
    assert fenced["title"] == "T"
    assert fenced["sections"] == []


def test_parse_llm_json_closes_truncated_object():
    truncated = (
        '{"title": "Circular 32/2025", "sections": [{"heading": "Purpose", '
        '"content": "This circular directs schools'
    )
    parsed = _parse_llm_json(truncated)
    assert parsed["title"] == "Circular 32/2025"
    assert parsed["sections"][0]["heading"] == "Purpose"
    assert "directs schools" in parsed["sections"][0]["content"]


def test_parse_llm_json_escapes_raw_newlines_in_strings():
    raw = '{"title": "Line one\nstill title", "sections": [], "actionItems": []}'
    parsed = _parse_llm_json(raw)
    assert parsed["title"] == "Line one\nstill title"


def test_format_entities_for_prompt_is_text_only():
    prompt = _format_entities_for_prompt(
        [
            {"text": "Ministry of Education", "label": "ORG", "start": 1, "end": 24},
            {"text": "2026.06.03", "label": "DATE", "start": 40, "end": 50},
        ]
    )
    assert "- ORG: Ministry of Education" in prompt
    assert "- DATE: 2026.06.03" in prompt
    assert "start" not in prompt
    assert "end" not in prompt
    assert "{" not in prompt

def test_extract_issued_date():
    text = """
    ED/09/02/01/11/021
    Date: 2026.03.15
    Circular No. 10/2026
    """
    assert extract_issued_date(text) == "2026.03.15"

    text_no_date = "No date here."
    assert extract_issued_date(text_no_date) is None

def test_extract_target_audience():
    text = """
    Circular No. 10/2026
    All Provincial Education Secretaries
    Commissioner General of Examinations
    All Provincial Directors of Education
    Establishing 'Collective Circles'
    """
    audience = extract_target_audience(text)
    assert "All Provincial Education Secretaries" in audience
    assert "Commissioner General of Examinations" in audience
    assert "All Provincial Directors of Education" in audience
    assert not any("Establishing" in a for a in audience)

def test_extract_effective_date():
    text_immediate = "This circular is effective with immediate effect."
    assert extract_effective_date(text_immediate) == "With immediate effect"

    text_wef = "The provisions are active w.e.f. 01 April 2026."
    assert extract_effective_date(text_wef) == "01 April 2026"

    text_impl = "This shall be implemented from 15 March 2026."
    assert extract_effective_date(text_impl) == "15 March 2026"

def test_chunking_preamble_injection():
    text = "Circular No. 10/2026\nEstablishing 'Collective Circles'\nThis is paragraph one.\n\nThis is paragraph two."
    # With a small chunk size to force splitting
    chunks = split_text(text, chunk_size=50, overlap=10, inject_preamble=True)
    assert len(chunks) > 0
    for chunk in chunks:
        assert "[DOCUMENT CONTEXT]" in chunk
        assert "Circular Number: 10/2026" in chunk
        assert "Subject: Establishing 'Collective Circles'" in chunk
        assert "[END CONTEXT]" in chunk


def test_prioritise_entities():
    entities = [
        {"text": "Mr. Perera", "label": "PERSON"},
        {"text": "15 March 2026", "label": "DATE"},
        {"text": "Circular No. 10/2026", "label": "LAW"},
        {"text": "Ministry of Education", "label": "ORG"},
    ]
    prioritised = _prioritise_entities(entities)
    # LAW (4) > DATE (3) > ORG (2) > PERSON (1)
    labels = [e["label"] for e in prioritised]
    assert labels == ["LAW", "DATE", "ORG", "PERSON"]

def test_invoke_with_retry_success():
    llm = MagicMock()
    mock_response = MagicMock()
    mock_response.content = "Success"
    llm.invoke.return_value = mock_response

    res = _invoke_with_retry(llm, [], max_attempts=2)
    assert res.content == "Success"
    assert llm.invoke.call_count == 1

def test_invoke_with_retry_failure_then_success():
    llm = MagicMock()
    mock_response = MagicMock()
    mock_response.content = "Success"
    
    # 1st call raises rate limit exception, 2nd call succeeds
    llm.invoke.side_effect = [Exception("Rate limit 429"), mock_response]

    with patch("time.sleep") as mock_sleep:
        res = _invoke_with_retry(llm, [], max_attempts=2)
        assert res.content == "Success"
        assert llm.invoke.call_count == 2
        mock_sleep.assert_called_once_with(1)

def test_invoke_with_retry_permanent_failure():
    llm = MagicMock()
    llm.invoke.side_effect = Exception("Permanent 500 error")

    with pytest.raises(Exception, match="Permanent 500 error"):
        _invoke_with_retry(llm, [], max_attempts=2)


@patch("app.summarize.llm_is_configured", return_value=True)
@patch("app.summarize.llm_summarize")
def test_empty_action_items_refilled_from_source(mock_llm, _configured):
    mock_llm.return_value = (
        {
            "title": "Vesak Week",
            "circularNumber": "15/2026",
            "sections": [
                {
                    "heading": "Purpose",
                    "content": "Vesak Week from 26.05.2026 to 02.06.2026.",
                }
            ],
            "actionItems": [
                {
                    "text": "Ministry of Education",
                    "label": "ORG",
                    "start": 1,
                    "end": 24,
                }
            ],
            "rawMarkdown": "",
            "mode": "llm",
            "language": "en",
        },
        12,
        1,
    )
    source = (
        "Circular No. 15/2026\n"
        "All principals must implement Vesak Week from 26.05.2026 to 02.06.2026 "
        "and submit reports after the programme."
    )
    result = summarize_text(source, [], filename="15-2026-En.pdf")
    items = result["summary"]["actionItems"]
    assert items
    blob = " ".join(items)
    assert "start" not in blob
    assert "'label'" not in blob
    assert '"label"' not in blob

