# Production env (Render + Vercel + NVIDIA)

## Live URLs (EasyCircular)

| Layer | URL |
|-------|-----|
| Frontend | https://frontend-five-self-66.vercel.app |
| Backend | https://easycircular-backend.onrender.com |
| AI | https://easycircular-ai.onrender.com |

## Render: `easycircular-ai` (standard plan recommended)

OCR + SpaCy need ≥2GB RAM. Free/starter (512MB) OOMs on scanned PDFs.

```
LLM_PROVIDER=openai
OPENAI_API_KEY=<nvapi-key>
OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_MODEL=meta/llama-3.1-8b-instruct
AI_SERVICE_TOKEN=<shared-random-token>
OCR_LANGUAGES=eng
```

Use `OCR_LANGUAGES=sin+eng+tam` only if the instance has enough RAM for Tesseract.

## Render: `easycircular-backend` (free OK)

```
NODE_ENV=production
MONGODB_URI=<mongodb+srv Atlas URI>/easycircular
AI_SERVICE_URL=https://easycircular-ai.onrender.com
AI_SERVICE_TOKEN=<same-as-ai>
JWT_SECRET=<long-random>
CORS_ORIGINS=https://frontend-five-self-66.vercel.app,http://localhost:3002
UPLOAD_DIR=/app/backend/uploads
```

## Vercel: frontend (Root Directory = `frontend`)

```
NEXT_PUBLIC_API_URL=https://easycircular-backend.onrender.com
```

Redeploy after changing `NEXT_PUBLIC_*`.

## Notes

- Rotate any API keys that were pasted in chat.
- Blueprint file: [render.yaml](../render.yaml)
- Smoke: `BACKEND_URL=https://easycircular-backend.onrender.com node scripts/smoke-prod.mjs`
