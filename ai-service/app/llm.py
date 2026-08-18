import os
from urllib.error import URLError
from urllib.request import Request, urlopen

from langchain_core.language_models.chat_models import BaseChatModel

from app.config import settings

SUPPORTED_PROVIDERS = ("openai", "gemini", "groq", "ollama")


def active_provider() -> str:
    return os.getenv("LLM_PROVIDER", "openai").lower().strip()


def ollama_base_url() -> str:
    return os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")


def ollama_is_reachable(timeout_sec: float = 1.5) -> bool:
    """Return True when the local Ollama HTTP API responds to /api/tags."""
    url = f"{ollama_base_url()}/api/tags"
    try:
        req = Request(url, method="GET")
        with urlopen(req, timeout=timeout_sec) as response:
            return 200 <= getattr(response, "status", 200) < 300
    except (URLError, TimeoutError, OSError, ValueError):
        return False


def ollama_has_model(timeout_sec: float = 1.5) -> bool:
    """Return True when the configured Ollama model is present locally."""
    import json

    model = active_model_name()
    url = f"{ollama_base_url()}/api/tags"
    try:
        req = Request(url, method="GET")
        with urlopen(req, timeout=timeout_sec) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (URLError, TimeoutError, OSError, ValueError, json.JSONDecodeError):
        return False

    names = []
    for item in payload.get("models") or []:
        name = str(item.get("name") or item.get("model") or "").strip()
        if name:
            names.append(name)

    if model in names:
        return True
    # Allow tag-less match: "llama3.2:3b" vs "llama3.2:3b" / "llama3.2"
    base = model.split(":", 1)[0]
    return any(name == model or name.startswith(f"{base}:") or name == base for name in names)


def llm_is_configured() -> bool:
    provider = active_provider()
    if provider == "gemini":
        return bool(os.getenv("GOOGLE_API_KEY", "").strip())
    if provider == "groq":
        return bool(os.getenv("GROQ_API_KEY", "").strip())
    if provider == "openai":
        return bool(os.getenv("OPENAI_API_KEY", "").strip())
    if provider == "ollama":
        # Local Ollama needs no cloud key, but the daemon must be up.
        return ollama_is_reachable()
    return False


def active_model_name() -> str:
    provider = active_provider()
    if provider == "gemini":
        return os.getenv("GEMINI_MODEL", os.getenv("LLM_MODEL", "gemini-3.5-flash"))
    if provider == "groq":
        return os.getenv("GROQ_MODEL", os.getenv("LLM_MODEL", "llama-3.3-70b-versatile"))
    if provider == "ollama":
        return os.getenv("OLLAMA_MODEL", os.getenv("LLM_MODEL", "llama3.2:3b"))
    return os.getenv("LLM_MODEL", "gpt-4o-mini")


def get_chat_model(
    temperature: float | None = None,
    max_output_tokens: int | None = None,
    max_retries: int | None = None,
) -> BaseChatModel:
    provider = active_provider()
    temp = temperature if temperature is not None else float(os.getenv("LLM_TEMPERATURE", "0.2"))
    max_tokens = max_output_tokens if max_output_tokens is not None else settings.llm_max_output_tokens
    retries = max_retries if max_retries is not None else settings.llm_max_retries

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        api_key = os.getenv("GOOGLE_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY is required when LLM_PROVIDER=gemini")

        model = active_model_name()
        return ChatGoogleGenerativeAI(
            model=model,
            temperature=temp,
            google_api_key=api_key,
            max_output_tokens=max_tokens,
            max_retries=retries,
        )

    if provider == "groq":
        from langchain_groq import ChatGroq

        api_key = os.getenv("GROQ_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is required when LLM_PROVIDER=groq")

        model = active_model_name()
        return ChatGroq(
            model=model,
            temperature=temp,
            groq_api_key=api_key,
            max_tokens=max_tokens,
            max_retries=retries,
        )

    if provider == "openai":
        from langchain_openai import ChatOpenAI

        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")

        model = active_model_name()
        return ChatOpenAI(
            model=model,
            temperature=temp,
            api_key=api_key,
            max_tokens=max_tokens,
            max_retries=retries,
        )

    if provider == "ollama":
        from langchain_ollama import ChatOllama

        if not ollama_is_reachable():
            raise RuntimeError(
                "Ollama is not reachable at "
                f"{ollama_base_url()}. Start it with scripts/start-ollama.ps1"
            )

        model = active_model_name()
        # Default Ollama num_ctx is 2048, which truncates MOE prompts mid-JSON.
        num_ctx = int(os.getenv("OLLAMA_NUM_CTX", "8192"))
        return ChatOllama(
            model=model,
            base_url=ollama_base_url(),
            temperature=temp,
            num_predict=max_tokens,
            num_ctx=num_ctx,
            format="json",
        )

    supported = ", ".join(SUPPORTED_PROVIDERS)
    raise RuntimeError(f"Unsupported LLM_PROVIDER '{provider}'. Use one of: {supported}")
