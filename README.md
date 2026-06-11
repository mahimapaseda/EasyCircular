# EasyCircular

AI/NLP web application for Sri Lankan Ministry of Education circulars — upload PDFs, extract text, identify key entities, and produce structured summaries with human review.

**Stack:** Next.js · Express · FastAPI · MongoDB

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended), or:
- Node.js 20+, Python 3.11+, MongoDB 7

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

Open http://localhost:3002 — the **System Status** panel should show all services as healthy.

### Verify Phase 1 exit gate

With services running (Docker or local dev):

```bash
npm run verify:phase1
```

Checks AI `/health`, backend `/health` (MongoDB + AI reachable), and frontend HTTP 200.

## Local development (without Docker)

### 1. MongoDB

```bash
docker compose up mongodb -d
```

### 2. AI service

```bash
cd ai-service
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 5000
```

### 3. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 4. Frontend

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
- [ ] Sample MOE circular PDFs in `docs/sample-circulars/` (collect before Phase 2)

## Phase 2 — Document ingestion

- [x] `POST /api/circulars/upload` — PDF upload (max 20 MB, multer)
- [x] `POST /api/circulars/:id/extract` — text extraction via AI service
- [x] `PATCH /api/circulars/:id/text` — save edited text
- [x] `GET /api/circulars` — list circulars (by account or browser session)
- [x] AI `POST /parse/pdf` — pdfplumber → PyMuPDF → Tesseract OCR fallback (`sin+eng+tam` for MOE circulars)
- [x] Frontend upload, extract, review UI on `/circular/[id]`

**MongoDB must be running** before upload works (`docker compose up mongodb -d` or local MongoDB on port 27017).

Place test PDFs in `docs/sample-circulars/` (see README there).

### Sinhala & Tamil OCR (Windows)

Scanned MOE circulars use Tesseract with **Sinhala + English + Tamil**:

```powershell
.\scripts\install-tesseract-languages.ps1
```

Then restart the AI service and click **Re-extract** on the circular page.

## Phase 3 — AI processing

- [x] SpaCy + regex NER (`POST /extract/entities`)
- [x] LangChain summarization (`POST /summarize`) with extractive fallback when no API key
- [x] `POST /api/circulars/:id/process` — NER + summary with content-hash cache
- [x] Entity highlights + summary panel on `/circular/[id]`
- [x] Date guardrails (warnings when summary dates are not in source)

Set `OPENAI_API_KEY` in `ai-service/.env` for LLM summaries; otherwise an extractive fallback is used.

## Phase 4 — MVP product completion

- [x] Export summary as **TXT** or **Markdown** from `/circular/[id]`
- [x] Toast notifications + **Retry** on errors
- [x] Circular list with status badges, entity counts, summary preview
- [x] Mobile-responsive workflow layout
- [x] `LLM_PROVIDER=openai|gemini` (set `OPENAI_API_KEY` or `GOOGLE_API_KEY`)

Verify the MVP flow:

```bash
npm run verify:phase4
```

## Next: Phase 5

ROUGE evaluation, UAT, security hardening, CI, and staging deploy. See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).
