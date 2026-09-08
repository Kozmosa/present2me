# D2 主题与视觉风格

## 三种设置方式

```d2
# 1. 写在文件里（推荐，随源文件走）
vars: {d2-config: {theme-id: 4}}

# 2. 手绘风
vars: {d2-config: {sketch: true}}
```

```bash
# 3. 命令行临时覆盖
d2 --theme 200 in.d2 out.svg      # 换主题（注意是 --theme，没有 --theme-id）
d2 --dark-theme 5 in.d2 out.svg   # 浏览器暗色模式下用主题 5（源文件里写不了暗色）
d2 --sketch in.d2 out.svg         # 手绘
```

> v0.8.2 实测：`d2-config` 里**没有** `dark: true` 这个配置（编译报错），
> 暗色只走 `--dark-theme` 命令行；`d2 themes` 可列出全部主题。

## 常用主题编号（经验值）

| theme-id | 风格 | 适用 |
|---|---|---|
| 0 | Neutral default（默认中性） | 通用、打印 |
| 1 | Neutral greyscale | 黑白文档、论文 |
| 4 | Aubergine（茄紫） | 深色系演示 |
| 5 | Dark Slate | 暗色页面 |
| 6 | Shirls | 讲解、轻快 |
| 100+ | 彩色系列 | 想换口味时 |

主题的最终效果以渲染为准。**快速试主题**：

```bash
for t in 0 1 2 4 5 6 200 300; do d2 --theme $t 图.d2 theme-$t.svg; done
open theme-*.svg
```

完整主题画廊见官方文档：https://d2lang.com/tour/themes

## 风格建议（面向"讲给人看"）

- 讲解场景：`sketch: true` + 浅色主题，降低正式感、提高亲和力。
- 论文/博客配图：`theme-id: 1`（灰度）或 0，保证黑白打印可读。
- 强调路径：`style.animated: true` 让关键流向动起来。
- 节点超过 15 个：开 `layout-engine: elk`，dagre 容易挤成一团。
- 中文字号默认偏小，全局放大：`vars: {d2-config: {}}` 不支持全局字号时，用 classes 统一 `style.font-size: 18`。
