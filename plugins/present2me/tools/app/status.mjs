#!/usr/bin/env node
// status.mjs — 工具接入状态计算（单一真身，双入口）
// ① CLI：node status.mjs [--json] —— 人读表格 / 机器读 JSON，写 setup-state.json
// ② 服务端：p2m-server import 挂 GET /api/status（供 MCP status 工具等）
// 替代旧 status.sh 的 bash+python 实现；顺带修复其单引号值解析缺陷
// （旧 parse_yaml 只剥双引号，单引号 check 连引号进 eval 永假）。
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(HERE, "..", "..");
const YAML_PATH = path.resolve(PLUGIN_ROOT, "config", "tools.yaml");
const STATE_PATH = path.resolve(PLUGIN_ROOT, "config", "setup-state.json");
const CHECK_TIMEOUT_MS = 15_000;

// 固定 schema 的 tools.yaml 解析（顶层注释 + tools: + 缩进条目）
export function parseToolsYaml(text) {
  const entries = [];
  let cur = null;
  for (const raw of text.split("\n")) {
    const s = raw.replace(/\r$/, "");
    if (!s.trim() || s.trim().startsWith("#")) continue;
    if (s.startsWith("tools:")) continue;
    if (s.startsWith("  - id:")) {
      if (cur) entries.push(cur);
      cur = { id: s.split(":", 2)[1].trim() };
    } else if (cur && /^ {4}\S/.test(s)) {
      const idx = s.indexOf(":");
      if (idx < 0) continue;
      const k = s.slice(4, idx).trim();
      let v = s.slice(idx + 1).trim();
      // 剥外层成对同类引号（单/双都剥——修复旧实现只剥双引号的缺陷）
      if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v[0] === v[v.length - 1]) {
        v = v.slice(1, -1);
      }
      cur[k] = v;
    }
  }
  if (cur) entries.push(cur);
  return entries;
}

function runCheck(cmd) {
  return new Promise((resolve) => {
    const child = spawn("bash", ["-c", cmd], { cwd: PLUGIN_ROOT, stdio: "ignore" });
    let done = false;
    const timer = setTimeout(() => child.kill("SIGKILL"), CHECK_TIMEOUT_MS);
    const finish = (ok) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(ok);
    };
    child.on("error", () => finish(false));
    child.on("close", (code) => finish(code === 0));
  });
}

// 并发探测全部登记工具；check 均为只读探测，不泄密
export async function checkTools() {
  const text = await readFile(YAML_PATH, "utf8");
  const tools = parseToolsYaml(text).filter(e => e.id);
  const results = await Promise.all(tools.map(async t => ({
    id: t.id,
    name: t.name ?? t.id,
    category: t.category ?? "other",
    ready: await runCheck(t.check ?? "false"),
    how: t.how ?? null,
    doc: t.doc ?? null,
  })));
  return results;
}

// ---------- CLI 壳 ----------
const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const JSON_MODE = process.argv.includes("--json");
  const tools = await checkTools();
  const now = Math.floor(Date.now() / 1000);
  const state = { checked_at: now, tools: tools.map(t => ({ id: t.id, status: t.ready ? "ready" : "not_ready", checked_at: now })) };
  await mkdir(path.dirname(STATE_PATH), { recursive: true });
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2) + "\n");

  if (JSON_MODE) {
    console.log(JSON.stringify(state, null, 2));
  } else {
    for (const t of tools) {
      const mark = t.ready ? "✅" : "❌";
      const hint = !t.ready && t.how ? `  ← ${t.how}` : "";
      console.log(`${mark} ${t.category.padEnd(10)} ${t.name} ${t.id}${hint}`);
      if (!t.ready && t.doc && t.doc !== "null") console.log(`      手册: ${t.doc}`);
    }
    const ready = tools.filter(t => t.ready).length;
    console.log(`\n${ready}/${tools.length} 就绪（状态已写入插件目录 config/setup-state.json；手册见 config/setup-docs/）`);
  }
}
