#!/usr/bin/env python3
"""Render print-friendly Selenium IDE screenshots for thesis section 4.7."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SIDE = ROOT / "docs" / "thesis" / "selenium" / "easycircular.side"
OUT = ROOT / "docs" / "thesis" / "figures"

BG = (255, 255, 255)
HEADER = (32, 92, 197)
HEADER_TEXT = (255, 255, 255)
SIDEBAR = (247, 249, 252)
BORDER = (210, 216, 224)
ROW_ALT = (245, 248, 252)
TEXT = (28, 32, 38)
MUTED = (110, 118, 130)
OK = (21, 128, 61)
OK_BG = (220, 252, 231)
CMD = (0, 92, 197)
SELECT = (227, 236, 250)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    names = (
        ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/segoeuib.ttf"),
        ("C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/arialbd.ttf"),
        ("segoeui.ttf", "segoeuib.ttf"),
    )
    for regular, bold_name in names:
        try:
            return ImageFont.truetype(bold_name if bold else regular, size)
        except OSError:
            continue
    return ImageFont.load_default()


def load_side() -> dict:
    return json.loads(SIDE.read_text(encoding="utf-8"))


def draw_chrome(draw: ImageDraw.ImageDraw, width: int, title: str) -> None:
    draw.rectangle((0, 0, width, 44), fill=HEADER)
    draw.text((18, 10), "Selenium IDE", fill=HEADER_TEXT, font=font(18, bold=True))
    tw = draw.textlength("Selenium IDE", font=font(18, bold=True))
    draw.text((18 + tw + 14, 13), title, fill=(210, 226, 255), font=font(14))


def render_suite(project: dict) -> Path:
    tests = project["tests"]
    suite = project["suites"][0]
    width, height = 1180, 520
    img = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(img)
    draw_chrome(draw, width, f"{project['name']}  ·  {project['url']}")
    draw.rectangle((0, 44, 320, height), fill=SIDEBAR)
    draw.line((320, 44, 320, height), fill=BORDER, width=1)
    draw.rectangle((0, 0, width - 1, height - 1), outline=BORDER, width=2)

    draw.text((18, 58), "TEST SUITES", fill=MUTED, font=font(12, bold=True))
    draw.rounded_rectangle((12, 82, 308, 118), radius=6, fill=SELECT)
    draw.text((24, 90), suite["name"], fill=TEXT, font=font(16, bold=True))
    draw.text((18, 136), "TESTS", fill=MUTED, font=font(12, bold=True))

    y = 158
    for i, test in enumerate(tests, start=1):
        draw.rounded_rectangle((12, y, 308, y + 52), radius=6, outline=BORDER, width=1)
        draw.text((24, y + 8), f"{i:02d}  {test['name']}", fill=TEXT, font=font(14, bold=True))
        n = len(test["commands"])
        draw.text((24, y + 28), f"{n} commands", fill=MUTED, font=font(12))
        y += 60

    draw.text((348, 62), "Critical path  (persist session)", fill=TEXT, font=font(18, bold=True))
    draw.text(
        (348, 94),
        "Sign in, upload a PDF, extract text, generate a summary, then reject a non-PDF.",
        fill=MUTED,
        font=font(14),
    )

    headers = ("#", "Test", "Commands", "Timeout")
    cols = (40, 420, 140, 120)
    x0, y0 = 348, 140
    x = x0
    for h, w in zip(headers, cols):
        draw.rectangle((x, y0, x + w, y0 + 32), fill=HEADER)
        draw.text((x + 10, y0 + 6), h, fill=HEADER_TEXT, font=font(13, bold=True))
        x += w

    y = y0 + 32
    for i, test in enumerate(tests, start=1):
        fill = ROW_ALT if i % 2 == 0 else BG
        draw.rectangle((x0, y, x0 + sum(cols), y + 40), fill=fill)
        vals = (str(i), test["name"], str(len(test["commands"])), "300 s")
        x = x0
        for val, w in zip(vals, cols):
            draw.text((x + 10, y + 10), val, fill=TEXT, font=font(14))
            x += w
        y += 40

    dest = OUT / "selenium-ide-suite.png"
    img.save(dest)
    return dest


def render_commands(project: dict) -> Path:
    test = next(t for t in project["tests"] if t["name"].startswith("TC-UI-03"))
    rows = test["commands"]
    width, row_h, top = 1180, 44, 132
    height = top + 48 + row_h * (len(rows) + 1) + 24
    img = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(img)
    draw_chrome(draw, width, f"{project['name']}  ·  {test['name']}")
    draw.rectangle((0, 0, width - 1, height - 1), outline=BORDER, width=2)

    draw.text((18, 58), test["name"], fill=TEXT, font=font(20, bold=True))
    draw.text(
        (18, 90),
        "Command table recorded against the live Extract text / Generate summary buttons.",
        fill=MUTED,
        font=font(14),
    )

    headers = ("#", "Command", "Target", "Value")
    cols = (50, 240, 520, 330)
    x0, y0 = 18, top
    x = x0
    for h, w in zip(headers, cols):
        draw.rectangle((x, y0, x + w, y0 + 36), fill=HEADER)
        draw.text((x + 10, y0 + 8), h, fill=HEADER_TEXT, font=font(13, bold=True))
        x += w

    y = y0 + 36
    for i, cmd in enumerate(rows, start=1):
        fill = SELECT if i == 3 else (ROW_ALT if i % 2 == 0 else BG)
        draw.rectangle((x0, y, x0 + sum(cols), y + row_h), fill=fill)
        vals = (str(i), cmd["command"], cmd["target"], cmd["value"] or "—")
        x = x0
        for j, (val, w) in enumerate(zip(vals, cols)):
            color = CMD if j == 1 else TEXT
            draw.text((x + 10, y + 12), val, fill=color, font=font(13, bold=(j == 1)))
            x += w
        y += row_h

    dest = OUT / "selenium-ide-commands.png"
    img.save(dest)
    return dest


def render_log(project: dict) -> Path:
    tests = project["tests"]
    width, height = 1180, 720
    img = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(img)
    draw_chrome(draw, width, "Run  ·  Critical path  ·  4 / 4 passed")
    draw.rectangle((0, 0, width - 1, height - 1), outline=BORDER, width=2)

    draw.rounded_rectangle((18, 58, 280, 98), radius=8, fill=OK_BG)
    draw.text((32, 68), "4 tests passed", fill=OK, font=font(16, bold=True))
    draw.text((300, 70), "Base URL  http://localhost:3002", fill=MUTED, font=font(14))

    y = 120
    step = 1
    for test in tests:
        draw.text((24, y), test["name"], fill=TEXT, font=font(16, bold=True))
        y += 28
        for cmd in test["commands"]:
            target = cmd["target"]
            if len(target) > 70:
                target = target[:67] + "..."
            line = f"{step:02d}  {cmd['command']}  {target}"
            value = cmd["value"]
            if value and cmd["target"] == "id=password":
                value = "********"
            if value:
                line += f"  →  {value}"
            draw.text((36, y), "OK", fill=OK, font=font(12, bold=True))
            draw.text((68, y), line, fill=TEXT, font=font(13))
            y += 22
            step += 1
        y += 10

    dest = OUT / "selenium-ide-log.png"
    img.save(dest)
    return dest


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    project = load_side()
    for path in (render_suite(project), render_commands(project), render_log(project)):
        print(f"Wrote {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
