---
name: viz-d2
description: 用 D2 DSL 画图并渲染给用户看。当用户说"画个图""流程图""架构图""时序图""ER 图""用 D2/dtwo"，或在讲解中需要精确、自动布局的结构化示意图时，使用本技能。产出 .d2 源文件 + SVG，自动打开浏览器呈现，支持迭代修改与实时预览。
version: 0.1.0
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

1. 确定图要回答的问题（一张图只讲一件事）
2. 写 `.d2` 源文件。输出位置：
   - 有任务上下文 → `tasks/<活跃任务>/artifacts/<主题>-v<N>.d2`
   - 无任务上下文 → `scratch/<主题>-v<N>.d2`
3. 渲染并打开（脚本在本技能所在插件的 `tools/` 下；present2me 仓库内根目录
   `tools/render-d2.sh` 为软链，可直接用）：
   ```bash
   <插件根>/tools/render-d2.sh <file.d2>     # 渲染 SVG 并用默认浏览器打开
   <插件根>/tools/render-d2.sh -w <file.d2>  # 实时预览模式（改文件自动刷新）
   ```
4. 根据用户反馈直接改 `.d2` 再渲染。**源文件即真相**，不要只改 SVG。
5. 若图已定稿且用户需要，可推送飞书（走 lark-doc / lark-whiteboard）。

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
- 图超过 ~25 个节点时先出骨架图给用户确认，再补细节。
- d2 未安装时提示用户：`brew install d2`（present2me 仓库内可 `./setup.sh`；
  插件用户可走 `/p2m-setup` 命令），不要自行尝试其他安装方式。
