#!/usr/bin/env node
// server.mjs — present2me Excalidraw 查看器本地服务
// 静态服务仓库根目录（限本机回环）+ POST /api/save 把画板内容写回 .excalidraw 文件。
// 用法: node server.mjs [port]
import http from "node:http";
import { readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const PORT = Number(process.argv[2] || process.env.PORT || 4173);
const HOST = "127.0.0.1";

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
};

// 路径必须落在仓库根内，防目录穿越
function safeResolve(rel) {
  const clean = String(rel).replace(/^\/+/, "");
  if (!clean || clean.includes("\0")) return null;
  const p = path.resolve(ROOT, clean);
  if (p !== ROOT && !p.startsWith(ROOT + path.sep)) return null;
  return p;
}

const server = http.createServer(async (req, res) => {
  const send = (code, body, type = "application/json") => {
    res.writeHead(code, { "Content-Type": type });
    res.end(body);
  };
  try {
    const u = new URL(req.url, `http://${HOST}`);

    if (req.method === "GET" && u.pathname === "/api/health") {
      return send(200, JSON.stringify({ ok: true, port: PORT }));
    }

    if (req.method === "POST" && u.pathname === "/api/save") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const { file, data } = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!file || !data || !Array.isArray(data.elements)) {
        return send(400, JSON.stringify({ ok: false, error: "bad payload" }));
      }
      const p = safeResolve(file);
      if (!p || !p.endsWith(".excalidraw")) {
        return send(400, JSON.stringify({ ok: false, error: "bad path" }));
      }
      await writeFile(p, JSON.stringify(data, null, 2) + "\n");
      return send(200, JSON.stringify({ ok: true, file }));
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return send(405, JSON.stringify({ ok: false, error: "method not allowed" }));
    }

    let p = safeResolve(decodeURIComponent(u.pathname));
    if (!p) return send(403, JSON.stringify({ ok: false, error: "forbidden" }));
    const st = await stat(p).catch(() => null);
    if (st && st.isDirectory()) p = path.join(HERE, "index.html");
    const buf = await readFile(p).catch(() => null);
    if (!buf) return send(404, "not found", "text/plain");
    return send(200, buf, MIME[path.extname(p).toLowerCase()] || "application/octet-stream");
  } catch (e) {
    return send(500, JSON.stringify({ ok: false, error: String(e.message || e) }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`present2me excalidraw viewer: http://${HOST}:${PORT} (root: ${ROOT})`);
});
