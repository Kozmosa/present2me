---
description: 博客共写工作流（口述 → 初稿到飞书 → 批注修订 → 定稿 → 风格语料沉淀）
argument-hint: [博客主题/口述要点]
---

按 present2me 插件的 `workflows/blog-cowrite.md` 剧本执行博客共写。

定位剧本：插件根目录（ZCode / Codex 插件安装目录，或 present2me 仓库内的
`plugins/present2me/`）下的 `workflows/blog-cowrite.md`；可从本插件任一技能的
加载路径推断插件根。

本次主题：用户随命令给出的博客主题/口述要点
（若下方有附加输入，以附加输入为准）。

要点速览（以剧本原文为准）：
1. 遵循 task-context 技能建任务；口述近逐字记入 sources/dictation.md，
   只追问目标读者/发表渠道/核心观点三项；
2. 写初稿前必读 knowledge/style-profile.md（若当前工作区有积累）；
   draft-vN 版本序列只增不改；
3. 初稿导入飞书文档（用户级 lark-doc 技能，--as user），URL 回填 TASK.md，
   然后进入等待批注态；
4. 修订迭代以用户意见为准，分歧记 artifacts/disagreements.md；
5. 定稿后在 knowledge/style-pairs/ 沉淀 before/after/diff-notes 并合入风格档案
   （knowledge/ 不存在时在工作区创建，并向用户说明）。
