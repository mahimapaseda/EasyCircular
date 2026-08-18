#!/usr/bin/env python3
"""4-bit QLoRA fine-tune of Llama-3.2-3B-Instruct for EasyCircular summaries.

Low-VRAM defaults (< 8 GB): seq=1024, r=8, batch=1, grad_accum=8, epochs=2.

Usage (from ai-service/, after building SFT JSONL):
    python training/finetune_qlora.py
    python training/finetune_qlora.py --seq-len 768 --lora-r 4   # if CUDA OOM
    python training/finetune_qlora.py --export-merged
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

TRAINING_DIR = Path(__file__).resolve().parent
AI_ROOT = TRAINING_DIR.parent
SFT_DIR = TRAINING_DIR / "sft"
LORA_DIR = TRAINING_DIR / "output" / "lora"
MERGED_DIR = TRAINING_DIR / "output" / "merged"

LLAMA32_CHAT = (
    "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n"
    "{system}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n"
    "{user}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n"
    "{assistant}<|eot_id|>"
)

TARGET_MODULES = (
    "q_proj",
    "k_proj",
    "v_proj",
    "o_proj",
    "gate_proj",
    "up_proj",
    "down_proj",
)


def _maybe_set_hf_home() -> None:
    if os.getenv("HF_HOME"):
        return
    ai_root = Path("G:/AI")
    if ai_root.exists():
        cache = ai_root / "hf-cache"
        cache.mkdir(parents=True, exist_ok=True)
        os.environ["HF_HOME"] = str(cache)


def load_jsonl(path: Path) -> list[dict]:
    rows = []
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def format_example(row: dict) -> str:
    user = row.get("input") or ""
    if user:
        user = f"Circular text:\n{user}"
    else:
        user = "Circular text: (empty)"
    return LLAMA32_CHAT.format(
        system=row.get("instruction") or "Return JSON only.",
        user=user,
        assistant=row.get("output") or "{}",
    )


def try_unsloth(args: argparse.Namespace, train_texts: list[str], eval_texts: list[str]) -> bool:
    try:
        from unsloth import FastLanguageModel
    except ImportError:
        print("Unsloth not installed — using PEFT + bitsandbytes fallback")
        return False

    print("Loading Unsloth 4-bit model:", args.model)
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.model,
        max_seq_length=args.seq_len,
        load_in_4bit=True,
        dtype=None,
    )
    model = FastLanguageModel.get_peft_model(
        model,
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=0.0,
        target_modules=list(TARGET_MODULES),
        bias="none",
        use_gradient_checkpointing="unsloth",
    )

    from datasets import Dataset
    from trl import SFTConfig, SFTTrainer

    train_ds = Dataset.from_dict({"text": train_texts})
    eval_ds = Dataset.from_dict({"text": eval_texts}) if eval_texts else None

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_ds,
        eval_dataset=eval_ds,
        args=SFTConfig(
            output_dir=str(LORA_DIR / "runs"),
            per_device_train_batch_size=1,
            gradient_accumulation_steps=args.grad_accum,
            num_train_epochs=args.epochs,
            learning_rate=2e-4,
            logging_steps=1,
            warmup_ratio=0.05,
            lr_scheduler_type="cosine",
            optim="adamw_8bit",
            fp16=True,
            bf16=False,
            seed=0,
            max_seq_length=args.seq_len,
            dataset_text_field="text",
            packing=False,
            report_to="none",
            save_strategy="epoch",
        ),
    )
    trainer.train()
    LORA_DIR.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(LORA_DIR))
    tokenizer.save_pretrained(str(LORA_DIR))
    print("Saved LoRA adapter to", LORA_DIR)

    if args.export_merged:
        MERGED_DIR.mkdir(parents=True, exist_ok=True)
        try:
            model.save_pretrained_merged(str(MERGED_DIR), tokenizer, save_method="merged_16bit")
            print("Saved merged 16-bit weights to", MERGED_DIR)
        except Exception as exc:  # noqa: BLE001
            print("Unsloth merge failed:", exc)
            return True
        try:
            gguf_dir = TRAINING_DIR / "output" / "gguf"
            gguf_dir.mkdir(parents=True, exist_ok=True)
            model.save_pretrained_gguf(str(gguf_dir), tokenizer, quantization_method="q4_k_m")
            print("Saved GGUF under", gguf_dir)
        except Exception as exc:  # noqa: BLE001
            print("Unsloth GGUF export failed (use publish-finetuned-ollama.ps1):", exc)
    return True


def train_peft(args: argparse.Namespace, train_texts: list[str], eval_texts: list[str]) -> None:
    import torch
    from datasets import Dataset
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        BitsAndBytesConfig,
        DataCollatorForLanguageModeling,
        Trainer,
        TrainingArguments,
    )

    bnb = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
        bnb_4bit_compute_dtype=torch.float16,
    )
    print("Loading 4-bit model:", args.fallback_model)
    try:
        tokenizer = AutoTokenizer.from_pretrained(args.fallback_model, use_fast=True)
    except Exception as exc:  # noqa: BLE001
        if "gated" in str(exc).lower() or "401" in str(exc):
            print(
                "Hugging Face rejected the Llama-3.2 download (gated model).\n"
                "1. Create a token at https://huggingface.co/settings/tokens\n"
                "2. Accept the license: https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct\n"
                "3. Run: .venv-train\\Scripts\\huggingface-cli.exe login\n"
                "4. Re-run: python training/finetune_qlora.py --seq-len 768 --lora-r 4 --export-merged"
            )
            raise SystemExit(2) from exc
        raise
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        args.fallback_model,
        quantization_config=bnb,
        device_map="auto",
    )
    model = prepare_model_for_kbit_training(model)
    model = get_peft_model(
        model,
        LoraConfig(
            r=args.lora_r,
            lora_alpha=args.lora_alpha,
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM",
            target_modules=list(TARGET_MODULES),
        ),
    )
    model.config.use_cache = False
    model.gradient_checkpointing_enable()

    def tokenize(batch: dict) -> dict:
        return tokenizer(
            batch["text"],
            truncation=True,
            max_length=args.seq_len,
            padding=False,
        )

    train_ds = Dataset.from_dict({"text": train_texts}).map(tokenize, batched=True, remove_columns=["text"])
    eval_ds = None
    if eval_texts:
        eval_ds = Dataset.from_dict({"text": eval_texts}).map(tokenize, batched=True, remove_columns=["text"])

    collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)
    args_out = TrainingArguments(
        output_dir=str(LORA_DIR / "runs"),
        per_device_train_batch_size=1,
        gradient_accumulation_steps=args.grad_accum,
        num_train_epochs=args.epochs,
        learning_rate=2e-4,
            logging_steps=1,
            warmup_steps=1,
            lr_scheduler_type="cosine",
            optim="paged_adamw_8bit",
        fp16=True,
        bf16=False,
        seed=0,
        report_to="none",
        save_strategy="epoch",
        gradient_checkpointing=True,
        dataloader_pin_memory=False,
        eval_strategy="no",
    )
    trainer = Trainer(
        model=model,
        args=args_out,
        train_dataset=train_ds,
        eval_dataset=eval_ds,
        data_collator=collator,
    )
    trainer.train()
    LORA_DIR.mkdir(parents=True, exist_ok=True)
    trainer.model.save_pretrained(str(LORA_DIR))
    tokenizer.save_pretrained(str(LORA_DIR))
    print("Saved LoRA adapter to", LORA_DIR)

    if args.export_merged:
        export_merged_cpu(args.fallback_model, LORA_DIR, MERGED_DIR)


def export_merged_cpu(base_model: str, lora_dir: Path, merged_dir: Path) -> None:
    import torch
    from peft import PeftModel
    from transformers import AutoModelForCausalLM, AutoTokenizer

    print("Merging LoRA on CPU into", merged_dir)
    tokenizer = AutoTokenizer.from_pretrained(lora_dir)
    base = AutoModelForCausalLM.from_pretrained(
        base_model,
        torch_dtype=torch.float16,
        device_map="cpu",
        low_cpu_mem_usage=True,
    )
    model = PeftModel.from_pretrained(base, str(lora_dir))
    merged = model.merge_and_unload()
    merged_dir.mkdir(parents=True, exist_ok=True)
    merged.save_pretrained(str(merged_dir), safe_serialization=True)
    tokenizer.save_pretrained(str(merged_dir))
    print("Saved merged weights to", merged_dir)


def main() -> int:
    parser = argparse.ArgumentParser(description="QLoRA fine-tune Llama-3.2-3B for MOE summaries")
    parser.add_argument("--model", default="unsloth/Llama-3.2-3B-Instruct-bnb-4bit")
    parser.add_argument("--fallback-model", default="unsloth/Llama-3.2-3B-Instruct")
    parser.add_argument("--seq-len", type=int, default=1024)
    parser.add_argument("--lora-r", type=int, default=8)
    parser.add_argument("--lora-alpha", type=int, default=16)
    parser.add_argument("--epochs", type=float, default=2.0)
    parser.add_argument("--grad-accum", type=int, default=8)
    parser.add_argument("--export-merged", action="store_true")
    parser.add_argument("--merge-only", action="store_true", help="Skip train; merge existing adapter on CPU")
    args = parser.parse_args()

    _maybe_set_hf_home()

    if args.merge_only:
        if not LORA_DIR.exists():
            print("No adapter at", LORA_DIR)
            return 1
        export_merged_cpu(args.fallback_model, LORA_DIR, MERGED_DIR)
        return 0

    train_path = SFT_DIR / "train.jsonl"
    eval_path = SFT_DIR / "eval.jsonl"
    if not train_path.exists():
        print("Missing", train_path, "— run python training/build_sft_dataset.py first")
        return 1

    train_texts = [format_example(row) for row in load_jsonl(train_path)]
    eval_texts = [format_example(row) for row in load_jsonl(eval_path)] if eval_path.exists() else []
    print(f"Train rows={len(train_texts)} eval rows={len(eval_texts)} seq={args.seq_len} r={args.lora_r}")

    if try_unsloth(args, train_texts, eval_texts):
        return 0
    train_peft(args, train_texts, eval_texts)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
