#!/usr/bin/env python3
"""Clean appendix YAML punctuation without em dashes; restore Google Form appendix B."""

from __future__ import annotations

import re
from pathlib import Path

import yaml

PATH = Path(__file__).resolve().parents[1] / "docs" / "thesis" / "content" / "supplementary.yaml"

A2_PARAGRAPHS = [
    "Table A.1 මගින් ක්‍රියාත්මක කිරීමේ අදියර පහ, ඒවායේ කාලසීමා, ප්‍රධාන ප්‍රතිඵල සහ නික්මුම් ද්වාර සාරාංශගත කර ඇත. කාලසටහන ව්‍යාපෘති ක්‍රියාත්මක කිරීමේ සැලැස්ම සහ contextual report හි පරිච්ඡේදය 3 සමඟ අනුකූල වේ.",
    "EasyCircular ක්‍රියාත්මක කිරීම පස්-අදියර සැලැස්මක් අනුගමනය කරයි. එක් එක් අදියරට නිශ්චිත බෙදාහැරීම්, කාල ඇස්තමේන්තු සහ පිටවීමේ නිර්ණායක නිර්වචනය කර ඇත. Phase 1 (Foundation, සතිය 1) මූලික යටිතල පහසුකම් ස්ථාපිත කරයි. Phase 2 (Ingestion, සති 2–3) PDF pipeline ගොඩනගයි. Phase 3 (AI Core, සති 4–6) NER සහ සාරාංශකරණය ක්‍රියාත්මක කරයි. Phase 4 (MVP, සතිය 7) ඒකාබද්ධ වෙබ් යෙදුම බෙදා හරියි. Phase 5 (Validate and Release, සති 8–10) පරීක්ෂණ සහ තක්සේරුව සිදු කරයි.",
    "Phase 1 (Foundation) බෙදාහැරීම් අතර ව්‍යාපෘති repository පිහිටුවීම, Docker Compose වින්‍යාසය (Next.js, Express, FastAPI, MongoDB), MongoDB schema නිර්මාණය, JWT සත්‍යාපනය, සියලු ස්ථරවල health checks සහ මූලික CI pipeline ඇතුළත් වේ. Phase 1 සත්‍යාපන script එක health endpoints පරීක්ෂා කර දත්ත සමුදා සම්බන්ධතාව තහවුරු කරයි.",
    "Phase 2 (Ingestion) බෙදාහැරීම් අතර PDF උඩුගත API, pdfplumber පෙළ නිස්සාරණය, PyMuPDF fallback, Tesseract OCR (sin+eng+tam), human-in-the-loop පෙළ සංස්කරණය සහ MongoDB හි නිස්සාරණ තත්ත්ව ලුහුබැඳීම ඇතුළත් වේ. විවිධ PDF වර්ග (ඩිජිටල් උපත, ස්කෑන්, මිශ්‍ර) සාර්ථකව නිස්සාරණය කළ හැකි බව මෙම අදියර සත්‍යාපනය කරයි.",
    "Phase 3 (AI Core) බෙදාහැරීම් අතර SpaCy NER, LangChain map-reduce සාරාංශකරණය, Ollama දේශීය LLM ඒකාබද්ධ කිරීම, දින guardrails සහ extractive fallback, ක්‍රියාකාරී අයිතම නිස්සාරණය, content-hash caching සහ AI සේවා ටෝකන් සත්‍යාපනය ඇතුළත් වේ. Guardrail හැසිරීම pytest කට්ටලයෙන් සත්‍යාපනය කෙරේ.",
    "Phase 4 (MVP) බෙදාහැරීම් අතර ඒකාබද්ධ වෙබ් යෙදුම, entity highlighting, සාරාංශ සහ ක්‍රියාකාරී අයිතම දර්ශනය, ජංගම-ප්‍රතිචාරී නිර්මාණය, අමාත්‍යාංශ කැටලොග් ආයාතය සහ rate limiting ඇතුළත් වේ. අන්තයේ සිට අන්තයට පරිශීලක ගමන් මාර්ගය මෙම අදියරින් පෙන්වයි.",
    "Phase 5 (Validate and Release) බෙදාහැරීම් අතර ROUGE තක්සේරුව (නියමු චක්‍රලේඛ 6ක්), AI සේවා pytest පරීක්ෂණ, backend පරීක්ෂණ, අදියර සත්‍යාපන scripts ලේඛනගත කිරීම, නිබන්ධන වාර්තා සම්පූර්ණ කිරීම සහ දන්නා සීමා ලේඛනගත කිරීම ඇතුළත් වේ. මෙම අදියර ශාස්ත්‍රීය ඉදිරිපත් කිරීම සඳහා ගුණාත්මක සාධක එකතු කරයි.",
    "අදියර යැපීම් ප්‍රධාන වශයෙන් අනුක්‍රමිකය. Phase 2 ට Phase 1 යටිතල පහසුකම් අවශ්‍ය වේ. Phase 3 ට Phase 2 නිස්සාරණ පෙළ අවශ්‍ය වේ. Phase 4 පළමු අදියර තුනේ සංරචක ඒකාබද්ධ කරයි. Phase 5 ක්‍රියාකාරී යෙදුම තක්සේරු කරයි. Agile ප්‍රවේශය යටතේ සුළු අතිච්ඡාදනයට ඉඩ ඇති නමුත් මුල් Phase 2 ප්‍රතිදාන Phase 3 සංවර්ධනයට මග පෙන්වයි.",
    "මෙම පරිශිෂ්ටයේ Gantt ප්‍රස්ථාරය කාලරේඛාව දෘශ්‍යව පෙන්වයි. එහි සමාන්තර කාර්ය, තීරණාත්මක මාර්ග යැපීම් සහ අදියර සන්ධිස්ථාන ඉස්මතු වේ. Work Breakdown Structure (WBS) ධුරාවලි කාර්ය විභේදනය සපයයි. මට්ටම 1 අදියර, මට්ටම 2 ප්‍රධාන බෙදාහැරීම් සහ මට්ටම 3 නිශ්චිත කාර්ය ලෙස ව්‍යුහගත කර ඇත.",
    "සැලසුම් කළ කාලරේඛාවට සාපේක්ෂව Phase 1 කාලසටහනට අනුව සම්පූර්ණ විය. Phase 2 හි සුළු ප්‍රමාදයක් ඇති විය (Tesseract සිංහල වින්‍යාසය). Phase 3 දිගු විය (guardrail පුනරාවර්තන). Phase 4 අපේක්ෂිතට වඩා සුමට විය. Phase 5 සංක්ෂිප්තව සම්පූර්ණ විය. සමස්තයෙන් සති 10ක ඉලක්කය ජය ගත්තේය.",
    "Phase 6 (අනාගත කාර්ය) අයිතම කල් දමා නමුත් ලේඛනගත කර ඇත. ඒවා අතර සිංහල/දෙමළ NER, ද්විභාෂික UI, async job queue, නිෂ්පාදන cloud යෙදවීම, විධිමත් UAT, admin dashboard සහ භූමිකා-පාදක ප්‍රවේශ පාලනය ඇතුළත් වේ. මෙම අයිතම ප්‍රමුඛතාගත backlog එකේ පවත්වා ගනියි.",
    "එක් එක් අදියර සම්පූර්ණ වීමේදී තාක්ෂණික ලේඛනගත කිරීම යාවත්කාලීන කරන ලදී. README උපදෙස් සහ Docker Compose වින්‍යාසය සත්‍යාපනය කෙරිණි. ලේඛනගත කිරීම ජීවමාන ලේඛනයක් ලෙස පවත්වා ගත් අතර වර්තමාන පද්ධති තත්ත්වය පිළිබිඹු කරයි.",
    "Phase 4 තීරණාත්මක ඒකාබද්ධ සන්ධිස්ථානයකි. එහිදී frontend, backend, AI සේවාව සහ MongoDB ප්‍රථම වරට සම්පූර්ණ කාර්යප්‍රවාහය ඒකාබද්ධ විය. CORS වින්‍යාසය, AI timeout සීරුමාරුව සහ හරස්-වේදිකා ගොනු මාර්ග ගැටලු මුල් අවස්ථාවේදීම නිවැරදි කෙරිණි.",
    "අදියර සංක්‍රමණය දිනදර්ශන-පාදක නොව බෙදාහැරීම්-පාදක වේ. නිර්ණායක සපුරාලීමෙන් පසුව පමණක් ඊළඟ අදියරට යන ලදී. එමඟින් අසම්පූර්ණ කාර්ය ඊළඟ අදියරට ගෙන යාම වළකින ලදී.",
    "Phase 3 සංවර්ධන සංකීර්ණතාව ඉහළම විය. NER, සාරාංශකරණය, guardrails, caching සහ fallback එකට ක්‍රියාත්මක කිරීමට සැලසුම් කළ කාලයට වඩා වැඩි කාලයක් ගත විය. දෛනික ප්‍රගති සමාලෝචනය සහ අවහිර කාර්ය හඳුනා ගැනීමෙන් මෙම අභියෝගය කළමනාකරණය කෙරිණි.",
    "අදියර යැපීම් න්‍යාසය අනුව Phase 2 නිස්සාරණ ප්‍රතිදානය Phase 3 NER ආදානය සපයයි. Phase 3 entity JSON Phase 4 frontend දර්ශනයට අවශ්‍ය වේ. නිස්සාරණ pipeline ප්‍රමාදය තීරණාත්මක මාර්ගයට බලපාන බැවින් එයට මුල් අවධානය යොමු කෙරිණි.",
    "සෑම අදියරකටම පැහැදිලි බෙදාහැරීමක් සහ නික්මුම් ද්වාරයක් තිබීමෙන් ප්‍රගතිය මැනිය හැකි විය. Foundation සිට Validate දක්වා ක්‍රමානුකූලව අවදානම අඩු කරන ලදී.",
    "Sprint පාදක ප්‍රවේශය supervisor ප්‍රතිචාර ඉක්මනින් ඒකාබද්ධ කිරීමට උපකාරී විය. LLM ගුණාත්මකභාවය අත්හදා බැලීමෙන් පසුව නිර්මාණ තීරණ පිරිපහදු කෙරිණි.",
    "Gantt සහ WBS මගින් කාල කළමනාකරණය සහ කාර්ය බෙදීම පැහැදිලි විය. තනි සංවර්ධක ව්‍යාපෘතියකදීත් මෙය ශාස්ත්‍රීය තක්සේරු සාධකයක් ලෙස වටිනා වේ.",
]

