"""Generate EasyCircular 7-minute presentation (creative redesign).

Usage:
    python docs/presentation/generate_pptx.py
"""

from __future__ import annotations

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

# Theme (poster-aligned academic product story)
NAVY = RGBColor(0x1E, 0x3A, 0x5F)
TEAL = RGBColor(0x0D, 0x94, 0x88)
AMBER = RGBColor(0xD9, 0x77, 0x06)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
SLATE_BG = RGBColor(0xF0, 0xF4, 0xF8)
CARD = RGBColor(0xFF, 0xFF, 0xFF)
DARK = RGBColor(0x1F, 0x29, 0x37)
MUTED = RGBColor(0x64, 0x74, 0x8B)
SOFT_NAVY = RGBColor(0x2C, 0x4A, 0x6E)
AMBER_TINT = RGBColor(0xFE, 0xF3, 0xE2)
TEAL_TINT = RGBColor(0xE6, 0xF7, 0xF5)
FADED_NUM = RGBColor(0xD0, 0xD8, 0xE0)
LIGHT_LINE = RGBColor(0xC8, 0xD4, 0xE0)

OUT_DIR = Path(__file__).resolve().parent
OUT_FILE = OUT_DIR / "EasyCircular-7min.pptx"

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
TOTAL = 8


def _set_run(
    run,
    text: str,
    *,
    size: int,
    bold: bool = False,
    color: RGBColor = DARK,
    font: str = "Calibri",
):
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font


def _fill(shape, color: RGBColor):
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()


def _blank(prs: Presentation):
    return prs.slides.add_slide(prs.slide_layouts[6])


def _notes(slide, text: str):
    nf = slide.notes_slide.notes_text_frame
    nf.clear()
    nf.paragraphs[0].text = text.strip()


def _textbox(slide, left, top, width, height):
    return slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))


def _rect(slide, left, top, width, height, color: RGBColor):
    sh = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height)
    )
    _fill(sh, color)
    return sh


def _round_rect(slide, left, top, width, height, color: RGBColor):
    sh = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height)
    )
    _fill(sh, color)
    # Soften corners slightly
    try:
        sh.adjustments[0] = 0.08
    except Exception:
        pass
    return sh


def _oval(slide, left, top, width, height, color: RGBColor):
    sh = slide.shapes.add_shape(
        MSO_SHAPE.OVAL, Inches(left), Inches(top), Inches(width), Inches(height)
    )
    _fill(sh, color)
    return sh


def _soft_disc(slide, left, top, size, color: RGBColor):
    """Decorative disc (solid; pptx has no real opacity, use tinted colours)."""
    return _oval(slide, left, top, size, size, color)


def _content_chrome(slide, page: int, title: str, subtitle: str | None = None):
    """Slate background, navy/teal left rail, section number, title, footer."""
    _rect(slide, 0, 0, 13.333, 7.5, SLATE_BG)
    _rect(slide, 0, 0, 0.18, 7.5, NAVY)
    _rect(slide, 0.18, 0, 0.07, 7.5, TEAL)

    # Soft geometry accents
    _soft_disc(slide, 11.6, -0.8, 2.4, RGBColor(0xE2, 0xE8, 0xEF))
    _soft_disc(slide, 12.2, 5.8, 1.8, RGBColor(0xE8, 0xF0, 0xF4))

    # Section index
    num = _textbox(slide, 11.4, 0.2, 1.6, 0.7)
    p = num.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.RIGHT
    _set_run(p.add_run(), f"{page:02d}", size=36, bold=True, color=FADED_NUM, font="Georgia")

    # Title
    tb = _textbox(slide, 0.55, 0.28, 10.5, 0.55)
    _set_run(tb.text_frame.paragraphs[0].add_run(), title, size=30, bold=True, color=NAVY, font="Georgia")

    if subtitle:
        sb = _textbox(slide, 0.55, 0.82, 10.5, 0.35)
        _set_run(sb.text_frame.paragraphs[0].add_run(), subtitle, size=13, color=TEAL, font="Calibri")

    # Minimal footer
    _oval(slide, 0.55, 7.12, 0.12, 0.12, TEAL)
    ft = _textbox(slide, 0.78, 7.02, 4.0, 0.3)
    _set_run(ft.text_frame.paragraphs[0].add_run(), f"EasyCircular  ·  {page}/{TOTAL}", size=11, color=MUTED)


