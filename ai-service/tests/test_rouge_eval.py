import importlib.util
from pathlib import Path


def _load_eval():
    path = Path(__file__).resolve().parents[2] / "scripts" / "evaluate_rouge.py"
    spec = importlib.util.spec_from_file_location("evaluate_rouge", path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_rouge_identical_strings_score_one():
    rouge = _load_eval()
    text = "Circular 15/2026 directs schools to observe Vesak Week."
    assert rouge.rouge_n(text, text, 1)["f1"] == 1.0
    assert rouge.rouge_n(text, text, 2)["f1"] == 1.0
    assert rouge.rouge_l(text, text)["f1"] == 1.0


def test_rouge_unrelated_strings_score_low():
    rouge = _load_eval()
    scores = rouge.rouge_n("apples and oranges", "vesak week programmes", 1)
    assert scores["f1"] < 0.2
