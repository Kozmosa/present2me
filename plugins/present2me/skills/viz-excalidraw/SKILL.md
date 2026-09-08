---
name: viz-excalidraw
description: 直接手写 Excalidraw JSON 生成手绘风画板/概念图/白板，并用本地查看器打开给用户。当用户说"画个白板""手绘风格""概念图""像 Excalidraw 那种"，或需要自由布局、讨论式草图、低正式感演示时，使用本技能。用户可在画板上继续修改并保存回文件，形成人机迭代闭环。
version: 0.1.1
metadata:
  requires:
    bins: [node]
---

# viz-excalidraw — Excalidraw 白板绘制

## 选型：什么时候用 Excalidraw

| 场景 | 用 Excalidraw？ |
|---|---|
| 概念关系图、头脑风暴、讨论画板、手绘感 | ✅ 本技能 |
| 精确流程 / 架构 / 时序图（要自动布局） | ❌ 用 `../viz-d2/SKILL.md` |
| 聊天里顺带的小图 | ❌ mermaid 代码块 |

## 标准流程

1. 规划布局：先在脑中画网格（列 x、行 y），矩形约 160×60，间距 ≥ 60。
2. 手写 `.excalidraw` JSON 文件（**元素格式必须先读 `references/excalidraw-json.md`**，
   字段写错画板会空白或元素错位）。输出位置：
   - 有任务上下文 → `tasks/<活跃任务>/artifacts/<主题>-v<N>.excalidraw`
   - 无任务上下文 → `scratch/<主题>-v<N>.excalidraw`
3. 打开给用户（查看器在本技能所在插件的 `tools/excalidraw-viewer/` 下；
   present2me 仓库内根目录同名路径为软链，可直接用）：
   ```bash
   <插件根>/tools/excalidraw-viewer/open.sh <file.excalidraw>
   ```
4. 用户可能直接在画板上改动并点"保存"（回写同一文件）。
   **下次迭代前必须重新读文件**，以文件当前内容为准，不要基于自己上一版记忆改。
5. 迭代：解析现有 elements → 增删改 → 写回 → 刷新浏览器。

## 手绘感三要素

```json
"roughness": 2        // 0=建筑风 1=艺术风 2=卡通手绘，讲解场景推荐 1~2
"fillStyle": "hachure"// 斜线填充，比 solid 更"手画"
"strokeWidth": 2
```

## 设计建议

- 中心放主概念（大号 ellipse/diamond），周围放射小节点，箭头用 bindings 绑定（自动吸附、移动跟随）。
- 一个画板讲一件事；节点 > 12 个考虑拆成两张或换 D2。
- 文字尽量放进形状容器（text 元素设 `containerId`），少用漂浮文本。
- 颜色语义保持一致：输入绿、处理蓝、结论黄、误区红粉。
- 首次为某主题作画时，给图加上下文标题（大字号 text）。

## 路由表

| 需要什么 | 读哪个文件 |
|---|---|
| 元素字段、最小合法文件、箭头绑定、常见坑 | `references/excalidraw-json.md`（**必读**） |
| 现成配方：概念图 / 对比板 / 流程草图 / 看板 | `references/excalidraw-recipes.md` |

## 注意

- 查看器依赖构建产物 `viewer.js`。若缺失，提示用户在查看器目录
  `npm install && npm run build`（present2me 仓库内可 `./setup.sh`；插件用户走 `/p2m-setup`）。
- 元素字段提示按查看器内置的 `@excalidraw/excalidraw@0.18.1` 类型核实（见
  `references/excalidraw-json.md` 顶部说明）；画板行为以实际渲染为准。
- `.excalidraw` 是纯 JSON，可直接读写、可 git 版本管理——**文件即真相**。