def _card(slide, left, top, width, height, *, accent: RGBColor | None = None, fill: RGBColor = CARD):
    sh = _round_rect(slide, left, top, width, height, fill)
    if accent is not None:
        _rect(slide, left, top, width, 0.08, accent)
    return sh


def _stat_card(slide, left, top, width, height, value: str, label: str, accent: RGBColor):
    _card(slide, left, top, width, height, accent=accent)
    vt = _textbox(slide, left + 0.2, top + 0.35, width - 0.4, 0.7)
    vp = vt.text_frame.paragraphs[0]
    vp.alignment = PP_ALIGN.CENTER
    _set_run(vp.add_run(), value, size=32, bold=True, color=NAVY, font="Georgia")
    lt = _textbox(slide, left + 0.2, top + 1.1, width - 0.4, 0.7)
    ltf = lt.text_frame
    ltf.word_wrap = True
    lp = ltf.paragraphs[0]
    lp.alignment = PP_ALIGN.CENTER
    _set_run(lp.add_run(), label, size=13, color=MUTED)


def _chip(slide, left, top, text: str, *, fill: RGBColor = NAVY, text_color: RGBColor = WHITE):
    # Estimate width from text length (approx)
    w = max(0.95, min(1.55, 0.11 * len(text) + 0.45))
    _round_rect(slide, left, top, w, 0.38, fill)
    tb = _textbox(slide, left, top + 0.05, w, 0.3)
    p = tb.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    _set_run(p.add_run(), text, size=11, bold=True, color=text_color)
    return w


