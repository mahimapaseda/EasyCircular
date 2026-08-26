#!/usr/bin/env python3
"""Generate EasyCircular A1 portrait academic poster (Word + optional PDF).

Output:
  docs/thesis/EasyCircular-Poster-A1.docx
  docs/thesis/EasyCircular-Poster-A1.pdf  (requires Microsoft Word on Windows)

Usage:
    python scripts/generate_poster.py
    npm run generate:poster
"""

from __future__ import annotations

import sys
from pathlib import Path

import yaml
from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "docs" / "thesis" / "content" / "poster.yaml"
FIGURES = ROOT / "docs" / "thesis" / "figures"
MANUAL_IMG = ROOT / "docs" / "user-manual" / "images"
OUTPUT_DOCX = ROOT / "docs" / "thesis" / "EasyCircular-Poster-A1.docx"
OUTPUT_PDF = ROOT / "docs" / "thesis" / "EasyCircular-Poster-A1.pdf"

FONT = "Calibri"


def rgb(hex_color: str) -> RGBColor:
    h = hex_color.lstrip("#")
    return RGBColor(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def set_run(run, *, size=11, bold=False, italic=False, color="334155", font=FONT):
    run.font.name = font
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = rgb(color)
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.insert(0, rfonts)
    for key in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rfonts.set(qn(key), font)


def add_text(paragraph, text, **kwargs):
    run = paragraph.add_run(text)
    set_run(run, **kwargs)
    return run


def shade_cell(cell, fill: str) -> None:
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    for old in tcPr.findall(qn("w:shd")):
        tcPr.remove(old)
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def set_cell_margins(cell, top=60, bottom=60, left=100, right=100) -> None:
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = OxmlElement("w:tcMar")
    for edge, val in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        node = OxmlElement(f"w:{edge}")
        node.set(qn("w:w"), str(val))
        node.set(qn("w:type"), "dxa")
        tcMar.append(node)
    tcPr.append(tcMar)


def set_cell_border(cell, **sides) -> None:
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    for edge, (val, sz, color) in sides.items():
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), val)
        el.set(qn("w:sz"), str(sz))
        el.set(qn("w:color"), color)
        el.set(qn("w:space"), "0")
        borders.append(el)
    tcPr.append(borders)


def clear_cell(cell) -> None:
    for p in cell.paragraphs[1:]:
        p._element.getparent().remove(p._element)
    if cell.paragraphs:
        cell.paragraphs[0].clear()


def card_cell(cell, fill="FFFFFF", border="CBD5E1") -> None:
    shade_cell(cell, fill)
    set_cell_margins(cell)
    set_cell_border(
        cell,
        top=("single", 6, border),
        left=("single", 6, border),
        bottom=("single", 6, border),
        right=("single", 6, border),
    )
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP


def section_heading(cell, title: str, navy: str) -> None:
    clear_cell(cell)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.space_before = Pt(0)
    add_text(p, title, size=13, bold=True, color=navy, font=FONT)


def body_paragraph(cell, text: str, slate: str, size=9.5) -> None:
    p = cell.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    add_text(p, text, size=size, color=slate)


def bullet_list(cell, items: list[str], slate: str, size=9.5) -> None:
    for item in items:
        p = cell.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.left_indent = Cm(0.25)
        p.paragraph_format.first_line_indent = Cm(-0.25)
        add_text(p, f"• {item}", size=size, color=slate)


def numbered_list(cell, items: list[str], slate: str, size=9.5) -> None:
    for i, item in enumerate(items, 1):
        p = cell.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.left_indent = Cm(0.3)
        p.paragraph_format.first_line_indent = Cm(-0.3)
        add_text(p, f"{i}. {item}", size=size, color=slate)


def resolve_figure(name: str, alt_path: str | None = None) -> Path | None:
    p = FIGURES / name
    if p.exists():
        return p
    if alt_path:
        alt = (CONTENT.parent / alt_path).resolve()
        if alt.exists():
            return alt
    manual = MANUAL_IMG / name
    if manual.exists():
        return manual
    return None


def add_picture(cell, path: Path, width_cm: float) -> None:
    p = cell.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run()
    run.add_picture(str(path), width=Cm(width_cm))


def merge_row_cells(row, start: int, end: int):
    a = row.cells[start]
    b = row.cells[end]
    a.merge(b)


def set_col_widths(table, widths_cm: list[float]) -> None:
    for row in table.rows:
        for i, w in enumerate(widths_cm):
            if i < len(row.cells):
                row.cells[i].width = Cm(w)


def remove_table_borders(table) -> None:
    tbl = table._tbl
    tblPr = tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "nil")
        borders.append(el)
    tblPr.append(borders)


