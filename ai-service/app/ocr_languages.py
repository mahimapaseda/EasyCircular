import os
import shutil
import urllib.request
from pathlib import Path

DEFAULT_OCR_LANGUAGES = "sin+eng+tam"
TESSDATA_FAST_BASE = "https://github.com/tesseract-ocr/tessdata_fast/raw/main"
PROJECT_TESSDATA = Path(__file__).resolve().parent.parent / "tessdata"

WINDOWS_TESSDATA = Path(r"C:\Program Files\Tesseract-OCR\tessdata")


def _download_traineddata(lang: str, target_dir: Path) -> Path:
    target_dir.mkdir(parents=True, exist_ok=True)
    destination = target_dir / f"{lang}.traineddata"
    if destination.exists():
        return destination

    url = f"{TESSDATA_FAST_BASE}/{lang}.traineddata"
    urllib.request.urlretrieve(url, destination)
    return destination


def _copy_if_missing(lang: str, source_dir: Path, target_dir: Path) -> None:
    source = source_dir / f"{lang}.traineddata"
    target = target_dir / f"{lang}.traineddata"
    if source.exists() and not target.exists():
        shutil.copy2(source, target)


def ensure_project_tessdata(languages: list[str]) -> Path | None:
    if not languages:
        return None

    PROJECT_TESSDATA.mkdir(parents=True, exist_ok=True)
    changed = False

    for lang in languages:
        project_file = PROJECT_TESSDATA / f"{lang}.traineddata"
        if project_file.exists():
            continue

        if WINDOWS_TESSDATA.exists():
            system_file = WINDOWS_TESSDATA / f"{lang}.traineddata"
            if system_file.exists():
                shutil.copy2(system_file, project_file)
                changed = True
                continue

        try:
            _download_traineddata(lang, PROJECT_TESSDATA)
            changed = True
        except Exception:
            return None

    if changed or all((PROJECT_TESSDATA / f"{lang}.traineddata").exists() for lang in languages):
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


def resolve_ocr_settings() -> tuple[str, str | None]:
    requested = os.getenv("OCR_LANGUAGES", DEFAULT_OCR_LANGUAGES)
    requested_langs = [part.strip() for part in requested.split("+") if part.strip()]

    if not requested_langs:
        requested_langs = ["eng"]

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
        [lang for lang in ("sin", "tam", "eng") if lang in system_langs],
        [lang for lang in ("sin", "eng") if lang in system_langs],
        [lang for lang in ("tam", "eng") if lang in system_langs],
        ["eng"] if "eng" in system_langs else [],
    ]
    for available in fallback_chain:
        if available:
            return "+".join(available), None

    return "eng", None
