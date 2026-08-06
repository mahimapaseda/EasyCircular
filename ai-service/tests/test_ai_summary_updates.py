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
from app.summarize import _invoke_with_retry, _prioritise_entities

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
