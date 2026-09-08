#!/usr/bin/env node
// validate-excalidraw.mjs — 手写 .excalidraw 文件的校验器（零依赖）
// 用法: tools/validate-excalidraw.mjs <file.excalidraw> [--json]
//
// 分层：
//   ① schema 检查 —— 对照同目录 excalidraw-schema.json（由 @excalidraw/excalidraw
//     0.18.1 类型蒸馏；restore 宽容的缺省字段不报错，只查"写了但写错"）
//   ② 语义/几何检查 —— id/seed 唯一性、binding 双向登记一致性、
//     包围盒重叠、负坐标、文字截断估算（这才是手写 JSON 的真正错因）
//
// 退出码：有硬错误 = 1；仅警告 = 0（与 d2 validate 不同，本工具退出码可信）。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const SPEC_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "excalidraw-schema.json");
const spec = JSON.parse(readFileSync(SPEC_PATH, "utf8"));

const args = process.argv.slice(2);
const JSON_MODE = args.includes("--json");
const file = args.find(a => !a.startsWith("--"));

const errors = [];   // 硬错误：必修
const warnings = []; // 警告：酌情

function err(id, code, msg) { errors.push({ elementId: id ?? null, code, message: msg }); }
function warn(id, code, msg) { warnings.push({ elementId: id ?? null, code, message: msg }); }

if (!file) {
  console.error("用法: validate-excalidraw.mjs <file.excalidraw> [--json]");
  process.exit(2);
}

// ---------- 载入 ----------
let data;
try {
  data = JSON.parse(readFileSync(file, "utf8").replace(/^﻿/, ""));
} catch (e) {
  err(null, "E_PARSE", `JSON 解析失败: ${e.message}`);
  report(0);
  process.exit(1);
}

if (data?.type !== "excalidraw") err(null, "E_FILE_TYPE", `文件级 type 应为 "excalidraw"，实为 ${JSON.stringify(data?.type)}`);
if (!Array.isArray(data?.elements)) err(null, "E_ELEMENTS", "缺少 elements 数组");
if (data?.version !== undefined && data.version !== 2) warn(null, "W_FILE_VERSION", `文件级 version 建议为 2，实为 ${JSON.stringify(data.version)}`);

const elements = Array.isArray(data?.elements) ? data.elements : [];

// ---------- 工具函数 ----------
const isNum = v => typeof v === "number" && Number.isFinite(v);
const isStr = v => typeof v === "string";
const isBool = v => typeof v === "boolean";
const isPt = v => Array.isArray(v) && v.length === 2 && v.every(isNum);

function typeOk(v, t) {
  if (Array.isArray(t)) return t.some(x => typeOk(v, x));
  switch (t) {
    case "number": return isNum(v);
    case "string": return isStr(v);
    case "boolean": return isBool(v);
    case "array": return Array.isArray(v);
    case "object": return v !== null && typeof v === "object" && !Array.isArray(v);
    case "null": return v === null;
    default: return true;
  }
}

const baseFields = spec.elements.base.fields;
const byType = spec.elements.byType;

// ---------- ① schema 检查 ----------
const ids = new Map(); // id -> element（语义检查用）

function checkField(el, fname, fspec, label) {
  const v = el[fname];
  if (v === undefined) {
    // 缺省字段：restore 会补，静默通过（hardRequired 已单独查过）
    return;
  }
  if (fspec.nullable && v === null) return;
  if (fspec.enum) {
    const allowed = spec.enums[fspec.enum] ?? [];
    if (!allowed.includes(v)) {
      err(label, "E_ENUM", `${fname} 非法值 ${JSON.stringify(v)}（合法: ${allowed.join(" | ")}）`);
    }
    return;
  }
  switch (fspec.kind) {
    case "roundness":
      if (v !== null && !(typeOk(v, "object") && spec.enums.roundnessType.includes(v.type))) {
        err(label, "E_SHAPE", 'roundness 应为 null 或 { "type": 1|2|3 }');
      }
      return;
    case "pointList":
      if (!Array.isArray(v) || v.length === 0 || !v.every(isPt)) {
        err(label, "E_SHAPE", `${fname} 应为非空的 [[x,y], ...] 数字对数组`);
      }
      return;
    case "point":
      if (v !== null && !isPt(v)) err(label, "E_SHAPE", `${fname} 应为 [x,y] 或 null`);
      return;
    case "binding":
      if (v === null) return;
      if (!typeOk(v, "object") || !isStr(v.elementId) || !isNum(v.focus) || !isNum(v.gap)) {
        err(label, "E_SHAPE", `${fname} 应为 null 或 { elementId: string, focus: number, gap: number }`);
      } else if ("fixedPoint" in v && !(el.type === "arrow" && el.elbowed === true)) {
        warn(label, "W_FIXEDPOINT", `${fname}.fixedPoint 只属于肘形箭头（elbowed: true），普通箭头不要带`);
      }
      return;
    case "boundElements":
      if (v === null) return;
      if (!Array.isArray(v)) { err(label, "E_SHAPE", "boundElements 应为 null 或数组"); return; }
      for (const b of v) {
        if (!typeOk(b, "object") || !isStr(b.id) || !["arrow", "text"].includes(b.type)) {
          err(label, "E_SHAPE", `boundElements 条目应为 { "id": string, "type": "arrow"|"text" }，实为 ${JSON.stringify(b)}`);
        }
      }
      return;
    case "scalePair":
      if (!Array.isArray(v) || v.length !== 2 || !v.every(isNum)) {
        err(label, "E_SHAPE", `${fname} 应为 [sx, sy] 数字对`);
      }
      return;
    default:
      if (fspec.type && !typeOk(v, fspec.type)) {
        err(label, "E_TYPE", `${fname} 类型应为 ${[].concat(fspec.type).join("|")}，实为 ${Array.isArray(v) ? "array" : v === null ? "null" : typeof v}`);
      }
  }
}

