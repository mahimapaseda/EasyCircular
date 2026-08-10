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
    # Sinhala circular / circular-number (optional ZWJ as in OCR)
    (r"චක්[\u200d]?රලේඛ[යු]?\s*(?:අංක|නං\.?)?\s*[:\-]?\s*\d{1,4}\s*/\s*\d{2,4}(?:\s*\([^)]+\))?", "LAW"),
    (r"අංක\s+\d{1,4}\s*/\s*\d{2,4}\s*චක්[\u200d]?රලේඛ[යු]?", "LAW"),
    (r"චක්[\u200d]?රලේඛ[යු]?\s*(?:අංක|නං\.?)?\s*[:\-]?\s*[\d]+[/\-]?[\d]*(?:\s*\([^)]+\))?", "LAW"),
    # Tamil circular markers (OCR often glues tokens / confuses கை↔கம்)
    (
        r"(?:சுற்ற(?:றிக்கை|றிக்கை)|சுற்றுநிருப(?:ம்|த்தின்)?)\s*"
        r"(?:இல(?:க்)?கம்?|இல\.?|எண்)\s*[:\-]?\s*\d{1,4}\s*/\s*\d{2,4}",
        "LAW",
    ),
    # Glued OCR: சுற்றுநிருபத்தின்இலக்ைம்
    (r"சுற்றுநிருப(?:த்தின்)?இல(?:க்)?க[்ைம்]+", "LAW"),
    (r"(?:இலக்கம்|இல\.?)\s*[:\-]?\s*\d{1,4}\s*/\s*\d{2,4}", "LAW"),
    (r"\bED/\d{2}(?:/\d{2}){1,4}(?:/\d{3})?(?:-\d{4})?\b", "LAW"),
    (r"Education\s+Ordinance(?:\s+No\.?\s*\d+)?", "LAW"),
    (r"(?:the\s+)?Establishments?\s+Code", "LAW"),
    (r"ආයතන\s+සංග්[\u200d]?රහය", "LAW"),
    (r"(?:the\s+)?Appropriation\s+Act\s+No\.?\s*\d+", "LAW"),
    (r"Section\s+\d+(?:\.\d+)?(?:\s*\([a-z]\))?", "LAW"),
    (r"Chapter\s+\d+(?:\.\d+)?", "LAW"),
    (r"Financial\s+Regulation\s+\d+(?:\.\d+)?", "LAW"),
    (r"(?:වගන්ති|වගන්තිය|පරිච්ඡේදය)\s*\d+", "LAW"),
    (r"Ministry\s+of\s+Education(?:,\s*Higher\s+Education\s+and\s+Vocational\s+Education)?", "ORG"),
    (r"Department\s+of\s+Buddhasasana(?:,?\s*Religious\s+and\s+Cultural\s+Affairs)?", "ORG"),
    (r"National\s+(?:Schools?|Colleges?\s+of\s+Education)", "ORG"),
    (r"Teacher\s+(?:Training\s+Colleges?|Development\s+Centers?)", "ORG"),
    (r"Annexure[-\s]?\d+", "ORG"),
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
    # Sinhala orgs / roles (Dengue_Sinhala, 03-2014I); \u200d = ZWJ in OCR
    (
        r"අධ්[\u200d]?යාපන(?:,?\s*උසස්[\u200d]?\s*අධ්[\u200d]?යාපන\s*සහ\s*වෘත්තී?ය\s*අධ්[\u200d]?යාපන)?"
        r"\s*අමාත්[\u200d]?යාංශ[යු]?",
        "ORG",
    ),
    (r"පළාත්[\u200d]?\s*අධ්[\u200d]?යාපන\s*(?:ලේකම්|අධ්[\u200d]?යක්ෂ)වරුන්", "ORG"),
    (r"කලාප\s*අධ්[\u200d]?යාපන\s*අධ්[\u200d]?යක්ෂවරුන්", "ORG"),
    (r"විදුහල්පතිවරුන්", "ORG"),
    (r"ශ්[\u200d]?රී\s*ලංකා\s*විදුහල්පති\s*සේවය", "ORG"),
    (r"ජාතික\s*ඩෙංගු\s*මර්දන\s*(?:ඒකකය|සතිය)", "ORG"),
    (
        r"රාජ්[\u200d]?ය\s*පරිපාලන(?:,?\s*පළාත්?\s*සභා\s*සහ\s*පළාත්\s*පාලන)?"
        r"\s*අමාත්[\u200d]?යාංශය",
        "ORG",
    ),
    # Tamil letterhead / orgs (OCR may drop spaces / insert ZWNJ)
    (r"கல்வி(?:,?\s*உயர்[\u200c]?\s*கல்வி\s*மற்றும்[\u200c]?\s*தொழிற்[\u200c]?\s*கல்வி)?\s*அமைச்சு", "ORG"),
    (r"வலய\s*கல்வி\s*அலுவலகம்", "ORG"),
    (r"மாகாண\s*கல்வி\s*(?:செயலாளர்|இயக்குநர்)", "ORG"),
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

    # Cap very long OCR (e.g. 100+ page annexures) — header carries circular/FR refs.
    doc = nlp(text[:25000])
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


