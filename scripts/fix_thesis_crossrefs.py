#!/usr/bin/env python3
"""Repoint cross-references after the six-chapter restructure.

Table numbers, appendix letters and section numbers changed when sections moved
between chapters. Replacements are scoped per file because the same string can
be correct in one file and stale in another: "Table 6.1" is the objectives table
caption in ch06_conclusion.yaml but a stale pointer to the test-case table in
ch04 and ch05 prose.

Narrative passages that describe the whole report structure are rewritten by
hand rather than here, since they need real prose changes.
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "docs" / "thesis" / "content"

# file -> [(old, new, expected occurrences)]
FIXES: dict[str, list[tuple[str, str, int]]] = {
    "front_matter.yaml": [
        ("පරිච්ඡේදය 4 හි කොටස 4.12 සහ Appendix D", "පරිච්ඡේදය 4 හි කොටස 4.6 සහ Appendix E", 1),
        ("(කොටස 4.12)", "(කොටස 4.6)", 1),
    ],
    "references.yaml": [
        ("Chapter 4, Section 4.12 and Appendix D", "Chapter 4, Section 4.6 and Appendix E", 1),
    ],
    "ch02_literature.yaml": [
        ("පරිච්ඡේදය 7 සීමාවන්", "පරිච්ඡේදය 6 සීමාවන්", 1),
    ],
    "ch03_design.yaml": [
        ("Table 4.1 technology stack", "Table 3.1 technology stack", 1),
    ],
    "ch04_development.yaml": [
        ("Table 4.2 අවදානම් සහ mitigations", "Table 4.1 අවදානම් සහ mitigations", 1),
        ("Table 4.3 ප්‍රධාන REST API endpoints", "Table 4.2 ප්‍රධාන REST API endpoints", 1),
        ("Appendix D හි ඉදිරිපත් කර ඇත", "Appendix E හි ඉදිරිපත් කර ඇත", 1),
        ("(Table 6.1, TC #1 බලන්න)", "(Table 4.4, TC #1 බලන්න)", 1),
        ("Table 4.4 මගින් AI සහාය ලබා ගත්", "Table 4.3 මගින් AI සහාය ලබා ගත්", 1),
        ("පහත Table 6.1 මගින්", "පහත Table 4.4 මගින්", 1),
        ("පරිච්ඡේදය 4 කොටස 4.12", "පරිච්ඡේදය 4 කොටස 4.6", 1),
    ],
    "ch05_evaluation.yaml": [
        ("කොටස 4.12 හි ලේඛනගත කළ", "කොටස 4.6 හි ලේඛනගත කළ", 1),
        ("(Table 6.1, TC #1)", "(Table 4.4, TC #1)", 1),
        ("කොටස 4.12, Appendix D සහ References", "කොටස 4.6, Appendix E සහ References", 1),
    ],
    "ch06_conclusion.yaml": [
        ("කොටස 4.12 සහ Appendix", "කොටස 4.6 සහ Appendix", 1),
        ("Appendix\n    D හි ලේඛනගත", "Appendix\n    E හි ලේඛනගත", 1),
        ("Table 7.1 මගින්", "Table 6.1 මගින්", 1),
        ("Section 4.12; Appendix D;", "Section 4.6; Appendix E;", 1),
    ],
    "supplementary.yaml": [
        ("Table 3.1 මගින් ක්‍රියාත්මක කිරීමේ අදියර පහ", "Table A.1 මගින් ක්‍රියාත්මක කිරීමේ අදියර පහ", 1),
        ("පරිච්ඡේද 6 සහ 7 හි සීමාවක්", "පරිච්ඡේද 5 සහ 6 හි සීමාවක්", 1),
        ("පරිච්ඡේදය 4 කොටස 4.12 හි සහ Appendix D", "පරිච්ඡේදය 4 කොටස 4.6 හි සහ Appendix E", 1),
        ("Table B.1 මගින්", "Table C.1 මගින්", 1),
        ("පරිච්ඡේදය 4 කොටස 4.12 හි සාරාංශගත", "පරිච්ඡේදය 4 කොටස 4.6 හි සාරාංශගත", 1),
    ],
    "bulk.yaml": [
        ("වගුව 4.2", "වගුව 4.1", 1),
        ("වගුව 6.1", "වගුව 4.4", 1),
        ("පරිච්ඡේදය 4 EasyCircular පද්ධතියේ තාක්ෂණික නිර්මාණය", "පරිච්ඡේදය 3 EasyCircular පද්ධතියේ තාක්ෂණික නිර්මාණය", 1),
        ("තක්සේරුව (Phase 5) පරිච්ඡේද 5 සහ 6 ආවරණය කරයි", "තක්සේරුව (Phase 5) පරිච්ඡේදය 5 ආවරණය කරයි", 1),
    ],
}


def main() -> None:
    total = 0
    skipped = 0
    for name, rules in FIXES.items():
        path = CONTENT / name
        text = path.read_text(encoding="utf-8")
        original = text
        applied = 0
        for old, new, expected in rules:
            found = text.count(old)
            if found == 0 and text.count(new) >= expected:
                skipped += 1
                continue
            if found != expected:
                raise SystemExit(f"{name}: expected {expected} of {old!r}, found {found}")
            text = text.replace(old, new)
            total += found
            applied += 1
        if text != original:
            path.write_text(text, encoding="utf-8")
            print(f"  {name:<26} {applied} rules applied")
    print(f"Repointed {total} cross-references ({skipped} already up to date)")


if __name__ == "__main__":
    main()
