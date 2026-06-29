# Sample MOE circulars (Phase 2+ test data)

Local copies live in this folder and in `sample circulars/` at the repo root for upload, extraction, and evaluation. PDFs are **gitignored** — keep them on your machine only.

## Included samples

| File | Language / type | Good for |
|------|-----------------|----------|
| `10-2026-En.pdf` | English digital | Drug-free schools policy; subject-line extraction |
| `12-2026-En-1.pdf` | English (long) | Financial delegation; map-reduce / long docs |
| `15-2026-En.pdf` | English digital | Vesak Week instructions; date extraction |
| `23-2026-En.pdf` | English form | Annexure / register form (non-standard layout) |
| `44-2006i-En-1.pdf` | English digital | Amendment circular; legal refs |
| `44-2025-En.pdf` | English scanned/OCR | Duty hours policy |
| `03-2014I.pdf` | Sinhala / mixed | OCR + Sinhala circular refs |
| `23-2026-Ta.pdf` | Tamil | Multilingual OCR (`sin+eng+tam`) |
| `Dengue_Sinhala.pdf` | Sinhala | Sinhala OCR and mixed-script circulars |
| `test-digital.pdf` | Copy of `03-2014I` | `npm run verify:phase4` |

## Evaluate tuned pipeline

With the AI service venv active:

```bash
npm run evaluate:samples
```

Writes `scripts/sample-evaluation.json` and prints subject/title quality per file.

Unit tests (MOE heuristics):

```bash
cd ai-service
pytest tests/ -q
```

## How to test in the app

1. Start all services (`docker compose up` or local dev).
2. Sign in at http://localhost:3002
3. Upload any PDF from `sample circulars/` or this folder.
4. Run **Extract text** → **Review** → **Summarize**.

For scanned Tamil/Sinhala circulars, install Tesseract languages first:

```powershell
.\scripts\install-tesseract-languages.ps1
```

Then restart the AI service and use **Re-extract** on the circular page.

## Git

Do **not** commit copyrighted or sensitive circulars to a public repository unless you have permission.

```
docs/sample-circulars/*.pdf
sample circulars/*.pdf
```
