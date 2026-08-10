"""MOE circular text heuristics tuned on sample circulars."""

from __future__ import annotations

import re
from typing import Literal

LanguageHint = Literal["en", "si", "ta", "mixed"]

CIRCULAR_NUMBER_PATTERNS = [
    re.compile(
        r"(?:Circular\s*(?:Number|No\.?)\s*[:\-]?\s*)(\d{1,4}\s*/\s*\d{2,4}(?:\s*\([a-z]\))?)",
        re.IGNORECASE,
    ),
    # Sinhala: චක්‍රලේඛ අංක : 03 /2014 (1)  and  අංක 2010/22 චක්‍රලේඛය
    re.compile(
        r"(?:චක්[\u200d]?රලේඛ[යු]?\s*අංක\s*[:\-]?\s*)(\d{1,4}\s*/\s*\d{2,4}(?:\s*\([^)]+\))?)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:අංක\s+)(\d{1,4}\s*/\s*\d{2,4})(?:\s*චක්[\u200d]?රලේඛ)",
        re.IGNORECASE,
    ),
    # Tamil: சுற்றறிக்கை / சுற்றுநிருபம் இலக்கம் 23/2026 (OCR variants)
    re.compile(
        r"(?:சுற்ற(?:றிக்கை|றிக்கை)|சுற்றுநிருப(?:ம்|த்தின்)?)\s*"
        r"(?:இல(?:க்)?கம்?|இல\.?|எண்)\s*[:\-]?\s*(\d{1,4}\s*/\s*\d{2,4})",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:இலக்கம்|இல\.?)\s*[:\-]?\s*(\d{1,4}\s*/\s*\d{2,4})",
        re.IGNORECASE,
    ),
    # "Circular No. 2006/44 (i)" year-first form
    re.compile(r"(?:Circular\s*No\.?\s*)(\d{4}\s*/\s*\d{1,4}(?:\s*\([a-z]\))?)", re.IGNORECASE),
    # OCR variants with hyphen glued: "Circular No.- 10/2026"
    re.compile(
        r"(?:Circular\s*(?:Number|No\.?)\s*[-:.]+\s*)(\d{1,4}\s*/\s*\d{2,4}(?:\s*\([a-z]\))?)",
        re.IGNORECASE,
    ),
]

ED_REF_PATTERN = re.compile(
    r"\bED/\d{2}(?:/\d{2}){1,4}(?:/\d{3})?(?:-\d{4})?\b",
    re.IGNORECASE,
)

LETTERHEAD_MARKERS = (
    "ministry of education",
    "higher education and vocational education",
    "battaramulla",
    "moe.gov",
    "www.moe",
    "my ref",
    "your ref",
    "මගේ යොමුව",
    "ඔබේ යොමුව",
    "අධ්‍යාපන",
    "චක්‍රලේඛ",
    "கல்வி",
    "அமைச்சு",
    "இசுருபாய",
    "எனது இல",
    "உமது இல",
    "சுற்றறிக்கை",
    "சுற்றுநிருபம்",
)

RECIPIENT_PREFIXES = (
    "all ",
    "commissioner ",
    "director ",
    "secretary ",
    "secretaries ",
    "heads of ",
    "head of ",
    "principals of ",
    "principal of ",
    "chairman",
    "chief ",
    "president ",
    "managers of ",
    "manager of ",
    "programme ",
    "project ",
    "subject ",
    "accountants",
    "annexure",
    "please fill",
    "register of",
    "kruthyadhikari",
    "parivenadhipathi",
    "parivenacharya",
)

# Role/institution lines that are still recipients even without "All …" prefixes.
RECIPIENT_ROLE_MARKERS = (
    "of all the",
    "in the island",
    "pirivena",
    "parivena",
    "bhikku training",
    "seelamaatha",
    "educational institutions in the island",
)

SUBJECT_STOP_MARKERS = (
    re.compile(r"^\d{1,2}\s*[\.\)]\s+"),
    re.compile(r"^the provisions of this circular", re.IGNORECASE),
    re.compile(r"^in accordance with", re.IGNORECASE),
    re.compile(r"^refer(?:ence)?\s", re.IGNORECASE),
    re.compile(r"^accordingly[,.]?", re.IGNORECASE),
    re.compile(r"^therefore[,.]?", re.IGNORECASE),
)

