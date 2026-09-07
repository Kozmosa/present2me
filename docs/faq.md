# 常见问题（FAQ）

## Excalidraw 画板一直显示「加载中…」

`viewer.js` 没构建成功。跑：

```bash
cd tools/excalidraw-viewer && npm install && npm run build
```

构建成功后刷新页面。排查时可在页面控制台看 `window.__p2mErrs`（index.html 内置了错误收集）。

## 画板上改了但「保存」没反应 / 保存失败

- 保存按钮是灰的：没有未保存修改（初始加载不算脏）。
- 保存失败弹 HTTP 错误：确认服务健康 `curl http://127.0.0.1:4173/api/health`；
  文件必须在**仓库目录内**（服务限制），且以 `.excalidraw` 结尾。
- 服务没起：`bash tools/excalidraw-viewer/open.sh <文件>` 会自动拉起。

## 我在画板上保存了，Agent 怎么不知道？

协议如此：Agent 每次迭代前**重读文件**。如果它基于记忆改图，直接提醒它"先重新读文件"。

## `d2: command not found`

```bash
brew install d2        # 或 ./setup.sh
```

## status.sh 里 lark-cli 显示 ❌

重新授权：

```bash
lark-cli auth login    # 设备码流程，扫码/打开验证 URL
lark-cli whoami        # 验证
```

## D2 输出 PNG 失败

用 SVG（默认）。PNG 依赖额外渲染路径，SVG 在浏览器/Quick Look 里都能看，还更小。

## 技能没有被 Agent 触发

1. 会话工作目录必须在仓库内（发现机制从 cwd 向上找 `.agents/skills`）。
2. Claude Code：确认 `.claude/skills` 软链存在（`./setup.sh` 自动修复）。
3. 技能文件是改过的？新开会话生效。
4. Claude Desktop / ChatGPT 本来就不支持仓库技能——让它读 `AGENTS.md` + `workflows/*.md` 照做（见 [多 Agent 接入](agents.md)）。

## 端口冲突

- Excalidraw 查看器：4173 起被占会自动顺延（4174/4175/4176/4180/4190）。
- D2 实时预览：`D2_PORT=5000 bash tools/render-d2.sh -w 图.d2`。

## 查看器服务怎么彻底停掉

```bash
bash tools/excalidraw-viewer/open.sh --stop
```

它会杀掉后台服务进程（PID 记录在 `tools/excalidraw-viewer/.server.pid`）。
忘停也无妨：服务只绑 127.0.0.1，重启电脑后自然消失。

## 任务文件夹里的 PDF 会不会进 git？

会（tasks/ 不在 .gitignore 里）。放敏感材料前自己权衡；或临时把该目录加进 `.gitignore`。

## Windows 协作者克隆后 Claude 技能失效？

`.claude/skills` 是符号链接，Windows 下可能不生效。让对方手动复制目录，或用 `mklink /D` 重建。

## 我想让 Agent 别碰某个工具

`config/tools.yaml` 删掉该条目（status 不再显示），或在 AGENTS.md 的协议里加一条禁令。
