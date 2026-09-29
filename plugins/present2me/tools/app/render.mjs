#!/usr/bin/env node
// render.mjs — p2m-server 渲染执行封装（pixi 优先，PATH 次之）
// 服务端唯一的「机器如何处理文件」知识：找工具链、跑编译、控超时。
// 语法该怎么写、报错怎么解读属于技能层，不在这里。
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// 仓库内布局 plugins/present2me/tools/app → 项目根需向上 4 层；
// 插件安装场景无 pixi.toml，自动走 PATH
const PROJECT_ROOT = path.resolve(HERE, "..", "..", "..", "..");
const PIXI_TOML = path.join(PROJECT_ROOT, "pixi.toml");

function command(kind) {
  if (existsSync(PIXI_TOML)) {
    const pixi = ["pixi", "run", "--manifest-path", PIXI_TOML];
    return kind === "d2" ? [...pixi, "d2"] : [...pixi, "mmdc"];
  }
  return [kind === "d2" ? "d2" : "mmdc"];
}

// 环境自愈（mmdc 用 puppeteer 启动浏览器，是工具链环境问题重灾区）：
// ① PUPPETEER_CACHE_DIR 指向空缓存（常见于沙箱重定向）时清掉，回退默认 home 解析；
// ② puppeteer 自己找不到浏览器时，按固定布局探测缓存里的 chrome-headless-shell，
//    再退到系统 Chrome 常见路径。用户显式配置的 PUPPETEER_EXECUTABLE_PATH 永远优先。
function findBrowserBin() {
  const cache = path.join(os.homedir(), ".cache", "puppeteer", "chrome-headless-shell");
  if (existsSync(cache)) {
    const versions = readdirSync(cache).sort().reverse();
    for (const v of versions) {
      const vDir = path.join(cache, v);
      try {
        for (const plat of readdirSync(vDir)) {
          // 布局: <cache>/<ver>/<解压目录>/<二进制>
          const bin = path.join(vDir, plat, process.platform === "win32" ? "chrome-headless-shell.exe" : "chrome-headless-shell");
          if (existsSync(bin)) return bin;
        }
      } catch { /* 非目录条目跳过 */ }
    }
  }
  const system = process.platform === "darwin"
    ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
    : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  return system.find(existsSync) ?? null;
}

function childEnv() {
  const env = { ...process.env };
  const dir = env.PUPPETEER_CACHE_DIR;
  if (dir && !existsSync(path.join(dir, "chrome")) && !existsSync(path.join(dir, "chrome-headless-shell"))) {
    delete env.PUPPETEER_CACHE_DIR;
  }
  if (!env.PUPPETEER_EXECUTABLE_PATH) {
    const bin = findBrowserBin();
    if (bin) env.PUPPETEER_EXECUTABLE_PATH = bin;
  }
  return env;
}

function run(cmd, args, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], env: childEnv() });
    let out = "", err = "", done = false;
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, timeoutMs);
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { err += d; });
    child.on("error", (e) => {   // ENOENT（pixi 不在 PATH）等
      if (done) return; done = true; clearTimeout(timer);
      resolve({ code: null, out, err: err + String(e.message) });
    });
    child.on("close", (code) => {
      if (done) return; done = true; clearTimeout(timer);
      resolve({ code, out, err });
    });
  });
}

// kind: "d2" | "mmd"; format: "svg" | "png"（png 仅 d2）
export async function render(kind, inFile, format, timeoutMs) {
  const out = inFile.slice(0, -path.extname(inFile).length) + "." + format;
  const [cmd, ...base] = command(kind);
  const args = kind === "d2"
    ? [...base, inFile, out]
    : [...base, "-i", inFile, "-o", out];
  const { code, out: stdout, err: stderr } = await run(cmd, args, timeoutMs);
  if (code === 0 && existsSync(out)) {
    return { ok: true, output: out };
  }
  const detail = (stderr || stdout || "").trim();
  const why = code === null
    ? `渲染器不可用（${cmd} 启动失败）：${detail || "见 p2m-server 日志"}`
    : detail || `渲染器退出码 ${code}`;
  return { ok: false, error: why };
}

// d2 validate：不出图的快速语法检查。d2 以输出为准（退出码不可信，
// 与 viz-d2 技能铁律一致）：输出含 err: 前缀即失败，行列号在文本里。
export async function validateD2(inFile, timeoutMs) {
  const [cmd, ...base] = command("d2");
  const { code, out: stdout, err: stderr } = await run(cmd, [...base, "validate", inFile], timeoutMs);
  const text = (stderr || stdout || "").trim();
  if (code === null) return { ok: false, error: `d2 不可用：${text || "启动失败"}` };
  if (/^err:/m.test(text) || (code !== 0 && text)) return { ok: false, error: text };
  if (code !== 0) return { ok: false, error: `d2 validate 退出码 ${code}` };
  return { ok: true, message: text || "valid" };
}
