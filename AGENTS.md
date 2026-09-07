# present2me — Agent 工作区协议

本仓库是用户（kozmosa）的**讲解·演示·协作工作区**：Agent 在这里向用户解释概念、
用可视化演示、在隔离的任务文件夹里跟进工作、产出文档，并沉淀知识（含写作风格语料）。
任何 Agent（ZCode / Codex / Claude Code / 其他）进入本仓库即受本协议约束。

## 目录导览

| 路径 | 用途 |
|---|---|
| `plugins/present2me/` | **插件体（单一事实源）**：skills / tools / workflows / commands / config，随 ZCode 与 Codex 插件市场分发 |
| `marketplace.json` | ZCode 插件市场清单（安装入口 `Kozmosa/present2me`） |
| `.agents/plugins/marketplace.json` | Codex 插件市场清单（安装入口 `codex plugin marketplace add Kozmosa/present2me`） |
| `tasks/<日期>-<slug>/` | 进行中任务（隔离上下文），协议见 task-context 技能 |
| `tasks/_template/` | 任务文件夹模板 |
| `workflows/` | 软链 → 插件 workflows/：study-paper / blog-cowrite / quick-explain 剧本 |
| `.agents/skills/` | 软链 → 插件 skills/（本仓库技能，下表） |
| `knowledge/` | 沉淀：style-pairs（风格语料）/ style-profile.md（风格档案）/ insights |
| `archive/` | 已完结任务 |
| `scratch/` | 无任务上下文的临时讲解产物（gitignored） |
| `tools/` | docs.sh（文档站，实体）+ status.sh / render-d2.sh / excalidraw-viewer（软链 → 插件 tools/）+ release.sh（发版） |
| `config/tools.yaml` | 软链 → 插件 config/tools.yaml：全部工具登记表 |
| `config/setup-docs/` | 挂账工具接入手册（工作区面，不随插件分发） |
| `demo/` | 能力演示样例 |

## 本仓库技能

| 技能 | 作用 |
|---|---|
| `explain-concept` | 讲解编排：讲解结构 + 可视化选型路由 |
| `viz-d2` | D2 精确结构图（流程/架构/时序/ER） |
| `viz-excalidraw` | Excalidraw 手绘白板（概念图/讨论画板，可回写） |
| `task-context` | 隔离任务文件夹协议 |

飞书相关操作使用用户已安装的 lark 系列技能（lark-doc 等，位于用户级技能目录）。
**不支持自动触发技能的 Agent**：直接读 `workflows/*.md` 与 `.agents/skills/*/SKILL.md`
照做即可；`tools/*.sh` 均可直接执行。

注意：技能/脚本/剧本的真身在 `plugins/present2me/` 下，仓库根的
`.agents/skills`、`workflows`、`tools/*`、`config/tools.yaml` 都是软链回接。
改技能或脚本请直接改插件目录内的文件（软链目标），不要另建副本。

## 硬性协议

1. **任务上下文优先**：一切进行中的工作住在 `tasks/` 下；会话开始先读活跃任务的
   TASK.md，结束前更新它和 session-log.md。不依赖聊天历史当上下文。
2. **讲解默认可视化**：讲复杂概念时按 explain-concept 的选型表配图；
   产物落盘（artifacts/ 或 scratch/），渲染后打开给用户看，据反馈迭代。
3. **凭据零仓库**：只使用各工具原生登录态（lark-cli、gh、…），状态用
   `tools/status.sh` 查询；**任何 token/secret 不写入仓库、不打印到终端**。
4. **外部写入需告知**：写飞书/创建 GitHub 资源等外部副作用前，说明将写什么；
   高危操作（删除、覆盖他人内容）必须等用户明确同意。遵守 lark-cli 的确认约定
   （exit 10 = 需确认后带 flag 重试）。
5. **语料只增不改**：`knowledge/style-pairs/`、各任务 `draft-vN` 版本序列、
   `sources/` 原始输入——是风格学习与回溯的原料，不覆盖不删除。
6. **目录卫生**：`node_modules/`、`site/`、`dist/` 是构建产物，**不遍历、不读取、不修改**；
   搜索时显式排除，避免无谓的 token 消耗。文档站经 `tools/docs.sh`（uvx）运行，
   不要往仓库引入 venv 或新的包管理目录。
7. **插件目录是产品面**：`plugins/present2me/` 会随插件市场分发到他人工作区——
   个人数据（knowledge/、tasks/）与机器本地手册（config/setup-docs/）不得移入；
   发版用 `make release VERSION=x.y.z`（同步 plugin.json 与 marketplace.json 双版本 + tag），
   不要手改单边版本号。
8. **命令文件双平台兼容**：`plugins/present2me/commands/*.md` 同时被 ZCode 与
   Codex 消费——front-matter 只用 `description` + `argument-hint`，正文**禁用
   `$ARGUMENTS` 占位符**（Codex 迁移命令时遇到它会静默丢弃该命令），参数说明
   写进 description 与正文自然语言；新增命令后用
   `codex plugin add present2me@kozmosa-plugins` 重装验证迁移成功。

## 用户风格偏好（交流与写作）

- 中文交流；术语首现给英文原文。
- 先直觉后严谨：先给能懂的解释，再给准确的形式化。
- 图示优先于长段文字；一次一个层次，不倾倒。

## 当前接入状态

核心已通：lark-cli（飞书）、gh、D2、Excalidraw 查看器、mermaid。
挂账（手册在 `config/setup-docs/`）：Anki、SiYuan、Notion、Flomo、Google Docs。
以 `bash tools/status.sh` 实时输出为准。

## 插件发布渠道（ZCode + Codex marketplace）

本仓库同时是 ZCode 与 Codex 的插件市场，共用插件体 `plugins/present2me/`，
插件清单共用 `.zcode-plugin/plugin.json`（Codex 原生接受该路径，安装时自动
归一化出 `.codex-plugin/` 并把 commands/ 迁移为 `source-command-*` 技能）。
两平台各读自己的市场清单：ZCode 读根 `marketplace.json`，Codex 读
`.agents/plugins/marketplace.json`（条目不带版本号，发版无需第三处同步）。

- **ZCode**：设置 → 插件 → 添加市场 → `Kozmosa/present2me`
- **Codex（CLI ≥0.121）**：`codex plugin marketplace add Kozmosa/present2me` →
  `codex plugin add present2me@kozmosa-plugins`

外部用户得到 4 个技能与 4 个命令（不含本工作区的个人数据）。发版：
`make release VERSION=x.y.z`（校验、双版本同步、commit、tag；push 由用户执行）。
版本一致性检查：`make release-check`。
