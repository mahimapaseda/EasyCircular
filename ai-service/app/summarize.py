"""Circular summarization — LLM-powered and extractive fallback."""

import json
import logging
import re
import time
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.chunking import split_text
from app.config import settings
from app.guardrails import detect_topic_bleed, verify_summary_dates
from app.llm import active_model_name, active_provider, get_chat_model, llm_is_configured
from app.moe_text import (
    CIRCULAR_NUMBER_PATTERNS,
    LETTERHEAD_NOISE_PATTERN,
    build_summary_title,
    collect_valid_dates,
    extract_action_items,
    extract_circular_number,
    extract_effective_date,
    extract_issued_date,
    extract_key_requirements,
    extract_register_purpose,
    extract_subject,
    extract_target_audience,
    is_letterhead_line,
    looks_like_staff_register,
    normalize_moe_text,
    top_org_entities,
)
from app.output_schema import validate_llm_output

logger = logging.getLogger("easycircular.ai.summarize")

FEWSHOT_DIR = Path(__file__).resolve().parents[1] / "training" / "fewshot"
# Bump when prompt/few-shot/guardrail behaviour changes so the backend cache misses.
SUMMARIZER_VERSION = "v2-source-fewshot"

_OVERLAP_STOPWORDS = frozenset(
    {
        "the",
        "and",
        "for",
        "are",
        "this",
        "that",
        "with",
        "from",
        "under",
        "all",
        "who",
        "have",
        "has",
        "been",
        "was",
        "were",
        "will",
        "not",
        "any",
        "its",
        "their",
        "than",
        "into",
        "also",
        "such",
        "shall",
        "must",
        "should",
        "please",
        "make",
        "sure",
        "included",
        "herein",
        "related",
        "products",
        "types",
    }
)


def _is_curated_fewshot(payload: dict) -> bool:
    """Accept gold few-shot files; skip smoke/debug dumps."""
    gold = payload.get("gold")
    if not isinstance(gold, dict):
        return False
    if not payload.get("id") or not payload.get("source_excerpt"):
        return False
    return bool(gold.get("title") or gold.get("circularNumber"))


@lru_cache(maxsize=1)
def _load_fewshot_examples() -> list[dict]:
    """Load short gold examples for the summarize system prompt (llama3.2:3b budget)."""
    if not FEWSHOT_DIR.is_dir():
        return []
    examples: list[dict] = []
    for path in sorted(FEWSHOT_DIR.glob("*.json")):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            logger.warning("Skipping few-shot file %s: %s", path.name, exc)
            continue
        if isinstance(payload, dict) and _is_curated_fewshot(payload):
            examples.append(payload)
    return examples


def _compact_circular_token(value: str) -> str:
    return re.sub(r"\s+", "", (value or "").lower())


def _example_identity_keys(example: dict) -> set[str]:
    """Filename / circular-number tokens that identify a few-shot example."""
    keys: set[str] = set()
    example_id = str(example.get("id") or "").lower().strip()
    if example_id:
        keys.add(example_id)
        keys.add(example_id.replace("-", "/"))
        match = re.match(r"^(\d{1,4})-(\d{2,4})([a-z].*)?$", example_id)
        if match:
            number, year, _suffix = match.group(1), match.group(2), match.group(3)
            year_digits = re.match(r"(\d{4})", year)
            keys.add(f"{number}/{year}")
            keys.add(f"{number}-{year}")
            if year_digits:
                keys.add(f"{number}/{year_digits.group(1)}")
                keys.add(f"{number}-{year_digits.group(1)}")
                keys.add(f"{year_digits.group(1)}/{number}")
                keys.add(f"{year_digits.group(1)}-{number}")
    gold_number = str((example.get("gold") or {}).get("circularNumber") or "")
    if gold_number:
        compact = _compact_circular_token(gold_number)
        keys.add(compact)
        keys.add(compact.replace("/", "-"))
        base = re.sub(r"\([^)]*\)", "", compact)
        keys.add(base)
        keys.add(base.replace("/", "-"))
    return {key for key in keys if key and len(key) >= 3}


