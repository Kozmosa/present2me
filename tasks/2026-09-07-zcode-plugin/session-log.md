# 会话日志（追加制）

> 每次会话结束前追加一节；不修改历史记录。

## 2026-09-07 23:35

- 本次做了：
  - 完成 present2me → ZCode 插件改造（方案 A 同仓库双角色）：
    `plugins/present2me/`（plugin.json + skills/tools/workflows/config/commands 真身），
    仓库根软链回接（.agents/skills、workflows、tools/*、config/tools.yaml），
    根 `marketplace.json`（市场 = 本仓库）。
  - 脚本插件根化：status/render-d2/siyuan-token/open 改 `PLUGIN_ROOT`（`cd -P` 软链解析）；
    查看器 server.mjs 增加 `P2M_SERVE_ROOT` + `/viewer/` 前缀双根静态服务，
    open.sh 以调用者 CWD 为服务根、health 校验 root 匹配才复用。
  - 新增 4 命令（quick-explain / study-paper / blog-cowrite / p2m-setup）；
    发版工具 tools/release.sh + Makefile release/release-check（双版本同步 + tag）。
  - AGENTS.md（目录导览 + 硬性协议第 7 条"插件目录是产品面" + 发布渠道节）、
    README、docs/getting-started、docs/tools、setup.sh、.gitignore 同步更新。
  - 验证全绿：bash -n/node --check/json.tool；status.sh 经软链实跑（5 项 ✅，状态落插件目录）；
    demo D2 渲染；查看器 health(root)/静态资源/文件读取/目录穿越拦截/api-save 回写全通过；
    make release-check 一致；docs build 通过（软链 workflows 正常渲染）；
    市场清单/命令名/技能 frontmatter 合规自检通过。
- 关键决定/发现：
  - docs.sh 不进插件（依赖根 mkdocs.yml，属工作区面），root tools/ 保留为混合目录。
  - ZCode 版本检测口径：marketplace.json 条目版本 = "最新版"，plugin.json = "已装版"，
    发版必须双写（release.sh 已保证）。
  - 无 `zcode` CLI 可加市场——本地市场安装自测只能走 UI（设置→插件→添加市场→本仓库路径）。
  - **踩坑修复**：`cd -P` 只解析目录软链；`tools/status.sh` 这类**文件级**软链必须先
    解析文件自身再取目录（while readlink 循环），否则 PLUGIN_ROOT 算回仓库根、
    状态文件写错位置。首次验证被根目录 tools.yaml 软链掩盖，靠 git add -A 逮到。
- 下次从哪继续：
  - 用户 UI 自测本地市场安装；commit + `make release VERSION=0.1.0`（首个 tag）+ push。
  - 挂账决策：LICENSE 补不补；knowledge/ 语料公开策略（TASK.md 挂账区）。

## 2026-09-07 23:59

- 本次做了：
  - present2me 增加 Codex 插件适配（第二发布渠道，与 ZCode 共用插件体）：
    新增 `.agents/plugins/marketplace.json`（Codex 市场清单，source 对象格式，
    条目不带版本号）；`.zcode-plugin/plugin.json` 补 `interface` 展示元数据
    （displayName/category/capabilities 等，Codex 安装时归一化读取）。
  - 命令文件双平台兼容修复：正文去掉 `$ARGUMENTS` 占位符（Codex 迁移命令→
    技能时遇到它会**静默丢弃**该命令），参数说明并入 description 与正文；
    「ZCode 插件安装目录」措辞中立化为「ZCode / Codex 插件安装目录」。
  - 本机（codex-cli 0.153.4）端到端实测：marketplace add 本地路径 →
    plugin add → 缓存归一化出 .codex-plugin/ → 4 命令全部迁移为
    source-command-* 技能 → 仓库外干净目录 codex exec 会话列出全部
    8 个条目（present2me: 4 技能 + 4 命令技能）。
  - AGENTS.md（目录导览 .agents/plugins 行、硬性协议新增第 8 条命令文件
    兼容约定、发布渠道节改双渠道）、README、docs/getting-started、docs/agents
    同步更新；评估图 scratch/p2m-codex-plugin-assess-v1.d2。
- 关键决定/发现：
  - Codex 官方文档明确 `.zcode-plugin/plugin.json` 是被接受的等价清单路径——
    **零新增 manifest**，安装时 Codex 自动归一化出 `.codex-plugin/plugin.json`。
  - Codex 只认 `.agents/plugins/marketplace.json`（本仓库实测根 marketplace.json
    未被误读，两清单和平共存）；安装缓存 `~/.codex/plugins/cache/<市场>/<插件>/local`。
  - 对照实验定位兼容性坑：`$ARGUMENTS` 阻断命令迁移（3 个命令未迁移→去掉后全部
    迁移）；`argument-hint` front-matter 键无害（保留，ZCode UX 用）。
  - Codex 市场条目不带版本号 → `make release` 双版本同步逻辑无需改动。
  - 本地测试市场（指向本地路径）留在 ~/.codex；发版 push 后建议 remove 再从
    GitHub 源添加。
- 下次从哪继续：
  - 与 ZCode 改造一并发版：commit → `make release VERSION=0.1.0` → push
    （Codex 用户即可 `codex plugin marketplace add Kozmosa/present2me` 安装）。
  - 可选：ZCode 端 UI 自测确认 plugin.json 加 interface 字段无副作用。
