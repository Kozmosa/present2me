# present2me — 功能路线图 / 功能跟踪

> 本文件是**能力实现状态的单一事实源**。任何能力的新增、转正、下线，都在同一次
> 提交里更新本文件；发版前用它核对"宣称 vs 实际"。
> 面向用户的使用说明见 `docs/README.md`，面向 Agent 的行为规则见 `AGENTS.md`。

## 状态图例

| 标记 | 含义 |
|---|---|
| ✅ | 已实现，且本次或最近一次实跑验证通过 |
| 🟡 | 部分实现：骨架/入口就位，闭环尚未跑通或验证不完整 |
| 🧪 | 已登记、手册就位，但尚未接入（挂账） |
| ⬜ | 计划中，未开工 |

---

## 现状快照（v0.2.0 · 2026-09-09）

| 维度 | 数量 | 明细 |
|---|---|---|
| 技能 skill | **4** | explain-concept · viz-d2 · viz-excalidraw · task-context |
| 命令 command | **4** | `/quick-explain` `/study-paper` `/blog-cowrite` `/p2m-setup` |
| 工作流剧本 workflow | **3** | quick-explain · study-paper · blog-cowrite |
| 工具登记 | **11** | 已通 5 · 挂账 6 |
| MCP | **0 接入** | 登记评估中 1：excalidraw-mcp |

复现命令（仓库根执行）：

```bash
ls -d plugins/present2me/skills/*/ | wc -l      # 技能
ls plugins/present2me/commands/*.md | wc -l     # 命令
ls plugins/present2me/workflows/*.md | wc -l    # 剧本
grep -c '^  - id:' config/tools.yaml            # 工具登记
bash tools/status.sh                            # 实时接入状态
```

---

## 已实现能力（按层）

### 1. 讲解编排层 ✅

| 能力 | 载体 | 状态 | 验证情况 |
|---|---|---|---|
| 讲解结构（直觉→机制→边界） | `skills/explain-concept` v0.1.0 | ✅ | 规则文件就位；行为依赖 Agent 遵守 |
| 可视化形式选型路由 | `skills/explain-concept` 选型表 | ✅ | 同上 |
| 单概念即时讲解 | `workflows/quick-explain.md` + `/quick-explain` | ✅ | 剧本就位 |

### 2. 可视化层

| 能力 | 载体 | 状态 | 验证情况 |
|---|---|---|---|
| D2 结构图（流程/架构/时序/ER） | `skills/viz-d2` v0.2.0 + `tools/render-d2.sh` | ✅ | 本次实跑：d2 v0.8.2 渲染 `demo/hello-d2.d2` → SVG 成功 |
| D2 实时预览 / PNG 输出 | `render-d2.sh -w` / `--png` | 🟡 | 代码就位，本次未实跑 |
| Excalidraw 手绘白板（语义骨架 → 构建） | `skills/viz-excalidraw` v0.3.0 + `tools/build-excalidraw.mjs` | ✅ | 实跑：`demo/hello.excalidraw` 由 `demo/hello.spec.json` 重建，校验通过；反复构建字节一致 |
| Excalidraw 本地查看器 + 保存回写 | `tools/excalidraw-viewer/`（viewer.js 8.4 MB） | ✅ | 实跑：`/api/health` 正常、`/viewer/index.html` 200、`.excalidraw` 200 |
| Excalidraw JSON 校验器 | `tools/validate-excalidraw.mjs` | ✅ | 实跑；`demo/hello.excalidraw` 已通过（见「已修复」）；含容器内文字垂直居中检查 |
| Excalidraw 文字位置修正器 | `tools/fix-excalidraw-text.mjs` | ✅ | 实跑：`--dry-run` / 修正 / 幂等三态验证，旧画板修正后校验通过 |
| mermaid 对话内小图 | 全局 `mmdc` v11.15.0 | 🟡 | CLI 已通；无专属技能，仅约定在回复里用代码块 |
| 飞书白板 | 用户级 `lark-whiteboard` 技能 | 🧪 | 非本项目自有能力，按需借用 |

