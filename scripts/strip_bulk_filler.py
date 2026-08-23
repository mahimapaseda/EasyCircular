#!/usr/bin/env python3
"""Remove templated filler paragraphs from bulk.yaml.

Padding paragraphs were added to reach the page target. They repeat one sentence
verbatim and differ only by a counter in a trailing bracket, e.g.
"(intro විස්තර 1: ports ...)" / "(intro විස්තර 2: ports ...)". Chapter 4 carried
21 copies, two or three inside every section.

Edits at the YAML block level rather than reserializing, so paragraphs that are
kept retain their original line wrapping and quoting.
"""

from __future__ import annotations

import collections
import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
BULK = ROOT / "docs/thesis/content/bulk.yaml"

FILLER = re.compile(r"\([A-Za-z_0-9]+ විස්තර \d+:")
EXPECTED_REMOVALS = 71

ITEM_START = re.compile(r"^ {4}- ")
CONTINUATION = re.compile(r"^ {6}\S")
CHAPTER_KEY = re.compile(r"^([a-z0-9_]+):")


def split_items(lines: list[str]) -> list[list[str]]:
    """Group lines into blocks; a paragraph list item plus its wrapped lines."""
    blocks: list[list[str]] = []
    for line in lines:
        if ITEM_START.match(line):
            blocks.append([line])
        elif blocks and CONTINUATION.match(line) and ITEM_START.match(blocks[-1][0]):
            blocks[-1].append(line)
        else:
            blocks.append([line])
    return blocks


def main() -> None:
    original = BULK.read_text(encoding="utf-8")
    before = yaml.safe_load(original)

    chapter = ""
    removed: collections.Counter[str] = collections.Counter()
    kept_lines: list[str] = []

    for block in split_items(original.splitlines(keepends=True)):
        head = block[0]
        match = CHAPTER_KEY.match(head)
        if match:
            chapter = match.group(1)

        if ITEM_START.match(head) and FILLER.search(" ".join(l.strip() for l in block)):
            removed[chapter] += 1
            continue
        kept_lines.extend(block)

    total = sum(removed.values())
    if total != EXPECTED_REMOVALS:
        raise SystemExit(f"Expected {EXPECTED_REMOVALS} filler paragraphs, matched {total}")

    updated = "".join(kept_lines)
    after = yaml.safe_load(updated)

    def paragraph_count(data: dict) -> int:
        return sum(
            len(body.get("paragraphs") or [])
            for sections in data.values()
            for body in (sections or {}).values()
        )

    if paragraph_count(before) - paragraph_count(after) != total:
        raise SystemExit("Paragraph count mismatch after edit; aborting")

    for name in before:
        if set((before[name] or {})) != set((after.get(name) or {})):
            raise SystemExit(f"Section keys changed in {name}; aborting")

    BULK.write_text(updated, encoding="utf-8")

    for name in sorted(removed):
        print(f"  {name:<18} removed {removed[name]:>2}")
    print(f"Removed {total} filler paragraphs; {paragraph_count(after)} bulk paragraphs remain")


if __name__ == "__main__":
    main()
