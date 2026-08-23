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
| Chapter 1 | Introduction |
| Chapter 2 | Market Research and Literature Review |
| Chapter 3 | Artefact Design |
| Chapter 4 | Development and Testing |
| Chapter 5 | Evaluation |
| Chapter 6 | Conclusions and Further Work |
| Appendices | A Project Plan, B Survey questions, C Extended API endpoints, D A4 poster, E AI-assisted code segments |

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

The script prints word count and estimated pages. Target is **≥ 80 pages** (~28,000 Sinhala words).

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
| [`content/supplementary.yaml`](content/supplementary.yaml) | Appendices A-E |

Single chapters can be regenerated on their own:

```bash
python scripts/generate_chapter.py 4   # -> Chapter-04-Development.docx
```

**ROUGE** and **sample evaluation** tables are auto-loaded from:

- [`docs/evaluation/rouge-report.json`](../evaluation/rouge-report.json)
- [`scripts/sample-evaluation.json`](../../scripts/sample-evaluation.json)

Re-run `npm run evaluate:rouge` before regenerating to refresh the Chapter 5 scores.

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
