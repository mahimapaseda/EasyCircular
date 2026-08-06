import re
from dataclasses import dataclass
from typing import Literal

from app.moe_text import ED_REF_PATTERN, is_valid_date_text, normalize_moe_text

EntityLabel = Literal["DATE", "PERSON", "ORG", "LAW", "OTHER"]

SPACY_TO_LABEL: dict[str, EntityLabel] = {
    "PERSON": "PERSON",
    "ORG": "ORG",
    "GPE": "ORG",
    "DATE": "DATE",
    "LAW": "LAW",
    "NORP": "ORG",
}

REGEX_RULES: list[tuple[str, EntityLabel]] = [
    (r"\b\d{4}\.\d{2}\.\d{2}\b", "DATE"),
    (r"\b\d{1,2}\.\d{2}\.\d{4}\b", "DATE"),
    (r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", "DATE"),
    (r"\b\d{4}-\d{2}-\d{2}\b", "DATE"),
    (r"\b\d{1,2}(?:st|nd|rd|th)?\s+of\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b", "DATE"),
    (r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b", "DATE"),
    (r"\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b", "DATE"),
    (r"(?:Circular|Circ\.?)\s*(?:Number|Nos?\.?)\s*[.:\-]*\s*\d{1,4}\s*/\s*\d{2,4}(?:\s*\([a-z]\))?", "LAW"),
    (r"(?:Circular|Circ\.?)\s*Nos?\.?\s*[.:\-]*\s*\d{4}\s*/\s*\d{1,4}(?:\s*\([a-z]\))?", "LAW"),
    # "Circular No. 54 of 2023" (12-2026-En-1)
    (r"(?:Circular|Circ\.?)\s*Nos?\.?\s*\d{1,4}\s+of\s+\d{4}", "LAW"),
    (r"(?:චක්‍රලේඛ|සැකසුම්)\s*(?:අංක|නං\.?)?\s*[\d]+[/\-]?[\d]*(?:\s*\([a-z]\))?", "LAW"),
    (r"\bED/\d{2}(?:/\d{2}){1,4}(?:/\d{3})?\b", "LAW"),
    (r"Education\s+Ordinance(?:\s+No\.?\s*\d+)?", "LAW"),
    (r"(?:the\s+)?Establishments?\s+Code", "LAW"),
    (r"(?:the\s+)?Appropriation\s+Act\s+No\.?\s*\d+", "LAW"),
    (r"Section\s+\d+(?:\.\d+)?(?:\s*\([a-z]\))?", "LAW"),
    (r"Chapter\s+\d+(?:\.\d+)?", "LAW"),
    (r"Ministry\s+of\s+Education(?:,\s*Higher\s+Education\s+and\s+Vocational\s+Education)?", "ORG"),
    (r"Department\s+of\s+Examinations", "ORG"),
    (r"National\s+Institute\s+of\s+Education", "ORG"),
    (r"Commissioner\s+General\s+of\s+Examinations", "ORG"),
    (r"Provincial\s+(?:Education\s+)?Secretar(?:y|ies)(?:\s+of\s+Education)?", "ORG"),
    (r"Zonal\s+Directors?\s+of\s+Education", "ORG"),
    (r"Divisional\s+Directors?\s+of\s+Education", "ORG"),
    # Corpus-derived (sample circulars 10/15/23/44-2026, 44-2006i, 12-2026)
    (r"(?:Provincial\s+)?Chief\s+Secretar(?:y|ies)(?:\s+(?:to|of)\s+(?:the\s+)?Provincial\s+Councils?)?", "ORG"),
    (r"Provincial\s+Public\s+Service\s+Commissions?", "ORG"),
    (r"Sri\s+Lanka\s+Education\s+Administrative\s+Service", "ORG"),
    (r"Director\s+General\s+of\s+(?:Management\s+Services|National\s+Budget|Establishments|Public\s+Finance|Education)", "ORG"),
    (r"Ministry\s*/\s*Department\s*/\s*Provincial\s+Council", "ORG"),
    (r"Zonal\s+Office\s*/\s*District", "ORG"),
    (r"Provincial\s+Councils?\b", "ORG"),
    (r"Head\s+of\s+(?:the\s+)?Department", "ORG"),
]

LABEL_PRIORITY = {"LAW": 4, "DATE": 3, "ORG": 2, "PERSON": 1, "OTHER": 0}

NOISE_ORG_PATTERN = re.compile(
    r"^(?:the\s+)?(?:educational institutions|educational institution|vesak day)$",
    re.IGNORECASE,
)

LETTERHEAD_ENTITY_NOISE = re.compile(
    r"^(?:இலங்கை|ශ්‍රී\s*ලංකාව?|sri\s*lanka|st\s*lanka|battaramulla|isurupaya|"
    r"buddhist|trainin|camscanner|lanka|moe\.gov\.lk|www\.moe|"
    r"hon\.?\s*minister|secretary|"
    r"(?:the\s+)?letter\s+of\s+appointment|training\s+institution)$",
    re.IGNORECASE,
)

_VOWELS = set("aeiouAEIOU")


def _looks_like_ocr_noise(text: str) -> bool:
    """Detect OCR garbage such as 'k s s o e -' or 'NgnidnettasloohcsW3tShPleoee'.

    Applied to PERSON/ORG/OTHER entities; regex-derived DATE/LAW spans have
    strict shapes already.
    """
    stripped = text.strip()
    if len(stripped) < 3:
        return True

    letters = [ch for ch in stripped if ch.isalpha()]
    if not letters:
        return True

    # Only score Latin-script text; Sinhala/Tamil have no ASCII vowels.
    ascii_letters = [ch for ch in letters if ch.isascii()]
    if len(ascii_letters) < len(letters) * 0.5:
        return False

    # Mostly single-character tokens: "k s s o e -"
    tokens = stripped.split()
    if len(tokens) >= 3:
        single_char = sum(1 for token in tokens if len(token) == 1)
        if single_char / len(tokens) > 0.5:
            return True

    # Low alphabetic ratio (symbols/digits soup)
    non_space = [ch for ch in stripped if not ch.isspace()]
    if len(letters) / len(non_space) < 0.6:
        return True

    # Vowel-less or nearly vowel-less alphabetic runs: "spoohkpfrrvskp"
    if len(ascii_letters) >= 4:
        vowels = sum(1 for ch in ascii_letters if ch in _VOWELS)
        if vowels == 0:
            return True
        if len(ascii_letters) >= 12 and vowels / len(ascii_letters) < 0.2:
            return True

    # Long scrambled tokens from reversed/columnar OCR:
    # "NgnidnettasloohcsW3tShPleoee" — digits or repeated case flips inside
    # a single long token never occur in real names.
    for token in tokens:
        if len(token) < 12:
            continue
        has_interior_digit = any(ch.isdigit() for ch in token[1:-1])
        interior_upper = sum(1 for ch in token[2:] if ch.isupper())
        if has_interior_digit or interior_upper >= 2:
            return True

    return False


@dataclass
class Entity:
    text: str
    label: EntityLabel
    start: int
    end: int

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "label": self.label,
            "start": self.start,
            "end": self.end,
        }


def _extract_regex_entities(text: str) -> list[Entity]:
    found: list[Entity] = []
    for pattern, label in REGEX_RULES:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            found.append(
                Entity(
                    text=match.group(0),
                    label=label,
                    start=match.start(),
                    end=match.end(),
                )
            )
    return found


def _extract_spacy_entities(text: str) -> list[Entity]:
    try:
        from app.nlp_models import get_spacy_nlp

        nlp = get_spacy_nlp()
    except (ImportError, OSError):
        return []

    doc = nlp(text[:100000])
    found: list[Entity] = []
    for ent in doc.ents:
        label = SPACY_TO_LABEL.get(ent.label_)
        if not label:
            continue
        found.append(
            Entity(
                text=ent.text,
                label=label,
                start=ent.start_char,
                end=ent.end_char,
            )
        )
    return found


def _overlaps(a: Entity, b: Entity) -> bool:
    return a.start < b.end and b.start < a.end


def _merge_entities(entities: list[Entity]) -> list[Entity]:
    if not entities:
        return []

    sorted_entities = sorted(
        entities,
        key=lambda e: (e.start, -(e.end - e.start), -LABEL_PRIORITY[e.label]),
    )
    merged: list[Entity] = []

    for entity in sorted_entities:
        if not entity.text.strip():
            continue

        replaced = False
        for index, kept in enumerate(merged):
            if not _overlaps(entity, kept):
                continue
            if LABEL_PRIORITY[entity.label] > LABEL_PRIORITY[kept.label]:
                merged[index] = entity
            replaced = True
            break

        if not replaced:
            merged.append(entity)

    return sorted(merged, key=lambda e: e.start)


def _filter_entities(entities: list[Entity]) -> list[Entity]:
    filtered: list[Entity] = []
    for entity in entities:
        text = entity.text.strip()
        if not text:
            continue
        if entity.label == "DATE" and not is_valid_date_text(text):
            continue
        if entity.label == "ORG" and NOISE_ORG_PATTERN.match(text):
            continue
        if entity.label == "DATE" and ED_REF_PATTERN.search(text):
            continue
        if entity.label in ("PERSON", "ORG", "OTHER") and _looks_like_ocr_noise(text):
            continue
        if entity.label in ("PERSON", "ORG", "OTHER") and LETTERHEAD_ENTITY_NOISE.match(text):
            continue
        if entity.label == "PERSON" and any(ch.isdigit() for ch in text):
            continue
        # Drop very short OCR fragments and single-token leftovers.
        if entity.label in ("PERSON", "ORG") and len(text) < 5:
            continue
        if entity.label in ("PERSON", "ORG") and " " not in text and len(text) < 14:
            # Single-token ORG/PERSON like "Buddhist", "Pirivenas", "trainin".
            if text.lower() not in {"moe"}:
                continue
        filtered.append(
            Entity(text=text, label=entity.label, start=entity.start, end=entity.end)
            if text != entity.text
            else entity
        )
    return filtered


def extract_entities(text: str) -> list[dict]:
    if not text or not text.strip():
        return []

    text = normalize_moe_text(text)
    regex_entities = _extract_regex_entities(text)
    spacy_entities = _extract_spacy_entities(text)
    merged = _merge_entities(regex_entities + spacy_entities)
    filtered = _filter_entities(merged)
    return [entity.to_dict() for entity in filtered]
