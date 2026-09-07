#!/usr/bin/env bash
# open.sh — 用本地查看器打开 .excalidraw 文件（服务缺失时自动启动）
# 用法: tools/excalidraw-viewer/open.sh <file.excalidraw>   （支持仓库根相对路径）
#       tools/excalidraw-viewer/open.sh --stop               停止后台服务
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"
PID_FILE="$HERE/.server.pid"
PORT_FILE="$HERE/.server.port"
VIEWER_PATH="tools/excalidraw-viewer/index.html"

healthy() { curl -sf -m 1 "http://127.0.0.1:$1/api/health" >/dev/null 2>&1; }

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
[[ -f "$FILE" ]] || FILE="$REPO_ROOT/$FILE"
[[ -f "$FILE" ]] || { echo "找不到文件: $1" >&2; exit 1; }
FILE="$(cd "$(dirname "$FILE")" && pwd)/$(basename "$FILE")"

[[ -f "$HERE/viewer.js" ]] || { echo "查看器未构建，请在仓库根目录运行: ./setup.sh" >&2; exit 1; }

# 复用健康服务；否则挑一个空闲端口启动
PORT=""
if [[ -f "$PORT_FILE" ]] && healthy "$(cat "$PORT_FILE")"; then
  PORT="$(cat "$PORT_FILE")"
else
  for CAND in 4173 4174 4175 4176 4180 4190; do
    if healthy "$CAND"; then PORT="$CAND"; break; fi
    nohup node "$HERE/server.mjs" "$CAND" >>"$HERE/.viewer.log" 2>&1 &
    echo $! >"$PID_FILE"; echo "$CAND" >"$PORT_FILE"
    for _ in $(seq 1 40); do healthy "$CAND" && break; sleep 0.25; done
    if healthy "$CAND"; then PORT="$CAND"; break; fi
  done
fi
[[ -n "$PORT" ]] || { echo "服务启动失败，详见 $HERE/.viewer.log" >&2; exit 1; }

REL="${FILE#"$REPO_ROOT/"}"
ENC=$(python3 -c 'import sys,urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$REL")
URL="http://127.0.0.1:$PORT/$VIEWER_PATH?file=$ENC"
open "$URL"
echo "已打开: $URL"
echo "服务 PID $(cat "$PID_FILE" 2>/dev/null || echo '?')；停止: $0 --stop"
