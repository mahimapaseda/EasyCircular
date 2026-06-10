import base64
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.pdf_parser import parse_pdf_bytes

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


class ParsePdfRequest(BaseModel):
    base64: str = Field(..., description="Base64-encoded PDF bytes")
    filename: str | None = None


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
