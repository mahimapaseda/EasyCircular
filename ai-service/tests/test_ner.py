from app.ner import extract_entities


SAMPLE = """
Circular No. 12/2025
Ministry of Education
Deadline: 15/03/2026
All principals must submit reports by 15 March 2026.
Refer to Education Ordinance Section 45.
Contact Mr. Perera at the Department of Examinations.
"""


def test_extracts_dates():
    entities = extract_entities(SAMPLE)
    labels = {e["label"] for e in entities}
    texts = {e["text"] for e in entities}
    assert "DATE" in labels
    assert any("15/03/2026" in t or "15 March 2026" in t for t in texts)


def test_extracts_circular_reference():
    entities = extract_entities(SAMPLE)
    assert any("Circular No. 12/2025" in e["text"] for e in entities)


def test_extracts_legal_reference():
    entities = extract_entities(SAMPLE)
    assert any("Education Ordinance" in e["text"] for e in entities)
    assert any("Section 45" in e["text"] for e in entities)


def test_empty_text_returns_empty():
    assert extract_entities("") == []
    assert extract_entities("   ") == []
