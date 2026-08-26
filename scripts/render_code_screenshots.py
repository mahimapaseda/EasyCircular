#!/usr/bin/env python3
"""Render print-friendly code screenshots for thesis section 4.5."""

from __future__ import annotations

import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "thesis" / "figures"

BG = (255, 255, 255)
GUTTER = (245, 247, 250)
BORDER = (200, 206, 214)
HEADER_BG = (241, 243, 246)
LINE_FG = (140, 148, 160)
TEXT = (36, 41, 47)
KW = (0, 92, 197)
STR = (163, 21, 21)
CMT = (0, 128, 64)
DEC = (121, 94, 38)
NUM = (9, 134, 88)
FN = (111, 66, 193)

JS_KW = {
    "const", "let", "var", "function", "async", "await", "return", "if", "else",
    "try", "catch", "finally", "new", "typeof", "true", "false", "null",
    "undefined", "require", "module", "exports", "from",
}
PY_KW = {
    "def", "class", "return", "if", "elif", "else", "try", "except", "finally",
    "raise", "from", "import", "as", "None", "True", "False", "with", "for",
    "in", "not", "and", "or", "lambda",
}

TOKEN_RE = re.compile(
    r"(#.*$|//.*$|"
    r"'''(?:\\.|[^'\\])*'''|\"\"\"(?:\\.|[^\"\\])*\"\"\"|"
    r"'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"|"
    r"@\w+|"
    r"\b\d+(?:\.\d+)?\b|"
    r"\b[A-Za-z_]\w*\b|"
    r"\S|\s+)",
    re.MULTILINE,
)


def mono(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for name in (
        "C:/Windows/Fonts/consola.ttf",
        "C:/Windows/Fonts/CascadiaMono.ttf",
        "consola.ttf",
        "CascadiaMono.ttf",
        "DejaVuSansMono.ttf",
    ):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def token_color(token: str, lang: str) -> tuple[int, int, int]:
    stripped = token.strip()
    if stripped.startswith("#") or stripped.startswith("//"):
        return CMT
    if stripped.startswith("@"):
        return DEC
    if stripped[:1] in {"'", '"'} or stripped.startswith(("'''", '"""')):
        return STR
    if re.fullmatch(r"\d+(?:\.\d+)?", stripped):
        return NUM
    keywords = JS_KW if lang == "js" else PY_KW
    if stripped in keywords:
        return KW
    return TEXT


def highlight_line(line: str, lang: str) -> list[tuple[str, tuple[int, int, int]]]:
    parts: list[tuple[str, tuple[int, int, int]]] = []
    for token in TOKEN_RE.findall(line):
        color = token_color(token, lang)
        if lang == "js" and token in {"post", "get", "patch", "delete", "use"}:
            color = FN
        if lang == "py" and token in {"parse_pdf", "pipeline_endpoint", "router"}:
            color = FN
        parts.append((token, color))
    if not parts:
        parts.append(("", TEXT))
    return parts


def render_snippet(
    rel_path: str,
    start: int,
    end: int,
    lang: str,
    dest_name: str,
) -> Path:
    source = (ROOT / rel_path).read_text(encoding="utf-8").splitlines()
    lines = source[start - 1 : end]
    font = mono(18)
    header_font = mono(16)
    line_h = 26
    pad_x = 18
    gutter_w = 62
    header_h = 40
    width = 1180
    height = header_h + 16 + line_h * len(lines) + 16

    img = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, width, header_h), fill=HEADER_BG)
    draw.rectangle((0, header_h, gutter_w, height), fill=GUTTER)
    draw.rectangle((0, 0, width - 1, height - 1), outline=BORDER, width=2)
    draw.line((0, header_h, width, header_h), fill=BORDER, width=1)
    draw.line((gutter_w, header_h, gutter_w, height), fill=BORDER, width=1)
    label = f"{rel_path}  (lines {start}-{end})"
    draw.text((pad_x, 10), label, fill=TEXT, font=header_font)

    y = header_h + 10
    for i, line in enumerate(lines):
        lineno = start + i
        num = str(lineno)
        nw = draw.textlength(num, font=font)
        draw.text((gutter_w - 10 - nw, y), num, fill=LINE_FG, font=font)
        x = gutter_w + 12
        for token, color in highlight_line(line.replace("\t", "    "), lang):
            draw.text((x, y), token, fill=color, font=font)
            x += draw.textlength(token, font=font)
        y += line_h

    dest = OUT / dest_name
    img.save(dest)
    return dest


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    written = [
        render_snippet(
            "backend/src/routes/circulars.js",
            76,
            113,
            "js",
            "code-api-circulars.png",
        ),
        render_snippet(
            "backend/src/routes/circulars.js",
            247,
            268,
            "js",
            "code-api-process.png",
        ),
        render_snippet(
            "ai-service/app/routes_v1.py",
            36,
            83,
            "py",
            "code-api-fastapi.png",
        ),
        render_snippet(
            "scripts/verify-phase1.mjs",
            1,
            62,
            "js",
            "code-verify-phase1.png",
        ),
        render_snippet(
            "scripts/verify-phase4.mjs",
            141,
            251,
            "js",
            "code-verify-phase4.png",
        ),
        render_snippet(
            "backend/src/utils/pdf.js",
            1,
            43,
            "js",
            "code-tc-pdf-magic.png",
        ),
        render_snippet(
            "backend/test/pdf.test.js",
            1,
            28,
            "js",
            "code-tc-pdf-test.png",
        ),
        render_snippet(
            "ai-service/tests/test_guardrails.py",
            38,
            79,
            "py",
            "code-tc-date-guardrail.png",
        ),
    ]
    for path in written:
        print(f"Wrote {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
