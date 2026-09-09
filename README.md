# present2me

让任何 Agent 向**我**解释世界的工作区模板：概念讲解 + 可视化演示 + 隔离任务上下文 +
文档产出 + 知识与写作风格沉淀。

## 快速开始

```bash
./setup.sh          # 一次性：用 pixi 准备工具链、构建查看器、校验各工具授权
bash tools/status.sh  # 随时查看所有工具接入状态
```

然后直接对任意 Agent 说人话，例如：

- "给我讲讲 CRDT，画张图" → explain-concept → Excalidraw/D2 白板
- （丢一篇 PDF）"今天下午精读这篇，产出 insights" → `workflows/study-paper.md`
- "我口述一篇博客的思路，你写初稿到飞书" → `workflows/blog-cowrite.md`

## 详细文档

中文使用说明见 [docs/README.md](docs/README.md)：
快速开始 · 多 Agent 接入 · 讲解与可视化 · 任务文件夹 · 工作流 · 工具与凭据 · 常见问题。
功能实现进度、挂账项与优先级见 [ROADMAP.md](ROADMAP.md)。

## 作为插件安装（ZCode / Codex，任意工作区，无需克隆本仓库）

本仓库同时是 ZCode 与 Codex 的插件市场（marketplace）：插件体为
`plugins/present2me/`，两平台各读自己的市场清单（ZCode 读根 `marketplace.json`，
Codex 读 `.agents/plugins/marketplace.json`），插件清单共用
`.zcode-plugin/plugin.json`（Codex 原生接受该路径）。

**ZCode：**

```
ZCode → 设置 → 插件 → 添加插件市场 → Kozmosa/present2me → 安装 present2me
```

**Codex（CLI ≥0.121 / IDE / Desktop）：**

```
codex plugin marketplace add Kozmosa/present2me
codex plugin add present2me@kozmosa-plugins
```

装完得到 5 个技能（explain-concept / viz-d2 / viz-excalidraw / viz-mmd / task-context）与
4 个命令（`/quick-explain` `/study-paper` `/blog-cowrite` `/p2m-setup`；Codex 端
命令以迁移技能 `source-command-*` 形式生效），先跑一次 `/p2m-setup` 做依赖预检
（pixi 工具链、D2、Mermaid CLI、Excalidraw 查看器构建）。个人数据（knowledge/、tasks/）不随插件分发，
留在各自工作区。

发版（维护者）：`make release VERSION=x.y.z` —— 同步 `plugin.json` 与
`marketplace.json` 双版本号并打 tag；两处版本必须一致，否则用户端不提示更新
（Codex 市场条目不带版本号，无需第三处同步）。

## 各 Agent 接入方式

| Agent | 接入 | 说明 |
|---|---|---|
| ZCode | 打开本目录，或安装插件 | 仓库内原生发现 `.agents/skills/`（软链 → 插件 skills/）；任意工作区可经市场 `Kozmosa/present2me` 安装插件 |
| Codex（CLI/IDE/Desktop） | 在本目录启动，或安装插件 | 原生发现 `.agents/skills/`，读 AGENTS.md；任意工作区可 `codex plugin add present2me@kozmosa-plugins` 安装 |
| Claude Code | 在本目录启动 | 经 `.claude/skills → ../.agents/skills` 软链发现技能；CLAUDE.md 引用 AGENTS.md |
| Claude Desktop / ChatGPT App | 授予本目录文件访问 | 无法自动触发仓库技能；让 Agent 读 AGENTS.md 与 workflows/*.md 照做，或直接运行 tools/*.sh |

## 目录

```
plugins/present2me/  插件体（单一事实源）：skills · tools · workflows · commands · config
marketplace.json     ZCode 插件市场清单（本仓库即市场）
.agents/plugins/     Codex 插件市场清单（marketplace.json）
.agents/skills/      → ../plugins/present2me/skills（ZCode/Codex 技能发现软链）
.claude/skills       → ../.agents/skills（Claude Code 兼容软链）
workflows/           → plugins/present2me/workflows（剧本软链）
tasks/               隔离任务文件夹（TASK.md 为上下文锚点；个人数据，gitignored）
knowledge/           style-pairs 风格语料 · style-profile.md 风格档案 · insights（gitignored）
tools/               docs.sh · release.sh（实体）+ status.sh · render-d2.sh · 查看器（软链）
config/              tools.yaml 软链 · setup-docs/ 挂账工具接入手册
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
- **MCP**：当前 0 个接入；项目暂不接入 MCP

逐项状态与优先级见 [ROADMAP.md](ROADMAP.md)。
