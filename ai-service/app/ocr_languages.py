import os
import re
import shutil
import urllib.request
from pathlib import Path

DEFAULT_OCR_LANGUAGES = "sin+eng+tam"
TESSDATA_FAST_BASE = "https://github.com/tesseract-ocr/tessdata_fast/raw/main"
PROJECT_TESSDATA = Path(__file__).resolve().parent.parent / "tessdata"

WINDOWS_TESSDATA = Path(r"C:\Program Files\Tesseract-OCR\tessdata")

# MOE files are named like 29-2026-Si.pdf / 10-2026-En.pdf / 12-2024-Ta.pdf
_FILENAME_SI = re.compile(r"(?:^|[-_\s.])si(?:[-_\s.]|$)|sinhala", re.IGNORECASE)
_FILENAME_TA = re.compile(r"(?:^|[-_\s.])ta(?:[-_\s.]|$)|tamil", re.IGNORECASE)
_FILENAME_EN = re.compile(r"(?:^|[-_\s.])en(?:[-_\s.]|$)|english", re.IGNORECASE)


def _parse_lang_list(value: str | None) -> list[str]:
    parts = [part.strip() for part in (value or "").split("+") if part.strip()]
    return parts or ["eng"]


def filename_script_hint(filename: str | None) -> str | None:
    """Return 'sin', 'tam', or 'eng' from an MOE filename suffix, else None."""
    if not filename:
        return None
    stem = Path(filename).stem
    if _FILENAME_SI.search(stem):
        return "sin"
    if _FILENAME_TA.search(stem):
        return "tam"
    if _FILENAME_EN.search(stem):
        return "eng"
    return None


def infer_ocr_languages(filename: str | None = None) -> list[str]:
    """Prefer script packs implied by an official MOE filename suffix."""
    env_langs = _parse_lang_list(os.getenv("OCR_LANGUAGES", DEFAULT_OCR_LANGUAGES))
    hint = filename_script_hint(filename)
    if hint == "sin":
        return ["sin", "eng"]
    if hint == "tam":
        return ["tam", "eng"]
    if hint == "eng":
        return ["eng"]
    return env_langs


def _download_traineddata(lang: str, target_dir: Path) -> Path:
    target_dir.mkdir(parents=True, exist_ok=True)
    destination = target_dir / f"{lang}.traineddata"
    if destination.exists() and destination.stat().st_size > 0:
        return destination

    url = f"{TESSDATA_FAST_BASE}/{lang}.traineddata"
    urllib.request.urlretrieve(url, destination)
    return destination


def ensure_project_tessdata(languages: list[str]) -> Path | None:
    if not languages:
        return None

    PROJECT_TESSDATA.mkdir(parents=True, exist_ok=True)

    for lang in languages:
        project_file = PROJECT_TESSDATA / f"{lang}.traineddata"
        if project_file.exists() and project_file.stat().st_size > 0:
            continue

        if WINDOWS_TESSDATA.exists():
            system_file = WINDOWS_TESSDATA / f"{lang}.traineddata"
            if system_file.exists() and system_file.stat().st_size > 0:
                shutil.copy2(system_file, project_file)
                continue

        try:
            _download_traineddata(lang, PROJECT_TESSDATA)
        except Exception:
            continue

    if any(
        (PROJECT_TESSDATA / f"{lang}.traineddata").exists()
        and (PROJECT_TESSDATA / f"{lang}.traineddata").stat().st_size > 0
        for lang in languages
    ):
        return PROJECT_TESSDATA
    return None


def _tessdata_config(tessdata_dir: Path | None) -> str:
    if not tessdata_dir:
        return ""
    tess_path = str(tessdata_dir.resolve()).replace("\\", "/")
    return f"--tessdata-dir {tess_path}"


def _list_tesseract_languages(tessdata_dir: Path | None = None) -> set[str]:
    import pytesseract

    config = _tessdata_config(tessdata_dir)
    try:
        return set(pytesseract.get_languages(config=config))
    except Exception:
        return set()


def resolve_ocr_settings(filename: str | None = None) -> tuple[str, str | None]:
    requested_langs = infer_ocr_languages(filename)

    system_langs = _list_tesseract_languages()
    if all(lang in system_langs for lang in requested_langs):
        return "+".join(requested_langs), None

    project_dir = ensure_project_tessdata(requested_langs)
    if project_dir:
        project_langs = _list_tesseract_languages(project_dir)
        available = [lang for lang in requested_langs if lang in project_langs]
        if available:
            return "+".join(available), _tessdata_config(project_dir)

    fallback_chain = [
        [lang for lang in requested_langs if lang in system_langs],
        [lang for lang in ("sin", "tam", "eng") if lang in system_langs],
        [lang for lang in ("sin", "eng") if lang in system_langs],
        [lang for lang in ("tam", "eng") if lang in system_langs],
        ["eng"] if "eng" in system_langs else [],
    ]
    for available in fallback_chain:
        if available:
            return "+".join(available), None

    return "eng", None


def missing_ocr_languages(filename: str | None, used_lang: str | None) -> list[str]:
    requested = infer_ocr_languages(filename)
    used = {part.strip() for part in (used_lang or "").split("+") if part.strip()}
    return [lang for lang in requested if lang not in used]
