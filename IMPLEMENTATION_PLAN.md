# EasyCircular — Implementation Plan

**Project:** EasyCircular — AI/NLP web application for Sri Lankan Ministry of Education circulars  
**Methodology:** Agile (2-week sprints)  
**Target stack:** Next.js · Node.js/Express · Python AI microservice · MongoDB  
**Document version:** 1.1 — June 2026

---

## 1. Project phases overview

The build is divided into **five phases**. Each phase has a clear outcome, exit criteria, and mapped sprints. Phases must complete in order; work inside a phase may overlap only where noted.

| Phase | Name | Duration | Sprints | Outcome |
|-------|------|----------|---------|---------|
| **1** | Foundation & Infrastructure | Week 1 | Sprint 0 | Monorepo running locally; all services healthy |
| **2** | Document Ingestion Pipeline | Weeks 2–3 | Sprints 1–2 | Upload PDF → extract text → user can edit (incl. OCR) |
| **3** | AI Processing Core | Weeks 4–6 | Sprints 3–4 | NER + structured summarization with guardrails |
| **4** | Product Completion (MVP) | Week 7 | Sprint 5 | Demo-ready end-to-end user flow |
| **5** | Validation, Release & Enhancement | Weeks 8–10+ | Sprints 6–8 | Evaluated, deployed, UAT-complete artefact |

```
Phase:  [  1 Foundation  ][  2 Ingestion  ][    3 AI Core     ][ 4 MVP ][   5 Validate & Release   ]
Week:   1               2    3           4    5    6          7       8    9    10        (11+)
Sprint: S0              S1   S2          S3   S4              S5      S6   S7   S8
```

### Phase exit gates

| Phase | Exit gate (must pass before next phase) |
|-------|----------------------------------------|
| 1 | `docker compose up` runs frontend, backend, AI service, and MongoDB; health checks pass |
| 2 | Sample PDF uploads successfully; extracted text displayed; user edits persist; OCR works on scanned PDF |
| 3 | Entities highlighted on test circulars; structured summary generated with no invented dates on test set |
| 4 | Full workflow (upload → review → summarize → view) demo-ready on 3 circulars; list page live |
| 5 | ROUGE scores documented; UAT report complete; staging deployment accessible |

### Post-MVP backlog (Phase 6 — optional, after Phase 5)

Deferred enhancements not required for the dissertation artefact MVP:

- Full Sinhala/Tamil NLP pipeline (custom models, bilingual UI)
- User authentication and role-based access
- Batch upload and admin analytics dashboard
- Direct MOE portal integration

---

## 2. Goals and success criteria

### Primary goal
Build a web application that lets school administrators upload PDF circulars, extract text, identify key entities (dates, names, legal references), and produce faithful structured summaries — with human review before final use.

### Phase 4 (MVP) success criteria
| Criterion | Target |
|-----------|--------|
| Upload & parse PDF | Extract readable text from ≥90% of sample circulars |
| Summarization | Produce structured summary with sections (purpose, actions, deadlines) |
| Entity extraction | Highlight dates and named references with ≥80% precision on test set |
| User flow | Upload → review extracted text → view summary + entities in one session |
| Performance | End-to-end processing under 60s for a typical 10-page circular |
| Privacy | No circular stored on third-party LLM beyond transient API call; cache summaries locally |

### Phase 5 success criteria
- ROUGE evaluation pipeline against 5–10 human reference summaries
- UAT with school staff (≥5 participants)
- Staging deployment with CI pipeline
- Documented API and user guide

### Phase 6+ success criteria (future)
- Sinhala/English mixed circular support at production quality
- User accounts and persistent circular history per user
- Source sentence linking (summary bullet → original paragraph)

---

## 3. System architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  Upload · Text review · Summary view · Entity highlights         │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST / JSON
┌────────────────────────────▼────────────────────────────────────┐
│                     Backend API (Node.js)                        │
│  Auth · File storage · Job orchestration · MongoDB · Cache       │
└────────────────────────────┬────────────────────────────────────┘
                             │ Internal HTTP
