# Workflow: 论文/长文精读

> 场景：用户丢来一篇 PDF，要求在一段时间内学透并产出 insights。
> 任何 Agent 拿到本文件即可照做，不依赖特定技能系统。

## 前置

- 本剧本随 present2me 插件分发：技能在插件 `skills/`、脚本在插件 `tools/`
  （present2me 仓库内对应根目录 `.agents/skills/`、`tools/` 软链）。
- 遵循 task-context 技能的文件夹协议。
- 相关能力检查：`<插件根>/tools/status.sh`（如需推送飞书，确认 lark-cli 已授权）。

## 步骤

### 1. 建任务

- `cp -R tasks/_template tasks/$(date +%F)-<slug>`
- PDF 存 `sources/paper.pdf`（**只读**）。
- TASK.md「目标」逐字记录用户原话（例："今天下午学习这一篇论文，产出一些 insights"）。

### 2. 第一遍：结构扫描

- 标题 → 摘要 → 图表 → 结论 → 引言首尾段。
- 在 TASK.md 记录：论文要解决什么问题、声称的贡献、我的初判。
- 向用户确认学习重点（用户不指定则按"方法为主"推进）。

### 3. 精读与可视化讲解

- 逐节精读，提取：问题定义 / 方法机制 / 实验设置 / 关键结果 / 局限。
- **方法流程图**：用 viz-d2 技能画 pipeline，
  存 `artifacts/method-v1.d2`，渲染打开讲解。
- **概念关系白板**：用 viz-excalidraw 技能画核心概念图，
  存 `artifacts/concepts-v1.excalidraw`，用户可在画板上圈改。
- 推测与论文原文区分标注（"实线=原文，虚线=我的理解"）。

### 4. 问答阶段

- 用户随时提问（"有任何问题我直接问"）。
- 每次问答追加到 `insights/qa.md`：

```md
## Q: <问题>（MM-DD HH:MM）
<回答，含论文位置引用；推测显式标注>
```

### 5. 产出 insights

- 写 `insights/insights.md`：3~8 条洞见，每条 = 一句话结论 + 支撑依据 +（可选）与其他知识的联系。
- 风格遵循用户偏好：先直觉后严谨；写之前读 `knowledge/style-profile.md`（若有积累）。

### 6. 分发（用户要求时）

- 摘要/笔记 → 飞书文档（用户级 lark-doc 技能；`--as user`）。
- URL 回填 TASK.md「相关链接」。
- 未来：Anki 卡片（见 `config/setup-docs/anki.md`，开通后追加制卡步骤）。

### 7. 归档

- 用户确认学完 → 按 task-context 协议移入 `archive/`，
  洞见提炼进 `knowledge/insights/<slug>.md`。

## 产物清单（完成态）

```
tasks/<任务>/
├── TASK.md / session-log.md
├── sources/paper.pdf
├── artifacts/{method-v*.d2, concepts-v*.excalidraw, *.svg}
└── insights/{insights.md, qa.md}
```
