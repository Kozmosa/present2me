# Anki 接入手册（anki-connect）

## 安装（一次性）

1. 打开 Anki 桌面版（Anki.app）。
2. 菜单：工具 → 插件 → 获取插件。
3. 输入代码：`2055492159`（anki-connect），确定。
4. 重启 Anki。

## 验证

保持 Anki 运行：

```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"action":"version","params":{}}' http://127.0.0.1:8765
# 返回版本号（如 "6"）即成功；再跑 bash tools/status.sh 应为 ✅
```

## Agent 常用操作（HTTP JSON-RPC，localhost:8765）

```bash
# 牌组列表
curl -s -X POST localhost:8765 -d '{"action":"deckNames","params":{}}'
# 添加卡片（注意换行用 <br>）
curl -s -X POST localhost:8765 -d '{
  "action":"addNote","params":{"note":{
    "deckName":"默认","modelName":"Basic",
    "fields":{"Front":"CRDT 是什么？","Back":"无协调冲突解决的数据结构 <br>类比：多人同时改共享文档"},
    "tags":["present2me","分布式"]
  }}}'
```

## 与本工作流的结合

- `workflows/study-paper.md` 第 6 步：学习完结时可把 insights 制成卡片。
- 制卡原则：一卡一问；正面是问题，背面是"先直觉后严谨"两段式答案；打 `present2me` + 主题标签。

## 注意

- anki-connect 只监听本机 127.0.0.1，无需凭据；Anki 必须开着。
- 删除类操作（deleteNotes 等）先向用户确认。
