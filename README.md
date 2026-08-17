# EasyCircular

AI/NLP web application for Sri Lankan Ministry of Education circulars — upload PDFs, extract text, identify key entities, and produce structured summaries with human review.

**Stack:** Next.js · Express · FastAPI · MongoDB  
**Architecture:** API v1 · service-layer backend · session-scoped guest access · map-reduce summarization

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended), or:
- Node.js 20+, Python 3.11+, MongoDB 7
- **Local LLM (optional but recommended):** [Ollama](https://ollama.com/) with models stored under `G:\AI\models`

## Quick start (Docker)

```bash
# Copy environment templates (first time only)
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
cp frontend/.env.example frontend/.env.local

# Start all services
docker compose up --build
```

| Service     | URL                          |
|-------------|------------------------------|
| Frontend    | http://localhost:3002        |
| Backend API | http://localhost:4000/health |
| AI Service  | http://localhost:5000/health |
| MongoDB     | localhost:27017              |

Open http://localhost:3002 — the **System Status** panel on the home page should show all services as healthy.

**Note:** Docker Compose publishes the AI service on `127.0.0.1:5000` only (not the LAN). Backend Compose runs with `NODE_ENV=production`, so `JWT_SECRET` in `backend/.env` must not be the example placeholder. `AI_SERVICE_TOKEN` must match in `backend/.env` and `ai-service/.env`.

**Note:** Docker Compose does **not** include Ollama. For LLM summaries with `LLM_PROVIDER=ollama`, run Ollama on the host at `http://127.0.0.1:11434` (see below).

### Verify Phase 1 exit gate

With services running (Docker or local dev):

```bash
npm run verify:phase1
```

Checks AI `/health`, backend `/health` (MongoDB + AI reachable), and frontend HTTP 200.

## Local development (without Docker)

### Fast path (Windows)

```powershell
# First time: install Ollama (models go to G:\AI\models)
winget install Ollama.Ollama -e
[Environment]::SetEnvironmentVariable("OLLAMA_MODELS", "G:\AI\models", "User")

# Pull model + start Ollama, then open AI/backend/frontend terminals
npm run start:ollama
npm run start:local
```

### 1. MongoDB

```bash
docker compose up mongodb -d
```

Or use a local MongoDB Windows service on port 27017.

### 2. Local Ollama LLM (`G:\AI`)

```powershell
# Models directory (required for this project layout)
mkdir G:\AI\models -Force
$env:OLLAMA_MODELS = "G:\AI\models"

# Start daemon + pull default model (llama3.2:3b)
powershell -ExecutionPolicy Bypass -File .\scripts\start-ollama.ps1 -PullModel
```

In `ai-service/.env` set:

```
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
```

No cloud API key is required. If Ollama is down, the AI service falls back to extractive summaries.

### 3. AI service

```bash
cd ai-service
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 5000
```

### 4. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 5. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

**If you see `Cannot find module './948.js'` (or similar):** the `.next` cache is stale — usually because `npm run build` ran while `npm run dev` was still running. Stop the dev server, then:

```bash
cd frontend
npm run dev:clean
```

Do not run `npm run build` and `npm run dev` at the same time.

## Project structure

```
EasyCircular/
├── frontend/       # Next.js 14 App Router, Tailwind
├── backend/        # Express API, MongoDB
├── ai-service/     # FastAPI NLP pipeline
├── shared/         # Shared types (optional)
├── docs/           # API docs, evaluation notes
├── scripts/        # Dev and evaluation scripts
└── docker-compose.yml
```

## Phase 1 exit gate

- [x] Monorepo structure (`frontend`, `backend`, `ai-service`)
- [x] Docker Compose with MongoDB
- [x] Health endpoints on all services
- [x] Environment templates (`.env.example`)
- [x] Root README with run instructions
- [x] Phase 1 verification script (`npm run verify:phase1`)
- [x] Sample MOE circular PDFs in `docs/sample-circulars/` (`03-2014I`, `23-2026-Ta`, `Dengue_Sinhala`)

## Phase 2 — Document ingestion

- [x] `POST /api/circulars/upload` — PDF upload (max 50 MB, multer + `%PDF-` magic bytes)
- [x] `POST /api/circulars/:id/extract` — text extraction via AI service
- [x] `PATCH /api/circulars/:id/text` — save edited text
- [x] `GET /api/circulars` — list circulars (by account or browser session)
- [x] AI `POST /v1/parse/pdf` — pdfplumber → PyMuPDF → Tesseract OCR fallback (`sin+eng+tam` for MOE circulars)
- [x] Frontend upload, extract, review UI on `/circular/[id]`

**MongoDB must be running** before upload works (`docker compose up mongodb -d` or local MongoDB on port 27017).

Place test PDFs in `docs/sample-circulars/` (see README there). A local copy of your `sample circulars/` folder is synced there for development.

### Sinhala & Tamil OCR (Windows)

Scanned MOE circulars use Tesseract with **Sinhala + English + Tamil**:

```powershell
.\scripts\install-tesseract-languages.ps1
```

Then restart the AI service and click **Re-extract** on the circular page.

## Phase 3 — AI processing

- [x] SpaCy + regex NER (`POST /extract/entities`)
- [x] LangChain summarization (`POST /summarize`) with extractive fallback when LLM is unavailable
- [x] `POST /api/circulars/:id/process` — NER + summary with content-hash cache
- [x] Entity highlights + summary panel on `/circular/[id]`
- [x] Date guardrails (warnings when summary dates are not in source)

For LLM summaries set `LLM_PROVIDER=ollama` (local) or a cloud provider key (`OPENAI_API_KEY` / `GOOGLE_API_KEY` / `GROQ_API_KEY`). Without a reachable LLM, an extractive fallback is used.

## Phase 4 — MVP product completion

- [x] Export summary as **TXT** or **Markdown** from `/circular/[id]`
- [x] Toast notifications + **Retry** on errors
- [x] Circular list with status badges, entity counts, summary preview
- [x] Mobile-responsive workflow layout
- [x] `LLM_PROVIDER=openai|gemini|groq|ollama` (API keys for cloud providers; for local use `ollama` + `scripts/start-ollama.ps1`)

Verify the MVP flow:

```bash
npm run verify:phase4
```

Tune and evaluate against local sample circulars:

```bash
npm run evaluate:samples
```

Uses PDFs in `sample circulars/` and `docs/sample-circulars/`. See [docs/sample-circulars/README.md](./docs/sample-circulars/README.md).

## System redesign (v0.2)

| Layer | Changes |
|-------|---------|
| **Backend** | Service layer (`circularService`, `aiClient`), anonymous `X-Session-Id`, rate limiting on `/process`, centralized error handling |
| **AI service** | `/v1/*` endpoints, cached SpaCy model, chunked map-reduce summarization for long circulars |
| **Frontend** | Professional document-workspace UI, sidebar workflow stepper, session-aware API client |
| **Shared** | `shared/api-contract.js` workflow constants |

## Next: Phase 5

ROUGE evaluation, UAT, security hardening, CI, and staging deploy. See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).