def _source_circular_keys(text: str, filename: str | None = None) -> set[str]:
    """Circular numbers / filename stems present in this document."""
    keys: set[str] = set()
    if filename:
        stem = re.sub(r"\.pdf$", "", Path(filename).name, flags=re.IGNORECASE).lower()
        keys.add(stem)
        match = re.match(r"^(\d{1,4})-(\d{2,4}[a-z0-9]*)", stem)
        if match:
            number, year = match.group(1), match.group(2)
            keys.add(f"{number}-{year}")
            keys.add(f"{number}/{year}")
            year_digits = re.match(r"(\d{4})", year)
            if year_digits:
                keys.add(f"{number}-{year_digits.group(1)}")
                keys.add(f"{number}/{year_digits.group(1)}")
                keys.add(f"{year_digits.group(1)}/{number}")
                keys.add(f"{year_digits.group(1)}-{number}")

    known = extract_circular_number(text or "", filename)
    if known:
        compact = _compact_circular_token(known)
        keys.add(compact)
        keys.add(compact.replace("/", "-"))
        base = re.sub(r"\([^)]*\)", "", compact)
        keys.add(base)
        keys.add(base.replace("/", "-"))

    for pattern in CIRCULAR_NUMBER_PATTERNS:
        for match in pattern.finditer(text or ""):
            compact = _compact_circular_token(match.group(1))
            keys.add(compact)
            keys.add(compact.replace("/", "-"))
    return {key for key in keys if key and len(key) >= 3}


def _fewshot_overlap_tokens(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]{3,}", (text or "").lower())
        if token not in _OVERLAP_STOPWORDS
    }


def _fewshot_overlap_score(example: dict, source_blob: str) -> float:
    excerpt = str(example.get("source_excerpt") or "")
    gold = example.get("gold") or {}
    example_blob = excerpt + " " + str(gold.get("title") or "")
    example_tokens = _fewshot_overlap_tokens(example_blob)
    source_tokens = _fewshot_overlap_tokens(source_blob)
    if not example_tokens or not source_tokens:
        return 0.0
    return len(example_tokens & source_tokens) / len(example_tokens)


def _select_fewshot_examples(
    examples: list[dict],
    limit: int = 1,
    *,
    source_text: str = "",
    filename: str | None = None,
) -> list[dict]:
    """Pick few-shots that match this circular; never inject a foreign circular number."""
    if not examples or limit <= 0:
        return []

    source_blob = f"{filename or ''}\n{source_text or ''}"
    source_keys = _source_circular_keys(source_text or "", filename)
    scored: list[tuple[float, dict]] = []

    for example in examples:
        identity = _example_identity_keys(example)
        matched = bool(source_keys & identity)
        # Never inject an example whose circular number is absent from the source
        # when the document already identifies a different circular.
        if source_keys and not matched:
            continue
        overlap = _fewshot_overlap_score(example, source_blob)
        score = overlap + (10.0 if matched else 0.0)
        scored.append((score, example))

    if not scored:
        return []

    scored.sort(key=lambda pair: pair[0], reverse=True)
    if not source_keys:
        top_score, top_example = scored[0]
        if top_score < 0.12:
            return []
        return [top_example][:limit]
    return [example for _score, example in scored[:limit]]


def _format_fewshot_block(
    source_text: str = "",
    filename: str | None = None,
) -> str:
    examples = _select_fewshot_examples(
        _load_fewshot_examples(),
        limit=1,
        source_text=source_text,
        filename=filename,
    )
    if not examples:
        return ""
    parts = ["## Few-shot examples (follow this JSON shape; do not copy these facts into other circulars)"]
    for ex in examples:
        excerpt = str(ex.get("source_excerpt") or "")[:380]
        gold = ex.get("gold") or {}
        # Compact gold to save context for llama3.2:3b
        compact = {
            "circularNumber": gold.get("circularNumber"),
            "issuedDate": gold.get("issuedDate"),
            "issuedBy": gold.get("issuedBy"),
            "targetAudience": gold.get("targetAudience"),
            "effectiveDate": gold.get("effectiveDate"),
            "title": gold.get("title"),
            "sections": (gold.get("sections") or [])[:3],
            "actionItems": (gold.get("actionItems") or [])[:4],
        }
        parts.append(
            f"\n### Example {ex.get('id', 'sample')}\n"
            f"Source (truncated):\n{excerpt}\n\n"
            f"JSON:\n{json.dumps(compact, ensure_ascii=False)}"
        )
    return "\n".join(parts)


def _build_system_prompt_summarize(
    source_text: str = "",
    filename: str | None = None,
) -> str:
    fewshot = _format_fewshot_block(source_text, filename)
    return SYSTEM_PROMPT_SUMMARIZE_BASE + ("\n\n" + fewshot if fewshot else "")


