# Flomo 接入手册

Flomo 官方个人 API 是一个 webhook：往该 URL POST 就会生成一条新 memo。

## 开通（一次性）

1. Flomo 网页版/APP：设置 → API → 复制 webhook 地址
   （形如 `https://flomoapp.com/iwh/xxxx/xxxx`）。
2. 存入机器级配置（**不进仓库**）：
   ```bash
   mkdir -p ~/.config/present2me
   echo 'FLOMO_WEBHOOK_URL=https://flomoapp.com/iwh/xxxx/xxxx' >> ~/.config/present2me/env
   chmod 600 ~/.config/present2me/env
   ```

## 验证

```bash
set -a; source ~/.config/present2me/env; set +a
curl -s -X POST "$FLOMO_WEBHOOK_URL" -H "Content-Type: application/json" \
  -d '{"content":"present2me 连通测试 #present2me"}'
# Flomo 里出现该条即成功；bash tools/status.sh 应为 ✅
```

## Agent 常用操作

```bash
curl -s -X POST "$FLOMO_WEBHOOK_URL" -H "Content-Type: application/json" \
  -d '{"content":"CRDT：无协调冲突解决。类比：多人同时改文档不用锁 #分布式 #present2me"}'
```

- content 支持 Markdown 与 `#标签`；标签建议带 `#present2me` 便于回溯来源。

## 与本工作流的结合

- 学习/讲解过程中的**碎片沉淀**：一条 insight 一条 memo，不打断主流程。
- blog-cowrite 定稿后的金句摘录。

## 注意

- webhook 即写权限本身，泄露等于别人能往你 flomo 写——只在 600 权限的 env 文件存放。
- 只能写、不能读（官方 API 限制）；回看请打开 flomo APP。
