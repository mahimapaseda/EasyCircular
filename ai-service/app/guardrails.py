import re
from typing import Any

from app.moe_text import DATE_PATTERNS, is_valid_date_text

DATE_PATTERNS_COMPILED = DATE_PATTERNS + [
    re.compile(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b"),
    re.compile(r"\b\d{4}-\d{2}-\d{2}\b"),
]


def _collect_dates(text: str) -> set[str]:
    dates: set[str] = set()
    for pattern in DATE_PATTERNS_COMPILED:
        for match in pattern.finditer(text):
            value = match.group(0).strip()
            if is_valid_date_text(value):
                dates.add(value)
    return dates


def _summary_text_blob(summary: dict[str, Any]) -> str:
    parts: list[str] = [summary.get("title") or ""]
    for section in summary.get("sections") or []:
        parts.append(section.get("heading") or "")
        parts.append(section.get("content") or "")
    parts.extend(summary.get("actionItems") or [])
    parts.append(summary.get("rawMarkdown") or "")
    return "\n".join(parts)


def verify_summary_dates(
    source_text: str,
    entities: list[dict[str, Any]],
    summary: dict[str, Any],
) -> list[str]:
    allowed = _collect_dates(source_text)
    for entity in entities:
        if entity.get("label") == "DATE":
            value = str(entity.get("text", "")).strip()
            if is_valid_date_text(value):
                allowed.add(value)

    summary_dates = _collect_dates(_summary_text_blob(summary))
    warnings: list[str] = []

    for date in sorted(summary_dates):
        if date not in allowed:
            warnings.append(
                f"Date '{date}' appears in the summary but was not found in the source text."
            )

    return warnings
