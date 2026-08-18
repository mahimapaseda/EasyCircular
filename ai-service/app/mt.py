"""Local NLLB-200 sentence translation (EN → Sinhala / Tamil).

Optional extra: pip install -r requirements-mt.txt
The model is lazy-loaded on first translate so the API can start without torch.
"""

from __future__ import annotations

import logging
import os
import re
import threading
from typing import Any

from app.config import settings
from app.summary_language import SummaryLang, text_has_target_script

logger = logging.getLogger("easycircular.ai.mt")

NLLB_LANG: dict[str, str] = {
    "en": "eng_Latn",
    "si": "sin_Sinh",
    "ta": "tam_Taml",
}

_SENTENCE_SPLIT = re.compile(r"(?<=[.!?।\n])\s+")
_MAX_CHUNK_CHARS = 400

_load_lock = threading.Lock()
_tokenizer: Any = None
_model: Any = None
_device: str | None = None


def mt_is_configured() -> bool:
    """True when torch/transformers are installed and translation is not disabled."""
    flag = os.getenv("TRANSLATE_DISABLED", "").strip().lower()
    if flag in {"1", "true", "yes"}:
        return False
    try:
        import torch  # noqa: F401
        import transformers  # noqa: F401
    except ImportError:
        return False
    return True


def _resolve_device() -> str:
    requested = (settings.translate_device or "auto").strip().lower()
    if requested in {"cpu", "cuda"}:
        if requested == "cuda":
            import torch

            if not torch.cuda.is_available():
                logger.warning("TRANSLATE_DEVICE=cuda but CUDA is unavailable; using CPU")
                return "cpu"
        return requested
    try:
        import torch

        return "cuda" if torch.cuda.is_available() else "cpu"
    except ImportError:
        return "cpu"


def _load_model() -> tuple[Any, Any, str]:
    global _tokenizer, _model, _device
    if _tokenizer is not None and _model is not None and _device is not None:
        return _tokenizer, _model, _device
    with _load_lock:
        if _tokenizer is not None and _model is not None and _device is not None:
            return _tokenizer, _model, _device
        try:
            import torch
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        except ImportError as exc:
            raise RuntimeError(
                "Sinhala/Tamil translation needs the NLLB extra. "
                "From ai-service run: pip install -r requirements-mt.txt"
            ) from exc

        name = settings.translate_model
        device = _resolve_device()
        os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
        logger.info("Loading NLLB model %s on %s (first run may download ~1.2 GB)", name, device)
        tokenizer = AutoTokenizer.from_pretrained(name)
        model = AutoModelForSeq2SeqLM.from_pretrained(name)
        model.to(device)
        model.eval()
        _tokenizer = tokenizer
        _model = model
        _device = device
        return tokenizer, model, device


def split_mt_sentences(text: str) -> list[str]:
    """Split on sentence boundaries; keep chunks short enough for NLLB."""
    raw = (text or "").strip()
    if not raw:
        return []
    if len(raw) <= _MAX_CHUNK_CHARS and "\n" not in raw:
        return [raw]
    parts = [part.strip() for part in _SENTENCE_SPLIT.split(raw) if part.strip()]
    if not parts:
        parts = [raw]
    chunks: list[str] = []
    buf = ""
    for part in parts:
        if len(part) > _MAX_CHUNK_CHARS:
            if buf:
                chunks.append(buf)
                buf = ""
            for i in range(0, len(part), _MAX_CHUNK_CHARS):
                chunks.append(part[i : i + _MAX_CHUNK_CHARS].strip())
            continue
        if buf and len(buf) + 1 + len(part) > _MAX_CHUNK_CHARS:
            chunks.append(buf)
            buf = part
        else:
            buf = f"{buf} {part}".strip() if buf else part
    if buf:
        chunks.append(buf)
    return chunks


def _generate_chunk(text: str, source: str, target: str) -> str:
    import torch

    tokenizer, model, device = _load_model()
    src_code = NLLB_LANG[source]
    tgt_code = NLLB_LANG[target]
    if hasattr(tokenizer, "src_lang"):
        tokenizer.src_lang = src_code
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    inputs = {key: value.to(device) for key, value in inputs.items()}
    bos = tokenizer.convert_tokens_to_ids(tgt_code)
    max_new = min(512, max(48, int(len(text.split()) * 3) + 24))
    with torch.inference_mode():
        tokens = model.generate(
            **inputs,
            forced_bos_token_id=bos,
            max_new_tokens=max_new,
            num_beams=3,
        )
    return tokenizer.batch_decode(tokens, skip_special_tokens=True)[0].strip()


def translate_text(
    text: str,
    source: SummaryLang | str = "en",
    target: SummaryLang | str = "si",
) -> str:
    """Translate one string with NLLB. Raises if the extra is missing."""
    source_lang = str(source or "en")
    target_lang = str(target or "si")
    if source_lang not in NLLB_LANG or target_lang not in NLLB_LANG:
        raise ValueError("source and target must be en, si, or ta")
    raw = (text or "").strip()
    if not raw:
        return ""
    if source_lang == target_lang:
        return raw
    if target_lang in ("si", "ta") and text_has_target_script(raw, target_lang):  # type: ignore[arg-type]
        return raw
    if not mt_is_configured():
        raise RuntimeError(
            "Sinhala/Tamil translation needs the NLLB extra. "
            "From ai-service run: pip install -r requirements-mt.txt"
        )

    pieces: list[str] = []
    for chunk in split_mt_sentences(raw):
        try:
            out = _generate_chunk(chunk, source_lang, target_lang)
        except Exception as exc:
            logger.warning("NLLB chunk failed: %s", exc)
            raise RuntimeError(
                f"{'Sinhala' if target_lang == 'si' else 'Tamil'} translation failed. "
                "Stay on English or install the NLLB extra."
            ) from exc
        pieces.append(out or chunk)
    return " ".join(pieces).strip()
