# 思源 SiYuan 接入手册

思源自带本地内核 HTTP API（Kernel API），无需额外插件。

## 开通（一次性）

1. 打开 SiYuan：设置 → 关于 → API token，设置一个 token。
   （token 实际存于思源工作空间的 `conf/conf.json` 的 `api.token` 字段，
   本机默认工作空间：`~/Library/Application Support/SiYuan/SiYuanWorkspace`。）
2. 确认内核端口：默认 `58131`；如修改过，以内核启动日志/设置为准。
3. 无需把 token 写进本仓库——本仓库的 `tools/siyuan-token.sh` 会自动定位并输出 token
   （仅用于拼 Authorization 头，不打印不落盘）。

## 验证

```bash
TOKEN=$(tools/siyuan-token.sh)
curl -s -H "Authorization: Token $TOKEN" http://127.0.0.1:58131/api/system/version
bash tools/status.sh   # siyuan 应为 ✅（需 SiYuan 正在运行）
```

## Agent 常用操作

```bash
# 笔记本列表
curl -s -X POST -H "Authorization: Token $TOKEN" http://127.0.0.1:58131/api/notebook/lsNotebooks
# 按 SQL 检索块
curl -s -X POST -H "Authorization: Token $TOKEN" http://127.0.0.1:58131/api/query/sql \
  -d '{"stmt":"SELECT * FROM blocks WHERE content LIKE '\''%CRDT%'\'' LIMIT 20"}'
# 创建 Markdown 文档
curl -s -X POST -H "Authorization: Token $TOKEN" http://127.0.0.1:58131/api/filetree/createDocWithMd \
  -d '{"notebook":"20260907120000-abc","path":"/present2me/insights.md","markdown":"# 来自 present2me\n..."}'
```

API 全集：https://github.com/siyuan-note/siyuan/blob/master/API.md

## 与本工作流的结合

- 论文 insights / 讲解沉淀可双写：飞书（协作批注）+ 思源（个人知识库检索）。
- 检索用户已有笔记，为讲解提供"用户已知概念"锚点（类比更贴身）。

## 注意

- token 只在命令内读取使用，**不打印、不入库**。
- 写操作（创建/移动/删除块）先告知用户；删除必须确认。
