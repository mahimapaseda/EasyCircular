# NER training workflow

Train a custom SpaCy NER model for MOE circulars using the local sample PDFs.
All artifacts (corpus, annotations, DocBins, models) are gitignored — they are
derived from local PDFs that are not committed.

Run everything from `ai-service/` with the virtualenv active
(`.venv\Scripts\activate` on Windows).

## 1. Build the text corpus

```bash
python training/build_corpus.py
```

Parses every PDF in `sample circulars/` and `docs/sample-circulars/` (OCR
fallback included) and writes `training/corpus/<name>.txt`.

## 2. Generate silver annotations

```bash
python training/generate_annotations.py
```

Labels each corpus file with the current rule+SpaCy pipeline
(`app/ner.py:extract_entities`) and writes `training/annotations/<name>.jsonl`:

```json
{"text": "...", "entities": [[start, end, "LABEL"], ...]}
```

**Hand-correct these files before training** — silver labels inherit every
mistake of the current pipeline. Labels: `DATE`, `PERSON`, `ORG`, `LAW`, `OTHER`.

## 3. Convert to SpaCy DocBins

```bash
python training/convert_to_spacy.py
```

Chunks long documents, aligns spans, and writes `training/train.spacy` and
`training/dev.spacy` (~80/20 split).

## 4. Train

```bash
python -m spacy train training/config.cfg --output training/output --paths.train training/train.spacy --paths.dev training/dev.spacy
```

Best checkpoint lands in `training/output/model-best`.

## 5. Activate the trained model

In `ai-service/.env`:

```
SPACY_MODEL=./training/output/model-best
```

Restart the AI service. `app/nlp_models.py` loads whatever `SPACY_MODEL`
points at (package name or directory path). The regex rules and OCR-noise
filters in `app/ner.py` still run on top of the model.

## Caveats

- The current corpus is ~10 documents. A model trained on silver labels at
  this scale underperforms the rule-based pipeline (dev F ~0.3); treat it as
  scaffolding until the corpus grows and annotations are hand-corrected.
- Keep `en_core_web_sm` as `SPACY_MODEL` in production until the custom model
  beats it on `npm run evaluate:samples`.
