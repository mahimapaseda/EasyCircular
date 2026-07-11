import base64

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.ner import extract_entities
from app.pdf_parser import parse_pdf_bytes
from app.summarize import summarize_text

router = APIRouter(prefix="/v1", tags=["v1"])


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


@router.post("/parse/pdf")
def parse_pdf(request: ParsePdfRequest):
    try:
        pdf_bytes = base64.b64decode(request.base64, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 PDF data") from exc

    if len(pdf_bytes) > settings.max_upload_bytes:
        max_mb = settings.max_upload_bytes // (1024 * 1024)
        raise HTTPException(status_code=400, detail=f"PDF exceeds {max_mb} MB limit")

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


@router.post("/extract/entities")
def extract_entities_endpoint(request: TextRequest):
    entities = extract_entities(request.text)
    return {"entities": entities, "count": len(entities)}


@router.post("/summarize")
def summarize_endpoint(request: SummarizeRequest):
    return summarize_text(request.text, request.entities or [])


@router.post("/pipeline")
def pipeline_endpoint(request: PipelineRequest):
    entities = extract_entities(request.text)
    result = summarize_text(request.text, entities)
    return {
        "entities": entities,
        **result,
    }
