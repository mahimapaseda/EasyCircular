import os
from dataclasses import dataclass

from dotenv import load_dotenv

# Ensure ai-service/.env is available for CLI scripts and uvicorn imports.
load_dotenv()


@dataclass(frozen=True)
class Settings:
    port: int
    llm_provider: str
    llm_model: str
    gemini_model: str
    groq_model: str
    ollama_model: str
    ollama_base_url: str
    llm_temperature: float
    llm_max_retries: int
    llm_max_output_tokens: int
    spacy_model: str
    ocr_languages: str
    chunk_size: int
    chunk_overlap: int
    map_reduce_threshold: int
    max_upload_bytes: int

    @classmethod
    def from_env(cls) -> "Settings":
        max_upload_mb = int(os.getenv("MAX_UPLOAD_MB", "50"))
        return cls(
            port=int(os.getenv("PORT", "5000")),
            llm_provider=os.getenv("LLM_PROVIDER", "openai").lower(),
            llm_model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
            gemini_model=os.getenv("GEMINI_MODEL", os.getenv("LLM_MODEL", "gemini-3.5-flash")),
            groq_model=os.getenv("GROQ_MODEL", os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")),
            ollama_model=os.getenv("OLLAMA_MODEL", os.getenv("LLM_MODEL", "llama3.2:3b")),
            ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/"),
            llm_temperature=float(os.getenv("LLM_TEMPERATURE", "0.2")),
            llm_max_retries=int(os.getenv("LLM_MAX_RETRIES", "2")),
            llm_max_output_tokens=int(os.getenv("LLM_MAX_OUTPUT_TOKENS", "4096")),
            spacy_model=os.getenv("SPACY_MODEL", "en_core_web_sm"),
            ocr_languages=os.getenv("OCR_LANGUAGES", "sin+eng+tam"),
            chunk_size=int(os.getenv("CHUNK_SIZE", "8000")),
            chunk_overlap=int(os.getenv("CHUNK_OVERLAP", "600")),
            map_reduce_threshold=int(os.getenv("MAP_REDUCE_THRESHOLD", "10000")),
            max_upload_bytes=max_upload_mb * 1024 * 1024,
        )


settings = Settings.from_env()
