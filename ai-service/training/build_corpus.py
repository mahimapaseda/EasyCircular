#!/usr/bin/env python3
"""Parse all sample circular PDFs into plain-text corpus files.

Reads PDFs from "sample circulars/" and "docs/sample-circulars/" at the repo
root (deduped by filename) and writes extracted text to training/corpus/.

Usage (from ai-service/):
    python training/build_corpus.py
"""

from __future__ import annotations

import sys
from pathlib import Path

AI_SERVICE_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = AI_SERVICE_DIR.parent
CORPUS_DIR = Path(__file__).resolve().parent / "corpus"

SAMPLE_DIRS = [
    REPO_ROOT / "sample circulars",
    REPO_ROOT / "docs" / "sample-circulars",
]

sys.path.insert(0, str(AI_SERVICE_DIR))

from app.pdf_parser import parse_pdf_bytes  # noqa: E402


def collect_samples() -> list[Path]:
    files: list[Path] = []
    for directory in SAMPLE_DIRS:
        if directory.exists():
            files.extend(sorted(directory.glob("*.pdf")))
    unique: dict[str, Path] = {}
    for path in files:
        unique.setdefault(path.name.lower(), path)
    return list(unique.values())


def main() -> int:
    CORPUS_DIR.mkdir(parents=True, exist_ok=True)
    samples = collect_samples()
    if not samples:
        print("No sample PDFs found.")
        return 1

    written = 0
    for pdf_path in samples:
        parsed = parse_pdf_bytes(pdf_path.read_bytes())
        status = "ocr" if parsed.ocr_used else "text"
        if not parsed.text.strip():
            print(f"SKIP  {pdf_path.name} (no text; error: {parsed.error})")
            continue
        out_path = CORPUS_DIR / f"{pdf_path.stem}.txt"
        out_path.write_text(parsed.text, encoding="utf-8")
        written += 1
        print(f"OK    {pdf_path.name} -> {out_path.name} ({len(parsed.text)} chars, {parsed.pages} pages, {status})")

    print(f"\nWrote {written}/{len(samples)} corpus file(s) to {CORPUS_DIR}")
    return 0 if written else 1


if __name__ == "__main__":
    raise SystemExit(main())
