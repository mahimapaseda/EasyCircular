from app.ner import _looks_like_ocr_noise, extract_entities


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


# Garbage strings observed on processed OCR circulars (23-2026-En.pdf)
OCR_GARBAGE = [
    "k s s o e -",
    "N g n i d n e t t a s l o o h c s W 3 t S h P l e o e e",
    "s p o o h e o p m f e r r o v s k p",
    "S d n a",
    "u l i",
    "NgnidnettasloohcsW3tShPleoee",
    "spqqhkpfrrvskp",
]


def test_ocr_noise_detector_flags_garbage():
    for garbage in OCR_GARBAGE:
        assert _looks_like_ocr_noise(garbage), garbage


def test_ocr_noise_detector_keeps_real_names():
    for real in [
        "Ministry of Education",
        "Department of Examinations",
        "Mr. Perera",
        "Provincial Council",
        "Zonal Office",
        "National Institute of Education",
    ]:
        assert not _looks_like_ocr_noise(real), real


def test_ocr_garbage_filtered_from_entities():
    text = SAMPLE + "\nAttention: k s s o e - and s p o o h e o p m f e r r o v s k p\n"
    entities = extract_entities(text)
    for entity in entities:
        if entity["label"] in ("PERSON", "ORG", "OTHER"):
            assert not _looks_like_ocr_noise(entity["text"]), entity
