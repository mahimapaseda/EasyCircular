import re
from dataclasses import dataclass
from typing import Literal

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
    (r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", "DATE"),
    (r"\b\d{4}-\d{2}-\d{2}\b", "DATE"),
    (r"\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b", "DATE"),
    (r"(?:Circular|Circ\.?)\s*No\.?\s*[\d]+[/\-][\d]+", "LAW"),
    (r"(?:චක්‍රලේඛ|සැකසුම්)\s*(?:අංක|නಂ\.?)?\s*[\d]+[/\-]?[\d]*", "LAW"),
    (r"Education\s+Ordinance(?:\s+No\.?\s*\d+)?", "LAW"),
    (r"Section\s+\d+(?:\s*\([a-z]\))?", "LAW"),
    (r"Ministry\s+of\s+Education", "ORG"),
    (r"Department\s+of\s+Examinations", "ORG"),
]

LABEL_PRIORITY = {"LAW": 4, "DATE": 3, "ORG": 2, "PERSON": 1, "OTHER": 0}


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


def extract_entities(text: str) -> list[dict]:
    if not text or not text.strip():
        return []

    regex_entities = _extract_regex_entities(text)
    spacy_entities = _extract_spacy_entities(text)
    merged = _merge_entities(regex_entities + spacy_entities)
    return [entity.to_dict() for entity in merged]
