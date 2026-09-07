# 讲解与可视化

本仓库的核心场景：让 Agent 向**你**解释一个概念，并在合适的时候用图演示。

## 讲解的默认结构

Agent 讲解时遵循「先直觉后严谨」：

1. **一句话本质 + 类比**（类比会标注边界：到哪里就不像了）
2. **机制分解**（组成 / 流程 / 因果链）
3. **对比锚定**（与已知概念比同异）
4. **边界与误区**（什么时候不成立）

一次只讲一个层次，你追问再深入。中文交流，术语首现给英文。

## 可视化选型表

Agent 会按内容特征选形式，你也可以直接点名：

| 你想要 | 内容特征 | Agent 用什么 | 产物 |
|---|---|---|---|
| 精确结构图 | 流程/架构/时序/ER，结构确定 | **viz-d2** | `.d2` 源文件 + SVG |
| 手绘白板 | 概念关系、发散讨论、低正式感 | **viz-excalidraw** | `.excalidraw` 文件 |
| 顺带小图 | 聊天回复里的小示意 | mermaid 代码块 | 无文件 |
| 长文档/需批注 | 要留存、要协作评论 | lark-doc → 飞书 | 飞书文档 |
| 飞书白板 | 图要留在飞书协作 | lark-whiteboard | 飞书白板 |

**D2 vs Excalidraw 快速判断**：要自动布局、精确、正式 → D2；要手绘感、自由摆放、你想上去改 → Excalidraw。

## 用 D2 画图

```bash
# 写好 .d2 后（或让 Agent 写）：
bash tools/render-d2.sh tasks/我的任务/artifacts/图-v1.d2     # 渲染 SVG 并打开
bash tools/render-d2.sh -w 图.d2                            # 实时预览：改文件自动刷新
bash tools/render-d2.sh --png 图.d2                          # 输出 PNG（失败就用 SVG）
```

- 输出 SVG 与源文件同目录同名；`-w` 模式默认端口 4199（`D2_PORT` 可改）。
- 语法速查/模板在 `.agents/skills/viz-d2/references/`（人也能当手册读）。
- 主题试穿：`for t in 0 1 4 6 200; do d2 --theme-id $t 图.d2 t$t.svg; done && open t*.svg`

## 用 Excalidraw 画板

```bash
bash tools/excalidraw-viewer/open.sh demo/hello.excalidraw   # 也接受仓库根相对路径
bash tools/excalidraw-viewer/open.sh --stop                  # 停掉后台查看器服务
```

打开后是一个**完整可编辑的 Excalidraw 画板**：

- 顶栏显示文件路径；**黄点 = 有未保存修改，绿点 = 干净**。
- 你直接在画板上拖拽、增删、改字，点「保存 ⌘S」（或 Cmd/Ctrl+S）**写回同一个 `.excalidraw` 文件**。
- Agent 迭代前会重读文件——你改的东西不会丢，形成「Agent 画 → 你改 → Agent 继续」的循环。
- 服务只绑 127.0.0.1，端口 4173 起（被占自动顺延），文件访问限制在仓库内。
- `.excalidraw` 是纯 JSON，可 git 版本管理、可 diff。

## 产物放哪

| 场景 | 位置 |
|---|---|
| 任务进行中 | `tasks/<任务>/artifacts/<主题>-v<N>.d2/.excalidraw` |
| 随手问、无任务 | `scratch/<主题>-<MMDD>.<ext>`（gitignored） |
| 明确要留存 | `knowledge/insights/<主题>.md`（Agent 追加） |

版本号只增不改——旧版本是回溯与风格学习的原料。