# First line of circular body (not a recipient / short subject title).
BODY_START_PATTERN = re.compile(
    r"^(?:it\s+is\s+(?:hereby\s+)?(?:mandatory|notified|informed|decided)|"
    r"it\s+is\s+hereby|"
    r"the\s+provisions|"
    r"this\s+circular|"
    r"accordingly[,.]?|"
    r"\d{1,2}\s*[\.\)])",
    re.IGNORECASE,
)

POLICY_SUBJECT_PATTERN = re.compile(
    r"(?:establishing|providing|regarding|implement(?:ing)?|celebrat|duty hours|"
    r"actions have|financial incentive|vesak week|amending|conducting|organizing|organising|"
    r"mandatory\s+to\s+consider|ten-day\s+teacher\s+train)",
    re.IGNORECASE,
)

ACTION_SENTENCE_PATTERN = re.compile(
    r"(?:\b(?:must|shall|should|required to|need to|arranged to|expected to|"
    r"instructed to|directed to|requested to|ensure|implement|submit|complete|"
    r"conduct|organize|organise|celebrate|observe|report|forward|inform|"
    r"mandatory|hereby|to be (?:considered|mentioned|confirmed|implemented))\b)",
    re.IGNORECASE,
)

# Common OCR / letterhead fragments that must never become entities or parties.
LETTERHEAD_NOISE_PATTERN = re.compile(
    r"^(?:இலங்கை|ශ්‍රී\s*ලංකාව?|sri\s*lanka|st\s*lanka|battaramulla|isurupaya|"
    r"buddhist|trainin|camscanner|lanka|moe\.gov\.lk|www\.moe)$",
    re.IGNORECASE,
)

DATE_PATTERNS = [
    re.compile(r"\b\d{4}\.\d{2}\.\d{2}\b"),
    re.compile(r"\b\d{1,2}\.\d{2}\.\d{4}\b"),
    re.compile(r"\b\d{1,2}\s*/\s*\d{1,2}\s*/\s*\d{2,4}\b"),
    re.compile(r"\b\d{4}-\d{2}-\d{2}\b"),
    re.compile(
        r"\b\d{1,2}(?:st|nd|rd|th)?\s+of\s+"
        r"(?:January|February|March|April|May|June|July|August|September|October|November|December)"
        r"\s+\d{4}\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)"
        r"\s+\d{1,2},?\s+\d{4}\b",
        re.IGNORECASE,
    ),
    re.compile(r"\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b", re.IGNORECASE),
]

NOISE_DATE_PATTERN = re.compile(
    r"^(?:\d{9,}|\d{1,2}\.?$|daily|weekly|monthly|annual|week day|saturday|years?\s+\d+|more than \d+ years)$",
    re.IGNORECASE,
)


def normalize_moe_text(text: str) -> str:
    text = text.replace("\x00", "")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    # Common OCR word breaks seen on CamScanner MOE PDFs
    text = re.sub(r"\btrainin[,.]?\s*rogramme\b", "training programme", text, flags=re.IGNORECASE)
    text = re.sub(r"\bsuch[_\s]+in\b", "such in", text, flags=re.IGNORECASE)
    text = re.sub(r"\bSt\s+Lanka\b", "Sri Lanka", text)
    # OCR often inserts underscore before short words: "_at", "_the"
    text = re.sub(r"\b_([a-zA-Z]{2,})\b", r"\1", text)
    text = re.sub(r"\s+_", " ", text)
    return text.strip()


def detect_language_hint(text: str) -> LanguageHint:
    sample = text[:4000]
    latin = len(re.findall(r"[A-Za-z]", sample))
    sinhala = len(re.findall(r"[\u0D80-\u0DFF]", sample))
    tamil = len(re.findall(r"[\u0B80-\u0BFF]", sample))
    dominant = max(latin, sinhala, tamil)
    if dominant == 0:
        return "en"
    kinds = sum(1 for count in (latin, sinhala, tamil) if count > dominant * 0.2)
    if kinds >= 2:
        return "mixed"
    if sinhala == dominant:
        return "si"
    if tamil == dominant:
        return "ta"
    return "en"


def extract_circular_number(text: str, filename: str | None = None) -> str | None:
    header = "\n".join(text.splitlines()[:30])
    matches: list[str] = []
    for pattern in CIRCULAR_NUMBER_PATTERNS:
        for match in pattern.finditer(header):
            normalized = re.sub(r"\s+", "", match.group(1))
            if normalized not in matches:
                matches.append(normalized)

    if filename:
        stem = re.sub(r"\.pdf$", "", filename, flags=re.IGNORECASE)
        file_match = re.match(r"^(\d{1,4})-(\d{4})", stem)
        if file_match:
            preferred = f"{file_match.group(1)}/{file_match.group(2)}"
            for candidate in matches:
                if candidate.startswith(preferred):
                    return candidate
            return preferred
        file_match = re.match(r"^(\d{4})-(\d{4})", stem)
        if file_match:
            preferred = f"{file_match.group(1)}/{file_match.group(2)}"
            for candidate in matches:
                if candidate.startswith(preferred):
                    return candidate
            return preferred

    return matches[0] if matches else None


