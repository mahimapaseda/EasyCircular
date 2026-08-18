"""Output language for circular briefs (Sinhala / Tamil / English)."""

from __future__ import annotations

import re
from typing import Any, Literal

from app.moe_text import detect_language_hint
from app.ocr_languages import filename_script_hint

SummaryLang = Literal["en", "si", "ta"]

LANG_LABEL: dict[SummaryLang, str] = {
    "en": "English",
    "si": "Sinhala",
    "ta": "Tamil",
}

FALLBACK_HEADINGS: dict[SummaryLang, dict[str, str]] = {
    "en": {
        "purpose": "Purpose",
        "audience": "Target audience",
        "requirements": "Key requirements",
        "legal": "Legal and circular references",
        "dates": "Deadlines and dates",
        "parties": "Responsible parties",
        "actions": "Action items",
        "empty_title": "MOE circular summary",
        "empty_purpose": (
            "No usable circular text was available to summarize. "
            "Re-run Extract so OCR can read the scanned PDF, then generate the brief again."
        ),
        "empty_action": "Re-run Extract on the original PDF, then generate the brief again.",
        "missing_purpose": "See the circular text for full context.",
        "title_prefix": "MOE Circular",
        "annexure": "Annexure / staff return form",
        "generic_title": "MOE circular summary",
    },
    "si": {
        "purpose": "අරමුණ",
        "audience": "ඉලක්කගත පිරිස",
        "requirements": "ප්‍රධාන අවශ්‍යතා",
        "legal": "නීතිමය සහ චක්‍රලේඛ යොමු",
        "dates": "නියමිත දිනයන්",
        "parties": "වගකිවයුතු පාර්ශ්ව",
        "actions": "ක්‍රියාමාර්ග",
        "empty_title": "චක්‍රලේඛ සාරාංශය",
        "empty_purpose": (
            "සාරාංශයක් සැකසීමට ප්‍රමාණවත් චක්‍රලේඛ පෙළක් නොතිබුණි. "
            "Extract නැවත ධාවනය කර OCR මගින් PDF කියවා, ඉන්පසු සාරාංශය ජනනය කරන්න."
        ),
        "empty_action": "මුල් PDF එක Extract කර, ඉන්පසු සාරාංශය ජනනය කරන්න.",
        "missing_purpose": "සම්පූර්ණ සන්දර්භය සඳහා චක්‍රලේඛ පෙළ බලන්න.",
        "title_prefix": "චක්‍රලේඛය",
        "annexure": "උපග්‍රන්ථය / කාර්ය මණ්ඩල පෝරමය",
        "generic_title": "අධ්‍යාපන අමාත්‍යාංශ චක්‍රලේඛ සාරාංශය",
    },
    "ta": {
        "purpose": "நோக்கம்",
        "audience": "இலக்கு பெறுநர்கள்",
        "requirements": "முக்கிய தேவைகள்",
        "legal": "சட்ட மற்றும் சுற்றறிக்கை குறிப்புகள்",
        "dates": "காலக்கெடுக்கள்",
        "parties": "பொறுப்பான தரப்பினர்",
        "actions": "நடவடிக்கைகள்",
        "empty_title": "சுற்றறிக்கை சுருக்கம்",
        "empty_purpose": (
            "சுருக்கம் தயாரிக்க போதுமான உரை இல்லை. Extract ஐ மீண்டும் இயக்கி OCR மூலம் PDF ஐப் படியுங்கள்."
        ),
        "empty_action": "மூல PDF ஐ Extract செய்து பின்னர் சுருக்கத்தை உருவாக்குங்கள்.",
        "missing_purpose": "முழு சூழலுக்கும் சுற்றறிக்கை உரையைப் பார்க்கவும்.",
        "title_prefix": "சுற்றறிக்கை",
        "annexure": "இணைப்பு / படிவம்",
        "generic_title": "கல்வி அமைச்சு சுற்றறிக்கை சுருக்கம்",
    },
}