### 3. 任务上下文层 ✅

| 能力 | 载体 | 状态 |
|---|---|---|
| 隔离任务文件夹协议 | `skills/task-context` + `tasks/_template/` | ✅ |
| 新建任务 | `make task SLUG=...` | ✅ |
| 会话进出 / 归档规则 | `AGENTS.md` 硬性协议 + 技能 | ✅ |

### 4. 工作流层

| 工作流 | 命令 | 剧本 | 状态 | 依赖 |
|---|---|---|---|---|
| 即时讲解 | `/quick-explain` | `quick-explain.md` | ✅ | 无 |
| 论文/长文精读 | `/study-paper` | `study-paper.md` | 🟡 | 端到端未跑通验证 |
| 博客共写 | `/blog-cowrite` | `blog-cowrite.md` | 🟡 | 飞书 lark-doc ✅；风格语料为空（见下） |
| 依赖预检 | `/p2m-setup` | — | ✅ | 依赖 setup.sh / status.sh |

### 5. 工具与运维层 ✅

| 能力 | 载体 | 状态 | 验证情况 |
|---|---|---|---|
| 工具接入状态总览 | `tools/status.sh` + `config/tools.yaml` | ✅ | 本次实跑，输出 5 通 / 6 未通 |
| 一次性环境搭建 | `setup.sh` / `make setup` | 🟡 | 脚本就位，本次未从头实跑 |
| 文档站（MkDocs Material） | `tools/docs.sh` + `mkdocs.yml` | 🟡 | uvx v0.11.2 就位；本次未 build/serve |
| 插件双市场发版 | `tools/release.sh` / `make release` | 🟡 | 脚本就位，本次未实跑 |
| ZCode + Codex 双市场分发 | `marketplace.json` + `.agents/plugins/marketplace.json` | ✅ | v0.2.0 已发版（tag `fa8e1a0`） |

### 6. 已接通的外部工具 ✅

| 工具 | 用途 | 状态 |
|---|---|---|
| 飞书 Lark CLI | 文档读写、批注拉取、消息 | ✅ |
| GitHub CLI | 仓库/PR 操作 | ✅ |
| D2 / Mermaid / Excalidraw 查看器 | 可视化 | ✅ |

---

## 未实现 / 挂账

### MCP：0 接入，1 评估中

| MCP | 用途 | 状态 | 入口 |
|---|---|---|---|
| excalidraw-mcp（官方） | 经 MCP 直接操作 Excalidraw | 🧪 挂账评估中 | `config/setup-docs/excalidraw-mcp.md` |

> 说明：项目自身**不定义任何 MCP 服务器**，仓库内也无 MCP 配置文件；
> 当前会话可用的 MCP（context7 等）来自宿主环境，不属于本项目能力。

### 知识沉淀出口：全部挂账 🧪

| 工具 | 用途 | 入口 |
|---|---|---|
| Anki | 卡片化记忆 | `config/setup-docs/anki.md` |
| 思源 SiYuan | 本地知识库 | `config/setup-docs/siyuan.md` |
| Notion | 云端笔记 | `config/setup-docs/notion.md` |
| Flomo | 碎片记录 | `config/setup-docs/flomo.md` |
| Google Docs | 文档协作 | `config/setup-docs/gdocs.md` |

### 风格学习闭环：🟡 骨架就位，语料为空

- 目录与协议齐备：`knowledge/style-pairs/`、`knowledge/style-profile.md`（本地个人数据）。
- **尚未跑通**：`style-pairs/` 为空，未产出任何「Agent 末版 vs 用户终版」版本对，
  闭环从未端到端执行过。
- 同样为空：`knowledge/insights/`（跨任务洞见）。

---

## 已知缺陷 / 待修

