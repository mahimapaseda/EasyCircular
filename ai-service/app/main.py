import base64
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.llm import active_model_name, llm_is_configured
from app.ner import extract_entities
from app.pdf_parser import parse_pdf_bytes
from app.summarize import summarize_text

load_dotenv()

app = FastAPI(
    title="EasyCircular AI Service",
    version="0.2.0",
    description="Stateless NLP pipeline for MOE circular processing",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ParsePdfRequest(BaseModel):
    base64: str = Field(..., description="Base64-encoded PDF bytes")
    filename: str | None = None


class TextRequest(BaseModel):
    text: str = Field(..., min_length=1)


class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=1)
    entities: list[dict] | None = None


class PipelineRequest(BaseModel):
    text: str = Field(..., min_length=1)


@app.get("/health")
def health():
    provider = os.getenv("LLM_PROVIDER", "openai")
    return {
        "service": "ai-service",
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "llm_provider": provider,
        "llm_model": active_model_name(),
        "llm_configured": llm_is_configured(),
    }


@app.get("/")
def root():
    return {
        "name": "EasyCircular AI Service",
        "version": "0.2.0",
        "health": "/health",
    }


@app.post("/parse/pdf")
def parse_pdf(request: ParsePdfRequest):
    try:
        pdf_bytes = base64.b64decode(request.base64, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 PDF data") from exc

    if len(pdf_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="PDF exceeds 20 MB limit")

    try:
        result = parse_pdf_bytes(pdf_bytes)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not parse PDF: {exc}",
        ) from exc

    return {
        "text": result.text,
        "pages": result.pages,
        "ocrUsed": result.ocr_used,
        "ocrLang": result.ocr_lang,
        "pageTexts": result.page_texts,
        "error": result.error,
        "filename": request.filename,
    }


@app.post("/extract/entities")
def extract_entities_endpoint(request: TextRequest):
    entities = extract_entities(request.text)
    return {"entities": entities, "count": len(entities)}


@app.post("/summarize")
def summarize_endpoint(request: SummarizeRequest):
    result = summarize_text(request.text, request.entities or [])
    return result


@app.post("/pipeline")
def pipeline_endpoint(request: PipelineRequest):
    entities = extract_entities(request.text)
    result = summarize_text(request.text, entities)
    return {
        "entities": entities,
        **result,
    }
