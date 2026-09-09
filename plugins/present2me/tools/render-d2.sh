#!/usr/bin/env bash
# render-d2.sh — 渲染 D2 图并打开给用户
# 用法:
#   tools/render-d2.sh <file.d2> [输出.svg]   渲染一次并打开
#   tools/render-d2.sh -w <file.d2>           实时预览（保存自动刷新）
#   tools/render-d2.sh --png <file.d2>        尝试输出 PNG
set -euo pipefail

# 解析文件级软链（仓库根 tools/ 下的脚本是软链），得到插件真实根目录
SELF="${BASH_SOURCE[0]}"
while [ -L "$SELF" ]; do
  DIR="$(cd "$(dirname "$SELF")" && pwd)"
  SELF="$(readlink "$SELF")"
  case "$SELF" in /*) ;; *) SELF="$DIR/$SELF";; esac
done
PLUGIN_ROOT="$(cd -P "$(dirname "$SELF")/.." && pwd)"
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
  # 支持插件根相对路径
  if [[ -f "$PLUGIN_ROOT/$IN" ]]; then IN="$PLUGIN_ROOT/$IN"; else echo "找不到文件: $IN" >&2; exit 1; fi
fi
IN="$(cd "$(dirname "$IN")" && pwd)/$(basename "$IN")"

if command -v pixi >/dev/null 2>&1 && [[ -f pixi.toml || -f ../pixi.toml ]]; then
  D2_CMD=(pixi run d2)
elif command -v d2 >/dev/null 2>&1; then
  D2_CMD=(d2)
else
  echo "d2 不可用：请先安装 pixi 并运行 ./setup.sh（插件用户见 /p2m-setup）" >&2
  exit 1
fi

cd "$(dirname "$IN")"
BASE="$(basename "$IN" .d2)"

if [[ $WATCH -eq 1 ]]; then
  PORT="${D2_PORT:-4199}"
  export HOST="${HOST:-127.0.0.1}"
  echo "实时预览: http://127.0.0.1:$PORT （Ctrl-C 退出）"
  "${D2_CMD[@]}" --watch --port "$PORT" "$IN" "${2:-$BASE.svg}" &
  D2PID=$!
  sleep 2
  open "http://127.0.0.1:$PORT" 2>/dev/null || true
  wait "$D2PID"
  exit 0
fi

OUT="${2:-$BASE.$FORMAT}"
if "${D2_CMD[@]}" "$IN" "$OUT"; then
  echo "已渲染: $OUT"
  open "$OUT" 2>/dev/null || echo "（自动打开失败，请手动查看）"
else
  echo "渲染失败：按报错行列号修改 .d2 源文件后重试" >&2
  exit 1
fi
