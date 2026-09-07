# Notion 接入手册

## 开通（一次性）

1. 访问 https://www.notion.so/my-integrations → 新建 integration（类型选 Internal）。
2. 复制 Internal Integration Secret（`ntn_` 或 `secret_` 开头）。
3. 存入机器级配置（**不进仓库**）：
   ```bash
   mkdir -p ~/.config/present2me
   echo 'NOTION_TOKEN=ntn_xxxxxxxx' >> ~/.config/present2me/env
   chmod 600 ~/.config/present2me/env
   ```
4. 在 Notion 里把需要访问的页面/数据库 → `…` → Connections → 添加刚建的 integration。

## 验证

```bash
set -a; source ~/.config/present2me/env; set +a
curl -s https://api.notion.com/v1/users/me \
  -H "Authorization: Bearer $NOTION_TOKEN" \
  -H "Notion-Version: 2022-06-28"
bash tools/status.sh   # notion 应为 ✅
```

## Agent 常用操作

- 检索：`POST /v1/search`（全文找页面）
- 读页：`GET /v1/blocks/{id}/children`（递归拼 Markdown）
- 写页：`PATCH /v1/blocks/{id}/children`（append 块）

官方 API：https://developers.notion.com/docs

## 与本工作流的结合

- 作为飞书之外的文档目的地（发布渠道不同的博客初稿）。
- 从 Notion 拉用户已有笔记做讲解锚点。

## 注意

- token 放 `~/.config/present2me/env`（600 权限），status.sh 检测其存在。
- Notion API 写操作有速率限制（约 3 req/s），批量写入要节流。
