# Workflow: 单概念即时讲解

> 场景：用户随手问一个概念（"给我讲讲 X""X 是什么"），不涉及长文阅读或多轮工程。
> 本文件是轻量入口；核心行为规则在 explain-concept 技能（插件 `skills/explain-concept/`，
> present2me 仓库内为 `.agents/skills/` 软链）。

## 步骤

1. **判断讲解形态**（据 explain-concept 的选型表）：
   - 一句话能说清 → 直接文字回答，结束。
   - 结构复杂/用户在学习 → 文字四层结构（本质+类比 → 机制 → 对比 → 边界）。
2. **配图决策**：
   - 需要 → viz-d2（精确结构）或 viz-excalidraw（概念白板），产物放 `scratch/`。
   - 拿不准 → 讲完文字后问一句"要不要来张图？"。
3. **落盘**：scratch/ 产物命名 `<主题>-<MMDD>.<ext>`；不建任务文件夹。
4. **升级判断**：出现以下信号时，建议用户转正式任务（study-paper / blog-cowrite）：
   - 用户连续追问 3+ 轮同一主题
   - 用户要求产出笔记/insights
   - 讲解对象是长文档

## 示例对话

```
用户: 给我讲讲 CRDT 是什么
Agent: [文字: 本质一句话 + 舆论类比…] 这个概念靠一张图更清楚，我画一张？
用户: 画
Agent: [写 scratch/crdt-0907-v1.excalidraw → tools/excalidraw-viewer/open.sh …]
```