def _bullets_in(slide, left, top, width, height, items: list[str], *, size=15, color=DARK):
    box = _textbox(slide, left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(8)
        _set_run(p.add_run(), f"•  {item}", size=size, color=color)


# ─── Slides ───────────────────────────────────────────────────────────────────


def slide_title(prs: Presentation):
    slide = _blank(prs)
    _rect(slide, 0, 0, 13.333, 7.5, NAVY)
    _rect(slide, 0, 0, 0.22, 7.5, TEAL)

    # Geometric circle cluster (right side)
    _soft_disc(slide, 9.8, -0.6, 3.8, SOFT_NAVY)
    _soft_disc(slide, 11.2, 3.5, 2.6, RGBColor(0x25, 0x45, 0x6A))
    _soft_disc(slide, 10.4, 1.8, 1.4, TEAL)
    _soft_disc(slide, 12.0, 0.9, 0.7, AMBER)

    brand = _textbox(slide, 0.85, 1.35, 9.5, 0.9)
    _set_run(
        brand.text_frame.paragraphs[0].add_run(),
        "EasyCircular",
        size=48,
        bold=True,
        color=WHITE,
        font="Georgia",
    )

    tag = _textbox(slide, 0.85, 2.3, 9.0, 1.1)
    tf = tag.text_frame
    tf.word_wrap = True
    _set_run(
        tf.paragraphs[0].add_run(),
        "AI-Assisted Summarisation of\nSri Lankan MOE Circulars",
        size=24,
        color=RGBColor(0xC8, 0xD4, 0xE0),
        font="Georgia",
    )

    # Meta card bottom-left
    _round_rect(slide, 0.85, 4.35, 7.2, 2.35, RGBColor(0x17, 0x32, 0x52))
    _rect(slide, 0.85, 4.35, 0.1, 2.35, TEAL)
    meta = _textbox(slide, 1.2, 4.55, 6.6, 2.0)
    mtf = meta.text_frame
    mtf.word_wrap = True
    lines = [
        ("G G M P Kusumsiri  ·  2540881", 15, True, WHITE),
        ("Supervisor: Mr. Anuruddha Abeysinghe", 13, False, RGBColor(0xC8, 0xD4, 0xE0)),
        ("Module Lecturer: Dr. Gayana Fernando", 13, False, RGBColor(0xC8, 0xD4, 0xE0)),
        ("BSc (Hons) Computer Science, University of Bedfordshire", 13, False, TEAL),
        ("August 2026", 12, False, MUTED),
    ]
    for i, (text, size, bold, color) in enumerate(lines):
        p = mtf.paragraphs[0] if i == 0 else mtf.add_paragraph()
        p.space_after = Pt(4)
        _set_run(p.add_run(), text, size=size, bold=bold, color=color)

    _notes(
        slide,
        """[~30 seconds]
Welcome. Today I present EasyCircular, an AI-assisted web system for summarising Sri Lankan Ministry of Education circular PDFs.
I am G G M P Kusumsiri, student ID 2540881, supervised by Mr. Anuruddha Abeysinghe, under Dr. Gayana Fernando, University of Bedfordshire.
This is a seven-minute overview of motivation, method, contribution, and evaluation. A separate video covers the live demonstration.""",
    )


def slide_intro(prs: Presentation):
    slide = _blank(prs)
    _content_chrome(slide, 2, "Introduction & Motivation", "Why school staff need a safer shortcut")

    # Left narrative card
    _card(slide, 0.5, 1.35, 7.0, 4.55, accent=NAVY)
    _bullets_in(
        slide,
        0.75,
        1.6,
        6.5,
        4.0,
        [
            "MOE circulars are long PDFs (often 5–20 pages) for principals, teachers, and officers",
            "Deadlines, legal references, and actions sit buried in administrative language",
            "Misreads, including informal WhatsApp sharing, risk compliance failures",
            "EasyCircular is an assistive shortcut, not a replacement for the circular",
        ],
        size=15,
    )

    # Right stat stack
    _stat_card(slide, 7.8, 1.35, 4.9, 1.85, "97.6%", "of survey respondents\nwant a summary feature  (n=41)", TEAL)
    _stat_card(slide, 7.8, 3.4, 4.9, 1.85, "68.3%", "hesitant about AI without\nprivacy and human control", AMBER)

    # Amber callout strip
    _round_rect(slide, 0.5, 6.1, 12.2, 0.7, AMBER_TINT)
    _rect(slide, 0.5, 6.1, 0.12, 0.7, AMBER)
    call = _textbox(slide, 0.85, 6.25, 11.6, 0.45)
    _set_run(
        call.text_frame.paragraphs[0].add_run(),
        "Original PDF remains the legal source of truth. EasyCircular is a navigation aid.",
        size=14,
        bold=True,
        color=NAVY,
    )

    _notes(
        slide,
        """[~60 seconds]
Education circulars from Sri Lanka’s Ministry of Education are dense policy PDFs. Staff must find dates, duties, and legal references quickly, but meaning is easy to miss when documents are long or only skimmed via WhatsApp.
Our survey of 41 school stakeholders showed almost everyone wants a summary feature, 97.6%, yet 68.3% were unwilling to trust AI without safeguards. That motivates a privacy-aware, human-in-the-loop design.
EasyCircular never replaces the PDF; it helps people navigate it.""",
    )


def slide_objectives(prs: Presentation):
    slide = _blank(prs)
    _content_chrome(slide, 3, "Aim & Objectives", "What this project set out to deliver")

    # Aim banner with teal edge
    _round_rect(slide, 0.5, 1.3, 12.2, 1.15, CARD)
    _rect(slide, 0.5, 1.3, 0.14, 1.15, TEAL)
    aim = _textbox(slide, 0.85, 1.45, 11.6, 0.9)
    atf = aim.text_frame
    atf.word_wrap = True
    _set_run(atf.paragraphs[0].add_run(), "AIM", size=11, bold=True, color=TEAL)
    p2 = atf.add_paragraph()
    _set_run(
        p2.add_run(),
        "Develop an AI-powered web application using NLP to extract and summarise complex MOE circulars, improving administrative efficiency in Sri Lankan schools.",
        size=14,
        color=DARK,
    )

    goals = [
        ("01", "Evaluate NLP and summarisation techniques for administrative documents"),
        ("02", "Secure PDF ingestion with OCR fallback and mandatory human text review"),
        ("03", "NER for dates, organisations, and legal references"),
        ("04", "Dynamic summarisation engine with hallucination guardrails"),
        ("05", "Evaluate via ROUGE, automated tests, and stakeholder survey"),
    ]
    for i, (num, text) in enumerate(goals):
        x = 0.5 + i * 2.45
        _card(slide, x, 2.75, 2.3, 3.6, accent=TEAL if i % 2 == 0 else AMBER)
        nt = _textbox(slide, x + 0.15, 3.0, 2.0, 0.5)
        _set_run(nt.text_frame.paragraphs[0].add_run(), num, size=26, bold=True, color=TEAL if i % 2 == 0 else AMBER, font="Georgia")
        bt = _textbox(slide, x + 0.15, 3.65, 2.0, 2.4)
        btf = bt.text_frame
        btf.word_wrap = True
        _set_run(btf.paragraphs[0].add_run(), text, size=13, color=DARK)

    _notes(
        slide,
        """[~45 seconds]
The project aim is a practical NLP web app for MOE circulars.
Five objectives: study suitable NLP methods; build secure upload and OCR with a forced human review step; highlight entities such as dates and organisations; summarise with guardrails against hallucination; and evaluate accuracy and stakeholder need with ROUGE, tests, and a survey.""",
    )


def slide_literature(prs: Presentation):
    slide = _blank(prs)
    _content_chrome(slide, 4, "Key Facts from Literature", "Foundations that shaped the design")

    insights = [
        ("LLMs & map-reduce", "Transformer models enable abstractive summarisation of long documents."),
        ("Extractive vs abstractive", "Fluency versus faithfulness: a core trade-off for policy text."),
        ("Hallucination risk", "Invented dates and deadlines are unacceptable in circulars."),
        ("Named entity recognition", "DATE, ORG, and LAW-style spans surface actionable detail."),
        ("OCR & low-resource NLP", "Sinhala/Tamil gaps make human-in-the-loop review essential."),
        ("ROUGE caveat", "N-gram overlap with human briefs, not legal correctness."),
    ]
    accents = [TEAL, NAVY, AMBER, TEAL, NAVY, AMBER]
    for i, ((lead, body), accent) in enumerate(zip(insights, accents)):
        row, col = divmod(i, 3)
        x = 0.5 + col * 4.15
        y = 1.35 + row * 2.55
        _card(slide, x, y, 3.95, 2.35, accent=accent)
        lt = _textbox(slide, x + 0.25, y + 0.35, 3.45, 0.45)
        _set_run(lt.text_frame.paragraphs[0].add_run(), lead, size=15, bold=True, color=NAVY, font="Georgia")
        bt = _textbox(slide, x + 0.25, y + 0.95, 3.45, 1.1)
        btf = bt.text_frame
        btf.word_wrap = True
        _set_run(btf.paragraphs[0].add_run(), body, size=13, color=MUTED)

    _notes(
        slide,
        """[~60 seconds]
Literature points to LLMs for abstractive long-document summarisation, often via map-reduce chunking.
Extractive methods are safer but less fluent; abstractive methods risk inventing dates, unacceptable for circulars.
NER helps surface actionable entities. Sinhala and Tamil OCR remain harder, so a human review gate is justified.
We use ROUGE as a standard automatic metric, while acknowledging it does not prove legal correctness.""",
    )


def slide_methodology(prs: Presentation):
    slide = _blank(prs)
    _content_chrome(slide, 5, "Methodology & Tech Stack", "Agile delivery + three-tier architecture")

    phase = _textbox(slide, 0.5, 1.25, 12.2, 0.35)
    _set_run(
        phase.text_frame.paragraphs[0].add_run(),
        "Agile SDLC (~10 weeks): Foundation → Ingestion → AI Core → MVP → Validate",
        size=13,
        color=MUTED,
    )

    # Tech stack chips
    chips = [
        ("Next.js", NAVY),
        ("Express", NAVY),
        ("FastAPI", NAVY),
        ("MongoDB", NAVY),
        ("Docker", NAVY),
        ("SpaCy", TEAL),
        ("LangChain", TEAL),
        ("Tesseract", TEAL),
        ("Ollama", AMBER),
    ]
    x = 0.5
    for label, fill in chips:
        w = _chip(slide, x, 1.7, label, fill=fill)
        x += w + 0.18

    # Pipeline
    steps = [
        ("Upload /\nMOE import", NAVY),
        ("PDF /\nOCR", NAVY),
        ("Human\nreview", TEAL),
        ("SpaCy\nNER", NAVY),
        ("LLM map-\nreduce", NAVY),
        ("Date\nguardrails", TEAL),
        ("Structured\nsummary", NAVY),
    ]
    x0 = 0.5
    w = 1.5
    gap = 0.2
    y = 2.5
    h = 2.0
    for i, (label, color) in enumerate(steps):
        x = x0 + i * (w + gap)
        _round_rect(slide, x, y, w, h, color)
        tb = _textbox(slide, x + 0.08, y + 0.55, w - 0.16, 1.0)
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        _set_run(p.add_run(), label, size=12, bold=True, color=WHITE)
        if i < len(steps) - 1:
            ar = _textbox(slide, x + w - 0.02, y + 0.75, gap + 0.08, 0.4)
            ap = ar.text_frame.paragraphs[0]
            ap.alignment = PP_ALIGN.CENTER
            _set_run(ap.add_run(), "→", size=16, bold=True, color=AMBER)

    cap = _textbox(slide, 0.5, 4.75, 12.2, 1.5)
    ctf = cap.text_frame
    ctf.word_wrap = True
    _set_run(
        ctf.paragraphs[0].add_run(),
        "Pipeline: PDF/OCR → mandatory text review → NER → LLM summary → date/topic guardrails "
        "(TextRank fallback on failure). Content-hash cache ~114 ms. Teal steps = safety controls.",
        size=13,
        color=MUTED,
    )
    p2 = ctf.add_paragraph()
    p2.space_before = Pt(8)
    _set_run(
        p2.add_run(),
        "Stack: Next.js + TypeScript UI · Express.js + JWT API · FastAPI AI · MongoDB · Docker Compose",
        size=13,
        bold=True,
        color=NAVY,
    )

    _notes(
        slide,
        """[~75 seconds]
We followed an agile plan over about ten weeks across five phases.
Tech stack: Next.js and TypeScript on the frontend; Express.js with JWT for the API; FastAPI for the AI service; MongoDB for data; Docker Compose for deployment.
AI layer uses Tesseract OCR for Sinhala, English and Tamil, SpaCy for NER, LangChain map-reduce for summarisation, and optional local Ollama for privacy.
Pipeline: upload or MOE import; extract text; human review; NER; summarise; date guardrails; extractive fallback if needed.""",
    )


def slide_contribution(prs: Presentation):
    slide = _blank(prs)
    _content_chrome(slide, 6, "Key Contribution", "What is new beyond a generic chatbot")

    # Hero claim
    _round_rect(slide, 0.5, 1.3, 12.2, 1.1, NAVY)
    hero = _textbox(slide, 0.8, 1.5, 11.6, 0.75)
    hp = hero.text_frame.paragraphs[0]
    hp.alignment = PP_ALIGN.CENTER
    _set_run(
        hp.add_run(),
        "Guarded, review-first MOE circular pipeline",
        size=22,
        bold=True,
        color=WHITE,
        font="Georgia",
    )

    pillars = [
        ("Review gate", "Mandatory OCR/text confirmation before any AI summarisation runs.", TEAL),
        ("Date guardrails", "~15% of LLM outputs rejected for invented dates, then extractive fallback.", AMBER),
        ("Structured brief", "Purpose, audience, requirements, actions, dates + entity highlights. MOE import & export.", NAVY),
    ]
    for i, (title, body, accent) in enumerate(pillars):
        x = 0.5 + i * 4.15
        _card(slide, x, 2.7, 3.95, 3.55, accent=accent)
        # Number disc
        _oval(slide, x + 1.55, 2.95, 0.7, 0.7, accent)
        nt = _textbox(slide, x + 1.55, 3.05, 0.7, 0.5)
        np = nt.text_frame.paragraphs[0]
        np.alignment = PP_ALIGN.CENTER
        _set_run(np.add_run(), str(i + 1), size=18, bold=True, color=WHITE, font="Georgia")

        tt = _textbox(slide, x + 0.25, 3.85, 3.45, 0.5)
        tp = tt.text_frame.paragraphs[0]
        tp.alignment = PP_ALIGN.CENTER
        _set_run(tp.add_run(), title, size=16, bold=True, color=NAVY, font="Georgia")

        bt = _textbox(slide, x + 0.3, 4.5, 3.35, 1.5)
        btf = bt.text_frame
        btf.word_wrap = True
        bp = btf.paragraphs[0]
        bp.alignment = PP_ALIGN.CENTER
        _set_run(bp.add_run(), body, size=13, color=MUTED)

    _notes(
        slide,
        """[~45 seconds]
The contribution is not a general chatbot. It is a purpose-built, self-hostable pipeline for MOE circulars.
Two safety ideas matter most: users must approve extracted text before summarisation, and date guardrails catch invented deadlines, about fifteen percent of LLM summaries were rejected, then replaced by extractive fallback.
Outputs are structured for school staff, with entity highlights and practical import/export.""",
    )


def slide_evaluation(prs: Presentation):
    slide = _blank(prs)
    _content_chrome(slide, 7, "Evaluation & Test Results", "Survey, ROUGE, latency, and automated tests")

    tiles = [
        ("97.6%", "Survey n=41\nwant summaries\n78% entity useful", TEAL),
        ("0.414", "ROUGE-1 F1\nR-2 0.215 · R-L 0.292\n6 gold circulars", NAVY),
        ("~114ms", "Cached re-process\nExtract ~1.2s · OCR ~6.8s\nCold LLM 8–15s", AMBER),
        ("35/35", "App test suite\n+ 91/91 AI pytest\nBackend · UI · Functional", TEAL),
    ]
    for i, (big, detail, accent) in enumerate(tiles):
        x = 0.5 + i * 3.15
        _card(slide, x, 1.35, 3.0, 3.7, accent=accent)
        vt = _textbox(slide, x + 0.15, 1.7, 2.7, 0.85)
        vp = vt.text_frame.paragraphs[0]
        vp.alignment = PP_ALIGN.CENTER
        _set_run(vp.add_run(), big, size=28, bold=True, color=NAVY, font="Georgia")
        dt = _textbox(slide, x + 0.2, 2.7, 2.6, 2.0)
        dtf = dt.text_frame
        dtf.word_wrap = True
        dp = dtf.paragraphs[0]
        dp.alignment = PP_ALIGN.CENTER
        _set_run(dp.add_run(), detail, size=13, color=MUTED)

    # Caveat bar
    _round_rect(slide, 0.5, 5.3, 12.2, 1.3, CARD)
    _rect(slide, 0.5, 5.3, 0.12, 1.3, AMBER)
    cav = _textbox(slide, 0.85, 5.5, 11.6, 1.0)
    ctf = cav.text_frame
    ctf.word_wrap = True
    _set_run(ctf.paragraphs[0].add_run(), "Caveats", size=12, bold=True, color=AMBER)
    p2 = ctf.add_paragraph()
    _set_run(
        p2.add_run(),
        "ROUGE = n-gram overlap vs human briefs, not legal correctness. Formal school-staff UAT still pending. "
        "Backend 13/13 · Selenium UI 4/4 · Functional 10/10.",
        size=13,
        color=DARK,
    )

    _notes(
        slide,
        """[~75 seconds]
Evaluation has four strands.
Survey: 97.6% want summaries; 78% find entity highlighting and efficiency gains useful.
ROUGE on six gold circulars in fallback mode: R-1 0.414, R-2 0.215, R-L 0.292, useful as overlap evidence, not as legal proof.
Latency: digital extract about 1.2 seconds, OCR about 6.8, cold LLM 8 to 15 seconds, cached re-process about 114 milliseconds.
Automated tests: thirty-five of thirty-five in the conference suite, and ninety-one AI pytest cases. Formal school UAT remains future work.""",
    )


def slide_limitations(prs: Presentation):
    slide = _blank(prs)
    _content_chrome(slide, 8, "Limitations & Future Work", "Honest scope and next steps")

    # Left: limitations (amber tint)
    _round_rect(slide, 0.5, 1.3, 5.95, 4.55, AMBER_TINT)
    _rect(slide, 0.5, 1.3, 0.14, 4.55, AMBER)
    lt = _textbox(slide, 0.85, 1.5, 5.4, 0.4)
    _set_run(lt.text_frame.paragraphs[0].add_run(), "Limitations & challenges", size=16, bold=True, color=AMBER, font="Georgia")
    _bullets_in(
        slide,
        0.85,
        2.1,
        5.4,
        3.5,
        [
            "Full Sinhala/Tamil NER not yet available (English SpaCy primary)",
            "OCR quality varies on scanned Sinhala, mitigated by review",
            "Small ROUGE gold set (6); single-annotator briefs",
            "Formal school-staff UAT incomplete",
            "Guardrails reduce but do not eliminate hallucination",
        ],
        size=13,
    )

    # Right: future (teal tint)
    _round_rect(slide, 6.75, 1.3, 5.95, 4.55, TEAL_TINT)
    _rect(slide, 6.75, 1.3, 0.14, 4.55, TEAL)
    rt = _textbox(slide, 7.1, 1.5, 5.4, 0.4)
    _set_run(rt.text_frame.paragraphs[0].add_run(), "Future work", size=16, bold=True, color=TEAL, font="Georgia")
    _bullets_in(
        slide,
        7.1,
        2.1,
        5.4,
        3.5,
        [
            "Full SI/TA NER and bilingual UI",
            "Larger gold set + human rating rubrics",
            "Async job queue for long documents",
            "RBAC and admin analytics",
            "Production deploy / optional MOE portal integration",
        ],
        size=13,
    )

    # Closing line
    close = _textbox(slide, 0.5, 6.1, 12.2, 0.5)
    cp = close.text_frame.paragraphs[0]
    cp.alignment = PP_ALIGN.CENTER
    _set_run(
        cp.add_run(),
        "Thank you. Demonstration is in the accompanying video. Questions welcome.",
        size=14,
        bold=True,
        color=NAVY,
        font="Georgia",
    )

    _notes(
        slide,
        """[~45 seconds]
Limitations: bilingual NER is incomplete; OCR still needs humans; the ROUGE set is small; UAT with schools is pending; guardrails help but are not perfect.
Next: richer SI/TA NLP, larger evaluation, async processing, roles and analytics, and production deployment with possible MOE integration.
Thank you, happy to take questions. Demonstration is in the accompanying video.""",
    )


def main():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    slide_title(prs)
    slide_intro(prs)
    slide_objectives(prs)
    slide_literature(prs)
    slide_methodology(prs)
    slide_contribution(prs)
    slide_evaluation(prs)
    slide_limitations(prs)

    prs.save(OUT_FILE)
    print(f"Wrote {OUT_FILE}")


if __name__ == "__main__":
    main()