# ──────────────────────────────────────────────────────────────────────
# Enhanced LLM Prompts
# ──────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT_SUMMARIZE_BASE = """\
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
- Few-shot examples are format only — never copy their circular numbers, dates, or topics
  into a different circular. If the source is an Annexure/form, say so in the title.
"""

# Backward-compatible name used in tests / imports
SYSTEM_PROMPT_SUMMARIZE = SYSTEM_PROMPT_SUMMARIZE_BASE

# ──────────────────────────────────────────────────────────────────────
# Label priority for entity injection into LLM prompts.
# Higher-priority labels are sent first so they are never truncated.
# ──────────────────────────────────────────────────────────────────────
ENTITY_PRIORITY = {"LAW": 4, "DATE": 3, "ORG": 2, "PERSON": 1, "OTHER": 0}
MAX_ENTITIES_IN_PROMPT = 24


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
# Enhanced LLM Prompts (base prompt + few-shot loader are defined above)
# ──────────────────────────────────────────────────────────────────────

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
    """Parse LLM JSON with fence stripping and brace extraction for fragile 3B models."""
    content = (content or "").strip()
    if not content:
        raise json.JSONDecodeError("Empty LLM response", content, 0)

    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*", "", content, flags=re.IGNORECASE)
        content = re.sub(r"\s*```\s*$", "", content)

    # Prefer the outermost JSON object if the model added commentary.
    start = content.find("{")
    end = content.rfind("}")
    if start >= 0 and end > start:
        content = content[start : end + 1]

    # Common 3B glitches: trailing commas, smart quotes
    repaired = content.replace("\u201c", '"').replace("\u201d", '"').replace("\u2019", "'")
    repaired = re.sub(r",\s*([}\]])", r"\1", repaired)

    try:
        parsed = json.loads(repaired)
    except json.JSONDecodeError:
        # Last resort: truncate after last complete top-level value
        parsed = json.loads(content)

    if not isinstance(parsed, dict):
        raise json.JSONDecodeError("LLM JSON root must be an object", content, 0)
    return parsed


def _describe_llm_error(exc: Exception) -> str:
    message = str(exc)
    if "RESOURCE_EXHAUSTED" in message or "429" in message:
        return "LLM quota exceeded (429). The provider rate/usage limit was hit — try again later."
    if isinstance(exc, json.JSONDecodeError):
        return "LLM returned a response that could not be parsed as JSON."
    return f"{type(exc).__name__}: {message[:200]}"


def _prepare_text_for_llm(text: str, *, filename: str | None = None) -> str:
    """Shrink long OCR circulars for small local models while keeping the operative head."""
    text = normalize_moe_text(text or "")
    if len(text) <= 12000:
        return text

    header = text[:4500]
    # Keep paragraphs that look like operative MOE content
    keep_pat = re.compile(
        r"(?:circular|financial\s+regulation|establishments?\s+code|"
        r"shall|mandatory|with\s+effect|annexure|accordingly|"
        r"delegation|allowance|duty\s+hours|section\s+\d)",
        re.IGNORECASE,
    )
    selected: list[str] = [header]
    used = len(header)
    for para in re.split(r"\n\s*\n", text[4500:]):
        para = para.strip()
        if len(para) < 40 or not keep_pat.search(para):
            continue
        if used + len(para) > 12000:
            break
        selected.append(para)
        used += len(para) + 2

    circ = extract_circular_number(text, filename)
    note = f"[NOTE: Source truncated for summarization; circular={circ or 'unknown'}]\n\n"
    return note + "\n\n".join(selected)


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
    known_circular: str | None = None,
    source_text: str | None = None,
    filename: str | None = None,
) -> tuple[dict[str, Any], int]:
    # Cap entities for small local models
    capped = entities[:24]
    entity_summary = json.dumps(capped, ensure_ascii=False)
    circ_hint = ""
    if known_circular:
        circ_hint = (
            f"Known circular number from filename/header (use this; do not invent): "
            f"{known_circular}\n"
        )
    if re.search(r"\bannexure\b", chunk[:1500], re.IGNORECASE):
        circ_hint += (
            "This source looks like an Annexure/form. Title should mention Annexure/"
            "staff return — do NOT invent an unrelated policy topic.\n"
        )


    if is_reduce:
        system_prompt = SYSTEM_PROMPT_REDUCE
        user_prompt = f"""{circ_hint}Partial summaries to merge:
{chunk}

