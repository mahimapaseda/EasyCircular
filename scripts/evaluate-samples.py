#!/usr/bin/env python3
"""Evaluate extraction, NER, and fallback summaries against sample circulars."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SAMPLE_DIRS = [
    ROOT / "sample circulars",
    ROOT / "docs" / "sample-circulars",
]

sys.path.insert(0, str(ROOT / "ai-service"))

from app.moe_text import build_summary_title, extract_circular_number, extract_subject  # noqa: E402
from app.ner import _looks_like_ocr_noise, extract_entities  # noqa: E402
from app.pdf_parser import parse_pdf_bytes  # noqa: E402
from app.summarize import fallback_summarize  # noqa: E402


def collect_samples() -> list[Path]:
    files: list[Path] = []
    for directory in SAMPLE_DIRS:
        if directory.exists():
            files.extend(sorted(directory.glob("*.pdf")))
    unique: dict[str, Path] = {}
    for path in files:
        unique.setdefault(path.name.lower(), path)
    return list(unique.values())


def evaluate() -> list[dict]:
    results: list[dict] = []
    for path in collect_samples():
        parsed = parse_pdf_bytes(path.read_bytes())
        entities = extract_entities(parsed.text)
        summary = fallback_summarize(parsed.text, entities)
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
    results = evaluate()
    output_path = ROOT / "scripts" / "sample-evaluation.json"
    output_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Evaluated {len(results)} sample circular(s)\n")
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
