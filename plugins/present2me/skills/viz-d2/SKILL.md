---
name: viz-d2
description: 用 D2 DSL 画图并渲染给用户看。当用户说"画个图""流程图""架构图""时序图""ER 图""用 D2/dtwo"，或在讲解中需要精确、自动布局的结构化示意图时，使用本技能。产出 .d2 源文件 + SVG，自动打开浏览器呈现，支持迭代修改与实时预览。
version: 0.2.0
metadata:
  requires:
    bins: [d2]
---

# viz-d2 — D2 结构图绘制

## 选型：什么时候用 D2

| 场景 | 用 D2？ |
|---|---|
| 流程 / 管道 / 架构 / 时序 / ER / 类图——结构确定、要精确 | ✅ 本技能 |
| 概念关系图、自由讨论白板、手绘感草图 | ❌ 用 `../viz-excalidraw/SKILL.md` |
| 聊天回复里顺带的小图（无需单独打开） | ❌ 直接写 mermaid 代码块 |
| 需要长期留存在飞书里协作批注 | 画完后由 lark-doc / lark-whiteboard 技能推送 |

## 标准流程

0. **工具链自检**（每次开工第一步，先跑再画图）：
   ```bash
   command -v d2 && d2 --version    # 本技能全部写法在 d2 v0.8.2（2026-09-08）实测
   ```
   - 未安装 → 提示用户安装（`brew install d2`；present2me 仓库内 `./setup.sh`；
     插件用户 `/p2m-setup`），**不要自行尝试其他安装方式**。
   - 版本低于 v0.8.2 → 继续用，但只写「已验证写法」与 references 里的保守
     写法，不脑补新版本语法。
1. 确定图要回答的问题（一张图只讲一件事）。
2. **大图骨架先行**：预计 >15 个节点或层级超过 2 层 → 先写容器 + 主干边的
   骨架，渲染确认布局，再分批填充细节；每批填充后立即渲染，不要攒到最后
   一次性渲染。小图（<15 节点）一次写完即可。
3. 写 `.d2` 源文件。输出位置：
   - 有任务上下文 → `tasks/<活跃任务>/artifacts/<主题>-v<N>.d2`
   - 无任务上下文 → `scratch/<主题>-v<N>.d2`
4. 渲染并打开（脚本在本技能所在插件的 `tools/` 下；present2me 仓库内根目录
   `tools/render-d2.sh` 为软链，可直接用）：
   ```bash
   <插件根>/tools/render-d2.sh <file.d2>        # 渲染 SVG 并打开
   <插件根>/tools/render-d2.sh -w <file.d2>     # 实时预览（改文件自动刷新）
   <插件根>/tools/render-d2.sh --png <file.d2>  # 同时产出 PNG（视觉评审/贴文档用）
   ```
5. 根据用户反馈直接改 `.d2` 再渲染。**源文件即真相**，不要只改 SVG。
6. 若图已定稿且用户需要，可推送飞书（走 lark-doc / lark-whiteboard）。

## 铁律：语法困惑禁止脑内推演

对某个写法合不合法有疑问时，**不要反复推理验证**——渲染器是唯一权威，
d2 报错会带行列号，秒级反馈：

- 直接写下去、立即渲染；报错就按行列号改。
- 只想快速确认语法、不想出图时：`d2 validate file.d2`（报错带行列号；
  注意它以输出为准，退出码不看）。
- 想试错时，把可疑的几行放进临时小文件单独渲染，不要污染主文件。
- 推理很贵，渲染免费。

## 已验证写法（d2 v0.8.2 实测全部编译通过）

```d2
# ── 节点：标签与属性的组合 ──
a: 裸标签
b: "含空格/括号/斜杠的标签（必须加引号）"
c: 未引号标签 {shape: cylinder}              # ✅ 裸标签 + 行内属性
d: {label: "多行\n标签"; shape: cylinder}    # ✅ map 写法，属性用分号/换行分隔

# ⚠️ 两个高频坑（实测编译失败）：
#  "引号标签" 后不能直接跟 {属性}：
#    e: "标签" {shape: cylinder}   ❌ unexpected text after double quoted string
#  属性之间不能用逗号（逗号不是 map 分隔符）：
#    {shape: cylinder, style.fill: honeydew}   ❌
#    {shape: cylinder; style.fill: honeydew}   ✅（分号或换行）

# ── 边：标签和属性可以同时写 ──
a -> b: 请求 {style.animated: true}    # ✅
a -> b: {style.stroke-dash: 3}         # ✅ 只有属性时冒号后直接 {}

# ── 定位：near 合法常量 ──
标题: {shape: text; near: top-center; label: "标题"}
图例: {shape: text; near: bottom-left; label: "图例"}
# near 取值：top-left / top-center / top-right
#           center-left / center-right
#           bottom-left / bottom-center / bottom-right
# v0.8.2 只支持常量；早期的 b.near: a（相对某节点）已移除，不要写

# ── 其他实测结论 ──
# x: |md ...| {shape: text}   ✅ 块字符串后可以接行内属性
# 中英文 Unicode 键名合法；避免用 vars / classes / layers 作普通 key
```

## 语法最小集（20% 常用）

```d2
direction: right                  # 全局布局方向: right / down

用户 -> 网关: 请求                 # 连接 + 标签
网关.认证: {shape: diamond}        # 嵌套容器 + 形状
网关.路由 -> 服务A                 # 子形状同样可连接

数据库: {                         # 块写法
  shape: cylinder
  style.fill: honeydew
}
服务A -> 数据库: {style.animated: true}   # 动画连接线

vars: {                           # 全局配置（推荐每个图都带）
  d2-config: {
    layout-engine: elk            # 复杂图用 elk，布局更均匀
    theme-id: 4                   # 主题编号
    sketch: false                 # true = 手绘风
    pad: 40
  }
}
```

进阶语法（形状清单、样式表、markdown/latex 标签、sql_table、grid、layers）
按需查阅 references，**不要预先全部读取**。

## 路由表

| 需要什么 | 读哪个文件 |
|---|---|
| 具体形状类型、样式、连接线箭头、图标 | `references/d2-cheatsheet.md` |
| 现成模板：流程图 / 时序图 / 架构图 / C4 / 对比图 | `references/d2-recipes.md` |
| 主题与视觉风格（含暗色、手绘模式） | `references/d2-themes.md` |

## 注意

- `icon:` 引用远程 URL 需要联网，离线环境避免使用。
- d2 未安装时的处理见标准流程第 0 步。
