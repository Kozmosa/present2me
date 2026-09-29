#!/usr/bin/env bash
# status.sh — 聚合所有工具的接入/授权状态（p2m-server 瘦客户端）
# 用法: bash tools/status.sh [--json]
# 真身在 tools/app/status.mjs（CLI 双入口之一）；服务端 /api/status 挂同一模块。
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

if command -v node >/dev/null 2>&1; then
  exec node "$PLUGIN_ROOT/tools/app/status.mjs" "$@"
else
  echo "node 不可用：请安装 Node.js ≥20（或经 pixi 工具链）" >&2
  exit 1
fi
