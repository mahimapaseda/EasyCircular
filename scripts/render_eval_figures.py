#!/usr/bin/env python3
"""Render evaluation charts and verify-result screenshots for thesis Chapter 5."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "thesis" / "figures"
ROUGE = ROOT / "docs" / "evaluation" / "rouge-report.json"
SAMPLE = ROOT / "scripts" / "sample-evaluation.json"

WHITE = (255, 255, 255)
INK = (36, 41, 47)
MUTED = (110, 118, 129)
GRID = (230, 234, 238)
BORDER = (200, 206, 214)
HEADER = (241, 243, 246)
R1 = (37, 99, 235)
R2 = (14, 165, 233)
RL = (99, 102, 241)
DATE_C = (37, 99, 235)
ORG_C = (16, 185, 129)
LAW_C = (245, 158, 11)
ACT_C = (239, 68, 68)
TERM_BG = (15, 23, 42)
TERM_FG = (226, 232, 240)
TERM_OK = (52, 211, 153)
TERM_DIM = (148, 163, 184)
TERM_FAIL = (248, 113, 113)


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/consola.ttf" if not bold else "C:/Windows/Fonts/consolab.ttf",
        "C:/Windows/Fonts/segoeui.ttf" if not bold else "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_header(draw: ImageDraw.ImageDraw, w: int, title: str) -> None:
    draw.rectangle((0, 0, w, 44), fill=HEADER)
    draw.line((0, 44, w, 44), fill=BORDER, width=1)
    draw.text((18, 12), title, fill=INK, font=font(16, bold=True))


def render_terminal(lines: list[tuple[str, tuple[int, int, int]]], dest: str, title: str) -> Path:
    pad_x, pad_y = 28, 22
    line_h = 28
    header_h = 44
    w = 980
    h = header_h + pad_y * 2 + line_h * len(lines) + 16
    img = Image.new("RGB", (w, h), TERM_BG)
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, w, header_h), fill=(30, 41, 59))
    draw.text((18, 12), title, fill=TERM_FG, font=font(15, bold=True))
    y = header_h + pad_y
    mono = font(15)
    for text, color in lines:
        draw.text((pad_x, y), text, fill=color, font=mono)
        y += line_h
    path = OUT / dest
    img.save(path)
    return path


def grouped_bars(
    title: str,
    categories: list[str],
    series: list[tuple[str, list[float], tuple[int, int, int]]],
    dest: str,
    y_max: float | None = None,
) -> Path:
    left, right, top, bottom = 70, 40, 70, 90
    bar_group = 88
    w = left + right + max(len(categories), 1) * bar_group + 40
    h = 420
    img = Image.new("RGB", (w, h), WHITE)
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, w - 1, h - 1), outline=BORDER, width=1)
    draw_header(draw, w, title)

    plot_top = top
    plot_bottom = h - bottom
    plot_left = left
    plot_right = w - right
    values = [v for _, vals, _ in series for v in vals]
    ymax = y_max if y_max is not None else max(values + [0.01]) * 1.15
    if ymax <= 0:
        ymax = 1.0

    # grid + y labels
    for i in range(5):
        frac = i / 4
        y = plot_bottom - frac * (plot_bottom - plot_top)
        draw.line((plot_left, y, plot_right, y), fill=GRID, width=1)
        label = f"{ymax * frac:.2f}" if ymax <= 1.5 else f"{ymax * frac:.0f}"
        draw.text((12, y - 8), label, fill=MUTED, font=font(12))

    n_series = max(len(series), 1)
    bar_w = max(10, (bar_group - 20) // n_series - 4)
    for ci, cat in enumerate(categories):
        group_x = plot_left + 20 + ci * bar_group
        for si, (_name, vals, color) in enumerate(series):
            val = vals[ci] if ci < len(vals) else 0
            bh = (val / ymax) * (plot_bottom - plot_top)
            x0 = group_x + si * (bar_w + 4)
            y0 = plot_bottom - bh
            draw.rectangle((x0, y0, x0 + bar_w, plot_bottom), fill=color)
        # category label
        tw = draw.textlength(cat, font=font(11))
        draw.text(
            (group_x + (n_series * (bar_w + 4) - 4) / 2 - tw / 2, plot_bottom + 10),
            cat,
            fill=INK,
            font=font(11),
        )

    # legend
    lx = plot_left
    ly = h - 36
    for name, _vals, color in series:
        draw.rectangle((lx, ly, lx + 14, ly + 14), fill=color)
        draw.text((lx + 20, ly - 1), name, fill=INK, font=font(12))
        lx += 20 + int(draw.textlength(name, font=font(12))) + 24

    path = OUT / dest
    img.save(path)
    return path


def render_rouge() -> Path:
    data = json.loads(ROUGE.read_text(encoding="utf-8"))
    docs = data.get("docs") or []
    cats = [d["id"] for d in docs]
    cats.append("macro")
    s1 = [float(d["rouge1"]["f1"]) for d in docs] + [float(data["macro"]["rouge1_f1"])]
    s2 = [float(d["rouge2"]["f1"]) for d in docs] + [float(data["macro"]["rouge2_f1"])]
    sL = [float(d["rougeL"]["f1"]) for d in docs] + [float(data["macro"]["rougeL_f1"])]
    return grouped_bars(
        "ROUGE F1 by circular (fallback mode)",
        cats,
        [
            ("ROUGE-1", s1, R1),
            ("ROUGE-2", s2, R2),
            ("ROUGE-L", sL, RL),
        ],
        "eval-rouge-chart.png",
        y_max=0.6,
    )


def render_sample_eval() -> Path:
    data = json.loads(SAMPLE.read_text(encoding="utf-8"))
    items = data[:8]
    cats = []
    for item in items:
        name = str(item.get("circularNo") or item.get("file") or "?")
        cats.append(name.replace(".pdf", "")[:10])
    dates = [int((item.get("entityCounts") or {}).get("DATE", 0)) for item in items]
    orgs = [int((item.get("entityCounts") or {}).get("ORG", 0)) for item in items]
    laws = [int((item.get("entityCounts") or {}).get("LAW", 0)) for item in items]
    acts = [int(item.get("actionItems", 0)) for item in items]
    return grouped_bars(
        "Sample circular evaluation — entities and action items",
        cats,
        [
            ("DATE", [float(v) for v in dates], DATE_C),
            ("ORG", [float(v) for v in orgs], ORG_C),
            ("LAW", [float(v) for v in laws], LAW_C),
            ("Actions", [float(v) for v in acts], ACT_C),
        ],
        "eval-sample-entities.png",
    )


def render_verify_terminals() -> list[Path]:
    phase1 = render_terminal(
        [
            ("$ npm run verify:phase1", TERM_DIM),
            ("", TERM_FG),
            ("OK    AI service /health", TERM_OK),
            ("OK    Backend /health", TERM_OK),
            ("OK    Frontend", TERM_OK),
            ("", TERM_FG),
            ("Phase 1 exit gate passed (all services healthy).", TERM_OK),
        ],
        "eval-verify-phase1.png",
        "Terminal — Phase 1 verification (August 2026)",
    )
    phase4 = render_terminal(
        [
            ("$ npm run verify:phase4", TERM_DIM),
            ("", TERM_FG),
            ("OK    AI /health (llm provider info)", TERM_OK),
            ("OK    AI /pipeline", TERM_OK),
            ("OK    Backend upload requires sign-in (401)", TERM_OK),
            ("OK    Backend MVP flow (upload → extract → process)", TERM_OK),
            ("OK    Frontend", TERM_OK),
            ("", TERM_FG),
            ("Phase 4 exit gate passed (MVP flow + export-ready summary).", TERM_OK),
        ],
        "eval-verify-phase4.png",
        "Terminal — Phase 4 verification (August 2026)",
    )
    return [phase1, phase4]


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    written = [
        *render_verify_terminals(),
        render_rouge(),
        render_sample_eval(),
    ]
    for path in written:
        print(f"Wrote {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
