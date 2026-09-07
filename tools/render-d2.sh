#!/usr/bin/env bash
# render-d2.sh — 渲染 D2 图并打开给用户
# 用法:
#   tools/render-d2.sh <file.d2> [输出.svg]   渲染一次并打开
#   tools/render-d2.sh -w <file.d2>           实时预览（保存自动刷新）
#   tools/render-d2.sh --png <file.d2>        尝试输出 PNG
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WATCH=0
FORMAT=svg

usage() { sed -n '2,7p' "$0" >&2; exit 2; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    -w|--watch) WATCH=1; shift ;;
    --png) FORMAT=png; shift ;;
    -h|--help) usage ;;
    -*) echo "未知选项: $1" >&2; usage ;;
    *) break ;;
  esac
done

[[ $# -ge 1 ]] || usage
IN="$1"
if [[ ! -f "$IN" ]]; then
  # 支持仓库根相对路径
  if [[ -f "$REPO_ROOT/$IN" ]]; then IN="$REPO_ROOT/$IN"; else echo "找不到文件: $IN" >&2; exit 1; fi
fi
IN="$(cd "$(dirname "$IN")" && pwd)/$(basename "$IN")"

command -v d2 >/dev/null 2>&1 || {
  echo "d2 未安装。请在仓库根目录运行: ./setup.sh" >&2
  exit 1
}

cd "$(dirname "$IN")"
BASE="$(basename "$IN" .d2)"

if [[ $WATCH -eq 1 ]]; then
  PORT="${D2_PORT:-4199}"
  export HOST="${HOST:-127.0.0.1}"
  echo "实时预览: http://127.0.0.1:$PORT （Ctrl-C 退出）"
  d2 --watch --port "$PORT" "$IN" "${2:-$BASE.svg}" &
  D2PID=$!
  sleep 2
  open "http://127.0.0.1:$PORT" 2>/dev/null || true
  wait "$D2PID"
  exit 0
fi

OUT="${2:-$BASE.$FORMAT}"
if d2 "$IN" "$OUT"; then
  echo "已渲染: $OUT"
  open "$OUT" 2>/dev/null || echo "（自动打开失败，请手动查看）"
else
  echo "渲染失败（PNG 需要额外渲染器时请改用 SVG）" >&2
  exit 1
fi
