# -*- coding: utf-8 -*-
"""Assemble bulk.yaml: rewrite non-ch02 chapters; preserve ch02_literature exactly."""
from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
BULK = ROOT / "docs" / "thesis" / "content" / "bulk.yaml"
PARTS = Path(__file__).resolve().parent / "_bulk_parts"

sys.path.insert(0, str(PARTS))
from ch01 import CH01  # noqa: E402
from ch03 import CH03  # noqa: E402
from ch04a import CH04A  # noqa: E402
from ch04b import CH04B  # noqa: E402
from ch05 import CH05  # noqa: E402
from ch06 import CH06  # noqa: E402
from ch07 import CH07  # noqa: E402


def si_ratio(text: str) -> float:
    si = sum(1 for c in text if "\u0D80" <= c <= "\u0DFF")
    latin = sum(1 for c in text if c.isascii() and c.isalpha())
    total = si + latin
    return si / total if total else 0.0


def dump_section(name: str, paragraphs: list[str], indent: int = 2) -> str:
    sp = " " * indent
    lines = [f"{sp}{name}:", f"{sp}  paragraphs:"]
    for p in paragraphs:
        # YAML double-quoted; escape backslash and quotes
        esc = p.replace("\\", "\\\\").replace('"', '\\"')
        lines.append(f'{sp}    - "{esc}"')
    return "\n".join(lines)


def dump_chapter(ch_id: str, sections: dict) -> str:
    parts = [f"{ch_id}:"]
    for sec_id, paras in sections.items():
        parts.append(dump_section(sec_id, paras, indent=2))
    return "\n".join(parts)


def main() -> None:
    original = BULK.read_text(encoding="utf-8")
    m2 = re.search(r"^ch02_literature:", original, re.M)
    m3 = re.search(r"^ch03_plan:", original, re.M)
    if not m2 or not m3:
        raise SystemExit("Could not locate ch02_literature / ch03_plan boundaries")
    ch02_block = original[m2.start() : m3.start()].rstrip() + "\n"

    # Verify ch02 untouched hash content present
    if "ස්වභාවික භාෂා සැකසුම" not in ch02_block:
        raise SystemExit("ch02 block extraction looks wrong")

    ch04 = {**CH04A, **CH04B}
    chapters = [
        ("ch01_intro", CH01),
        None,  # ch02 preserved raw
        ("ch03_plan", CH03),
        ("ch04_methodology", ch04),
        ("ch05_results", CH05),
        ("ch06_evaluations", CH06),
        ("ch07_conclusion", CH07),
    ]

    header = (
        "# bulk.yaml - extended Sinhala paragraphs merged into chapter sections by generate_thesis.py\n"
        "# All paragraphs are unique - no duplicates\n\n"
    )

    out_parts = [header, dump_chapter("ch01_intro", CH01), "", ch02_block]
    out_parts.append(dump_chapter("ch03_plan", CH03))
    out_parts.append("")
    out_parts.append(dump_chapter("ch04_methodology", ch04))
    out_parts.append("")
    out_parts.append(dump_chapter("ch05_results", CH05))
    out_parts.append("")
    out_parts.append(dump_chapter("ch06_evaluations", CH06))
    out_parts.append("")
    out_parts.append(dump_chapter("ch07_conclusion", CH07))
    out_parts.append("")

    text = "\n".join(out_parts)
    if "\u2014" in text:
        # ch02 must not have it either; fail if any
        locs = [i for i, c in enumerate(text) if c == "\u2014"]
        raise SystemExit(f"Found em dash at positions {locs[:5]}")

    # Validate YAML parse
    data = yaml.safe_load(text)
    assert "ch02_literature" in data
    assert "ch01_intro" in data

    # Verify paragraph counts match expected
    expected = {
        "ch01_intro": {"bg": 16, "aim": 14, "scope": 13, "structure": 11},
        "ch03_plan": {"agile": 13, "phases": 15, "risks": 13, "gates": 11},
        "ch04_methodology": {
            "intro": 10, "arch": 12, "req": 9, "stack": 15, "pipeline": 12,
            "ai": 14, "security": 13, "risk_table": 9, "api": 10,
        },
        "ch05_results": {"ops": 16, "rouge_results": 16, "sample_eval": 13, "llm": 16},
        "ch06_evaluations": {"auto": 15, "phase": 12, "test_cases": 15, "uat": 10},
        "ch07_conclusion": {"summary": 14, "objectives": 15, "limits": 14, "future": 16},
    }

    print("=== Paragraph counts & si_ratio ===")
    fail = False
    all_paras: list[str] = []
    for ch, secs in expected.items():
        for sec, n_exp in secs.items():
            paras = data[ch][sec]["paragraphs"]
            n = len(paras)
            joined = "\n".join(paras)
            ratio = si_ratio(joined)
            status = "OK" if ratio >= 0.45 and n == n_exp else "FAIL"
            if status == "FAIL":
                fail = True
            print(f"{ch}.{sec}: n={n} (exp {n_exp}) si_ratio={ratio:.3f} [{status}]")
            all_paras.extend(paras)

    # Uniqueness within rewritten chapters
    from collections import Counter
    counts = Counter(all_paras)
    dups = [p[:60] for p, c in counts.items() if c > 1]
    if dups:
        print("DUPLICATES:", dups[:5])
        fail = True
    else:
        print(f"Uniqueness: {len(all_paras)} paragraphs all unique OK")

    # ch02 section ratios (informational)
    print("\n=== ch02 (unchanged) info ===")
    for sec, body in data["ch02_literature"].items():
        paras = body["paragraphs"]
        r = si_ratio("\n".join(paras))
        print(f"ch02_literature.{sec}: n={len(paras)} si_ratio={r:.3f}")

    if fail:
        raise SystemExit("Verification FAILED")

    BULK.write_text(text, encoding="utf-8")
    print(f"\nWrote {BULK}")
    print("All non-ch02 sections si_ratio >= 0.45")


if __name__ == "__main__":
    main()