A2_TABLE = {
    "caption": "Table A.1. EasyCircular ක්‍රියාත්මක කිරීමේ අදියර",
    "headers": ["Phase", "Duration", "Key Outcome", "Exit Gate"],
    "rows": [
        ["Phase 1 (Foundation)", "Week 1", "Docker Compose stack healthy (Frontend 3002, Backend 4000, AI 5000, MongoDB 27017)", "Phase 1 verifier script passes"],
        ["Phase 2 (Ingestion)", "Weeks 2–3", "PDF upload, pdfplumber/PyMuPDF extraction, Tesseract OCR, text edit UI", "Sample PDF extract and edit save"],
        ["Phase 3 (AI Core)", "Weeks 4–6", "SpaCy NER, LangChain map-reduce summary, guardrails, cache", "Process endpoint returns entities and summary"],
        ["Phase 4 (MVP)", "Week 7", "JWT auth, rate limit, AI token, CI, mobile-responsive UI", "Phase 4 verifier script passes"],
        ["Phase 5 (Validate and Release)", "Weeks 8–10", "ROUGE eval, 91+ pytest, documentation, UAT plan", "Evaluation reports and thesis draft"],
    ],
}


def protect(text: str) -> tuple[str, list[str]]:
    saved: list[str] = []

    def store(m: re.Match[str]) -> str:
        saved.append(m.group(0))
        return f"__KEEP{len(saved) - 1}__"

    text = re.sub(r"https?://\S+", store, text)
    return text, saved


