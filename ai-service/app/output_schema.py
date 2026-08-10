"""Pydantic models for validating and normalising LLM summary output."""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


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
        if not isinstance(v, list):
            return []
        return [str(item).strip() for item in v if item and str(item).strip()]

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
