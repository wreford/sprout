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
const MODULES = () => (S.stdlib ? S.stdlib.names : []).concat(["json"], S.libraries ? S.libraries.names : []);
// a library's words are known before it loads, so suggestions don't load it
function libraryWords(m) { const L = S.libraries && S.libraries.LIBRARIES[m]; if (!L) return null; try { return Object.keys(L.words(new Proxy(function () {}, { get: () => () => {}, apply: () => ({}) }))); } catch (e) { return []; } }
function moduleWords(m) { const lw = libraryWords(m); if (lw) return lw; try { const mod = S.globals[m]; return mod && mod.fieldNames ? mod.fieldNames() : []; } catch (e) { return []; } }
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
  const lit = typeof caretLiteral === "function" ? caretLiteral() : null;
  const chip = lit ? `<button class="ctlchip" data-lit="1">${{ number: "Slide", colour: "Colour", pair: "Pad", bool: "Flip" }[lit.kind]} ${esc(lit.text.length > 9 ? lit.text.slice(0, 9) + "…" : lit.text)}</button>` : "";
  const run = !autoRun ? `<button class="run" data-run="1">Run ▶</button>` : "";
  const pv = probe ? `<button class="probe" data-probe="1">= ${esc(short(probe.value) || "[cell]")}</button>` : "";
  const sug = run + pv + chip + current.map((s, i) => `<button class="sug${i ? " dim" : ""}" data-s="${i}">${esc(s.w)}</button>`).join("");
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
  if (b.dataset.run) { runCode(); return; }
  if (b.dataset.probe) { if (probe) toast(probe.text + " = " + S.format(probe.value)); return; }
  if (b.dataset.lit) { const tok = caretLiteral(); if (tok) { const r = b.getBoundingClientRect(); openCtl(tok, r.left + r.width / 2, r.top - 260); } return; }
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

