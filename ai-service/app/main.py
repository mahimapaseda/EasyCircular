import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.llm import active_model_name, llm_is_configured
from app.routes_v1 import router as v1_router

load_dotenv()

app = FastAPI(
    title="EasyCircular AI Service",
    version="0.3.0",
    description="Stateless NLP pipeline for MOE circular processing",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)


@app.get("/health")
def health():
    provider = os.getenv("LLM_PROVIDER", "openai")
    return {
        "service": "ai-service",
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "apiVersion": "v1",
        "llm_provider": provider,
        "llm_model": active_model_name(),
        "llm_configured": llm_is_configured(),
    }


@app.get("/")
def root():
    return {
        "name": "EasyCircular AI Service",
        "version": "0.3.0",
        "apiVersion": "v1",
        "health": "/health",
        "endpoints": "/v1/parse/pdf, /v1/extract/entities, /v1/summarize, /v1/pipeline",
    }
