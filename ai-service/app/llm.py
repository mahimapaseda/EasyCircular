import os

from langchain_core.language_models.chat_models import BaseChatModel


def llm_is_configured() -> bool:
    provider = os.getenv("LLM_PROVIDER", "openai").lower()
    if provider == "gemini":
        return bool(os.getenv("GOOGLE_API_KEY", "").strip())
    return bool(os.getenv("OPENAI_API_KEY", "").strip())


def get_chat_model(temperature: float | None = None) -> BaseChatModel:
    provider = os.getenv("LLM_PROVIDER", "openai").lower()
    temp = temperature if temperature is not None else float(os.getenv("LLM_TEMPERATURE", "0.2"))

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        api_key = os.getenv("GOOGLE_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY is required when LLM_PROVIDER=gemini")

        model = os.getenv("GEMINI_MODEL", os.getenv("LLM_MODEL", "gemini-2.0-flash"))
        return ChatGoogleGenerativeAI(model=model, temperature=temp, google_api_key=api_key)

    from langchain_openai import ChatOpenAI

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")

    model = os.getenv("LLM_MODEL", "gpt-4o-mini")
    return ChatOpenAI(model=model, temperature=temp, api_key=api_key)


def active_model_name() -> str:
    provider = os.getenv("LLM_PROVIDER", "openai").lower()
    if provider == "gemini":
        return os.getenv("GEMINI_MODEL", os.getenv("LLM_MODEL", "gemini-2.0-flash"))
    return os.getenv("LLM_MODEL", "gpt-4o-mini")
