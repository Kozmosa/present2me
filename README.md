# present2me

让任何 Agent 向**我**解释世界的工作区模板：概念讲解 + 可视化演示 + 隔离任务上下文 +
文档产出 + 知识与写作风格沉淀。

## 快速开始

```bash
./setup.sh          # 一次性：装 d2、构建 Excalidraw 查看器、校验各工具授权
bash tools/status.sh  # 随时查看所有工具接入状态
```

然后直接对任意 Agent 说人话，例如：

- "给我讲讲 CRDT，画张图" → explain-concept → Excalidraw/D2 白板
- （丢一篇 PDF）"今天下午精读这篇，产出 insights" → `workflows/study-paper.md`
- "我口述一篇博客的思路，你写初稿到飞书" → `workflows/blog-cowrite.md`

## 各 Agent 接入方式

| Agent | 接入 | 说明 |
|---|---|---|
| ZCode | 打开本目录即可 | 原生发现 `.agents/skills/`，读 AGENTS.md |
| Codex（CLI/IDE/Desktop） | 在本目录启动 | 原生发现 `.agents/skills/`，读 AGENTS.md |
| Claude Code | 在本目录启动 | 经 `.claude/skills → ../.agents/skills` 软链发现技能；CLAUDE.md 引用 AGENTS.md |
| Claude Desktop / ChatGPT App | 授予本目录文件访问 | 无法自动触发仓库技能；让 Agent 读 AGENTS.md 与 workflows/*.md 照做，或直接运行 tools/*.sh |

## 目录

```
.agents/skills/    技能源（explain-concept / viz-d2 / viz-excalidraw / task-context）
.claude/skills     → ../.agents/skills（Claude Code 兼容软链）
workflows/         剧本：study-paper / blog-cowrite / quick-explain
tasks/             隔离任务文件夹（TASK.md 为上下文锚点）
knowledge/         style-pairs 风格语料 · style-profile.md 风格档案 · insights
tools/             status.sh · render-d2.sh · excalidraw-viewer（本地自托管）
config/            tools.yaml 工具登记表 · setup-docs/ 挂账工具接入手册
archive/ scratch/ demo/
```

## 设计原则

1. **文件即真相**：`.d2` / `.excalidraw` / draft-vN.md 全部是可读可 diff 的源文件；
   Excalidraw 查看器支持把用户在画板上的修改保存回文件，人机共编同一份真相。
2. **原生凭据，零仓库**：每个工具用各自的官方登录态（lark-cli `~/.lark-cli/`、gh 钥匙串…），
   仓库不存任何密钥；`tools/status.sh` 一条命令聚合全部授权状态。
3. **任务隔离**：每个任务一个文件夹，任何 Agent 先读 TASK.md 即可无缝接手，不靠聊天历史。
4. **风格学习闭环**：博客定稿时自动保存「Agent 末版 vs 用户终版」版本对与改动分析，
   累积进 style-profile.md，让初稿越写越像用户本人。

## 已接入 / 挂账

- **已通**：飞书（lark-cli）、GitHub（gh）、D2、Excalidraw 本地查看器、mermaid
- **挂账**（接入手册就绪，随时开通）：Anki、思源 SiYuan、Notion、Flomo、Google Docs
  → 见 `config/setup-docs/`，登记表 `config/tools.yaml`