def is_letterhead_line(line: str) -> bool:
    lowered = line.lower().strip()
    if not lowered or len(lowered) < 4:
        return True
    return any(marker in lowered for marker in LETTERHEAD_MARKERS)


def is_recipient_line(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return True
    if len(stripped) < 8:
        return True
    if stripped.startswith("-") and len(stripped) < 50:
        return True
    if re.match(r"^සියලු\s", stripped):
        return True
    if stripped.endswith("වෙත") and len(stripped) < 80:
        return True
    lowered = stripped.lower()
    if BODY_START_PATTERN.search(stripped):
        return False
    if ACTION_SENTENCE_PATTERN.search(stripped) and len(stripped) > 60:
        return False
    if lowered.startswith(RECIPIENT_PREFIXES):
        return True
    if any(marker in lowered for marker in RECIPIENT_ROLE_MARKERS) and len(stripped) < 140:
        # Role lists like "Kruthyadhikari/Parivenadhipathi of all the Pirivenas…"
        if not POLICY_SUBJECT_PATTERN.search(stripped) or lowered.startswith(
            ("kruthyadhikari", "parivenadhipathi", "heads of", "head of")
        ):
            return True
    if re.match(r"^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4},?$", stripped) and len(stripped) < 60:
        return True
    if stripped.endswith(":") and len(stripped) < 80:
        return True
    if POLICY_SUBJECT_PATTERN.search(stripped):
        return False
    if re.search(r"(?:වැඩසටහන|ඩෙංගු|සංශෝධනය)", stripped):
        return False
    return False


def _is_subject_stop(line: str) -> bool:
    return any(pattern.search(line.strip()) for pattern in SUBJECT_STOP_MARKERS)


def _is_circular_meta_line(line: str) -> bool:
    if any(pattern.search(line) for pattern in CIRCULAR_NUMBER_PATTERNS):
        return True
    if ED_REF_PATTERN.search(line) and len(line) < 80:
        return True
    if re.search(r"^circular\s+no", line, re.IGNORECASE):
        return True
    return False


def extract_subject(text: str) -> str | None:
    text = normalize_moe_text(text)
    lines = [line.strip() for line in text.splitlines()]

    # "Annexure" headings in English, Tamil (incl. common OCR variant), Sinhala
    annexure_pattern = r"^(?:annexure\b|இணைப்பு|இகைப்பு|ඇමුණුම)"
    for index, line in enumerate(lines[:20]):
        if re.match(annexure_pattern, line, re.IGNORECASE):
            for candidate in lines[index + 1 : index + 8]:
                if not candidate or is_recipient_line(candidate):
                    continue
                cleaned = re.sub(r"\s+", " ", candidate).strip()
                if len(cleaned) >= 30:
                    return cleaned[:500]

    phase = "header"
    subject_lines: list[str] = []

    for line in lines:
        if not line:
            if phase == "subject" and subject_lines:
                break
            continue

        if phase == "header":
            if any(pattern.search(line) for pattern in CIRCULAR_NUMBER_PATTERNS) or ED_REF_PATTERN.search(line):
                phase = "recipients"
            continue

        if phase == "recipients":
            if is_letterhead_line(line) or _is_circular_meta_line(line):
                continue
            if BODY_START_PATTERN.search(line) or POLICY_SUBJECT_PATTERN.search(line) or re.search(
                r"(?:වැඩසටහන|ඩෙංගු|සංශෝධනය)",
                line,
            ):
                phase = "subject"
                subject_lines = [line]
                continue
            if is_recipient_line(line):
                continue
            if len(line) >= 40 and ACTION_SENTENCE_PATTERN.search(line):
                phase = "subject"
                subject_lines = [line]
                continue
            if len(line) >= 25:
                phase = "subject"
                subject_lines = [line]
            continue

        if phase == "subject":
            if _is_subject_stop(line):
                break
            # Keep wrapping OCR lines that continue the same sentence.
            if subject_lines and (
                line[0].islower()
                or (
                    not subject_lines[-1].rstrip().endswith((".", "!", "?"))
                    and not BODY_START_PATTERN.search(line)
                    and not is_recipient_line(line)
                )
            ):
                subject_lines.append(line)
                # Stop once we have a complete sentence long enough for a subject.
                joined = re.sub(r"\s+", " ", " ".join(subject_lines)).strip()
                if joined.endswith((".", "!", "?")) and len(joined) >= 60:
                    break
                continue
            if subject_lines:
                break
            if len(line) >= 15:
                subject_lines.append(line)

    subject = re.sub(r"\s+", " ", " ".join(subject_lines)).strip()
    if len(subject) < 15:
        return None
    return subject[:500]


def extract_body_text(text: str) -> str:
    subject = extract_subject(text)
    if not subject:
        return text

    index = text.find(subject)
    if index == -1:
        return text
    return text[index + len(subject) :].strip()


def extract_key_requirements(text: str, max_items: int = 8) -> list[str]:
    body = extract_body_text(text)
    sentences = re.split(r"(?<=[.!?])\s+", body)
    requirements: list[str] = []
    seen: set[str] = set()

    for sentence in sentences:
        cleaned = re.sub(r"\s+", " ", sentence).strip()
        if len(cleaned) < 40 or len(cleaned) > 500:
            continue
        # Skip OCR fragments that start mid-clause.
        if cleaned[0].islower():
            continue
        if not ACTION_SENTENCE_PATTERN.search(cleaned):
            continue
        if is_recipient_line(cleaned):
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        requirements.append(cleaned)
        if len(requirements) >= max_items:
            break

    return requirements


def extract_action_items(text: str, entities: list[dict] | None = None, max_items: int = 6) -> list[str]:
    items = extract_key_requirements(text, max_items=max_items)
    if items:
        return items

    dates = collect_valid_dates(text, entities)
    fallback: list[str] = []
    if dates:
        fallback.append(f"Note key dates: {', '.join(dates[:5])}.")
    fallback.append("Review the full circular text and confirm requirements with the original PDF.")
    return fallback


def collect_valid_dates(text: str, entities: list[dict] | None = None) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()

    for pattern in DATE_PATTERNS:
        for match in pattern.finditer(text):
            value = match.group(0).strip()
            if is_valid_date_text(value):
                if value not in seen:
                    seen.add(value)
                    found.append(value)

    if entities:
        for entity in entities:
            if entity.get("label") != "DATE":
                continue
            value = str(entity.get("text", "")).strip()
            if is_valid_date_text(value) and value not in seen:
                seen.add(value)
                found.append(value)

    return found[:12]


def is_valid_date_text(value: str) -> bool:
    value = value.strip()
    if not value or len(value) < 4:
        return False
    if NOISE_DATE_PATTERN.match(value):
        return False
    if re.fullmatch(r"\d{9,}", value):
        return False
    if ED_REF_PATTERN.fullmatch(value) or ED_REF_PATTERN.search(value):
        return False
    if re.fullmatch(r"\d{1,2}/\d{2}/\d{2}", value):
        return False
    if any(pattern.search(value) for pattern in DATE_PATTERNS):
        return True
    if re.fullmatch(r"\d{4}", value) and 2000 <= int(value) <= 2100:
        return True
    return False


def build_summary_title(text: str, filename: str | None = None) -> str:
    text = normalize_moe_text(text)
    circular_no = extract_circular_number(text, filename)
    subject = extract_subject(text)
    # Annexure-only PDFs (e.g. 23-2026-En): prefer circular + annexure label over form gibberish
    if subject and re.match(r"^annexure\b", subject, re.IGNORECASE) and circular_no:
        return f"MOE Circular {circular_no}: {subject[:80]}"
    if circular_no and subject:
        short_subject = subject if len(subject) <= 80 else f"{subject[:77]}..."
        return f"MOE Circular {circular_no}: {short_subject}"
    if circular_no:
        # Filename-backed circulars whose body is only an annexure form
        if re.search(r"\bannexure\b", text[:800], re.IGNORECASE):
            return f"MOE Circular {circular_no}: Annexure / staff return form"
        return f"MOE Circular {circular_no}"
    if subject and not is_recipient_line(subject):
        return subject if len(subject) <= 100 else f"{subject[:97]}..."
    return "MOE circular summary"


def top_org_entities(entities: list[dict], limit: int = 8) -> list[str]:
    priority_terms = (
        "ministry of education",
        "department of",
        "national institute",
        "provincial",
        "zonal",
        "examinations",
        "commission",
        "pirivena",
        "parivena",
        "teacher training",
    )
    orgs = [str(e.get("text", "")).strip() for e in entities if e.get("label") == "ORG"]
    unique: list[str] = []
    seen: set[str] = set()

    def add_org(value: str) -> None:
        cleaned = value.strip().strip(",.;:")
        key = cleaned.lower()
        if not cleaned or key in seen or len(cleaned) < 6:
            return
        if LETTERHEAD_NOISE_PATTERN.match(cleaned):
            return
        if is_letterhead_line(cleaned) and "ministry" not in key and "education" not in key:
            return
        seen.add(key)
        unique.append(cleaned)

    for org in orgs:
        if any(term in org.lower() for term in priority_terms):
            add_org(org)

    for org in orgs:
        add_org(org)
        if len(unique) >= limit:
            break

    return unique[:limit]


def extract_issued_date(text: str) -> str | None:
    """Extract the date the circular was issued from the header area."""
    header_lines = text.splitlines()[:15]
    header = "\n".join(header_lines)

    # Try common MOE header date formats: "2026.03.15", "04.05.2026", "2026-03-15"
    for pattern in DATE_PATTERNS:
        match = pattern.search(header)
        if match:
            value = match.group(0).strip()
            if is_valid_date_text(value):
                return value

    return None


def extract_target_audience(text: str) -> list[str]:
    """Extract the list of recipients from the circular header.

    These are the lines that ``is_recipient_line`` would normally filter out,
    but they are valuable structured metadata (e.g.,
    "All Provincial Education Secretaries").
    """
    lines = [line.strip() for line in text.splitlines()]
    audience: list[str] = []
    seen: set[str] = set()
    in_recipients = False
    blank_streak = 0

    for line in lines[:50]:
        if not line:
            if in_recipients and audience:
                blank_streak += 1
                # MOE lists often have a blank between recipients; only stop after
                # a larger gap that usually precedes the body.
                if blank_streak >= 2:
                    break
            continue

        blank_streak = 0

        if any(pattern.search(line) for pattern in CIRCULAR_NUMBER_PATTERNS) or ED_REF_PATTERN.search(line):
            in_recipients = True
            continue

        if in_recipients:
            if POLICY_SUBJECT_PATTERN.search(line) or BODY_START_PATTERN.search(line) or _is_subject_stop_line(line):
                break

            if is_recipient_line(line) and len(line) >= 8:
                cleaned = re.sub(r"^[-–•]\s*", "", line).strip()
                if cleaned and cleaned not in seen and len(cleaned) >= 8:
                    seen.add(cleaned)
                    audience.append(cleaned)
                continue

            # Non-recipient substantive line ends the recipient block.
            if len(line) >= 25:
                break

    return audience[:15]


def _is_subject_stop_line(line: str) -> bool:
    """Check if a line signals the start of the body/subject."""
    return any(pattern.search(line.strip()) for pattern in SUBJECT_STOP_MARKERS)


def extract_effective_date(text: str) -> str | None:
    """Extract when the circular takes effect.

    Looks for phrases like 'with immediate effect', 'effective from',
    'from 01 April 2026', 'w.e.f.', etc.
    """
    # Normalise for searching
    search_text = " ".join(text.splitlines()[:60])

    # "with immediate effect"
    if re.search(r"with\s+immediate\s+effect", search_text, re.IGNORECASE):
        return "With immediate effect"

    # "w.e.f. <date>" or "with effect from <date>"
    wef_match = re.search(
        r"(?:w\.?\s*e\.?\s*f\.?|with\s+effect\s+from|effective\s+from)\s+"
        r"(\d{1,2}[\./]\d{2}[\./]\d{4}|\d{4}[\./]\d{2}[\./]\d{2}|"
        r"\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?"
        r"(?:January|February|March|April|May|June|July|August|September|October|November|December)"
        r"\s+\d{4})",
        search_text,
        re.IGNORECASE,
    )
    if wef_match:
        return wef_match.group(1).strip()

    # "from <date>" near the end of a sentence about implementation
    from_match = re.search(
        r"(?:shall\s+(?:be\s+)?(?:implemented|applicable|enforced|effective)|"
        r"(?:implemented|applicable|enforced)\s+)"
        r"(?:from|starting)\s+"
        r"(\d{1,2}[\./]\d{2}[\./]\d{4}|\d{4}[\./]\d{2}[\./]\d{2}|"
        r"\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)"
        r"\s+\d{4})",
        search_text,
        re.IGNORECASE,
    )
    if from_match:
        return from_match.group(1).strip()

    return None
