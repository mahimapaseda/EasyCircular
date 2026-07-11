import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    port: int
    llm_provider: str
    llm_model: str
    gemini_model: str
    groq_model: str
    llm_temperature: float
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
            llm_temperature=float(os.getenv("LLM_TEMPERATURE", "0.2")),
            spacy_model=os.getenv("SPACY_MODEL", "en_core_web_sm"),
            ocr_languages=os.getenv("OCR_LANGUAGES", "sin+eng+tam"),
            chunk_size=int(os.getenv("CHUNK_SIZE", "6000")),
            chunk_overlap=int(os.getenv("CHUNK_OVERLAP", "400")),
            map_reduce_threshold=int(os.getenv("MAP_REDUCE_THRESHOLD", "10000")),
            max_upload_bytes=max_upload_mb * 1024 * 1024,
        )


settings = Settings.from_env()
