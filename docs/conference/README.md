# EasyCircular IEEE Conference Paper

Two builds are supported:

| Build | Template | Content | Body language |
|-------|----------|---------|---------------|
| **Letter (recommended for resubmission)** | `conference-template-letter.docx` | `content-letter-en.yaml` | English headings + Sinhala body |
| A4 (legacy) | `conference-template-a4.docx` | `content.yaml` | English headings + Sinhala body |

The Letter build revises claims for peer-review feedback: ROUGE is reported for the extractive fallback only, evaluation limits are stated openly, and figure/table references match the assets below.

## Output

| File | Description |
|------|-------------|
| `EasyCircular-Conference-Paper-Letter.docx` | US Letter revised paper (Sinhala body) |
| `EasyCircular-Conference-Paper-Letter-Blind.docx` | Double-blind Letter copy |
| `EasyCircular-Conference-Paper-Letter.pdf` | Optional PDF (Windows + Word) |
| `EasyCircular-Conference-Paper.docx` | Legacy A4 Sinhala-body paper |
| `content-letter-en.yaml` | Letter source (EN abstract + SI body) |
| `content.yaml` | Legacy A4 source |

## Structure

| Section | Notes |
|---------|-------|
| I. INTRODUCTION | Background → problem → contributions → RQs |
| II. RELATED WORK | Transformers, summarization, NER, OCR, gap |
| III. PROPOSED SYSTEM | Survey, architecture, workflow, guardrail limits |
| IV. RESULTS AND DISCUSSION | Latency, fallback ROUGE, tests (correctness only) |
| V. CONCLUSION | Honest RQ framing + future eval work |

## Figures and tables

| Item | Section |
|------|---------|
| Fig. 1 Survey key findings | III |
| Fig. 2 Architecture | III |
| Fig. 3 Algorithm flowchart | III |
| Fig. 4 Summary UI | IV |
| Fig. 5 ROUGE F1 chart (fallback) | IV |
| TABLE I Survey findings | III |
| TABLE II Technology stack | III |
| TABLE III Latency | IV |
| TABLE IV ROUGE by circular (fallback) | IV |
| TABLE V Automated tests | IV |

## Generate

```powershell
# US Letter revised paper, Sinhala body (named + PDF if Word available)
npm run generate:conference-paper:letter

# Double-blind Letter copy
python scripts/generate_conference_paper.py --letter --blind --no-pdf

# Legacy A4 Sinhala-body paper
npm run generate:conference-paper
```

## Checklist

- [ ] Replace `[email placeholder]` on author lines
- [ ] Confirm Letter page size (8.5 × 11 in)
- [ ] Confirm Fig. 1–5 and TABLE I–V appear once each
- [ ] Confirm abstract reports ROUGE macros and N=6 fallback-only framing
- [ ] No leftover IEEE template boilerplate
