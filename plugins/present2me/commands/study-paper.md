---
description: 论文/长文精读工作流（建任务 → 结构扫描 → 精读可视化 → 问答 → insights → 归档）
argument-hint: [论文路径/来源 或目标描述]
---

按 present2me 插件的 `workflows/study-paper.md` 剧本执行论文/长文精读。

定位剧本：插件根目录（ZCode / Codex 插件安装目录，或 present2me 仓库内的
`plugins/present2me/`）下的 `workflows/study-paper.md`；可从本插件任一技能的
加载路径推断插件根。

本次输入：用户随命令给出的论文路径/来源或目标描述
（若下方有附加输入，以附加输入为准）。

要点速览（以剧本原文为准）：
1. 遵循 task-context 技能建任务文件夹（tasks/YYYY-MM-DD-<slug>/），
   TASK.md「目标」逐字记录用户原话，原始 PDF 存 sources/（只读）；
2. 第一遍结构扫描后向用户确认学习重点；
3. 精读配图：方法流程用 viz-d2，概念关系用 viz-excalidraw，推测显式标注；
4. 问答沉淀到 insights/qa.md，最终 3~8 条洞见写 insights/insights.md；
5. 用户要求时推飞书（lark-doc），学完经用户确认后归档 archive/。
