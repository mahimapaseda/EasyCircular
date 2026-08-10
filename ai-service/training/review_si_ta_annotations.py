#!/usr/bin/env python3
"""Light review pass for Sinhala/Tamil silver annotations.

Drops PERSON/OTHER invented by English SpaCy on Indic OCR, and ORG spans
that look like columnar/OCR gibberish. Keeps DATE/LAW and keyword-backed ORGs.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ANNOTATIONS_DIR = Path(__file__).resolve().parent / "annotations"

TARGETS = [
    "Dengue_Sinhala.jsonl",
    "03-2014I.jsonl",
    "23-2026-Ta.jsonl",
    "test-digital.jsonl",
]

SI_ORG_HINT = re.compile(
    r"අධ්|අමාත්|ලේකම්|අධ්යක්ෂ|විදුහල්පති|ඩෙංගු|රාජ්|පළාත්|කලාප|"
    r"Ministry|Department|Education|கல்வி|அமைச்சு|அலுவலகம்"
)
TA_ORG_HINT = re.compile(
    r"கல்வி|அமைச்சு|அலுவலகம்|மாகாண|வலய|Ministry|Education|Department"
)
LAW_HINT = re.compile(r"චක්|අංක|ED/|Circular|சுற்று|இலக|සංග්|වගන්ති|පරිච්|ஆயதன")


def is_noise(text: str) -> bool:
    t = text.strip()
    if len(t) < 3:
        return True
    toks = t.split()
    if len(toks) >= 3 and sum(1 for x in toks if len(x) <= 1) / len(toks) >= 0.5:
        return True
    letters = [c for c in t if c.isalpha()]
    if not letters:
        return True
    non_space = [c for c in t if not c.isspace()]
    if len(letters) / len(non_space) < 0.55:
        return True
    if (
        re.fullmatch(r"[\u0B80-\u0BFF\s]{1,20}", t)
        and len(toks) >= 2
        and max(len(x) for x in toks) <= 2
    ):
        return True
    return False


def review_record(name: str, rec: dict) -> tuple[dict, list[tuple[str, str]]]:
    text = rec["text"]
    kept: list[list] = []
    dropped: list[tuple[str, str]] = []
    for start, end, label in rec["entities"]:
        span = text[start:end]
        keep = True
        if label in ("PERSON", "OTHER"):
            keep = False
        elif label == "ORG":
            if is_noise(span):
                keep = False
            elif name.startswith("23-2026-Ta") and not TA_ORG_HINT.search(span):
                keep = False
            elif name in (
                "Dengue_Sinhala.jsonl",
                "03-2014I.jsonl",
                "test-digital.jsonl",
            ):
                if not SI_ORG_HINT.search(span):
                    keep = False
        elif label == "DATE":
            if re.fullmatch(r"\d{4}", span.strip()) and name.startswith("23-2026-Ta"):
                keep = False
        elif label == "LAW":
            if is_noise(span) and not LAW_HINT.search(span):
                keep = False
        if keep:
            kept.append([start, end, label])
        else:
            dropped.append((label, span[:80].replace("\n", " ")))
    rec["entities"] = kept
    return rec, dropped


def main() -> int:
    for name in TARGETS:
        path = ANNOTATIONS_DIR / name
        if not path.exists():
            print(f"SKIP  {name} (missing)")
            continue
        rec = json.loads(path.read_text(encoding="utf-8"))
        before = len(rec["entities"])
        rec, dropped = review_record(name, rec)
        path.write_text(json.dumps(rec, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"OK    {name}: {before} -> {len(rec['entities'])} (dropped {len(dropped)})")
        for lab, span in dropped[:12]:
            print(f"      - {lab}: {span!r}")
        print("      kept:")
        text = rec["text"]
        for start, end, lab in rec["entities"]:
            snippet = text[start:end][:70].replace("\n", " ")
            print(f"      + {lab}: {snippet!r}")
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
