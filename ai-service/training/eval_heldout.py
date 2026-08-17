#!/usr/bin/env python3
"""Compare held-out few-shot gold against the configured LLM (Ollama).

Usage (from repo root, AI venv active):
    python ai-service/training/eval_heldout.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

AI_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AI_ROOT))

from app.llm import active_model_name, llm_is_configured  # noqa: E402
from app.ner import extract_entities  # noqa: E402
from app.summarize import summarize_text  # noqa: E402

EVAL_PATH = Path(__file__).resolve().parent / "sft" / "eval.jsonl"


def load_eval_rows() -> list[dict]:
    if not EVAL_PATH.exists():
        raise FileNotFoundError(f"Missing {EVAL_PATH} — run training/build_sft_dataset.py")
    rows = []
    seen: set[str] = set()
    with EVAL_PATH.open(encoding="utf-8") as handle:
        for line in handle:
            row = json.loads(line)
            key = str(row.get("id"))
            if key in seen:
                continue
            seen.add(key)
            rows.append(row)
    return rows


def main() -> int:
    if not llm_is_configured():
        print("LLM is not configured / Ollama is not reachable")
        return 1

    print("model:", active_model_name())
    rows = load_eval_rows()
    matches = 0
    for row in rows:
        gold = json.loads(row["output"])
        text = row["input"]
        entities = extract_entities(text, filename=f"{row['id']}.pdf")
        result = summarize_text(text, entities, filename=f"{row['id']}.pdf")
        summary = result.get("summary") or {}
        meta = result.get("processingMeta") or {}
        circ_ok = (summary.get("circularNumber") or "") == (gold.get("circularNumber") or "")
        title_ok = bool(summary.get("title"))
        actions_ok = len(summary.get("actionItems") or []) >= 1
        ok = circ_ok and title_ok and actions_ok
        matches += int(ok)
        print(
            f"{'OK' if ok else 'CHECK'} {row['id']} mode={meta.get('mode')} "
            f"circ={summary.get('circularNumber')!r} gold={gold.get('circularNumber')!r} "
            f"title={(summary.get('title') or '')[:70]!r} actions={len(summary.get('actionItems') or [])}"
        )
    print(f"Held-out pass: {matches}/{len(rows)}")
    return 0 if matches == len(rows) else 1


if __name__ == "__main__":
    raise SystemExit(main())