for (let i = 0; i < elements.length; i++) {
  const el = elements[i];
  const label = typeOk(el, "object") && isStr(el?.id) ? el.id : `#${i}`;
  if (!typeOk(el, "object")) { err(label, "E_SHAPE", "元素应为对象"); continue; }

  // 判别式与必填
  if (!spec.enums.elementType.includes(el.type)) {
    err(label, "E_TYPE", `type 非法: ${JSON.stringify(el.type)}（合法: ${spec.enums.elementType.join(" | ")}）`);
    continue;
  }
  for (const f of spec.elements.base.hardRequired) {
    if (el[f] === undefined) err(label, "E_REQUIRED", `缺少必填字段 ${f}`);
  }
  const tspec = byType[el.type];
  for (const f of tspec?.hardRequired ?? []) {
    if (el[f] === undefined) err(label, "E_REQUIRED", `缺少 ${el.type} 必填字段 ${f}`);
  }

  // 字段逐个对照规格
  for (const [fname, fspec] of Object.entries(baseFields)) checkField(el, fname, fspec, label);
  for (const [fname, fspec] of Object.entries(tspec?.fields ?? {})) checkField(el, fname, fspec, label);

  // text 专有 sanity
  if (el.type === "text" && isStr(el.originalText) && isStr(el.text) && el.originalText !== el.text) {
    warn(label, "W_TEXT", "originalText 与 text 不一致（技能约定两者应相同）");
  }

  if (isStr(el.id)) {
    if (ids.has(el.id)) err(label, "E_DUP_ID", `id 重复（首次出现于元素 ${ids.get(el.id)}）`);
    else ids.set(el.id, label);
  }
}

// ---------- ② 语义 / 几何检查 ----------
const live = elements.filter(e => typeOk(e, "object") && e.isDeleted !== true);

// seed / versionNonce 唯一性
for (const key of ["seed", "versionNonce"]) {
  const seen = new Map();
  for (const el of live) {
    if (!isNum(el[key]) || el[key] === null) continue;
    if (seen.has(el[key])) warn(el.id, `W_DUP_${key.toUpperCase()}`, `${key} 与 ${seen.get(el[key])} 重复（全文件应唯一）`);
    else seen.set(el[key], el.id);
  }
}

// binding 双向登记一致性
function boundEntries(el) {
  return Array.isArray(el.boundElements) ? el.boundElements : [];
}
function hasBoundEntry(target, id, type) {
  return boundEntries(target).some(b => b?.id === id && b?.type === type);
}