// ===================================================================== live values
// each top-level name shows its value at the end of its line, and each field of start shows the game's value now
css.textContent += `
#vals{position:absolute;left:0;top:0;z-index:1;pointer-events:none;white-space:pre}
#vals i{position:absolute;font:var(--FS,13px)/var(--LH) var(--mono);font-style:normal;color:var(--acc2);opacity:.85;white-space:pre}
#vals i::before{content:"= ";opacity:.55}
body.novals #vals{display:none}
.lc{box-shadow:inset 0 -4px 0 var(--sw);border-radius:2px}
`;
const vals = document.createElement("div"); vals.id = "vals"; $("ed").appendChild(vals);
const plain = /^(-?\d+(\.\d+)?|"[^"\[]*"|#[0-9a-f]{3,8}|\$[\d.]+|\d+x\d+|true|false|'[\w-]+)$/i;
function valueLines() {
  const lines = code.split("\n"), out = [];
  let inStart = false, childIndent = -1;
  lines.forEach((line, i) => {
    const indent = line.match(/^ */)[0].length, m = /^\s*([a-z][\w-]*)\s*:\s*(.*?)\s*(--.*)?$/i.exec(line);
    if (indent === 0) { inStart = /^start\s*:\s*$/.test(line); childIndent = -1; }
    if (!m) return;
    const [, name, expr] = m, codeEnd = line.replace(/\s*--.*$/, "").length;
    if (indent === 0 && !["start", "update", "draw"].includes(name) && expr && !plain.test(expr) && !/^\[[^\]]*\|/.test(expr)) out.push({ i, name, from: "file", codeEnd, line });
    else if (inStart && indent > 0) { if (childIndent < 0) childIndent = indent; if (indent === childIndent) out.push({ i, name, from: "state", codeEnd, line }); }
  });
  return out;
}
function short(v) {
  if (v instanceof S.Cell && v.takesInput()) return null;
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(+v.toFixed(3));
  let t; try { t = brief(v); } catch (e) { return null; }
  return t.length > 34 ? t.slice(0, 34) + "…" : t;
}
let valsOn = LS.get("sprout3.values", true);
function showValues() {
  if (!valsOn || TAB !== "code") { vals.innerHTML = ""; return; }
  const file = game ? game.file : lastProgram, state = game ? game.state : null;
  if (!file) { vals.innerHTML = ""; return; }
  const cw = charW(), lh = LH(), left = parseFloat(getComputedStyle(ta).paddingLeft);
  let h = "";
  for (const v of valueLines()) {
    let value;
    try { value = v.from === "state" ? (state ? state.field(v.name) : S.UNSET) : file.field(v.name); } catch (e) { continue; }
    if (value === S.UNSET || value === undefined) continue;
    const t = short(value); if (t === null) continue;
    // after the code, or after the comment if the comment leaves no room
    const comment = v.line.indexOf("--", v.codeEnd), room = comment < 0 ? Infinity : comment - v.codeEnd;
    const col = room >= t.length + 5 ? v.codeEnd + 2 : v.line.length + 2;
    h += `<i style="top:${PAD + v.i * lh}px;left:${left + col * cw}px">${esc(t)}</i>`;
  }
  if (vals._h !== h) { vals.innerHTML = h; vals._h = h; }
}
function placeValues() { vals.style.transform = `translate(${-ta.scrollLeft}px,${-ta.scrollTop}px)`; }
ta.addEventListener("scroll", placeValues);
setInterval(() => { if (!document.hidden) { showValues(); placeValues(); } }, 200);
window.addEventListener("sprout-render", () => { showValues(); placeValues(); });

// colours in the code are underlined in their own colour
const baseLine = window.lineHTML;
window.lineHTML = function (s) {
  return baseLine(s)
    .replace(/<i class="l">(#[0-9a-f]{3,8})<\/i>/gi, (m, c) => `<i class="l lc" style="--sw:${c}">${c}</i>`)
    .replace(/<i class="s">(&quot;|")(#[0-9a-f]{3,8})(&quot;|")<\/i>/gi, (m, q1, c, q2) => `<i class="s"><span class="lc" style="--sw:${c}">${q1}${c}${q2}</span></i>`);
};

// ===================================================================== line actions: tap a line number
css.textContent += `
#gut{pointer-events:auto;cursor:pointer;-webkit-user-select:none;user-select:none}
#lineMenu{position:fixed;z-index:45;display:none;flex-direction:column;min-width:170px;padding:6px;border-radius:12px;background:var(--card);box-shadow:0 0 0 1px var(--line),0 12px 32px rgba(0,0,0,.22)}
#lineMenu.on{display:flex}
#lineMenu b{font:600 11px var(--sans);letter-spacing:.06em;text-transform:uppercase;color:var(--fg3);padding:6px 10px 4px}
#lineMenu button{text-align:left;font:500 15px var(--sans);padding:10px 12px;border-radius:8px;color:var(--fg)}
#lineMenu button:active{background:var(--card2)}
#lineMenu .row{display:flex;gap:4px}#lineMenu .row button{flex:1;text-align:center}
`;
const menu = document.createElement("div"); menu.id = "lineMenu"; document.body.appendChild(menu);
let menuLine = 0;
function lineAt(clientY) { const r = ta.getBoundingClientRect(); return Math.floor((clientY - r.top - PAD + ta.scrollTop) / LH()) + 1; }
function editLines(change, caretLine) {
  const lines = code.split("\n"); change(lines);
  ta.value = lines.join("\n");
  const n = Math.max(1, Math.min(lines.length, caretLine)); let p = 0; for (let k = 0; k < n - 1; k++) p += lines[k].length + 1;
  ta.setSelectionRange(p + lines[n - 1].length, p + lines[n - 1].length);
  ta.dispatchEvent(new Event("input"));
}
const LINE_ACTIONS = {
  comment: n => editLines(L => { const l = L[n - 1]; L[n - 1] = /^\s*-- ?/.test(l) ? l.replace(/^(\s*)-- ?/, "$1") : l.replace(/^(\s*)/, "$1-- "); }, n),
  duplicate: n => editLines(L => L.splice(n, 0, L[n - 1]), n + 1),
  up: n => n > 1 && editLines(L => L.splice(n - 2, 2, L[n - 1], L[n - 2]), n - 1),
  down: n => editLines(L => { if (n < L.length) L.splice(n - 1, 2, L[n], L[n - 1]); }, n + 1),
  delete: n => editLines(L => L.splice(n - 1, 1), n),
  select: n => { const L = code.split("\n"); let p = 0; for (let k = 0; k < n - 1; k++) p += L[k].length + 1; ta.focus(); ta.setSelectionRange(p, p + L[n - 1].length); },
};
function openMenu(n, x, y) {
  const lines = code.split("\n"); if (n < 1 || n > lines.length) return;
  menuLine = n;
  const commented = /^\s*--/.test(lines[n - 1]);
  menu.innerHTML = `<b>Line ${n}</b><button data-l="comment">${commented ? "Uncomment" : "Comment out"}</button><button data-l="duplicate">Duplicate</button>` +
    `<div class="row"><button data-l="up" aria-label="move up">Move ▲</button><button data-l="down" aria-label="move down">Move ▼</button></div>` +
    `<button data-l="select">Select</button><button data-l="delete" style="color:var(--bad)">Delete</button>`;
  menu.classList.add("on");
  const w = menu.offsetWidth, h = menu.offsetHeight;
  menu.style.left = Math.max(8, Math.min(innerWidth - w - 8, x + 12)) + "px";
  menu.style.top = Math.max(8, Math.min((visualViewport ? visualViewport.height : innerHeight) - h - 8, y - 20)) + "px";
}
function closeMenu() { menu.classList.remove("on"); }
gut.addEventListener("pointerdown", e => { e.preventDefault(); const n = lineAt(e.clientY); openMenu(n, e.clientX, e.clientY); });
menu.addEventListener("pointerdown", e => {
  e.preventDefault();
  const b = e.target.closest("button"); if (!b) return;
  const a = b.dataset.l; LINE_ACTIONS[a](menuLine);
  // moving keeps the menu open on the line, so a line can be moved several places in a row
  if (a === "up" && menuLine > 1) { menuLine--; openMenu(menuLine, parseFloat(menu.style.left) - 12, parseFloat(menu.style.top) + 20 - LH()); }
  else if (a === "down" && menuLine < code.split("\n").length) { menuLine++; openMenu(menuLine, parseFloat(menu.style.left) - 12, parseFloat(menu.style.top) + 20 + LH()); }
  else closeMenu();
});
document.addEventListener("pointerdown", e => { if (menu.classList.contains("on") && !menu.contains(e.target) && e.target !== gut) closeMenu(); }, true);

// ===================================================================== touch controls for literals
// In Tweak mode a tap on a number gives a slider, on a colour a picker, on a pair a pad, and true/false flips.
// While typing, the key bar offers the same control for the literal at the caret.
css.textContent += `
#ctl{position:fixed;z-index:46;display:none;width:min(340px,calc(100vw - 20px));padding:12px 14px 14px;border-radius:14px;background:var(--card);box-shadow:0 0 0 1px var(--line),0 14px 36px rgba(0,0,0,.25);font:500 13px var(--sans);color:var(--fg)}
#ctl.on{display:block}
#ctl .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
#ctl .hd b{font:600 15px var(--mono)}#ctl .hd button{font:600 13px var(--sans);color:var(--fg3);padding:4px 6px}
#ctl input[type=range]{width:100%;height:34px;accent-color:var(--acc);margin:2px 0}
#ctl .row{display:flex;gap:8px;align-items:center}#ctl .row button{flex:1;height:38px;border-radius:9px;background:var(--card2);box-shadow:0 0 0 1px var(--line);font:600 15px var(--mono)}
#ctl label{display:block;font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--fg3);margin-top:6px}
#ctl .sw{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}#ctl .sw button{width:30px;height:30px;border-radius:8px;box-shadow:0 0 0 1px var(--line)}
#ctl .pad{position:relative;height:200px;border-radius:10px;background:var(--card2);box-shadow:inset 0 0 0 1px var(--line);touch-action:none;overflow:hidden}
#ctl .pad i{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:var(--acc);box-shadow:0 2px 8px rgba(0,0,0,.3)}
#ctl .pad::before,#ctl .pad::after{content:"";position:absolute;background:var(--line)}#ctl .pad::before{left:50%;top:0;bottom:0;width:1px}#ctl .pad::after{top:50%;left:0;right:0;height:1px}
#keys button.ctlchip{background:var(--card2);box-shadow:0 0 0 1.5px var(--acc);font:600 13px var(--sans);padding:0 12px}
`;
const ctl = document.createElement("div"); ctl.id = "ctl"; document.body.appendChild(ctl);
const STOP = ' \t\n[](),|:"';
// the literal at an offset in the code: { start, len, text, kind }
function literalAt(pos) {
  const v = code; if (pos < 0 || pos > v.length) return null;
  let a = pos, b = pos;
  while (a > 0 && !STOP.includes(v[a - 1])) a--;
  while (b < v.length && !STOP.includes(v[b])) b++;
  if (a === b) return null;
  const text = v.slice(a, b), lineStart = v.lastIndexOf("\n", a - 1) + 1, before = v.slice(lineStart, a);
  const inString = (before.replace(/\\./g, "").match(/"/g) || []).length % 2 === 1;
  if (/--/.test(before.replace(/"[^"]*"/g, ""))) return null;
  let kind = null;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(text)) kind = "colour";
  else if (inString) return null;
  else if (/^-?\d+(\.\d+)?$/.test(text)) kind = "number";
  else if (/^-?\d+(\.\d+)?x-?\d+(\.\d+)?$/.test(text)) kind = "pair";
  else if (text === "true" || text === "false") kind = "bool";
  return kind ? { start: a, len: b - a, text, kind } : null;
}
function replaceLiteral(tok, text) {
  if (text === code.substr(tok.start, tok.len)) return;
  const st = ta.scrollTop, sl = ta.scrollLeft;
  code = code.slice(0, tok.start) + text + code.slice(tok.start + tok.len); tok.len = text.length; tok.text = text;
  ta.value = code; ta.scrollTop = st; ta.scrollLeft = sl;
  if (!dirty) { dirty = true; headUI(); }
  render(); queueSave(); if (tryBuild(code)) renderState();
}
// colours: hex to hue, saturation, lightness and back
function hexToHsl(hex) {
  let h = hex.slice(1); if (h.length === 3) h = h.replace(/./g, c => c + c);
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255), max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const hue = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hue * 60, s, l];
}
function hslToHex(h, s, l) {
  const f = n => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l), c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(c * 255).toString(16).padStart(2, "0"); };
  return "#" + f(0) + f(8) + f(4);
}
const SWATCHES = ["#e8a33d", "#d9531e", "#c4453b", "#f4b6c2", "#d4c1ec", "#8a7bd8", "#5fa8d3", "#1f6f8b", "#4fb0c6", "#3f8f5a", "#c9e4c5", "#f6d5a6", "#ffffff", "#9a978d", "#3d3c38", "#14161a"];
let ctlTok = null;
function placeCtl(x, y) {
  ctl.classList.add("on");
  const w = ctl.offsetWidth, h = ctl.offsetHeight, vh = window.visualViewport ? visualViewport.height : innerHeight;
  ctl.style.left = Math.max(10, Math.min(innerWidth - w - 10, x - w / 2)) + "px";
  ctl.style.top = (y + 18 + h < vh ? y + 18 : Math.max(10, y - h - 18)) + "px";
}
function closeCtl() { ctl.classList.remove("on"); ctlTok = null; }
function openCtl(tok, x, y) {
  if (tok.kind === "bool") { replaceLiteral(tok, tok.text === "true" ? "false" : "true"); flashLive(code); toast(tok.text + " now"); return; }
  ctlTok = tok;
  const head = `<div class="hd"><b id="ctlV">${esc(tok.text)}</b><button id="ctlX">Done</button></div>`;
  if (tok.kind === "number") {
    const v0 = parseFloat(tok.text), dec = (tok.text.split(".")[1] || "").length, step = Math.pow(10, -dec), span = Math.max(dec ? 1 : 10, Math.abs(v0)) * 2;
    ctl.innerHTML = head + `<input type="range" id="ctlR" min="${v0 - span}" max="${v0 + span}" step="${step}" value="${v0}">` +
      `<div class="row"><button data-d="-10">−${10 * step >= 1 ? 10 * step : (10 * step).toFixed(dec)}</button><button data-d="-1">−</button><button data-d="1">+</button><button data-d="10">+${10 * step >= 1 ? 10 * step : (10 * step).toFixed(dec)}</button></div>`;
    const set = v => { const t = dec ? v.toFixed(dec) : String(Math.round(v)); replaceLiteral(tok, t); $("ctlV").textContent = t; };
    $("ctlR").oninput = e => set(parseFloat(e.target.value));
    $("ctlR").onchange = () => { flashLive(code); };
    ctl.querySelectorAll("[data-d]").forEach(b => b.onpointerdown = e => { e.preventDefault(); const v = parseFloat(tok.text) + parseFloat(b.dataset.d) * step; set(v); $("ctlR").value = v; });
  } else if (tok.kind === "colour") {
    let [h, s, l] = hexToHsl(tok.text);
    const grad = (k) => k === "h" ? "linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" : "";
    ctl.innerHTML = head + `<label>Hue</label><input type="range" id="cH" min="0" max="360" value="${h}" style="accent-color:${tok.text}">` +
      `<label>Saturation</label><input type="range" id="cS" min="0" max="100" value="${s * 100}"><label>Lightness</label><input type="range" id="cL" min="0" max="100" value="${l * 100}">` +
      `<div class="sw">${SWATCHES.map(c => `<button data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join("")}</div>`;
    const keepCase = tok.text === tok.text.toUpperCase() && /[A-F]/.test(tok.text);
    const set = hex => { hex = keepCase ? hex.toUpperCase() : hex; replaceLiteral(tok, hex); $("ctlV").textContent = hex; $("cH").style.accentColor = hex; };
    const fromSliders = () => set(hslToHex(+$("cH").value, $("cS").value / 100, $("cL").value / 100));
    ["cH", "cS", "cL"].forEach(id => { $(id).oninput = fromSliders; $(id).onchange = () => flashLive(code); });
    ctl.querySelectorAll("[data-c]").forEach(b => b.onpointerdown = e => { e.preventDefault(); set(b.dataset.c); [h, s, l] = hexToHsl(b.dataset.c); $("cH").value = h; $("cS").value = s * 100; $("cL").value = l * 100; flashLive(code); });
  } else if (tok.kind === "pair") {
    const [x0, y0] = tok.text.split("x").map(Number), dec = Math.max(...tok.text.split("x").map(p => (p.split(".")[1] || "").length));
    const sx = Math.max(10, Math.abs(x0)), sy = Math.max(10, Math.abs(y0));
    ctl.innerHTML = head + `<div class="pad" id="cP"><i id="cDot"></i></div>`;
    const pad = $("cP"), dot = $("cDot");
    const show = (x, y) => { dot.style.left = (50 + (x - x0) / sx * 50) + "%"; dot.style.top = (50 + (y - y0) / sy * 50) + "%"; };
    show(x0, y0);
    let dragging = false;
    const at = e => { const r = pad.getBoundingClientRect(); const fx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), fy = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
      const x = x0 + (fx - .5) * 2 * sx, y = y0 + (fy - .5) * 2 * sy, f = n => dec ? n.toFixed(dec) : String(Math.round(n)), t = f(x) + "x" + f(y);
      replaceLiteral(tok, t); $("ctlV").textContent = t; show(+f(x), +f(y)); };
    pad.onpointerdown = e => { e.preventDefault(); dragging = true; pad.setPointerCapture(e.pointerId); at(e); };
    pad.onpointermove = e => { if (dragging) at(e); };
    pad.onpointerup = () => { dragging = false; flashLive(code); };
  }
  $("ctlX").onpointerdown = e => { e.preventDefault(); closeCtl(); };
  placeCtl(x, y);
}
document.addEventListener("pointerdown", e => { if (ctl.classList.contains("on") && !ctl.contains(e.target) && !e.target.closest("#keys")) closeCtl(); }, true);
// in Tweak mode, a tap (not a drag) on a literal opens its control
function offsetAt(e) {
  const r = ta.getBoundingClientRect(), cs = getComputedStyle(ta);
  const col = Math.floor((e.clientX - r.left - parseFloat(cs.paddingLeft) + ta.scrollLeft) / charW()), line = Math.floor((e.clientY - r.top - parseFloat(cs.paddingTop) + ta.scrollTop) / LH());
  const lines = code.split("\n"); if (line < 0 || line >= lines.length || col < 0 || col > lines[line].length) return -1;
  let off = 0; for (let k = 0; k < line; k++) off += lines[k].length + 1; return off + Math.min(col, lines[line].length - 1);
}
let tapStart = null;
ta.addEventListener("pointerdown", e => { tapStart = TWEAK ? { x: e.clientX, y: e.clientY, t: performance.now() } : null; }, true);
ta.addEventListener("pointerup", e => {
  if (!tapStart || !TWEAK) return;
  const moved = Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y), quick = performance.now() - tapStart.t < 500; tapStart = null;
  if (moved > 6 || !quick) return;
  const tok = literalAt(offsetAt(e)); if (tok) openCtl(tok, e.clientX, e.clientY);
});
// while typing, the literal at the caret can be opened from the key bar
function caretLiteral() { if (ta.selectionStart !== ta.selectionEnd) return null; return literalAt(ta.selectionStart) || literalAt(ta.selectionStart - 1); }

// ===================================================================== the Live sheet: history, speed, run as you type
css.textContent += `
#liveSheet{position:fixed;z-index:47;left:50%;bottom:calc(var(--bar) + 12px);transform:translateX(-50%);display:none;width:min(420px,calc(100vw - 20px));padding:14px 16px 16px;border-radius:16px;background:var(--card);box-shadow:0 0 0 1px var(--line),0 16px 40px rgba(0,0,0,.25);font:500 14px var(--sans);color:var(--fg)}
#liveSheet.on{display:block}
#liveSheet h3{margin:0 0 2px;font:600 15px var(--sans);display:flex;justify-content:space-between;align-items:center}#liveSheet h3 button{font:600 13px var(--sans);color:var(--fg3)}
#liveSheet .lbl{font:600 11px var(--sans);letter-spacing:.06em;text-transform:uppercase;color:var(--fg3);margin:14px 0 6px}
#liveSheet .seg2{display:flex;gap:6px}#liveSheet .seg2 button{flex:1;height:36px;border-radius:9px;background:var(--card2);box-shadow:0 0 0 1px var(--line);font:600 14px var(--sans)}
#liveSheet .seg2 button.on{background:var(--acc);color:#fff;box-shadow:none}
#liveSheet input[type=range]{width:100%;accent-color:var(--acc);height:34px}
#liveSheet .hist{font-size:13px;color:var(--fg2);min-height:18px}
#liveSheet .sw{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-top:1px solid var(--line)}
#liveSheet .sw:first-of-type{border-top:0}
#liveSheet .tg{width:46px;height:28px;border-radius:14px;background:var(--line2);position:relative;flex:0 0 auto}
#liveSheet .tg::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:left .15s}
#liveSheet .tg.on{background:var(--acc)}#liveSheet .tg.on::after{left:21px}
#bLive.on{background:var(--acc);color:#fff}
#keys button.run{background:var(--acc);color:#fff;box-shadow:none;font:600 14px var(--sans);padding:0 14px}
#keys button.probe{background:var(--card2);box-shadow:0 0 0 1.5px var(--fg3);font:500 13px var(--mono);padding:0 12px;max-width:62vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
`;
const sheet = document.createElement("div"); sheet.id = "liveSheet"; document.body.appendChild(sheet);
// every version that ran, kept for each example in this browser
const VKEY = () => "sprout3.versions." + (curEx || "untitled");
let versions = LS.get(VKEY(), []), versionsFor = curEx, browsing = -1;
function rememberVersion() {
  if (browsing >= 0) return;
  if (versionsFor !== curEx) { versions = LS.get(VKEY(), []); versionsFor = curEx; }
  const last = versions[versions.length - 1];
  if (last && last.code === code) return;
  versions.push({ code, at: Date.now() }); if (versions.length > 60) versions.shift();
  LS.set(VKEY(), versions);
}
let autoRun = LS.get("sprout3.autoRun", true);
const baseTryBuild = window.tryBuild;
let runNow = false;
window.tryBuild = function (src) {
  // with run-as-you-type off, edits wait for the Run button; the touch controls still run at once
  if (!autoRun && !runNow && !(ctlTok) && !document.body.classList.contains("scrubbing")) { keysUI(); return false; }
  const ok = baseTryBuild(src); if (ok) rememberVersion(); return ok;
};
function runCode() { runNow = true; try { if (window.tryBuild(code)) flashLive(code); renderState(); } finally { runNow = false; } keysUI(); }
const ago = t => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? s + " s ago" : s < 3600 ? Math.round(s / 60) + " min ago" : Math.round(s / 3600) + " h ago"; };
function diffNote(a, b) { const A = new Set(a.split("\n")), B = new Set(b.split("\n")); let add = 0, del = 0; for (const l of B) if (!A.has(l)) add++; for (const l of A) if (!B.has(l)) del++; return "+" + add + " −" + del + " lines"; }
function sheetUI() {
  if (versionsFor !== curEx) { versions = LS.get(VKEY(), []); versionsFor = curEx; }
  const n = versions.length, at = browsing >= 0 ? browsing : n - 1;
  const v = versions[at];
  sheet.innerHTML = `<h3>Live coding<button id="lsX">Done</button></h3>` +
    `<div class="lbl">History</div>` +
    (n > 1 ? `<input type="range" id="lsH" min="0" max="${n - 1}" value="${at}"><div class="hist">${browsing >= 0 ? "Version " + (at + 1) + " of " + n + " · " + ago(v.at) + " · " + diffNote(versions[n - 1].code, v.code) + " from now" : n + " versions so far · drag back to play an older one"}</div>` +
      (browsing >= 0 ? `<div class="seg2" style="margin-top:8px"><button id="lsKeep">Keep this version</button><button id="lsNow" class="on">Back to now</button></div>` : "")
      : `<div class="hist">Each version that runs is kept here. Change something to start.</div>`) +
    `<div class="lbl">Speed</div><div class="seg2">${[0.25, 0.5, 1, 2].map(k => `<button data-sp="${k}" class="${SPEED === k ? "on" : ""}">${k === 0.25 ? "¼" : k === 0.5 ? "½" : k}×</button>`).join("")}</div>` +
    `<div class="lbl">While you type</div>` +
    `<div class="sw"><span>Run as I type</span><button class="tg${autoRun ? " on" : ""}" id="lsAuto" aria-label="run as I type"></button></div>` +
    `<div class="sw"><span>Values beside the code</span><button class="tg${valsOn ? " on" : ""}" id="lsVals" aria-label="values beside the code"></button></div>`;
  const h = $("lsH");
  if (h) h.oninput = () => { const k = +h.value; if (k === versions.length - 1) { backToNow(); return; } browseTo(k); };
  const on = (id, f) => { const e = $(id); if (e) e.onclick = f; };
  on("lsX", closeSheet); on("lsNow", backToNow);
  on("lsKeep", () => { const k = browsing; browsing = -1; versions.push({ code: versions[k].code, at: Date.now() }); LS.set(VKEY(), versions); toast("Kept version " + (k + 1)); sheetUI(); });
  sheet.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => { SPEED = +b.dataset.sp; toast(SPEED === 1 ? "Normal speed" : SPEED < 1 ? "Slow motion " + b.textContent : "Fast " + b.textContent); sheetUI(); });
  on("lsAuto", () => { autoRun = !autoRun; LS.set("sprout3.autoRun", autoRun); if (autoRun) runCode(); sheetUI(); keysUI(); });
  on("lsVals", () => { valsOn = !valsOn; LS.set("sprout3.values", valsOn); showValues(); sheetUI(); });
}
function setSource(src) { const st = ta.scrollTop; ta.value = src; code = src; ta.scrollTop = st; render(); queueSave(); runNow = true; try { if (window.tryBuild(src)) renderState(); } finally { runNow = false; } }
function browseTo(k) { browsing = k; setSource(versions[k].code); sheetUI(); }
function backToNow() { if (browsing < 0) return; browsing = -1; setSource(versions[versions.length - 1].code); sheetUI(); }
function openSheet() { sheetUI(); sheet.classList.add("on"); $("bLive").classList.add("on"); }
function closeSheet() { sheet.classList.remove("on"); $("bLive").classList.remove("on"); }
$("bLive").addEventListener("pointerdown", e => { e.preventDefault(); sheet.classList.contains("on") ? closeSheet() : openSheet(); });
document.addEventListener("pointerdown", e => { if (sheet.classList.contains("on") && !sheet.contains(e.target) && !e.target.closest("#bLive")) closeSheet(); }, true);

// ===================================================================== the value of a selection
// select an expression and the key bar shows its value, worked out with the program's names (and game, the state now)
let probe = null, probeT = 0;
function probeSelection() {
  const a = ta.selectionStart, b = ta.selectionEnd, text = ta.value.slice(a, b).trim();
  probe = null;
  if (!text || text.length > 300 || b - a < 1) return;
  const file = game ? game.file : lastProgram; if (!file) return;
  const names = new Map();
  for (const k of file.fieldNames()) if (!["update", "draw"].includes(k)) { try { names.set(k, file.field(k)); } catch (e) {} }
  if (game) names.set("game", game.state);
  let failed = false;
  quietLog = true; S.setOut(() => {});
  try {
    const v = S.globals["eval-with"].fn(S.valueCellOf([S.valueCellOf([], names), text]));
    probe = { text, value: v };
  } catch (e) { failed = true; }
  finally { quietLog = false; S.setOut(s => addOut(s, "print")); }
  if (failed) probe = null;
}
document.addEventListener("selectionchange", () => {
  if (document.activeElement !== ta) return;
  clearTimeout(probeT);
  probeT = setTimeout(() => { const had = !!probe; probeSelection(); if (had || probe) keysUI(); }, 180);
});

window.EditorTools = { openSheet, closeSheet, browseTo, backToNow, get versions() { return versions; }, runCode, get probe() { return probe; }, literalAt, openCtl, closeCtl, showValues, valueLines, openMenu, LINE_ACTIONS, set values(on) { valsOn = on; LS.set("sprout3.values", on); showValues(); }, undo, redo, suggestions, keysUI, fontSize, get undoDepth() { return UNDO.length; } };
UNDO.push({ code, sel: [0, 0] });
keysUI();
})();
