---
description: present2me 依赖预检 + p2m-server MCP 注册（向 Claude Code / Codex 等客户端注册渲染服务门面并做健康检查），缺什么补什么
---

为 present2me 插件完成一次性接入：依赖预检 → 服务健康检查 → 注册 MCP 门面。

定位插件根：本插件（present2me）的安装目录；在 present2me 仓库内开发时为
`plugins/present2me/`。可从本插件任一技能（如 explain-concept）的加载路径推断。

步骤：

1. **状态总览**：运行 `bash <插件根>/tools/status.sh`，向用户展示 ✅/❌ 表格。
2. **d2 缺失时**：向用户说明将执行 `brew install d2`，确认后安装
   （不擅自安装；无 brew 时给出 https://d2lang.com/tour/install 手动指引）。
3. **mmdc 缺失时**：建议执行 `npm install -g @mermaid-js/mermaid-cli`；说明它用于 Mermaid 中文图的本地编译检查，确认后安装。
4. **Excalidraw 查看器未构建时**（`<插件根>/tools/excalidraw-viewer/viewer.js`
   不存在）：确认后在 `<插件根>/tools/excalidraw-viewer/` 执行
   `npm install --no-fund --no-audit && npm run build`。
5. **node/npm 缺失时**：提示安装 Node.js ≥20（brew install node）；p2m-server 与 MCP 门面依赖它。
6. **服务健康检查**：运行 `bash <插件根>/tools/app/p2m.sh ensure`——
   应在数秒内输出端口号（默认 4173，按需自动拉起单例）。失败时查看
   `<插件根>/tools/app/.server.log` 向用户报告原因。
7. **注册 MCP 门面**（写入的是用户级客户端配置，属外部副作用——先向用户
   说明将写什么，确认后执行）：
   - Claude Code（检测到 `claude` 命令时）：
     ```
     claude mcp add --scope user present2me -- node <插件根>/tools/app/mcp.mjs
     ```
   - Codex（检测到 `~/.codex/config.toml` 时）：在文件中追加
     ```toml
     [mcp_servers.present2me]
     command = "node"
     args = ["<插件根>/tools/app/mcp.mjs"]
     ```
     已存在同名条目则比对更新，不重复追加。
   - 其他客户端（ZCode 等）：给出 stdio 启动命令
     `node <插件根>/tools/app/mcp.mjs`，请用户在客户端的 MCP 设置界面手动添加。
8. **注册验证**：对已注册客户端用其列表命令确认（如 `claude mcp list`）；
   有条件时调用一次 `status` 工具验证端到端连通。
9. 挂账工具（Anki/思源/Notion/Flomo/GDocs）不强求开通，只提示手册位置：
   https://github.com/Kozmosa/present2me/tree/main/config/setup-docs
10. 复跑 `tools/status.sh` 确认 viz 类工具全部 ✅，汇总结果给用户。

注意：任何步骤都不打印密钥/token；状态文件写在插件目录 config/ 下。
