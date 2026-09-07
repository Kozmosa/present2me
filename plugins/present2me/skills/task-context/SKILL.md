---
name: task-context
description: 隔离任务文件夹协议——本工作区一切"进行中的事"都住在 tasks/ 下各自的文件夹里。当用户丢来文件并交代目标（如"今天下午精读这篇论文"）、说"新建任务""接着上次的任务"，或发现自己在 tasks/ 内工作时，使用本技能。定义任务文件夹的创建、会话进出、完结归档规则。
version: 0.1.0
---

# task-context — 隔离任务文件夹协议

## 核心思想

每个任务一个文件夹，**TASK.md 是唯一上下文锚点**。任何 Agent（ZCode/Codex/Claude/…）
接手时先读它就能无缝续上，不依赖聊天历史。

## 创建任务

```bash
SLUG=<英文小写连字符短名>            # 如: d2-lang-basics
DATE=$(date +%F)
cp -R tasks/_template "tasks/${DATE}-${SLUG}"
```

工作区没有 `tasks/_template`（非 present2me 仓库、插件安装场景）时，手工创建
同等结构：`TASK.md`、`session-log.md`、`sources/`、`artifacts/`、`insights/`。

然后立即编辑 `TASK.md`：
- `status: active`
- **目标（用户原话）**：逐字记录用户交代的目标，不要转述美化。
- 原始输入文件（PDF/链接/口述记录）放 `sources/`，**sources 只读不改**。

## 会话协议

**进入会话（第一件事）**：
1. `ls tasks/`，逐个读 status 为 `active` 的 TASK.md（通常只有 1~2 个）。
2. 与用户确认本次要推进哪个任务（只有一个活跃任务则直接续）。

**离开会话（结束前必做）**：
1. 更新 TASK.md：状态勾选、产物清单、相关链接（飞书文档 URL 等）。
2. 在 `session-log.md` 追加一条：`## YYYY-MM-DD HH:MM` + 本次做了什么 + 下次从哪继续。

## 目录约定

```
tasks/YYYY-MM-DD-<slug>/
├── TASK.md           # 锚点: 目标/状态/产物/链接/时间线
├── session-log.md    # 会话日志（追加制）
├── sources/          # 用户给的原始输入, 只读
├── artifacts/        # 中间产物: .d2 / .excalidraw / 草稿 draft-vN.md
└── insights/         # 最终洞见: insights.md / qa.md
```

## 完结归档（必须用户确认后执行）

1. TASK.md `status: done`，补全时间线最后一行。
2. `mv tasks/<任务> archive/<任务原名>`（保留日期前缀）。
3. 知识提炼：
   - 有价值的洞见 → 摘要进 `knowledge/insights/<slug>.md`（注明来源任务与日期）。
   - 博客类任务 → 额外执行插件目录 `workflows/blog-cowrite.md` 的"版本沉淀"步骤。

## 状态语义

| status | 含义 |
|---|---|
| active | 进行中，会话默认接续对象 |
| paused | 用户明确暂停，不自动接续 |
| done | 已归档（移入 archive/ 后即视为 done） |

## 禁止

- 不在 tasks/ 之外另设进行中工作的目录（scratch 仅限无任务的临时讲解产物）。
- 不改写 sources/ 内文件；需要加工时复制到 artifacts/。
- 不删除历史 draft-vN——版本序列是风格学习与回溯的原料。
