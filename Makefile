# present2me — 常用操作入口
# 用法: make（看帮助）；带参数目标示例: make board FILE=demo/hello.excalidraw
# 兼容 macOS 自带 GNU Make 3.81（未用 != 语法）

DEFAULT_GOAL := help

DATE := $(shell date +%F)

.PHONY: help setup status check docs docs-build docs-open \
        spec board board-stop d2 d2-watch demo task release release-check clean

help: ## 显示本帮助
	@echo "present2me 常用目标："
	@grep -E '^[a-zA-Z0-9][a-zA-Z0-9_-]*:.*## ' $(MAKEFILE_LIST) | \
		awk 'BEGIN{FS=":.*## "}{printf "  \033[36m%-12s\033[0m %s\n",$$1,$$2}'

setup: ## 一次性环境搭建（依赖 + 查看器构建 + 工具体检）
	@./setup.sh

status: ## 工具授权状态总览（等价 ./setup.sh --check）
	@bash tools/status.sh

check: ## 插件级静态检查与 demo 构建校验
	@pixi run node --check plugins/present2me/tools/build-excalidraw.mjs
	@pixi run node --check plugins/present2me/tools/validate-excalidraw.mjs
	@pixi run node --check plugins/present2me/tools/fix-excalidraw-text.mjs
	@node tools/build-excalidraw.mjs demo/hello.spec.json /tmp/present2me-hello.excalidraw
	@node tools/validate-excalidraw.mjs /tmp/present2me-hello.excalidraw
	@bash tools/release.sh --check

# ---- 文档站（MkDocs via uvx，仓库零污染） ----

docs: ## 文档站开发预览（8000 端口，热刷新，自动开浏览器）
	@bash tools/docs.sh serve

docs-build: ## 构建静态文档站到 site/（gitignored）
	@bash tools/docs.sh build

docs-open: ## 构建并打开 site/index.html
	@bash tools/docs.sh open

# ---- 可视化 ----

spec: ## 从语义骨架构建画板: make spec FILE=demo/hello.spec.json OUT=demo/hello.excalidraw
	@test -n "$(FILE)" || (echo "用法: make spec FILE=<spec.json> OUT=<out.excalidraw>"; exit 2)
	@node tools/build-excalidraw.mjs "$(FILE)" "$(OUT)"

board: ## 在本地查看器打开画板: make board FILE=path/to/x.excalidraw
	@test -n "$(FILE)" || (echo "用法: make board FILE=<文件.excalidraw>"; exit 2)
	@bash tools/excalidraw-viewer/open.sh "$(FILE)"

board-stop: ## 停止画板查看器后台服务
	@bash tools/excalidraw-viewer/open.sh --stop

d2: ## 渲染 D2 图并打开: make d2 FILE=path/to/x.d2
	@test -n "$(FILE)" || (echo "用法: make d2 FILE=<文件.d2>"; exit 2)
	@bash tools/render-d2.sh "$(FILE)"

d2-watch: ## D2 实时预览（改文件自动刷新）: make d2-watch FILE=x.d2
	@test -n "$(FILE)" || (echo "用法: make d2-watch FILE=<文件.d2>"; exit 2)
	@bash tools/render-d2.sh -w "$(FILE)"

demo: ## 打开能力演示（D2 全景图 + Excalidraw 画板）
	@bash tools/render-d2.sh demo/hello-d2.d2
	@bash tools/excalidraw-viewer/open.sh demo/hello.excalidraw

# ---- 任务 ----

task: ## 从模板新建任务文件夹: make task SLUG=my-paper
	@test -n "$(SLUG)" || (echo "用法: make task SLUG=<英文小写连字符slug>"; exit 2)
	@cp -R tasks/_template "tasks/$(DATE)-$(SLUG)"
	@echo "已创建 tasks/$(DATE)-$(SLUG) —— 记得在 TASK.md 里逐字填入目标原话"

# ---- 插件发版（同步 plugin.json 与 marketplace.json 双版本 + tag；不 push） ----

release: ## 插件发版: make release VERSION=0.1.1
	@test -n "$(VERSION)" || (echo "用法: make release VERSION=0.1.1" >&2; exit 2)
	@bash tools/release.sh "$(VERSION)"

release-check: ## 检查插件双版本号是否一致
	@bash tools/release.sh --check

# ---- 清理 ----

clean: ## 删除文档站构建产物 site/
	@rm -rf site/
	@echo "已清理 site/"
