#!/usr/bin/env python3
"""Verify issue fixes on key sample circulars."""

from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

AI = Path(__file__).resolve().parents[1] / "ai-service"
sys.path.insert(0, str(AI))

from app.ner import extract_entities  # noqa: E402
from app.summarize import _parse_llm_json, _prepare_text_for_llm, summarize_text  # noqa: E402


def main() -> int:
    for sample in (
        'Here you go:\n{"title": "T", "sections": [], "actionItems": []}\nThanks',
        '```json\n{"title": "T", "circularNumber": "10/2026",}\n```',
    ):
        print("parse ok:", _parse_llm_json(sample).get("title"))

    cases = [
        ("10-2026-En", "10-2026-En.pdf"),
        ("23-2026-En", "23-2026-En.pdf"),
        ("44-2025-En", "44-2025-En.pdf"),
        ("12-2026-En-1", "12-2026-En-1.pdf"),
        ("15-2026-En", "15-2026-En.pdf"),
    ]
    corpus = AI / "training" / "corpus"
    for stem, fn in cases:
        text = (corpus / f"{stem}.txt").read_text(encoding="utf-8")
        ents = extract_entities(text, filename=fn)
        counts = Counter(e["label"] for e in ents)
        laws = [e["text"] for e in ents if e["label"] == "LAW"][:6]
        prep = _prepare_text_for_llm(text, filename=fn)
        print(f"=== {stem} chars={len(text)} prep={len(prep)}")
        print(f"  ents={dict(counts)}")
        print(f"  LAW={laws}")
        result = summarize_text(text, ents, filename=fn)
        summary = result["summary"]
        meta = result["processingMeta"]
        print(
            f"  mode={meta.get('mode')} chunks={meta.get('chunkCount')} "
            f"circ={summary.get('circularNumber')}"
        )
        print(f"  title={(summary.get('title') or '')[:80]}")
        if meta.get("llmError"):
            print(f"  err={meta['llmError'][:100]}")
        warns = result.get("guardrailWarnings") or []
        if warns:
            print(f"  warn={warns[:2]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
