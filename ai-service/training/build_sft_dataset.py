#!/usr/bin/env python3
"""Build Alpaca-style SFT JSONL from curated few-shot gold (plus optional silver).

Usage (from ai-service/):
    python training/build_sft_dataset.py
    python training/build_sft_dataset.py --eval-id 15-2026 --silver-cap 5
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

TRAINING_DIR = Path(__file__).resolve().parent
AI_ROOT = TRAINING_DIR.parent
FEWSHOT_DIR = TRAINING_DIR / "fewshot"
CORPUS_DIR = TRAINING_DIR / "corpus"
SFT_DIR = TRAINING_DIR / "sft"

sys.path.insert(0, str(AI_ROOT))

from app.ner import extract_entities  # noqa: E402
from app.summarize import SYSTEM_PROMPT_SUMMARIZE_BASE, _is_curated_fewshot  # noqa: E402
from app.summarize import fallback_summarize  # noqa: E402

INSTRUCTION_CANONICAL = (
    SYSTEM_PROMPT_SUMMARIZE_BASE.strip()
    + "\n\nReturn ONLY the JSON object. Do not copy facts from other circulars."
)

INSTRUCTION_PARAPHRASES = (
    INSTRUCTION_CANONICAL,
    (
        "Summarize this Sri Lankan Ministry of Education circular as a single JSON object "
        "with circularNumber, issuedDate, issuedBy, targetAudience, effectiveDate, title, "
        "sections, and actionItems. Return JSON only. Do not invent dates."
    ),
    (
        "Produce a structured JSON summary for school principals from the circular text. "
        "Use the EasyCircular schema (title, sections with Purpose/Key requirements/"
        "Legal & circular references, actionItems). Every date must appear in the source."
    ),
)


def compact_summary(gold: dict) -> dict:
    return {
        "circularNumber": gold.get("circularNumber"),
        "issuedDate": gold.get("issuedDate"),
        "issuedBy": gold.get("issuedBy"),
        "targetAudience": gold.get("targetAudience"),
        "effectiveDate": gold.get("effectiveDate"),
        "title": gold.get("title"),
        "sections": (gold.get("sections") or [])[:3],
        "actionItems": (gold.get("actionItems") or [])[:4],
    }


def load_gold_examples() -> list[dict]:
    examples: list[dict] = []
    if not FEWSHOT_DIR.is_dir():
        return examples
    for path in sorted(FEWSHOT_DIR.glob("*.json")):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(payload, dict) and _is_curated_fewshot(payload):
            examples.append(payload)
    return examples


def make_rows(example_id: str, source: str, gold: dict, *, quality: str) -> list[dict]:
    output = json.dumps(compact_summary(gold), ensure_ascii=False)
    rows = []
    for instruction in INSTRUCTION_PARAPHRASES:
        rows.append(
            {
                "id": example_id,
                "quality": quality,
                "instruction": instruction,
                "input": source.strip(),
                "output": output,
            }
        )
    return rows


def silver_rows(eval_id: str, cap: int) -> list[dict]:
    if cap <= 0 or not CORPUS_DIR.is_dir():
        return []
    rows: list[dict] = []
    eval_key = eval_id.lower().replace("/", "-")
    for path in sorted(CORPUS_DIR.glob("*.txt")):
        stem = path.stem.lower()
        if eval_key and eval_key in stem:
            continue
        text = path.read_text(encoding="utf-8", errors="replace").strip()
        if len(text) < 80:
            continue
        excerpt = text[:2500]
        entities = extract_entities(excerpt, filename=path.name + ".pdf")
        summary = fallback_summarize(excerpt, entities, filename=path.name + ".pdf")
        if not summary.get("title") or not (summary.get("sections") or []):
            continue
        # One silver row per corpus file (no paraphrases) so gold stays dominant.
        rows.append(
            {
                "id": path.stem,
                "quality": "silver",
                "split": "silver",
                "instruction": INSTRUCTION_CANONICAL,
                "input": excerpt,
                "output": json.dumps(compact_summary(summary), ensure_ascii=False),
            }
        )
        if len(rows) >= cap:
            break
    return rows


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build EasyCircular SFT JSONL")
    parser.add_argument("--eval-id", default="15-2026", help="Few-shot id to hold out")
    parser.add_argument(
        "--silver-cap",
        type=int,
        default=None,
        help="Max silver corpus rows (default: number of gold train circulars)",
    )
    args = parser.parse_args()

    gold = load_gold_examples()
    if not gold:
        print("No curated few-shot JSON found in", FEWSHOT_DIR)
        return 1

    eval_id = args.eval_id.strip()
    train_gold = [ex for ex in gold if str(ex.get("id")) != eval_id]
    eval_gold = [ex for ex in gold if str(ex.get("id")) == eval_id]
    if not eval_gold:
        print(f"Hold-out id {eval_id!r} not found; using last gold example")
        eval_gold = [gold[-1]]
        train_gold = gold[:-1]
        eval_id = str(eval_gold[0].get("id"))

    train_rows: list[dict] = []
    for ex in train_gold:
        train_rows.extend(
            make_rows(str(ex["id"]), str(ex["source_excerpt"]), ex["gold"], quality="gold")
        )

    silver_cap = args.silver_cap if args.silver_cap is not None else len(train_gold)
    train_rows.extend(silver_rows(eval_id, silver_cap))

    eval_rows: list[dict] = []
    for ex in eval_gold:
        eval_rows.extend(
            make_rows(str(ex["id"]), str(ex["source_excerpt"]), ex["gold"], quality="gold")
        )

    write_jsonl(SFT_DIR / "train.jsonl", train_rows)
    write_jsonl(SFT_DIR / "eval.jsonl", eval_rows)

    gold_train = sum(1 for row in train_rows if row.get("quality") == "gold")
    silver_train = sum(1 for row in train_rows if row.get("quality") == "silver")
    print(f"Wrote {SFT_DIR / 'train.jsonl'} ({len(train_rows)} rows: {gold_train} gold, {silver_train} silver)")
    print(f"Wrote {SFT_DIR / 'eval.jsonl'} ({len(eval_rows)} rows, hold-out={eval_id})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
