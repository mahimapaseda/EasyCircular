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


_GENERIC_HALLMARKS = frozenset(
    {
        "ministry of education",
        "higher education",
        "vocational education",
        "sri lanka",
        "circular no",
        "circular number",
        "key requirements",
        "target audience",
        "provincial councils",
        "provincial directors",
        "zonal directors",
        "national schools",
        "educational institutions",
        "teacher training",
        "teacher training colleges",
        "heads of department",
        "responsible parties",
        "action items",
        "general education",
    }
)

_CIRCULAR_NUMBER_TOKEN = re.compile(
    r"\b(\d{1,4}\s*/\s*\d{2,4}(?:\s*\([a-z0-9]+\))?)\b",
    re.IGNORECASE,
)


def _is_plausible_circular_number(value: str) -> bool:
    compact = re.sub(r"\s+", "", value or "")
    match = re.match(r"^(\d{1,4})/(\d{2,4})(?:\([a-z0-9]+\))?$", compact, re.IGNORECASE)
    if not match:
        return False
    first, second = int(match.group(1)), int(match.group(2))
    return first >= 1990 or second >= 1990


def _normalize_circular_token(value: str) -> str:
    compact = re.sub(r"\s+", "", (value or "").lower())
    return re.sub(r"\([^)]*\)", "", compact)


def _quoted_phrases(text: str) -> list[str]:
    return [
        phrase.strip()
        for phrase in re.findall(r"[\"'“‘]([^\"”’]{6,80})[\"'”’]", text or "")
        if phrase.strip()
    ]


def _title_case_phrases(text: str) -> list[str]:
    phrases = re.findall(r"\b(?:[A-Z][a-z]+(?:[\s-][A-Z]?[a-z]+){1,5})\b", text or "")
    hyphenated = re.findall(r"\b[A-Z][a-z]+(?:-[A-Za-z]+){1,3}\b", text or "")
    return phrases + hyphenated


def _gold_text_blob(example: dict) -> str:
    gold = example.get("gold") or {}
    parts = [
        str(gold.get("title") or ""),
        str(example.get("source_excerpt") or ""),
    ]
    for section in gold.get("sections") or []:
        parts.append(str(section.get("heading") or ""))
        parts.append(str(section.get("content") or ""))
    parts.extend(str(item) for item in (gold.get("actionItems") or []))
    return "\n".join(parts)


def _hallmarks_from_example(example: dict) -> list[str]:
    blob = _gold_text_blob(example)
    phrases: list[str] = []
    seen: set[str] = set()
    for phrase in _quoted_phrases(blob) + _title_case_phrases(blob):
        cleaned = re.sub(r"\s+", " ", phrase).strip()
        key = cleaned.lower()
        if len(cleaned) < 8 or key in seen or key in _GENERIC_HALLMARKS:
            continue
        if any(generic == key or generic in key for generic in _GENERIC_HALLMARKS if len(generic) > 12):
            continue
        seen.add(key)
        phrases.append(cleaned)
    return phrases


def _example_matches_document(
    example: dict,
    *,
    source_text: str,
    filename: str | None,
    document_circular: str | None,
) -> bool:
    blob = f"{filename or ''}\n{source_text or ''}".lower()
    example_id = str(example.get("id") or "").lower()
    gold_number = _normalize_circular_token(
        str((example.get("gold") or {}).get("circularNumber") or "")
    )
    if example_id and example_id in blob.replace("/", "-"):
        return True
    if document_circular and gold_number:
        doc_token = _normalize_circular_token(document_circular)
        if gold_number == doc_token or gold_number in doc_token or doc_token in gold_number:
            return True
    if gold_number and gold_number in _normalize_circular_token(blob.replace("-", "/")):
        return True

    excerpt = str(example.get("source_excerpt") or "")
    excerpt_tokens = set(re.findall(r"[a-z0-9]{4,}", excerpt.lower()))
    source_tokens = set(re.findall(r"[a-z0-9]{4,}", (source_text or "").lower()))
    if excerpt_tokens and source_tokens:
        recall = len(excerpt_tokens & source_tokens) / len(excerpt_tokens)
        if recall >= 0.35:
            return True
    return False


def detect_topic_bleed(
    source_text: str,
    summary: dict[str, Any],
    *,
    filename: str | None = None,
    fewshot_examples: list[dict] | None = None,
    document_circular: str | None = None,
) -> list[str]:
    """Flag summaries that copied another few-shot's topic or circular number."""
    source_blob = f"{filename or ''}\n{source_text or ''}"
    source_lower = source_blob.lower()
    summary_blob = _summary_text_blob(summary)
    summary_lower = summary_blob.lower()
    warnings: list[str] = []

    for example in fewshot_examples or []:
        if _example_matches_document(
            example,
            source_text=source_text,
            filename=filename,
            document_circular=document_circular,
        ):
            continue
        for phrase in _hallmarks_from_example(example):
            if phrase.lower() in summary_lower and phrase.lower() not in source_lower:
                example_id = example.get("id") or "few-shot"
                warnings.append(
                    f"Topic bleed: summary mentions '{phrase}' from {example_id}, "
                    "which is not in the source text."
                )
                break

    doc_token = _normalize_circular_token(document_circular or "")
    cited = {
        match.group(1)
        for match in _CIRCULAR_NUMBER_TOKEN.finditer(summary_blob)
        if _is_plausible_circular_number(match.group(1))
    }
    for cited_number in sorted(cited):
        cited_token = _normalize_circular_token(cited_number)
        if doc_token and (
            cited_token == doc_token
            or cited_token.startswith(doc_token)
            or doc_token.startswith(cited_token)
        ):
            continue
        compact_cited = re.sub(r"\s+", "", cited_number)
        if compact_cited.lower() in re.sub(r"\s+", "", source_lower):
            continue
        hyphenated = compact_cited.replace("/", "-")
        if hyphenated.lower() in source_lower.replace("/", "-"):
            continue
        warnings.append(
            f"Topic bleed: summary cites circular {compact_cited} which is not "
            "this document and not in the source."
        )

    return warnings
