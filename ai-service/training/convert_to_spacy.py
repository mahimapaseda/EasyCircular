#!/usr/bin/env python3
"""Convert annotation JSONL files into SpaCy DocBin train/dev sets.

Reads training/annotations/*.jsonl, aligns entity spans to tokens, and writes
training/train.spacy and training/dev.spacy (about 80/20 document split).
Misaligned spans are skipped with a warning count.

Usage (from ai-service/):
    python training/convert_to_spacy.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

TRAINING_DIR = Path(__file__).resolve().parent
ANNOTATIONS_DIR = TRAINING_DIR / "annotations"
TRAIN_PATH = TRAINING_DIR / "train.spacy"
DEV_PATH = TRAINING_DIR / "dev.spacy"

# Long documents are split into paragraph chunks so the NER model trains on
# reasonably sized examples instead of one giant doc.
MAX_CHARS = 3000


def chunk_records(text: str, entities: list[list]) -> list[tuple[str, list[list]]]:
    if len(text) <= MAX_CHARS:
        return [(text, entities)]

    chunks: list[tuple[str, list[list]]] = []
    start = 0
    while start < len(text):
        end = min(start + MAX_CHARS, len(text))
        # Break on a newline when possible to avoid splitting entities
        if end < len(text):
            newline = text.rfind("\n", start, end)
            if newline > start:
                end = newline
        chunk_text = text[start:end]
        chunk_entities = [
            [s - start, e - start, label]
            for s, e, label in entities
            if s >= start and e <= end
        ]
        chunks.append((chunk_text, chunk_entities))
        start = end
    return chunks


def main() -> int:
    import spacy
    from spacy.tokens import DocBin

    if not ANNOTATIONS_DIR.exists():
        print("No annotations found. Run training/generate_annotations.py first.")
        return 1

    files = sorted(ANNOTATIONS_DIR.glob("*.jsonl"))
    if not files:
        print("Annotations directory is empty.")
        return 1

    nlp = spacy.blank("en")
    examples: list[tuple[str, list[list]]] = []
    for path in files:
        for line in path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            record = json.loads(line)
            examples.extend(chunk_records(record["text"], record["entities"]))

    train_bin = DocBin()
    dev_bin = DocBin()
    skipped = 0
    total_spans = 0
    kept_spans = 0

    for index, (text, entities) in enumerate(examples):
        doc = nlp.make_doc(text)
        spans = []
        for start, end, label in entities:
            total_spans += 1
            span = doc.char_span(start, end, label=label, alignment_mode="contract")
            if span is None:
                skipped += 1
                continue
            kept_spans += 1
            spans.append(span)
        doc.ents = spacy.util.filter_spans(spans)
        # ~80/20 split by round-robin
        (dev_bin if index % 5 == 4 else train_bin).add(doc)

    train_bin.to_disk(TRAIN_PATH)
    dev_bin.to_disk(DEV_PATH)

    print(f"Documents: {len(examples)} (train {len(train_bin)} / dev {len(dev_bin)})")
    print(f"Entity spans: kept {kept_spans}, skipped {skipped} (of {total_spans})")
    print(f"Wrote {TRAIN_PATH.name} and {DEV_PATH.name} in {TRAINING_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
