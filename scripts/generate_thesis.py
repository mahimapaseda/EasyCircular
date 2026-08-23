#!/usr/bin/env python3
"""Generate EasyCircular Sinhala thesis Word document from YAML content."""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "docs" / "thesis" / "content"
FIGURES = ROOT / "docs" / "thesis" / "figures"
OUTPUT = ROOT / "docs" / "thesis" / "EasyCircular-Thesis.docx"

CHAPTER_FILES = [
    "ch01_introduction.yaml",
    "ch02_literature.yaml",
    "ch03_design.yaml",
    "ch04_development.yaml",
    "ch05_evaluation.yaml",
    "ch06_conclusion.yaml",
]


def load_yaml(name: str) -> dict[str, Any]:
    path = CONTENT / name
    if not path.exists():
        return {}
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def merge_bulk(chapter: dict[str, Any], bulk: dict[str, Any], chapter_key: str) -> None:
    extra = bulk.get(chapter_key) or {}
    for section in chapter.get("sections") or []:
        sid = section.get("id")
        if sid and sid in extra:
            section.setdefault("paragraphs", [])
            section["paragraphs"].extend(extra[sid].get("paragraphs") or [])
            if extra[sid].get("bullets"):
                section.setdefault("bullets", [])
                section["bullets"].extend(extra[sid]["bullets"])
            if extra[sid].get("numbered"):
                section.setdefault("numbered", [])
                section["numbered"].extend(extra[sid]["numbered"])


def set_run_font(run, font_name: str, size_pt: int, bold: bool = False) -> None:
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.font.bold = bold
    run.font.color.rgb = RGBColor(0, 0, 0)
    r = run._element
    rpr = r.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.insert(0, rfonts)
    rfonts.set(qn("w:ascii"), font_name)
    rfonts.set(qn("w:hAnsi"), font_name)
    rfonts.set(qn("w:cs"), font_name)
    rfonts.set(qn("w:eastAsia"), font_name)
    # Word sizes and bolds complex scripts (Sinhala) from the Cs properties,
    # not w:sz / w:b, so both have to be set or Sinhala falls back to 10pt.
    sz_cs = OxmlElement("w:szCs")
    sz_cs.set(qn("w:val"), str(int(size_pt * 2)))
    rpr.append(sz_cs)
    if bold:
        b_cs = OxmlElement("w:bCs")
        rpr.append(b_cs)


SINHALA_START, SINHALA_END = "\u0d80", "\u0dff"
ZWJ = "\u200d"


def _script_of(ch: str) -> str | None:
    """Return 'si', 'latin', or None for characters that carry no script."""
    if SINHALA_START <= ch <= SINHALA_END or ch == ZWJ:
        return "si"
    if ch.isalpha():
        return "latin"
    return None


def split_by_script(text: str) -> list[tuple[str, str]]:
    """Split text into (script, segment) pairs at script boundaries only.

    Spaces, digits and punctuation carry no script of their own, so they join
    the preceding segment. That keeps run counts low and, more importantly,
    never splits a Sinhala consonant cluster, which would break its shaping.
    """
    segments: list[tuple[str, str]] = []
    script: str | None = None
    buf: list[str] = []
    for ch in text:
        ch_script = _script_of(ch)
        if ch_script is None or ch_script == script or script is None:
            if script is None and ch_script is not None:
                script = ch_script
            buf.append(ch)
            continue
        segments.append((script, "".join(buf)))
        script, buf = ch_script, [ch]
    if buf:
        segments.append((script or "latin", "".join(buf)))
    return segments


def add_runs(paragraph, text: str, meta: dict, size_pt: int, bold: bool = False) -> None:
    """Add text as one run per script, so Sinhala and Latin each get their font.

    The guidelines ask for Times New Roman, which has no Sinhala glyphs, so
    Latin text uses it and Sinhala text keeps Iskoola Pota.
    """
    latin = meta.get("font_latin", "Times New Roman")
    sinhala = meta.get("font", "Iskoola Pota")
    for script, segment in split_by_script(text):
        if not segment:
            continue
        run = paragraph.add_run(segment)
        set_run_font(run, sinhala if script == "si" else latin, size_pt, bold=bold)


def fill_cell(cell, text: str, meta: dict, size_pt: int, bold: bool = False) -> None:
    cell.text = ""
    add_runs(cell.paragraphs[0], text, meta, size_pt, bold=bold)


def add_field(paragraph, field_code: str) -> None:
    run = paragraph.add_run()
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = field_code
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_begin)
    run._r.append(instr)
    run._r.append(fld_sep)
    run._r.append(fld_end)


