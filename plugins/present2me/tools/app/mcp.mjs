#!/usr/bin/env node
// mcp.mjs — present2me MCP 门面（stdio · JSON-RPC 2.0，newline-delimited）
// 由 MCP 客户端（Claude Code / Codex / ZCode）拉起；启动时确保 web 服务单例在跑
// （复用 p2m.sh ensure，端口逻辑单一实现），此后所有工具调用代理到 HTTP 端点。
// 门面只暴露稳定动词（render / validate / preview / viewer / status）；
// 选型路由与语法写法知识留在技能层，不进服务端（AGENTS 设计决策）。
//
// 手动冒烟（不经 MCP 客户端）：
//   printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
//     '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
//     '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
//     '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"validate","arguments":{"file":"/abs/x.d2"}}}' \
//   | node tools/app/mcp.mjs
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT_FILE = path.join(HERE, ".server.port");
const VERSION = await readFile(path.resolve(HERE, "..", "..", ".zcode-plugin", "plugin.json"), "utf8")
  .then(s => JSON.parse(s).version).catch(() => "0.0.0");

// ---------- web 服务单例（附着或带起） ----------
let cachedPort = null;

async function healthy(port) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(1000) });
    const j = await r.json();
    return j?.app === "p2m-server";
  } catch { return false; }
}

async function ensureServer() {
  if (cachedPort && await healthy(cachedPort)) return cachedPort;
  const saved = Number((await readFile(PORT_FILE, "utf8").catch(() => "")).trim());
  if (saved && await healthy(saved)) { cachedPort = saved; return saved; }
  const r = spawnSync("bash", [path.join(HERE, "p2m.sh"), "ensure"], { encoding: "utf8", timeout: 60_000 });
  const p = (r.stdout || "").trim();
  if (r.status === 0 && /^\d+$/.test(p)) { cachedPort = p; return p; }
  throw new Error(`p2m-server 不可用：${(r.stderr || "").trim() || r.error || "ensure 失败"}`);
}

async function api(method, pathname, body) {
  const port = await ensureServer();
  const res = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

const ENC = s => s.split(path.sep).map(encodeURIComponent).join("/");

// ---------- 工具面（动词；描述写给调用方 agent） ----------
const TOOLS = [
  {
    name: "render",
    description: "渲染图形源文件为 SVG（.d2 → D2 编译器；.mmd → mermaid）。返回产物路径与预览 URL。语法错误时 error 带行列号——按行列号修改源文件后重试；源文件即真相，不要改渲染产物。",
    inputSchema: {
      type: "object",
      properties: {
        file: { type: "string", description: "图形源文件绝对路径（.d2 / .mmd）" },
        format: { type: "string", enum: ["svg", "png"], description: "输出格式，默认 svg（png 仅 d2）" },
      },
      required: ["file"],
    },
  },
  {
    name: "validate",
    description: "校验图形源文件语法，不渲染：.d2 → d2 validate（报错带行列号）；.mmd → 渲染探测（渲染成功即语法通过）；.excalidraw → 结构/几何检查（返回结构化 errors/warnings）。写完图先校验，通过再渲染。",
    inputSchema: {
      type: "object",
      properties: { file: { type: "string", description: "源文件绝对路径（.d2 / .mmd / .excalidraw）" } },
      required: ["file"],
    },
  },
  {
    name: "preview",
    description: "为已存在的文件（渲染产物 SVG/PNG、HTML 等）生成 p2m-server 预览 URL（本机静态托管，127.0.0.1）。",
    inputSchema: {
      type: "object",
      properties: { file: { type: "string", description: "文件绝对路径" } },
      required: ["file"],
    },
  },
  {
    name: "viewer",
    description: "为 .excalidraw 文件生成可交互查看器 URL：浏览器里可直接编辑画板并保存回同一文件（人机共编）。",
    inputSchema: {
      type: "object",
      properties: { file: { type: "string", description: ".excalidraw 文件绝对路径" } },
      required: ["file"],
    },
  },
  {
    name: "status",
    description: "查询 p2m-server 状态：端口、已注册允许根。用于排障与健康检查。",
    inputSchema: { type: "object", properties: {} },
  },
];

const handlers = {
  async render({ file, format }) {
    const ext = path.extname(file || "").slice(1);
    if (ext !== "d2" && ext !== "mmd") return { ok: false, error: `render 只接受 .d2 / .mmd，实为 .${ext}` };
    return api("POST", `/render/${ext}`, { file, ...(format ? { format } : {}) });
  },
  async validate({ file }) {
    return api("POST", "/validate", { file });
  },
  async preview({ file }) {
    const abs = path.resolve(file || "");
    await api("POST", "/api/roots", { root: path.dirname(abs) });
    const port = await ensureServer();
    return { ok: true, previewUrl: `http://127.0.0.1:${port}/${ENC(path.basename(abs))}` };
  },
  async viewer({ file }) {
    const abs = path.resolve(file || "");
    if (!abs.endsWith(".excalidraw")) return { ok: false, error: "viewer 只接受 .excalidraw 文件" };
    await api("POST", "/api/roots", { root: path.dirname(abs) });
    const port = await ensureServer();
    return { ok: true, viewerUrl: `http://127.0.0.1:${port}/viewer/index.html?file=${encodeURIComponent(path.basename(abs))}` };
  },
  async status() {
    return api("GET", "/api/health");
  },
};

// ---------- JSON-RPC 分发 ----------
const reply = (id, result) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
const replyErr = (id, code, message) =>
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");

async function dispatch(msg) {
  switch (msg.method) {
    case "initialize":
      return {
        protocolVersion: msg.params?.protocolVersion || "2025-06-18",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "present2me", version: VERSION },
        instructions: "present2me 渲染服务：写图先 validate 再 render；源文件即真相；详细写法知识见仓库 viz-* 技能。",
      };
    case "ping":
      return {};
    case "tools/list":
      return { tools: TOOLS };
    case "tools/call": {
      const { name, arguments: args = {} } = msg.params ?? {};
      if (!handlers[name]) throw Object.assign(new Error(`unknown tool: ${name}`), { code: -32602 });
      try {
        const result = await handlers[name](args);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], isError: result?.ok === false };
      } catch (e) {
        return { content: [{ type: "text", text: String(e.message || e) }], isError: true };
      }
    }
    default:
      throw Object.assign(new Error(`method not found: ${msg.method}`), { code: -32601 });
  }
}

const rl = readline.createInterface({ input: process.stdin });
rl.on("line", (line) => {
  const s = line.trim();
  if (!s) return;
  let msg;
  try { msg = JSON.parse(s); } catch { return; }
  if (msg.id === undefined) return; // notification（含 notifications/initialized）：不回
  dispatch(msg)
    .then(r => reply(msg.id, r))
    .catch(e => replyErr(msg.id, e.code ?? -32603, String(e.message || e)));
});