_HEADING_KEYS = (
    "purpose",
    "audience",
    "requirements",
    "legal",
    "dates",
    "parties",
    "actions",
    "annexure",
)

_HEADING_ALIASES = {
    "purpose": ("purpose", "introduction"),
    "audience": ("target audience", "audience"),
    "requirements": ("key requirements", "requirements"),
    "legal": ("legal and circular references", "legal & circular references"),
    "dates": ("deadlines and dates", "deadlines & dates"),
    "parties": ("responsible parties",),
    "actions": ("action items", "actions"),
    "annexure": ("annexure / staff return form", "annexure"),
}

# Longest phrases first. Used when the 3B model cannot be trusted on a whole brief.
_GLOSSARY: dict[tuple[SummaryLang, SummaryLang], list[tuple[str, str]]] = {
    ("en", "si"): [
        (
            "Ministry of Education, Higher Education and Vocational Education",
            "අධ්‍යාපන, උසස් අධ්‍යාපන සහ වෘත්තීය අධ්‍යාපන අමාත්‍යාංශය",
        ),
        ("Ministry of Education", "අධ්‍යාපන අමාත්‍යාංශය"),
        ("All Provincial Secretaries of Education", "සියලු පළාත් අධ්‍යාපන ලේකම්වරුන්"),
        ("All Provincial Directors of Education", "සියලු පළාත් අධ්‍යාපන අධ්‍යක්ෂවරුන්"),
        ("All Zonal Directors of Education", "සියලු කලාප අධ්‍යාපන අධ්‍යක්ෂවරුන්"),
        ("letter of appointment", "පත්වීම් ලිපිය"),
        ("Letter of Appointment", "පත්වීම් ලිපිය"),
        ("With immediate effect", "ක්ෂණිකව බලපැවැත්වේ"),
        ("teacher training", "ගුරු පුහුණුව"),
        ("new teachers", "නව ගුරුවරුන්"),
        ("circular", "චක්‍රලේඛය"),
        ("certificate", "සහතිකය"),
    ],
    ("en", "ta"): [
        (
            "Ministry of Education, Higher Education and Vocational Education",
            "கல்வி, உயர்கல்வி மற்றும் தொழில் கல்வி அமைச்சு",
        ),
        ("Ministry of Education", "கல்வி அமைச்சு"),
        ("With immediate effect", "உடனடி நடைமுறை"),
        ("letter of appointment", "நியமனக் கடிதம்"),
        ("circular", "சுற்றறிக்கை"),
        ("certificate", "சான்றிதழ்"),
    ],
}


def apply_glossary(text: str, source_lang: SummaryLang, target_lang: SummaryLang) -> str:
    """Replace known MOE phrases. Safe even when the local model loops."""
    if not text or source_lang == target_lang:
        return text
    pairs = list(_GLOSSARY.get((source_lang, target_lang), []))
    reverse = _GLOSSARY.get((target_lang, source_lang), [])
    if not pairs and reverse:
        pairs = [(dst, src) for src, dst in reverse]
    updated = text
    for src, dst in pairs:
        if not src:
            continue
        if src.isascii():
            updated = re.sub(rf"\b{re.escape(src)}\b", dst, updated, flags=re.IGNORECASE)
        else:
            updated = updated.replace(src, dst)
    return updated


def map_section_heading(heading: str, target_lang: SummaryLang) -> str | None:
    needle = re.sub(r"\s+", " ", (heading or "").strip()).lower()
    if not needle:
        return None
    for labels in FALLBACK_HEADINGS.values():
        for key in _HEADING_KEYS:
            if labels.get(key, "").strip().lower() == needle:
                return FALLBACK_HEADINGS[target_lang][key]
    for key, aliases in _HEADING_ALIASES.items():
        if needle in aliases:
            return FALLBACK_HEADINGS[target_lang][key]
    return None