def add_paragraph(doc: Document, text: str, meta: dict, style: str | None = None, align=None) -> None:
    p = doc.add_paragraph(style=style) if style else doc.add_paragraph()
    if align is not None:
        p.alignment = align
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    p.paragraph_format.line_spacing = meta.get("line_spacing", 1.5)
    p.paragraph_format.space_after = Pt(6)
    add_runs(p, text, meta, meta["font_size"])


def add_heading(doc: Document, text: str, level: int, meta: dict) -> None:
    style = f"Heading {min(level, 3)}"
    p = doc.add_paragraph(style=style)
    p.paragraph_format.space_before = Pt(12 if level == 1 else 8)
    p.paragraph_format.space_after = Pt(6)
    sizes = {1: 16, 2: 14, 3: 13}
    add_runs(p, text, meta, sizes.get(level, 12), bold=True)


def add_table(doc: Document, headers: list[str], rows: list[list[str]], meta: dict, caption: str | None = None) -> None:
    if caption:
        cp = doc.add_paragraph()
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        add_runs(cp, caption, meta, meta["font_size"] - 1, bold=True)
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    for j, h in enumerate(headers):
        fill_cell(table.rows[0].cells[j], h, meta, meta["font_size"] - 1, bold=True)
    for i, row in enumerate(rows, start=1):
        for j, val in enumerate(row):
            fill_cell(table.rows[i].cells[j], str(val), meta, meta["font_size"] - 1)
    doc.add_paragraph()


def add_figure(doc: Document, fig_path: Path, caption: str, meta: dict, width_cm: float = 14.0) -> None:
    if not fig_path.exists():
        add_paragraph(doc, f"[රූපය හමු නොවීය: {fig_path.name}]", meta)
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    if fig_path.suffix.lower() == ".emf":
        add_paragraph(doc, f"[EMF රූපය: {fig_path.name} - Word හි architecture.emf විවෘත කරන්න]", meta)
    else:
        try:
            run.add_picture(str(fig_path), width=Cm(width_cm))
        except Exception as exc:
            add_paragraph(doc, f"[රූපය ඇතුළත් කළ නොහැක: {fig_path.name} ({exc})]", meta)
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_runs(cap, caption, meta, meta["font_size"] - 1)
    cap.paragraph_format.space_after = Pt(10)


def build_rouge_table(meta: dict) -> tuple[list[str], list[list[str]]]:
    path = ROOT / "docs" / "evaluation" / "rouge-report.json"
    if not path.exists():
        return [], []
    data = json.loads(path.read_text(encoding="utf-8"))
    headers = ["චක්‍රලේඛ ID", "ROUGE-1 F1", "ROUGE-2 F1", "ROUGE-L F1"]
    rows = []
    for doc_item in data.get("docs") or []:
        rows.append([
            doc_item["id"],
            f"{doc_item['rouge1']['f1']:.3f}",
            f"{doc_item['rouge2']['f1']:.3f}",
            f"{doc_item['rougeL']['f1']:.3f}",
        ])
    macro = data.get("macro") or {}
    rows.append([
        "සාමාන්‍ය (macro)",
        f"{macro.get('rouge1_f1', 0):.3f}",
        f"{macro.get('rouge2_f1', 0):.3f}",
        f"{macro.get('rougeL_f1', 0):.3f}",
    ])
    return headers, rows


def build_sample_eval_table() -> tuple[list[str], list[list[str]]]:
    path = ROOT / "scripts" / "sample-evaluation.json"
    if not path.exists():
        return [], []
    data = json.loads(path.read_text(encoding="utf-8"))
    headers = ["PDF", "පිටු", "OCR", "DATE", "ORG", "LAW", "ක්‍රියා"]
    rows = []
    for item in data[:8]:
        ec = item.get("entityCounts") or {}
        rows.append([
            item.get("file", ""),
            str(item.get("pages", "")),
            "ඔව්" if item.get("ocr") else "නැත",
            str(ec.get("DATE", 0)),
            str(ec.get("ORG", 0)),
            str(ec.get("LAW", 0)),
            str(item.get("actionItems", 0)),
        ])
    return headers, rows


