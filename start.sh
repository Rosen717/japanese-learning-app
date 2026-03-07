#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

if [ -f .env ]; then
  # shellcheck disable=SC1091
  source .env
fi

if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "OPENAI_API_KEY 未设置。"
  echo "请先在 .env 写入：OPENAI_API_KEY=sk-..."
  exit 1
fi

PORT="${1:-8080}"
export OPENAI_API_KEY
exec python3 run_server.py --port "$PORT"
