#!/usr/bin/env python3
"""Convert merged HF weights to GGUF Q4_K_M for Ollama.

Looks for llama.cpp convert + quantize tools, or an Unsloth-exported GGUF.

Usage (from ai-service/):
    python training/export_gguf.py
    python training/export_gguf.py --out G:\\AI\\models\\easycircular-3b-q4_k_m.gguf
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

TRAINING_DIR = Path(__file__).resolve().parent
MERGED_DIR = TRAINING_DIR / "output" / "merged"
UNSLOTH_GGUF = TRAINING_DIR / "output" / "gguf"
DEFAULT_OUT = TRAINING_DIR / "output" / "easycircular-3b-q4_k_m.gguf"


def find_existing_gguf() -> Path | None:
    if UNSLOTH_GGUF.is_dir():
        matches = sorted(UNSLOTH_GGUF.glob("*.gguf"))
        if matches:
            return matches[-1]
    matches = sorted((TRAINING_DIR / "output").glob("*.gguf"))
    return matches[-1] if matches else None


def find_convert_script() -> Path | None:
    env = os.getenv("LLAMA_CPP_CONVERT")
    if env and Path(env).exists():
        return Path(env)
    candidates = [
        Path("G:/AI/llama.cpp/convert_hf_to_gguf.py"),
        Path("G:/AI/llama.cpp/convert-hf-to-gguf.py"),
        TRAINING_DIR / "llama.cpp" / "convert_hf_to_gguf.py",
    ]
    for path in candidates:
        if path.exists():
            return path
    return None


def find_quantize() -> Path | None:
    env = os.getenv("LLAMA_QUANTIZE")
    if env and Path(env).exists():
        return Path(env)
    names = ("llama-quantize.exe", "quantize.exe", "llama-quantize", "quantize")
    roots = [Path("G:/AI/llama.cpp"), Path("G:/AI/llama.cpp/build/bin"), Path("G:/AI/llama.cpp/build/bin/Release")]
    for root in roots:
        for name in names:
            path = root / name
            if path.exists():
                return path
    return None


def copy_gguf(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if src.resolve() != dest.resolve():
        shutil.copy2(src, dest)
    print("GGUF ready:", dest)


def main() -> int:
    parser = argparse.ArgumentParser(description="Export merged model to GGUF Q4_K_M")
    parser.add_argument("--merged", type=Path, default=MERGED_DIR)
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args()

    out = args.out
    if out is None:
        models = Path("G:/AI/models")
        out = models / "easycircular-3b-q4_k_m.gguf" if models.exists() else DEFAULT_OUT

    existing = find_existing_gguf()
    if existing:
        copy_gguf(existing, out)
        return 0

    if not args.merged.is_dir():
        print("Merged HF dir missing:", args.merged)
        print("Train with --export-merged or run: python training/finetune_qlora.py --merge-only")
        return 1

    convert = find_convert_script()
    if not convert:
        print("llama.cpp convert_hf_to_gguf.py not found.")
        print("Clone llama.cpp under G:\\AI\\llama.cpp or set LLAMA_CPP_CONVERT.")
        print("If Unsloth trained the adapter, re-run finetune_qlora.py --export-merged to emit GGUF.")
        return 1

    f16_path = args.merged.parent / "easycircular-3b-f16.gguf"
    print("Converting HF -> GGUF F16 via", convert)
    subprocess.check_call(
        [sys.executable, str(convert), str(args.merged), "--outfile", str(f16_path), "--outtype", "f16"]
    )

    quantize = find_quantize()
    if not quantize:
        print("F16 GGUF written to", f16_path, "but llama-quantize was not found.")
        copy_gguf(f16_path, out)
        print("Install llama.cpp quantize for Q4_K_M, or use this F16 file (much larger).")
        return 0

    out.parent.mkdir(parents=True, exist_ok=True)
    print("Quantizing to Q4_K_M ->", out)
    subprocess.check_call([str(quantize), str(f16_path), str(out), "Q4_K_M"])
    print("GGUF ready:", out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