for (const el of live) {
  // text.containerId → 容器必须登记回 text
  if (el.type === "text" && isStr(el.containerId)) {
    const target = ids.get(el.containerId) !== undefined ? elements.find(e => e?.id === el.containerId) : null;
    if (!target) err(el.id, "E_DANGLING", `containerId 指向不存在的元素 "${el.containerId}"`);
    else {
      if (!spec.textContainerTypes.includes(target.type)) {
        err(el.id, "E_BIND_TARGET", `containerId 指向的 ${target.type} 不可容纳文字（可容器: ${spec.textContainerTypes.join(" | ")}）`);
      }
      if (!hasBoundEntry(target, el.id, "text")) {
        err(el.id, "E_BIND_BACK", `容器 ${target.id} 的 boundElements 未登记本文字（双向登记缺一不可）`);
      }
    }
  }

  // 箭头/线 binding → 被绑形状必须登记回 arrow
  for (const side of ["startBinding", "endBinding"]) {
    const b = el[side];
    if (!typeOk(b, "object") || !isStr(b?.elementId)) continue;
    const target = elements.find(e => e?.id === b.elementId);
    if (!target) { err(el.id, "E_DANGLING", `${side} 指向不存在的元素 "${b.elementId}"`); continue; }
    if (target.isDeleted === true) { warn(el.id, "W_BIND_DELETED", `${side} 指向已删除元素 ${target.id}`); continue; }
    if (!spec.bindableTypes.includes(target.type)) {
      err(el.id, "E_BIND_TARGET", `${side} 指向的 ${target.type} 不可被绑定（可绑定: ${spec.bindableTypes.join(" | ")}）`);
    }
    if (el.type === "arrow" && !hasBoundEntry(target, el.id, "arrow")) {
      err(el.id, "E_BIND_BACK", `${side} 目标 ${target.id} 的 boundElements 未登记本箭头`);
    }
  }

  // boundElements 出站引用必须真实且类型相符
  for (const b of boundEntries(el)) {
    const target = elements.find(e => e?.id === b?.id);
    if (!target) { err(el.id, "E_DANGLING", `boundElements 引用不存在的元素 "${b?.id}"`); continue; }
    if (target.type !== b.type) {
      err(el.id, "E_BIND_TYPE", `boundElements 登记 "${b.id}" 为 ${b.type}，实际元素类型是 ${target.type}`);
    }
  }
}

// 几何：负坐标（线性元素豁免：其 x/y 是起点，points 可任意方向）
for (const el of live) {
  if (spec.shapeTypes.includes(el.type) && (isNum(el.x) && el.x < 0 || isNum(el.y) && el.y < 0)) {
    warn(el.id, "W_NEGATIVE_XY", `(${el.x}, ${el.y}) 为负坐标，建议从 (100,100) 起排布`);
  }
}

// 几何：包围盒重叠（容器-内嵌关系豁免；粗 AABB 启发式，只警告）
const boxes = live.filter(e => spec.shapeTypes.includes(e.type) && isNum(e.width) && isNum(e.height));
function isContainedBy(a, b) {
  // a 是 b 的内嵌文字 / a 在 b 内（containerId 或 AABB 完全包含）
  if (a.containerId === b.id) return true;
  return a.x >= b.x && a.y >= b.y && a.x + Math.max(a.width, 0) <= b.x + Math.max(b.width, 0)
      && a.y + Math.max(a.height, 0) <= b.y + Math.max(b.height, 0);
}
const OVERLAP_RATIO = 0.35;
for (let i = 0; i < boxes.length; i++) {
  for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (isContainedBy(a, b) || isContainedBy(b, a)) continue;
    const ix = Math.min(a.x + Math.abs(a.width), b.x + Math.abs(b.width)) - Math.max(a.x, b.x);
    const iy = Math.min(a.y + Math.abs(a.height), b.y + Math.abs(b.height)) - Math.max(a.y, b.y);
    if (ix <= 0 || iy <= 0) continue;
    const area = ix * iy;
    const smaller = Math.min(Math.abs(a.width * a.height), Math.abs(b.width * b.height)) || 1;
    if (area / smaller > OVERLAP_RATIO) {
      warn([a.id, b.id].join(" ↔ "), "W_OVERLAP", `两元素包围盒重叠 ${Math.round((area / smaller) * 100)}%，确认是否有意`);
    }
  }
}

// text 截断估算（仅 autoResize === false 时才有截断风险）
for (const el of live) {
  if (el.type !== "text" || el.autoResize !== false || !isStr(el.text) || !isNum(el.fontSize)) continue;
  const units = [...el.text].reduce((s, ch) => s + (ch.codePointAt(0) > 0x2e7f ? 1.0 : 0.6), 0);
  const est = units * el.fontSize;
  if (isNum(el.width) && el.width < est * 0.7) {
    warn(el.id, "W_TEXT_FIT", `autoResize=false 且 width=${el.width} 明显小于估算 ${Math.round(est)}，文字可能被截断`);
  }
}

// ---------- 输出 ----------
report(live.length);

function report(count) {
  const summary = { file, elements: count, errors: errors.length, warnings: warnings.length };
  if (JSON_MODE) {
    console.log(JSON.stringify({ summary, errors, warnings }, null, 2));
  } else {
    for (const e of errors) console.log(`[错误] ${e.elementId ?? "-"}  ${e.message}`);
    for (const w of warnings) console.log(`[警告] ${w.elementId ?? "-"}  ${w.message}`);
    if (errors.length === 0 && warnings.length === 0) {
      console.log(`✅ ${file} 校验通过（${count} 个元素）`);
    } else {
      console.log(`\n${errors.length} 个错误 / ${warnings.length} 个警告（${count} 个元素）`);
    }
  }
  if (errors.length > 0) process.exit(1);
}
