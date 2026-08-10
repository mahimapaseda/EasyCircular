import re

from app.config import settings


def _build_preamble(text: str, *, filename: str | None = None) -> str:
    """Build a short document context preamble from the circular header.

    This is prepended to every chunk so that the LLM always knows
    the circular's identity even when processing a middle chunk.
    """
    from app.moe_text import extract_circular_number, extract_subject

    circular_no = extract_circular_number(text, filename)
    subject = extract_subject(text)
    first_lines = text[:300].strip()

    parts: list[str] = ["[DOCUMENT CONTEXT]"]
    if circular_no:
        parts.append(f"Circular Number: {circular_no}")
    if subject:
        parts.append(f"Subject: {subject[:200]}")
    parts.append(f"Opening: {first_lines}")
    parts.append("[END CONTEXT]\n")
    return "\n".join(parts)


def split_text(
    text: str,
    chunk_size: int | None = None,
    overlap: int | None = None,
    *,
    inject_preamble: bool = True,
    filename: str | None = None,
) -> list[str]:
    chunk_size = chunk_size or settings.chunk_size
    overlap = overlap or settings.chunk_overlap

    normalized = text.strip()
    if not normalized:
        return []

    if len(normalized) <= chunk_size:
        return [normalized]

    preamble = _build_preamble(normalized, filename=filename) if inject_preamble else ""
    preamble_len = len(preamble)
    effective_chunk_size = max(chunk_size - preamble_len, chunk_size // 2)

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", normalized) if p.strip()]
    chunks: list[str] = []
    current = ""

    for paragraph in paragraphs:
        candidate = f"{current}\n\n{paragraph}".strip() if current else paragraph
        if len(candidate) <= effective_chunk_size:
            current = candidate
            continue

        if current:
            chunks.append(f"{preamble}{current}" if preamble else current)
            tail = current[-overlap:] if overlap > 0 else ""
            current = f"{tail}\n\n{paragraph}".strip() if tail else paragraph
        else:
            for index in range(0, len(paragraph), effective_chunk_size - overlap):
                chunk_text = paragraph[index : index + effective_chunk_size]
                chunks.append(f"{preamble}{chunk_text}" if preamble else chunk_text)

    if current:
        chunks.append(f"{preamble}{current}" if preamble else current)

    return chunks

