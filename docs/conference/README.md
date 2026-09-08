# EasyCircular IEEE Conference Paper

Generate an IEEE A4 two-column conference paper with **English section headings** and **Sinhala body text**. Target: **about 4 pages of body** so references start on page 5.

## Output

| File | Description |
|------|-------------|
| `EasyCircular-Conference-Paper.docx` | Named paper |
| `EasyCircular-Conference-Paper-Blind.docx` | Double-blind copy |
| `EasyCircular-Conference-Paper.pdf` | Optional PDF (Windows + Word) |
| `content.yaml` | Paper source |

## Structure (supervisor feedback)

| Section | Notes |
|---------|-------|
| I. INTRODUCTION | Linked story: background → problem → motivation → RQs |
| II. RELATED WORK | Paragraph-wise themes (~1 column) |
| III. PROPOSED SYSTEM | Requirement gathering first, then design/workflow/tech |
| IV. RESULTS AND DISCUSSION | Latency, ROUGE, tests with tables/figures |
| V. CONCLUSION | Short wrap-up |

## Figures and tables

| Item | Section |
|------|---------|
| Fig. 1 Survey key findings | III |
| Fig. 2 Architecture | III |
| Fig. 3 Algorithm flowchart | III |
| Fig. 4 Summary UI (structured brief + entities) | IV |
| Fig. 5 ROUGE F1 chart | IV |
| TABLE I Survey findings | III |
| TABLE II Technology stack | III |
| TABLE III Latency | IV |
| TABLE IV ROUGE by circular | IV |
| TABLE V Automated tests | IV |

## Generate

```powershell
npm run generate:conference-paper
python scripts/generate_conference_paper.py --blind --no-pdf
```

## Checklist

- [ ] Replace `[email placeholder]` on author line 5
- [ ] Confirm page count (~4 body + refs on page 5)
- [ ] Sinhala renders (Iskoola Pota)
- [ ] No leftover IEEE template text
