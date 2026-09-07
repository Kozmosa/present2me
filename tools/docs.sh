#!/usr/bin/env bash
# docs.sh — MkDocs 文档站（经 uvx 运行，依赖缓存于 ~/.cache/uv，仓库零污染）
# 用法:
#   tools/docs.sh serve [port]   开发预览（默认 8000，自动打开浏览器，改动热刷新）
#   tools/docs.sh build          构建静态站到 site/（已 gitignore）
#   tools/docs.sh open           构建并直接打开 site/index.html
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
MODE="${1:-serve}"

command -v uvx >/dev/null 2>&1 || {
  echo "需要 uvx（uv 工具）：brew install uv" >&2
  exit 1
}
RUN=(uvx --from mkdocs-material mkdocs)

case "$MODE" in
  serve)
    PORT="${2:-8000}"
    echo "文档站: http://127.0.0.1:$PORT （Ctrl-C 退出）"
    "${RUN[@]}" serve --dev-addr "127.0.0.1:$PORT" &
    PID=$!
    sleep 3
    open "http://127.0.0.1:$PORT" 2>/dev/null || true
    wait "$PID"
    ;;
  build)
    "${RUN[@]}" build
    echo "已构建: site/index.html"
    ;;
  open)
    "${RUN[@]}" build
    open site/index.html
    ;;
  *)
    sed -n '2,7p' "$0" >&2
    exit 2
    ;;
esac
