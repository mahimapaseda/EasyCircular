import re
from dataclasses import dataclass
from typing import Literal

from app.moe_text import ED_REF_PATTERN, is_valid_date_text

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
    (r"(?:Circular|Circ\.?)\s*(?:Number|No\.?)\s*[:\-]?\s*\d{1,4}\s*/\s*\d{2,4}(?:\s*\([a-z]\))?", "LAW"),
    (r"(?:Circular|Circ\.?)\s*No\.?\s*\d{4}\s*/\s*\d{1,4}(?:\s*\([a-z]\))?", "LAW"),
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
    (r"Provincial\s+(?:Education\s+)?Secretar(?:y|ies)", "ORG"),
    (r"Zonal\s+Directors?\s+of\s+Education", "ORG"),
    (r"Divisional\s+Directors?\s+of\s+Education", "ORG"),
]

LABEL_PRIORITY = {"LAW": 4, "DATE": 3, "ORG": 2, "PERSON": 1, "OTHER": 0}

NOISE_ORG_PATTERN = re.compile(
    r"^(?:the\s+)?(?:educational institutions|educational institution|vesak day)$",
    re.IGNORECASE,
)


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
        filtered.append(entity)
    return filtered


def extract_entities(text: str) -> list[dict]:
    if not text or not text.strip():
        return []

    regex_entities = _extract_regex_entities(text)
    spacy_entities = _extract_spacy_entities(text)
    merged = _merge_entities(regex_entities + spacy_entities)
    filtered = _filter_entities(merged)
    return [entity.to_dict() for entity in filtered]
