#!/usr/bin/env node
// version.mjs — 插件版本读取（多市场清单兼容）
// 插件可能经 ZCode/Codex（.zcode-plugin/）或 Claude Code（.claude-plugin/）
// 安装，两处清单同版本由 make release 同步，读取时按存在者取。
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const VERSION = (async () => {
  for (const manifest of [".claude-plugin", ".zcode-plugin"]) {
    const v = await readFile(path.join(PLUGIN_ROOT, manifest, "plugin.json"), "utf8")
      .then(s => JSON.parse(s).version).catch(() => null);
    if (v) return v;
  }
  return "0.0.0";
})();
