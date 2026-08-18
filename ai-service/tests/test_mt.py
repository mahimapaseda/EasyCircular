from app.mt import split_mt_sentences


def test_split_mt_sentences_keeps_short_text():
    text = "Consider the certificate awarded on 03.06.2026."
    assert split_mt_sentences(text) == [text]


def test_split_mt_sentences_breaks_long_text():
    sentence = (
        "The institution conducts a ten-day residential teacher training workshop for new staff. "
    )
    text = sentence * 8
    parts = split_mt_sentences(text)
    assert len(parts) >= 2
    assert all(len(part) <= 400 for part in parts)
    assert "workshop" in parts[0]
