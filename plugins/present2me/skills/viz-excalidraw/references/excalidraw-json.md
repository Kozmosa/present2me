# Excalidraw JSON 格式参考（agent 手写用）

> 本参考按查看器内置的 `@excalidraw/excalidraw@0.18.1` 类型定义逐字段核实。
> 查看器加载时会做 restore（补默认值），所以 `index` / `autoResize` / `elbowed` /
> `pressures` 等漏掉通常不致命，但按下面模板写全最省心。

## 文件骨架

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "present2me",
  "elements": [ ... ],
  "appState": { "viewBackgroundColor": "#ffffff" },
  "files": {}
}
```

查看器加载时会做 restore（补默认值），所以漏掉次要字段通常不致命，
但 `id` / `seed` / `versionNonce` 必须自备且全文件唯一，`type` / 坐标 / 尺寸必须正确。

写完后用 `<插件根>/tools/validate-excalidraw.mjs <file>` 机检：schema/枚举、
id/seed 唯一性、binding 双向登记、包围盒重叠、文字截断、容器内文字垂直居中都会自动查
（校验规格蒸馏自 0.18.1 类型，与本文档同一份标准；`--json` 输出机器可读格式）。
修旧的画板（文字贴容器顶）：`<插件根>/tools/fix-excalidraw-text.mjs <file>`（`--dry-run` 先看）。

## 通用字段（所有元素）

```json
{
  "id": "node-1",              // 全文件唯一，建议语义化: rect-1 / arrow-1 / txt-title
  "type": "rectangle",         // rectangle|ellipse|diamond|text|arrow|line|freedraw
  "x": 100, "y": 80,           // 左上角画布坐标
  "width": 160, "height": 60,
  "angle": 0,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "transparent",   // 容器常用: #a5d8ff 蓝 #b2f2bb 绿 #ffec99 黄 #ffc9c9 红粉 #d0bfff 紫
  "fillStyle": "hachure",      // solid|hachure|cross-hatch|zigzag
  "strokeWidth": 2,            // 1细 2常规 4粗
  "strokeStyle": "solid",      // solid|dashed|dotted
  "roughness": 1,              // 0规整 1艺术 2卡通
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "roundness": { "type": 3 },  // 圆角; 直线箭头可不写
  "seed": 158830,              // 任意整数，全文件唯一即可
  "version": 1,
  "versionNonce": 158830,      // 任意整数，与 seed 可相同
  "index": null,               // 可省，restore 会补
  "isDeleted": false,
  "boundElements": null,       // 被箭头/内嵌文字引用时: [{"id":"arrow-1","type":"arrow"},{"id":"txt-1","type":"text"}]
  "updated": 1700000000000,    // 毫秒时间戳，同一元素每次修改要变
  "link": null,
  "locked": false
}
```

## 各元素类型的专有字段

### text

```json
{
  "type": "text",
  "x": 130, "y": 95,            // 漂浮文字的左上角; 容器内文字按下方「容器内文字几何」算
  "text": "核心概念",
  "originalText": "核心概念",    // 必须与 text 一致
  "fontSize": 20,               // 标题 28~36, 正文 16~20
  "fontFamily": 5,              // 1 Virgil 手写(经典) 2 Helvetica 正常 3 Cascadia 代码
                                // 5 Excalifont 手写(当前默认,推荐) 6 Nunito 7 Lilita One
                                // 8 Comic Shanns 9 Liberation Sans
                                // 注意: 4 是历史遗留空号, 不存在; 中文自动走 Xiaolai 手绘回退
  "textAlign": "center",
  "verticalAlign": "middle",    // 容器内用 middle, 漂浮用 top
  "containerId": null,          // 放进形状时填形状的 id
  "autoResize": true,           // true=框随文字;  false=文字按 width 换行
  "lineHeight": 1.25
}
```

宽高：`width ≈ 字符数 × fontSize × 0.6`（中文按 1.0 估），`height ≈ 行数 × fontSize × lineHeight`。
估算偏大比偏小安全——**偏小会被查看器按包围盒裁切，开头或结尾可能整字消失**（实测：
标题实测宽 ~576 而 `width` 写了 520，首字母 `p` 完全不渲染）。拿不准就写宽 20%。

**容器内文字几何（手写必读）**：渲染器按文字元素自身的 `x`/`y` 落笔，**不会**替你垂直居中——
`verticalAlign: "middle"` 只影响文字块内部的多行分布。要让文字落在容器正中，必须自己算：

```js
const lines = text.split("\n").length;
const h = lines * fontSize * lineHeight;             // lineHeight 默认 1.25
text.width  = container.width;                       // 宽度给容器宽，水平靠 textAlign: "center" 居中
text.height = h;
text.x = container.x;
text.y = container.y + (container.height - h) / 2;   // 垂直居中全靠这一行
```

实测（0.18.1 查看器）：`height` 若误填成容器高度（例如 120），单行文字会贴到容器顶部；
按上式填则文字中心与容器中心偏差 ≤ 3px。旧画板已经写错的，用
`<插件根>/tools/fix-excalidraw-text.mjs <file>` 一次性批量修（不必逐个双击进编辑再退出）。

### rectangle / ellipse / diamond

无专有字段，靠通用字段。diamond 的 width/height 要给足（文字才放得下），建议 ≥ 200×90。

### arrow / line

```json
{
  "type": "arrow",
  "x": 260, "y": 110,           // 起点的画布坐标
  "width": 120, "height": 0,    // 包围盒
  "points": [[0, 0], [120, 0]], // 相对元素自身 x,y 的坐标
  "startBinding": { "elementId": "node-1", "focus": 0, "gap": 1 },
  "endBinding":   { "elementId": "node-2", "focus": 0, "gap": 1 },
  "startArrowhead": null,
  "endArrowhead": "arrow",      // arrow|bar|dot|circle|triangle|diamond（均可加 *_outline）|crowfoot_*; 无箭头用 null
  "elbowed": false,             // true = 肘形折线箭头（手写 JSON 保持 false）
  "lastCommittedPoint": null
}
```

- **绑定箭头**（推荐）：设 startBinding/endBinding 后，渲染器自动吸附到形状边缘，
  points 只需近似 `[[0,0],[终点x-起点x, 终点y-起点y]]`。被绑形状要加 boundElements。
  注意：普通箭头 binding 只有 elementId/focus/gap 三键；`fixedPoint` 只属于
  肘形箭头（elbowed: true），手写时**不要**给普通箭头加 `fixedPoint`。
- **漂浮箭头**：不写 binding，points 决定一切，终点箭头仍生效。

### freedraw（手绘笔迹）

```json
{ "type": "freedraw", "points": [[0,0],[10,3],[25,8]], "pressures": [], "simulatePressure": true, "lastCommittedPoint": null, ... }
```
一般不用；需要"圈重点"时可画一个近似圆的 points 序列。

## 常见坑

1. **id / seed 重复** → 元素互相覆盖或渲染异常。生成时用自增编号拼语义前缀。
2. **改元素不 updated** → 多数情况无碍，但养成每次修改更新时间戳的习惯。
3. **箭头 points 是相对坐标**（相对箭头自身 x/y），不是画布绝对坐标。
4. **容器内文字**必须同时：text 元素设 `containerId`，容器 boundElements 里登记该 text；
   几何还要按上面「容器内文字几何」自己算，否则文字贴容器顶
   （校验器报 `W_TEXT_VCENTER`；旧文件批量修用 `tools/fix-excalidraw-text.mjs`）。
5. **version**：文件级 `"version": 2` 是当前格式；元素级 version 从 1 起随便，改一次 +1。
6. 负数坐标合法，但尽量从 (100,100) 起排布，给画布留边。
7. 图片元素（type: image）需要 files 映射，一期不使用。