def load_poster() -> dict:
    with CONTENT.open(encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def build() -> Document:
    data = load_poster()
    meta = data["meta"]
    sec = data["sections"]
    sty = data["style"]
    fig = data["figures"]

    navy = sty["navy"]
    teal = sty["teal"]
    slate = sty["slate"]
    muted = sty["muted"]
    bg = sty["bg"]

    doc = Document()
    section = doc.sections[0]
    section.page_width = Cm(59.4)
    section.page_height = Cm(84.1)
    section.left_margin = Cm(2.0)
    section.right_margin = Cm(2.0)
    section.top_margin = Cm(1.5)
    section.bottom_margin = Cm(1.5)

    props = doc.core_properties
    props.title = "EasyCircular A1 Project Poster"
    props.author = meta["student_name"]
    props.subject = meta["subtitle"]

    usable_w = 59.4 - 4.0  # cm

    # --- Header ---
    header = doc.add_table(rows=1, cols=1)
    header.alignment = WD_TABLE_ALIGNMENT.CENTER
    remove_table_borders(header)
    hc = header.rows[0].cells[0]
    card_cell(hc, fill=bg, border=navy)
    shade_cell(hc, navy)
    set_cell_margins(hc, top=120, bottom=120, left=160, right=160)
    clear_cell(hc)

    t = hc.paragraphs[0]
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_text(t, meta["title"], size=36, bold=True, color="FFFFFF")
    hc.add_paragraph()
    st = hc.add_paragraph()
    st.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_text(st, meta["subtitle"], size=14, bold=False, color="E2E8F0")
    si = hc.add_paragraph()
    si.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_text(si, meta["subtitle_si"], size=11, color="94A3B8")
    info = hc.add_paragraph()
    info.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_text(
        info,
        f"{meta['student_name']} ({meta['student_id']})  ·  "
        f"Supervisor: {meta['supervisor']}  ·  {meta['university']}  ·  {meta['date']}",
        size=10,
        color="CBD5E1",
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # --- Row 1: Intro | Aim | Objectives ---
    r1 = doc.add_table(rows=1, cols=3)
    r1.alignment = WD_TABLE_ALIGNMENT.CENTER
    remove_table_borders(r1)
    set_col_widths(r1, [usable_w / 3] * 3)

    c_intro, c_aim, c_obj = r1.rows[0].cells
    for c in (c_intro, c_aim, c_obj):
        card_cell(c)

    section_heading(c_intro, "INTRODUCTION", navy)
    body_paragraph(c_intro, sec["introduction"], slate)

    section_heading(c_aim, "AIM", navy)
    body_paragraph(c_aim, sec["aim"], slate)

    section_heading(c_obj, "OBJECTIVES", navy)
    numbered_list(c_obj, sec["objectives"], slate)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # --- Methodology ---
    r2 = doc.add_table(rows=1, cols=1)
    remove_table_borders(r2)
    mc = r2.rows[0].cells[0]
    card_cell(mc)
    section_heading(mc, "METHODOLOGY", navy)
    body_paragraph(mc, sec["methodology"], slate)
    phase_p = mc.add_paragraph()
    phase_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    phase_p.paragraph_format.space_before = Pt(6)
    phases = "   →   ".join(sec["phases"])
    add_text(phase_p, phases, size=10, bold=True, color=teal)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # --- Architecture + Screenshots ---
    r3 = doc.add_table(rows=1, cols=2)
    remove_table_borders(r3)
    set_col_widths(r3, [usable_w * 0.42, usable_w * 0.58])

    arch_cell, shot_cell = r3.rows[0].cells
    card_cell(arch_cell)
    card_cell(shot_cell)

    section_heading(arch_cell, "SYSTEM ARCHITECTURE", navy)
    arch_lines = [
        "User Browser → Next.js Frontend (3002)",
        "→ Express Backend (4000: JWT, cache, rate limit)",
        "→ FastAPI AI Service (5000: OCR, SpaCy NER, LangChain/Ollama, guardrails)",
        "→ MongoDB (27017)",
        "",
        "Pipeline: Upload PDF → Extract/OCR → Human Edit → Process → Display",
    ]
    for line in arch_lines:
        if line:
            body_paragraph(arch_cell, line, slate, size=9)
        else:
            arch_cell.add_paragraph()

    arch_path = resolve_figure(fig["architecture"])
    if arch_path:
        add_picture(arch_cell, arch_path, width_cm=usable_w * 0.38)

    section_heading(shot_cell, "APPLICATION SCREENSHOTS", navy)
    for shot in fig["screenshots"]:
        path = resolve_figure(shot["file"], shot.get("alt_path"))
        cap_p = shot_cell.add_paragraph()
        add_text(cap_p, shot["caption"], size=8, bold=True, color=muted)
        if path:
            add_picture(shot_cell, path, width_cm=usable_w * 0.52)
        else:
            body_paragraph(shot_cell, f"[Missing: {shot['file']}]", slate, size=8)

    mobile_path = resolve_figure(fig["mobile"])
    if mobile_path:
        cap_p = shot_cell.add_paragraph()
        add_text(cap_p, "Mobile summary view", size=8, bold=True, color=muted)
        add_picture(shot_cell, mobile_path, width_cm=4.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # --- Tech | Requirements | Evaluation ---
    r4 = doc.add_table(rows=1, cols=3)
    remove_table_borders(r4)
    set_col_widths(r4, [usable_w / 3] * 3)
    c_tech, c_req, c_eval = r4.rows[0].cells
    for c in (c_tech, c_req, c_eval):
        card_cell(c)

    section_heading(c_tech, "TECHNOLOGY STACK", navy)
    tech_line = " · ".join(sec["tech_stack"])
    body_paragraph(c_tech, tech_line, slate, size=8.5)

    section_heading(c_req, "KEY REQUIREMENTS", navy)
    bullet_list(c_req, sec["requirements"], slate, size=8.5)

    ev = sec["evaluation"]
    section_heading(c_eval, "EVALUATION & RESULTS", navy)
    eval_lines = [
        f"Survey (n={ev['survey_n']}): {ev['want_summary_pct']}% want summaries | "
        f"{ev['entity_highlight_pct']}% want entity highlighting | "
        f"{ev['efficiency_pct']}% expect efficiency gain | "
        f"{ev['ai_hesitation_pct']}% hesitant about AI",
        f"ROUGE macro F1: ROUGE-1 {ev['rouge1_f1']} | ROUGE-2 {ev['rouge2_f1']} | ROUGE-L {ev['rougeL_f1']}",
        f"Testing: {ev['ai_pytest']} AI pytest | {ev['backend_tests']} backend tests | Phase 1 & 4 verified",
        ev["uat_note"],
    ]
    for line in eval_lines:
        body_paragraph(c_eval, line, slate, size=8.5)

    rouge_path = resolve_figure(fig["rouge_chart"])
    if rouge_path:
        add_picture(c_eval, rouge_path, width_cm=usable_w / 3 - 0.8)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # --- Achievements | Challenges | Future ---
    r5 = doc.add_table(rows=1, cols=3)
    remove_table_borders(r5)
    set_col_widths(r5, [usable_w / 3] * 3)
    c_ach, c_ch, c_fut = r5.rows[0].cells
    for c in (c_ach, c_ch, c_fut):
        card_cell(c)

    section_heading(c_ach, "ACHIEVEMENTS", navy)
    bullet_list(c_ach, sec["achievements"], slate, size=8.5)

    section_heading(c_ch, "CHALLENGES", navy)
    bullet_list(c_ch, sec["challenges"], slate, size=8.5)

    section_heading(c_fut, "FUTURE WORK (PHASE 6)", navy)
    bullet_list(c_fut, sec["future_work"], slate, size=8.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # --- References ---
    r6 = doc.add_table(rows=1, cols=1)
    remove_table_borders(r6)
    rc = r6.rows[0].cells[0]
    card_cell(rc)
    section_heading(rc, "REFERENCES", navy)
    for ref in sec["references"]:
        p = rc.add_paragraph()
        p.paragraph_format.space_after = Pt(1)
        add_text(p, ref, size=7.5, color=muted)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # --- Footer ---
    footer = doc.add_table(rows=1, cols=1)
    remove_table_borders(footer)
    fc = footer.rows[0].cells[0]
    shade_cell(fc, navy)
    set_cell_margins(fc, top=80, bottom=80, left=140, right=140)
    clear_cell(fc)
    fp = fc.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_text(
        fp,
        f"{meta['student_name']} | {meta['student_id']}  ·  "
        f"Supervisor: {meta['supervisor']}  ·  "
        f"{meta['university']} | {meta['degree']} | {meta['date']}",
        size=10,
        bold=True,
        color="FFFFFF",
    )

    return doc


def export_pdf(docx_path: Path, pdf_path: Path) -> bool:
    """Try docx2pdf (Windows + Word) then LibreOffice."""
    try:
        from docx2pdf import convert

        convert(str(docx_path), str(pdf_path))
        return pdf_path.exists()
    except Exception:
        pass

    import shutil
    import subprocess

    for cmd in ("soffice", "libreoffice"):
        exe = shutil.which(cmd)
        if not exe:
            continue
        try:
            subprocess.run(
                [
                    exe,
                    "--headless",
                    "--convert-to",
                    "pdf",
                    "--outdir",
                    str(pdf_path.parent),
                    str(docx_path),
                ],
                check=True,
                capture_output=True,
                timeout=120,
            )
            generated = pdf_path.parent / f"{docx_path.stem}.pdf"
            if generated.exists() and generated != pdf_path:
                generated.replace(pdf_path)
            return pdf_path.exists()
        except Exception:
            continue
    return False


def main() -> int:
    if not CONTENT.exists():
        print(f"Missing {CONTENT}", file=sys.stderr)
        return 1

    doc = build()
    OUTPUT_DOCX.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUTPUT_DOCX)
    print(f"Wrote {OUTPUT_DOCX}")

    if export_pdf(OUTPUT_DOCX, OUTPUT_PDF):
        print(f"Wrote {OUTPUT_PDF}")
    else:
        print(
            "PDF export skipped (install Microsoft Word + docx2pdf, or LibreOffice).\n"
            "  Open EasyCircular-Poster-A1.docx → File → Export → Create PDF",
            file=sys.stderr,
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
