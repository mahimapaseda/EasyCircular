# NER training workflow

Train a custom **multilingual** SpaCy NER model for MOE circulars (English +
Sinhala + Tamil) using the local sample PDFs.

All artifacts (corpus, annotations, DocBins, models) are gitignored — they are
derived from local PDFs that are not committed.

Run everything from `ai-service/` with the virtualenv active
(`.venv\Scripts\activate` on Windows).

## English fine-tune on `sample circulars/` only

For improving NER on the six English MOE PDFs under repo-root `sample circulars/`:

```bash
python training/build_corpus.py --sample-circulars-only --clean
python training/generate_annotations.py
python training/review_en_annotations.py
python training/convert_to_spacy.py
python -m spacy train training/config.cfg --output training/output --paths.train training/train.spacy --paths.dev training/dev.spacy
```

`review_en_annotations.py` drops false LAW (e.g. “the Vesak Day”), OCR PERSON noise,
and non-institutional ORG spans while keeping Circular/ED/Section/Financial Regulation
refs. Hand-fix remaining JSONL if needed before convert.

## Full multilingual corpus (En + Si/Ta)

### 1. Build the text corpus

```bash
python training/build_corpus.py
```

Parses every PDF in `sample circulars/` and `docs/sample-circulars/` (OCR
fallback with `OCR_LANGUAGES=sin+eng+tam`) and writes `training/corpus/<name>.txt`.

### 2. Generate silver annotations

```bash
python training/generate_annotations.py
```

Labels each corpus file with the current rule+SpaCy pipeline
(`app/ner.py:extract_entities`) and writes `training/annotations/<name>.jsonl`.

Labels: `DATE`, `PERSON`, `ORG`, `LAW`, `OTHER`.

**Hand-correct before training.** For Sinhala/Tamil:

```bash
python training/review_si_ta_annotations.py
```

### 3. Convert to SpaCy DocBins

```bash
python training/convert_to_spacy.py
```

Uses `spacy.blank("xx")` (multilingual blank), trims whitespace from spans (avoids
SpaCy E024), chunks long documents, and writes `training/train.spacy` /
`training/dev.spacy` (~80/20 split).

### 4. Train

```bash
python -m spacy train training/config.cfg --output training/output --paths.train training/train.spacy --paths.dev training/dev.spacy
```

`config.cfg` sets `lang = "xx"` with MultiHashEmbed (`NORM`/`PREFIX`/`SUFFIX`/`SHAPE`).

Best checkpoint lands in `training/output/model-best`.

### 5. Activate the trained model

In `ai-service/.env`:

```
SPACY_MODEL=./training/output/model-best
```

Restart the AI service. Regex rules and OCR-noise filters in `app/ner.py` still run
on top of the model.

### 6. Evaluate

From the repo root:

```bash
npm run evaluate:samples
python scripts/evaluate-samples.py --sample-circulars-only
python scripts/evaluate-samples.py --sample-circulars-only --llm
```

`--llm` calls `summarize_text` (Ollama when configured) instead of fallback-only.

## Summarization few-shot (not weight fine-tune)

Short gold examples live in `training/fewshot/*.json` (`10-2026`, `44-2006i`).
`app/summarize.py` loads them into the summarize system prompt for local
`llama3.2:3b`. Keep excerpts short so they fit the 8k chunk budget.

## Caveats

- Small silver corpora still underperform a large hand-labeled set; treat the
  custom model as scaffolding and keep regex primary.
- Do not commit `training/corpus/`, `training/annotations/`, `*.spacy`, or
  `training/output/` — they are gitignored and can be large.
