# Google Docs 接入手册

最重的一个接入（Google Cloud OAuth），按需开通，不急。

## 路线选择

| 路线 | 成本 | 说明 |
|---|---|---|
| A. 官方 API + OAuth 桌面应用凭据 | 高 | GCP 建项目、启用 Docs/Drive API、OAuth 同意屏、desktop client 凭据 |
| B. 现成 MCP（如社区 google-workspace MCP） | 中 | token 交给 MCP 进程，Agent 经 MCP 读写 |
| C. 浏览器自动化（computer-use 类技能） | 低 | 无 API，但脆弱且慢，只适合兜底 |

建议先 B 后 A；C 仅救急。

## 路线 A 步骤概要

1. https://console.cloud.google.com 新建项目（如 `present2me`）。
2. 启用 **Google Docs API** 与 **Google Drive API**。
3. OAuth 同意屏（External，测试用户加自己）。
4. 凭据 → 创建 OAuth 客户端 ID → 应用类型"桌面应用"。
5. 下载 JSON 保存到 `~/.config/present2me/gdocs/credentials.json`（**不进仓库**）。
6. 首次跑一个 OAuth 示例脚本完成授权，刷新令牌落
   `~/.config/present2me/gdocs/token.json`。
7. `bash tools/status.sh` → gdocs ✅（检查即 `test -d ~/.config/present2me/gdocs`）。

## 与本工作流的结合

- 博客发布渠道含 Google Docs 时的初稿目的地（与飞书并列）。
- 从 Drive 拉用户已有文档作为写作风格语料补充。

## 注意

- OAuth scope 最小化：`documents` / `drive.file`（只碰它创建的文件）优先。
- 刷新令牌长期有效但删除项目即失效；凭据与令牌全部留在 `~/.config/present2me/`。
