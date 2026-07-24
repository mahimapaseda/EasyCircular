#!/usr/bin/env python3
"""Silver-label the corpus with the current NER pipeline.

Runs app.ner.extract_entities over every training/corpus/*.txt file and
writes one JSONL record per document to training/annotations/<name>.jsonl:

    {"text": "...", "entities": [[start, end, "LABEL"], ...]}

These silver annotations can be hand-corrected before conversion with
convert_to_spacy.py.

Usage (from ai-service/):
    python training/generate_annotations.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

TRAINING_DIR = Path(__file__).resolve().parent
AI_SERVICE_DIR = TRAINING_DIR.parent
CORPUS_DIR = TRAINING_DIR / "corpus"
ANNOTATIONS_DIR = TRAINING_DIR / "annotations"

sys.path.insert(0, str(AI_SERVICE_DIR))

from app.ner import extract_entities  # noqa: E402


def main() -> int:
    if not CORPUS_DIR.exists():
        print("No corpus found. Run training/build_corpus.py first.")
        return 1

    ANNOTATIONS_DIR.mkdir(parents=True, exist_ok=True)
    corpus_files = sorted(CORPUS_DIR.glob("*.txt"))
    if not corpus_files:
        print("Corpus directory is empty. Run training/build_corpus.py first.")
        return 1

    for text_path in corpus_files:
        text = text_path.read_text(encoding="utf-8")
        entities = extract_entities(text)
        record = {
            "text": text,
            "entities": [[e["start"], e["end"], e["label"]] for e in entities],
        }
        out_path = ANNOTATIONS_DIR / f"{text_path.stem}.jsonl"
        out_path.write_text(
            json.dumps(record, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        print(f"OK    {text_path.name}: {len(entities)} entities -> {out_path.name}")

    print(f"\nAnnotations written to {ANNOTATIONS_DIR}")
    print("Review/correct the JSONL files, then run training/convert_to_spacy.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
