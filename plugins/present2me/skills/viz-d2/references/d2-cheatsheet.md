# D2 语法速查

## 形状类型（shape: xxx）

| 形状 | 值 | 典型用途 |
|---|---|---|
| 矩形（默认） | `rectangle` | 通用节点 |
| 圆角矩形 | `rectangle` + `style.border-radius: 8` | 现代 UI 风格 |
| 正方形 | `square` | 对称布局 |
| 圆 / 椭圆 | `circle` / `oval` | 起止点、概念 |
| 圆柱 | `cylinder` | 数据库（配 `style.3d: true` 更立体） |
| 菱形 | `diamond` | 判断 / 决策 |
| 平行四边形 | `parallelogram` | 输入 / 输出 |
| 六边形 | `hexagon` | 状态、环境 |
| 文档 | `document` | 文档、报告 |
| 人 | `person` | 角色、用户 |
| 文本 | `text` | 无边框注释文字 |
| 代码块 | `code` | 配置、日志片段 |
| 类图 | `class` | UML 类 |
| 数据表 | `sql_table` | ER 图 |
| 时序图 | `sequence_diagram` | 交互时序（见 recipes） |
| 图片 | `image` + `icon: <url或路径>` | 图标化节点 |

## 样式（style.xxx）

```
style.fill: honeydew              # 填充色（色名或 #hex）
style.stroke: "#0d3b66"
style.stroke-width: 2
style.stroke-dash: 4              # 虚线
style.font-size: 20
style.font-color: midnightblue
style.opacity: 0.5
style.bold: true / style.italic / style.underline
style.shadow: true
style.multiple: true              # 双边框（强调）
style.animated: true              # 连接线流动动画（仅连接线）
```

## 连接线

```d2
a -> b: 标签
a <-> b                            # 双向
a -> b: {style.stroke-dash: 3}     # 虁线
a -> b: {target-arrowhead: {shape: none}}    # 去掉箭头变成线
a -> b: {source-arrowhead: {shape: diamond}} # 起点箭头
```

箭头形状可选：`none` `triangle` `arrow` `diamond` `circle`。

```d2
a.* -> b                           # glob：a 的所有子形状连到 b
```

## 标签进阶

```d2
x: |md
  ## 标题
  **加粗** 与 `代码`，支持列表
|
y: |latex \\frac{a}{b}|            # 数学公式
x.label: "第一行\\n第二行"          # 换行
```

## 嵌套与布局

```d2
前端: {
  direction: right                # 容器内独立方向
  web: Web 应用
  mobile: App
}
后端.服务A -> 前端.web             # 跨容器连接（用完整路径）
b.near: a                         # 相对定位：b 挨着 a 放
对比板: {
  grid-columns: 2                 # 网格布局（也可 grid-rows）
  方案一: {...}
  方案二: {...}
}
```

## 复用：classes

```d2
classes: {
  service: {style.fill: "#e8f4f8", shape: rectangle}
  store: {shape: cylinder, style.fill: honeydew}
}
svc1: {class: service}
db1: {class: store}
```

## sql_table（ER 图）

```d2
users: {
  shape: sql_table
  id: int {constraint: primary_key}
  name: varchar
  org_id: int {constraint: foreign_key}
}
users.id -> orgs.id
```

## 多页图：layers / scenarios / steps

```d2
layers: {
  总览: {...}
  细节: {...}
}
scenarios: {                      # 同一底图的不同变化
  正常流程: {...}
  异常流程: {...}
}
steps: {                          # 分步演示（CLI 可按 step 渲染）
  1: {...}
}
```

渲染某一层：`d2 --layer 细节 in.d2 out.svg`

## 其他要点

- `link: https://...` 给形状加超链接（渲染到 SVG 的可点击链接）。
- 注释：`#` 开头行。
- `d2 fmt file.d2` 可格式化源文件。
- 图标站：icons.terrastruct.com（`icon: https://icons.terrastruct.com/essentials/xxx.svg`），需联网。
