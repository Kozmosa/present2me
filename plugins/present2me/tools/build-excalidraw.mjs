#!/usr/bin/env node
// build-excalidraw.mjs — 从语义骨架生成 .excalidraw（零依赖、纯 Node、不需要浏览器）
//
// 目的：让 Agent 只决定「节点写什么字、什么形状/颜色、谁连谁、大致摆在哪」，
// 机械字段（容器内文字几何、双向绑定、箭头端点、文字宽度余量）全部由本脚本算。
//
// 用法: tools/build-excalidraw.mjs <spec.json> [out.excalidraw] [--stdout]
//
// spec.json:
// {
//   "title":  "画板标题",                       // 可选，漂浮在整图上方
//   "footer": "底部说明",                       // 可选，漂浮在整图下方
//   "nodes": [
//     { "id": "core",                         // 必填，全文件唯一
//       "label": "Agent 讲解与协作",            // 必填，用 \n 换行
//       "shape": "ellipse",                   // rectangle(默认) | ellipse | diamond
//       "color": "yellow",                    // blue|green|yellow|red|purple|gray|none
//       "x": 470, "y": 400,                   // 可选；缺省自动网格排布
//       "width": 300, "height": 120,          // 可选；缺省按标签自动定尺
//       "fontSize": 26 }                      // 可选，默认 20
//   ],
//   "edges": [ { "from": "core", "to": "sat-doc" } ]   // 箭头从 from 指向 to
// }
//
// 写完务必机检: tools/validate-excalidraw.mjs <out.excalidraw>
import { readFileSync, writeFileSync } from "node:fs";

const LINE_HEIGHT = 1.25;
const CJK_MIN = 0x2e7f;
const SAFE_TOP = 120;   // 避开查看器顶部浮动工具栏
const SAFE_LEFT = 40;

const PALETTE = {
  blue:   { backgroundColor: "#a5d8ff", strokeColor: "#1971c2" },
  green:  { backgroundColor: "#b2f2bb", strokeColor: "#2f9e44" },
  yellow: { backgroundColor: "#ffec99", strokeColor: "#e67700" },
  red:    { backgroundColor: "#ffc9c9", strokeColor: "#e03131" },
  purple: { backgroundColor: "#d0bfff", strokeColor: "#6741d9" },
  gray:   { backgroundColor: "#e9ecef", strokeColor: "#868e96" },
  none:   { backgroundColor: "transparent", strokeColor: "#1e1e1e" },
};
const SHAPES = ["rectangle", "ellipse", "diamond"];

const argv = process.argv.slice(2);
const STDOUT = argv.includes("--stdout");
const positional = argv.filter(a => !a.startsWith("--"));

if (positional.length < 1 || argv.includes("-h") || argv.includes("--help")) {
  console.error("用法: build-excalidraw.mjs <spec.json> [out.excalidraw] [--stdout]");
  process.exit(positional.length < 1 ? 2 : 0);
}
const [specPath, outPath] = positional;

const round = n => Math.round(n * 100) / 100;
const estTextWidth = (text, fontSize) =>
  [...text].reduce((s, ch) => s + (ch.codePointAt(0) > CJK_MIN ? 1.0 : 0.6), 0) * fontSize;

// 确定性 seed：同一份 spec 反复构建产出稳定（便于 diff），冲突时顺延
const usedSeeds = new Set();
function hash(str) {
  let h = 5381;
  for (const ch of str) h = ((h << 5) + h + ch.codePointAt(0)) >>> 0;
  return h;
}
function seedFor(id) {
  let s = (hash(id) % 2_000_000_000) + 1;
  while (usedSeeds.has(s)) s += 1;
  usedSeeds.add(s);
  return s;
}

const NOW = 1700000000000; // 固定基准时间戳：由 seed 派生，保证同一 spec 反复构建字节一致

