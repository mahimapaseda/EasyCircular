import re
from datetime import datetime
from typing import Any

from app.moe_text import DATE_PATTERNS, is_valid_date_text

DATE_PATTERNS_COMPILED = DATE_PATTERNS + [
    re.compile(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b"),
    re.compile(r"\b\d{4}-\d{2}-\d{2}\b"),
]

MONTH_NAME_PATTERN = (
    r"(?:January|February|March|April|May|June|July|August|September|October|November|December)"
)


def _normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\n", " ")).strip()


def _parse_date_key(value: str) -> tuple[int, int, int] | None:
    value = _normalize_whitespace(value)
    if not value:
        return None

    value = re.sub(
        r"^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+",
        "",
        value,
        flags=re.IGNORECASE,
    )

    patterns: list[tuple[re.Pattern[str], str]] = [
        (re.compile(r"^(\d{1,2})\.(\d{2})\.(\d{4})$"), "dmy"),
        (re.compile(r"^(\d{4})\.(\d{2})\.(\d{2})$"), "ymd"),
        (re.compile(r"^(\d{1,2})/(\d{1,2})/(\d{2,4})$"), "dmy"),
        (re.compile(r"^(\d{4})-(\d{2})-(\d{2})$"), "ymd"),
        (
            re.compile(
                rf"^(\d{{1,2}})(?:st|nd|rd|th)?\s+of\s+{MONTH_NAME_PATTERN}\s+(\d{{4}})$",
                re.IGNORECASE,
            ),
            "dmy_words",
        ),
        (
            re.compile(
                rf"^{MONTH_NAME_PATTERN}\s+(\d{{1,2}})(?:st|nd|rd|th)?,?\s+(\d{{4}})$",
                re.IGNORECASE,
            ),
            "mdy_words",
        ),
        (
            re.compile(
                rf"^{MONTH_NAME_PATTERN}\s+(\d{{1,2}})(?:st|nd|rd|th)?\s+(\d{{4}})$",
                re.IGNORECASE,
            ),
            "mdy_words_no_comma",
        ),
    ]

    for pattern, kind in patterns:
        match = pattern.fullmatch(value)
        if not match:
            continue
        try:
            if kind == "dmy":
                day, month, year = int(match.group(1)), int(match.group(2)), int(match.group(3))
                if year < 100:
                    year += 2000
                return (year, month, day)
            if kind == "ymd":
                year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
                return (year, month, day)
            if kind == "dmy_words":
                day = int(match.group(1))
                month_name = match.group(0)
                month_match = re.search(MONTH_NAME_PATTERN, month_name, re.IGNORECASE)
                if not month_match:
                    return None
                year = int(match.group(2))
                month = datetime.strptime(month_match.group(0)[:3], "%b").month
                return (year, month, day)
            if kind == "mdy_words":
                month_match = re.search(MONTH_NAME_PATTERN, value, re.IGNORECASE)
                if not month_match:
                    return None
                day = int(match.group(1))
                year = int(match.group(2))
                month = datetime.strptime(month_match.group(0)[:3], "%b").month
                return (year, month, day)
            if kind == "mdy_words_no_comma":
                month_match = re.search(MONTH_NAME_PATTERN, value, re.IGNORECASE)
                if not month_match:
                    return None
                day = int(match.group(1))
                year = int(match.group(2))
                month = datetime.strptime(month_match.group(0)[:3], "%b").month
                return (year, month, day)
        except ValueError:
            return None

    return None


def _expand_date_keys(value: str) -> set[tuple[int, int, int]]:
    value = _normalize_whitespace(value)
    keys: set[tuple[int, int, int]] = set()

    range_match = re.search(
        r"(\d{1,2}\.\d{2}\.\d{4})\s*(?:to|-)\s*(\d{1,2}\.\d{2}\.\d{4})",
        value,
        re.IGNORECASE,
    )
    if range_match:
        for part in range_match.groups():
            key = _parse_date_key(part)
            if key:
                keys.add(key)
        return keys

    key = _parse_date_key(value)
    if key:
        keys.add(key)
    return keys


def _collect_dates(text: str) -> set[str]:
    normalized = _normalize_whitespace(text)
    dates: set[str] = set()
    for pattern in DATE_PATTERNS_COMPILED:
        for match in pattern.finditer(normalized):
            value = _normalize_whitespace(match.group(0))
            if is_valid_date_text(value):
                dates.add(value)

    for match in re.finditer(
        rf"(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+"
        rf"{MONTH_NAME_PATTERN}\s+\d{{1,2}}(?:st|nd|rd|th)?,?\s+\d{{4}}",
        normalized,
        re.IGNORECASE,
    ):
        dates.add(_normalize_whitespace(match.group(0)))

    for match in re.finditer(
        rf"(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+"
        rf"{MONTH_NAME_PATTERN}\s+\d{{1,2}}(?:st|nd|rd|th)?\s+\d{{4}}",
        normalized,
        re.IGNORECASE,
    ):
        dates.add(_normalize_whitespace(match.group(0)))

    return dates


def _infer_document_year(text: str) -> int | None:
    years = [int(match.group(0)) for match in re.finditer(r"\b20\d{2}\b", text)]
    if not years:
        return None
    return max(set(years), key=years.count)


def _collect_month_day_keys(text: str) -> set[tuple[int, int, int]]:
    normalized = _normalize_whitespace(text)
    year = _infer_document_year(normalized)
    if not year:
        return set()

    keys: set[tuple[int, int, int]] = set()
    for match in re.finditer(
        rf"{MONTH_NAME_PATTERN}\s+(\d{{1,2}})(?:st|nd|rd|th)?(?:,|\s)",
        normalized,
        re.IGNORECASE,
    ):
        month_match = re.search(MONTH_NAME_PATTERN, match.group(0), re.IGNORECASE)
        if not month_match:
            continue
        try:
            month = datetime.strptime(month_match.group(0)[:3], "%b").month
            day = int(match.group(1))
            keys.add((year, month, day))
        except ValueError:
            continue
    return keys


def _collect_loose_day_year_keys(text: str) -> set[tuple[int, int, int]]:
    normalized = _normalize_whitespace(text)
    keys: set[tuple[int, int, int]] = set()

    for match in re.finditer(r"(\d{1,2})(?:st|nd|rd|th)?\s+(20\d{2})\b", normalized):
        day = int(match.group(1))
        year = int(match.group(2))
        window_start = max(0, match.start() - 220)
        window = normalized[window_start:match.start()]
        month_match = None
        for month_candidate in re.finditer(MONTH_NAME_PATTERN, window, re.IGNORECASE):
            month_match = month_candidate
        if not month_match:
            continue
        try:
            month = datetime.strptime(month_match.group(0)[:3], "%b").month
            keys.add((year, month, day))
        except ValueError:
            continue

    return keys


def _collect_date_keys(text: str, entities: list[dict[str, Any]]) -> set[tuple[int, int, int]]:
    keys: set[tuple[int, int, int]] = set()
    normalized = _normalize_whitespace(text)

    for date in _collect_dates(normalized):
        keys.update(_expand_date_keys(date))

    for entity in entities:
        if entity.get("label") != "DATE":
            continue
        value = _normalize_whitespace(str(entity.get("text", "")))
        if is_valid_date_text(value):
            keys.update(_expand_date_keys(value))

    keys.update(_collect_month_day_keys(normalized))
    keys.update(_collect_loose_day_year_keys(normalized))

    return keys


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
    allowed_keys = _collect_date_keys(source_text, entities)
    summary_blob = _summary_text_blob(summary)
    summary_dates = _collect_dates(summary_blob)
    warnings: list[str] = []

    for date in sorted(summary_dates):
        summary_keys = _expand_date_keys(date)
        if not summary_keys:
            continue
        if any(key in allowed_keys for key in summary_keys):
            continue
        warnings.append(
            f"Date '{date}' appears in the summary but was not found in the source text."
        )

    return warnings