def text_has_target_script(text: str, language: SummaryLang) -> bool:
    blob = text or ""
    if language == "si":
        return len(re.findall(r"[\u0D80-\u0DFF]", blob)) >= 4
    if language == "ta":
        return len(re.findall(r"[\u0B80-\u0BFF]", blob)) >= 4
    return True


OUTPUT_LANGUAGE_INSTRUCTIONS: dict[SummaryLang, str] = {
    "en": (
        "Write the entire brief in English. Section headings must be in English. "
        "Keep circular numbers and numeric dates exactly as in the source."
    ),
    "si": (
        "Write the entire brief in Sinhala (සිංහල). Section headings, title, "
        "issuedBy, targetAudience, section content, and actionItems must be Sinhala. "
        "actionItems must be Sinhala instruction sentences, never entity JSON or dicts. "
        "Keep circular numbers (e.g. 26/2026) and numeric dates exactly as in the source. "
        "Do not write the brief in English. English proper nouns from the source may stay in English."
    ),
    "ta": (
        "Write the entire brief in Tamil (தமிழ்). Section headings, title, "
        "issuedBy, targetAudience, section content, and actionItems must be Tamil. "
        "actionItems must be Tamil instruction sentences, never entity JSON or dicts. "
        "Keep circular numbers and numeric dates exactly as in the source. "
        "Do not write the brief in English except for proper nouns that appear in English in the source."
    ),
}


def detect_output_language(text: str, filename: str | None = None) -> SummaryLang:
    hint = filename_script_hint(filename)
    if hint == "sin":
        return "si"
    if hint == "tam":
        return "ta"
    if hint == "eng":
        return "en"
    script = detect_language_hint(text or "")
    if script in ("si", "ta"):
        return script
    return "en"


def counterpart_language(language: SummaryLang) -> SummaryLang:
    return "en" if language in ("si", "ta") else "si"


_SHORT_LOOP = re.compile(r"(.{2,12})\1{6,}", re.DOTALL)
_LONG_LOOP = re.compile(r"(.{13,80})\1{3,}", re.DOTALL)
_TOKEN_SPLIT = re.compile(r"\S+")
_TEX_JUNK = re.compile(r"\\frac|\\text|\\u0[0-9a-f]{2,}|\{u0[0-9a-f]{2,}", re.IGNORECASE)
# Scripts that never belong in an MOE brief (Thai/Lao/Tibetan/Hebrew/Arabic/Indic-other/CJK).
_UNEXPECTED_SCRIPTS = re.compile(
    r"[\u0E00-\u0EFF\u0F00-\u0FFF\u0590-\u05FF\u0600-\u06FF"
    r"\u0900-\u097F\u0980-\u09FF\u0A00-\u0AFF\u0C00-\u0CFF"
    r"\u0D00-\u0D7F\u1000-\u109F\u1780-\u17FF\u3040-\u30FF"
    r"\u4E00-\u9FFF\uAC00-\uD7AF\uE000-\uF8FF\uFFF0-\uFFFF\uFFFD]"
)


def text_looks_degenerate(text: str) -> bool:
    """True when a model looped, mixed in foreign scripts, or collapsed to a few unique tokens."""
    raw = (text or "").strip()
    if not raw:
        return False
    if _TEX_JUNK.search(raw) or _UNEXPECTED_SCRIPTS.search(raw):
        return True
    compact = re.sub(r"\s+", "", raw)
    if _SHORT_LOOP.search(compact) or _LONG_LOOP.search(compact):
        return True
    if _SHORT_LOOP.search(raw) or _LONG_LOOP.search(raw):
        return True
    tokens = _TOKEN_SPLIT.findall(raw)
    if len(tokens) >= 20:
        unique = len(set(tokens))
        if unique / len(tokens) < 0.15:
            return True
    return False


def _field_too_long(translated: str, source: str) -> bool:
    src = (source or "").strip()
    dst = (translated or "").strip()
    if not dst:
        return False
    if not src:
        return len(dst) > 2000
    return len(dst) > max(400, len(src) * 4)


