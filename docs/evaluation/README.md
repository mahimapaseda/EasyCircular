# Summary evaluation gold set

Human-curated reference summaries live in [`ai-service/training/fewshot/`](../../ai-service/training/fewshot/). Those JSON files are the Phase 5 gold set (circular identity, purpose, requirements, dates, and action items).

EasyCircular can import PDFs from the official catalog. ROUGE scores measure overlap with these gold briefs, not legal correctness. Always treat the original circular as the legal source.

## Run ROUGE

From the repo root, with the AI service virtualenv active:

```bash
npm run evaluate:rouge
```

Writes [`rouge-report.json`](./rouge-report.json). Add `--llm` (via `python scripts/evaluate_rouge.py --llm`) to score the configured LLM instead of extractive fallback.

| File | Circular |
|------|----------|
| `10-2026.json` | Collective Circles / drug-free schools |
| `12-2026.json` | Financial Regulation 135 delegation |
| `15-2026.json` | Vesak Week 2570 |
| `23-2026.json` | SLEAS service registers / annexure |
| `44-2006i.json` | Amendment circular |
| `44-2025.json` | Duty hours |

These are helper scores. Always treat the original PDF as the legal source.
