// Sprout Live: runs a Sprout 2.0 program as a game, and swaps in new code without losing the game's state.
// Used by index.html, and by node tests (require it after sprout2.js).
(function (root) {
"use strict";
const S2 = root.SproutToJS ? root : require("./sprout2.js");
const SproutToJS = S2.SproutToJS, R = S2.SproutRuntime;

// the compiler's name mangling, so the host can define words like touch-x
function mangle(name) {
  if (name === "@") return "AT";
  let s = "";
  for (const ch of name) s += /[A-Za-z0-9_]/.test(ch) ? ch : "_" + ch.charCodeAt(0).toString(16);
  if (s && /[0-9]/.test(s[0])) s = "_" + s;
  return "v_" + s;
}

// split the source into its top-level statements (one per line, or split by commas, outside brackets)
// so a compiled line can be traced back to the line of Sprout it came from
function statements(src) {
  const out = []; let depth = 0, line = 1, start = 0, has = false, i = 0;
  const n = src.length;
  const end = () => { if (has) out.push(start); has = false; };
  while (i < n) {
    const c = src[i];
    if (c === "-" && src[i + 1] === "-") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "'") { i++; while (i < n && src[i] !== "'") { if (src[i] === "\n") line++; i++; } i++; continue; }
    if (c === '"') { i++; while (i < n && src[i] !== '"') { if (src[i] === "\\") i++; else if (src[i] === "\n") line++; i++; } i++; if (!has) { has = true; start = line; } continue; }
    if (c === "\n") { if (depth === 0) end(); line++; i++; continue; }
    if (c === "," && depth === 0) { end(); i++; continue; }
    if (c === "[" || c === "(" || c === "{") depth++;
    else if (c === "]" || c === ")" || c === "}") depth = Math.max(0, depth - 1);
    if (!/\s/.test(c) && !has) { has = true; start = line; }
    i++;
  }
  end();
  return out;
}

// a bracket that closes the wrong thing, or one left open, usually marks the typo
function bracketLine(src) {
  const stack = []; let line = 1;
  const pair = { "]": "[", ")": "(", "}": "{" };
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "-" && src[i + 1] === "-") { while (i < src.length && src[i] !== "\n") i++; i--; continue; }
    if (c === '"') { i++; while (i < src.length && src[i] !== '"') { if (src[i] === "\n") line++; if (src[i] === "\\") i++; i++; } continue; }
    if (c === "\n") { line++; continue; }
    if (c === "[" || c === "(" || c === "{") stack.push([c, line]);
    else if (c === "]" || c === ")" || c === "}") { const top = stack.pop(); if (!top || top[0] !== pair[c]) return top ? top[1] : line; }
  }
  return stack.length ? stack[stack.length - 1][1] : 0;
}

// find the first statement that will not compile on its own, for a useful line number on typos
function typoLine(src) {
  const b = bracketLine(src);
  if (b) return b;
  const lines = src.split("\n"), starts = statements(src);
  for (let k = 0; k < starts.length; k++) {
    const a = starts[k] - 1, b = (k + 1 < starts.length ? starts[k + 1] - 1 : lines.length);
    const chunk = lines.slice(a, b).join("\n");
    try { SproutToJS.compile(chunk); } catch (e) { return starts[k]; }
  }
  // brackets left open run to the end: report where the open one started
  let depth = 0, at = 0, line = 1;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "-" && src[i + 1] === "-") { while (i < src.length && src[i] !== "\n") i++; line++; continue; }
    if (c === "\n") line++;
    if (c === "[" || c === "(" || c === "{") { if (!depth) at = line; depth++; }
    if (c === "]" || c === ")" || c === "}") depth--;
  }
  return depth > 0 ? at : 0;
}

// wrap every while( loop so a runaway loop stops instead of freezing the page
function guard(js) {
  let out = "", i = 0;
  while (i < js.length) {
    const c = js[i];
    if (c === "'") { let j = i + 1; while (j < js.length && js[j] !== "'") { if (js[j] === "\\") j++; j++; } out += js.slice(i, j + 1); i = j + 1; continue; }
    if (js.startsWith("while(", i) && !/[\w$]/.test(js[i - 1] || "")) {
      let d = 0, j = i + 5;
      for (; j < js.length; j++) { if (js[j] === "(") d++; else if (js[j] === ")") { d--; if (!d) break; } else if (js[j] === "'") { j++; while (j < js.length && js[j] !== "'") { if (js[j] === "\\") j++; j++; } } }
      out += "while(__G()&&" + js.slice(i + 5, j + 1) + ")"; i = j + 1; continue;
    }
    out += c; i++;
  }
  return out;
}

const sig = v => {
  if (v === R.TRUE) return "T"; if (v === R.FALSE) return "F"; if (v === R.NONE) return "N";
  if (typeof v === "number" || typeof v === "string") return typeof v + ":" + v;
  if (Array.isArray(v) || ArrayBuffer.isView(v)) return "[" + Array.from(v).slice(1).map(sig).join(",") + "]";
  if (v instanceof Map) return "{" + Array.from(v).map(([k, x]) => k + ":" + sig(x)).join(",") + "}";
  return null;
};

const INPUTS = ["touch-x", "touch-y", "touching", "tapped", "clock"];

