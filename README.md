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

## Next: Phase 2

PDF upload, text extraction (PyMuPDF + OCR), and manual text review. See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).
