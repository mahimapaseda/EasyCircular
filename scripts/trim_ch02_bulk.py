#!/usr/bin/env python3
"""Replace ch02_literature bulk with shorter Sinhala content for 8-10 page target."""

from __future__ import annotations

import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
BULK = ROOT / "docs/thesis/content/bulk.yaml"

# ~2 paragraphs per section → ~8-10 pages with core (~5) + bulk (~3-5)
NEW_CH02 = {
    "nlp": {
        "paragraphs": [
            "ස්වභාවික භාෂා සැකසුමේ ඉතිහාසය නීති-පාදක පද්ධතිවල සිට සංඛ්‍යානමය ආකෘති දක්වාත්, පසුව Transformer පූර්ව-පුහුණු ආකෘති දක්වාත් විකාශනය වී ඇත. Self-attention මගින් දිගු පෙළ තුළ යැපීම් ග්‍රහණය කිරීම පහසු වූ අතර, BERT සහ GPT වැනි ආකෘති NER සහ සාරාංශකරණය වැනි downstream කාර්යයන්ට fine-tune කිරීමට හැකි විය. EasyCircular මෙම ප්‍රගතිය ප්‍රායෝගිකව යොදා ගනිමින් SpaCy NER සහ Ollama LLM summarization ඒකාබද්ධ කරයි.",
            "සිංහල NLP සම්පත්-හිඟ තත්ත්වයේ පවතින බැවින්, Phase 5 හි ඉංග්‍රීසි NER ප්‍රමුඛ වන අතර සිංහල/දෙමළ සඳහා OCR සහ extractive fallback භාවිත වේ. මෙය අධ්‍යාපන අමාත්‍යාංශ ත්‍රිභාෂික ලේඛන සන්දර්භයට ගැලපෙන ප්‍රායෝගික තේරීමකි. සම්පූර්ණ බහුභාෂික NER Phase 6 අනාගත කාර්යයක් ලෙස හඳුනා ගැනේ.",
        ]
    },
    "sum": {
        "paragraphs": [
            "සාරාංශකරණය extractive සහ abstractive ලෙස ප්‍රධාන වශයෙන් බෙදේ. Extractive ක්‍රම මුල් වාක්‍ය තෝරා ගනිමින් කරුණු විශ්වාසනීයත්වය ආරක්ෂා කරන අතර, abstractive ක්‍රම කියවීමේ පහසුව වැඩි කරන නමුත් hallucination අවදානම වැඩි කරයි. EasyCircular hybrid ප්‍රවේශයක් භාවිත කර entity-anchored LLM summary සහ TextRank fallback ලබා දෙයි.",
            "දිගු චක්‍රලේඛ සඳහා map-reduce strategy එකක් භාවිත වේ: ලේඛනය කොටස් වලට බෙදා අර්ධ සාරාංශ ජනනය කර අවසානයේ ඒකාබද්ධ කරයි. Date guardrails මගින් මුල් පෙළේ නොමැති දින ඉවත් කර factual fidelity ආරක්ෂා කෙරේ.",
        ]
    },
    "ner": {
        "paragraphs": [
            "පරිපාලන ලේඛනවල NER මගින් දින, සංවිධාන සහ නීතිමය සම්බන්ධතා ස්වයංක්‍රීයව හඳුනා ගැනීම තීරණාත්මකය. SpaCy en_core_web_sm සහ custom EntityRuler patterns එකට යොදා EasyCircular DATE, ORG සහ LAW entities extract කරයි. Action items අනිවාර්ය වාක්‍ය heuristics මගින් වෙනම ලැයිස්තුවක ඉදිරිපත් කෙරේ.",
            "සමීක්ෂණයේ 78% respondents entity highlighting ප්‍රයෝජනවත් යැයි පැවසූ බැවින් NER ඉහළ ප්‍රමුඛතා අවශ්‍යතාවයක් ලෙස තහවුරු විය. සිංහල NER සීමාව අවංකව පිළිගෙන extractive සහාය සහ අනාගත multilingual models යෝජනා කෙරේ.",
        ]
    },
    "rouge": {
        "paragraphs": [
            "ROUGE මගින් ජනනය කළ සාරාංශය යොමු සාරාංශයට සාපේක්ෂව n-gram overlap මනියි. EasyCircular තක්සේරුවේදී චක්‍රලේඛ 6ක් සමඟ macro ROUGE-1 F1 අගය 0.414, ROUGE-2 F1 අගය 0.215 සහ ROUGE-L F1 අගය 0.292 ලැබුණි. මෙය extractive fallback මාදිලියේ reproducible baseline එකකි.",
            "ROUGE සීමාවන් තේරුම් ගත යුතුය: ඉහළ ලකුණු නීතිමය නිවැරදිබව සහතික නොකරයි. එබැවින් මෙම වාර්තාව ROUGE ප්‍රතිඵල automated evidence ලෙස පමණක් ඉදිරිපත් කරන අතර මානව සමාලෝචනය සහ UAT අනාගත අවශ්‍යතාවයක් ලෙස සටහන් කරයි.",
        ]
    },
    "compare": {
        "paragraphs": [
            "ChatGPT සහ Gemini වැනි සාමාන්‍ය මෙවලම් නම්‍යශීලී වුවද MOE circular domain සඳහා structured entities, local privacy සහ built-in guardrails ලබා නොදෙයි. Enterprise නීතිමය AI මෙවලම් මිල අධික වන අතර අධ්‍යාපන චක්‍රලේඛ සඳහා tune කර නොමැත.",
            "EasyCircular open-source, self-hostable stack එකකින් OCR, human-in-the-loop, NER සහ guarded summarization ඒකාබද්ධ කරන බැවින් ශ්‍රී ලංකා පාසල් සන්දර්භයට වඩා ගැලපේ. වගුව 2.1 මෙම වෙනස්කම් සංසන්දනය කරයි.",
        ]
    },
    "survey": {
        "paragraphs": [
            "Primary research Google Forms සමීක්ෂණය (n=41) ගුරුවරු 30, විදුහල්පතිවරු 8 සහ අධ්‍යාපන නිලධාරීන් 3 දෙනෙකුගෙන් සමන්විත විය. 97.6% සාරාංශයක් අවශ්‍ය බවත්, 78% entity highlighting ප්‍රයෝජනවත් බවත්, 68.3% AI භාවිතයට willing නොවන බවත් පෙන්වා දුන්නේය.",
            "ප්‍රධාන බාධක ලෙස ලේඛන දිග (21) සහ රහස්‍යතාව (17) හඳුනා ගන්නා ලදී. මෙම findings EasyCircular හි local Ollama option සහ human review step සඳහා සෘජු design justification ලබා දෙයි. සමීක්ෂණ ප්‍රස්ථාර පහත ඉදිරිපත් කෙරේ.",
        ]
    },
    "gap": {
        "paragraphs": [
            "සාහිත්‍යය සහ සමීක්ෂණය සංශ්ලේෂණය කිරීමෙන් පෙනී යන්නේ MOE circular domain සඳහා OCR, NER, guarded summarization සහ ව්‍යුහගත වෙබ් UI ඒකාබද්ධ කරන open-source පද්ධතියක් නොමැති බවයි. General LLMs සහ enterprise legal AI මෙවලම් මෙම පරතරය සම්පූර්ණයෙන් පුරවන්නේ නැත.",
            "EasyCircular මෙම පරතරයට ප්‍රතිචාර දක්වන working artefact එකක් ලෙස ඉදිරිපත් වන අතර, සිංහල NER සහ formal UAT තවමත් සීමාවන් ලෙස අවංකව පිළිගනියි. මීළඟ පරිච්ඡේදවල සැලසුම, ක්‍රියාත්මක කිරීම සහ තක්සේරුව මෙම gap closing ප්‍රවේශය විස්තර කරයි.",
        ]
    },
}


def main() -> None:
    text = BULK.read_text(encoding="utf-8")
    # Split around ch02_literature ... ch03_plan
    m = re.search(r"(?ms)^(ch02_literature:\n)(.*?)(?=^ch03_plan:)", text)
    if not m:
        raise SystemExit("ch02_literature block not found")
    # Build YAML fragment
    lines = ["ch02_literature:\n"]
    for sid, content in NEW_CH02.items():
        lines.append(f"  {sid}:\n")
        lines.append("    paragraphs:\n")
        for p in content["paragraphs"]:
            esc = p.replace("\\", "\\\\").replace('"', '\\"')
            lines.append(f'      - "{esc}"\n')
    new_block = "".join(lines) + "\n"
    text2 = text[: m.start()] + new_block + text[m.end() :]
    # validate
    data = yaml.safe_load(text2)
    ch2 = data["ch02_literature"]
    total = sum(len(p.split()) for c in ch2.values() for p in c["paragraphs"])
    BULK.write_text(text2, encoding="utf-8")
    print(f"Wrote ch02 bulk: {sum(len(c['paragraphs']) for c in ch2.values())} paras, ~{total} words")


if __name__ == "__main__":
    main()
