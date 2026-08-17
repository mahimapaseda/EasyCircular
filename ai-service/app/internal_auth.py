import os

from fastapi import Request
from fastapi.responses import JSONResponse

PUBLIC_PATHS = frozenset({"/", "/health", "/docs", "/openapi.json", "/redoc"})


def ai_service_token() -> str:
    return (os.getenv("AI_SERVICE_TOKEN") or "").strip()


async def require_ai_token(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    path = request.url.path
    if path in PUBLIC_PATHS or path.startswith("/docs"):
        return await call_next(request)

    expected = ai_service_token()
    if not expected:
        if os.getenv("NODE_ENV") == "production":
            return JSONResponse(
                status_code=503,
                content={"detail": "AI_SERVICE_TOKEN is not configured"},
            )
        return await call_next(request)

    provided = (request.headers.get("x-ai-service-token") or "").strip()
    if not provided:
        auth = request.headers.get("authorization") or ""
        if auth.startswith("Bearer "):
            provided = auth[7:].strip()

    if provided != expected:
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

    return await call_next(request)
