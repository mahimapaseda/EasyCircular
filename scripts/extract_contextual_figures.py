#!/usr/bin/env python3
"""Extract images from Contextual report.docx and copy UI screenshots into docs/thesis/figures/."""

from __future__ import annotations

import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "Contextual report.docx"
FIGURES = ROOT / "docs" / "thesis" / "figures"
SCREENSHOTS = ROOT / "screenshot"

# Contextual report media → thesis figure names (best-effort mapping from file order/size)
MEDIA_MAP = {
    "image1.png": "survey-role.png",
    "image3.png": "survey-frequency.png",
    "image4.png": "survey-difficulty.png",
    "image5.png": "survey-difficulties-bar.png",
    "image6.png": "survey-time.png",
    "image7.png": "survey-want-summary.png",
    "image8.png": "survey-ai-willingness.png",
    "image9.png": "survey-misunderstood.png",
    "image10.png": "survey-misunderstand-impact.png",
    "image11.png": "survey-highlight-entities.png",
    "image12.png": "survey-ai-concerns.png",
    "image13.png": "survey-efficiency.png",
    "image14.png": "gantt.png",
    "image15.png": "wbs.png",
    "image2.emf": "architecture.emf",
}

UI_MAP = {
    "01-dashboard.png": "ui-01-dashboard.png",
    "02-document-upload.png": "ui-02-upload.png",
    "03-sign-in.png": "ui-03-signin.png",
    "04-dashboard-signed-in.png": "ui-04-dashboard-auth.png",
    "05-documents-list.png": "ui-05-documents.png",
    "06-summary-interface.png": "ui-06-summary.png",
    "07-ai-summary-detail.png": "ui-07-summary-detail.png",
    "08-mobile-dashboard.png": "ui-08-mobile-dashboard.png",
    "09-mobile-summary.png": "ui-09-mobile-summary.png",
    "wbs-mobile-workflow.png": "ui-wbs-mobile.png",
}


def extract_docx_media() -> list[str]:
    if not DOCX.exists():
        print(f"Skip: {DOCX} not found")
        return []
    FIGURES.mkdir(parents=True, exist_ok=True)
    written: list[str] = []
    with zipfile.ZipFile(DOCX) as zf:
        for src, dest in MEDIA_MAP.items():
            path = f"word/media/{src}"
            if path not in zf.namelist():
                print(f"  missing {path}")
                continue
            out = FIGURES / dest
            out.write_bytes(zf.read(path))
            written.append(dest)
            print(f"  extracted {dest}")
    return written


def copy_screenshots() -> list[str]:
    FIGURES.mkdir(parents=True, exist_ok=True)
    copied: list[str] = []
    for src, dest in UI_MAP.items():
        src_path = SCREENSHOTS / src
        if not src_path.exists():
            print(f"  missing screenshot {src}")
            continue
        out = FIGURES / dest
        shutil.copy2(src_path, out)
        copied.append(dest)
        print(f"  copied {dest}")
    return copied


def main() -> int:
    print("Extracting contextual report figures...")
    docx_files = extract_docx_media()
    print("Copying UI screenshots...")
    ui_files = copy_screenshots()
    print(f"Done: {len(docx_files)} from docx, {len(ui_files)} from screenshot/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
