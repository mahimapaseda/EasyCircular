#!/usr/bin/env python3
"""Render EasyCircular Gantt chart and refresh WBS figure for Appendix A."""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FIGURES = ROOT / "docs" / "thesis" / "figures"
SCREENSHOTS = ROOT / "screenshot"

# Week-based bars: (label, start_week_1based, end_week_inclusive, color)
PHASES = [
    ("Phase 1 — Foundation", 1, 1, (37, 99, 235)),
    ("Phase 2 — Ingestion", 2, 3, (8, 145, 178)),
    ("Phase 3 — AI Core", 4, 6, (124, 58, 237)),
    ("Phase 4 — MVP", 7, 7, (217, 119, 6)),
    ("Phase 5 — Validate & Release", 8, 10, (22, 163, 74)),
]

SPRINTS = [
    ("S0", 1, 1),
    ("S1", 2, 2),
    ("S2", 3, 3),
    ("S3", 4, 5),
    ("S4", 6, 6),
    ("S5", 7, 7),
    ("S6", 8, 8),
    ("S7", 9, 9),
    ("S8", 10, 10),
]


def _font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def render_gantt(out: Path) -> None:
    weeks = 10
    left = 280
    top = 90
    row_h = 42
    week_w = 72
    chart_h = len(PHASES) * row_h + 40
    width = left + weeks * week_w + 40
    height = top + chart_h + 100

    img = Image.new("RGB", (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    title_f = _font(22, bold=True)
    label_f = _font(14)
    small_f = _font(12)
    tiny_f = _font(11)

    draw.text((24, 20), "EasyCircular — Project Gantt Chart (10 weeks)", fill=(17, 24, 39), font=title_f)
    draw.text((24, 52), "Agile phases aligned to IMPLEMENTATION_PLAN.md", fill=(75, 85, 99), font=small_f)

    # Week headers
    for w in range(1, weeks + 1):
        x = left + (w - 1) * week_w
        draw.rectangle([x, top - 28, x + week_w, top], outline=(209, 213, 219), fill=(249, 250, 251))
        tw = draw.textlength(f"W{w}", font=small_f)
        draw.text((x + (week_w - tw) / 2, top - 24), f"W{w}", fill=(55, 65, 81), font=small_f)

    # Grid + phase bars
    for i, (label, start, end, color) in enumerate(PHASES):
        y = top + i * row_h
        draw.line([(left, y), (left + weeks * week_w, y)], fill=(229, 231, 235), width=1)
        draw.text((24, y + 12), label, fill=(31, 41, 55), font=label_f)
        x0 = left + (start - 1) * week_w + 4
        x1 = left + end * week_w - 4
        y0 = y + 8
        y1 = y + row_h - 8
        draw.rounded_rectangle([x0, y0, x1, y1], radius=6, fill=color)
        bar_label = f"Wk {start}" if start == end else f"Wk {start}–{end}"
        tw = draw.textlength(bar_label, font=tiny_f)
        if tw < (x1 - x0 - 8):
            draw.text((x0 + (x1 - x0 - tw) / 2, y0 + 6), bar_label, fill=(255, 255, 255), font=tiny_f)

    bottom = top + len(PHASES) * row_h
    draw.line([(left, bottom), (left + weeks * week_w, bottom)], fill=(156, 163, 175), width=1)
    draw.line([(left, top - 28), (left, bottom)], fill=(156, 163, 175), width=1)

    # Sprint lane
    sy = bottom + 24
    draw.text((24, sy), "Sprints", fill=(31, 41, 55), font=label_f)
    for name, start, end in SPRINTS:
        x0 = left + (start - 1) * week_w + 6
        x1 = left + end * week_w - 6
        draw.rounded_rectangle([x0, sy, x1, sy + 28], radius=4, outline=(107, 114, 128), fill=(243, 244, 246))
        tw = draw.textlength(name, font=tiny_f)
        draw.text((x0 + (x1 - x0 - tw) / 2, sy + 6), name, fill=(55, 65, 81), font=tiny_f)

    draw.text(
        (24, height - 28),
        "Source: EasyCircular IMPLEMENTATION_PLAN.md · single-developer thesis schedule",
        fill=(107, 114, 128),
        font=tiny_f,
    )
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, "PNG")
    print(f"Wrote {out}")


def refresh_wbs(out: Path) -> None:
    src = SCREENSHOTS / "wbs-mobile-workflow.png"
    if not src.exists():
        alt = FIGURES / "ui-wbs-mobile.png"
        if alt.exists():
            src = alt
        else:
            raise FileNotFoundError("WBS source image not found")
    shutil.copy2(src, out)
    print(f"Copied WBS -> {out}")


def main() -> int:
    FIGURES.mkdir(parents=True, exist_ok=True)
    render_gantt(FIGURES / "gantt.png")
    refresh_wbs(FIGURES / "wbs.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
