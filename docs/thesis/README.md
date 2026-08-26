# EasyCircular Sinhala Thesis Generator

Generates **`EasyCircular-Thesis.docx`** (~80+ pages, Sinhala) from YAML content and project evaluation data.

## Prerequisites

- Python 3.11+
- Packages: `python-docx`, `PyYAML`, `Pillow`

```bash
pip install python-docx PyYAML Pillow
```

- **Fonts:** `Times New Roman` for Latin text and `Iskoola Pota` for Sinhala. The generator splits
  each paragraph into runs at script boundaries, because the guidelines mandate Times New Roman but
  it has no Sinhala glyphs. Sinhala fallback: `Noto Sans Sinhala`.
- **Contextual report:** [`Contextual report.docx`](../../Contextual%20report.docx) at repo root (for Gantt/WBS/survey figures).

## Report structure

Follows the six-chapter Final Project Report format. The project plan is the first appendix, as
the guidelines require.

| Part | Content |
|------|---------|
| Front matter | Title page, Declaration, AI-use declaration, Abstract (≤ 200 words), Acknowledgements, Dedication, Keywords (≤ 8), Contents, List of Tables, List of Figures, Glossary |
| Chapter 1 | Introduction: 1.1 Background and Context, 1.2 Research Problem, 1.3 Research Questions, 1.4 Aims and Objectives, 1.5 Scope of the Research, 1.6 Research Contribution, 1.7 Structure of the Report |
| Chapter 2 | Market Research and Literature Review |
| Chapter 3 | Artefact Design |
| Chapter 4 | Development and Testing |
| Chapter 5 | Evaluation |
| Chapter 6 | Conclusions and Further Work |
| Appendices | A Project Plan, B Survey questions, C Extended API endpoints, D A1 poster, E AI-assisted code segments |

Page setup: A4, 1.5 line spacing, 12pt, 4cm left margin for spiral binding, other margins 2.54cm.

## Generate

From repo root:

```bash
npm run generate:thesis
```

Or manually:

```bash
python scripts/extract_contextual_figures.py
python scripts/generate_thesis.py
```

Output: [`EasyCircular-Thesis.docx`](EasyCircular-Thesis.docx)

The script prints word count and estimated pages. The tagged guidelines suggest a main body of
around 70 pages, so `min_pages` in [`content/meta.yaml`](content/meta.yaml) is set to 70 and the
script warns below that.

The session guidelines also give per-chapter page budgets, which are worth checking after any edit
because `bulk.yaml` filler can push a chapter well past its range:

| Chapter | Target | Current |
|---------|--------|---------|
| 1 Introduction | 5-7 | 6.8 |
| 2 Literature Review | 8-10 | 7.7 |
| 6 Conclusion | 2-4 | 8.7 |

Chapters 2 and 6 are still outside their ranges.

## After opening in Word

1. Open `EasyCircular-Thesis.docx` in Microsoft Word.
2. Press **Ctrl+A**, then **F9** to update **Table of Contents**, **List of Tables**, and **List of Figures**.
3. Review `architecture.emf` - if EMF does not render, insert the architecture diagram manually from the contextual report.

## Edit content

| File | Purpose |
|------|---------|
| [`content/meta.yaml`](content/meta.yaml) | Title page: university, department, name, ID, date, fonts |
| [`content/front_matter.yaml`](content/front_matter.yaml) | Declaration, AI-use declaration, abstract, keywords, acknowledgement, dedication, glossary |
| [`content/ch01_introduction.yaml`](content/ch01_introduction.yaml) … [`ch06_conclusion.yaml`](content/ch06_conclusion.yaml) | Chapter prose |
| [`content/bulk.yaml`](content/bulk.yaml) | Extra paragraphs merged by section `id`, keyed by chapter file stem |
| [`content/figures.yaml`](content/figures.yaml) | Figure paths and Sinhala captions |
| [`content/references.yaml`](content/references.yaml) | Harvard bibliography |
| [`content/poster.yaml`](content/poster.yaml) | A1 poster content (English-primary) |
| [`content/supplementary.yaml`](content/supplementary.yaml) | Appendices A-E |

Single chapters can be regenerated on their own:

```bash
python scripts/generate_chapter.py 4           # -> Chapter-04-Development.docx
python scripts/generate_chapter.py appendices  # -> Appendices-and-References.docx
```

**ROUGE** and **sample evaluation** tables are auto-loaded from:

- [`docs/evaluation/rouge-report.json`](../evaluation/rouge-report.json)
- [`scripts/sample-evaluation.json`](../../scripts/sample-evaluation.json)

Re-run `npm run evaluate:rouge` before regenerating to refresh the Chapter 5 scores.

## A1 project poster (Appendix D)

Session Three requires a separate **A1 portrait** poster. Two artefacts are provided:

| File | Purpose |
|------|---------|
| [`EasyCircular-Poster-A1.docx`](EasyCircular-Poster-A1.docx) | Print-ready Word poster with verified thesis text and embedded screenshots |
| [`EasyCircular-Poster-A1.pdf`](EasyCircular-Poster-A1.pdf) | PDF export for submission |
| [`GEMINI-POSTER-PROMPT.md`](GEMINI-POSTER-PROMPT.md) | Master prompt + follow-ups for Gemini image generation (optional visual layout) |

