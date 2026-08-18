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


def text_looks_degenerate(text: str) -> bool:
    """True when a model looped (repeated chunks) or collapsed to a few unique tokens."""
    raw = (text or "").strip()
    if not raw:
        return False
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
    if language in ("si", "ta") and not summary_matches_output_language(translated, language):
        return message
    blob = _summary_text_blob(translated)
    if text_looks_degenerate(blob):
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
