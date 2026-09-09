---
description: present2me 依赖预检（d2/mmdc/node/viewer 构建/工具授权状态），缺什么补什么
---

对 present2me 插件做一次依赖预检并按需修复。

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
5. **node/npm 缺失时**：提示安装 Node.js（brew install node），跳过步骤 3 和 mmdc 安装。
6. 挂账工具（Anki/思源/Notion/Flomo/GDocs）不强求开通，只提示手册位置：
   https://github.com/Kozmosa/present2me/tree/main/config/setup-docs
7. 复跑 `tools/status.sh` 确认 viz 类工具全部 ✅，汇总结果给用户。

注意：任何步骤都不打印密钥/token；状态文件写在插件目录 config/ 下。
