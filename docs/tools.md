# 工具与凭据

## 设计理念：统一管理 ≠ 集中存储

本仓库**不建密码库**。每个工具用它自己的官方登录态（lark-cli 的 `~/.lark-cli/`、gh 的钥匙串、思源的本地 token…），
仓库提供的是：

1. **一张登记表**：`config/tools.yaml`——每工具的检查命令、开通方式、手册路径。
2. **一条命令总览**：`bash tools/status.sh`——逐项探测，输出 ✅/❌，同时落盘 `config/setup-state.json`。
3. **一套接入手册**：`config/setup-docs/`——挂账工具怎么开，开一个算一个。

**铁律：任何 token/secret 不写入本仓库、不打印到终端。**

## 当前状态

### 已通（开箱即用）

| 工具 | 用途 | 凭据在哪 |
|---|---|---|
| lark-cli | 飞书文档/白板（博客初稿、笔记推送） | `~/.lark-cli/`（OAuth，已授权） |
| gh | GitHub | 钥匙串（`gh auth login` 管理） |
| d2 | 精确结构图渲染 | 无需凭据（brew 安装） |
| mermaid (mmdc) | 内联小图 | 无需凭据 |
| Excalidraw 查看器 | 本地画板（127.0.0.1 服务） | 无需凭据 |

### 挂账（手册就绪，随时开通）

| 工具 | 一句话开通 | 手册 |
|---|---|---|
| Anki | 装 anki-connect 插件（代码 2055492159）+ 保持 Anki 运行 | `config/setup-docs/anki.md` |
| 思源 SiYuan | 本地内核 API（默认端口 58131），token 已在你机器上 | `config/setup-docs/siyuan.md` |
| Notion | 建 integration，token 存 `~/.config/present2me/env` | `config/setup-docs/notion.md` |
| Flomo | 设置→API 复制 webhook，存同一 env 文件 | `config/setup-docs/flomo.md` |
| Google Docs | GCP OAuth 桌面凭据（较重，按需） | `config/setup-docs/gdocs.md` |

开通任何一个后跑 `bash tools/status.sh` 确认变 ✅ 即可，Agent 自动获得对应能力说明。

## status.sh 详解

```bash
bash tools/status.sh          # 人读表格（含修复提示和手册路径）
bash tools/status.sh --json   # 机器读 JSON（Agent 用）
./setup.sh --check            # 等价于 status.sh
```

检查都是**只读探测**（如 `lark-cli whoami`、curl 本地端口、检查 token 文件存在），
不会产生写操作，也不会把密钥带出来。思源的 token 由 `tools/siyuan-token.sh`
定位并仅供拼 Authorization 头，不打印。

## 外部写入的确认约定

Agent 写飞书/GitHub 等外部系统前会说明将写什么；高危操作（删除、覆盖）必须你明确同意。
lark-cli 层面还有一道闸：高危写操作返回 exit 10，Agent 必须带确认 flag 重试——
这道闸不允许绕过（详见用户级 lark-shared 技能）。

## 新增一个工具

1. `config/tools.yaml` 加一条（id/name/category/check/how/doc）——check 必须只读且不泄密。
2. 需要手册就写 `config/setup-docs/<id>.md`。
3. 复杂操作可加 `tools/<id>-*.sh` 辅助脚本（参考 siyuan-token.sh）。
4. 若值得让 Agent 自动掌握用法，再考虑加技能（`.agents/skills/`）。
