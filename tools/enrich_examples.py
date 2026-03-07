#!/usr/bin/env python3
"""Fill Japanese example sentences and Chinese explanations for vocab JSON."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

JA_TEMPLATES = [
    "私は会話で「{ja}」という言葉を使いました。",
    "先生は授業で「{ja}」の使い方を説明しました。",
    "この文では「{ja}」が自然に使われています。",
    "日本語の勉強で「{ja}」はよく出てきます。"
]

ZH_TEMPLATES = [
    "我在对话里用了“{zh}（{ja}）”这个词。",
    "老师在课上讲解了“{zh}（{ja}）”的用法。",
    "这个句子里自然地使用了“{zh}（{ja}）”。",
    "学日语时，“{zh}（{ja}）”很常见。"
]


def should_replace(sentence_ja: str, sentence_zh: str) -> bool:
    ja = (sentence_ja or "").strip()
    zh = (sentence_zh or "").strip()
    if not ja or not zh:
        return True
    if "待补充" in zh:
        return True
    if ja.endswith("を勉強します。"):
        return True
    return False


def generate_pair(ja_word: str, zh_meaning: str) -> tuple[str, str]:
    idx = sum(ord(ch) for ch in ja_word) % len(JA_TEMPLATES)
    clean_zh = normalize_meaning(zh_meaning)
    ja_sentence = JA_TEMPLATES[idx].format(ja=ja_word)
    zh_sentence = ZH_TEMPLATES[idx].format(ja=ja_word, zh=clean_zh or "该词")
    return ja_sentence, zh_sentence


def normalize_meaning(meaning: str) -> str:
    text = (meaning or "").strip()
    if not text:
        return ""
    text = re.sub(r"[（(][^）)]*[）)]", "", text)
    text = re.sub(r"[①-⑳0-9]+", "", text)
    text = re.sub(r"【[^】]*】", "", text)
    text = re.sub(r"\s+", " ", text).strip(" ，,;；。")
    if len(text) > 28:
        text = text[:28].rstrip() + "…"
    return text


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Input vocab JSON path")
    parser.add_argument("--output", default="", help="Output JSON path (default: overwrite input)")
    parser.add_argument("--force", action="store_true", help="Force overwrite all example sentences")
    args = parser.parse_args()

    in_path = Path(args.input)
    out_path = Path(args.output) if args.output else in_path

    data = json.loads(in_path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("Input JSON must be a list.")

    updated = 0
    for row in data:
        if not isinstance(row, dict):
            continue
        ja_word = str(row.get("ja") or "").strip()
        zh_meaning = str(row.get("zh") or "").strip()
        if not ja_word:
            continue
        sentence_ja = str(row.get("sentenceJa") or "")
        sentence_zh = str(row.get("sentenceZh") or "")
        if args.force or should_replace(sentence_ja, sentence_zh):
            new_ja, new_zh = generate_pair(ja_word, zh_meaning)
            row["sentenceJa"] = new_ja
            row["sentenceZh"] = new_zh
            updated += 1

    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"done: total={len(data)}, updated={updated}, output={out_path}")


if __name__ == "__main__":
    main()
