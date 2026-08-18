"""Pydantic models for validating and normalising LLM summary output."""

from __future__ import annotations

import ast
import json
import re

from difflib import SequenceMatcher
from pydantic import BaseModel, Field, field_validator

_NER_DUMP_KEYS = frozenset({"text", "label", "start", "end"})
_NER_DUMP_HINT = re.compile(
    r"""['"]text['"]\s*:.*['"]label['"]\s*:.*['"](?:start|end)['"]\s*:""",
    re.DOTALL,
)


def _looks_like_ner_record(item: dict) -> bool:
    keys = {str(key).lower() for key in item}
    return "label" in keys and ("start" in keys or "end" in keys)


def _parse_serialized_object(value: str):
    stripped = value.strip()
    if not stripped or stripped[0] not in "{[":
        return None
    try:
        parsed = json.loads(stripped)
        if isinstance(parsed, (dict, list)):
            return parsed
    except (TypeError, ValueError, json.JSONDecodeError):
        pass
    try:
        parsed = ast.literal_eval(stripped)
        if isinstance(parsed, (dict, list)):
            return parsed
    except (TypeError, ValueError, SyntaxError, MemoryError):
        pass
    return None


def _coerce_action_item(item) -> str | None:
    """Keep natural-language steps; drop NER entity objects and dict dumps."""
    if isinstance(item, dict):
        if _looks_like_ner_record(item):
            return None
        text = str(item.get("content") or item.get("text") or "").strip()
        return text or None
    if isinstance(item, (list, tuple)):
        return None
    if not isinstance(item, str):
        return None
    text = item.strip()
    if not text:
        return None
    parsed = _parse_serialized_object(text)
    if isinstance(parsed, dict) and (
        _looks_like_ner_record(parsed) or set(parsed) <= _NER_DUMP_KEYS
    ):
        return None
    if isinstance(parsed, list):
        return None
    if _NER_DUMP_HINT.search(text) and ("start" in text or "end" in text):
        return None
    return text


MAX_ACTION_ITEMS = 6
_AUDIENCE_PREFIX = re.compile(
    r"^(all\s+.+?\s+must\s+|heads?\s+of\s+.+?\s+must\s+|.+?\s+must\s+)",
    re.IGNORECASE,
)


def _action_core(text: str) -> str:
    """Strip audience prefixes so 'All X must consider …' matches 'All Y must consider …'."""
    normalized = re.sub(r"\s+", " ", text).strip().lower()
    return _AUDIENCE_PREFIX.sub("", normalized, count=1).strip()


def _near_duplicate_action(left: str, right: str) -> bool:
    if not left or not right:
        return False
    if left == right:
        return True
    if len(left) >= 40 and len(right) >= 40:
        if left in right or right in left:
            return True
        return SequenceMatcher(None, left, right).ratio() >= 0.82
    return False


def sanitize_action_items(items) -> list[str]:
    if not isinstance(items, list):
        return []
    cleaned: list[str] = []
    cores: list[str] = []
    for item in items:
        text = _coerce_action_item(item)
        if not text:
            continue
        core = _action_core(text)
        if any(_near_duplicate_action(core, prev) for prev in cores):
            continue
        cores.append(core)
        cleaned.append(text)
        if len(cleaned) >= MAX_ACTION_ITEMS:
            break
    return cleaned


class SummarySection(BaseModel):
    heading: str = "Section"
    content: str = ""

    @field_validator("heading", mode="before")
    @classmethod
    def _default_heading(cls, v: str | None) -> str:
        if not v or not str(v).strip():
            return "Section"
        return str(v).strip()

    @field_validator("content", mode="before")
    @classmethod
    def _default_content(cls, v: str | None) -> str:
        return str(v).strip() if v else ""


class CircularSummaryOutput(BaseModel):
    """Validated schema for AI-generated circular summaries.

    Every field that originates from the LLM has a safe default so that
    partially-formed JSON from the model never crashes the pipeline.
    """

    circular_number: str | None = Field(None, alias="circularNumber")
    issued_date: str | None = Field(None, alias="issuedDate")
    issued_by: str | None = Field(None, alias="issuedBy")
    target_audience: str | None = Field(None, alias="targetAudience")
    effective_date: str | None = Field(None, alias="effectiveDate")
    title: str = "Circular summary"
    sections: list[SummarySection] = Field(default_factory=list)
    action_items: list[str] = Field(default_factory=list, alias="actionItems")

    model_config = {"populate_by_name": True}

    @field_validator("title", mode="before")
    @classmethod
    def _default_title(cls, v: str | None) -> str:
        if not v or not str(v).strip():
            return "Circular summary"
        return str(v).strip()

    @field_validator("sections", mode="before")
    @classmethod
    def _ensure_list(cls, v):
        if not isinstance(v, list):
            if isinstance(v, str) and v.strip():
                return [{"heading": "Purpose", "content": v.strip()}]
            return []
        normalized = []
        for item in v:
            if isinstance(item, str) and item.strip():
                normalized.append({"heading": "Section", "content": item.strip()})
            elif isinstance(item, dict):
                normalized.append(item)
        return normalized

    @field_validator("action_items", mode="before")
    @classmethod
    def _clean_actions(cls, v):
        return sanitize_action_items(v)

    def to_summary_dict(self) -> dict:
        """Convert to the dictionary shape expected by the rest of the pipeline."""
        return {
            "circularNumber": self.circular_number,
            "issuedDate": self.issued_date,
            "issuedBy": self.issued_by,
            "targetAudience": self.target_audience,
            "effectiveDate": self.effective_date,
            "title": self.title,
            "sections": [
                {"heading": s.heading, "content": s.content}
                for s in self.sections
            ],
            "actionItems": self.action_items,
        }


def validate_llm_output(raw: dict) -> dict:
    """Parse, validate and normalise raw LLM JSON into a clean summary dict.

    Gracefully handles missing/malformed fields by applying defaults.
    """
    parsed = CircularSummaryOutput.model_validate(raw)
    return parsed.to_summary_dict()
