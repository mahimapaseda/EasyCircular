#!/usr/bin/env python3
"""Restructure thesis content to the university's Final Project Report format.

The guidelines require six chapters (Introduction, Market Research/Literature
Review, Artefact Design, Development & Testing, Evaluation, Conclusions &
Further Work) and state that the project plan must become the first appendix.
The existing content is a seven-chapter layout, so sections are redistributed
rather than rewritten.

Old chapter 4 (Methodology) splits: design sections go to the new chapter 3,
implementation sections to the new chapter 4. Old chapter 6 (Evaluations) also
splits: the testing sections join chapter 4, the acceptance and ethics sections
join chapter 5.

Bulk paragraphs are keyed by chapter file stem, so they are re-keyed alongside
their sections. The appendices are not bulk-merged by the generator, so the
project plan's bulk paragraphs are inlined into the appendix sections instead.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "docs" / "thesis" / "content"

SECTION_KEYS = ("paragraphs", "bullets", "numbered")

# new_file -> (chapter title, [(source_file, section_id, new_section_title)])
REMAP: dict[str, tuple[str, list[tuple[str, str, str]]]] = {
    "ch01_introduction.yaml": (
        "1. හැඳින්වීම (Introduction)",
        [
            ("ch01_intro.yaml", "aim", "1.1 අරමුණු සහ ඉලක්ක (Aims and Objectives)"),
            ("ch01_intro.yaml", "bg", "1.2 පසුබිම සහ සන්දර්භය (Background and Context)"),
            ("ch01_intro.yaml", "problem", "1.3 ගැටලුවට හැඳින්වීම (Introduction to Problem)"),
            ("ch01_intro.yaml", "scope", "1.4 ව්‍යාපෘතියට හැඳින්වීම (Introduction to Project)"),
            ("ch01_intro.yaml", "contribution", "1.5 නිපැයුමට හැඳින්වීම (Introduction to Artefact)"),
            ("ch01_intro.yaml", "structure", "1.6 වාර්තාවේ ව්‍යුහය (Structure of the Report)"),
        ],
    ),
    "ch02_literature.yaml": (
        "2. වෙළඳපොළ පර්යේෂණ සහ සාහිත්‍ය සමාලෝචනය (Market Research and Literature Review)",
        [
            ("ch02_literature.yaml", "nlp", "2.1 ස්වභාවික භාෂා සැකසුම (NLP) සහ Transformer ආකෘති"),
            ("ch02_literature.yaml", "sum", "2.2 සාරාංශකරණය (Summarization)"),
            ("ch02_literature.yaml", "ner", "2.3 නාමිත සංචිත හඳුනා ගැනීම (NER) සහ SpaCy"),
            ("ch02_literature.yaml", "rouge", "2.4 ROUGE මගින් තක්සේරුව"),
            ("ch02_literature.yaml", "compare", "2.5 EasyCircular, ChatGPT සහ නීතිමය ලේඛන AI මෙවලම් සංසන්ධනය"),
            ("ch02_literature.yaml", "survey", "2.6 ප්‍රාථමික වෙළඳපොළ පර්යේෂණ සමීක්ෂණය (n=41)"),
            ("ch02_literature.yaml", "gap", "2.7 පර්යේෂණ පරතරය (Research Gap)"),
        ],
    ),
    "ch03_design.yaml": (
        "3. නිපැයුම් නිර්මාණය (Artefact Design)",
        [
            ("ch04_methodology.yaml", "intro", "3.1 නිර්මාණ ක්‍රමවේදය හැඳින්වීම"),
            ("ch04_methodology.yaml", "req", "3.2 සමීක්ෂණ-පාදක අවශ්‍යතා"),
            ("ch04_methodology.yaml", "arch", "3.3 ත්‍රිස්ථර ගෘහනිර්මාණය (Architecture)"),
            ("ch04_methodology.yaml", "class_er", "3.4 Class diagram සහ ER / Data model"),
            ("ch04_methodology.yaml", "ui_design", "3.5 අතුරුමුහුණත් නිර්මාණය / Wireframes (UI design)"),
            ("ch04_methodology.yaml", "stack", "3.6 තාක්ෂණ තොගය"),
        ],
    ),
    "ch04_development.yaml": (
        "4. සංවර්ධනය සහ පරීක්ෂණය (Development and Testing)",
        [
            ("ch04_methodology.yaml", "pipeline", "4.1 PDF processing pipeline සහ Algorithm flowchart"),
            ("ch04_methodology.yaml", "ai", "4.2 NER සහ summarization ක්‍රියාත්මක කිරීම"),
            ("ch04_methodology.yaml", "security", "4.3 සත්‍යාපනය සහ ආරක්ෂාව ක්‍රියාත්මක කිරීම"),
            ("ch04_methodology.yaml", "risk_table", "4.4 සංවර්ධන අවදානම් අවම කිරීම"),
            ("ch04_methodology.yaml", "api", "4.5 API අන්ත ලක්ෂ්‍ය"),
            ("ch04_methodology.yaml", "ai_generated", "4.6 AI-generated content සහ code referencing"),
            ("ch06_evaluations.yaml", "auto", "4.7 ස්වයංක්‍රීය පරීක්ෂණ"),
            ("ch06_evaluations.yaml", "phase", "4.8 අදියර සත්‍යාපන scripts"),
            ("ch06_evaluations.yaml", "test_cases", "4.9 නියෝජිත පරීක්ෂණ අවස්ථා"),
        ],
    ),
    "ch05_evaluation.yaml": (
        "5. තක්සේරුව (Evaluation)",
        [
            ("ch05_results.yaml", "ops", "5.1 මෙහෙයුම් ප්‍රතිඵල"),
            ("ch05_results.yaml", "rouge_results", "5.2 ROUGE තක්සේරු ප්‍රතිඵල"),
            ("ch05_results.yaml", "sample_eval", "5.3 නියමු චක්‍රලේඛ තක්සේරුව"),
            ("ch05_results.yaml", "llm", "5.4 LLM සහ fallback මාදිලි සාකච්ඡාව"),
            ("ch06_evaluations.yaml", "uat", "5.5 UAT තත්ත්වය සහ ඉලක්ක සමඟ තක්සේරු සම්බන්ධය"),
            ("ch05_results.yaml", "ai_dev_results", "5.6 AI සහායක සංවර්ධනයේ ප්‍රතිඵල සහ සාකච්ඡාව"),
            ("ch06_evaluations.yaml", "ai_ethics", "5.7 AI සහායක සංවර්ධනයේ ආචාර ධාර්මික තක්සේරුව"),
        ],
    ),
    "ch06_conclusion.yaml": (
        "6. නිගමන සහ අනාගත කාර්යයන් (Conclusions and Further Work)",
        [
            ("ch07_conclusion.yaml", "summary", "6.1 සාරාංශය"),
            ("ch07_conclusion.yaml", "objectives", "6.2 ඉලක්ක සාක්ෂාත්කරණය"),
            ("ch07_conclusion.yaml", "limits", "6.3 සීමාවන්"),
            ("ch07_conclusion.yaml", "future", "6.4 අනාගත කාර්යයන් (Phase 6)"),
        ],
    ),
}

# Project plan becomes Appendix A; sub-sections render one level deeper.
PLAN_SECTIONS: list[tuple[str, str]] = [
    ("agile", "A.1 Agile SDLC තෝරා ගැනීමේ තාර්කිකත්වය"),
    ("phases", "A.2 පස්-අදියර ක්‍රියාත්මක කිරීමේ සැලැස්ම"),
    ("risks", "A.3 අවදානම් දළ විශ්ලේෂණය"),
    ("gates", "A.4 Phase exit gates (අදියර නික්මුම් ද්වාර)"),
    ("tools", "A.5 සංවර්ධන මෙවලම් සහ AI සහායක මෙවලම් භාවිතය"),
]

APPENDIX_A_INTRO = [
    "නිබන්ධන මාර්ගෝපදේශ අනුව ව්‍යාපෘති සැලසුම මුල් පරිශිෂ්ටය ලෙස ඉදිරිපත් කළ යුතුය. එබැවින් EasyCircular ව්‍යාපෘතියේ Agile ක්‍රමවේදය, පස්-අදියර ක්‍රියාත්මක කිරීමේ සැලැස්ම, අවදානම් විශ්ලේෂණය, අදියර නික්මුම් ද්වාර සහ භාවිත කළ සංවර්ධන මෙවලම් මෙම පරිශිෂ්ටයේ ලේඛනගත කර ඇත.",
    "මෙම සැලසුම ප්‍රධාන පරිච්ඡේදවල විස්තර කර ඇති නිර්මාණය, සංවර්ධනය සහ තක්සේරු කාර්යයන් සිදු කළ ආකාරය සඳහා පදනම සපයයි.",
]

# Table captions renumbered to follow the new chapter and appendix ordering.
CAPTIONS: dict[tuple[str, str], str] = {
    ("ch04_methodology.yaml", "stack"): "Table 3.1: EasyCircular technology stack",
    ("ch04_methodology.yaml", "risk_table"): "Table 4.1: සංවර්ධන අවදානම් සහ mitigation strategies",
    ("ch04_methodology.yaml", "api"): "Table 4.2: EasyCircular ප්‍රධාන API endpoints",
    ("ch04_methodology.yaml", "ai_generated"): "Table 4.3: AI-assisted code artefacts - reason, function සහ system design fit",
    ("ch06_evaluations.yaml", "test_cases"): "Table 4.4: System test cases (Expected vs Actual)",
    ("ch05_results.yaml", "rouge_results"): "Table 5.1: ROUGE evaluation results - sample MOE circulars",
    ("ch05_results.yaml", "sample_eval"): "Table 5.2: Sample circular processing evaluation",
    ("ch07_conclusion.yaml", "objectives"): "Table 6.1: Objectives achievement matrix",
}
PLAN_CAPTIONS: dict[str, str] = {
    "phases": "Table A.1: EasyCircular ක්‍රියාත්මක කිරීමේ අදියර",
    "gates": "Table A.2: Phase exit gate criteria",
}

# Existing appendices shift down one letter to make room for the project plan.
APPENDIX_RELETTER = {
    "Appendix A: Survey questions (12)": "Appendix B: Survey questions (12)",
    "Appendix B: Extended API endpoints": "Appendix C: Extended API endpoints",
    "Appendix C: A4 Project Poster": "Appendix D: A4 Project Poster",
    "Appendix D: AI-assisted code segments (full disclosure)": "Appendix E: AI-assisted code segments (full disclosure)",
}

OLD_CHAPTER_FILES = [
    "ch01_intro.yaml",
    "ch02_literature.yaml",
    "ch03_plan.yaml",
    "ch04_methodology.yaml",
    "ch05_results.yaml",
    "ch06_evaluations.yaml",
    "ch07_conclusion.yaml",
]

FIGURE_CHAPTERS = {
    "architecture": 3,
    "class_diagram": 3,
    "er_diagram": 3,
    "ui_signin": 3,
    "ui_dashboard": 3,
    "ui_upload": 3,
    "ui_summary_detail": 3,
    "algorithm_flowchart": 4,
    "ui_mobile": 5,
    "ui_mobile_summary": 5,
    "gantt": "A",
    "wbs": "A",
}


def load(name: str) -> dict[str, Any]:
    path = CONTENT / name
    if not path.exists():
        return {}
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def dump(name: str, data: dict[str, Any]) -> None:
    text = yaml.safe_dump(
        data, allow_unicode=True, sort_keys=False, default_flow_style=False, width=110
    )
    (CONTENT / name).write_text(text, encoding="utf-8")


def item_count(sections: list[dict]) -> int:
    return sum(len(s.get(k) or []) for s in sections for k in SECTION_KEYS)


def bulk_count(bulk: dict) -> int:
    return sum(
        len((body or {}).get(k) or [])
        for chapter in bulk.values()
        for body in (chapter or {}).values()
        for k in SECTION_KEYS
    )


def main() -> None:
    old_chapters = {name: load(name) for name in OLD_CHAPTER_FILES}
    bulk = load("bulk.yaml")
    supp = load("supplementary.yaml")
    figures = load("figures.yaml")

    index: dict[tuple[str, str], dict] = {}
    for name, data in old_chapters.items():
        for section in data.get("sections") or []:
            index[(name, section["id"])] = section

    before_sections = sum(len(d.get("sections") or []) for d in old_chapters.values())
    before_items = sum(item_count(d.get("sections") or []) for d in old_chapters.values())
    before_bulk = bulk_count(bulk)
    before_supp = len(supp.get("sections") or [])

    # Rebuild chapters
    new_bulk: dict[str, dict] = {}
    moved: set[tuple[str, str]] = set()

    for new_file, (title, entries) in REMAP.items():
        sections = []
        stem = new_file.replace(".yaml", "")
        chapter_bulk: dict[str, Any] = {}
        for src, sid, new_title in entries:
            key = (src, sid)
            if key not in index:
                raise SystemExit(f"Missing section {sid} in {src}")
            section = dict(index[key])
            moved.add(key)
            section["title"] = new_title
            caption = CAPTIONS.get(key)
            if caption:
                if section.get("table"):
                    section["table"] = dict(section["table"], caption=caption)
                elif section.get("table_caption"):
                    section["table_caption"] = caption
            sections.append(section)

            src_stem = src.replace(".yaml", "")
            entry = (bulk.get(src_stem) or {}).get(sid)
            if entry:
                chapter_bulk[sid] = entry
        if chapter_bulk:
            new_bulk[stem] = chapter_bulk
        dump(new_file, {"title": title, "sections": sections})

    # Project plan -> Appendix A, with its bulk paragraphs inlined because the
    # generator does not bulk-merge appendices.
    plan_bulk = bulk.get("ch03_plan") or {}
    appendix_a = [
        {
            "title": "Appendix A: ව්‍යාපෘති සැලසුම (Project Plan)",
            "id": "plan",
            "level": 2,
            "paragraphs": list(APPENDIX_A_INTRO),
            "bullets": [],
            "numbered": [],
            "figures": [],
        }
    ]
    for sid, new_title in PLAN_SECTIONS:
        key = ("ch03_plan.yaml", sid)
        if key not in index:
            raise SystemExit(f"Missing plan section {sid}")
        section = dict(index[key])
        moved.add(key)
        section["title"] = new_title
        section["level"] = 3
        extra = plan_bulk.get(sid) or {}
        for field in SECTION_KEYS:
            merged = list(section.get(field) or []) + list(extra.get(field) or [])
            section[field] = merged
        caption = PLAN_CAPTIONS.get(sid)
        if caption and section.get("table"):
            section["table"] = dict(section["table"], caption=caption)
        appendix_a.append(section)

    relettered = []
    for section in supp.get("sections") or []:
        section = dict(section)
        section["title"] = APPENDIX_RELETTER.get(section.get("title", ""), section["title"])
        if section.get("table_caption") == "Table B.1: Extended EasyCircular API endpoints":
            section["table_caption"] = "Table C.1: Extended EasyCircular API endpoints"
        if section.get("id") == "ai_code":
            section["paragraphs"] = [
                p.replace("D.", "E.") if p.startswith("D.") else p
                for p in section.get("paragraphs") or []
            ]
        relettered.append(section)

    dump("supplementary.yaml", {"title": "Appendices", "sections": appendix_a + relettered})
    dump("bulk.yaml", new_bulk)

    if figures.get("figures"):
        for fid, chapter in FIGURE_CHAPTERS.items():
            if fid in figures["figures"]:
                figures["figures"][fid]["chapter"] = chapter
        dump("figures.yaml", figures)

    # Every old section must have landed somewhere
    missing = set(index) - moved
    if missing:
        raise SystemExit(f"Sections not remapped: {sorted(missing)}")

    new_chapters = {name: load(name) for name in REMAP}
    after_sections = sum(len(d.get("sections") or []) for d in new_chapters.values())
    after_items = sum(item_count(d.get("sections") or []) for d in new_chapters.values())
    new_supp = load("supplementary.yaml")
    after_supp_items = item_count(new_supp.get("sections") or [])
    after_bulk = bulk_count(load("bulk.yaml"))

    plan_inlined = after_supp_items - item_count(supp.get("sections") or []) - len(APPENDIX_A_INTRO)

    print(f"sections: {before_sections} -> {after_sections} chapters + {len(appendix_a)} in Appendix A")
    print(f"chapter items: {before_items} -> {after_items} (+{plan_inlined} inlined into Appendix A)")
    print(f"bulk paragraphs: {before_bulk} -> {after_bulk}")
    print(f"appendix sections: {before_supp} -> {len(new_supp.get('sections') or [])}")

    accounted = after_items + plan_inlined
    if accounted != before_items + (before_bulk - after_bulk):
        raise SystemExit(
            f"Content loss: expected {before_items + (before_bulk - after_bulk)}, got {accounted}"
        )

    for name in OLD_CHAPTER_FILES:
        if name not in REMAP:
            (CONTENT / name).unlink(missing_ok=True)
            print(f"removed {name}")


if __name__ == "__main__":
    main()
