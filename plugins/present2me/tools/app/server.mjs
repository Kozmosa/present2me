#!/usr/bin/env node
// server.mjs — present2me 应用层服务（p2m-server）
// 统一托管：可视化渲染（d2 / mermaid）、Excalidraw 查看器、渲染产物预览。
// 仅绑定 127.0.0.1；文件读写都限制在「允许根」内（动态注册），
// 防目录穿越。零依赖，node:http 实现。
//
// 端点：
//   GET  /api/health          存活探测（含 app 标识，供单例管理器区分旧 viewer）
//   POST /api/roots           {root} 注册允许根（须为已存在目录）
//   POST /api/save            {file, data} 把画板内容写回 .excalidraw 文件
//   POST /render/d2           {file, format?} 渲染 D2（pixi 优先，PATH d2 次之）
//   POST /render/mmd          {file} 渲染 Mermaid（渲染成功即语法通过）
//   GET  /viewer/...          Excalidraw 查看器静态资源（自 ../excalidraw-viewer/）
//   GET  /<path>              允许根内静态文件（预览渲染产物）
//
// 用法: node server.mjs [port]
import http from "node:http";
import { readFile, writeFile, realpath } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render, validateD2 } from "./render.mjs";
import { validateData } from "../validate-excalidraw.mjs";
import { checkTools } from "./status.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VIEWER_DIR = path.resolve(HERE, "..", "excalidraw-viewer");
const PORT = Number(process.argv[2] || process.env.PORT || 4173);
const HOST = "127.0.0.1";
const RENDER_TIMEOUT_MS = 60_000;
const VERSION = await readFile(path.resolve(HERE, "..", "..", ".zcode-plugin", "plugin.json"), "utf8")
  .then(s => JSON.parse(s).version).catch(() => "0.0.0");

// 允许根：静态读取与写回都限制在这些目录内。
// 初始根来自 P2M_SERVE_ROOT；此后由 /api/roots 与渲染请求动态注册。
const roots = new Set();
if (process.env.P2M_SERVE_ROOT) {
  const p = path.resolve(process.env.P2M_SERVE_ROOT);
  if (existsSync(p)) roots.add(p);
}

async function addRoot(dir) {
  const p = await realpath(path.resolve(dir)).catch(() => null);
  if (!p) return false;
  roots.add(p);
  return true;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".excalidraw": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".md": "text/markdown; charset=utf-8",
  ".d2": "text/plain; charset=utf-8",
  ".mmd": "text/plain; charset=utf-8",
};

// 路径必须落在 base 内，防目录穿越
function safeResolve(base, rel) {
  const clean = String(rel).replace(/^\/+/, "");
  if (!clean || clean.includes("\0")) return null;
  const p = path.resolve(base, clean);
  if (p !== base && !p.startsWith(base + path.sep)) return null;
  return p;
}

// 相对路径在任一允许根内定位；返回绝对路径，越界返回 null
function resolveInRoots(rel) {
  if (path.isAbsolute(rel)) {
    return [...roots].some(r => rel === r || rel.startsWith(r + path.sep)) ? rel : null;
  }
  for (const r of roots) {
    const p = safeResolve(r, rel);
    if (p && existsSync(p)) return p;
  }
  return null;
}

// 绝对路径落在哪个允许根内，返回其相对该根的路径（构造预览 URL 用）
function relInRoots(abs) {
  for (const r of roots) {
    if (abs === r) return { root: r, rel: "." };
    if (abs.startsWith(r + path.sep)) return { root: r, rel: abs.slice(r.length + 1) };
  }
  return null;
}

