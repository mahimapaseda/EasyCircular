import logging
import os
import time
from datetime import datetime, timezone

from dotenv import load_dotenv

# Load .env before importing app modules that read Settings.from_env().
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.llm import (
    SUPPORTED_PROVIDERS,
    active_model_name,
    active_provider,
    llm_is_configured,
    ollama_has_model,
    ollama_is_reachable,
)
from app.routes_v1 import router as v1_router
from app.internal_auth import require_ai_token

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s | %(message)s",
)
logger = logging.getLogger("easycircular.ai")

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

app.middleware("http")(require_ai_token)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.1f}"
    if request.url.path != "/health":
        logger.info("%s %s -> %s (%.1fms)", request.method, request.url.path, response.status_code, elapsed_ms)
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal AI service error", "path": request.url.path},
    )


app.include_router(v1_router)


@app.get("/health")
def health():
    provider = active_provider()
    reachable = ollama_is_reachable() if provider == "ollama" else None
    model_ready = ollama_has_model() if provider == "ollama" and reachable else None
    return {
        "service": "ai-service",
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "apiVersion": "v1",
        "llm_provider": provider,
        "llm_model": active_model_name(),
        "llm_configured": llm_is_configured(),
        "llm_providers_supported": list(SUPPORTED_PROVIDERS),
        "ollama_reachable": reachable,
        "ollama_model_ready": model_ready,
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
