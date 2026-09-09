#!/usr/bin/env node
// fix-excalidraw-text.mjs — 修正手写 .excalidraw 里容器内文字的垂直位置
//
// 背景：渲染器按文字元素自身的 y 落笔，不会替你做垂直居中；手写 JSON 常把
// 文字 y 写成容器 y（贴顶）。在查看器里双击进入编辑再退出会被 Excalidraw 重算，
// 本脚本用同一公式一次性批量修正，免去逐个双击。
//
// 用法: tools/fix-excalidraw-text.mjs <file.excalidraw> [--dry-run]
// 只改 containerId 非空且 verticalAlign === "middle" 的文字的 y / height，不动 x/width。
// 退出码：0 = 无错；1 = 文件读取/解析失败。
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const file = args.find(a => !a.startsWith("--"));

if (!file) {
  console.error("用法: fix-excalidraw-text.mjs <file.excalidraw> [--dry-run]");
  process.exit(1);
}

let doc;
try {
  doc = JSON.parse(readFileSync(file, "utf8").replace(/^﻿/, ""));
} catch (e) {
  console.error(`读取失败: ${e.message}`);
  process.exit(1);
}
const elements = Array.isArray(doc?.elements) ? doc.elements : [];
const byId = new Map(elements.filter(e => e && e.id).map(e => [e.id, e]));

const changed = [];
for (const el of elements) {
  if (el?.type !== "text" || !el.containerId || el.verticalAlign !== "middle") continue;
  const c = byId.get(el.containerId);
  if (!c || typeof c.y !== "number" || typeof c.height !== "number") continue;
  if (typeof el.y !== "number" || typeof el.fontSize !== "number") continue;

  const lines = String(el.text ?? "").split("\n").length;
  const th = lines * el.fontSize * (typeof el.lineHeight === "number" ? el.lineHeight : 1.25);
  const y = c.y + (c.height - th) / 2;
  if (Math.abs(el.y - y) < 0.5 && Math.abs((el.height ?? 0) - th) < 0.5) continue;

  changed.push({ id: el.id, container: c.id, yFrom: el.y, yTo: y, hFrom: el.height, hTo: th });
  el.y = y;
  el.height = th;
  el.updated = Date.now();
}

if (changed.length === 0) {
  console.log(`✅ ${file}：容器内文字位置已正确，无需修改`);
  process.exit(0);
}

for (const c of changed) {
  console.log(`  ${c.id} in ${c.container}: y ${c.yFrom} → ${Number(c.yTo.toFixed(2))}, ` +
    `height ${c.hFrom} → ${Number(c.hTo.toFixed(2))}`);
}

if (DRY) {
  console.log(`\n[dry-run] 共 ${changed.length} 处待修正，未写回`);
  process.exit(0);
}

writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
console.log(`\n已修正 ${changed.length} 处并写回 ${file}`);
