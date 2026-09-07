#!/usr/bin/env bash
# release.sh — present2me 插件发版：同步双版本号 → commit → tag（不 push）
# "最新版本"以 marketplace.json 条目为准，"已安装版本"以 plugin.json 为准，
# 两处必须同步，否则用户端不会提示更新。
# 用法: tools/release.sh <VERSION>    如 tools/release.sh 0.1.1
#       tools/release.sh --check      只看两处版本是否一致
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGIN_JSON="$REPO_ROOT/plugins/present2me/.zcode-plugin/plugin.json"
MARKET="$REPO_ROOT/marketplace.json"

versions() {  # 输出: <plugin.json 版本> <marketplace 条目版本>
  python3 - "$PLUGIN_JSON" "$MARKET" <<'PY'
import json, sys
pj = json.load(open(sys.argv[1]))
mk = json.load(open(sys.argv[2]))
e = next(p for p in mk["plugins"] if p["name"] == "present2me")
print(pj.get("version", "<missing>"), e.get("version", "<missing>"))
PY
}

if [[ "${1:-}" == "--check" ]]; then
  PV=""; MV=""
  read -r PV MV < <(versions)
  echo "plugin.json:       $PV"
  echo "marketplace.json:  $MV"
  if [[ "$PV" == "$MV" ]]; then echo "✅ 一致"; else echo "❌ 不一致（必须同步，否则不提示更新）"; exit 1; fi
  exit 0
fi

[[ $# -eq 1 ]] || { sed -n '2,6p' "$0" >&2; exit 2; }
VER="$1"
[[ "$VER" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]] || {
  echo "版本须语义化: 0.1.1 / 1.0.0-rc.1" >&2; exit 2; }

cd "$REPO_ROOT"
[[ -z "$(git status --porcelain --untracked-files=no)" ]] || {
  echo "已跟踪文件有未提交改动，先 commit 再发版" >&2; exit 1; }

python3 - "$PLUGIN_JSON" "$MARKET" "$VER" <<'PY'
import json, sys
pj_path, mk_path, ver = sys.argv[1:4]
def dump(path, obj):
    with open(path, "w") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")
with open(pj_path) as f: pj = json.load(f)
pj["version"] = ver
dump(pj_path, pj)
with open(mk_path) as f: mk = json.load(f)
next(p for p in mk["plugins"] if p["name"] == "present2me")["version"] = ver
dump(mk_path, mk)
PY

PV=""; MV=""
read -r PV MV < <(versions)
[[ "$PV" == "$VER" && "$MV" == "$VER" ]] || { echo "版本写入校验失败" >&2; exit 1; }

git add "$PLUGIN_JSON" "$MARKET"
# --allow-empty：首个发版时版本号往往已是目标值（如 0.1.0），bump 无 diff 也要落 release commit
git commit --allow-empty -m "release: present2me v$VER"
git tag "v$VER"
echo "✅ 已 commit 并打 tag v$VER"
echo "推送后用户端可见更新: git push && git push --tags"
