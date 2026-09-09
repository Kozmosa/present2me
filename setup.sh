#!/usr/bin/env bash
# present2me 一次性 Setup
# 做四件事：装基础依赖(d2/mmdc) → 构建 Excalidraw 查看器 → 确保 Claude 软链 → 全工具状态体检
# 用法: ./setup.sh           交互确认安装
#       ./setup.sh --check   只跑状态体检（等价 bash tools/status.sh）
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

say() { printf '\n\033[1;36m== %s\033[0m\n' "$*"; }
ok()  { printf '  ✅ %s\n' "$*"; }
bad() { printf '  ❌ %s\n' "$*"; }

if [[ "${1:-}" == "--check" ]]; then exec bash tools/status.sh; fi

say "1/4 基础依赖"
for cmd in git node npm curl; do
  command -v "$cmd" >/dev/null 2>&1 && ok "$cmd 已安装" || { bad "$cmd 缺失（请先安装）"; exit 1; }
done
if command -v d2 >/dev/null 2>&1; then
  ok "d2 $(d2 --version 2>/dev/null | head -1)"
else
  if command -v brew >/dev/null 2>&1; then
    printf '  d2 未安装，将执行: brew install d2\n'
    read -r -p '  继续？[Y/n] ' ans </dev/tty
    if [[ "${ans:-Y}" =~ ^[Yy]?$ ]]; then
      brew install d2 && ok "d2 安装完成" || bad "brew install d2 失败，可手动执行"
    else
      bad "跳过 d2（D2 绘图将不可用）"
    fi
  else
    bad "无 brew，请手动安装 d2: https://d2lang.com/tour/install"
  fi
fi

if command -v mmdc >/dev/null 2>&1; then
  ok "mermaid $(mmdc --version 2>/dev/null | head -1)"
else
  printf '  mmdc 未安装，Mermaid 中文图渲染将不可用。建议执行: npm install -g @mermaid-js/mermaid-cli\n'
  read -r -p '  现在安装 mmdc？[y/N] ' ans </dev/tty
  if [[ "${ans:-N}" =~ ^[Yy]$ ]]; then
    npm install -g @mermaid-js/mermaid-cli && ok "mmdc 安装完成" || bad "mmdc 安装失败，可稍后手动执行 npm install -g @mermaid-js/mermaid-cli"
  else
    bad "跳过 mmdc（Mermaid 图仍可作为代码块输出，但无法本地渲染检查）"
  fi
fi

say "2/4 构建 Excalidraw 查看器"
(
  cd tools/excalidraw-viewer
  if [[ ! -d node_modules ]]; then npm install --no-fund --no-audit; else ok "node_modules 已存在"; fi
  npm run build
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