def restore(text: str, saved: list[str]) -> str:
    for i, value in enumerate(saved):
        text = text.replace(f"__KEEP{i}__", value)
    return text


def clean_text(text: str) -> str:
    if not isinstance(text, str):
        return text
    text = text.replace("\u2014", ".")
    if ":" not in text:
        return text
    text, saved = protect(text)
    reps = [
        (r"Appendix ([A-E]):", r"Appendix \1."),
        (r"Table ([A-Z]\.?[0-9]+):", r"Table \1."),
        (r"අවදානම (\d+):", r"අවදානම \1."),
        (r"E\.(\d+)\s*-\s*", r"E.\1. "),
        (r"අවමනය:", "අවමනය ලෙස"),
        (r"අවමන:", "අවමනය ලෙස"),
        (r"පරීක්ෂණ:", "පරීක්ෂණ ලෙස"),
        (r"බලපෑම:", "බලපෑම වශයෙන්"),
        (r"Prompt සාරය:", "Prompt සාරය."),
        (r"ශිෂ්‍ය වෙනස්කම්:", "ශිෂ්‍ය වෙනස්කම් අතර"),
        (r"Design fit:", "Design fit."),
        (r"ප්‍රකාශය:", "ප්‍රකාශය."),
        (r"සමීක්ෂණ උපකරණය:", "සමීක්ෂණ උපකරණය වන්නේ"),
        (r"Google Form URL:", "Google Form ලින්කුව"),
        (r"Poster අන්තර්ගතය:", "Poster අන්තර්ගතයට ඇතුළත් වන්නේ"),
        (r"Poster software:", "Poster software ලෙස"),
        (r"මෙසේය:", "මෙසේය."),
        (r"නිර්ණායක:", "නිර්ණායක අතර"),
        (r"බෙදාහැරීම්:", "බෙදාහැරීම් අතර"),
        (r"verify:phase", "verify-phase"),
        (r"npm run verify-phase1", "Phase 1 verifier script"),
        (r"npm run verify-phase4", "Phase 4 verifier script"),
        (r"llama3\.2:3b", "llama3.2 (3b)"),
        (r"\(w:cs\)", "(complex-script attribute)"),
        (r"Phase (\d):\s*([A-Za-z][A-Za-z /-]*)", r"Phase \1 (\2)"),
        (r"අදියර (\d) \(([^)]+)\):\s*", r"අදියර \1 (\2) යටතේ "),
    ]
    for pattern, repl in reps:
        text = re.sub(pattern, repl, text)
    text = re.sub(
        r"(?<=[A-Za-z0-9අ-ෆ)\]'\"])\s*:\s+(?=[A-Za-z0-9අ-ෆ'\"(])",
        ". ",
        text,
    )
    text = restore(text, saved)
    text = re.sub(r"\.\s*\.", ".", text)
    text = re.sub(r" {2,}", " ", text)
    return text


