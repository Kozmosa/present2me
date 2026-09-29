#!/usr/bin/env bash
# p2m.sh — p2m-server 单例管理器（端口分配收口：全工作区只有这一个常驻服务）
# 用法:
#   tools/app/p2m.sh ensure    确保服务在跑，成功输出端口号（stdout 仅端口）
#   tools/app/p2m.sh stop      停止服务
#   tools/app/p2m.sh status    查看服务状态
set -euo pipefail

# 解析文件级软链（仓库根 tools/ 下的脚本是软链），得到插件真实根目录
SELF="${BASH_SOURCE[0]}"
while [ -L "$SELF" ]; do
  DIR="$(cd "$(dirname "$SELF")" && pwd)"
  SELF="$(readlink "$SELF")"
  case "$SELF" in /*) ;; *) SELF="$DIR/$SELF";; esac
done
APP_DIR="$(cd -P "$(dirname "$SELF")" && pwd)"
PLUGIN_ROOT="$(cd "$APP_DIR/../.." && pwd)"
PROJECT_ROOT="$(cd "$PLUGIN_ROOT/../.." && pwd)"

# node 优先走 PATH：pixi run node 会让 $! 指向 pixi 中间层而非 node 本尊，
# 导致 stop 杀不掉服务；pixi 仅作无系统 node 时的兜底。
if command -v node >/dev/null 2>&1; then
  NODE_CMD=(node)
elif command -v pixi >/dev/null 2>&1 && [[ -f "$PROJECT_ROOT/pixi.toml" ]]; then
  NODE_CMD=(pixi run --manifest-path "$PROJECT_ROOT/pixi.toml" node)
else
  echo "node 不可用：请安装 Node.js ≥20（或经 pixi 工具链）" >&2
  exit 1
fi

PID_FILE="$APP_DIR/.server.pid"
PORT_FILE="$APP_DIR/.server.port"
LOG_FILE="$APP_DIR/.server.log"
PORT_CANDIDATES=(4173 4174 4175 4176 4180 4190)
# 插件升级后，已运行的单例可能还是旧代码——按 plugin.json 版本判漂移
EXPECTED_VER="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' "$PLUGIN_ROOT/.zcode-plugin/plugin.json" 2>/dev/null || echo unknown)"

# 必须命中 p2m-server 标识且版本与插件一致：
# 旧 excalidraw-viewer 服务也有 /api/health（无 app 标识）；插件升级后旧代码进程不再复用
healthy() {
  local resp
  resp="$(curl -sf -m 1 "http://127.0.0.1:$1/api/health" 2>/dev/null)" || return 1
  [[ "$resp" == *'"app":"p2m-server"'* ]] || return 1
  [[ "$resp" == *'"version":"'"$EXPECTED_VER"'"'* ]]
}

wait_healthy() {
  local port=$1 pid=$2 i
  for i in $(seq 1 40); do
    healthy "$port" && return 0
    kill -0 "$pid" 2>/dev/null || return 1  # 进程已死，无需等满轮询
    sleep 0.25
  done
  return 1
}

cmd="${1:-ensure}"
case "$cmd" in
  ensure)
    if [[ -f "$PORT_FILE" ]] && healthy "$(cat "$PORT_FILE")"; then
      echo "$(cat "$PORT_FILE")"; exit 0
    fi
    for CAND in "${PORT_CANDIDATES[@]}"; do
      if healthy "$CAND"; then echo "$CAND"; echo "$CAND" >"$PORT_FILE"; exit 0; fi
      nohup "${NODE_CMD[@]}" "$APP_DIR/server.mjs" "$CAND" >>"$LOG_FILE" 2>&1 &
      echo $! >"$PID_FILE"; echo "$CAND" >"$PORT_FILE"
      if wait_healthy "$CAND" $!; then echo "$CAND"; exit 0; fi
    done
    echo "p2m-server 启动失败，详见 $LOG_FILE" >&2; exit 1
    ;;
  stop)
    if [[ -f "$PID_FILE" ]] && kill "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "p2m-server 已停止"
    else
      echo "服务未在运行"
    fi
    rm -f "$PID_FILE" "$PORT_FILE"
    ;;
  status)
    if [[ -f "$PORT_FILE" ]] && healthy "$(cat "$PORT_FILE")"; then
      echo "running  pid=$(cat "$PID_FILE" 2>/dev/null || echo '?')  port=$(cat "$PORT_FILE")"
    else
      echo "stopped"
    fi
    ;;
  *)
    echo "用法: $0 {ensure|stop|status}" >&2; exit 2
    ;;
esac
