#!/usr/bin/env python3
"""Full analysis of training corpus: NER + fallback + LLM (short docs)."""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

AI = Path(__file__).resolve().parents[1] / "ai-service"
sys.path.insert(0, str(AI))

from app.llm import llm_is_configured, ollama_is_reachable  # noqa: E402
from app.moe_text import (  # noqa: E402
    build_summary_title,
    detect_language_hint,
    extract_circular_number,
    extract_subject,
)
from app.ner import extract_entities  # noqa: E402
from app.summarize import fallback_summarize, summarize_text  # noqa: E402


def main() -> int:
    corpus = AI / "training" / "corpus"
    files = sorted(corpus.glob("*.txt"))
    print("=== SYSTEM ===")
    print("llm_configured", llm_is_configured(), "ollama", ollama_is_reachable())
    print("corpus_files", len(files))
    print()

    rows = []
    for path in files:
        text = path.read_text(encoding="utf-8")
        ents = extract_entities(text)
        counts = Counter(e["label"] for e in ents)
        circ = extract_circular_number(text, path.name + ".pdf")
        subj = extract_subject(text)
        title = build_summary_title(text, path.name + ".pdf")
        fb = fallback_summarize(text, ents, filename=path.name + ".pdf")

        llm_mode = None
        llm_title = None
        llm_circ = None
        llm_err = None
        if len(text) < 15000:
            try:
                result = summarize_text(text, ents)
                meta = result.get("processingMeta") or {}
                summary = result.get("summary") or {}
                llm_mode = meta.get("mode")
                llm_title = (summary.get("title") or "")[:90]
                llm_circ = summary.get("circularNumber")
                llm_err = meta.get("llmError")
            except Exception as exc:  # noqa: BLE001
                llm_mode = "error"
                llm_err = str(exc)[:120]
        else:
            llm_mode = "skipped (long doc)"

        row = {
            "file": path.name,
            "chars": len(text),
            "lang": detect_language_hint(text),
            "circularNo": circ,
            "subjectOk": bool(subj),
            "title": title[:120],
            "entityCounts": dict(counts),
            "fallbackActions": len(fb.get("actionItems") or []),
            "llmMode": llm_mode,
            "llmCirc": llm_circ,
            "llmTitle": llm_title,
            "llmError": llm_err,
        }
        rows.append(row)
        print(f"--- {path.name} ({row['chars']} chars, lang={row['lang']})")
        print(f"  circ={circ} subject={row['subjectOk']}")
        print(f"  ents={dict(counts)}")
        print(f"  title={row['title']}")
        print(f"  fallback actions={row['fallbackActions']} llm={llm_mode}")
        if llm_title:
            print(f"  llm title={llm_title} circ={llm_circ}")
        if llm_err:
            print(f"  llm err={llm_err[:100]}")

    out = Path(__file__).resolve().parent / "full-system-analysis.json"
    out.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print()
    print("Wrote", out)
    print("Subject OK:", sum(1 for r in rows if r["subjectOk"]), "/", len(rows))
    print("With LAW:", sum(1 for r in rows if r["entityCounts"].get("LAW", 0) > 0), "/", len(rows))
    llm_ok = sum(1 for r in rows if r["llmMode"] == "llm")
    print("LLM mode:", llm_ok, "/", sum(1 for r in rows if r["llmMode"] not in (None, "skipped (long doc)")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
