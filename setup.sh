#!/usr/bin/env bash
# present2me 一次性 Setup
# 使用 pixi 管理 Node/Python/D2，并在项目目录内安装 Mermaid CLI
# 用法: ./setup.sh           交互确认安装
#       ./setup.sh --check   只跑状态体检（等价 bash tools/status.sh）
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

say() { printf '\n\033[1;36m== %s\033[0m\n' "$*"; }
ok()  { printf '  ✅ %s\n' "$*"; }
bad() { printf '  ❌ %s\n' "$*"; }

if [[ "${1:-}" == "--check" ]]; then exec bash tools/status.sh; fi

say "1/4 pixi 工具链"
command -v pixi >/dev/null 2>&1 || { bad "pixi 缺失，请先安装: https://pixi.sh"; exit 1; }
pixi install
pixi run setup
ok "Node/Python/uv/D2 与 Mermaid CLI 均安装在项目环境"

say "2/4 构建 Excalidraw 查看器"
(
  cd tools/excalidraw-viewer
  if [[ ! -d node_modules ]]; then pixi run npm install --no-fund --no-audit; else ok "node_modules 已存在"; fi
  pixi run npm run build
)
[[ -f tools/excalidraw-viewer/viewer.js ]] && ok "viewer.js 构建成功" || { bad "构建失败"; exit 1; }

say "3/4 Agent 目录适配"
if [[ -L .claude/skills || -d .claude/skills ]]; then
  ok ".claude/skills 就绪（Claude Code 兼容）"
else
  mkdir -p .claude && ln -sfn ../.agents/skills .claude/skills && ok "已创建 .claude/skills 软链"
fi
if [[ -e .agents/skills ]]; then
  ok ".agents/skills 就绪（软链 → plugins/present2me/skills，ZCode/Codex 原生发现）"
else
  mkdir -p .agents && ln -sfn ../plugins/present2me/skills .agents/skills && ok "已创建 .agents/skills 软链"
fi

say "4/4 工具授权体检"
bash tools/status.sh || true

printf '\n完成。挂账工具（Anki/思源/Notion/Flomo/GDocs）的开通手册见 config/setup-docs/。\n'
