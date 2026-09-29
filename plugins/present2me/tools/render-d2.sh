#!/usr/bin/env bash
# render-d2.sh — 渲染 D2 图并打开给用户（p2m-server 瘦客户端）
# 用法:
#   tools/render-d2.sh <file.d2>              渲染 SVG 并打开（优先走 p2m-server）
#   tools/render-d2.sh <file.d2> <输出.svg>   指定输出路径（本地直跑，不经服务）
#   tools/render-d2.sh -w <file.d2>           实时预览（本地 d2 --watch，不经服务）
#   tools/render-d2.sh --png <file.d2>        输出 PNG（同样优先服务端）
# 服务未运行且无法拉起时自动降级为本地 pixi/d2 直跑；渲染报错（语法错）原样透传，
# 降级重跑也不会有不同结果，故不再回退。
set -euo pipefail

# 解析文件级软链（仓库根 tools/ 下的脚本是软链），得到插件真实根目录
SELF="${BASH_SOURCE[0]}"
while [ -L "$SELF" ]; do
  DIR="$(cd "$(dirname "$SELF")" && pwd)"
  SELF="$(readlink "$SELF")"
  case "$SELF" in /*) ;; *) SELF="$DIR/$SELF";; esac
done
PLUGIN_ROOT="$(cd -P "$(dirname "$SELF")/.." && pwd)"
PROJECT_ROOT="$(cd "$PLUGIN_ROOT/../.." && pwd)"
WATCH=0
FORMAT=svg
CUSTOM_OUT=0

usage() { sed -n '2,9p' "$0" >&2; exit 2; }

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
[[ $# -ge 2 ]] && CUSTOM_OUT=1
if [[ ! -f "$IN" ]]; then
  # 支持插件根相对路径
  if [[ -f "$PLUGIN_ROOT/$IN" ]]; then IN="$PLUGIN_ROOT/$IN"; else echo "找不到文件: $IN" >&2; exit 1; fi
fi
IN="$(cd "$(dirname "$IN")" && pwd)/$(basename "$IN")"

# ---- 本地直跑路径（watch / 自定义输出 / 服务降级共用）----
d2_cmd() {
  # PATH 优先（新版 d2 的 PNG 可用），pixi 兜底（其锁定的 0.7.1 driver 已下架）
  if command -v d2 >/dev/null 2>&1; then
    d2 "$@"
  elif command -v pixi >/dev/null 2>&1 && [[ -f "$PROJECT_ROOT/pixi.toml" ]]; then
    pixi run --manifest-path "$PROJECT_ROOT/pixi.toml" d2 "$@"
  else
    echo "d2 不可用：请先安装（brew install d2 或见 /p2m-setup）" >&2
    exit 1
  fi
}

render_local() {
  local out="$1"
  if d2_cmd "$IN" "$out"; then
    echo "已渲染（本地）: $out"
    open "$out" 2>/dev/null || echo "（自动打开失败，请手动查看）"
  else
    echo "渲染失败：按报错行列号修改 .d2 源文件后重试" >&2
    exit 1
  fi
}

# ---- 实时预览：本地直跑（服务端 watch 待 WebSocket 方案再议）----
if [[ $WATCH -eq 1 ]]; then
  PORT="${D2_PORT:-4199}"
  export HOST="${HOST:-127.0.0.1}"
  echo "实时预览: http://127.0.0.1:$PORT （Ctrl-C 退出）"
  d2_cmd --watch --port "$PORT" "$IN" "${2:-$(basename "$IN" .d2).svg}"
  exit 0
fi

# ---- 一次性渲染（svg/png）：优先 p2m-server ----
if [[ $CUSTOM_OUT -eq 0 ]]; then
  if PORT="$(bash "$PLUGIN_ROOT/tools/app/p2m.sh" ensure 2>/dev/null)"; then
    PAYLOAD="$(python3 -c 'import json,sys; print(json.dumps({"file": sys.argv[1], "format": sys.argv[2]}))' "$IN" "$FORMAT")"
    if RESP="$(curl -sf -m 90 -X POST -H 'Content-Type: application/json' -d "$PAYLOAD" "http://127.0.0.1:$PORT/render/d2")"; then
      OK="$(printf '%s' "$RESP" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("ok"))')"
      if [[ "$OK" == "True" ]]; then
        OUT="$(printf '%s' "$RESP" | python3 -c 'import json,sys; print(json.load(sys.stdin)["output"])')"
        URL="$(printf '%s' "$RESP" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("previewUrl") or "")')"
        echo "已渲染: $OUT"
        if [[ -n "$URL" ]]; then open "$URL" 2>/dev/null || true; fi
        [[ -n "$URL" ]] && echo "预览: $URL"
        exit 0
      fi
      printf '%s' "$RESP" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("error",""), file=sys.stderr)'
      echo "渲染失败：按报错行列号修改 .d2 源文件后重试" >&2
      exit 1
    fi
    echo "（p2m-server 响应异常，降级本地渲染）" >&2
  else
    echo "（p2m-server 不可用，降级本地渲染）" >&2
  fi
fi

cd "$(dirname "$IN")"
render_local "${2:-$(basename "$IN" .d2).$FORMAT}"