def walk(node):
    if isinstance(node, dict):
        return {k: walk(v) for k, v in node.items()}
    if isinstance(node, list):
        return [walk(x) for x in node]
    if isinstance(node, str):
        return clean_text(node)
    return node


def main() -> int:
    data = yaml.safe_load(PATH.read_text(encoding="utf-8"))
    for sec in data.get("sections") or []:
        if sec.get("id") == "phases":
            sec["paragraphs"] = list(A2_PARAGRAPHS)
            sec["table"] = A2_TABLE
            sec["figures"] = []
            sec["bullets"] = []
            sec["numbered"] = []
        if sec.get("id") == "survey_q":
            paras = sec.get("paragraphs") or []
            if not any("docs.google.com" in (p or "") for p in paras):
                sec["paragraphs"] = paras[:1] + [
                    "සමීක්ෂණ උපකරණය වන්නේ Survey on Improving Understanding of Educational Circulars using AI / AI භාවිතයෙන් අධ්‍යාපනික චක්‍රලේඛන (Circular) තේරුම් ගැනීම වර්ධනය කිරීම පිළිබඳ සමීක්ෂණය. Google Form ලින්කුව https://forms.gle/CKVzChn2JxaAiNpT8",
                    "පහත රූප මගින් සජීවී Google Form තිර රූප කොටස් වශයෙන් ඉදිරිපත් කෙරේ.",
                ] + paras[1:]
            sec["figures"] = [
                "survey_google_form_part1",
                "survey_google_form_part2",
                "survey_google_form_part3",
                "survey_google_form_part4",
                "survey_google_form_part5",
            ]
        if sec.get("id") == "gates" and isinstance(sec.get("table"), dict):
            rows = sec["table"].get("rows") or []
            for row in rows:
                if len(row) >= 2 and isinstance(row[1], str):
                    row[1] = row[1].replace("verify:phase", "verify-phase")
            sec["table"]["caption"] = clean_text(sec["table"].get("caption") or "")

    data = walk(data)
    PATH.write_text(
        yaml.dump(
            data,
            allow_unicode=True,
            sort_keys=False,
            width=100,
            default_flow_style=False,
        ),
        encoding="utf-8",
    )
    check = yaml.safe_load(PATH.read_text(encoding="utf-8"))
    text = PATH.read_text(encoding="utf-8")
    print(f"Wrote {PATH}")
    print(f"sections={len(check['sections'])} emdash={text.count(chr(0x2014))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
