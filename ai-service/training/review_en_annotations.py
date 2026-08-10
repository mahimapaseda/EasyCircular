#!/usr/bin/env python3
"""Light review pass for English silver annotations (sample circulars).

Drops false LAW (e.g. "the Vesak Day"), OCR/letterhead PERSON noise, and
over-long or non-institutional ORG spans. Keeps Circular/ED/Section/Chapter/
Financial Regulation LAW and ministry/role ORGs.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ANNOTATIONS_DIR = Path(__file__).resolve().parent / "annotations"

VALID_LAW = re.compile(
    r"(?:"
    r"Circular|Circ\.?|ED/\d|"
    r"Section\s+\d|Chapter\s+\d|"
    r"Financial\s+Regulation|"
    r"Establishments?\s+Code|"
    r"Education\s+Ordinance|"
    r"Appropriation\s+Act|"
    r"FR\s*\d+"
    r")",
    re.IGNORECASE,
)

ORG_HINT = re.compile(
    r"(?:"
    r"Ministry|Department|Commission|Council|Institute|Authority|"
    r"Provincial|Zonal|Divisional|Director|Secretary|Secretaries|"
    r"Education|Examination|National\s+School|College|Annexure|"
    r"Head\s+of\s+(?:the\s+)?Department|Buddhasasana|"
    r"Teacher\s+(?:Training|Development)|Public\s+Service"
    r")",
    re.IGNORECASE,
)

FALSE_LAW = re.compile(
    r"^(?:the\s+)?(?:vesak\s+day|educational\s+institutions?|collective\s+circles?)$",
    re.IGNORECASE,
)

JOB_TITLE_PERSON = re.compile(
    r"(?:Training\s+Colleges?|Library\s+Aide|Lord\s+Buddha|Sangha|"
    r"Alcohol\s+Authority|School\s+System|South\s+Asian)",
    re.IGNORECASE,
)

OCR_JUNK = re.compile(r"[A-Z]{3,}\s+[A-Z]{2,}[-/]|PUP\s+WOD|WOD-OUd|CamScanner", re.IGNORECASE)


def is_noise(text: str) -> bool:
    t = text.strip()
    if len(t) < 3:
        return True
    if OCR_JUNK.search(t):
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
    # Tamil/Sinhala fragments in English OCR
    indic = sum(1 for c in t if "\u0B80" <= c <= "\u0DFF")
    if indic and indic / max(len(t), 1) > 0.3:
        return True
    return False


def review_record(rec: dict) -> tuple[dict, list[tuple[str, str]]]:
    text = rec["text"]
    kept: list[list] = []
    dropped: list[tuple[str, str]] = []
    for start, end, label in rec["entities"]:
        span = text[start:end]
        keep = True
        if label == "OTHER":
            keep = False
        elif label == "PERSON":
            if is_noise(span) or JOB_TITLE_PERSON.search(span) or len(span) > 60:
                keep = False
            # Keep short Latin proper names only (signatories)
            elif not re.search(r"[A-Za-z]{2,}\s+[A-Za-z]{2,}", span):
                keep = False
            elif re.search(r"[\u0B80-\u0DFF]", span):
                keep = False
        elif label == "ORG":
            if is_noise(span):
                keep = False
            elif len(span) > 90:
                keep = False
            elif not ORG_HINT.search(span):
                keep = False
            elif re.search(
                r"^(?:the\s+)?(?:date of|please|central government\s*-)",
                span,
                re.IGNORECASE,
            ):
                keep = False
        elif label == "LAW":
            if FALSE_LAW.match(span.strip()):
                keep = False
            elif VALID_LAW.search(span):
                keep = True
            elif is_noise(span):
                keep = False
            else:
                keep = False
        elif label == "DATE":
            if not re.search(r"\d", span):
                keep = False
        if keep:
            kept.append([start, end, label])
        else:
            dropped.append((label, span[:80].replace("\n", " ")))
    rec["entities"] = kept
    return rec, dropped


def _extra_hand_fixes(rec: dict) -> dict:
    """Drop known bad leftover spans after the rule pass."""
    text = rec["text"]
    kept: list[list] = []
    for start, end, label in rec["entities"]:
        span = text[start:end].strip()
        low = span.lower()
        if label == "ORG":
            if span in ("Vocational Education", "Cultural Affairs", "Local Government"):
                continue
            if "head of department please" in low:
                continue
            if low.startswith("heads of ") and "education" not in low:
                continue
            if "publications ii" in low:
                continue
            if low.startswith("the central government"):
                continue
            if "date of service" in low:
                continue
        if label == "PERSON" and (
            "expenditure" in low or "training college" in low or len(span.split()) > 4
        ):
            continue
        kept.append([start, end, label])
    rec["entities"] = kept
    return rec


def main() -> int:
    files = sorted(ANNOTATIONS_DIR.glob("*En*.jsonl"))
    if not files:
        print("No English annotation files found (*En*.jsonl).")
        return 1

    for path in files:
        rec = json.loads(path.read_text(encoding="utf-8"))
        before = len(rec["entities"])
        rec, dropped = review_record(rec)
        rec = _extra_hand_fixes(rec)
        path.write_text(json.dumps(rec, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"OK    {path.name}: {before} -> {len(rec['entities'])} (rule-dropped {len(dropped)})")
        text = rec["text"]
        by_label: dict[str, int] = {}
        for _, _, lab in rec["entities"]:
            by_label[lab] = by_label.get(lab, 0) + 1
        print(f"      counts: {by_label}")
        shown = 0
        for start, end, lab in rec["entities"]:
            if shown >= 12:
                print(f"      ... +{len(rec['entities']) - shown} more")
                break
            snippet = text[start:end][:70].replace("\n", " ")
            print(f"      + {lab}: {snippet!r}")
            shown += 1
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