┌────────────────────────────▼────────────────────────────────────┐
│                   AI Microservice (Python/FastAPI)               │
│  PDF parse · OCR fallback · NER · Summarize (LangChain + LLM)    │
└─────────────────────────────────────────────────────────────────┘
```

### Repository layout (monorepo)

```
EasyCircular/
├── frontend/          # Next.js 14+ App Router, Tailwind
├── backend/           # Express API, MongoDB models, file uploads
├── ai-service/        # FastAPI, PyMuPDF, SpaCy, LangChain
├── shared/            # Shared TypeScript types / OpenAPI spec (optional)
├── docs/              # API docs, evaluation datasets notes
├── scripts/           # Dev setup, seed data, evaluation runners
├── docker-compose.yml # Local dev: mongo + all services
└── IMPLEMENTATION_PLAN.md
```

### Service responsibilities

| Service | Port (dev) | Responsibility |
|---------|------------|----------------|
| `frontend` | 3002 | UI, upload, display, edit extracted text |
| `backend` | 4000 | REST API, MongoDB, S3/local file storage, call AI service |
| `ai-service` | 5000 | Stateless NLP pipeline |
| `mongodb` | 27017 | Documents, summaries, cache |

---

## 4. Feature breakdown by phase

Features are grouped by the phase in which they are delivered.

### Phase 1 — Foundation
- [x] Monorepo structure (`frontend`, `backend`, `ai-service`)
- [x] Docker Compose with MongoDB
- [x] Health endpoints on all services
- [x] Environment templates (`.env.example`)
- [x] Root README with local run instructions

### Phase 2 — Document ingestion
- [ ] PDF upload (single file, max 20 MB)
- [ ] Text extraction (PyMuPDF + pdfplumber)
- [ ] Tesseract OCR fallback for scanned PDFs
- [ ] Manual text edit before AI processing
- [ ] MongoDB persistence for circular records
- [ ] Basic error handling and loading states

### Phase 3 — AI processing core
- [ ] NER: dates, person/org names, legal clause patterns (SpaCy + regex)
- [ ] Abstractive + extractive hybrid summary via LLM (LangChain)
- [ ] Structured summary output (purpose, requirements, deadlines, actions)
- [ ] Summary caching by content hash
- [ ] Entity highlight UI in source text
- [ ] Hallucination guardrails (date verification, low temperature)

### Phase 4 — MVP product completion
- [ ] Summary panel with structured sections
- [ ] Circular list/history page
- [ ] Processing status step indicator (upload → extract → review → summarize)
- [ ] Export summary (TXT/Markdown)
- [ ] Mobile-responsive layout
- [ ] Environment-based LLM provider (OpenAI / Gemini)

### Phase 5 — Validation & release
- [ ] ROUGE evaluation script and reference dataset
- [ ] Rate limiting and API cost logging
- [ ] Security pass (upload validation, env audit)
- [ ] UAT sessions with school staff
- [ ] Sinhala OCR language pack (Tesseract `sin`)
- [ ] CI pipeline (GitHub Actions)
- [ ] Staging deployment + API docs + user guide

### Phase 6 — Future enhancements (post-MVP)
- [ ] User authentication (email/password or Google)
- [ ] Full Sinhala NER model or dedicated multilingual pipeline
- [ ] Source sentence linking (summary bullet → original paragraph)
- [ ] Admin dashboard (usage stats)
- [ ] Batch upload
- [ ] Async job queue for long circulars

### Out of scope (all phases)
- Mobile native app
- Real-time collaboration
- Direct MOE system integration

---

## 5. Data model (MongoDB)

### Collection: `circulars`

```javascript
{
  _id: ObjectId,
  originalFilename: String,
  filePath: String,           // local or object storage key
  contentHash: String,        // SHA-256 of extracted text (cache key)
  extractedText: String,
  editedText: String | null,  // user-corrected text before AI
  status: "uploaded" | "extracted" | "processing" | "completed" | "failed",
  summary: {
    title: String,
    sections: [{ heading: String, content: String }],
    actionItems: [String],
    rawMarkdown: String
  },
  entities: [{
    text: String,
    label: "DATE" | "PERSON" | "ORG" | "LAW" | "OTHER",
    start: Number,
    end: Number
  }],
  processingMeta: {
    model: String,
    tokensUsed: Number,
    durationMs: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 6. API design (backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/circulars/upload` | Upload PDF, store file, return `circularId` |
| `POST` | `/api/circulars/:id/extract` | Trigger text extraction via AI service |
| `PATCH` | `/api/circulars/:id/text` | Save user-edited text |
| `POST` | `/api/circulars/:id/process` | Run NER + summarization (check cache first) |
| `GET` | `/api/circulars/:id` | Full circular with summary and entities |
| `GET` | `/api/circulars` | List all circulars (paginated) |
| `DELETE` | `/api/circulars/:id` | Remove circular and file |

### AI service internal endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/parse/pdf` | `{ file_path \| base64 }` → `{ text, pages, ocrUsed }` |
| `POST` | `/extract/entities` | `{ text }` → `{ entities[] }` |
| `POST` | `/summarize` | `{ text, entities? }` → `{ summary }` |
| `POST` | `/pipeline` | Full pipeline in one call (optional) |
| `GET` | `/health` | Service health check |

---

## 7. AI pipeline design

### Step 1 — PDF parsing
1. Try `pdfplumber` for layout-aware extraction.
2. Fallback to `PyMuPDF` for scanned or malformed PDFs.
3. If text density per page is below threshold → run **Tesseract OCR** (English + Sinhala packs).
4. Return raw text + page boundaries + confidence flags.

### Step 2 — Named entity recognition
1. **SpaCy** `en_core_web_sm` (or `trf` if GPU available) for English entities.
2. **Regex rules** for Sri Lankan admin patterns:
   - Dates: `DD/MM/YYYY`, `YYYY-MM-DD`, Sinhala month names
   - Circular refs: `Circular No. XX/YYYY`
   - Legal refs: `Education Ordinance`, `Section XX`
3. Merge and deduplicate entity spans.

### Step 3 — Summarization (LangChain)
1. **Chunking:** Split long circulars (~3,000 tokens per chunk with overlap).
2. **Map-reduce or refine:** Per-chunk summaries → consolidated summary.
3. **Structured output prompt** (JSON schema):
   - Purpose
   - Key requirements
   - Deadlines & dates
   - Responsible parties
   - Action items
4. **Guardrails:**
   - System prompt: preserve legal meaning; do not invent rules
   - Post-check: every date in summary must appear in source text or entity list
   - Temperature ≤ 0.3

### Step 4 — Caching
- Hash `editedText || extractedText` → skip LLM if identical circular already processed.
- Store in MongoDB with TTL optional for dev.

---

## 8. Frontend pages

| Route | Purpose |
|-------|---------|
| `/` | Landing + upload dropzone |
| `/circulars` | List of processed circulars |
| `/circular/[id]` | Workflow: extract → edit text → process → view results |
| `/circular/[id]/summary` | Summary + entity sidebar (optional split) |

### Key UI components
- `UploadDropzone` — drag-and-drop PDF
- `TextEditor` — editable extracted text (textarea or lightweight editor)
- `SummaryPanel` — structured sections + action items
- `EntityHighlight` — inline highlights in source text
- `ProcessingStatus` — step indicator (upload → extract → review → summarize)

---

## 9. Security and privacy

| Concern | Mitigation |
|---------|------------|
| Sensitive admin data | HTTPS only; env secrets; no logging of full circular text |
| LLM data retention | Use provider API with zero-retention policy where available |
| File uploads | Validate MIME type + extension; scan size; store outside web root |
| API abuse | Rate limit `/process` endpoint |
| Transport | TLS in production; internal network for AI service in deployment |

---

## 10. Testing strategy by phase

| Phase | Testing focus |
|-------|----------------|
| 1 | Smoke tests: all services start; health endpoints return 200 |
| 2 | PDF fixtures: native PDF, scanned PDF, corrupt file; text edit persistence |
| 3 | pytest: NER regex/date patterns; mock LLM; hallucination date check |
| 4 | Frontend component tests (upload flow); end-to-end manual test on 3 circulars |
| 5 | ROUGE-1/2/L vs human summaries; UAT checklist; security audit |

| Layer | Approach | Phase |
|-------|----------|-------|
| AI service | pytest: PDF fixtures, entity regex tests, mock LLM responses | 2–3 |
| Backend | Jest/Supertest: route integration with mocked AI service | 2–4 |
| Frontend | Component tests (Vitest/React Testing Library) for upload flow | 4 |
| Evaluation | ROUGE against 5–10 human-written reference summaries | 5 |
| UAT | Checklist for school staff: clarity, accuracy, time saved | 5 |

### Sample test circulars needed
- Short policy update (2–3 pages) — Phase 2
- Long procedural circular (10+ pages) — Phase 3
- Scanned PDF (OCR path) — Phase 2
- Mixed Sinhala/English — Phase 5 (basic); Phase 6 (full)

---

## 11. Phase & sprint plan (10 weeks)

---

### Phase 1 — Foundation & Infrastructure
**Duration:** Week 1 · **Sprint 0**

**Goal:** Runnable monorepo skeleton with all services communicating locally.

**Deliverables:**
- Monorepo folders: `frontend/`, `backend/`, `ai-service/`
- `docker-compose.yml` (MongoDB)
- Express backend with MongoDB connection + `/health`
- FastAPI AI service with `/health`
- Next.js frontend with Tailwind + API client stub
- `.env.example` per service; root `README.md`

#### Sprint 0 — Project setup (Week 1)

| Task | Owner | Deliverable |
|------|-------|-------------|
| Init monorepo folders | Dev | `frontend/`, `backend/`, `ai-service/` |
| Docker Compose (MongoDB) | Dev | `docker-compose.yml` |
| Backend scaffold | Dev | Express + MongoDB connection + health route |
| AI service scaffold | Dev | FastAPI + `/health` |
| Frontend scaffold | Dev | Next.js + Tailwind + API client |
| Env templates | Dev | `.env.example` per service |
| README with run instructions | Dev | `README.md` |

**Phase 1 exit gate:** `docker compose up` starts all services; frontend shows health status.

---

### Phase 2 — Document Ingestion Pipeline
**Duration:** Weeks 2–3 · **Sprints 1–2**

**Goal:** Users can upload PDF circulars, extract text (including scanned docs via OCR), and correct extraction errors before AI processing.

**Deliverables:**
- Upload API + file storage
- PDF parsing pipeline (PyMuPDF, pdfplumber, OCR fallback)
- Text review UI with save/edit
- Circular MongoDB records with status workflow

#### Sprint 1 — PDF ingestion (Week 2)
**Goal:** Upload PDF and extract text.

| Task | Deliverable |
|------|-------------|
| `POST /upload` with multer | Stored PDF + MongoDB record |
| AI `/parse/pdf` | PyMuPDF + pdfplumber pipeline |
| Frontend upload page | File picker + progress |
| Extract button + display raw text | `/circular/[id]` step 1 |

**Sprint 1 done when:** User uploads sample PDF and sees extracted text.

#### Sprint 2 — Text review & OCR (Week 3)
**Goal:** User can correct text; OCR handles scans.

| Task | Deliverable |
|------|-------------|
| PATCH `/text` endpoint | Save edited text |
| Tesseract OCR fallback | Flag `ocrUsed` in response |
| Text editor UI | Save + re-extract option |
| Error states | Empty extraction, corrupt PDF |

**Phase 2 exit gate:** Scanned PDF processed via OCR; user edits persist; corrupt/empty PDFs handled gracefully.

---

### Phase 3 — AI Processing Core
**Duration:** Weeks 4–6 · **Sprints 3–4**

**Goal:** Automatically extract entities and generate structured, legally faithful summaries with anti-hallucination guardrails.

**Deliverables:**
- SpaCy + regex NER module
- LangChain summarization with structured JSON output
- Content-hash caching
- Entity highlights + summary panel in UI

#### Sprint 3 — NER (Week 4)
**Goal:** Extract and display entities.

| Task | Deliverable |
|------|-------------|
| SpaCy + regex NER module | `/extract/entities` |
| Backend orchestration | `POST /process` phase 1 (entities only) |
| Entity highlight UI | Color-coded spans in source text |
| Unit tests for date/legal patterns | pytest fixtures |

**Sprint 3 done when:** Dates and circular references highlighted on sample docs.

#### Sprint 4 — Summarization (Week 5–6)
**Goal:** Structured LLM summary with guardrails.

| Task | Deliverable |
|------|-------------|
| LangChain summarization chain | `/summarize` |
| Structured JSON output parsing | Summary schema in MongoDB |
| Strict prompt + temperature config | Env-driven model selection |
| Cache by content hash | Skip duplicate LLM calls |
| Summary UI | Sections + action items |

**Phase 3 exit gate:** Full upload → summary flow works on 3 test circulars; no invented dates on test set.

---

### Phase 4 — Product Completion (MVP)
**Duration:** Week 7 · **Sprint 5**

**Goal:** Polished, demo-ready application suitable for dissertation artefact presentation.

**Deliverables:**
- Circular list page with status badges
- Export summary (TXT/MD)
- Loading/error UX, mobile-responsive layout
- Processing metadata in UI

#### Sprint 5 — Polish & list view (Week 7)
**Goal:** Usable MVP for demos.

| Task | Deliverable |
|------|-------------|
| Circular list page | `/circulars` with status badges |
| Loading/error UX | Toasts, retry |
| Export summary (TXT/MD) | Download button |
| Processing metadata | Model, duration in UI |
| Mobile-responsive layout | Tailwind breakpoints |

**Phase 4 exit gate:** End-to-end demo-ready MVP on 3 circulars; list page and export working.

---

### Phase 5 — Validation, Release & Enhancement
**Duration:** Weeks 8–10 · **Sprints 6–8**

**Goal:** Quantitatively evaluate summary quality, complete UAT with stakeholders, deploy staging environment, and produce dissertation documentation.

**Deliverables:**
- ROUGE evaluation report
- UAT feedback report + bug fixes
- Sinhala OCR language pack
- CI pipeline + staging deployment
- API docs, user guide, demo script

#### Sprint 6 — Evaluation & hardening (Week 8)
**Goal:** Measure quality; fix top issues.

| Task | Deliverable |
|------|-------------|
| Reference summary dataset (5 docs) | `docs/evaluation/` |
| ROUGE evaluation script | `scripts/evaluate_rouge.py` |
| Hallucination check (dates in summary ⊆ source) | Automated post-validation |
| Rate limiting + cost logging | Backend middleware |
| Security pass | Upload validation, env audit |

**Sprint 6 done when:** ROUGE scores documented; no date hallucinations on test set.

#### Sprint 7 — UAT & Sinhala prep (Week 9)
**Goal:** User feedback loop; language roadmap.

| Task | Deliverable |
|------|-------------|
| UAT sessions (5 users) | Feedback form + issue list |
| Fix top 5 UAT issues | Prioritized bugs |
| Sinhala OCR language pack | Tesseract `sin` |
| Multilingual LLM prompt tuning | Phase 2 spike doc |

**Sprint 7 done when:** UAT report completed; critical bugs fixed.

#### Sprint 8 — Deployment & documentation (Week 10)
**Goal:** Deployed staging environment + dissertation artefact docs.

| Task | Deliverable |
|------|-------------|
| Production Docker / cloud deploy | Staging URL |
| CI pipeline (lint + test) | GitHub Actions |
| API documentation | OpenAPI or README |
| User guide (1 page) | How to upload and review |
| Final demo script | For viva/presentation |

**Phase 5 exit gate:** Staging app accessible; ROUGE + UAT reports complete; documentation ready for viva.

---

### Phase 6 — Future enhancements (post-dissertation, optional)

| Workstream | Items |
|------------|-------|
| Language | Full Sinhala/Tamil NER; bilingual UI; multilingual LLM fine-tuning |
| Identity | User auth, roles (principal / teacher / admin), per-user history |
| Intelligence | Source sentence linking; async job queue for 20+ page circulars |
| Operations | Admin dashboard, batch upload, usage analytics |
| Integration | MOE portal API (if available) |

No fixed sprint schedule — prioritize based on UAT feedback from Phase 5.

---

## 12. Technology choices (pinned)

| Component | Choice | Version note |
|-----------|--------|--------------|
| Frontend | Next.js 14, TypeScript, Tailwind | App Router |
| Backend | Node.js 20, Express 4 | `multer`, `mongoose`, `axios` |
| AI service | Python 3.11, FastAPI | `uvicorn` |
| PDF | PyMuPDF, pdfplumber | |
| OCR | Tesseract + pytesseract | `eng`, `sin` language packs |
| NER | SpaCy | `en_core_web_sm` |
| LLM | LangChain + OpenAI or Gemini API | Configurable via env |
| Database | MongoDB 7 | Docker locally |
| Dev ops | Docker Compose | Single-command dev |

### Required environment variables

```bash
# backend/.env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/easycircular
AI_SERVICE_URL=http://localhost:5000
UPLOAD_DIR=./uploads

# ai-service/.env
PORT=5000
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
SPACY_MODEL=en_core_web_sm

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 13. Risks and mitigations by phase

| Risk | Impact | Phase | Mitigation |
|------|--------|-------|------------|
| Poor PDF extraction | High | 2 | Dual libraries + OCR + manual edit step |
| LLM hallucination | Critical | 3 | Low temperature, entity verification, date post-check |
| API cost | Medium | 3–5 | Caching, smaller model for dev, chunk limits |
| Sinhala NLP gap | High | 5–6 | Sinhala OCR in Phase 5; full NLP deferred to Phase 6 |
| Slow processing | Medium | 6 | Async job pattern + progress UI |
| Scope creep | Medium | All | Phase exit gates; defer auth and bilingual UI to Phase 6 |
| UAT rejection of AI | Medium | 5 | Human-in-the-loop text review (Phase 2); privacy controls |

---

## 14. Immediate next steps — Phase 2

Phase 1 is complete. Verify anytime with `npm run verify:phase1` (or `docker compose up --build`).

1. Collect 3–5 sample MOE circular PDFs into `docs/sample-circulars/` (see README there).
2. Implement `POST /upload` with multer on the backend.
3. Add AI `/parse/pdf` (PyMuPDF + pdfplumber).
4. Wire frontend upload to store PDF + MongoDB circular record.
5. Display extracted text on `/circular/[id]` (step 1 of the workflow).

---

## 15. Gantt overview (phases & sprints)

```
Week:     1      2      3      4      5      6      7      8      9     10
          |------|------|------|------|------|------|------|------|------|

Phase 1   ████
Foundation

Phase 2          ████████████
Ingestion        S1     S2

Phase 3                         ████████████████████
AI Core                         S3     S4

Phase 4                                              ████
MVP                                                  S5

Phase 5                                                   ████████████
Validate & Release                                        S6  S7  S8

Phase 6 (optional, post-MVP)                                   ─────────►
Enhancement                                                    language, auth, analytics
```

### Phase summary timeline

| Phase | Weeks | Key milestone |
|-------|-------|---------------|
| 1 — Foundation | 1 | All services running locally |
| 2 — Ingestion | 2–3 | PDF upload + OCR + text edit |
| 3 — AI Core | 4–6 | NER + summarization live |
| 4 — MVP | 7 | Demo-ready product |
| 5 — Validate & Release | 8–10 | ROUGE, UAT, staging deploy |
| 6 — Enhancement | 11+ | Sinhala NLP, auth, advanced features |

---

*This plan aligns with the EasyCircular Contextual Report (Chapters 3–4): Agile methodology, three-tier architecture, MongoDB, PyMuPDF/SpaCy/LangChain stack, ROUGE evaluation, and human-in-the-loop text review.*
