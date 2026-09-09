---
name: viz-excalidraw
description: 用语义骨架（节点/标签/样式/连接关系）生成 Excalidraw 手绘风画板/概念图/白板，几何由 builder 计算，本地查看器打开、可回写迭代。当用户说"画个白板""手绘风格""概念图""像 Excalidraw 那种"，或需要自由布局、讨论式草图、低正式感演示时，使用本技能。
version: 0.3.0
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

## 核心原则：只写语义，几何交给 builder

**不要手算坐标、文字宽度、绑定登记。** 你只决定四件事：

- 有哪些节点、每个节点写什么字（用 `\n` 换行）
- 什么形状、什么颜色
- 大致摆在哪（`x`/`y`，可选）
- 谁连谁

容器内文字居中、文字↔容器双向绑定、箭头端点吸附、漂浮文字宽度余量、
避让查看器顶部工具栏——全部由 `<插件根>/tools/build-excalidraw.mjs` 计算。

## 标准流程

1. **写语义骨架 spec（JSON）**。输出位置：
   - 有任务上下文 → `tasks/<活跃任务>/artifacts/<主题>-v<N>.spec.json`
   - 无任务上下文 → `scratch/<主题>-v<N>.spec.json`

   ```json
   {
     "title": "画板标题",
     "footer": "底部说明（可省）",
     "nodes": [
       { "id": "core", "label": "中心概念", "shape": "ellipse", "color": "yellow",
         "x": 470, "y": 400, "width": 300, "height": 120, "fontSize": 26 },
       { "id": "in", "label": "输入\n数据来源", "color": "green", "x": 60, "y": 220 }
     ],
     "edges": [ { "from": "in", "to": "core" } ]
   }
   ```

   - `shape`：`rectangle`（默认）/ `ellipse` / `diamond`
   - `color`：`blue` / `green` / `yellow` / `red` / `purple` / `gray` / `none`
   - `x`/`y` 省略 → 自动网格排布；`width`/`height` 省略 → 按标签自动定尺；
     `fontSize` 默认 20（标题 32、页脚 16 由 `title`/`footer` 自动处理）
2. **构建**（纯 Node，不需要浏览器、不需要起服务）：

   ```bash
   <插件根>/tools/build-excalidraw.mjs <spec.json> <out.excalidraw>
   ```

   同一 spec 反复构建字节一致——spec 是唯一真相，重建不产生噪声 diff。
3. **机检**（硬错误必修，警告酌情；规格蒸馏自 0.18.1 官方类型）：

   ```bash
   <插件根>/tools/validate-excalidraw.mjs <out.excalidraw>   # 退出码 1 = 有硬错误
   ```
4. **打开给用户**（查看器在本技能所在插件的 `tools/excalidraw-viewer/` 下；
   present2me 仓库内根目录同名路径为软链，可直接用）：

   ```bash
   <插件根>/tools/excalidraw-viewer/open.sh <out.excalidraw>
   ```
5. 用户可能直接在画板上改动并点"保存"（回写同一文件）。
   **下次迭代前必须重新读文件**；若用户改过，就以文件为准（或把改动回写进 spec 再重建）。
6. **迭代**：优先改 spec → 重建 → 刷新浏览器。

## 逃生通道：手写 / 手改 .excalidraw

只在需要精确控制单个元素、或要修用户手改过的文件时才直接编辑 JSON。
**字段必读 `references/excalidraw-json.md`**（含容器内文字几何公式、箭头绑定、常见坑）。
校验报 `W_TEXT_VCENTER`（文字贴容器顶）时，用
`<插件根>/tools/fix-excalidraw-text.mjs <file.excalidraw>` 批量修正。

## 手绘感三要素

```json
"roughness": 2        // 0=建筑风 1=艺术风 2=卡通手绘，讲解场景推荐 1~2
"fillStyle": "hachure"// 斜线填充，比 solid 更"手画"
"strokeWidth": 2
```

## 设计建议

- 中心放主概念（大号 ellipse/diamond），周围放射小节点，用 `edges` 连接（自动绑定、移动跟随）。
- 一个画板讲一件事；节点 > 12 个考虑拆成两张或换 D2。
- 文字尽量放进形状容器（spec 的 `label` 默认就是容器内文字），少用漂浮文本。
- 颜色语义保持一致：输入绿、处理蓝、结论黄、误区红粉。
- 首次为某主题作画时，用 `title` 给图加上下文。

## 路由表

| 需要什么 | 读哪个文件 |
|---|---|
| spec 字段与示例 | 本文件「标准流程」 |
| 手写/手改 JSON 的元素字段、最小合法文件、常见坑 | `references/excalidraw-json.md` |
| 现成布局配方：概念图 / 对比板 / 流程草图 / 看板 | `references/excalidraw-recipes.md` |

## 注意

- 查看器依赖构建产物 `viewer.js`。若缺失，提示用户在查看器目录
  `npm install && npm run build`（present2me 仓库内可 `./setup.sh`；插件用户走 `/p2m-setup`）。
- 元素字段按查看器内置的 `@excalidraw/excalidraw@0.18.1` 类型核实（见
  `references/excalidraw-json.md` 顶部说明）；画板行为以实际渲染为准。
- `.excalidraw` 是纯 JSON，可直接读写、可 git 版本管理——**文件即真相**；
  spec 与生成文件一起提交，改图先改 spec。