function element(id, type, x, y, width, height, extra = {}) {
  const seed = seedFor(id);
  return {
    id, type, x: round(x), y: round(y), width: round(width), height: round(height), angle: 0,
    strokeColor: "#1e1e1e", backgroundColor: "transparent",
    fillStyle: "hachure", strokeWidth: 2, strokeStyle: "solid", roughness: 2,
    opacity: 100, groupIds: [], frameId: null, roundness: { type: 3 },
    seed, version: 1, versionNonce: (seed ^ 0x5f5f5f5f) >>> 0, isDeleted: false,
    boundElements: null, updated: NOW + (seed % 1_000_000_000), link: null, locked: false,
    ...extra,
  };
}

// ---------- 读取并校验 spec ----------
let spec;
try {
  spec = JSON.parse(readFileSync(specPath, "utf8"));
} catch (e) {
  console.error(`读取 spec 失败: ${e.message}`);
  process.exit(1);
}

const rawNodes = Array.isArray(spec.nodes) ? spec.nodes : [];
const rawEdges = Array.isArray(spec.edges) ? spec.edges : [];
if (rawNodes.length === 0) {
  console.error("spec 里没有 nodes");
  process.exit(1);
}

const nodeIds = new Set();
for (const n of rawNodes) {
  if (!n?.id || typeof n.id !== "string") { console.error("每个 node 必须有字符串 id"); process.exit(1); }
  if (nodeIds.has(n.id)) { console.error(`node id 重复: ${n.id}`); process.exit(1); }
  nodeIds.add(n.id);
  if (typeof n.label !== "string" || n.label === "") { console.error(`node ${n.id} 缺少 label`); process.exit(1); }
}
for (const e of rawEdges) {
  for (const end of ["from", "to"]) {
    if (!nodeIds.has(e?.[end])) { console.error(`edge 的 ${end} 指向不存在的节点: ${e?.[end]}`); process.exit(1); }
  }
}

// ---------- 节点定尺/定位 ----------
let autoIndex = 0;
const nodes = rawNodes.map(n => {
  const fontSize = n.fontSize ?? 20;
  const lines = String(n.label).split("\n");
  const textH = lines.length * fontSize * LINE_HEIGHT;
  const textW = Math.max(...lines.map(l => estTextWidth(l, fontSize)));

  const width = n.width ?? Math.round(Math.max(160, textW + 40));
  const height = n.height ?? Math.round(Math.max(60, textH + 32));

  let { x, y } = n;
  if (typeof x !== "number" || typeof y !== "number") {
    const col = autoIndex % 3, row = Math.floor(autoIndex / 3);
    x = 100 + col * 380;
    y = 200 + row * 260;
    autoIndex += 1;
  }
  return {
    id: n.id, label: String(n.label), shape: SHAPES.includes(n.shape) ? n.shape : "rectangle",
    color: PALETTE[n.color] ? n.color : "none", x, y, width, height, fontSize,
    fontFamily: n.fontFamily ?? 1, textH,
  };
});
const byId = new Map(nodes.map(n => [n.id, n]));

// ---------- 元素 ----------
const elements = [];
const shapeEl = new Map();

for (const n of nodes) {
  const pal = PALETTE[n.color];
  const shape = element(n.id, n.shape, n.x, n.y, n.width, n.height, pal);
  shapeEl.set(n.id, shape);
  elements.push(shape);

  const label = element(`${n.id}-label`, "text", n.x, n.y + (n.height - n.textH) / 2, n.width, n.textH, {
    text: n.label, originalText: n.label,
    fontSize: n.fontSize, fontFamily: n.fontFamily,
    textAlign: "center", verticalAlign: "middle",
    containerId: n.id, lineHeight: LINE_HEIGHT,
  });
  elements.push(label);
}

// 箭头：从 from 形状边缘指向 to 形状边缘（绑定后渲染器还会再吸附）
function edgeT(dx, dy, hw, hh) {
  const tx = dx !== 0 ? hw / Math.abs(dx) : Infinity;
  const ty = dy !== 0 ? hh / Math.abs(dy) : Infinity;
  return Math.min(tx, ty);
}