def _merge_prefer_primary(primary: list[Entity], secondary: list[Entity]) -> list[Entity]:
    """Keep regex/heuristic spans; add SpaCy only when non-overlapping or higher label."""
    merged = _merge_entities(primary)
    for entity in secondary:
        if not entity.text.strip():
            continue
        conflict = next((kept for kept in merged if _overlaps(entity, kept)), None)
        if conflict is None:
            merged.append(entity)
            continue
        if LABEL_PRIORITY[entity.label] > LABEL_PRIORITY[conflict.label]:
            merged = [entity if e is conflict else e for e in merged]
    return sorted(_merge_entities(merged), key=lambda e: e.start)


def _filename_law_entity(text: str, filename: str | None) -> Entity | None:
    """Inject Circular N/YYYY as LAW when body is annexure-only but filename encodes it."""
    if not filename:
        return None
    from app.moe_text import extract_circular_number

    circ = extract_circular_number(text, filename)
    if not circ:
        return None
    # Already have a circular LAW mention in the header area
    if re.search(
        r"(?:Circular|Circ\.?)\s*(?:Number|Nos?\.?)\s*[:.\-]?\s*\d",
        text[:2500],
        re.IGNORECASE,
    ):
        return None
    # Prefer attaching near an Annexure heading when present
    label_text = f"Circular No. {circ}"
    annex = re.search(r"Annexure[-\s]?\d+", text[:2000], re.IGNORECASE)
    if annex:
        start = annex.start()
        return Entity(text=label_text, label="LAW", start=start, end=start)
    return Entity(text=label_text, label="LAW", start=0, end=0)


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
        # Long OCR often invents ORG from form column headers
        if entity.label == "ORG" and len(text) > 80:
            continue
        if entity.label == "ORG" and re.search(
            r"head of department please|date of service|central government\s*-",
            text,
            re.IGNORECASE,
        ):
            continue
        filtered.append(
            Entity(text=text, label=entity.label, start=entity.start, end=entity.end)
            if text != entity.text
            else entity
        )
    return filtered


def extract_entities(text: str, *, filename: str | None = None) -> list[dict]:
    if not text or not text.strip():
        return []

    text = normalize_moe_text(text)
    # For huge OCR blobs, run regex on full text but SpaCy on a capped window
    regex_entities = _extract_regex_entities(text)
    spacy_window = text if len(text) <= 25000 else text[:20000] + "\n" + text[-5000:]
    spacy_entities = _extract_spacy_entities(spacy_window)
    # Regex/heuristics are primary; custom SpaCy fills gaps only.
    merged = _merge_prefer_primary(regex_entities, spacy_entities)
    injected = _filename_law_entity(text, filename)
    if injected and not any(
        e.label == "LAW" and ("Circular" in e.text or "/" in e.text) for e in merged
    ):
        merged = _merge_entities([injected] + merged)
    filtered = _filter_entities(merged)
    return [entity.to_dict() for entity in filtered]
