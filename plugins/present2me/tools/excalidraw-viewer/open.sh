#!/usr/bin/env bash
# open.sh — 用本地查看器打开 .excalidraw 文件（服务缺失时自动启动）
# 用法: tools/excalidraw-viewer/open.sh <file.excalidraw>   （支持服务根相对路径）
#       tools/excalidraw-viewer/open.sh --stop               停止后台服务
# 服务静态根默认为调用者 CWD（P2M_SERVE_ROOT 可覆盖）；查看器页面经 /viewer/ 前缀提供。
set -euo pipefail

# cd -P 解析软链，定位查看器真实目录
HERE="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$HERE/.." && pwd)"
PROJECT_ROOT="$(cd "$PLUGIN_ROOT/../.." && pwd)"
if command -v pixi >/dev/null 2>&1 && [[ -f "$PROJECT_ROOT/pixi.toml" ]]; then
  NODE_CMD=(pixi run --manifest-path "$PROJECT_ROOT/pixi.toml" node)
  PYTHON_CMD=(pixi run --manifest-path "$PROJECT_ROOT/pixi.toml" python)
else
  NODE_CMD=(node)
  PYTHON_CMD=(python3)
fi
SERVE_ROOT="${P2M_SERVE_ROOT:-$PWD}"
[[ -d "$SERVE_ROOT" ]] || { echo "服务根目录不存在: $SERVE_ROOT" >&2; exit 1; }
SERVE_ROOT="$(cd -P "$SERVE_ROOT" && pwd)"
PID_FILE="$HERE/.server.pid"
PORT_FILE="$HERE/.server.port"
VIEWER_PATH="/viewer/index.html"

# 健康且静态根一致才可复用（多工作区时 root 不匹配会自动另起端口）
healthy() {
  local resp
  resp="$(curl -sf -m 1 "http://127.0.0.1:$1/api/health" 2>/dev/null)" || return 1
  [[ "$resp" == *"\"root\":\"$SERVE_ROOT\""* ]]
}

if [[ "${1:-}" == "--stop" ]]; then
  if [[ -f "$PID_FILE" ]] && kill "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "查看器服务已停止"
  else
    echo "服务未在运行"
  fi
  rm -f "$PID_FILE" "$PORT_FILE"
  exit 0
fi

[[ $# -ge 1 ]] || { echo "用法: $0 <file.excalidraw> | --stop" >&2; exit 2; }
FILE="$1"
[[ -f "$FILE" ]] || FILE="$SERVE_ROOT/$FILE"
[[ -f "$FILE" ]] || { echo "找不到文件: $1" >&2; exit 1; }
FILE="$(cd "$(dirname "$FILE")" && pwd)/$(basename "$FILE")"
[[ "$FILE" == "$SERVE_ROOT"/* ]] || { echo "文件须位于服务根目录下: $SERVE_ROOT" >&2; exit 1; }

[[ -f "$HERE/viewer.js" ]] || {
  echo "查看器未构建：在本目录运行 npm install && npm run build（present2me 仓库内可 ./setup.sh；插件用户见 /p2m-setup）" >&2
  exit 1
}

# 复用健康服务；否则挑一个空闲端口启动
PORT=""
if [[ -f "$PORT_FILE" ]] && healthy "$(cat "$PORT_FILE")"; then
  PORT="$(cat "$PORT_FILE")"
else
  for CAND in 4173 4174 4175 4176 4180 4190; do
    if healthy "$CAND"; then PORT="$CAND"; break; fi
    P2M_SERVE_ROOT="$SERVE_ROOT" nohup "${NODE_CMD[@]}" "$HERE/server.mjs" "$CAND" >>"$HERE/.viewer.log" 2>&1 &
    echo $! >"$PID_FILE"; echo "$CAND" >"$PORT_FILE"
    for _ in $(seq 1 40); do healthy "$CAND" && break; sleep 0.25; done
    if healthy "$CAND"; then PORT="$CAND"; break; fi
  done
fi
[[ -n "$PORT" ]] || { echo "服务启动失败，详见 $HERE/.viewer.log" >&2; exit 1; }

REL="${FILE#"$SERVE_ROOT/"}"
ENC=$("${PYTHON_CMD[@]}" -c 'import sys,urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$REL")
URL="http://127.0.0.1:$PORT$VIEWER_PATH?file=$ENC"
open "$URL"
echo "已打开: $URL"
echo "服务 PID $(cat "$PID_FILE" 2>/dev/null || echo '?')；停止: $0 --stop"
