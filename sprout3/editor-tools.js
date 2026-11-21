// The Sprout editor's tools, made for phones first: a key bar with suggestions, cursor keys, undo and snippets;
// brackets that close themselves; text size by pinching. Loaded after play.html's own script, whose names it uses
// (ta, code, render, insertText, S, LS, toast ...). It wraps render to see every change to the code.
(function () {
"use strict";
const $ = id => document.getElementById(id);
const css = document.createElement("style");
css.textContent = `
#keys{align-items:center}
#keys .grp{display:flex;gap:6px;flex:0 0 auto}
#keys .sep{flex:0 0 1px;align-self:stretch;background:var(--line);margin:2px 2px}
#keys button.ic{font:600 15px var(--sans);min-width:40px}
#keys button.sug{font:500 14px var(--mono);padding:0 12px;background:var(--acc);color:#fff;box-shadow:none}
#keys button.sug.dim{background:var(--card);color:var(--fg);box-shadow:0 0 0 1px var(--acc)}
#keys button.snip{font:500 13px var(--mono);padding:0 10px;color:var(--fg2)}
#keys button:active{transform:scale(.94)}
`;
document.head.appendChild(css);

// ===================================================================== undo and redo
// every change to the code goes through render, so that is where a version is kept
const UNDO = [], REDO = [];
let restoring = false, lastKept = 0;
function keep() {
  if (restoring) return;
  const top = UNDO[UNDO.length - 1];
  if (top && top.code === code) return;
  const now = performance.now(), sel = [ta.selectionStart, ta.selectionEnd];
  // a run of typing is one step; a pause, or a jump to somewhere else, starts the next
  if (top && now - lastKept < 700 && UNDO.length > 1 && Math.abs(sel[0] - top.sel[0]) <= 2) { top.code = code; top.sel = sel; }
  else { UNDO.push({ code, sel }); if (UNDO.length > 300) UNDO.shift(); }
  lastKept = now; REDO.length = 0; keysUI();
}
function restore(v) {
  restoring = true;
  ta.value = v.code; ta.setSelectionRange(v.sel[0], v.sel[1]); ta.dispatchEvent(new Event("input"));
  restoring = false; keysUI();
}
function undo() { if (UNDO.length < 2) return; REDO.push(UNDO.pop()); restore(UNDO[UNDO.length - 1]); }
function redo() { const v = REDO.pop(); if (!v) return; UNDO.push(v); restore(v); }
const baseRender = window.render;
window.render = function () { baseRender(); keep(); suggestSoon(); window.dispatchEvent(new Event("sprout-render")); };

// ===================================================================== moving the caret
function moveBy(n) { const p = Math.max(0, Math.min(ta.value.length, ta.selectionEnd + n)); ta.focus(); ta.setSelectionRange(p, p); suggestSoon(); }
function moveLine(d) {
  const v = ta.value, p = ta.selectionEnd, start = v.lastIndexOf("\n", p - 1) + 1, col = p - start;
  let target;
  if (d < 0) { if (start === 0) return; const prevStart = v.lastIndexOf("\n", start - 2) + 1; target = Math.min(prevStart + col, start - 1); }
  else { const end = v.indexOf("\n", p); if (end < 0) return; const nextEnd = v.indexOf("\n", end + 1); target = Math.min(end + 1 + col, nextEnd < 0 ? v.length : nextEnd); }
  ta.focus(); ta.setSelectionRange(target, target); suggestSoon();
}

// ===================================================================== brackets close themselves
const PAIRS = { "[": "]", "(": ")", '"': '"' };
function inText(before) { const line = before.slice(before.lastIndexOf("\n") + 1); return (line.replace(/\\./g, "").match(/"/g) || []).length % 2 === 1; }
ta.addEventListener("beforeinput", e => {
  if (TWEAK) return;
  const s = ta.selectionStart, en = ta.selectionEnd, v = ta.value, next = v[en];
  if (e.inputType === "insertText" && e.data && e.data.length === 1) {
    const c = e.data;
    // typing the closer that is already there steps over it
    if ((c === "]" || c === ")" || (c === '"' && inText(v.slice(0, s)))) && next === c && s === en) { e.preventDefault(); ta.setSelectionRange(s + 1, s + 1); return; }
    if (PAIRS[c] && !(c === '"' && inText(v.slice(0, s))) && (!next || /[\s\])},]/.test(next))) {
      e.preventDefault(); const sel = v.slice(s, en);
      insertText(c + sel + PAIRS[c]); const p = s + 1 + sel.length; ta.setSelectionRange(p, p); return;
    }
  }
  // deleting the opener of an empty pair deletes both
  if (e.inputType === "deleteContentBackward" && s === en && s > 0 && PAIRS[v[s - 1]] === next) { e.preventDefault(); ta.setSelectionRange(s - 1, s + 1); insertText(""); }
});

// ===================================================================== suggestions
let namesCache = null, namesFor = "";
function allNames() {
  if (namesFor === code && namesCache) return namesCache;
  const names = new Set();
  for (const m of code.matchAll(/(^|[\s\[(|,])([a-z][\w-]*[?!]?)(?=\s*:)/gim)) names.add(m[2]);   // names bound in the program
  for (const m of code.matchAll(/\b[a-z][\w-]*\b/gi)) if (m[0].length > 2) names.add(m[0]);
  for (const k of Object.keys(S.globals)) names.add(k);
  const P = S.internals && S.internals.PROTOTYPES;
  if (P) for (const kind in P) for (let o = P[kind]; o; o = Object.getPrototypeOf(o)) { if (o === Object.prototype) break; for (const k of Object.keys(o)) if (/^[a-z]/.test(k)) names.add(k); }
  ["start", "update", "draw", "game", "dt", "input", "touching", "tapped", "touch-x", "touch-y", "else", "print", "true", "false", "quote", "script", "yield"].forEach(n => names.add(n));
  namesFor = code; namesCache = [...names];
  return namesCache;
}
const MODULES = () => (S.stdlib ? S.stdlib.names : []).concat(["json"]);
function moduleWords(m) { try { const mod = S.globals[m]; return mod && mod.fieldNames ? mod.fieldNames() : []; } catch (e) { return []; } }
// what is being typed: the word before the caret, and the word before that (a module name, perhaps)
function context() {
  const p = ta.selectionStart; if (p !== ta.selectionEnd) return null;
  const before = ta.value.slice(0, p), line = before.slice(before.lastIndexOf("\n") + 1);
  if (inText(before) || /--/.test(line.replace(/"[^"]*"/g, ""))) return null;
  const m = /([a-z][\w-]*)?$/i.exec(line), prefix = m[1] || "";
  const prev = /([a-z][\w-]*)\s+$/i.exec(line.slice(0, line.length - prefix.length));
  return { prefix, prev: prev ? prev[1] : "", at: p - prefix.length };
}
function suggestions() {
  const c = context(); if (!c) return [];
  if (MODULES().includes(c.prev)) return moduleWords(c.prev).filter(w => w.startsWith(c.prefix)).slice(0, 12).map(w => ({ w, c }));
  if (c.prefix.length < 1) return [];
  const p = c.prefix.toLowerCase();
  const hits = allNames().filter(n => n !== c.prefix && n.toLowerCase().startsWith(p));
  // the program's own names first, then shorter ones
  const own = new Set([...code.matchAll(/(^|\s)([a-z][\w-]*)\s*:/gim)].map(m => m[2]));
  hits.sort((a, b) => (own.has(b) - own.has(a)) || a.length - b.length || (a < b ? -1 : 1));
  return hits.slice(0, 10).map(w => ({ w, c }));
}
function accept(s) {
  ta.focus(); ta.setSelectionRange(s.c.at, s.c.at + s.c.prefix.length);
  const next = ta.value[s.c.at + s.c.prefix.length];
  insertText(s.w + (next && /[\s\])]/.test(next) ? "" : " "));
}

// ===================================================================== the key bar
const SYMBOLS = [":", "[", "]", "(", ")", "|", '"', ",", "!", "..", "+", "-", "*", "/", "<", ">", "=", "--"];
const SNIPPETS = [["[x | ]", "[x | ", "]"], ["with [ ]", "with [", "]"], ["else [ ]", "else [", "]"], ["collect", "collect [x | ", "]"], ["keep", "keep [x | ", "]"], ["print", " print", ""], ["@", " @ ", ""]];
let current = [];
function keysUI() {
  const k = $("keys"); if (!k) return;
  current = suggestions();
  const sug = current.map((s, i) => `<button class="sug${i ? " dim" : ""}" data-s="${i}">${esc(s.w)}</button>`).join("");
  k.innerHTML = (sug ? `<div class="grp">${sug}</div><span class="sep"></span>` : "") +
    `<div class="grp"><button class="ic" data-a="left" aria-label="left">◀</button><button class="ic" data-a="right" aria-label="right">▶</button>` +
    `<button class="ic" data-a="up" aria-label="line up">▲</button><button class="ic" data-a="down" aria-label="line down">▼</button>` +
    `<button class="ic" data-a="undo" aria-label="undo"${UNDO.length < 2 ? " disabled style='opacity:.35'" : ""}>↶</button><button class="ic" data-a="redo" aria-label="redo"${REDO.length ? "" : " disabled style='opacity:.35'"}>↷</button>` +
    `<button class="ic" data-a="indent" aria-label="indent">⇥</button></div><span class="sep"></span>` +
    `<div class="grp">${SYMBOLS.map(s => `<button data-k="${esc(s)}">${esc(s)}</button>`).join("")}</div><span class="sep"></span>` +
    `<div class="grp">${SNIPPETS.map((s, i) => `<button class="snip" data-n="${i}">${esc(s[0])}</button>`).join("")}</div><span class="sep"></span>` +
    `<div class="grp"><button class="ic" data-a="smaller" aria-label="smaller text">A−</button><button class="ic" data-a="bigger" aria-label="bigger text">A+</button></div>`;
  if (sug) k.scrollLeft = 0;
}
let sugT = 0;
function suggestSoon() { clearTimeout(sugT); sugT = setTimeout(keysUI, 60); }
ta.addEventListener("keyup", suggestSoon); ta.addEventListener("click", suggestSoon); ta.addEventListener("focus", suggestSoon);
document.addEventListener("selectionchange", () => { if (document.activeElement === ta) suggestSoon(); });

// a held key repeats, like a keyboard's
let repeatT = 0;
function act(a) {
  ({ left: () => moveBy(-1), right: () => moveBy(1), up: () => moveLine(-1), down: () => moveLine(1), undo, redo,
     indent: () => insertText("  "), smaller: () => fontSize(-1), bigger: () => fontSize(1) })[a]();
}
$("keys").addEventListener("pointerdown", e => {
  const b = e.target.closest("button"); if (!b) return;
  e.preventDefault();   // the textarea keeps its focus, so the keyboard stays up
  if (b.dataset.s) { accept(current[+b.dataset.s]); return; }
  if (b.dataset.k) { const k = b.dataset.k; insertText(k === ":" ? " : " : k === "|" ? " | " : k); return; }
  if (b.dataset.n) { const [, a, z] = SNIPPETS[+b.dataset.n]; const p = ta.selectionStart; insertText(a + z); ta.setSelectionRange(p + a.length, p + a.length); return; }
  if (b.dataset.a) {
    const a = b.dataset.a; act(a);
    if (["left", "right", "up", "down", "undo", "redo"].includes(a)) { clearTimeout(repeatT); repeatT = setTimeout(function again() { act(a); repeatT = setTimeout(again, 70); }, 380); }
  }
});
["pointerup", "pointercancel", "pointerleave"].forEach(t => $("keys").addEventListener(t, () => clearTimeout(repeatT)));
// on a computer: Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z use the same history, and Tab takes a suggestion
ta.addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.stopImmediatePropagation(); e.shiftKey ? redo() : undo(); }
  else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
  else if (e.key === "Tab" && current.length && !e.shiftKey) { e.preventDefault(); e.stopImmediatePropagation(); accept(current[0]); }
}, true);

// ===================================================================== text size: A− A+, or pinch the code
const FS_MIN = 10, FS_MAX = 22;
let fs = LS.get("sprout3.fontSize", 13);
function applyFont() {
  const root = document.documentElement.style;
  root.setProperty("--FS", fs + "px"); root.setProperty("--LH", Math.round(fs * 1.62) + "px");
  if (typeof cwCache !== "undefined") cwCache = 0;
  render();
}
function fontSize(d) { fs = Math.max(FS_MIN, Math.min(FS_MAX, fs + d)); LS.set("sprout3.fontSize", fs); applyFont(); toast("Text size " + fs); }
let pinch = null;
$("ed").addEventListener("touchstart", e => { if (e.touches.length === 2) { const [a, b] = e.touches; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), fs }; } }, { passive: true });
$("ed").addEventListener("touchmove", e => {
  if (!pinch || e.touches.length !== 2) return;
  const [a, b] = e.touches, d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const next = Math.max(FS_MIN, Math.min(FS_MAX, Math.round(pinch.fs * d / pinch.d)));
  if (next !== fs) { fs = next; applyFont(); }
  e.preventDefault();
}, { passive: false });
$("ed").addEventListener("touchend", () => { if (pinch) { pinch = null; LS.set("sprout3.fontSize", fs); } });
if (fs !== 13) applyFont();

window.EditorTools = { undo, redo, suggestions, keysUI, fontSize, get undoDepth() { return UNDO.length; } };
UNDO.push({ code, sel: [0, 0] });
keysUI();
})();
