#!/usr/bin/env python3
"""Parse sample circular PDFs into plain-text corpus files.

By default reads PDFs from both "sample circulars/" and "docs/sample-circulars/"
(deduped by filename). Pass --sample-circulars-only to restrict to the English
MOE PDFs under "sample circulars/" for English-focused NER retraining.

Usage (from ai-service/):
    python training/build_corpus.py
    python training/build_corpus.py --sample-circulars-only
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

AI_SERVICE_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = AI_SERVICE_DIR.parent
CORPUS_DIR = Path(__file__).resolve().parent / "corpus"

ALL_SAMPLE_DIRS = [
    REPO_ROOT / "sample circulars",
    REPO_ROOT / "docs" / "sample-circulars",
]

SAMPLE_CIRCULARS_ONLY = [
    REPO_ROOT / "sample circulars",
]

sys.path.insert(0, str(AI_SERVICE_DIR))

from app.pdf_parser import parse_pdf_bytes  # noqa: E402


def collect_samples(sample_dirs: list[Path]) -> list[Path]:
    files: list[Path] = []
    for directory in sample_dirs:
        if directory.exists():
            files.extend(sorted(directory.glob("*.pdf")))
    unique: dict[str, Path] = {}
    for path in files:
        unique.setdefault(path.name.lower(), path)
    return list(unique.values())


def main() -> int:
    parser = argparse.ArgumentParser(description="Build NER training corpus from sample PDFs")
    parser.add_argument(
        "--sample-circulars-only",
        action="store_true",
        help='Only use PDFs from "sample circulars/" (English fine-tune set)',
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Delete existing corpus/*.txt before writing (avoids leftover Si/Ta files)",
    )
    args = parser.parse_args()

    sample_dirs = SAMPLE_CIRCULARS_ONLY if args.sample_circulars_only else ALL_SAMPLE_DIRS
    CORPUS_DIR.mkdir(parents=True, exist_ok=True)

    if args.clean and CORPUS_DIR.exists():
        for stale in CORPUS_DIR.glob("*.txt"):
            stale.unlink()
            print(f"DEL   {stale.name}")

    samples = collect_samples(sample_dirs)
    if not samples:
        print("No sample PDFs found.")
        return 1

    written = 0
    for pdf_path in samples:
        parsed = parse_pdf_bytes(pdf_path.read_bytes(), filename=pdf_path.name)
        status = "ocr" if parsed.ocr_used else "text"
        if not parsed.text.strip():
            print(f"SKIP  {pdf_path.name} (no text; error: {parsed.error})")
            continue
        out_path = CORPUS_DIR / f"{pdf_path.stem}.txt"
        out_path.write_text(parsed.text, encoding="utf-8")
        written += 1
        print(
            f"OK    {pdf_path.name} -> {out_path.name} "
            f"({len(parsed.text)} chars, {parsed.pages} pages, {status})"
        )

    print(f"\nWrote {written}/{len(samples)} corpus file(s) to {CORPUS_DIR}")
    return 0 if written else 1


if __name__ == "__main__":
    raise SystemExit(main())
