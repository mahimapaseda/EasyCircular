# Sample MOE circulars (Phase 2+ test data)

Local copies live in this folder for upload, extraction, and evaluation. PDFs are **gitignored** — keep them on your machine only.

## Included samples

Copied from the project `sample circulars/` folder:

| File | Language / type | Size | Good for |
|------|-----------------|------|----------|
| `03-2014I.pdf` | English (digital text) | ~0.7 MB | Default text extraction; also copied as `test-digital.pdf` for `npm run verify:phase4` |
| `23-2026-Ta.pdf` | Tamil | ~3.5 MB | Multilingual OCR (`sin+eng+tam`) |
| `Dengue_Sinhala.pdf` | Sinhala | ~0.2 MB | Sinhala OCR and mixed-script circulars |

## How to test in the app

1. Start all services (`docker compose up` or local dev).
2. Sign in at http://localhost:3002
3. Upload any PDF from this folder (Home → Upload, or Library).
4. Run **Extract text** → **Review** → **Summarize**.

For scanned Tamil/Sinhala circulars, install Tesseract languages first:

```powershell
.\scripts\install-tesseract-languages.ps1
```

Then restart the AI service and use **Re-extract** on the circular page.

## Where to find more circulars

- [MOE Sri Lanka — Circulars](https://www.moe.gov.lk/)
- School administration portals or your institution’s circular archive
- Saved copies from email or printed circular scans

## File naming

Use descriptive names when adding more samples, for example:

```
2024-term-fees-circular.pdf
2023-exam-schedule-scan.pdf
```

## Git

Do **not** commit copyrighted or sensitive circulars to a public repository unless you have permission.

```
docs/sample-circulars/*.pdf
```
