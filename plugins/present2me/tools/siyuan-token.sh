#!/usr/bin/env bash
# 输出思源 SiYuan 的 API token（供检测/调用拼 Authorization 头使用）。
# 调用方不得把输出打印到终端或写入仓库。
set -uo pipefail
python3 - <<'PY'
import json, os
cands = [os.path.expanduser("~/.config/siyuan/conf.json")]
try:
    h = os.path.expanduser("~/.config/siyuan/workspace.json")
    cands.insert(0, os.path.join(json.load(open(h))[0], "conf", "conf.json"))
except Exception:
    pass
for p in cands:
    try:
        tok = json.load(open(p))["api"]["token"]
        if tok:
            print(tok)
            break
    except Exception:
        continue
PY
