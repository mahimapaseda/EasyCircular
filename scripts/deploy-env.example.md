# Production env checklist (Railway + Vercel)

Do not commit real secrets. Set these in Railway / Vercel dashboards.

## Railway: `ai-service`

```
PORT=5000
LLM_PROVIDER=openai
OPENAI_API_KEY=<nvapi-rotated-key>
OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_MODEL=meta/llama-3.1-8b-instruct
AI_SERVICE_TOKEN=<shared-random-token>
```

Dockerfile: `ai-service/Dockerfile` (root directory `ai-service`).

## Railway: `backend`

```
PORT=4000
NODE_ENV=production
MONGODB_URI=<railway-mongo-or-atlas-uri>
AI_SERVICE_URL=http://<ai-service>.railway.internal:5000
AI_SERVICE_TOKEN=<same-as-ai>
JWT_SECRET=<long-random>
CORS_ORIGINS=https://<your-app>.vercel.app,http://localhost:3002
UPLOAD_DIR=/app/backend/uploads
```

Dockerfile: `backend/Dockerfile` with **build context = repo root**.

## Railway: MongoDB

Add Railway MongoDB plugin (or Atlas). Copy connection string into backend `MONGODB_URI`.

## Vercel: `frontend`

- Root Directory: `frontend`
- Env: `NEXT_PUBLIC_API_URL=https://<backend-public>.up.railway.app`
- Redeploy after changing `NEXT_PUBLIC_*` vars
