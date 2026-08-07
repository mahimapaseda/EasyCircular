import os

import pytest

from app.llm import (
    SUPPORTED_PROVIDERS,
    active_model_name,
    active_provider,
    llm_is_configured,
    ollama_has_model,
    ollama_is_reachable,
)


@pytest.mark.parametrize("provider,key_name", [
    ("gemini", "GOOGLE_API_KEY"),
    ("groq", "GROQ_API_KEY"),
    ("openai", "OPENAI_API_KEY"),
])
def test_llm_is_configured_by_provider(monkeypatch, provider, key_name):
    monkeypatch.setenv("LLM_PROVIDER", provider)
    for name in ("GOOGLE_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY"):
        monkeypatch.delenv(name, raising=False)

    assert llm_is_configured() is False

    monkeypatch.setenv(key_name, "test-key")
    assert llm_is_configured() is True


def test_llm_is_configured_for_ollama_requires_reachability(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    for name in ("GOOGLE_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY"):
        monkeypatch.delenv(name, raising=False)

    monkeypatch.setattr("app.llm.ollama_is_reachable", lambda timeout_sec=1.5: False)
    assert llm_is_configured() is False

    monkeypatch.setattr("app.llm.ollama_is_reachable", lambda timeout_sec=1.5: True)
    assert llm_is_configured() is True


def test_active_model_name_for_groq(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    assert active_provider() == "groq"
    assert active_model_name() == "llama-3.3-70b-versatile"


def test_active_model_name_for_gemini(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-3.5-flash")
    assert active_provider() == "gemini"
    assert active_model_name() == "gemini-3.5-flash"


def test_active_model_name_for_ollama(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    monkeypatch.setenv("OLLAMA_MODEL", "llama3.2:3b")
    assert active_provider() == "ollama"
    assert active_model_name() == "llama3.2:3b"


def test_ollama_has_model_matches_tags(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    monkeypatch.setenv("OLLAMA_MODEL", "llama3.2:3b")

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def read(self):
            return b'{"models":[{"name":"llama3.2:3b"}]}'

        status = 200

    monkeypatch.setattr("app.llm.urlopen", lambda *args, **kwargs: FakeResponse())
    assert ollama_has_model() is True


def test_ollama_is_reachable_false_on_error(monkeypatch):
    from urllib.error import URLError

    def boom(*args, **kwargs):
        raise URLError("down")

    monkeypatch.setattr("app.llm.urlopen", boom)
    assert ollama_is_reachable() is False


def test_supported_providers():
    assert "gemini" in SUPPORTED_PROVIDERS
    assert "groq" in SUPPORTED_PROVIDERS
    assert "openai" in SUPPORTED_PROVIDERS
    assert "ollama" in SUPPORTED_PROVIDERS
