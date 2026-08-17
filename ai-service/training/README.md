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

## LLM QLoRA fine-tune (llama3.2:3b → `easycircular:3b`)

Ollama cannot train weights. This path builds a small JSON-summary SFT set from
`training/fewshot/*.json`, runs **4-bit QLoRA** (rank 8, seq 1024) on Llama-3.2-3B-Instruct
for NVIDIA GPUs with under 8 GB VRAM, then publishes a GGUF as `easycircular:3b`.

Do **not** commit `training/sft/`, adapters, merged weights, or GGUF files.

### 1. Dataset

```bash
python training/build_sft_dataset.py
```

Writes `training/sft/train.jsonl` and `eval.jsonl`. Gold few-shot `15-2026` is held
out. Optional silver rows from `training/corpus/*.txt` are capped so they cannot
outnumber gold circulars. Two instruction paraphrases are added per gold row
(same facts — no invented circulars).

### 2. Train (separate packages)

Install train extras in a **separate** venv so the API runtime stays lean:

```bash
python -m venv .venv-train
.venv-train\Scripts\activate
pip install -r requirements-train.txt
huggingface-cli login
set HF_HOME=G:\AI\hf-cache
python training/finetune_qlora.py --export-merged
```

Defaults: `r=8`, `lora_alpha=16`, `batch_size=1`, `gradient_accumulation=8`,
`epochs=2`, 8-bit Adam, gradient checkpointing. Adapter lands in
`training/output/lora/`.

If CUDA OOM:

```bash
python training/finetune_qlora.py --seq-len 768 --lora-r 4 --export-merged
```

Needs a Hugging Face token for Llama 3.2 (`huggingface-cli login` after accepting
the [Llama 3.2 license](https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct)).
First download is ~2–3 GB (cache under `G:\AI\hf-cache` when that drive exists).

Until `easycircular:3b` is published, keep:

```
OLLAMA_MODEL=llama3.2:3b
```

Baseline LLM eval (stock `llama3.2:3b`) is saved as
`scripts/sample-evaluation-en-llm-baseline.json`. Re-run
`python scripts/evaluate-samples.py --sample-circulars-only --llm` after switching
the tag and compare titles/purpose (watch for few-shot fact bleed).

### 3. Publish to Ollama

```powershell
# from repo root
powershell -ExecutionPolicy Bypass -File .\scripts\publish-finetuned-ollama.ps1
```

Converts merged weights to GGUF `Q4_K_M` (Unsloth export, or llama.cpp under
`G:\AI\llama.cpp`), copies into `G:\AI\models`, and runs `ollama create easycircular:3b`.

In `ai-service/.env`:

```
OLLAMA_MODEL=easycircular:3b
```

Restart the AI service. If the adapter is worse than stock `llama3.2:3b`, switch
the env var back. Extractive fallback in `app/summarize.py` is unchanged.

### 4. Evaluate

```bash
python scripts/evaluate-samples.py --sample-circulars-only --llm
python ai-service/training/eval_heldout.py
```

Compare `scripts/sample-evaluation-en-llm.json` before vs after changing `OLLAMA_MODEL`.

## Summarization few-shot (prompt examples, not weight fine-tune)


Short gold examples live in `training/fewshot/*.json` (`10-2026`, `44-2006i`).
`app/summarize.py` loads them into the summarize system prompt for local
`llama3.2:3b`. Keep excerpts short so they fit the 8k chunk budget.

## Caveats

- Small silver corpora still underperform a large hand-labeled set; treat the
  custom model as scaffolding and keep regex primary.
- Do not commit `training/corpus/`, `training/annotations/`, `training/sft/`,
  `*.spacy`, `training/output/`, or GGUF/adapter files — they are gitignored and can be large.
