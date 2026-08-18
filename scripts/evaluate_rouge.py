#!/usr/bin/env python3
"""ROUGE-1/2/L against human gold summaries in ai-service/training/fewshot.

Usage (from repo root, AI venv active):
    python scripts/evaluate_rouge.py
    python scripts/evaluate_rouge.py --llm
    npm run evaluate:rouge
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AI = ROOT / "ai-service"
FEWSHOT_DIR = AI / "training" / "fewshot"
REPORT_PATH = ROOT / "docs" / "evaluation" / "rouge-report.json"

sys.path.insert(0, str(AI))

from app.summarize import fallback_summarize, summarize_text  # noqa: E402


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", (text or "").lower())


def ngrams(tokens: list[str], n: int) -> list[tuple[str, ...]]:
    if n <= 0 or len(tokens) < n:
        return []
    return [tuple(tokens[i : i + n]) for i in range(len(tokens) - n + 1)]


def f1(precision: float, recall: float) -> float:
    if precision + recall == 0:
        return 0.0
    return 2 * precision * recall / (precision + recall)


def rouge_n(candidate: str, reference: str, n: int) -> dict[str, float]:
    cand = ngrams(tokenize(candidate), n)
    ref = ngrams(tokenize(reference), n)
    if not cand or not ref:
        return {"precision": 0.0, "recall": 0.0, "f1": 0.0}
    overlap = sum((Counter(cand) & Counter(ref)).values())
    precision = overlap / len(cand)
    recall = overlap / len(ref)
    return {"precision": precision, "recall": recall, "f1": f1(precision, recall)}


def lcs_length(a: list[str], b: list[str]) -> int:
    if not a or not b:
        return 0
    prev = [0] * (len(b) + 1)
    for token in a:
        current = [0]
        for j, other in enumerate(b, start=1):
            if token == other:
                current.append(prev[j - 1] + 1)
            else:
                current.append(max(current[-1], prev[j]))
        prev = current
    return prev[-1]


def rouge_l(candidate: str, reference: str) -> dict[str, float]:
    cand = tokenize(candidate)
    ref = tokenize(reference)
    if not cand or not ref:
        return {"precision": 0.0, "recall": 0.0, "f1": 0.0}
    overlap = lcs_length(cand, ref)
    precision = overlap / len(cand)
    recall = overlap / len(ref)
    return {"precision": precision, "recall": recall, "f1": f1(precision, recall)}


def summary_blob(payload: dict) -> str:
    parts = [str(payload.get("title") or "")]
    for section in payload.get("sections") or []:
        parts.append(str(section.get("heading") or ""))
        parts.append(str(section.get("content") or ""))
    parts.extend(str(item) for item in (payload.get("actionItems") or []))
    return "\n".join(parts)


def load_gold_examples() -> list[dict]:
    examples: list[dict] = []
    if not FEWSHOT_DIR.is_dir():
        return examples
    for path in sorted(FEWSHOT_DIR.glob("*.json")):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        gold = payload.get("gold")
        if not isinstance(gold, dict) or not payload.get("source_excerpt"):
            continue
        examples.append(payload)
    return examples


def evaluate(*, use_llm: bool) -> list[dict]:
    rows: list[dict] = []
    for example in load_gold_examples():
        text = str(example.get("source_excerpt") or "")
        gold = example.get("gold") or {}
        if use_llm:
            result = summarize_text(text, [], filename=f"{example.get('id')}.pdf")
            summary = result.get("summary") or {}
            mode = (result.get("processingMeta") or {}).get("mode")
        else:
            summary = fallback_summarize(text, [], filename=f"{example.get('id')}.pdf")
            mode = "fallback"
        candidate = summary_blob(summary)
        reference = summary_blob(gold)
        row = {
            "id": example.get("id"),
            "mode": mode,
            "rouge1": rouge_n(candidate, reference, 1),
            "rouge2": rouge_n(candidate, reference, 2),
            "rougeL": rouge_l(candidate, reference),
        }
        rows.append(row)
    return rows


def mean_f1(rows: list[dict], key: str) -> float:
    if not rows:
        return 0.0
    return sum(row[key]["f1"] for row in rows) / len(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description="ROUGE vs few-shot gold summaries")
    parser.add_argument(
        "--llm",
        action="store_true",
        help="Use the configured LLM (otherwise extractive fallback)",
    )
    args = parser.parse_args()

    rows = evaluate(use_llm=args.llm)
    if not rows:
        print("No gold few-shot files found in", FEWSHOT_DIR)
        return 1

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "mode": "llm" if args.llm else "fallback",
        "count": len(rows),
        "macro": {
            "rouge1_f1": round(mean_f1(rows, "rouge1"), 4),
            "rouge2_f1": round(mean_f1(rows, "rouge2"), 4),
            "rougeL_f1": round(mean_f1(rows, "rougeL"), 4),
        },
        "docs": rows,
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"Gold docs: {len(rows)}  mode={report['mode']}")
    print(
        "Macro F1  "
        f"ROUGE-1={report['macro']['rouge1_f1']:.3f}  "
        f"ROUGE-2={report['macro']['rouge2_f1']:.3f}  "
        f"ROUGE-L={report['macro']['rougeL_f1']:.3f}"
    )
    for row in rows:
        print(
            f"  {row['id']}: "
            f"R1={row['rouge1']['f1']:.3f} "
            f"R2={row['rouge2']['f1']:.3f} "
            f"RL={row['rougeL']['f1']:.3f} "
            f"({row['mode']})"
        )
    print("Wrote", REPORT_PATH)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
