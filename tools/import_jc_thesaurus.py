#!/usr/bin/env python3
"""Convert Japanese-Chinese-thesaurus final.json into app vocab JSON.

Usage:
  python3 tools/import_jc_thesaurus.py \
    --input ./final.json \
    --output ./imported_vocab.json
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def norm_text(text: str) -> str:
    return re.sub(r"\s+", " ", str(text)).strip()


def guess_kana(value: object) -> str:
    if isinstance(value, dict):
        for key in ["kana", "reading", "hiragana", "pronunciation", "かな"]:
            v = value.get(key)
            if v:
                return norm_text(v)
    return ""


def guess_zh(value: object) -> str:
    if isinstance(value, dict):
        for key in ["zh", "chinese", "meaning", "definition", "释义", "中文", "translation"]:
            v = value.get(key)
            if v:
                return norm_text(v)
        # fallback: join short string fields
        candidates = []
        for v in value.values():
            if isinstance(v, str) and len(v) <= 80:
                candidates.append(norm_text(v))
        if candidates:
            return "；".join(dict.fromkeys(candidates))
    if isinstance(value, str):
        return norm_text(value)
    return ""


def guess_part(value: object) -> str:
    if isinstance(value, dict):
        for key in ["part", "pos", "词性", "part_of_speech"]:
            v = value.get(key)
            if v:
                return norm_text(v)
    return "未知"


def guess_example_ja(word: str, value: object) -> str:
    if isinstance(value, dict):
        for key in ["example", "exampleJa", "sentence", "例句"]:
            v = value.get(key)
            if v:
                return norm_text(v)
    return f"{word}を勉強します。"


def guess_example_zh(value: object) -> str:
    if isinstance(value, dict):
        for key in ["exampleZh", "example_zh", "例句翻译", "example_translation"]:
            v = value.get(key)
            if v:
                return norm_text(v)
    return "（例句翻译待补充）"


def as_items(raw: object) -> list[tuple[str, object]]:
    if isinstance(raw, dict):
        return [(norm_text(k), v) for k, v in raw.items() if norm_text(k)]
    if isinstance(raw, list):
        out = []
        for row in raw:
            if isinstance(row, dict):
                w = row.get("ja") or row.get("word") or row.get("japanese") or row.get("単語")
                if w:
                    out.append((norm_text(str(w)), row))
        return out
    return []


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to final.json")
    parser.add_argument("--output", required=True, help="Output JSON path")
    parser.add_argument("--default-jlpt", default="N5")
    args = parser.parse_args()

    src = Path(args.input)
    raw = json.loads(src.read_text(encoding="utf-8"))

    seen = set()
    result = []

    for i, (word, data) in enumerate(as_items(raw), start=1):
        if not word or word in seen:
            continue
        seen.add(word)

        entry = {
            "id": f"ext-{i:05d}",
            "ja": word,
            "kana": guess_kana(data),
            "romaji": "",
            "zh": guess_zh(data) or "（释义待补充）",
            "part": guess_part(data),
            "jlpt": args.default_jlpt,
            "sentenceJa": guess_example_ja(word, data),
            "sentenceZh": guess_example_zh(data),
        }
        result.append(entry)

    out = Path(args.output)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"converted: {len(result)} entries -> {out}")


if __name__ == "__main__":
    main()