def build_api_table() -> tuple[list[str], list[list[str]]]:
    headers = ["HTTP", "Endpoint", "විස්තර"]
    rows = [
        ["POST", "/api/circulars/upload", "PDF උඩුගත (JWT අවශ්‍ය)"],
        ["POST", "/api/circulars/:id/extract", "PDF → පෙළ නිස්සාරණ"],
        ["PATCH", "/api/circulars/:id/text", "සංස්කරණය කළ පෙළ සුරකින්න"],
        ["POST", "/api/circulars/:id/process", "NER + සාරාංශ"],
        ["GET", "/api/circulars", "චක්‍රලේඛ ලැයිස්තුව"],
        ["POST", "/api/moe/import", "moe.gov.lk නිල PDF"],
        ["POST", "/v1/parse/pdf", "AI: PDF parsing + OCR"],
        ["POST", "/v1/pipeline", "AI: entities + summary"],
    ]
    return headers, rows


def render_section(doc: Document, section: dict, meta: dict, figures_cfg: dict) -> None:
    if section.get("title"):
        add_heading(doc, section["title"], section.get("level", 2), meta)
    for para in section.get("paragraphs") or []:
        add_paragraph(doc, para, meta)
    for bullet in section.get("bullets") or []:
        p = doc.add_paragraph(style="List Bullet")
        add_runs(p, bullet, meta, meta["font_size"])
    for item in section.get("numbered") or []:
        p = doc.add_paragraph(style="List Number")
        add_runs(p, item, meta, meta["font_size"])
    if section.get("table"):
        t = section["table"]
        add_table(doc, t["headers"], t["rows"], meta, t.get("caption"))
    if section.get("table_ref") == "rouge":
        h, r = build_rouge_table(meta)
        if h:
            add_table(doc, h, r, meta, section.get("table_caption"))
    if section.get("table_ref") == "sample_eval":
        h, r = build_sample_eval_table()
        if h:
            add_table(doc, h, r, meta, section.get("table_caption"))
    if section.get("table_ref") == "api":
        h, r = build_api_table()
        add_table(doc, h, r, meta, section.get("table_caption"))
    for fig_id in section.get("figures") or []:
        fig = figures_cfg.get(fig_id)
        if fig:
            path = FIGURES / fig["file"]
            add_figure(doc, path, fig.get("caption_si", fig_id), meta, fig.get("width_cm", 14))


def count_words(doc: Document) -> int:
    total = 0
    for p in doc.paragraphs:
        total += len(p.text.split())
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                total += len(cell.text.split())
    return total


