# 任务文件夹（隔离上下文协议）

## 为什么

长任务（精读一篇论文、写一篇博客）的上下文不该活在聊天记录里——换个 Agent、开个新会话就断了。
本仓库的解法：**一个任务一个文件夹，TASK.md 是唯一上下文锚点**。任何 Agent 进来先读它，就能无缝续上。

## 目录结构

```
tasks/2026-09-07-transformer-attention/
├── TASK.md           # 锚点：目标（用户原话）/状态/产物清单/相关链接/时间线
├── session-log.md    # 会话日志（追加制：每次会话做了什么、下次从哪继续）
├── sources/          # 你的原始输入（PDF/链接/口述记录）——只读
├── artifacts/        # 中间产物：.d2 / .excalidraw / draft-vN.md / svg
└── insights/         # 最终产出：insights.md / qa.md
```

命名：`tasks/YYYY-MM-DD-<英文小写连字符slug>/`。模板在 `tasks/_template/`。

## 生命周期

### 创建

对 Agent 说目标 + 丢文件即可，它会执行：

```bash
cp -R tasks/_template tasks/$(date +%F)-<slug>
# PDF 放 sources/，TASK.md 填 status: active 和你的目标原话
```

「目标（用户原话）」逐字记录、不转述——这是判断"做没做完"的最终依据。

### 推进（每次会话）

- **会话开始**：Agent 列出 `tasks/` 下 status 为 active 的任务，与你确认推进哪个。
- **会话结束**：Agent 更新 TASK.md（勾选状态、补产物清单和链接），并向 session-log.md 追加一节。

### 暂停 / 完结

- 暂停：TASK.md 改 `status: paused`，Agent 不会自动接续。
- 完结（**需要你确认**）：`status: done` → 整目录移入 `archive/` →
  有价值的洞见提炼进 `knowledge/insights/<slug>.md`；博客类任务额外走[风格沉淀](workflows.md)。

## 状态语义

| status | 含义 |
|---|---|
| `active` | 进行中，会话默认接续对象 |
| `paused` | 明确暂停 |
| `done` | 已归档（移入 archive/ 即视为 done） |

## 规矩（Agent 侧强制，人侧建议）

1. `sources/` 只读；要加工就复制到 `artifacts/`。
2. draft-vN 版本序列只增不改不删。
3. 进行中的工作不落在 `tasks/` 之外（`scratch/` 仅限无任务的临时讲解产物）。
4. 换 Agent 接手不需要交接文档——新 Agent 读 TASK.md + session-log.md 即可。
