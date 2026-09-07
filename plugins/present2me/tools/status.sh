#!/usr/bin/env bash
# status.sh — 聚合所有工具的接入/授权状态
# 用法: bash tools/status.sh [--json]
set -uo pipefail

# 解析文件级软链（仓库根 tools/ 下的脚本是软链），得到插件真实根目录
SELF="${BASH_SOURCE[0]}"
while [ -L "$SELF" ]; do
  DIR="$(cd "$(dirname "$SELF")" && pwd)"
  SELF="$(readlink "$SELF")"
  case "$SELF" in /*) ;; *) SELF="$DIR/$SELF";; esac
done
PLUGIN_ROOT="$(cd -P "$(dirname "$SELF")/.." && pwd)"
YAML="$PLUGIN_ROOT/config/tools.yaml"
STATE="$PLUGIN_ROOT/config/setup-state.json"
JSON_OUT=0
[[ "${1:-}" == "--json" ]] && JSON_OUT=1

# 用 python3 解析固定 schema 的 tools.yaml（无需 PyYAML）
parse_yaml() {
  python3 - "$YAML" <<'PY'
import json, sys
entries, cur = [], None
for line in open(sys.argv[1], encoding="utf-8"):
    s = line.rstrip("\n")
    if not s.strip() or s.lstrip().startswith("#"):
        continue
    if s.startswith("tools:"):
        continue
    if s.startswith("  - id:"):
        if cur: entries.append(cur)
        cur = {"id": s.split(":", 1)[1].strip()}
    elif cur is not None and s.startswith("    ") and ":" in s:
        k, v = s.strip().split(":", 1)
        cur[k.strip()] = v.strip().strip('"')
if cur: entries.append(cur)
print(json.dumps(entries))
PY
}

ENTRIES="$(parse_yaml)" || { echo "解析 $YAML 失败" >&2; exit 1; }

run_check() {  # check 命令在插件根执行; 不打印任何密钥
  local cmd="$1"
  ( cd "$PLUGIN_ROOT" && eval "$cmd" ) >/dev/null 2>&1
}

NOW="$(date +%s)"
RESULTS="[" FIRST=1
while IFS=$'\t' read -r id name category check how doc; do
  [[ -z "$id" || "$id" == "null" ]] && continue
  if run_check "$check"; then st="ready"; mark="✅"; else st="not_ready"; mark="❌"; fi
  RESULTS+="$([[ $FIRST -eq 1 ]] && echo "" || echo ","){\"id\":\"$id\",\"status\":\"$st\",\"checked_at\":$NOW}"
  FIRST=0
  if [[ $JSON_OUT -eq 0 ]]; then
    hint=""
    [[ "$st" == "not_ready" && "$how" != "null" ]] && hint="  ← $how"
    printf '%s %-4s %-18s %s%s\n' "$mark" "$category" "$name" "$id" "$hint"
    [[ "$st" == "not_ready" && "$doc" != "null" ]] && printf '      手册: %s\n' "$doc"
  fi
done < <(printf '%s' "$ENTRIES" | python3 -c '
import json, sys
for e in json.load(sys.stdin):
    print("\t".join(str(e.get(k) or "null") for k in ("id","name","category","check","how","doc")))
')
RESULTS="$RESULTS]"

mkdir -p "$PLUGIN_ROOT/config"
printf '%s' "$RESULTS" | python3 -c 'import json,sys; print(json.dumps({"checked_at":int(__import__("time").time()),"tools":json.load(sys.stdin)}, ensure_ascii=False, indent=2))' > "$STATE"

if [[ $JSON_OUT -eq 1 ]]; then
  cat "$STATE"
else
  echo "（状态已写入插件目录 config/setup-state.json；接入手册见 present2me 仓库 config/setup-docs/）"
fi