const edges = rawEdges.map((e, i) => {
  const id = e.id ?? `edge-${i + 1}`;
  const a = byId.get(e.from), b = byId.get(e.to);
  const c1 = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
  const c2 = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  const dx = c2.x - c1.x, dy = c2.y - c1.y;
  const t1 = edgeT(dx, dy, a.width / 2, a.height / 2);
  const t2 = edgeT(-dx, -dy, b.width / 2, b.height / 2);
  const sx = c1.x + dx * t1, sy = c1.y + dy * t1;
  const ex = c2.x - dx * t2, ey = c2.y - dy * t2;

  const el = element(id, "arrow", sx, sy, ex - sx, ey - sy, {
    roundness: { type: 2 },
    points: [[0, 0], [round(ex - sx), round(ey - sy)]],
    startBinding: { elementId: e.from, focus: 0, gap: 1 },
    endBinding: { elementId: e.to, focus: 0, gap: 1 },
    startArrowhead: null,
    endArrowhead: e.arrowhead ?? "arrow",
    elbowed: false,
    lastCommittedPoint: null,
  });
  elements.push(el);
  return { id, from: e.from, to: e.to };
});

// 双向登记：形状 boundElements 里记上自己的文字和相连箭头
for (const n of nodes) {
  const entries = [];
  for (const e of edges) {
    if (e.from === n.id || e.to === n.id) entries.push({ id: e.id, type: "arrow" });
  }
  entries.push({ id: `${n.id}-label`, type: "text" });
  shapeEl.get(n.id).boundElements = entries;
}

// ---------- 标题/页脚（漂浮文字，宽度留 30% 余量避免被裁切） ----------
const minX = Math.min(...nodes.map(n => n.x));
const maxX = Math.max(...nodes.map(n => n.x + n.width));
const minY = Math.min(...nodes.map(n => n.y));
const maxY = Math.max(...nodes.map(n => n.y + n.height));
const centerX = (minX + maxX) / 2;

function floating(id, text, fontSize, y) {
  const lines = String(text).split("\n");
  const h = lines.length * fontSize * LINE_HEIGHT;
  const w = Math.round(Math.max(...lines.map(l => estTextWidth(l, fontSize))) * 1.15 + 20);
  return element(id, "text", centerX - w / 2, y, w, h, {
    text: String(text), originalText: String(text),
    fontSize, fontFamily: 1, textAlign: "center", verticalAlign: "top",
    containerId: null, lineHeight: LINE_HEIGHT,
  });
}

if (spec.title) elements.push(floating("title", spec.title, spec.titleFontSize ?? 32, minY - 100));
if (spec.footer) elements.push(floating("footer", spec.footer, spec.footerFontSize ?? 16, maxY + 60));

// ---------- 整体避让：保证不贴顶（工具栏）/不贴左 ----------
const topMost = Math.min(...elements.map(e => e.y));
const leftMost = Math.min(...elements.map(e => e.x));
const shiftY = topMost < SAFE_TOP ? SAFE_TOP - topMost : 0;
const shiftX = leftMost < SAFE_LEFT ? SAFE_LEFT - leftMost : 0;
if (shiftX || shiftY) {
  for (const el of elements) {
    el.x = round(el.x + shiftX);
    el.y = round(el.y + shiftY);
  }
}

// ---------- 输出 ----------
const doc = {
  type: "excalidraw",
  version: 2,
  source: "present2me-build",
  elements,
  appState: { viewBackgroundColor: "#ffffff" },
};

const json = JSON.stringify(doc, null, 2) + "\n";
if (STDOUT) {
  process.stdout.write(json);
} else {
  if (!outPath) {
    console.error("缺少输出路径（或加 --stdout 直接打印）");
    process.exit(2);
  }
  writeFileSync(outPath, json);
  console.error(`已生成 ${outPath}：${nodes.length} 节点 / ${edges.length} 箭头 / ${elements.length} 元素`);
}
