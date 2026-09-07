# 快速开始

## 环境要求

macOS（脚本按 macOS 编写，Linux 需自行微调）+ 以下命令可用：
`git` `node` `npm` `curl`（缺什么先装什么，建议用 Homebrew）。

可选但推荐：`brew`（用于自动安装 d2）、`lark-cli`（飞书，已授权则文档闭环全通）、`gh`（GitHub）。

## 一次性 Setup

```bash
cd present2me
./setup.sh
```

setup 会依次做四件事，全部幂等（重复跑无害）：

1. **基础依赖**：检查 git/node/npm/curl；`d2` 缺失时询问后 `brew install d2`。
2. **构建 Excalidraw 查看器**：`tools/excalidraw-viewer/` 下 `npm install` + esbuild 打包出 `viewer.js`。
3. **Agent 目录适配**：确保 `.claude/skills → ../.agents/skills` 软链存在（供 Claude Code）。
4. **工具授权体检**：跑 `tools/status.sh`，输出全工具状态表。

只想看状态不装东西：`./setup.sh --check`。

## 验证安装

```bash
bash tools/status.sh
# 期望：lark-cli / gh / d2 / mermaid / excalidraw-viewer 五项 ✅
# anki / siyuan / notion / flomo / gdocs 显示 ❌ 属正常（挂账，见 docs/tools.md）
```

跑官方演示：

```bash
bash tools/render-d2.sh demo/hello-d2.d2
# 浏览器打开 present2me 能力全景图（D2 渲染）

bash tools/excalidraw-viewer/open.sh demo/hello.excalidraw
# 浏览器打开手绘风概念图（Excalidraw 画板），可在画板上拖改，⌘S 保存回文件
```

## 第一次使用

对本仓库里的任何 Agent 说人话即可：

- 「给我讲讲 CRDT，画张图」→ 文字讲解 + 自动出图
- （拖入一篇 PDF）「今天下午精读这篇论文，产出 insights」→ Agent 建 `tasks/` 任务文件夹按 [论文精读工作流](workflows.md#论文精读-study-paper) 推进
- 「我口述一篇博客的思路，你写初稿到飞书」→ [博客共写工作流](workflows.md#博客共写-blog-cowrite)

## 目录速览

```
AGENTS.md        Agent 行为宪法（人也可以读，5 条硬协议）
workflows/       三大工作流剧本
tasks/           进行中任务（每任务一个文件夹）
knowledge/       沉淀：风格语料 / 风格档案 / insights
tools/           脚本：状态 / D2 渲染 / Excalidraw 查看器
config/          工具登记表 + 挂账工具接入手册
archive/         已完结任务
scratch/         临时讲解产物（gitignored）
demo/            能力演示样例
```

## 下一步

- 换用其他 Agent？看 [多 Agent 接入](agents.md)。
- 想接入 Anki / 思源 / Notion / Flomo / Google Docs？看 [工具与凭据](tools.md)。
