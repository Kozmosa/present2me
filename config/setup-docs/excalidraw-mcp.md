# Excalidraw MCP 接入手册（官方 excalidraw-mcp，挂账评估中）

> 状态：**挂账**。已调研未接入。仓库：https://github.com/excalidraw/excalidraw-mcp

## 它是什么

官方出品的 MCP **App** 服务器：模型把 Excalidraw 元素 JSON 交给它，它在聊天窗口内
流式渲染出可交互画板（镜头推拉、全屏编辑）。工具集：

| 工具 | 作用 |
|---|---|
| `read_me` | 返回给模型的绘图 cheat sheet |
| `create_view` | 渲染交互画板视图（MCP Apps UI） |
| `export_to_excalidraw` | **上传 excalidraw.com 返回分享链接** |
| `save_checkpoint` / `read_checkpoint` | 保存/恢复用户在画板上的手改状态 |

## 三个注意（接入前必须想清楚）

1. **远程托管版是第三方服务**：官方提供 `https://mcp.excalidraw.com` 远程端点，
   画板内容经过对方服务器；`export_to_excalidraw` 会**把图上传到
   excalidraw.com 生成公开链接**。涉及未公开内容时不要走远程端点、不要调导出。
2. **依赖 MCP Apps 扩展**：交互视图需要客户端支持
   [MCP Apps](https://modelcontextprotocol.io/docs/extensions/apps)。
   客户端不支持时 `create_view` 退化为不可读的资源链接——**ZCode 当前按不支持对待**
   （以实测为准）。
3. **不替代本工作区的文件流**：viz-excalidraw 技能的产物是
   `tasks/*/artifacts/`、`scratch/` 下的 `.excalidraw` 文件（可 git 版本管理、
   本地查看器可回写）。MCP 的画板是聊天内临时视图，**不落盘**；两者是互补的
   呈现渠道，不是替代关系。

## 开通（本地构建，仅在决定接入后执行）

```bash
git clone https://github.com/excalidraw/excalidraw-mcp ~/.config/present2me/excalidraw-mcp
cd ~/.config/present2me/excalidraw-mcp
pnpm install && pnpm run build
```

然后按客户端配置 MCP（stdio）：

```json
{
  "mcpServers": {
    "excalidraw": {
      "command": "node",
      "args": ["$HOME/.config/present2me/excalidraw-mcp/dist/index.js", "--stdio"]
    }
  }
}
```

ZCode 的 MCP 配置入口以 `zcode` 客户端文档为准（本会话日志里的 MCP 连接走
客户端配置，不在仓库内保存任何凭据）。

## 验证

```bash
test -f ~/.config/present2me/excalidraw-mcp/dist/index.js && echo OK
# 接入客户端后：让模型"画一个三节点概念图"，能出交互视图即通；
# 再跑 bash tools/status.sh 应为 ✅
```

## 与本工作流的结合（评估意见，未定案）

- 讲解场景仍以 viz-excalidraw 技能 + 本地查看器为主（文件即真相）。
- 若接入，定位限定为"聊天内快速草图/镜头演示"；产物需要留存时，把最终
  elements 落盘成 `.excalidraw` 文件再走本地查看器。
- `export_to_excalidraw` 属外部写入，按工作区协议须先告知用户再调用。
- **2026-09-08 评估结论：暂不需要自建本地 MCP server**。能力检测在当前
  实际客户端（ZCode / Claude Code，均不支持 MCP Apps）上恒为"否"，收益为零；
  画板校验用本地脚本（node validate-excalidraw.mjs，待做）即可，比 MCP 更可移植。
  重启本决策的触发条件：实际工作流中出现支持 MCP Apps 的客户端。
