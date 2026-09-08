#!/usr/bin/env python3
"""Render a compact survey bar chart for the conference paper."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "conference" / "figures"

WHITE = (255, 255, 255)
INK = (36, 41, 47)
MUTED = (110, 118, 129)
GRID = (230, 234, 238)
BORDER = (200, 206, 214)
HEADER = (241, 243, 246)
BAR = (37, 99, 235)


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    names = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]
    for path in names:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    cats = [
        ("Want summary", 97.6),
        ("Entity highlight", 78.0),
        ("Efficiency gain", 78.0),
        ("Willing to use AI", 31.7),
        ("Privacy concern", 41.5),
    ]
    w, h = 920, 430
    left, right, top, bottom = 70, 36, 62, 78
    img = Image.new("RGB", (w, h), WHITE)
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, w - 1, h - 1), outline=BORDER, width=1)
    draw.rectangle((0, 0, w, 44), fill=HEADER)
    draw.text((18, 12), "Google Forms survey (n=41): key findings (%)", fill=INK, font=font(16, True))

    plot_top, plot_bottom = top, h - bottom
    plot_left, plot_right = left, w - right
    ymax = 100.0
    for i in range(5):
        frac = i / 4
        y = plot_bottom - frac * (plot_bottom - plot_top)
        draw.line((plot_left, y, plot_right, y), fill=GRID, width=1)
        draw.text((14, y - 8), f"{ymax * frac:.0f}", fill=MUTED, font=font(12))

    group = (plot_right - plot_left - 20) / len(cats)
    bar_w = int(group * 0.55)
    for i, (label, val) in enumerate(cats):
        x0 = int(plot_left + 24 + i * group)
        bh = (val / ymax) * (plot_bottom - plot_top)
        y0 = plot_bottom - bh
        draw.rectangle((x0, y0, x0 + bar_w, plot_bottom), fill=BAR)
        draw.text((x0 + bar_w / 2 - 14, y0 - 18), f"{val:.1f}", fill=INK, font=font(11, True))
        tw = draw.textlength(label, font=font(11))
        draw.text((x0 + bar_w / 2 - tw / 2, plot_bottom + 10), label, fill=INK, font=font(11))

    path = OUT / "survey-key-findings.png"
    img.save(path)
    print(f"Wrote {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
