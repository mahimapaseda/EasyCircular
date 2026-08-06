import os

from langchain_core.language_models.chat_models import BaseChatModel

from app.config import settings

SUPPORTED_PROVIDERS = ("openai", "gemini", "groq")


def active_provider() -> str:
    return os.getenv("LLM_PROVIDER", "openai").lower().strip()


def llm_is_configured() -> bool:
    provider = active_provider()
    if provider == "gemini":
        return bool(os.getenv("GOOGLE_API_KEY", "").strip())
    if provider == "groq":
        return bool(os.getenv("GROQ_API_KEY", "").strip())
    if provider == "openai":
        return bool(os.getenv("OPENAI_API_KEY", "").strip())
    return False


def active_model_name() -> str:
    provider = active_provider()
    if provider == "gemini":
        return os.getenv("GEMINI_MODEL", os.getenv("LLM_MODEL", "gemini-3.5-flash"))
    if provider == "groq":
        return os.getenv("GROQ_MODEL", os.getenv("LLM_MODEL", "llama-3.3-70b-versatile"))
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

    supported = ", ".join(SUPPORTED_PROVIDERS)
    raise RuntimeError(f"Unsupported LLM_PROVIDER '{provider}'. Use one of: {supported}")

