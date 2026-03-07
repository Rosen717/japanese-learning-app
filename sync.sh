#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "当前目录不是 Git 仓库。"
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" != "main" ]; then
  echo "当前分支是 $BRANCH，请先切到 main 再同步。"
  exit 1
fi

if [ -z "$(git status --porcelain)" ]; then
  echo "没有改动可同步。"
  exit 0
fi

MSG="${1:-sync: update $(date '+%Y-%m-%d %H:%M:%S')}"

git add .
git commit -m "$MSG"
git pull --rebase origin main
git push origin main

echo "已同步到线上（GitHub + Vercel 自动部署）"
