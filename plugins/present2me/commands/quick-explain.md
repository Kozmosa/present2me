---
description: 单概念即时讲解（文字四层结构 + 按需配图，产物落盘）· 参数：要讲解的概念/问题
argument-hint: [要讲解的概念/问题]
---

按 present2me 插件的 `workflows/quick-explain.md` 剧本执行即时讲解。

定位剧本：插件根目录（ZCode / Codex 插件安装目录，或 present2me 仓库内的
`plugins/present2me/`）下的 `workflows/quick-explain.md`；可从本插件任一技能
（explain-concept 等）的加载路径推断插件根。

讲解对象：用户随命令给出的概念或问题（若下方有附加输入，以附加输入为准）。

要点速览（以剧本原文为准）：
1. 先按 explain-concept 技能判断讲解形态与配图决策；
2. 产物落盘 `scratch/<主题>-<MMDD>.<ext>`（不建任务文件夹）；
3. 图用 viz-d2（精确结构）或 viz-excalidraw（概念白板），渲染/打开后等用户反馈迭代；
4. 用户连续追问 3+ 轮或要求产出笔记时，建议升级为 study-paper / blog-cowrite 任务。
