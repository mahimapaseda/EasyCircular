# Sample MOE circulars (Phase 2 test data)

Collect **3–5 real Ministry of Education circular PDFs** here before starting Phase 2 ingestion work.

## Where to find circulars

- [MOE Sri Lanka — Circulars](https://www.moe.gov.lk/)
- School administration portals or your institution’s circular archive
- Saved copies from email or printed circular scans

## What to include

Aim for variety:

| Type | Why |
|------|-----|
| Digital-native PDF (selectable text) | Tests PyMuPDF / pdfplumber extraction |
| Scanned / image-only PDF | Tests Tesseract OCR fallback |
| Mixed Sinhala + English | Realistic MOE content (full NLP deferred to later phases) |
| 2–10 pages | Typical circular size |

## File naming

Use descriptive names, for example:

```
2024-term-fees-circular.pdf
2023-exam-schedule-scan.pdf
```

## Git

Do **not** commit copyrighted or sensitive circulars to a public repository unless you have permission. For local development, keep PDFs in this folder only on your machine.

Add filenames to `.gitignore` if needed:

```
docs/sample-circulars/*.pdf
```
