#!/usr/bin/env python3
"""Capture Google Form and split into page-sized parts for Appendix B."""

from __future__ import annotations

from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
FIGURES = ROOT / "docs" / "thesis" / "figures"
FORM_URL = "https://forms.gle/CKVzChn2JxaAiNpT8"

# Thesis-friendly chunk height (approx. one page of image content)
CHUNK_HEIGHT = 1400
VIEWPORT = {"width": 1000, "height": 1400}


def split_image(src: Path, stem: str) -> list[Path]:
    img = Image.open(src).convert("RGB")
    w, h = img.size
    parts: list[Path] = []
    idx = 1
    y = 0
    while y < h:
        bottom = min(y + CHUNK_HEIGHT, h)
        # Avoid tiny leftover strip: merge into previous if < 200px
        if h - bottom < 200 and bottom < h:
            bottom = h
        crop = img.crop((0, y, w, bottom))
        out = FIGURES / f"{stem}-part{idx}.png"
        crop.save(out, "PNG", optimize=True)
        parts.append(out)
        print(f"  part {idx}: {out.name} ({crop.size[0]}x{crop.size[1]})")
        idx += 1
        y = bottom
    return parts


def main() -> int:
    FIGURES.mkdir(parents=True, exist_ok=True)
    full = FIGURES / "survey-google-form.png"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport=VIEWPORT)
        page.goto(FORM_URL, wait_until="networkidle", timeout=90000)
        page.wait_for_timeout(2500)
        page.screenshot(path=str(full), full_page=True)
        browser.close()

    print(f"Wrote full page {full} ({full.stat().st_size:,} bytes)")
    parts = split_image(full, "survey-google-form")

    # Also keep first viewport as "top" for convenience
    top = FIGURES / "survey-google-form-top.png"
    Image.open(full).convert("RGB").crop((0, 0, Image.open(full).width, min(CHUNK_HEIGHT, Image.open(full).height))).save(
        top, "PNG", optimize=True
    )
    print(f"Wrote {top.name}; total parts={len(parts)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
