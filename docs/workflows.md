# 三大工作流

工作流是「人和任意 Agent 都能照着执行的剧本」，全文在 `workflows/` 目录。
本文补充设计意图和使用要点。

## 论文精读（workflows/study-paper.md）

**场景**：丢一篇 PDF，要求在一段时间内学透并产出 insights。

流程：建任务 → 结构扫描（标题/摘要/图表/结论）→ 精读 + **双图讲解**
（方法流程用 D2，概念关系用 Excalidraw 白板）→ 问答（逐条记入 `insights/qa.md`）→
产出 `insights/insights.md`（3~8 条洞见）→ 可选推送飞书 → 归档提炼。

要点：

- **推测与原文分离**：图上「实线=论文原文，虚线=我的理解」，讲解中标"我猜的"不冒充事实。
- 问答记录是资产：`qa.md` 保留你的问题和当时的回答，复习时直接看。
- 学习重点你不指定时，Agent 默认"方法为主"，并在第一遍后跟你确认。

## 博客共写（workflows/blog-cowrite.md）

**场景**：你口述概念/思路 → Agent 写初稿进飞书 → 你手动加 comments → Agent 拉评论修订 → 定稿。

流程：口述捕获（逐字记 `sources/dictation.md`）→ 初稿（**必读风格档案后动笔**）→
lark-cli 建飞书文档、URL 回填 TASK.md → 你批注（任务进入 awaiting-review 挂起）→
Agent 拉取文档+评论逐条修订（版本号 +1，旧版全保留）→ 迭代至定稿。

### 定稿沉淀（本工作流的核心价值）

定稿后在 `knowledge/style-pairs/YYYY-MM-DD-<slug>/` 建立：

```
before.md     # Agent 的最后一个版本
after.md      # 你的定稿版（从飞书拉回）
diff-notes.md # 改动分析：结构/语气用词/内容取舍/可泛化的规律
```

「可泛化的规律」随后合入 `knowledge/style-profile.md`（≤150 行，冲突以近期为准，旧条目降级不删除）。
**每次写新初稿前 Agent 必读该档案**——这就是"让 Agent 学会写我的风格"的机制：
不是微调模型，而是积累 before/after 语料 + 显式风格规则。

## 即时讲解（workflows/quick-explain.md)

**场景**：随手问一个概念，不值得开任务。

Agent 按 [讲解与可视化](visualization.md) 的结构回答；需要图时产物放 `scratch/`；
连续追问 3+ 轮或要求产出笔记时，Agent 会建议升级为正式任务。

## 与技能的关系

- 技能（`.agents/skills/`）= Agent 的**行为规则**，自动触发。
- 工作流（`workflows/`）= **完整剧本**，手动发起（"按 study-paper 流程来"），
  也是不支持技能自动触发的 Agent（Claude Desktop/ChatGPT）的执行入口。