| # | 问题 | 影响 | 建议 |
|---|---|---|---|
| 1 | mermaid 无专属技能，定位模糊 | 用户问"画个图"时选型可能漏掉 mermaid | 在 explain-concept 选型表明确"对话内联小图"边界 |
| 2 | 三个工作流剧本均未留下端到端跑通记录 | "已实现"缺少行为证据 | 各跑一遍并记入对应 `tasks/*/session-log.md` |

### 已修复

| 日期 | 问题 | 修复 |
|---|---|---|
| 2026-09-09 | `demo/hello.excalidraw` 未通过自带校验器（4 错误 / 8 警告） | 补全容器 `boundElements` 的文字反向登记；去掉普通箭头误带的 `fixedPoint` |
| 2026-09-09 | 同一文件两处肉眼可见的渲染缺陷：标题被 Excalidraw 顶部工具栏遮挡；中心椭圆文字贴顶并越出轮廓 | 整体下移 100px 避开工具栏；按 `y = container.y + (container.height − lines×fontSize×lineHeight)/2` 重算 5 处容器内文字几何 |
| 2026-09-09 | 标题首字母被裁：`width` 520 小于实测文字宽 ~576，查看器按包围盒裁切，`p` 整个消失 | 标题框加宽到 600 并保持中心在板面中心 |
| 2026-09-09 | 校验器查不出「容器内文字垂直偏移」（手写画板"打开后文字位置奇怪、双击编辑再退出才正常"的根因） | 新增 `W_TEXT_VCENTER` 规则；配套新增 `tools/fix-excalidraw-text.mjs` 批量修正旧画板（`--dry-run` 预览、幂等） |

---

## 优先级建议

| 优先级 | 事项 | 理由 |
|---|---|---|
| P1 | 端到端跑通一次 `blog-cowrite`，产出首对 style-pairs | 风格闭环是本项目差异化卖点，目前零语料 |
| P1 | 接通至少一个知识出口（建议 SiYuan 或 Anki） | 目前"知识沉淀"只有目录没有管道 |
| P1 | 为 study-paper / blog-cowrite 补端到端验证记录 | 把 🟡 转 ✅ 的依据 |
| P2 | 对 excalidraw-mcp 出评估结论（接入或移出登记表） | 避免长期"评估中"悬空 |
| P2 | 文档站 build 纳入发版前检查 | 避免 nav 指向失效 |
| P2 | 明确 mermaid 的选型边界（或补技能） | 消除 🟡 |

> 原 P0「修 `demo/hello.excalidraw` 校验错误」已于 2026-09-09 完成，见「已修复」。

---

## 维护约定

1. **同提交更新**：能力状态变化时，改代码的同一次 commit 里改本文件。
2. **发版核对**：`make release` 前核对「现状快照」数字与实际一致。
3. **只记状态，不记流水账**：实现细节写进 `docs/` 或技能文件，本文件只回答
   "有什么、到哪一步、下一步做什么"。
4. **验证要留证**：标 ✅ 的条目应能指向一次实跑（命令输出、session-log 或截图）。

## 更新记录

| 日期 | 版本 | 变更 |
|---|---|---|
| 2026-09-09 | v0.2.0 | 初版：盘点 4 技能 / 4 命令 / 3 剧本 / 11 工具登记 / 0 MCP；登记 3 项已知缺陷 |
| 2026-09-09 | v0.2.0 | 修复 demo 白板：校验通过 + 两处渲染缺陷（标题撞工具栏、中心文字贴顶）；同步修正 viz-excalidraw 参考文档中的容器文字几何说明 |
| 2026-09-09 | v0.2.0 | 补上「文字位置奇怪」这类问题的检测与修复：校验器新增 `W_TEXT_VCENTER`，新增 `tools/fix-excalidraw-text.mjs` |
| 2026-09-09 | v0.2.0 | 改为「语义骨架 → 构建」：新增 `tools/build-excalidraw.mjs`，Agent 不再手算坐标/文字宽度/绑定；demo 改由 `demo/hello.spec.json` 重建（viz-excalidraw 技能 0.3.0） |
