import re

from app.config import settings


def split_text(text: str, chunk_size: int | None = None, overlap: int | None = None) -> list[str]:
    chunk_size = chunk_size or settings.chunk_size
    overlap = overlap or settings.chunk_overlap

    normalized = text.strip()
    if not normalized:
        return []

    if len(normalized) <= chunk_size:
        return [normalized]

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", normalized) if p.strip()]
    chunks: list[str] = []
    current = ""

    for paragraph in paragraphs:
        candidate = f"{current}\n\n{paragraph}".strip() if current else paragraph
        if len(candidate) <= chunk_size:
            current = candidate
            continue

        if current:
            chunks.append(current)
            tail = current[-overlap:] if overlap > 0 else ""
            current = f"{tail}\n\n{paragraph}".strip() if tail else paragraph
        else:
            for index in range(0, len(paragraph), chunk_size - overlap):
                chunks.append(paragraph[index : index + chunk_size])

    if current:
        chunks.append(current)

    return chunks
