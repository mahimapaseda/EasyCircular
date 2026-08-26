# EasyCircular A1 Poster — Gemini Image Generation Guide

Use this guide to generate a **portrait A1 (594 × 841 mm)** academic poster in [Google Gemini](https://gemini.google.com) image generation, then refine with the Word artefact from `npm run generate:poster`.

## 3-step workflow

1. **Generate layout** — paste the [master prompt](#master-prompt) below; attach reference posters (PlantGraft, GreenCure) for style.
2. **Refine with real UI** — attach EasyCircular screenshots; paste [follow-up prompt 2](#follow-up-2-screenshots).
3. **Finalize text** — if Gemini garbles body text, use [follow-up prompt 3](#follow-up-3-layout-only) and overlay verified copy from [`EasyCircular-Poster-A1.docx`](EasyCircular-Poster-A1.docx) (generated with verified thesis strings).

```mermaid
flowchart LR
  step1["Step 1: Master prompt + reference posters"] --> step2["Step 2: Attach EasyCircular screenshots"]
  step2 --> step3["Step 3: Word poster or manual text overlay"]
```

---

## Assets to attach

### Step 1 — style references

| File | Purpose |
|------|---------|
| PlantGraft poster (your example) | Modular card layout, footer bar, phone mockups |
| GreenCure poster (your example) | Three-column grid, evaluation bar chart, architecture |

### Step 2 — EasyCircular visuals

| File | Purpose |
|------|---------|
| [`../user-manual/images/summary.png`](../user-manual/images/summary.png) | Summary + entity highlights |
| [`../user-manual/images/upload.png`](../user-manual/images/upload.png) | PDF upload |
| [`../user-manual/images/review-text.png`](../user-manual/images/review-text.png) | Human-in-the-loop edit |
| [`../user-manual/images/mobile-summary.png`](../user-manual/images/mobile-summary.png) | Mobile view |
| [`figures/architecture.png`](figures/architecture.png) | System architecture |
| [`figures/eval-rouge-chart.png`](figures/eval-rouge-chart.png) | ROUGE chart (optional) |

---

## Master prompt

Copy everything inside the block below into Gemini chat:

```
Create a professional A1 PORTRAIT academic project poster (594mm × 841mm, 300 DPI print quality) for a BSc Computer Science undergraduate thesis at the University of Bedfordshire.

PROJECT IDENTITY
- Title (large, top centre): EasyCircular
- Subtitle: AI-Assisted Web System for Summarising Sri Lanka Ministry of Education (MOE) Circulars
- Optional small Sinhala subtitle line under English (decorative only, do not need to be perfectly spelled): ශ්‍රී ලංකා අධ්‍යාපන අමාත්‍යාංශ චක්‍රලේඛ සාරාංශක AI වෙබ් පද්ධතිය
- Student: G G M P Kusumsiri (2540881)
- Supervisor: Mr. Anuruddha Abeysinghe
- Module Lecturer: Dr. Gayana Fernando
- Degree: BSc (Hons) Computer Science
- University: The University of Bedfordshire — include university logo placeholder top-right
- Date: August 2026

VISUAL STYLE (match attached reference posters)
- Clean academic conference poster, NOT a slide deck
- Portrait A1, modular grid of white rounded-corner cards with thin borders and soft drop shadows
- Background: very light blue-grey (#F0F4F8) with subtle document/page watermark pattern (not plant/nature themed)
- Primary accent: deep navy blue (#1E3A5F) for headings and title
- Secondary accent: teal (#0D9488) for icons, charts, and highlights
- Tertiary accent: amber (#D97706) for dates/deadlines callouts
- Typography: modern sans-serif (similar to Calibri/Inter); section headers ALL CAPS bold navy; body text dark grey, highly readable from 1 metre
- Ample whitespace; no clutter; print-safe margins (~25mm)

LAYOUT GRID (top to bottom, left to right)

HEADER BAR (full width)
- Left: circular logo icon — stylised document with AI sparkle / circular arrow motif in navy + teal
- Centre: title + subtitle as above
- Right: University of Bedfordshire logo placeholder

ROW 1 — three equal cards
Card A: INTRODUCTION
"MOE educational circulars are long, complex PDF documents (often 5–20 pages) distributed to principals, teachers, and education officers. They contain critical deadlines, legal references, and action items buried in administrative language. Misinterpretation risks compliance failures. EasyCircular is a purpose-built AI web system that extracts text (including scanned Sinhala/Tamil/English OCR), lets users review extracted text, and produces structured summaries with highlighted entities."

Card B: AIM
"Develop an AI-powered web application using NLP to extract and summarise complex MOE circulars, improving administrative efficiency in Sri Lanka schools."

Card C: OBJECTIVES (numbered list with small icons)
1. Evaluate NLP and summarisation techniques for administrative documents
2. Build secure PDF ingestion with OCR fallback and human-in-the-loop text review
3. Implement NER for dates, organisations, and legal references
4. Deliver a dynamic summarisation engine with hallucination guardrails
5. Evaluate accuracy (ROUGE, automated tests) and stakeholder needs (n=41 survey)

ROW 2 — wide methodology card + central hero graphic
METHODOLOGY
"Agile SDLC across 5 phases (10 weeks): Foundation → Ingestion → AI Core → MVP → Validate & Release. Primary research: Google Forms survey (n=41 school stakeholders). Evaluation: ROUGE on 6 MOE circulars, 91+ AI pytest, phase exit-gate scripts."
Below text: horizontal Agile sprint strip with 5 labelled circles: Phase 1 Foundation | Phase 2 Ingestion | Phase 3 AI Core | Phase 4 MVP | Phase 5 Validate

CENTRE HERO (between columns): large circular emblem — document icon + AI neural nodes + highlighted DATE/ORG/LAW tags

ROW 3 — architecture (left) + UI screenshots (right, dominant column)
SYSTEM ARCHITECTURE (flowchart diagram)
User Browser → Next.js Frontend (3002) → Express Backend (4000, JWT, cache, rate limit) → FastAPI AI Service (5000: OCR, SpaCy NER, LangChain/Ollama summarisation, date guardrails) → MongoDB (27017)
Show Docker Compose box around services. Label pipeline: Upload PDF → Extract/OCR → Human Edit → Process → Display Summary + Entities

APP SCREENSHOTS (4 realistic browser/phone mockups in a vertical stack on the right):
1. Sign-in / dashboard
2. PDF upload screen
3. Text review (human-in-the-loop edit)
4. Summary view with colour-coded entity highlights (DATE, ORG, LAW) and action items
Use attached EasyCircular screenshots if provided; otherwise realistic placeholder UI in navy/teal theme

ROW 4 — three cards
TECHNOLOGY STACK (logo row)
Next.js | Express.js | FastAPI | MongoDB | Docker | SpaCy | LangChain | Ollama (llama3.2) | Tesseract OCR | pdfplumber | PyMuPDF | JWT | GitHub Actions CI

KEY REQUIREMENTS
• PDF upload with tri-library extraction + Tesseract OCR (sin+eng+tam)
• Human-in-the-loop mandatory text review before AI processing
• Date guardrails reject hallucinated dates; extractive TextRank fallback
• Content-hash caching (~114ms cached response)
• JWT auth, rate limiting, mobile-responsive UI
• Local Ollama deployment for privacy

EVALUATION & RESULTS (bar chart card)
Survey (n=41): 97.6% want summaries | 78% want entity highlighting | 78% expect efficiency gain | 68.3% hesitant about AI (privacy concern)
ROUGE macro F1: ROUGE-1 0.414 | ROUGE-2 0.215 | ROUGE-L 0.292
Testing: 91/91 AI pytest pass | 13/13 backend tests | Phase 1 & 4 exit gates verified
Note small footer: "Formal school staff UAT pending"

ACHIEVEMENTS
✓ End-to-end MVP: upload → extract → edit → summarise → display
✓ Tri-tier Docker deployment with health checks
✓ Guardrails reduce date hallucination (~15% rejection rate)
✓ MOE official catalog import endpoint
✓ Full thesis documentation + AI-assisted development disclosure

CHALLENGES
• Scanned Sinhala PDF OCR quality varies — mitigated by human review
• Full Sinhala/Tamil NER not yet available (English NER achieved)
• LLM summarisation quality vs. privacy trade-off addressed via local Ollama
• Single-developer scope; formal UAT not completed before submission

FUTURE WORK (Phase 6)
• Full Sinhala/Tamil NER and bilingual UI
• Formal school staff UAT and expanded ROUGE corpus
• Async job queue for long documents
• Role-based access control and admin analytics dashboard
• Production cloud deployment with MOE integration

REFERENCES (small text, bottom-left card, Harvard style, 6–8 entries)
Lin, C.Y. (2004) ROUGE evaluation package
Nadkarni, P.M. et al. (2011) Natural language processing: an introduction
Ministry of Education Sri Lanka (2026) Official circulars portal — moe.gov.lk
Honnibal, M. and Montani, I. (2017) spaCy
Sumathi, S. et al. (2025) LangChain integration approach
OpenAI (2024) ChatGPT — AI-assisted development disclosure

FOOTER BAR (full width, navy background, white text)
Left: G G M P Kusumsiri | 2540881
Centre: Supervisor: Mr. Anuruddha Abeysinghe
Right: The University of Bedfordshire | BSc (Hons) Computer Science | August 2026

CRITICAL RENDERING RULES
- Portrait A1 aspect ratio exactly
- All section headings must be spelled correctly in ENGLISH
- Text must be sharp and legible at poster viewing distance
- Professional academic tone — not marketing hype
- Do NOT use plant/leaf/nature imagery (this is an education/document AI project)
- Balance ~40% visuals (screenshots, diagrams, chart) and ~60% structured text
- No lorem ipsum; use the exact content above
```

---

## Follow-up 1 — layout fix

```
Regenerate keeping the same content but: (1) increase screenshot column width, (2) make evaluation bar chart more prominent like the GreenCure reference, (3) ensure footer names are spelled exactly: G G M P Kusumsiri, Mr. Anuruddha Abeysinghe, Dr. Gayana Fernando, (4) fix any misspelled English words.
```

## Follow-up 2 — screenshots

```
Replace the placeholder app mockups with the attached EasyCircular UI screenshots inside realistic browser and phone frames. Keep the poster layout unchanged. Preserve navy/teal colour scheme.
```

## Follow-up 3 — layout only

```
Remove all body paragraph text from the image and render only: section header labels, chart labels, architecture box labels, technology logo names, and footer. Leave empty white space inside each card for manual text overlay.
```

---

## Verified text checklist

Use these exact values if Gemini garbles numbers or names:

| Field | Value |
|-------|-------|
| Student | G G M P Kusumsiri (2540881) |
| Supervisor | Mr. Anuruddha Abeysinghe |
| Survey n | 41 |
| Want summary | 97.6% |
| Entity highlighting | 78% |
| Efficiency gain | 78% |
| AI hesitation | 68.3% |
| ROUGE-1 F1 | 0.414 |
| ROUGE-2 F1 | 0.215 |
| ROUGE-L F1 | 0.292 |
| AI pytest | 91/91 |
| Cache hit | ~114ms |
| Ports | Frontend 3002, Backend 4000, AI 5000, MongoDB 27017 |

---

## Word poster (recommended print artefact)

For print-ready output with correct text:

```bash
npm run generate:poster
```

Outputs:

- [`EasyCircular-Poster-A1.docx`](EasyCircular-Poster-A1.docx)
- [`EasyCircular-Poster-A1.pdf`](EasyCircular-Poster-A1.pdf) (if Microsoft Word is installed)

Open the DOCX in Word → **File → Export → Create PDF** if automatic PDF export fails.

Content source: [`content/poster.yaml`](content/poster.yaml)
