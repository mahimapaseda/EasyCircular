#!/usr/bin/env python3
"""Capture EasyCircular UI screenshots for the thesis figures.

Replaces the manual capture pass documented in screenshot/CAPTIONS.txt. It signs
a dedicated screenshot account in through the API, makes sure a fully processed
circular exists to photograph, then drives Chromium over the pages the thesis
references. Output filenames match the existing ones, so
scripts/extract_contextual_figures.py copies them into docs/thesis/figures/
without any mapping changes.

Captures are viewport-sized rather than full-page on purpose. Full-page mobile
captures ran to nearly 8000px tall, which Word scaled to about a metre high in
the thesis, and full-page desktop captures are too small to read once scaled to
a 14cm figure.

Prerequisites: MongoDB, the AI service (:5000), the backend (:4000) and the
frontend (:3002) all running - see scripts/start-local.ps1.

Usage:
    python scripts/capture_screenshots.py
    python scripts/capture_screenshots.py --keep-data   # leave the circular in place
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "screenshot"

API = "http://localhost:4000"
WEB = "http://localhost:3002"

# A dedicated account keeps the captures reproducible and avoids touching real data.
ACCOUNT = {
    "name": "EasyCircular Demo",
    "email": "screenshots@easycircular.local",
    "password": "Screenshots!2026",
    "jobRole": "principal",
    "district": "Colombo",
}

SAMPLE_PDFS = [
    ROOT / "sample circulars" / "15-2026-En.pdf",
    ROOT / "sample circulars" / "23-2026-En.pdf",
    ROOT / "sample circulars" / "44-2025-En.pdf",
    ROOT / "sample circulars" / "12-2026-En-1.pdf",
    ROOT / "sample circulars" / "10-2026-En.pdf",
    ROOT / "docs" / "sample-circulars" / "test-digital.pdf",
]

# How many PDFs to try before settling for a guardrail-rejected summary. Each
# attempt costs roughly 80 seconds of Ollama time.
MAX_CANDIDATES = 4

DESKTOP = {"width": 1440, "height": 900}
MOBILE = {"width": 390, "height": 844}

TOKEN_KEY = "easycircular_token"


def api(path: str, method: str = "GET", body: dict | None = None, token: str | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{API}{path}", data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            return json.loads(resp.read() or "{}")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        raise RuntimeError(f"{method} {path} -> {exc.code}: {detail}") from exc


def sign_in() -> str:
    """Register the screenshot account, falling back to login if it already exists."""
    try:
        return api("/api/auth/register", "POST", ACCOUNT)["token"]
    except RuntimeError as exc:
        if "409" not in str(exc):
            raise
    creds = {"email": ACCOUNT["email"], "password": ACCOUNT["password"]}
    return api("/api/auth/login", "POST", creds)["token"]


def upload_pdf(pdf: Path, token: str) -> str:
    """Multipart upload, hand-rolled to avoid adding a requests dependency."""
    boundary = "----EasyCircularScreenshotBoundary"
    head = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{pdf.name}"\r\n'
        "Content-Type: application/pdf\r\n\r\n"
    ).encode()
    payload = head + pdf.read_bytes() + f"\r\n--{boundary}--\r\n".encode()

    req = urllib.request.Request(f"{API}/api/circulars/upload", data=payload, method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=300) as resp:
        return json.loads(resp.read())["circularId"]


def list_circulars(token: str) -> list[dict]:
    return api("/api/circulars", token=token).get("items") or []


def get_circular(circular_id: str, token: str) -> dict:
    return api(f"/api/circulars/{circular_id}", token=token).get("circular") or {}


def reset_circulars(token: str) -> None:
    items = list_circulars(token)
    for item in items:
        api(f"/api/circulars/{item['id']}", "DELETE", token=token)
    if items:
        print(f"  cleared {len(items)} existing circular(s)")


def process_pdf(pdf: Path, token: str) -> dict:
    """Upload, extract and summarize one PDF; return the finished circular."""
    circular_id = upload_pdf(pdf, token)
    api(f"/api/circulars/{circular_id}/extract", "POST", {}, token)
    api(f"/api/circulars/{circular_id}/process", "POST", {}, token)

    for _ in range(60):
        state = get_circular(circular_id, token)
        if state.get("status") == "completed":
            return state
        if state.get("status") == "failed":
            raise RuntimeError(f"processing failed for {pdf.name}")
        time.sleep(5)
    raise RuntimeError(f"{pdf.name} did not finish in time")


def is_clean_llm(circular: dict) -> bool:
    """True when the LLM summary survived the date and language guardrails.

    A rejected summary renders a red "AI summary unavailable" banner, which
    misrepresents normal operation in a thesis figure, so a document whose
    summary passed is preferred as the subject of the summary screenshots.
    """
    meta = circular.get("processingMeta") or {}
    summary = circular.get("summary") or {}
    return not meta.get("llmError") and summary.get("mode") != "fallback"


def ensure_processed_circular(token: str) -> str:
    """Return the id of the best completed circular, preferring a clean summary."""
    completed = [c for c in list_circulars(token) if c.get("status") == "completed"]
    for item in completed:
        if is_clean_llm(get_circular(item["id"], token)):
            print(f"  reusing {item['originalFilename']} (clean LLM summary)")
            return item["id"]

    candidates = [p for p in SAMPLE_PDFS if p.exists()][:MAX_CANDIDATES]
    if not candidates and not completed:
        raise SystemExit(
            "No sample PDF found. Looked for:\n  "
            + "\n  ".join(str(p) for p in SAMPLE_PDFS)
        )

    fallbacks: list[dict] = []
    for pdf in candidates:
        print(f"  processing {pdf.name} ...", end=" ", flush=True)
        try:
            circular = process_pdf(pdf, token)
        except RuntimeError as exc:
            print(f"skipped ({exc})")
            continue

        entities = len(circular.get("entities") or [])
        sections = len(((circular.get("summary") or {}).get("sections")) or [])
        if is_clean_llm(circular):
            print(f"clean LLM summary, {sections} sections, {entities} entities")
            return circular["id"]
        reason = (circular.get("processingMeta") or {}).get("llmError") or "extractive"
        print(f"guardrail fallback ({reason})")
        fallbacks.append(circular)

    pool = fallbacks or [get_circular(c["id"], token) for c in completed]
    if not pool:
        raise SystemExit("Could not produce any completed circular")
    best = max(pool, key=lambda c: len(((c.get("summary") or {}).get("sections")) or []))
    print(
        "  ! no candidate passed the guardrails; using "
        f"{best.get('originalFilename')} with its extractive fallback"
    )
    return best["id"]


# Aligns a section's top edge with the viewport top. scroll_into_view_if_needed
# centres the element and leaves the neighbouring section bleeding into frame.
SCROLL_TO_TOP = """
selector => {
  const el = document.querySelector(selector);
  if (!el) return false;
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
  return true;
}
"""

# Page-space y of the summary body, used to frame the summary detail shot on the
# numbered sections and the action items panel beside them.
SUMMARY_BODY_TOP = """
() => {
  const el = document.querySelector('div.space-y-7');
  if (!el) return null;
  return Math.max(0, el.getBoundingClientRect().top + window.scrollY - 40);
}
"""

# Frames the expanded source-text panel, whose collapse button is the only
# stable handle on it.
SCROLL_TO_SOURCE_PANEL = """
() => {
  const btn = document.querySelector('[aria-label="Collapse source text"]');
  const panel = btn && btn.closest('.ws-panel');
  if (!panel) return;
  window.scrollTo(0, panel.getBoundingClientRect().top + window.scrollY - 16);
}
"""


def settle(page: Page, shot: dict) -> None:
    """Wait for the page to stop moving so captures are not caught mid-render."""
    page.wait_for_load_state("networkidle")
    if shot.get("wait_for"):
        page.wait_for_selector(shot["wait_for"], timeout=30_000)
    if shot.get("click"):
        page.locator(shot["click"]).first.click()
        page.wait_for_timeout(800)
    if shot.get("scroll_to"):
        if not page.evaluate(SCROLL_TO_TOP, shot["scroll_to"]):
            print(f"  ! {shot['file']}: {shot['scroll_to']} not found, capturing unscrolled")
    if shot.get("scroll_js"):
        page.evaluate(shot["scroll_js"])
    # Let Tailwind transitions and reveal-on-scroll animations finish
    page.wait_for_timeout(1500)


def capture(page: Page, shot: dict, path: Path) -> None:
    if shot.get("clip_from") == "summary_body":
        top = page.evaluate(SUMMARY_BODY_TOP)
        if top is not None:
            page.screenshot(
                path=str(path),
                full_page=True,
                clip={
                    "x": 0,
                    "y": top,
                    "width": shot["viewport"]["width"],
                    "height": shot["viewport"]["height"],
                },
            )
            return
        print(f"  ! {shot['file']}: summary body not found, capturing viewport")
    page.screenshot(path=str(path))


def build_shots(circular_id: str) -> list[dict]:
    circular_url = f"{WEB}/circular/{circular_id}"
    return [
        {
            "file": "01-dashboard.png",
            "url": WEB,
            "auth": False,
            "viewport": DESKTOP,
            "caption_en": "EasyCircular Dashboard (Landing / Home)",
            "caption_si": "EasyCircular Dashboard (ප්‍රධාන අතුරුමුහුණත)",
        },
        {
            "file": "02-document-upload.png",
            "url": f"{WEB}/#upload",
            "auth": True,
            "viewport": DESKTOP,
            "scroll_to": "#upload",
            "wait_for": "text=Drop PDF or browse",
            "caption_en": "Document Upload Interface",
            "caption_si": "චක්‍රලේඛය උඩුගත කරන තිරය",
        },
        {
            "file": "03-sign-in.png",
            "url": f"{WEB}/sign-in",
            "auth": False,
            "viewport": DESKTOP,
            "caption_en": "Sign-In Page",
            "caption_si": "පිවිසුම් තිරය",
        },
        {
            "file": "04-dashboard-signed-in.png",
            "url": WEB,
            "auth": True,
            "viewport": DESKTOP,
            "caption_en": "Dashboard (Signed In)",
            "caption_si": "පිවිසුණු පරිශීලක Dashboard",
        },
        {
            "file": "05-documents-list.png",
            "url": f"{WEB}/circulars",
            "auth": True,
            "viewport": DESKTOP,
            "caption_en": "Documents List / Workspace Dashboard",
            "caption_si": "ලේඛන ලැයිස්තුව / Workspace Dashboard",
        },
        {
            "file": "06-summary-interface.png",
            "url": circular_url,
            "auth": True,
            "viewport": DESKTOP,
            "wait_for": "text=COMPLETED",
            "caption_en": "Document Upload & Summary Interface",
            "caption_si": "චක්‍රලේඛය උඩුගත කරන සහ AI සාරාංශය පෙන්වන තිරය",
        },
        {
            "file": "07-ai-summary-detail.png",
            "url": circular_url,
            "auth": True,
            "viewport": DESKTOP,
            "wait_for": "text=Action items",
            # The collapsed source panel hides the NER highlights, which are the
            # point of this figure, so expand it and frame the panel.
            "click": '[aria-label="Expand source text"]',
            "scroll_js": SCROLL_TO_SOURCE_PANEL,
            "caption_en": "Entity Highlights (NER) over Source Text",
            "caption_si": "මූලාශ්‍ර පෙළ මත entity highlights (NER)",
        },
        {
            "file": "08-mobile-dashboard.png",
            "url": WEB,
            "auth": True,
            "viewport": MOBILE,
            "caption_en": "Mobile Dashboard",
            "caption_si": "ජංගම Dashboard",
        },
        {
            "file": "09-mobile-summary.png",
            "url": circular_url,
            "auth": True,
            "viewport": MOBILE,
            "caption_en": "Mobile Summary Interface",
            "caption_si": "ජංගම AI සාරාංශ තිරය",
        },
    ]


def write_captions(shots: list[dict]) -> None:
    lines = [
        "EasyCircular - System Screenshots (Thesis Figures)",
        f"Generated: {time.strftime('%Y-%m-%d')}",
        f"Source: live app at {WEB}",
        "Captured by: scripts/capture_screenshots.py",
        "",
    ]
    for shot in shots:
        lines += [
            shot["file"],
            f"  EN: {shot['caption_en']}",
            f"  SI: {shot['caption_si']}",
            "",
        ]
    (OUT_DIR / "CAPTIONS.txt").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--keep-data",
        action="store_true",
        help="Do not delete the circulars that were created for the captures",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete the screenshot account's existing circulars first, for a clean library view",
    )
    args = parser.parse_args()

    try:
        api("/health")
    except Exception:
        print(f"Backend not reachable at {API}. Start the stack first (scripts/start-local.ps1).")
        return 1

    print("Signing in...")
    token = sign_in()

    if args.reset:
        print("Clearing existing circulars...")
        reset_circulars(token)

    print("Preparing a processed circular...")
    before = {c["id"] for c in list_circulars(token)}
    circular_id = ensure_processed_circular(token)
    added = [c["id"] for c in list_circulars(token) if c["id"] not in before]

    shots = build_shots(circular_id)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Capturing screenshots...")
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        try:
            for shot in shots:
                context = browser.new_context(
                    viewport=shot["viewport"],
                    device_scale_factor=2,
                    is_mobile=shot["viewport"] is MOBILE,
                )
                if shot["auth"]:
                    context.add_init_script(
                        f"localStorage.setItem({TOKEN_KEY!r}, {token!r});"
                    )
                page = context.new_page()
                page.goto(shot["url"], wait_until="domcontentloaded")
                try:
                    settle(page, shot)
                except Exception as exc:
                    print(f"  ! {shot['file']}: {type(exc).__name__} while settling, capturing anyway")
                out = OUT_DIR / shot["file"]
                capture(page, shot, out)
                size = out.stat().st_size // 1024
                print(f"  {shot['file']:<28} {shot['viewport']['width']}x{shot['viewport']['height']}  {size} KB")
                context.close()
        finally:
            browser.close()

    write_captions(shots)
    print(f"Wrote {len(shots)} screenshots to {OUT_DIR}")

    if added and not args.keep_data:
        for cid in added:
            api(f"/api/circulars/{cid}", "DELETE", token=token)
        print(f"Removed {len(added)} circular(s) created for capture")

    print("\nNext: python scripts/extract_contextual_figures.py && python scripts/generate_thesis.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
