#!/usr/bin/env python3
"""Merge JLPT level map into imported vocab.

Input 1: base vocab JSON (list of entries from imported_vocab.json)
Input 2: jlpt map (JSON list or CSV) with at least: ja, jlpt
Optional in map: kana

Output: jlpt_vocab.json

Example:
  python3 tools/merge_jlpt_map.py \
    --base ./imported_vocab.json \
    --map ./jlpt_map.csv \
    --output ./jlpt_vocab.json
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

VALID = {"N5", "N4", "N3", "N2", "N1"}


def norm(s: object) -> str:
    return str(s or "").strip()


def normalize_level(v: object) -> str:
    text = norm(v).upper()
    for lv in VALID:
        if lv in text:
            return lv
    return ""


def load_map(path: Path) -> dict[tuple[str, str], str]:
    ext = path.suffix.lower()
    rows = []
    if ext == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, list):
            rows = [r for r in data if isinstance(r, dict)]
    elif ext in {".csv", ".tsv"}:
        delim = "\t" if ext == ".tsv" else ","
        with path.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f, delimiter=delim)
            rows = list(reader)
    else:
        raise ValueError("map file must be .json/.csv/.tsv")

    out: dict[tuple[str, str], str] = {}
    for r in rows:
        ja = norm(
            r.get("ja")
            or r.get("word")
            or r.get("Word")
            or r.get("japanese")
            or r.get("単語")
        )
        if not ja:
            continue
        kana = norm(r.get("kana") or r.get("reading") or r.get("Reading") or r.get("かな"))
        jlpt = normalize_level(
            r.get("jlpt")
            or r.get("level")
            or r.get("JLPT")
            or r.get("JLPTLevel")
        )
        if not jlpt:
            continue
        out[(ja, kana)] = jlpt
        if kana:
            out[(ja, "")] = jlpt
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True)
    parser.add_argument("--map", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    base_path = Path(args.base)
    map_path = Path(args.map)
    out_path = Path(args.output)

    base = json.loads(base_path.read_text(encoding="utf-8"))
    if not isinstance(base, list):
        raise ValueError("base JSON must be list")

    level_map = load_map(map_path)

    updated = 0
    for row in base:
        if not isinstance(row, dict):
            continue
        ja = norm(row.get("ja"))
        kana = norm(row.get("kana"))
        if not ja:
            continue
        lv = level_map.get((ja, kana)) or level_map.get((ja, ""))
        if lv:
            row["jlpt"] = lv
            updated += 1
        else:
            row["jlpt"] = "UNK"

    out_path.write_text(json.dumps(base, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"done: {len(base)} entries, leveled={updated}, output={out_path}")


if __name__ == "__main__":
    main()
