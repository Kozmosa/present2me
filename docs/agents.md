# 多 Agent 接入指南

本仓库的技能放在 `.agents/skills/`（跨 Agent 事实标准路径）。各 Agent 的发现机制不同，接入方式如下。

## 接入一览

| Agent | 接入方式 | 技能自动触发 | 说明 |
|---|---|---|---|
| ZCode | 在本目录打开/启动会话 | ✅ | 原生扫描 `.agents/skills/`，自动读 AGENTS.md |
| Codex（CLI/IDE/Desktop） | 在本目录启动 | ✅ | 官方 REPO scope 就是 `.agents/skills/`（从 cwd 向上到仓库根） |
| Claude Code | 在本目录启动 | ✅ | 经 `.claude/skills → ../.agents/skills` 软链发现；CLAUDE.md 引用 AGENTS.md |
| Claude Desktop | 授予本目录的文件访问 | ❌ | 技能是账号级上传，不吃仓库路径；用降级方案 |
| ChatGPT App | 同上（文件/文件夹连接器） | ❌ | 同上 |

## 原理：技能是怎么被发现的

- **ZCode** 发现顺序（先到先得，同名先赢）：用户级 `~/.zcode/skills` → `~/.agents/skills` → 项目 `.zcode/skills` → **项目 `.agents/skills`** → 插件。
- **Codex**：REPO scope = `$CWD/.agents/skills`（逐级向上到 repo root）；USER scope = `~/.agents/skills`。显式跟随软链。
- **Claude Code**：只认 `.claude/skills/`（个人级在 `~/.claude/skills`）。本仓库用一行软链桥接：

  ```bash
  ls -l .claude/skills
  # .claude/skills -> ../.agents/skills   （setup.sh 自动确保存在）
  ```

  注意：git 存储的是符号链接本身，Windows 协作者克隆后软链可能失效，需手动重建。
- 技能格式遵循 Agent Skills 开放规范（SKILL.md + YAML frontmatter），带 `references/` 按需加载，跨 Agent 通用。

## 降级方案（Claude Desktop / ChatGPT 等无仓库技能的 Agent）

这些 Agent 无法自动触发 `.agents/skills`，但**一切能力都不依赖魔法**：

1. 让它读 `AGENTS.md`（行为协议）+ `workflows/<某流程>.md`（照步骤执行）。
2. 需要技能细节时，让它直接读 `.agents/skills/<名>/SKILL.md` 及其 `references/`。
3. 可视化/状态检查全部是命令行脚本，任何能跑 shell 的 Agent 都能执行：

   ```bash
   bash tools/status.sh                          # 工具状态
   bash tools/render-d2.sh 图.d2                 # D2 渲染并打开
   bash tools/excalidraw-viewer/open.sh 板.excalidraw  # 打开画板
   ```

## 本仓库的四个技能

| 技能 | 触发场景 | 干什么 |
|---|---|---|
| `explain-concept` | "给我讲讲 X" "什么是 X" | 讲解编排：四层结构 + 可视化选型路由 |
| `viz-d2` | "画个流程图/架构图/时序图" | 写 .d2 → 渲染 SVG → 打开 → 迭代 |
| `viz-excalidraw` | "画个白板" "手绘图" "概念图" | 手写 .excalidraw JSON → 查看器打开（可保存回写） |
| `task-context` | 新任务/续任务 | tasks/ 文件夹协议（见 [任务文件夹](tasks.md)） |

飞书相关操作依赖你机器上已安装的用户级 lark 技能（lark-doc 等，位于 `~/.agents/skills/`）。

## 常见问题

- **技能没被触发？** 确认会话的工作目录在仓库内（ZCode/Codex 从 cwd 向上找 `.agents/skills`）；改完技能文件后新开会话生效。
- **Claude Code 看不到技能？** 检查 `.claude/skills` 软链是否存在（`./setup.sh` 会自动修复）。
- **想临时禁用某技能？** ZCode：项目 `.zcode/config.json` 里按绝对路径 `enable: false`；Codex：`~/.codex/config.toml` 的 `[[skills.config]]`。也可直接把技能目录移出 `.agents/skills/`。