def leftover_english_dominates(text: str, language: SummaryLang) -> bool:
    """True when Latin letters outnumber the target script (glossary word-swap)."""
    blob = text or ""
    latin = len(re.findall(r"[A-Za-z]", blob))
    if language == "si":
        return latin > len(re.findall(r"[\u0D80-\u0DFF]", blob))
    if language == "ta":
        return latin > len(re.findall(r"[\u0B80-\u0BFF]", blob))
    return False


def translation_quality_error(
    translated: dict[str, Any],
    source: dict[str, Any],
    language: SummaryLang,
) -> str | None:
    """Return a user-facing error if the translation is looping, too long, or the wrong script."""
    lang_name = LANG_LABEL.get(language, language)
    message = (
        f"{lang_name} translation from the local model was unreadable. "
        "Stay on English or use a stronger model."
    )
    blob = _summary_text_blob(translated)
    if text_looks_degenerate(blob):
        return message
    if language in ("si", "ta"):
        sinhala = len(re.findall(r"[\u0D80-\u0DFF]", blob))
        tamil = len(re.findall(r"[\u0B80-\u0BFF]", blob))
        if language == "si" and (sinhala < 12 or tamil >= 24):
            return message
        if language == "ta" and (tamil < 12 or sinhala >= 24):
            return message
        if leftover_english_dominates(blob, language):
            return message
        if leftover_english_dominates(str(translated.get("title") or ""), language):
            return message

    pairs = [
        (str(translated.get("title") or ""), str(source.get("title") or "")),
        (str(translated.get("issuedBy") or ""), str(source.get("issuedBy") or "")),
        (str(translated.get("targetAudience") or ""), str(source.get("targetAudience") or "")),
    ]
    src_sections = [
        section
        for section in (source.get("sections") or [])
        if isinstance(section, dict)
    ]
    dst_sections = [
        section
        for section in (translated.get("sections") or [])
        if isinstance(section, dict)
    ]
    for index, dst_section in enumerate(dst_sections):
        src_section = src_sections[index] if index < len(src_sections) else {}
        pairs.append(
            (str(dst_section.get("heading") or ""), str(src_section.get("heading") or ""))
        )
        pairs.append(
            (str(dst_section.get("content") or ""), str(src_section.get("content") or ""))
        )
    src_actions = [str(item) for item in (source.get("actionItems") or [])]
    for index, item in enumerate(translated.get("actionItems") or []):
        src_item = src_actions[index] if index < len(src_actions) else ""
        pairs.append((str(item), src_item))

    for dst, src in pairs:
        if text_looks_degenerate(dst) or _field_too_long(dst, src):
            return message
    return None


def _summary_text_blob(summary: dict[str, Any]) -> str:
    parts = [
        str(summary.get("title") or ""),
        str(summary.get("issuedBy") or ""),
        str(summary.get("targetAudience") or ""),
        " ".join(
            f"{section.get('heading', '')} {section.get('content', '')}"
            for section in (summary.get("sections") or [])
            if isinstance(section, dict)
        ),
        " ".join(str(item) for item in (summary.get("actionItems") or [])),
    ]
    return " ".join(parts)


def summary_looks_degenerate(summary: dict[str, Any]) -> bool:
    return text_looks_degenerate(_summary_text_blob(summary))


def summary_matches_output_language(summary: dict[str, Any], language: SummaryLang) -> bool:
    """True when the brief is written in the script expected for this circular."""
    if language == "en":
        return True
    blob = _summary_text_blob(summary)
    sinhala = len(re.findall(r"[\u0D80-\u0DFF]", blob))
    tamil = len(re.findall(r"[\u0B80-\u0BFF]", blob))
    latin = len(re.findall(r"[A-Za-z]", blob))
    if language == "si":
        return sinhala >= 12 and sinhala >= latin * 0.15
    if language == "ta":
        return tamil >= 12 and tamil >= latin * 0.15
    return True