Regenerate from YAML:

```bash
npm run generate:poster
```

Content source: [`content/poster.yaml`](content/poster.yaml). If PDF export fails, open the DOCX in Word → **File → Export → Create PDF**.

## One-off restructuring scripts

These were used to move from the older seven-chapter layout and are kept for reference:

- [`scripts/restructure_thesis.py`](../../scripts/restructure_thesis.py) - remaps sections into the
  six chapters, moves the project plan into Appendix A, re-keys `bulk.yaml`, renumbers tables
- [`scripts/fix_thesis_crossrefs.py`](../../scripts/fix_thesis_crossrefs.py) - repoints table,
  section and appendix references; idempotent, so it is safe to re-run

## AI-generated content disclosure

Academic-integrity requirement: any code produced with help from generative AI must be
referenced, with its function and its place in the system design explained. This is covered in:

| Location | Content |
|----------|---------|
| `content/front_matter.yaml` → `ai_declaration` | Signed AI-use declaration page (after Declaration) |
| `content/ch04_development.yaml` → `4.6` | Table 4.3: artefact, tool, reason, function, design fit, verification |
| `content/ch05_evaluation.yaml` → `5.6` | Outcomes and defects found in AI-assisted code |
| `content/ch05_evaluation.yaml` → `5.7` | Ethical assessment: transparency, understanding, accountability, privacy |
| `content/supplementary.yaml` → `Appendix A.5` | Development tooling, including AI assistants |
| `content/supplementary.yaml` → `Appendix E` | Per-item prompt summary and student modifications |
| `content/references.yaml` | Harvard entry for OpenAI (2024) |

When new AI-assisted code is added to the artefact, add a row to Table 4.3 and a matching
`E.n` entry in Appendix E.

## Figures

- Survey/Gantt/WBS: extracted from `Contextual report.docx` into [`figures/`](figures/)
- UI screenshots: copied from [`screenshot/`](../../screenshot/)

Figure widths are capped at 14cm, the width of the text area once the 4cm binding
margin is applied. Mobile screenshots use 7cm because they are portrait.

All nine UI captures are in use. The signed-in dashboard
(`ui-04-dashboard-auth.png`) is the artefact overview in Chapter 1 section 1.5;
sign-in, dashboard, upload and the document library sit in Chapter 3 section 3.5;
the AI summary and entity highlights in Chapter 4 section 4.2; API route
screenshots (`code-api-circulars.png`, `code-api-process.png`,
`code-api-fastapi.png`) sit in Chapter 4 section 4.5; Selenium IDE suite
figures (`selenium-ide-suite.png`, `selenium-ide-commands.png`,
`selenium-ide-log.png`) sit in Chapter 4 section 4.7; phase verifier
screenshots (`code-verify-phase1.png`, `code-verify-phase4.png`) sit in
Chapter 4 section 4.8; representative test-case figures
(`code-tc-pdf-magic.png`, `code-tc-pdf-test.png`,
`code-tc-date-guardrail.png`) sit in Chapter 4 section 4.9; Chapter 5 uses
verify terminals (`eval-verify-phase1.png`, `eval-verify-phase4.png`), ROUGE
and sample-eval charts (`eval-rouge-chart.png`, `eval-sample-entities.png`),
mobile views, survey evidence in 5.5, and the PDF magic-byte figure again in
5.6.

API code figures are generated from the live source files:

```bash
python scripts/render_code_screenshots.py
```

Chapter 5 evaluation charts and verify terminals:

```bash
python scripts/render_eval_figures.py
```

Selenium IDE figures are captured from the official Selenium IDE 3.17.2 UI
with [`selenium/easycircular.side`](selenium/easycircular.side) loaded:

```bash
python scripts/capture_selenium_ide.py
```

### Refreshing the UI screenshots

Re-capture them whenever the interface changes. Start the stack first, then:

```bash
npm run start:local                        # AI :5000, backend :4000, frontend :3002
python scripts/capture_screenshots.py --reset
python scripts/extract_contextual_figures.py
python scripts/generate_thesis.py
```

[`scripts/capture_screenshots.py`](../../scripts/capture_screenshots.py) signs in a
dedicated `screenshots@easycircular.local` account, processes sample circulars until
one produces a summary that passes the date guardrails, then drives Chromium over the
nine pages the thesis uses. It rewrites `screenshot/CAPTIONS.txt` as it goes.

- `--reset` clears that account's circulars first, so the library screenshot is tidy
- `--keep-data` leaves the processed circulars in place, making the next run much faster

A guardrail-rejected summary renders a red "AI summary unavailable" banner, which would
misrepresent normal operation in a figure, so the script prefers a document whose
summary passed and only falls back after `MAX_CANDIDATES` attempts.

## Regenerate bulk expansions (optional)

```bash
python scripts/generate_bulk_yaml.py
python scripts/generate_thesis.py
```