// host: { name: [arity, fn] } plus W and H; returns a program you can step
function build(src, host, keep) {
  host = host || {};
  let js = SproutToJS.compile(src);
  const names = [], lines = js.split("\n");
  const re = /^let (v_[A-Za-z0-9_]+) = (.*?);?$/;
  js = lines.map(l => { const m = l.match(re); if (!m) return l; names.push(m[1]); return "let " + m[1] + " = __keep(\"" + m[1] + "\", " + m[2] + ");"; }).join("\n");
  js = guard(js);
  const inV = INPUTS.map(mangle);
  const head = "let " + inV.map(v => v + "=" + (/touch_2d|clock/.test(v) ? "0" : "FALSE")).join(",") + ";const __in=(a,b,c,d,e)=>{" + inV.map((v, i) => v + "=" + "abcde"[i]).join(";") + "};\n";
  const tail = "\n;return {__in,get:()=>({" + names.map(n => n + ":" + n).join(",") + "}),update:typeof v_update!=='undefined'?v_update:null,draw:typeof v_draw!=='undefined'?v_draw:null}\n//# sourceURL=game.js";
  // every seconds [ ... ]: runs the block on a beat. Timers are keyed by the block's own code,
  // so editing one block restarts only its beat, and the beats carry over when the code changes.
  const timers = new Map(keep && keep.timers ? keep.timers : []);
  let frameDt = 0, clock = keep && keep.clock || 0;
  host = Object.assign({}, host, {
    every: [2, (secs, block) => {
      if (typeof block !== "function" || !(secs > 0)) return R.NONE;
      const k = String(block); let t = (timers.get(k) || 0) + frameDt, n = 0;
      while (t >= secs && n < 4) { t -= secs; n++; R.RUN(block()); }
      timers.set(k, Math.min(t, secs)); return R.NONE;
    }]
  });
  const rnames = Object.keys(R), hk = Object.keys(host);
  const fresh = {}, init = {};
  let loops = 0, t0 = 0;
  const now = typeof performance !== "undefined" ? () => performance.now() : () => Date.now();
  const __G = () => {
    if (++loops > 2e6 || ((loops & 1023) === 0 && now() - t0 > 60)) throw new Error("A loop kept going too long, so it was stopped");
    return true;
  };
  const __keep = (name, v) => {
    if (typeof v === "function") return v;
    const s = sig(v); init[name] = s;
    if (keep && s !== null && name in keep.vals && keep.init[name] === s) return keep.vals[name];
    return v;
  };
  const args = hk.map(k => { const h = host[k]; return Array.isArray(h) ? (h[0] > 1 ? R.AR(h[1], h[0]) : h[1]) : h; });
  const fn = new Function(...rnames, "prnt", "__keep", "__G", ...hk.map(mangle), head + js + tail);
  t0 = now();
  const p = fn(...rnames.map(k => R[k]), host.print ? host.print[1] : (x => x), __keep, __G, ...args);
  p.init = init;
  p.step = (dt, inp) => {
    frameDt = dt; clock += dt;
    p.__in(inp.x || 0, inp.y || 0, inp.down ? R.TRUE : R.FALSE, inp.tap ? R.TRUE : R.FALSE, clock);
    loops = 0; t0 = now(); if (p.update) R.RUN(p.update(dt));
  };
  p.paint = () => { loops = 0; t0 = now(); frameDt = 0; if (p.draw) R.RUN(p.draw()); };
  p.snapshot = () => ({ vals: p.get(), init: p.init, timers: Array.from(timers), clock });
  return p;
}

// a JS error in game.js points at a compiled line; each compiled line is one top-level statement
let LOFF = null;
function lineOf(e, src) {
  const m = String(e && e.stack || "").match(/game\.js:(\d+)/);
  if (!m) return 0;
  if (LOFF === null) {
    try { build("x : 1\nboom : (missing-thing 1)", {}).step(0, {}); } catch (_) {}
    try { const p = build("f : [| 1 ]\nupdate : [dt | nope 1 2 3]", {}); p.step(0, {}); } catch (e2) { const k = String(e2.stack || "").match(/game\.js:(\d+)/); LOFF = k ? +k[1] - 2 : 1; }
    if (LOFF === null) LOFF = 1;
  }
  const idx = +m[1] - LOFF;
  const starts = statements(src);
  return starts[Math.max(0, Math.min(starts.length - 1, idx - 1))] || 0;
}

// turn JS-flavoured messages into Sprout ones
function friendly(msg) {
  const un = s => s.replace(/_([0-9a-f]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
  return String(msg)
    .replace(/\bv_([A-Za-z0-9_]+) is not defined/, (m, n) => "\"" + un(n) + "\" isn't a word Sprout knows yet")
    .replace(/^unexpected: (.*)$/, (m, t) => "this doesn't make sense here: " + t.replace(/^\{"k":"word","v":(".*")\}$/, "$1"))
    .replace(/\bv_([A-Za-z0-9_]+)/g, (m, n) => un(n));
}

const api = { build, mangle, statements, typoLine, bracketLine, lineOf, friendly, R, SproutToJS };
if (typeof module !== "undefined") module.exports = api; else root.SproutLive = api;
})(typeof window !== "undefined" ? window : globalThis);
