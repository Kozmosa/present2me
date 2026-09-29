#!/usr/bin/env bash
# open.sh — 用本地查看器打开 .excalidraw 文件（p2m-server 瘦客户端）
# 用法: tools/excalidraw-viewer/open.sh <file.excalidraw>
#       tools/excalidraw-viewer/open.sh --stop    停止后台服务
# 服务与端口由 tools/app/p2m.sh 统一管理；文件所在目录注册为允许根。
set -euo pipefail

# cd -P 解析软链，定位查看器真实目录；上两级才是插件根
HERE="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$HERE/../.." && pwd)"

if [[ "${1:-}" == "--stop" ]]; then
  bash "$PLUGIN_ROOT/tools/app/p2m.sh" stop
  exit 0
fi

[[ $# -ge 1 ]] || { echo "用法: $0 <file.excalidraw> | --stop" >&2; exit 2; }
FILE="$1"
if [[ ! -f "$FILE" ]]; then
  [[ -f "$PWD/$FILE" ]] && FILE="$PWD/$FILE" || { echo "找不到文件: $1" >&2; exit 1; }
fi
FILE="$(cd "$(dirname "$FILE")" && pwd)/$(basename "$FILE")"
ROOT="$(cd "$(dirname "$FILE")" && pwd)"

[[ -f "$HERE/viewer.js" ]] || {
  echo "查看器未构建：在本目录运行 npm install && npm run build（present2me 仓库内可 ./setup.sh；插件用户见 /p2m-setup）" >&2
  exit 1
}

PORT="$(bash "$PLUGIN_ROOT/tools/app/p2m.sh" ensure)" || { echo "p2m-server 不可用" >&2; exit 1; }

# 注册文件所在目录为允许根（预览与回写都限制在根内）
ROOT_PAYLOAD="$(python3 -c 'import json,sys; print(json.dumps({"root": sys.argv[1]}))' "$ROOT")"
curl -sf -m 5 -X POST -H 'Content-Type: application/json' -d "$ROOT_PAYLOAD" "http://127.0.0.1:$PORT/api/roots" >/dev/null

REL="${FILE#"$ROOT"/}"
ENC="$(python3 -c 'import sys,urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$REL")"
URL="http://127.0.0.1:$PORT/viewer/index.html?file=$ENC"
open "$URL" 2>/dev/null || echo "（自动打开失败，请手动访问）"
echo "已打开: $URL"
echo "服务管理: $PLUGIN_ROOT/tools/app/p2m.sh {ensure|stop|status}"
