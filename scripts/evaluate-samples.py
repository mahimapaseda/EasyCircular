#!/usr/bin/env python3
"""Evaluate extraction, NER, and summaries against sample circulars.

Usage (from repo root):
    python scripts/evaluate-samples.py
    python scripts/evaluate-samples.py --sample-circulars-only
    python scripts/evaluate-samples.py --sample-circulars-only --llm
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ALL_SAMPLE_DIRS = [
    ROOT / "sample circulars",
    ROOT / "docs" / "sample-circulars",
]
SAMPLE_CIRCULARS_ONLY = [ROOT / "sample circulars"]

sys.path.insert(0, str(ROOT / "ai-service"))

from app.moe_text import extract_circular_number, extract_subject  # noqa: E402
from app.ner import _looks_like_ocr_noise, extract_entities  # noqa: E402
from app.pdf_parser import parse_pdf_bytes  # noqa: E402
from app.summarize import fallback_summarize, summarize_text  # noqa: E402


def collect_samples(sample_dirs: list[Path]) -> list[Path]:
    files: list[Path] = []
    for directory in sample_dirs:
        if directory.exists():
            files.extend(sorted(directory.glob("*.pdf")))
    unique: dict[str, Path] = {}
    for path in files:
        unique.setdefault(path.name.lower(), path)
    return list(unique.values())


def evaluate(sample_dirs: list[Path], *, use_llm: bool) -> list[dict]:
    results: list[dict] = []
    for path in collect_samples(sample_dirs):
        parsed = parse_pdf_bytes(path.read_bytes(), filename=path.name)
        entities = extract_entities(parsed.text)
        if use_llm:
            result = summarize_text(parsed.text, entities)
            summary = result.get("summary") or {}
            # Flatten processing meta onto the summary for reporting
            meta = result.get("processingMeta") or {}
            if meta.get("mode") and not summary.get("mode"):
                summary = {**summary, "mode": meta.get("mode")}
        else:
            summary = fallback_summarize(parsed.text, entities, filename=path.name)
        subject = extract_subject(parsed.text)
        circular_no = extract_circular_number(parsed.text, path.name)
        purpose = summary["sections"][0]["content"] if summary.get("sections") else ""
        noise_entities = [
            e["text"]
            for e in entities
            if e["label"] in ("PERSON", "ORG", "OTHER") and _looks_like_ocr_noise(e["text"])
        ]
        results.append(
            {
                "file": path.name,
                "pages": parsed.pages,
                "ocr": parsed.ocr_used,
                "chars": len(parsed.text),
                "circularNo": circular_no,
                "subjectFound": bool(subject),
                "subject": subject,
                "title": summary.get("title"),
                "purposePreview": purpose[:220],
                "mode": summary.get("mode"),
                "entityCounts": {
                    label: sum(1 for e in entities if e["label"] == label)
                    for label in ("DATE", "ORG", "LAW", "PERSON", "OTHER")
                },
                "actionItems": len(summary.get("actionItems") or []),
                "requirementsSection": any(
                    section.get("heading") == "Key requirements"
                    for section in summary.get("sections") or []
                ),
                "noiseEntities": noise_entities,
            }
        )
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate sample circular extraction/NER/summary")
    parser.add_argument(
        "--sample-circulars-only",
        action="store_true",
        help='Only evaluate PDFs under "sample circulars/"',
    )
    parser.add_argument(
        "--llm",
        action="store_true",
        help="Run summarize_text (LLM when configured) instead of fallback-only",
    )
    args = parser.parse_args()

    sample_dirs = SAMPLE_CIRCULARS_ONLY if args.sample_circulars_only else ALL_SAMPLE_DIRS
    results = evaluate(sample_dirs, use_llm=args.llm)
    suffix = "-llm" if args.llm else ""
    if args.sample_circulars_only:
        suffix = f"-en{suffix}"
    output_path = ROOT / "scripts" / f"sample-evaluation{suffix}.json"
    output_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Evaluated {len(results)} sample circular(s)" + (" [LLM]" if args.llm else " [fallback]") + "\n")
    passed = 0
    for item in results:
        clean = not item["noiseEntities"]
        ok = (
            item["subjectFound"]
            and "All Provincial" not in (item["purposePreview"] or "")
            and clean
        )
        passed += int(ok)
        status = "OK" if ok else "CHECK"
        line = (
            f"{status:5} {item['file']}\n"
            f"      circular: {item['circularNo'] or '-'}\n"
            f"      mode: {item.get('mode') or '-'}\n"
            f"      title: {item['title']}\n"
            f"      purpose: {(item['purposePreview'] or '')[:120]}...\n"
            f"      noise entities: {len(item['noiseEntities'])}\n"
        )
        try:
            print(line)
        except UnicodeEncodeError:
            print(line.encode("ascii", errors="replace").decode("ascii"))

    print(f"Subject-quality pass: {passed}/{len(results)}")
    print(f"Full report: {output_path}")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