def build_document() -> Document:
    meta_cfg = load_yaml("meta.yaml")
    front = load_yaml("front_matter.yaml")
    bulk = load_yaml("bulk.yaml")
    figures_cfg = load_yaml("figures.yaml")
    refs = load_yaml("references.yaml")
    supp = load_yaml("supplementary.yaml")

    meta = {
        "font": meta_cfg.get("font_primary", "Iskoola Pota"),
        "font_latin": meta_cfg.get("font_latin", "Times New Roman"),
        "font_size": meta_cfg.get("font_size_body", 12),
        "line_spacing": meta_cfg.get("line_spacing", 1.5),
        "words_per_page": meta_cfg.get("words_per_page", 350),
        "min_pages": meta_cfg.get("min_pages", 80),
    }

    doc = Document()
    sec = doc.sections[0]
    sec.page_height = Cm(29.7)
    sec.page_width = Cm(21.0)
    sec.top_margin = Cm(2.54)
    sec.bottom_margin = Cm(2.54)
    # Wider left margin leaves room for spiral binding
    sec.left_margin = Cm(4.0)
    sec.right_margin = Cm(2.54)

    # Cover
    for _ in range(4):
        doc.add_paragraph()
    add_paragraph(doc, meta_cfg.get("university", ""), meta, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_paragraph(doc, meta_cfg.get("department", ""), meta, align=WD_ALIGN_PARAGRAPH.CENTER)
    doc.add_paragraph()
    add_paragraph(doc, meta_cfg.get("degree", ""), meta, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_paragraph(doc, meta_cfg.get("document_type", "Undergraduate Thesis Report"), meta, align=WD_ALIGN_PARAGRAPH.CENTER)
    doc.add_paragraph()
    add_paragraph(doc, meta_cfg.get("project_title_si", ""), meta, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_paragraph(doc, meta_cfg.get("project_title_en", ""), meta, align=WD_ALIGN_PARAGRAPH.CENTER)
    doc.add_paragraph()
    add_paragraph(doc, f"ශිෂ්‍ය නම: {meta_cfg.get('student_name', '')}", meta, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_paragraph(doc, f"ශිෂ්‍ය අංකය: {meta_cfg.get('student_id', '')}", meta, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_paragraph(doc, f"Supervisor: {meta_cfg.get('supervisor_name', '')}", meta, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_paragraph(doc, f"ඉදිරිපත් කළ දිනය: {meta_cfg.get('submission_date', '')}", meta, align=WD_ALIGN_PARAGRAPH.CENTER)
    doc.add_page_break()

    # Declaration (Session Three order: after title)
    add_heading(doc, "ප්‍රකාශය (Declaration)", 1, meta)
    for para in front.get("declaration") or []:
        add_paragraph(doc, para, meta)
    doc.add_page_break()

    # AI Use Declaration (academic integrity requirement)
    add_heading(doc, "AI භාවිත ප්‍රකාශය (AI-Generated Content Declaration)", 1, meta)
    for para in front.get("ai_declaration") or []:
        add_paragraph(doc, para, meta)
    doc.add_page_break()

    # Abstract (before acknowledgement per guidelines)
    add_heading(doc, "සාරාංශය (Abstract)", 1, meta)
    for para in front.get("abstract") or []:
        add_paragraph(doc, para, meta)
    doc.add_page_break()

    # Acknowledgement
    add_heading(doc, "ස්තුතිය", 1, meta)
    for para in front.get("acknowledgement") or []:
        add_paragraph(doc, para, meta)
    doc.add_page_break()

    # Dedication
    for _ in range(4):
        doc.add_paragraph()
    add_heading(doc, "කැප කිරීම", 1, meta)
    for para in front.get("dedication") or []:
        add_paragraph(doc, para, meta, align=WD_ALIGN_PARAGRAPH.CENTER)
    doc.add_page_break()

    # Keywords (guidelines cap this at eight)
    add_heading(doc, "යතුරු පද (Keywords)", 1, meta)
    keywords = (front.get("keywords") or [])[:8]
    add_paragraph(doc, "; ".join(keywords), meta)
    doc.add_page_break()

    # TOC
    add_heading(doc, "අන්තර්ගත වගුව", 1, meta)
    tp = doc.add_paragraph()
    add_field(tp, 'TOC \\o "1-3" \\h \\z \\u')
    add_paragraph(doc, "(Word හි Ctrl+A → F9 ඔබා අන්තර්ගත වගුව යාවත්කාලීන කරන්න)", meta)
    doc.add_page_break()

    # List of tables
    add_heading(doc, "වගු ලැයිස්තුව", 1, meta)
    tp2 = doc.add_paragraph()
    add_field(tp2, 'TOC \\h \\z \\c "Table"')
    doc.add_page_break()

    # List of figures
    add_heading(doc, "රූප ලැයිස්තුව", 1, meta)
    tp3 = doc.add_paragraph()
    add_field(tp3, 'TOC \\h \\z \\c "Figure"')
    doc.add_page_break()

    # Glossary / abbreviations
    add_heading(doc, "ශබ්දකෝෂය / List of Abbreviations", 1, meta)
    for entry in front.get("glossary") or []:
        add_paragraph(doc, f"{entry['term']}: {entry['definition']}", meta)
    doc.add_page_break()

    # Chapters
    for fname in CHAPTER_FILES:
        chapter = load_yaml(fname)
        if not chapter:
            continue
        key = fname.replace(".yaml", "")
        merge_bulk(chapter, bulk, key)
        add_heading(doc, chapter.get("title", ""), 1, meta)
        for section in chapter.get("sections") or []:
            render_section(doc, section, meta, figures_cfg.get("figures") or {})
        doc.add_page_break()

    # References
    add_heading(doc, "මූලාශ්‍ර (References)", 1, meta)
    for ref in refs.get("items") or []:
        add_paragraph(doc, ref, meta)
    doc.add_page_break()

    # Appendix
    add_heading(doc, "පරිශිෂ්ට (Appendices)", 1, meta)
    for section in supp.get("sections") or []:
        render_section(doc, section, meta, figures_cfg.get("figures") or {})

    return doc, meta


def main() -> int:
    doc, meta = build_document()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    out = OUTPUT
    try:
        doc.save(str(out))
    except PermissionError:
        out = OUTPUT.with_name("EasyCircular-Thesis-updated.docx")
        doc.save(str(out))
        print(f"NOTE: {OUTPUT.name} is open in Word - wrote {out.name} instead.")
        print("Close Word and re-run npm run generate:thesis to overwrite the main file.")
    words = count_words(doc)
    pages = words / meta["words_per_page"]
    print(f"Wrote {out}")
    print(f"Words: {words:,}")
    print(f"Estimated pages: {pages:.1f} (target >= {meta['min_pages']})")
    print(f"Paragraphs: {len(doc.paragraphs)}, Tables: {len(doc.tables)}")
    if pages < meta["min_pages"]:
        print("WARNING: below minimum page target - expand bulk.yaml content")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
