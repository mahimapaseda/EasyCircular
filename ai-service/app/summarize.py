"""Circular summarization — LLM-powered and extractive fallback."""

import json
import logging
import re
import time
from typing import Any

from app.chunking import split_text
from app.config import settings
from app.guardrails import verify_summary_dates
from app.llm import active_model_name, active_provider, get_chat_model, llm_is_configured
from app.moe_text import (
    build_summary_title,
    collect_valid_dates,
    extract_action_items,
    extract_circular_number,
    extract_effective_date,
    extract_issued_date,
    extract_key_requirements,
    extract_subject,
    extract_target_audience,
    is_letterhead_line,
    LETTERHEAD_NOISE_PATTERN,
    normalize_moe_text,
    top_org_entities,
)
from app.output_schema import validate_llm_output

logger = logging.getLogger("easycircular.ai.summarize")

# ──────────────────────────────────────────────────────────────────────
# Label priority for entity injection into LLM prompts.
# Higher-priority labels are sent first so they are never truncated.
# ──────────────────────────────────────────────────────────────────────
ENTITY_PRIORITY = {"LAW": 4, "DATE": 3, "ORG": 2, "PERSON": 1, "OTHER": 0}
MAX_ENTITIES_IN_PROMPT = 60


def _prioritise_entities(entities: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return a deduplicated, priority-sorted subset of entities for the LLM prompt."""
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for entity in entities:
        key = f"{entity.get('label')}:{entity.get('text', '').strip().lower()}"
        if key not in seen:
            seen.add(key)
            unique.append(entity)

    unique.sort(key=lambda e: -ENTITY_PRIORITY.get(e.get("label", "OTHER"), 0))
    return unique[:MAX_ENTITIES_IN_PROMPT]


# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────

def _entity_lines(entities: list[dict[str, Any]], label: str) -> list[str]:
    seen: set[str] = set()
    lines: list[str] = []
    for entity in entities:
        if entity.get("label") != label:
            continue
        text = str(entity.get("text", "")).strip()
        if text and text not in seen:
            seen.add(text)
            lines.append(text)
    return lines


def _first_paragraph(text: str, limit: int = 600) -> str:
    chunks = [chunk.strip() for chunk in re.split(r"\n\s*\n", text) if chunk.strip()]
    if not chunks:
        return text[:limit].strip()
    return chunks[0][:limit].strip()


def _build_markdown(summary: dict[str, Any]) -> str:
    lines = [f"# {summary.get('title', 'Circular summary')}", ""]

    # Metadata block
    meta_fields = [
        ("Circular Number", summary.get("circularNumber")),
        ("Issued Date", summary.get("issuedDate")),
        ("Issued By", summary.get("issuedBy")),
        ("Target Audience", summary.get("targetAudience")),
        ("Effective Date", summary.get("effectiveDate")),
    ]
    meta_lines = [f"**{label}:** {value}" for label, value in meta_fields if value]
    if meta_lines:
        lines.extend(meta_lines)
        lines.append("")

    for section in summary.get("sections") or []:
        lines.append(f"## {section.get('heading', 'Section')}")
        lines.append(section.get("content") or "")
        lines.append("")
    actions = summary.get("actionItems") or []
    if actions:
        lines.append("## Action items")
        for item in actions:
            lines.append(f"- {item}")
    return "\n".join(lines).strip()


# ──────────────────────────────────────────────────────────────────────
# Enhanced LLM Prompts
# ──────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT_SUMMARIZE = """\
You are a specialist summarizer for Sri Lankan Ministry of Education (MOE) circulars.
Your audience is school principals and education administrators who need to understand
and act on circulars quickly.

## Your Task
Analyse the provided circular text and extracted entities, then produce a SINGLE JSON
object with this exact schema:

```json
{
  "circularNumber": "string or null — e.g. '10/2026'",
  "issuedDate": "string or null — the date the circular was issued",
  "issuedBy": "string or null — the issuing authority, e.g. 'Ministry of Education'",
  "targetAudience": "string or null — who receives this, e.g. 'All Provincial Education Secretaries, All Zonal Directors of Education'",
  "effectiveDate": "string or null — when it takes effect, e.g. 'With immediate effect' or '01 April 2026'",
  "title": "string — concise descriptive title including circular number if available",
  "sections": [
    {"heading": "string", "content": "string — rich detail, not just bullet headers"}
  ],
  "actionItems": ["string — concrete steps for school staff"]
}
```

## Mandatory Sections (include all that apply, omit only if truly absent)
1. **Purpose** — State what this circular is about in plain language. Include the policy
   objective, not just the subject line. Mention any amending/superseding circulars.
2. **Key requirements** — The specific rules, criteria, amounts, percentages, eligibility
   conditions, or procedures mandated. Include financial figures, grade thresholds,
   time limits, and any tables of values. Be thorough — missing a requirement is a
   failure.
3. **Legal & circular references** — List every referenced circular number, act,
   ordinance, section, and regulation with its context.
4. **Deadlines & dates** — Every deadline, effective date, and date range mentioned.
5. **Responsible parties** — Who must act and their specific responsibilities.
6. **Compliance & penalties** — Any consequences for non-compliance, reporting
   requirements, or audit provisions.

## Rules
- Preserve legal meaning; do not paraphrase legal terms loosely.
- Every date in the summary MUST appear in the source text or entity list.
  If a date is not in the source, write "Not specified" — do NOT fabricate.
- Include specific numbers: monetary amounts, percentages, student counts, distances.
- Skip letterhead and distribution-list boilerplate; focus on operative instructions.
- Content should be detailed paragraphs, not single-line headers.
- actionItems: 4-8 concrete steps that a school principal must take.
- Return ONLY valid JSON. No markdown fences, no commentary outside the JSON.

## Example Output
{
  "circularNumber": "44/2006(i)",
  "issuedDate": "04.05.2026",
  "issuedBy": "Ministry of Education, Higher Education and Vocational Education",
  "targetAudience": "All Provincial Directors of Education, All Zonal Directors of Education",
  "effectiveDate": "01 April 2026",
  "title": "MOE Circular 2006/44(i): Revised Financial Incentive for Principals and Teachers in Difficult Schools",
  "sections": [
    {"heading": "Purpose", "content": "This circular amends Circular No. 2006/44 dated 27.11.2006 to revise the financial incentive scheme for principals and teachers serving in schools classified as difficult. The amendment updates the allowance amounts payable under the original scheme."},
    {"heading": "Key requirements", "content": "Principals and teachers assigned to difficult schools shall receive a revised monthly allowance of Rs. 5,000 (previously Rs. 3,000). Eligibility requires a minimum continuous service period of 6 months at the designated difficult school. The school must be classified under Category A or B of the difficulty classification."},
    {"heading": "Legal & circular references", "content": "• Circular No. 2006/44 dated 27.11.2006\\n• Financial Regulation 135\\n• Establishments Code Chapter XII"},
    {"heading": "Deadlines & dates", "content": "• Revised allowance effective from 01 April 2026\\n• Original circular dated 27.11.2006"},
    {"heading": "Responsible parties", "content": "Provincial Directors of Education must update payroll systems. Zonal Directors must verify eligibility of teachers. School principals must submit updated staff lists to their Zonal Office."},
    {"heading": "Compliance & penalties", "content": "Failure to implement revised rates by the stipulated date may result in audit queries. All payments must be reconciled with the Provincial Council treasury."}
  ],
  "actionItems": [
    "Update payroll systems to reflect the revised allowance of Rs. 5,000 per month.",
    "Verify eligibility of all principals and teachers currently serving in difficult schools.",
    "Submit updated staff lists to the Zonal Education Office.",
    "Ensure back-payments from 01 April 2026 are processed for eligible staff.",
    "File the amended circular alongside original Circular No. 2006/44 for reference."
  ]
}
"""

SYSTEM_PROMPT_REDUCE = """\
You merge partial summaries of one Sri Lankan MOE circular into a single comprehensive JSON summary.

Return ONLY valid JSON with this exact schema:
{
  "circularNumber": "string or null",
  "issuedDate": "string or null",
  "issuedBy": "string or null",
  "targetAudience": "string or null",
  "effectiveDate": "string or null",
  "title": "string",
  "sections": [{"heading": "string", "content": "string"}],
  "actionItems": ["string"]
}

Rules:
- Preserve legal meaning and all specific numbers/amounts/dates.
- Deduplicate sections with the same heading by merging their content.
- Keep all unique action items.
- If partial summaries disagree on metadata (circularNumber, issuedDate, etc.),
  prefer the value from the earliest partial summary.
- Do not invent dates or requirements not present in the partials.
"""


def _llm_messages(system_prompt: str, user_prompt: str):
    from langchain_core.messages import HumanMessage, SystemMessage

    return [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]


def _token_usage(response) -> int:
    metadata = getattr(response, "response_metadata", {}) or {}
    usage = metadata.get("token_usage") or metadata.get("usage") or {}
    return int(usage.get("total_tokens") or usage.get("totalTokens") or 0)


def _parse_llm_json(content: str) -> dict[str, Any]:
    content = content.strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)
    return json.loads(content)


def _describe_llm_error(exc: Exception) -> str:
    message = str(exc)
    if "RESOURCE_EXHAUSTED" in message or "429" in message:
        return "LLM quota exceeded (429). The provider rate/usage limit was hit — try again later."
    if isinstance(exc, json.JSONDecodeError):
        return "LLM returned a response that could not be parsed as JSON."
    return f"{type(exc).__name__}: {message[:200]}"


# ──────────────────────────────────────────────────────────────────────
# LLM Summarization with retry
# ──────────────────────────────────────────────────────────────────────

def _invoke_with_retry(llm, messages, *, max_attempts: int = 2) -> Any:
    """Invoke the LLM with exponential backoff retry on transient errors."""
    last_exc: Exception | None = None
    for attempt in range(max_attempts):
        try:
            return llm.invoke(messages)
        except Exception as exc:
            last_exc = exc
            error_str = str(exc)
            # Only retry on transient / rate-limit errors
            is_transient = any(
                marker in error_str
                for marker in ("429", "RESOURCE_EXHAUSTED", "503", "timeout", "Timeout", "overloaded")
            )
            if not is_transient or attempt == max_attempts - 1:
                raise
            wait = 2 ** attempt
            logger.warning("LLM call failed (attempt %d/%d): %s — retrying in %ds", attempt + 1, max_attempts, error_str[:120], wait)
            time.sleep(wait)
    raise last_exc  # type: ignore[misc]


def _summarize_chunk(
    chunk: str,
    entities: list[dict[str, Any]],
    *,
    is_reduce: bool = False,
) -> tuple[dict[str, Any], int]:
    entity_summary = json.dumps(entities[:MAX_ENTITIES_IN_PROMPT], ensure_ascii=False)

    if is_reduce:
        system_prompt = SYSTEM_PROMPT_REDUCE
        user_prompt = f"""Partial summaries to merge:
{chunk}

Extracted entities:
{entity_summary}"""
    else:
        system_prompt = SYSTEM_PROMPT_SUMMARIZE
        user_prompt = f"""Source circular text:
{chunk}

Extracted entities (JSON):
{entity_summary}

Produce the JSON summary. Think step-by-step: first identify the circular number,
issuer, recipients, effective date, then analyse the body for requirements, deadlines,
and action items. Return ONLY the JSON object."""

    llm = get_chat_model()
    max_attempts = settings.llm_max_retries + 1
    response = _invoke_with_retry(llm, _llm_messages(system_prompt, user_prompt), max_attempts=max_attempts)

    content = response.content
    if isinstance(content, list):
        content = "".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in content
        )

    raw_parsed = _parse_llm_json(str(content))

    # Validate and normalise through Pydantic schema
    validated = validate_llm_output(raw_parsed)
    validated["mode"] = "llm"
    validated["rawMarkdown"] = _build_markdown(validated)
    return validated, _token_usage(response)


def llm_summarize(
    text: str,
    entities: list[dict[str, Any]],
) -> tuple[dict[str, Any], int, int]:
    prioritised = _prioritise_entities(entities)
    chunks = split_text(text)
    chunk_count = len(chunks)

    if chunk_count == 1:
        summary, tokens = _summarize_chunk(chunks[0], prioritised)
        return summary, tokens, chunk_count

    partials: list[str] = []
    total_tokens = 0

    for chunk in chunks:
        partial, tokens = _summarize_chunk(chunk, prioritised)
        total_tokens += tokens
        partials.append(json.dumps(partial, ensure_ascii=False))

    merged_blob = "\n\n---\n\n".join(partials)
    summary, reduce_tokens = _summarize_chunk(merged_blob, prioritised, is_reduce=True)
    return summary, total_tokens + reduce_tokens, chunk_count


# ──────────────────────────────────────────────────────────────────────
# Enriched Fallback Summarizer
# ──────────────────────────────────────────────────────────────────────

def fallback_summarize(text: str, entities: list[dict[str, Any]]) -> dict[str, Any]:
    text = normalize_moe_text(text)
    collapsed = re.sub(r"\s+", " ", text).strip()
    if (
        not collapsed
        or len(collapsed) < 80
        or re.fullmatch(
            r"(?:camscanner|scanned\s+by|scanned\s+with|scanbot|adobe\s+scan)",
            collapsed,
            flags=re.IGNORECASE,
        )
    ):
        summary = {
            "circularNumber": None,
            "issuedDate": None,
            "issuedBy": None,
            "targetAudience": None,
            "effectiveDate": None,
            "title": "MOE circular summary",
            "sections": [
                {
                    "heading": "Purpose",
                    "content": (
                        "No usable circular text was available to summarize. "
                        "This often happens when Extract only captured a scanner watermark "
                        "(e.g. CamScanner). Re-run Extract so OCR can read the scanned PDF, then Process again."
                    ),
                }
            ],
            "actionItems": [
                "Re-run Extract on the original PDF (OCR), then Process again.",
            ],
            "rawMarkdown": "",
            "mode": "fallback",
        }
        summary["rawMarkdown"] = _build_markdown(summary)
        return summary

    dates = collect_valid_dates(text, entities)
    orgs = top_org_entities(entities)
    laws = _entity_lines(entities, "LAW")
    people = _entity_lines(entities, "PERSON")

    circular_no = extract_circular_number(text)
    issued_date = extract_issued_date(text)
    target_audience = extract_target_audience(text)
    effective_date = extract_effective_date(text)

    subject = extract_subject(text)
    purpose = subject or _first_paragraph(text)
    sections = [
        {"heading": "Purpose", "content": purpose or "See the circular text for full context."},
    ]

    requirements = extract_key_requirements(text)
    if requirements:
        sections.append(
            {
                "heading": "Key requirements",
                "content": "\n".join(f"• {item}" for item in requirements),
            }
        )

    if laws:
        sections.append(
            {
                "heading": "Legal & circular references",
                "content": "\n".join(f"• {item}" for item in laws[:12]),
            }
        )

    if dates:
        sections.append(
            {
                "heading": "Deadlines & dates",
                "content": "\n".join(f"• {item}" for item in dates),
            }
        )

    if orgs or people:
        clean_people = [
            p
            for p in people
            if not LETTERHEAD_NOISE_PATTERN.match(p)
            and not is_letterhead_line(p)
            and len(p) >= 8
            and " " in p
        ]
        parties = orgs + [p for p in clean_people if p not in orgs]
        if parties:
            sections.append(
                {
                    "heading": "Responsible parties",
                    "content": "\n".join(f"• {item}" for item in parties[:10]),
                }
            )

    # Build target audience section if extracted
    if target_audience:
        sections.insert(1, {
            "heading": "Target audience",
            "content": "\n".join(f"• {item}" for item in target_audience),
        })

    action_items = extract_action_items(text, entities)

    # Determine issuing authority from entities
    issued_by = None
    for org in orgs:
        if "ministry" in org.lower() and "education" in org.lower():
            issued_by = org
            break
    if not issued_by and orgs:
        issued_by = orgs[0]

    summary = {
        "circularNumber": circular_no,
        "issuedDate": issued_date,
        "issuedBy": issued_by,
        "targetAudience": ", ".join(target_audience) if target_audience else None,
        "effectiveDate": effective_date,
        "title": build_summary_title(text),
        "sections": sections,
        "actionItems": action_items,
        "rawMarkdown": "",
        "mode": "fallback",
    }
    summary["rawMarkdown"] = _build_markdown(summary)
    return summary


# ──────────────────────────────────────────────────────────────────────
# Public entry point
# ──────────────────────────────────────────────────────────────────────

def summarize_text(
    text: str,
    entities: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    text = normalize_moe_text(text or "")
    entities = entities or []
    chunk_count = len(split_text(text)) if len(text) > settings.map_reduce_threshold else 1

    if llm_is_configured():
        try:
            summary, tokens, chunk_count = llm_summarize(text, entities)
            meta = {
                "model": active_model_name(),
                "tokensUsed": tokens,
                "mode": "llm",
                "provider": active_provider(),
                "chunkCount": chunk_count,
            }
        except Exception as exc:
            logger.warning("LLM summarization failed, falling back: %s", _describe_llm_error(exc))
            summary = fallback_summarize(text, entities)
            meta = {
                "model": "extractive-fallback",
                "tokensUsed": 0,
                "mode": "fallback",
                "provider": active_provider(),
                "chunkCount": 1,
                "llmError": _describe_llm_error(exc),
            }
    else:
        summary = fallback_summarize(text, entities)
        meta = {
            "model": "extractive-fallback",
            "tokensUsed": 0,
            "mode": "fallback",
            "provider": "none",
            "chunkCount": 1,
        }

    warnings = verify_summary_dates(text, entities, summary)
    return {
        "summary": summary,
        "guardrailWarnings": warnings,
        "processingMeta": meta,
    }
