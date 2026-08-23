#!/usr/bin/env python3
"""Generate methodology diagrams (architecture, class, ER, algorithm) as PNG for thesis."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / "docs" / "thesis" / "figures"
W, H = 1400, 900
BG = (255, 255, 255)
BOX = (230, 240, 250)
BORDER = (30, 60, 100)
TEXT = (20, 20, 20)
ARROW = (50, 50, 50)


def font(size: int = 18):
    for name in ("arial.ttf", "segoeui.ttf", "C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/segoeui.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def box(draw, xy, label, f, fill=BOX):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=10, fill=fill, outline=BORDER, width=2)
    # wrap simple
    lines = label.split("\n")
    ty = y1 + 12
    for line in lines:
        draw.text((x1 + 12, ty), line, fill=TEXT, font=f)
        ty += 22


def arrow(draw, a, b):
    draw.line([a, b], fill=ARROW, width=3)
    # simple arrow head
    x, y = b
    draw.polygon([(x, y), (x - 8, y - 6), (x - 8, y + 6)], fill=ARROW)


def make_architecture():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f = font(18)
    t = font(22)
    d.text((40, 20), "EasyCircular Three-Tier Architecture", fill=TEXT, font=t)
    box(d, (100, 80, 1300, 180), "Presentation Tier: Next.js Frontend (port 3002)\nDashboard | Upload | Text Review | Summary / Entity View", f)
    box(d, (100, 260, 1300, 380), "Application Tier: Express.js Backend (port 4000)\nJWT Auth | PDF Upload | REST API | Content-hash Cache | Rate Limit", f)
    box(d, (100, 460, 640, 620), "AI Tier: FastAPI (port 5000)\npdfplumber / PyMuPDF / Tesseract\nSpaCy NER | LangChain / Ollama", f)
    box(d, (760, 460, 1300, 620), "Data Tier: MongoDB (port 27017)\nusers | circulars | summaries | entities", f)
    arrow(d, (700, 180), (700, 260))
    arrow(d, (400, 380), (400, 460))
    arrow(d, (1000, 380), (1000, 460))
    d.text((40, 680), "Flow: Upload PDF -> Extract (+OCR) -> Human edit -> Process (NER+Summary) -> Display", fill=TEXT, font=f)
    img.save(OUT / "architecture.png")


def make_class():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f = font(16)
    t = font(22)
    d.text((40, 20), "EasyCircular Class / Domain Model (simplified)", fill=TEXT, font=t)
    boxes = [
        (80, 80, 420, 260, "User\n- id\n- email\n- passwordHash\n- role\n+ login()\n+ register()"),
        (500, 80, 900, 300, "Circular\n- id\n- userId\n- filename\n- status\n- extractedText\n- contentHash\n+ upload()\n+ extract()\n+ process()"),
        (980, 80, 1320, 260, "Summary\n- circularId\n- text\n- mode (llm/fallback)\n- actionItems[]"),
        (500, 360, 900, 560, "Entity\n- circularId\n- label (DATE/ORG/LAW)\n- text\n- start\n- end"),
        (80, 360, 420, 560, "AiServiceClient\n+ parsePdf()\n+ runPipeline()\n+ health()"),
    ]
    for b in boxes:
        box(d, b[:4], b[4], f)
    arrow(d, (420, 170), (500, 170))
    arrow(d, (900, 170), (980, 170))
    arrow(d, (700, 300), (700, 360))
    arrow(d, (420, 450), (500, 450))
    img.save(OUT / "class-diagram.png")


def make_er():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f = font(16)
    t = font(22)
    d.text((40, 20), "EasyCircular MongoDB Document Model (ER-style)", fill=TEXT, font=t)
    box(d, (120, 100, 480, 320), "users\n_id\nemail (unique)\npasswordHash\nname\ncreatedAt", f, fill=(255, 245, 230))
    box(d, (560, 100, 980, 360), "circulars\n_id\nuserId (FK)\noriginalName\nstoragePath\nstatus\nextractedText\neditedText\ncontentHash\nentities[]\nsummary\ncreatedAt", f, fill=(230, 255, 240))
    box(d, (1080, 140, 1340, 320), "entities[]\nlabel\ntext\nstart\nend", f, fill=(240, 230, 255))
    arrow(d, (480, 200), (560, 200))
    arrow(d, (980, 230), (1080, 230))
    d.text((120, 420), "1 User : N Circulars | 1 Circular embeds entities[] and summary object", fill=TEXT, font=f)
    img.save(OUT / "er-diagram.png")


def make_algorithm():
    img = Image.new("RGB", (900, 1200), BG)
    d = ImageDraw.Draw(img)
    f = font(16)
    t = font(20)
    d.text((30, 20), "Algorithm: Circular Processing Pipeline", fill=TEXT, font=t)
    steps = [
        (80, 70, "Start: User uploads MOE PDF"),
        (80, 160, "Extract text (pdfplumber)"),
        (80, 250, "Text density low? -> Tesseract OCR"),
        (80, 340, "Human-in-the-loop text edit"),
        (80, 430, "Compute content hash (SHA-256)"),
        (80, 520, "Cache hit? -> Return cached result"),
        (80, 610, "SpaCy NER + action items"),
        (80, 700, "LangChain / Ollama summarization"),
        (80, 790, "Guardrail: verify dates in source"),
        (80, 880, "Fail? -> Extractive TextRank fallback"),
        (80, 970, "Store MongoDB + display UI"),
        (80, 1060, "End"),
    ]
    for i, (x, y, label) in enumerate(steps):
        box(d, (x, y, 820, y + 60), label, f)
        if i < len(steps) - 1:
            arrow(d, (450, y + 60), (450, steps[i + 1][1]))
    img.save(OUT / "algorithm-flowchart.png")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    make_architecture()
    make_class()
    make_er()
    make_algorithm()
    print("Wrote architecture.png, class-diagram.png, er-diagram.png, algorithm-flowchart.png")


if __name__ == "__main__":
    main()
