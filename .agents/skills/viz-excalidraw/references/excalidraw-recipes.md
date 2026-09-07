# Excalidraw 配方

以下为可直接改用的元素组合示意（JSON 片段省略通用字段，字段全集见 excalidraw-json.md）。

## 1. 中心辐射概念图

布局：中心 (500, 300) 大椭圆，四个方向各一个矩形，绑定箭头指向中心。

```
title (text, fontSize 32, x 380 y 60):  "X 概念全景"
core   (ellipse, 560x140, x 220 y 230, bg #ffec99): 内嵌 text "核心概念"
n1 (rect, x 40  y 60,  bg #a5d8ff): "输入"
n2 (rect, x 40  y 430, bg #a5d8ff): "机制"
n3 (rect, x 880 y 60,  bg #b2f2bb): "产出"
n4 (rect, x 880 y 430, bg #ffc9c9): "常见误区"

arrow a1: n1 -> core   (label 可省)
arrow a2: n2 -> core
arrow a3: core -> n3
arrow a4: n4 -> core (strokeStyle dashed, 红色 #e03131)
```

要点：箭头全部用 startBinding/endBinding；每个容器 boundElements 登记内嵌 text 与关联 arrow。

## 2. 左右对比板

```
title (text, x 340 y 50): "方案 A vs 方案 B"
left  (rect 320x360, x 80  y 140, bg #d0ebff): 内嵌 "方案A" + 若干要点 text
right (rect 320x360, x 680 y 140, bg #fff3bf): 内嵌 "方案B" + 要点 text
vs    (diamond 120x80, x 480 y 280, bg #ffffff): "VS"
arrow: left -> vs, vs -> right（strokeStyle dotted）
```

## 3. 流程草图（手绘感流程）

横排 3~5 个圆角矩形，绑定箭头串联，判断处用 diamond。
与 D2 的区别：可以故意错落（每个节点 y 上下浮动 ±20）、用 freedraw 圈出重点、
加 emoji 文字标签（"⚠️ 注意"），营造讨论氛围。

## 4. 看板（三列）

```
三列大 rect（360 宽，x = 80 / 480 / 880），列头 text：
"待理解" / "已理解" / "有疑问"
列内放小 rect 卡片（每张 bg 不同色）。
```

适合学习任务的过程管理：Agent 起手画好，用户把卡片在画板上拖动归类后保存，
Agent 读回文件就知道用户当前的理解状态。

## 5. 论文方法图（讲解用）

- 左侧一列"输入"（数据集/先验，cylinder 可用 rounded rect 代）
- 中间大容器 rect 包住方法模块（内部 2~4 个子 rect 串联）
- 右侧"输出"与"指标"
- 关键贡献处用 yellow 背景 + freedraw 圈选
- 底部加一行小字 text："实线=论文原文，虚线=我的理解/推测"

## 配色速查

| 语义 | 颜色 |
|---|---|
| 蓝（输入/信息） | #a5d8ff / 描边 #1971c2 |
| 绿（产出/正确） | #b2f2bb / #2f9e44 |
| 黄（核心/强调） | #ffec99 / #e67700 |
| 红粉（误区/风险） | #ffc9c9 / #e03131 |
| 紫（待定/疑问） | #d0bfff / #6741d9 |
