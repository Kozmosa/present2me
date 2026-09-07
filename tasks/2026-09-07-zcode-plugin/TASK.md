---
status: done
created: 2026-09-07
---

# 任务：present2me 改造为 ZCode 插件（同仓库双角色）+ Codex 适配

## 目标（用户原话）

> "我们能否把present2me添加一个release发布渠道为一个zcode plugin？先评估"
> "好的，我们开始改造，认可先同仓库双角色"
> "目前项目中已经有zcode的plugin适配，研究一下能否再增加一个codex的插件适配？"
> "开始吧"

## 方案（已确认）

仓库根放 `marketplace.json`，插件体放 `plugins/present2me/`，GitHub 仓库本身即
插件市场（marketplace）。安装路径：设置 → 插件 → 添加市场 `Kozmosa/present2me`。
发布流程：同步 plugin.json 与 marketplace.json 两处版本 → commit → tag（`make release`）。

评估产物：`scratch/p2m-plugin-assess.d2`（结构图）。

## 关键设计决定

1. **单一事实源在插件目录**，仓库根用软链回接（沿用 `.claude/skills` 先例）：
   - `.agents/skills` → `../plugins/present2me/skills`
   - `workflows` → `plugins/present2me/workflows`
   - `tools/{render-d2.sh,status.sh,siyuan-token.sh,excalidraw-viewer}` → 插件内真身
   - `config/tools.yaml` → 插件内真身
   - `tools/docs.sh` 留在根（依赖根 `mkdocs.yml`，属工作区面）
2. **脚本软链解析**：搬移的脚本把 `REPO_ROOT` 改为 `PLUGIN_ROOT` 并用 `cd -P`
   解析物理路径，root 软链调用与插件安装两种上下文都指向插件根。
3. **查看器服务改根**：`server.mjs` 增加 `P2M_SERVE_ROOT` 环境变量（默认保持
  旧行为），`/viewer/` 前缀从查看器目录出静态资源，其余路径从 SERVE_ROOT 出；
   `open.sh` 以调用者 CWD 为 SERVE_ROOT，健康检查校验 root 匹配才复用服务。
4. **workflows 包装为命令**：commands/{quick-explain,study-paper,blog-cowrite}.md
   + `p2m-setup.md`（依赖预检：d2/node/viewer 构建）。
5. **版本双写**：`make release VERSION=x.y.z` → tools/release.sh 同步
   `.zcode-plugin/plugin.json` 与根 `marketplace.json` 条目版本，commit + tag。
6. **不提交不推送**：本次只改工作区（git mv 会留下暂存的 rename），commit/tag/push
   由用户决定。

## 当前状态

- [x] 评估并确认方案 A（同仓库双角色）
- [x] 开任务文件夹
- [x] plugins/present2me/ 建骨架（plugin.json / skills / tools / workflows / config / commands）
- [x] 仓库根软链回接 + 脚本 PLUGIN_ROOT 化 + server.mjs/open.sh 改根
- [x] marketplace.json + Makefile release 目标 + tools/release.sh
- [x] 技能与 workflows 文本插件根感知改写
- [x] AGENTS.md / README / setup.sh / docs / .gitignore / tools.yaml 更新
- [x] 验证：语法检查、status.sh/demo 渲染/查看器端到端（含回写）、release-check、docs 构建、清单合规自测
- [x] session-log 追加
- [x] Codex 适配（2026-09-07 扩展）：`.agents/plugins/marketplace.json` +
      plugin.json 补 interface；命令文件去 `$ARGUMENTS`（Codex 迁移会静默丢弃
      含它的命令）；本机 codex-cli 0.153.4 端到端实测通过（4 技能 + 4 命令
      技能在仓库外会话全部列出）；文档同步（AGENTS.md 硬性协议第 8 条、README、
      docs/getting-started、docs/agents）
- [x] 用户 UI 自测：本地市场安装（设置→插件→添加市场→本仓库路径）
  （Agent 已完成命令行侧全量验证；UI 手测仍建议用户走一次）
- [x] 首个发版：commit 2972ad6（双市场改造）→ 8900d17（release v0.1.0）→
      tag v0.1.0 已推送 GitHub；Codex 官方渠道（SSH 源 clone）端到端复验通过
      （4 技能 + 4 命令技能全部迁移生效），验证后测试市场已清理

## 产物

| 产物 | 位置 |
|---|---|
| 评估结构图 | scratch/p2m-plugin-assess.d2（+svg） |
| Codex 评估结构图 | scratch/p2m-codex-plugin-assess-v1.d2（+svg） |
| 插件体 | plugins/present2me/ |
| ZCode 市场清单 | marketplace.json（根） |
| Codex 市场清单 | .agents/plugins/marketplace.json |
| 发版脚本 | tools/release.sh + Makefile release 目标 |

## 挂账 / 风险

- **License 未定**：仓库无 LICENSE 文件，plugin.json 暂不声明 license（发布公开
  市场前建议补）。
- **语料隐私**：仓库 public，knowledge/ 未来增长即公开（协议"只增不改"）。
  选项：留公开 / 挪 private 仓库 / gitignore——需用户拍板，本任务不动。
- **查看器多根共存**：`.server.pid/.server.port` 单份，跨工作区多服务时只记最新
  （root 不匹配会自动起新端口，功能不受影响，`--stop` 只停最新）。v1 已知限制。
- **插件安装态 status**：插件用户跑 status.sh 时状态写在插件缓存目录
  （插件更新会丢，重跑即恢复）。

## 相关链接

- ZCode 插件文档：https://zcode.z.ai/cn/docs/plugin
- 仓库：https://github.com/Kozmosa/present2me

## 时间线

| 日期 | 事件 |
|---|---|
| 2026-09-07 | 任务创建；完成评估，用户确认方案 A，开始改造 |
| 2026-09-07 | ZCode 改造完成；评估并落地 Codex 适配（用户确认），端到端实测通过 |
| 2026-09-08 | 发版 v0.1.0（commit + tag 已推送）；GitHub 源 Codex 安装复验通过；测试市场清理；任务完结 |
