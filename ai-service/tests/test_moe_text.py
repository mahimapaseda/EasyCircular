from pathlib import Path

from app.moe_text import (
    build_summary_title,
    extract_circular_number,
    extract_subject,
    is_valid_date_text,
)
from app.ner import extract_entities
from app.pdf_parser import parse_pdf_bytes
from app.summarize import fallback_summarize

SAMPLE_10_2026 = """
ED/09/02/01/11/021 2026.03.
Circular No.- 10/2026
All Provincial Education Secretaries
Commissioner General of Examinations
All Provincial Directors of Education
Establishing 'Collective Circles' to eradicate all types of toxic drugs, alcohol and
tobacco-related products from Educational Institutions under the state policy of
creating a 'Drug-free Country with a Joyful Tomorrow'.
The provisions of this circular should be implemented in all schools with immediate effect.
School principals must submit compliance reports by 15 March 2026.
Refer to Circular No. 35/2023 and Section 03.
"""

SAMPLE_44_2006 = """
ED/02/29/02/02/36 04 .05.2026
Circular No. 2006/44 (i)
All Provincial Directors of Education
All Zonal Directors of Education
Providing a Financial Incentive for Principals and Teachers serving in difficult schools
The Circular No. 2006/44 dated 27.11.2006 issued in relation to the above matter is amended as follows.
Principals and teachers in difficult schools shall receive the revised allowance from 01 April 2026.
"""


def test_extract_circular_number_from_text():
    assert extract_circular_number(SAMPLE_10_2026) == "10/2026"
    assert extract_circular_number(SAMPLE_44_2006) in {"2006/44", "2006/44(i)"}


def test_extract_circular_number_from_filename():
    assert extract_circular_number("", "10-2026-En.pdf") == "10/2026"
    assert extract_circular_number("", "44-2006i-En-1.pdf") == "44/2006"


def test_extract_subject_skips_recipients():
    subject = extract_subject(SAMPLE_10_2026)
    assert subject is not None
    assert "Collective Circles" in subject
    assert "Provincial Education Secretaries" not in subject


def test_extract_subject_skips_pirivena_role_recipients():
    text = """
Circular No.: 26/2026
All Provincial Secretaries of Education
All Provincial Directors of Education
All Zonal Directors of Education
Kruthyadhikari/Parivenadhipathi of all the Pirivenas in the island
Heads of Buddhist Seelamaatha Educational Institutions in the island
Heads of the Pirivena Bhikku Training Institutions
It is mandatory to consider the certificate awarded by this Ministry for trainees who have
successfully completed the ten-day teacher training programme for new teachers
implemented by the Seethawakapura Pirivena Teacher Training Institution.
"""
    subject = extract_subject(text)
    assert subject is not None
    assert "mandatory to consider the certificate" in subject.lower()
    assert "Kruthyadhikari" not in subject


def test_extract_target_audience_keeps_blank_separated_recipients():
    from app.moe_text import extract_target_audience

    text = """
Circular No.: 26/2026

All Provincial Secretaries of Education

All Provincial Directors of Education

All Zonal Directors of Education

Kruthyadhikari/Parivenadhipathi of all the Pirivenas in the island
Heads of the Pirivena Bhikku Training Institutions

It is mandatory to consider the certificate awarded by this Ministry.
"""
    audience = extract_target_audience(text)
    assert "All Provincial Secretaries of Education" in audience
    assert "All Provincial Directors of Education" in audience
    assert "All Zonal Directors of Education" in audience
    assert any("Kruthyadhikari" in item for item in audience)
    assert any("Pirivena Bhikku" in item for item in audience)
    assert not any("mandatory" in item.lower() for item in audience)


def test_build_summary_title_uses_subject():
    title = build_summary_title(SAMPLE_10_2026)
    assert "10/2026" in title
    assert "Collective Circles" in title


def test_date_filter_rejects_ed_reference_and_phone_noise():
    assert not is_valid_date_text("09/02/01")
    assert not is_valid_date_text("694112785162")
    assert is_valid_date_text("27.11.2006")
    assert is_valid_date_text("15 March 2026")


def test_ner_extracts_circular_and_ed_reference():
    entities = extract_entities(SAMPLE_10_2026)
    texts = {e["text"] for e in entities}
    date_texts = [e["text"] for e in entities if e["label"] == "DATE"]
    assert any("Circular No" in text and "10/2026" in text for text in texts)
    assert any(text.startswith("ED/") for text in texts)
    assert "09/02/01" not in date_texts


def test_fallback_summary_uses_subject_not_recipients():
    entities = extract_entities(SAMPLE_10_2026)
    summary = fallback_summarize(SAMPLE_10_2026, entities)
    purpose = summary["sections"][0]["content"]
    assert "Collective Circles" in purpose
    assert "Provincial Education Secretaries" not in purpose
    assert summary["title"].startswith("MOE Circular 10/2026")


def test_sample_pdf_pipeline_if_present():
    sample = Path(__file__).resolve().parents[2] / "sample circulars" / "10-2026-En.pdf"
    if not sample.exists():
        return

    result = parse_pdf_bytes(sample.read_bytes())
    assert result.text
    entities = extract_entities(result.text)
    summary = fallback_summarize(result.text, entities)
    purpose = summary["sections"][0]["content"]
    assert "Collective Circles" in purpose or "Drug-free Country" in purpose
    assert len(entities) > 0