Extracted entities:
{entity_summary}

Return ONLY a single JSON object."""
    else:
        system_prompt = _build_system_prompt_summarize(
            source_text or chunk, filename=filename
        )
        # Truncate chunk further if still huge after prepare
        body = chunk if len(chunk) <= 9000 else chunk[:9000]
        user_prompt = f"""{circ_hint}Source circular text:
{body}

Extracted entities (JSON):
{entity_summary}

Return ONLY one JSON object with keys circularNumber, issuedDate, issuedBy,
targetAudience, effectiveDate, title, sections, actionItems.
Do not invent circular numbers (never use Annexure as a circular number).
No markdown fences, no commentary."""

    llm = get_chat_model()
    max_attempts = settings.llm_max_retries + 1
    response = _invoke_with_retry(llm, _llm_messages(system_prompt, user_prompt), max_attempts=max_attempts)

    content = response.content
    if isinstance(content, list):
        content = "".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in content
        )

    try:
        raw_parsed = _parse_llm_json(str(content))
    except json.JSONDecodeError:
        # One repair pass: ask the model to convert its previous output to JSON only
        repair_prompt = (
            "Convert the following into ONE valid JSON object with keys "
            "circularNumber, issuedDate, issuedBy, targetAudience, effectiveDate, "
            "title, sections, actionItems. Return JSON only.\n\n" + str(content)[:6000]
        )
        repair_resp = _invoke_with_retry(
            llm,
            _llm_messages(
                "You fix malformed JSON. Return ONLY valid JSON. No markdown.",
                repair_prompt,
            ),
            max_attempts=1,
        )
        repair_content = repair_resp.content
        if isinstance(repair_content, list):
            repair_content = "".join(
                block.get("text", "") if isinstance(block, dict) else str(block)
                for block in repair_content
            )
        raw_parsed = _parse_llm_json(str(repair_content))
        response = repair_resp

    # Validate and normalise through Pydantic schema
    validated = validate_llm_output(raw_parsed)
    if known_circular and not validated.get("circularNumber"):
        validated["circularNumber"] = known_circular
    validated["mode"] = "llm"
    validated["rawMarkdown"] = _build_markdown(validated)
    return validated, _token_usage(response)


def llm_summarize(
    text: str,
    entities: list[dict[str, Any]],
    *,
    filename: str | None = None,
) -> tuple[dict[str, Any], int, int]:
    known_circular = extract_circular_number(text, filename)
    prepared = _prepare_text_for_llm(text, filename=filename)
    prioritised = _prioritise_entities(entities)
    chunks = split_text(prepared, filename=filename)
    # Cap map-reduce depth for small local models
    if len(chunks) > 3:
        chunks = chunks[:3]
    chunk_count = len(chunks)

    if chunk_count == 1:
        summary, tokens = _summarize_chunk(
            chunks[0],
            prioritised,
            known_circular=known_circular,
            source_text=text,
            filename=filename,
        )
        return summary, tokens, chunk_count

    partials: list[str] = []
    total_tokens = 0

    for chunk in chunks:
        partial, tokens = _summarize_chunk(
            chunk,
            prioritised,
            known_circular=known_circular,
            source_text=text,
            filename=filename,
        )
        total_tokens += tokens
        # Keep partials compact for reduce step
        partials.append(
            json.dumps(
                {
                    "circularNumber": partial.get("circularNumber"),
                    "title": partial.get("title"),
                    "sections": (partial.get("sections") or [])[:4],
                    "actionItems": (partial.get("actionItems") or [])[:6],
                },
                ensure_ascii=False,
            )
        )

    merged_blob = "\n\n---\n\n".join(partials)
    summary, reduce_tokens = _summarize_chunk(
        merged_blob,
        prioritised,
        is_reduce=True,
        known_circular=known_circular,
        source_text=text,
        filename=filename,
    )
    return summary, total_tokens + reduce_tokens, chunk_count


# ──────────────────────────────────────────────────────────────────────
# Enriched Fallback Summarizer
# ──────────────────────────────────────────────────────────────────────

def fallback_summarize(
    text: str,
    entities: list[dict[str, Any]],
    *,
    filename: str | None = None,
) -> dict[str, Any]:
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

    circular_no = extract_circular_number(text, filename)
    issued_date = extract_issued_date(text)
    target_audience = extract_target_audience(text)
    effective_date = extract_effective_date(text)

    subject = extract_subject(text)
    if looks_like_staff_register(text):
        purpose = extract_register_purpose(text) or subject or _first_paragraph(text, limit=1200)
    else:
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
        "title": build_summary_title(text, filename),
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

def _normalize_circular_metadata(
    summary: dict[str, Any],
    text: str,
    *,
    filename: str | None = None,
) -> tuple[dict[str, Any], list[str]]:
    """Replace invented circular numbers (e.g. Annexure 02/03, bare ED refs) with extracted ones."""
    warnings: list[str] = []
    trusted = extract_circular_number(text, filename)
    raw = (summary.get("circularNumber") or "").strip()
    if not raw and trusted:
        summary["circularNumber"] = trusted
        return summary, warnings

    if not raw:
        return summary, warnings

    invented = bool(
        re.search(r"annexure", raw, re.IGNORECASE)
        or re.match(r"^ED/", raw, re.IGNORECASE)
        or not re.search(r"\d{1,4}\s*/\s*\d{2,4}", raw)
    )
    if invented and trusted:
        warnings.append(
            f"Replaced invented circularNumber '{raw}' with '{trusted}' from source/filename."
        )
        summary["circularNumber"] = trusted
        title = summary.get("title") or ""
        if raw in title:
            summary["title"] = title.replace(raw, trusted)
    elif invented:
        warnings.append(f"Dropped invented circularNumber '{raw}'.")
        summary["circularNumber"] = None
    elif trusted:
        # Prefer spaced-normalized form from extractor when LLM has minor OCR spacing
        summary["circularNumber"] = re.sub(r"\s+", "", raw) if "/" in raw else trusted

    return summary, warnings


def summarize_text(
    text: str,
    entities: list[dict[str, Any]] | None = None,
    *,
    filename: str | None = None,
) -> dict[str, Any]:
    text = normalize_moe_text(text or "")
    entities = entities or []
    prepared = _prepare_text_for_llm(text, filename=filename)
    chunk_count = (
        len(split_text(prepared)) if len(prepared) > settings.map_reduce_threshold else 1
    )

    if llm_is_configured():
        try:
            summary, tokens, chunk_count = llm_summarize(
                text, entities, filename=filename
            )
            meta = {
                "model": active_model_name(),
                "tokensUsed": tokens,
                "mode": "llm",
                "provider": active_provider(),
                "chunkCount": chunk_count,
            }
        except Exception as exc:
            logger.warning("LLM summarization failed, falling back: %s", _describe_llm_error(exc))
            summary = fallback_summarize(text, entities, filename=filename)
            meta = {
                "model": "extractive-fallback",
                "tokensUsed": 0,
                "mode": "fallback",
                "provider": active_provider(),
                "chunkCount": 1,
                "llmError": _describe_llm_error(exc),
            }
    else:
        summary = fallback_summarize(text, entities, filename=filename)
        meta = {
            "model": "extractive-fallback",
            "tokensUsed": 0,
            "mode": "fallback",
            "provider": "none",
            "chunkCount": 1,
        }

    summary, circ_warnings = _normalize_circular_metadata(
        summary, text, filename=filename
    )
    bleed_warnings: list[str] = []
    if summary.get("mode") == "llm":
        bleed_warnings = detect_topic_bleed(
            text,
            summary,
            filename=filename,
            fewshot_examples=_load_fewshot_examples(),
            document_circular=extract_circular_number(text, filename),
        )
        if bleed_warnings:
            logger.warning(
                "Discarding LLM summary due to topic bleed: %s", bleed_warnings
            )
            summary = fallback_summarize(text, entities, filename=filename)
            summary, extra_circ = _normalize_circular_metadata(
                summary, text, filename=filename
            )
            circ_warnings = extra_circ + circ_warnings
            meta = {
                **meta,
                "model": "extractive-fallback",
                "mode": "fallback",
                "llmError": "topic-bleed: discarded LLM summary",
            }

    if summary.get("rawMarkdown"):
        summary["rawMarkdown"] = _build_markdown(summary)

    meta["summarizerVersion"] = SUMMARIZER_VERSION
    warnings = verify_summary_dates(text, entities, summary) + circ_warnings + bleed_warnings
    return {
        "summary": summary,
        "guardrailWarnings": warnings,
        "processingMeta": meta,
    }
