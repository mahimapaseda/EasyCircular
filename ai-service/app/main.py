import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(
    title="EasyCircular AI Service",
    version="0.1.0",
    description="Stateless NLP pipeline for MOE circular processing",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "service": "ai-service",
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "llm_model": os.getenv("LLM_MODEL", "gpt-4o-mini"),
    }


@app.get("/")
def root():
    return {
        "name": "EasyCircular AI Service",
        "version": "0.1.0",
        "health": "/health",
    }