function previewUrl(abs) {
  const hit = relInRoots(abs);
  if (!hit) return null;
  return `http://${HOST}:${PORT}/${hit.rel.split(path.sep).map(encodeURIComponent).join("/")}`;
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = http.createServer(async (req, res) => {
  const send = (code, body, type = "application/json") => {
    res.writeHead(code, { "Content-Type": type });
    res.end(typeof body === "string" ? body : JSON.stringify(body));
  };
  try {
    const u = new URL(req.url, `http://${HOST}`);

    if (req.method === "GET" && u.pathname === "/api/health") {
      return send(200, { ok: true, app: "p2m-server", version: VERSION, port: PORT, roots: [...roots] });
    }

    if (req.method === "GET" && u.pathname === "/api/status") {
      const tools = await checkTools(); // 并发只读探测，最慢一条 ~15s
      const ready = tools.filter(t => t.ready).length;
      return send(200, {
        ok: true, app: "p2m-server", version: VERSION, port: PORT,
        roots: [...roots],
        summary: `${ready}/${tools.length} 就绪`,
        tools,
        checked_at: Math.floor(Date.now() / 1000),
      });
    }

    if (req.method === "POST" && u.pathname === "/api/roots") {
      const { root } = await readBody(req);
      if (!root || typeof root !== "string") return send(400, { ok: false, error: "bad payload" });
      const ok = await addRoot(root);
      return ok ? send(200, { ok: true, roots: [...roots] }) : send(400, { ok: false, error: "not a directory" });
    }

    if (req.method === "POST" && u.pathname === "/api/save") {
      const { file, data } = await readBody(req);
      if (!file || !data || !Array.isArray(data.elements)) {
        return send(400, { ok: false, error: "bad payload" });
      }
      const p = resolveInRoots(file);
      if (!p || !p.endsWith(".excalidraw")) {
        return send(400, { ok: false, error: "bad path" });
      }
      await writeFile(p, JSON.stringify(data, null, 2) + "\n");
      return send(200, { ok: true, file: p });
    }

    if (req.method === "POST" && (u.pathname === "/render/d2" || u.pathname === "/render/mmd")) {
      const kind = u.pathname.endsWith("/d2") ? "d2" : "mmd";
      const { file, format } = await readBody(req);
      if (!file || typeof file !== "string") return send(400, { ok: false, error: "bad payload" });
      // 渲染的源文件所在目录自动成为允许根（产物要可预览）
      const abs = path.isAbsolute(file) ? path.resolve(file) : resolveInRoots(file);
      if (!abs || !existsSync(abs)) return send(400, { ok: false, error: `file not found: ${file}` });
      if (!abs.endsWith(`.${kind}`)) return send(400, { ok: false, error: `expected .${kind} file` });
      await addRoot(path.dirname(abs));
      const result = await render(kind, abs, format === "png" ? "png" : "svg", RENDER_TIMEOUT_MS);
      if (!result.ok) return send(200, { ok: false, error: result.error });
      return send(200, { ok: true, output: result.output, previewUrl: previewUrl(result.output) });
    }

    if (req.method === "POST" && u.pathname === "/validate") {
      const { file } = await readBody(req);
      if (!file || typeof file !== "string") return send(400, { ok: false, error: "bad payload" });
      const abs = path.isAbsolute(file) ? path.resolve(file) : resolveInRoots(file);
      if (!abs || !existsSync(abs)) return send(400, { ok: false, error: `file not found: ${file}` });
      await addRoot(path.dirname(abs));
      if (abs.endsWith(".d2")) {
        const r = await validateD2(abs, RENDER_TIMEOUT_MS);
        return send(200, { ok: r.ok, engine: "d2", ...(r.ok ? { message: r.message } : { error: r.error }) });
      }
      if (abs.endsWith(".mmd")) {
        // mermaid 无独立校验器：渲染即校验（成功 = 语法通过）
        const r = await render("mmd", abs, "svg", RENDER_TIMEOUT_MS);
        return send(200, { ok: r.ok, engine: "mmdc", ...(r.ok ? { message: "rendered ok" } : { error: r.error }) });
      }
      if (abs.endsWith(".excalidraw")) {
        let data;
        try {
          data = JSON.parse(await readFile(abs, "utf8").then(b => b.toString().replace(/^﻿/, "")));
        } catch (e) {
          return send(200, { ok: false, engine: "excalidraw", errors: [{ elementId: null, code: "E_PARSE", message: `JSON 解析失败: ${e.message}` }], warnings: [] });
        }
        const { errors, warnings, elementCount } = validateData(data);
        return send(200, { ok: errors.length === 0, engine: "excalidraw", errors, warnings, elementCount });
      }
      return send(400, { ok: false, error: "unsupported extension (expected .d2 / .mmd / .excalidraw)" });
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return send(405, { ok: false, error: "method not allowed" });
    }

    // /viewer/ 前缀从查看器目录出静态资源，其余从允许根出
    let base = null;
    let rel = decodeURIComponent(u.pathname);
    if (rel === "/viewer" || rel.startsWith("/viewer/")) {
      base = VIEWER_DIR;
      rel = rel.slice("/viewer".length) || "/index.html";
    }
    let p;
    if (base) {
      p = safeResolve(base, rel);
    } else {
      // URL 路径先剥前导 /，避免与「绝对文件路径」分支混淆
      p = resolveInRoots(rel.replace(/^\/+/, ""));
    }
    if (!p) return send(403, { ok: false, error: "forbidden" });
    const buf = await readFile(p).catch(() => null);
    if (!buf) return send(404, "not found", "text/plain");
    return send(200, buf, MIME[path.extname(p).toLowerCase()] || "application/octet-stream");
  } catch (e) {
    return send(500, { ok: false, error: String(e.message || e) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`p2m-server: http://${HOST}:${PORT} (roots: ${[...roots].join(", ") || "dynamic"})`);
});
