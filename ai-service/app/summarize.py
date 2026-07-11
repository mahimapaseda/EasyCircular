import json
import re
from typing import Any

from app.chunking import split_text
from app.config import settings
from app.guardrails import verify_summary_dates
from app.llm import active_model_name, active_provider, get_chat_model, llm_is_configured
from app.moe_text import (
    build_summary_title,
    collect_valid_dates,
    extract_action_items,
    extract_key_requirements,
    extract_subject,
    top_org_entities,
)


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


def fallback_summarize(text: str, entities: list[dict[str, Any]]) -> dict[str, Any]:
    dates = collect_valid_dates(text, entities)
    orgs = top_org_entities(entities)
    laws = _entity_lines(entities, "LAW")
    people = _entity_lines(entities, "PERSON")

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
        parties = orgs + [p for p in people if p not in orgs]
        sections.append(
            {
                "heading": "Responsible parties",
                "content": "\n".join(f"• {item}" for item in parties[:10]),
            }
        )

    action_items = extract_action_items(text, entities)

    summary = {
        "title": build_summary_title(text),
        "sections": sections,
        "actionItems": action_items,
        "rawMarkdown": "",
        "mode": "fallback",
    }
    summary["rawMarkdown"] = _build_markdown(summary)
    return summary


def _parse_llm_json(content: str) -> dict[str, Any]:
    content = content.strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)
    return json.loads(content)


def _llm_messages(system_prompt: str, user_prompt: str):
    from langchain_core.messages import HumanMessage, SystemMessage

    return [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]


def _token_usage(response) -> int:
    metadata = getattr(response, "response_metadata", {}) or {}
    usage = metadata.get("token_usage") or metadata.get("usage") or {}
    return int(usage.get("total_tokens") or usage.get("totalTokens") or 0)


def _summarize_chunk(
    chunk: str,
    entities: list[dict[str, Any]],
    *,
    is_reduce: bool = False,
) -> tuple[dict[str, Any], int]:
    entity_summary = json.dumps(entities[:80], ensure_ascii=False)

    if is_reduce:
        system_prompt = """You merge partial summaries of one Sri Lankan MOE circular into a single JSON summary.
Return ONLY valid JSON:
{"title":"string","sections":[{"heading":"string","content":"string"}],"actionItems":["string"]}
Rules: preserve legal meaning; do not invent dates; deduplicate sections."""
        user_prompt = f"""Partial summaries to merge:
{chunk}

Extracted entities:
{entity_summary}"""
    else:
        system_prompt = """You summarize Sri Lankan Ministry of Education circulars for school administrators.
Return ONLY valid JSON with this schema:
{
  "title": "string",
  "sections": [{"heading": "string", "content": "string"}],
  "actionItems": ["string"]
}
Rules:
- Preserve legal meaning; do not invent rules, dates, or deadlines.
- Every date in the summary MUST appear in the source text or entity list.
- Skip letterhead and recipient distribution lists; focus on the policy subject and operative instructions.
- Use sections: Purpose, Key requirements, Deadlines & dates, Responsible parties (omit empty sections).
- Purpose should state the circular subject in plain language, not a list of recipients.
- actionItems: concrete steps for principals and school staff.
- Be concise and faithful to the source."""
        user_prompt = f"""Source circular text:
{chunk}

Extracted entities (JSON):
{entity_summary}

Produce the JSON summary."""

    llm = get_chat_model()
    response = llm.invoke(_llm_messages(system_prompt, user_prompt))

    content = response.content
    if isinstance(content, list):
        content = "".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in content
        )

    parsed = _parse_llm_json(str(content))
    parsed["mode"] = "llm"
    parsed["rawMarkdown"] = _build_markdown(parsed)
    return parsed, _token_usage(response)


def llm_summarize(
    text: str,
    entities: list[dict[str, Any]],
) -> tuple[dict[str, Any], int, int]:
    chunks = split_text(text)
    chunk_count = len(chunks)

    if chunk_count == 1:
        summary, tokens = _summarize_chunk(chunks[0], entities)
        return summary, tokens, chunk_count

    partials: list[str] = []
    total_tokens = 0

    for chunk in chunks:
        partial, tokens = _summarize_chunk(chunk, entities)
        total_tokens += tokens
        partials.append(json.dumps(partial, ensure_ascii=False))

    merged_blob = "\n\n---\n\n".join(partials)
    summary, reduce_tokens = _summarize_chunk(merged_blob, entities, is_reduce=True)
    return summary, total_tokens + reduce_tokens, chunk_count


def summarize_text(
    text: str,
    entities: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
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
        except Exception:
            summary = fallback_summarize(text, entities)
            meta = {
                "model": "extractive-fallback",
                "tokensUsed": 0,
                "mode": "fallback",
                "provider": active_provider(),
                "chunkCount": 1,
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
