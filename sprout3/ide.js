// Greenhouse, Sprout's experimental IDE (decision 146). The code beside the running program: every edit hot-swaps in and
// the program keeps its state; a timeline to scrub back through the last ten seconds, where an edit re-runs the future
// from that moment with the new code (with the inputs and luck it had) and draws it as amber ghosts; onion-skin trails;
// numbers you drag; each line's live value at its end, and an inspector that asks a value what it understands; the
// program as a tree (and as a lick); picking a shape on the stage to find the line that drew it; signals over time; and
// a what-if fork that runs the code as it was beside the code as it is, from the same moment, with the same luck.
(function () {
"use strict";
const S = window.Sprout3, L = window.Sprout3Live, HL = window.Sprout3Highlight;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const STEP = 1 / 60, KEEP = 600, FUTURE = 150;

// ===================================================================== the programs
const LEAP = `-- Leap: a little sprout hopping along the bed. Drag any number to tune it: gravity, leap, speed.
-- Turn on Trails to see each hop's whole path. Pause, drag the time back, change a number, and watch the future move.
gravity : 900
leap : 420
speed : 130
floor : H - 90

start :
  x : 40
  y : H - 90
  vy : 0
  hops : 0
  blink : 0

hop-now : [g | (g y >= floor) and ((g input tapped) or (g input pressed "up") or (g x % 120 > 108))]

update : [g |
  dt : g dt
  jumping : hop-now g
  fall : jumping [0 - leap] else [g vy + (gravity * dt)]
  height : g y + (fall * dt) min floor
  landed : height >= floor
  across : g x + (speed * dt) % W
  g with [x : across, y : height, vy : landed [0] else [fall], hops : jumping [g hops + 1] else [g hops], blink : g blink + dt % 3]
]

draw : [g |
  clear #0f2a20
  rect [0, floor + 16, W, 120, #17402f]
  range 3 each [i | rect [i * 120 + 100, floor + 16, 22, 6, #0f2a20]]
  circle [300, 70, 26, #ffe9a8]
  circle [g x, g y, 15, #8be28b]
  circle [g x - 8, g y - 17, 8, #c8f7b8]
  circle [g x + 9, g y - 19, 8, #c8f7b8]
  circle [g x + 5, g y - 3, (g blink > 2.85) [1] else [3], #0f2a20]
  text ["HOPS [g hops]", 18, 30, 18, #d8ffe0, "left"]
]
`;
const BLANK = `-- A new program. start is the state, update makes the next state, draw paints it.
start : [t : 0]
update : [g | g with [t : g t + (g dt)]]
draw : [g |
  clear #101820
  circle [W / 2 + ((g t * 2) sin * 80), H / 2, 24, #5cf2b0]
]
`;
const cap = id => id.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
const PROGRAMS = [
  { id: "leap", title: "Leap", group: "The lab", src: LEAP },
  { id: "blank", title: "A blank program", group: "The lab", src: BLANK },
  ...["bounce", "breakout", "snake", "hop", "orbit", "fireflies", "particles", "gears", "life", "volley", "terrain", "sprout"].map(id => ({ id, title: cap(id), group: "Little programs" })),
  ...[["sprig", "Sprig"], ["comet-lance", "Comet Lance"], ["lantern-keep", "Lantern Keep"], ["crate-cove", "Crate Cove"], ["blended-zebra", "Blended Zebra 8"],
    ["basketball-legends", "Basketball Legends 8"], ["blade-beach", "Blade Beach '90"], ["brick-snap", "Brick Snap"], ["fizz-jar", "Fizz Jar"], ["lily-and-chester", "Lily and Chester"]]
    .map(([id, title]) => ({ id, title, group: "SPROUT·8", reg: true })),
  { id: "headstrong", title: "Headstrong", group: "SPROUT·16", reg: true }, { id: "tide-machine", title: "Tide Machine", group: "SPROUT·16", reg: true },
  { id: "fathom", title: "Fathom", group: "SPROUT·16", reg: true }, { id: "test-card-16", title: "Test card", group: "SPROUT·16", w: 320, h: 224, pixel: true },
  { id: "starlane", title: "Starlane 2025", group: "SPROUT·256", reg: true }, { id: "orbit-garden", title: "Orbit Garden", group: "SPROUT·NOW", reg: true },
];
// a game's screen: its registry entry's own size, else its console's
function screenOf(meta, p) {
  if (p.w) return { w: p.w, h: p.h, pixel: !!p.pixel };
  if (!meta) return { w: 360, h: 480, pixel: false };
  const modern = meta.style === "modern";
  if (Array.isArray(meta.screen)) return { w: +meta.screen[0], h: +meta.screen[1], pixel: !modern };
  if (modern) return { w: 390, h: 780, pixel: false };
  return meta.bits === 256 ? { w: 480, h: 270, pixel: true } : meta.bits === 16 ? { w: 320, h: 224, pixel: true } : { w: 256, h: 192, pixel: true };
}
let REGISTRY = null;
async function metaOf(id) {
  try { REGISTRY = REGISTRY || await (await fetch("games.json", { cache: "no-cache" })).json(); if (REGISTRY[id]) return REGISTRY[id]; } catch (e) {}
  try { const r = await fetch("games.d/" + id + ".json", { cache: "no-cache" }); if (r.ok) return await r.json(); } catch (e) {}
  return null;
}

// ===================================================================== what Sprout says
const notes = [];
let sink = null, noteLines = new Set();
function note(text, kind) {
  notes.unshift({ text, kind }); if (notes.length > 200) notes.pop();
  const m = /\(line (\d+)\)/.exec(text); if (m) noteLines.add(+m[1]);
  noteSoon();
}
S.setLog(m => { if (sink) sink.push(String(m)); else note(String(m), /^lint/.test(m) ? "lint" : ""); });
if (S.setOut) S.setOut(m => note("print: " + S.format(m), "print"));
let noteTimer = 0;
function noteSoon() { if (noteTimer) return; noteTimer = setTimeout(() => { noteTimer = 0; $("#noteCount").textContent = notes.length ? notes.length : ""; $("#notesIn").innerHTML = notes.map(n => `<div class="${n.kind}">${esc(n.text)}</div>`).join(""); marks(); }, 120); }

// ===================================================================== games, each with its own drawing words
// The game layer puts a game's drawing words among the globals, where the compiled code finds them as it runs, so a
// second game (the what-if fork, the probe that predicts) would take them over. Each game keeps its own, put back
// before it runs.
const HOSTWORDS = ["W", "H", "me", "saved", "console8", "clear", "rect", "circle", "line", "text", "view", "block", "model", "hold", "flash", "fog", "light", "sky", "beam",
  "sprite", "tiles", "ring", "glow", "gradient", "beep", "shake", "sound", "hiss", "buzz"];
const dataProps = () => { const out = {}; for (const k of Object.getOwnPropertyNames(S.globals)) { const d = Object.getOwnPropertyDescriptor(S.globals, k); if (d && !d.get && "value" in d) out[k] = d.value; } return out; };
function capture(g, before) { const after = dataProps(); g.hostKeys = g.hostKeys || {}; for (const k in after) if (after[k] !== before[k] || HOSTWORDS.includes(k)) g.hostKeys[k] = after[k]; }
function use(g) { if (g && g.hostKeys) for (const k in g.hostKeys) S.globals[k] = g.hostKeys[k]; }
function make(src, random) {
  const before = dataProps();
  const g = L.makeGame(src, { W, H, keep: KEEP, random, host: { saved: S.valueCellOf([], new Map()), console8: true }, onEffect: e => effect(g, e) });
  capture(g, before); return g;
}
function swapIn(g, src) { const before = dataProps(); use(g); g.swap(src); capture(g, before); }
async function libs(src) {
  if (!S.libraries) return;
  S.libraries.setBase("");
  const missing = S.libraries.missing(src); if (missing.length) await S.libraries.load(missing);
  if (window.zzfxVolume) window.zzfxVolume(sound ? 0.3 : 0);
}
const seeded = seed => { let s = seed % 2147483647 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

// ===================================================================== sound and shake
let AC = null, sound = false, shakeT = 0, shakeA = 0;
function audio() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) { AC = null; } return AC; }
function effect(g, [name, a]) {
  if (g !== game) return;
  if (name === "shake") { shakeT = 14; shakeA = +a[0] || 4; return; }
  if (name === "buzz") { if (navigator.vibrate) navigator.vibrate(Math.min(80, +a[0] || 10)); return; }
  if (!sound || !audio()) return;
  const t = AC.currentTime, out = AC.createGain(); out.connect(AC.destination);
  if (name === "beep") { const o = AC.createOscillator(); o.type = "square"; o.frequency.value = +a[0] || 440; const len = +a[1] || 0.08; out.gain.setValueAtTime(0.06, t); out.gain.exponentialRampToValueAtTime(0.0005, t + len); o.connect(out); o.start(t); o.stop(t + len + 0.02); }
  else if (name === "hiss") { const len = +a[0] || 0.1, buf = AC.createBuffer(1, Math.ceil(AC.sampleRate * len), AC.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(); s.buffer = buf; f.type = "bandpass"; f.frequency.value = +a[1] || 2000; out.gain.setValueAtTime(0.25, t); out.gain.exponentialRampToValueAtTime(0.0005, t + len); s.connect(f).connect(out); s.start(t); }
}

// ===================================================================== the state of the lab
let prog = PROGRAMS[0], original = "", code = "", lastGood = "", ast = [];
let game = null, fork = null, probe = null, probeCode = "";
let W = 360, H = 480, pixel = false;
let running = true, idx = -1, trails = store.get("gh.trails", true), picking = false, picked = null;
let lastList = [], broken = null;

// ===================================================================== painting a frame's drawing words
const cv = $("#cv"), cx = cv.getContext("2d"), cv2 = $("#cv2"), cx2 = cv2.getContext("2d");
const mk = () => { const c = document.createElement("canvas"); return [c, c.getContext("2d")]; };
const [tcv, tcx] = mk(), [fcv, fcx] = mk(), [gcv, gcx] = mk();
const colour = c => typeof c === "string" ? c : S.format(c);
const arts = new WeakMap();
function bitmap(art, ink) {
  let per = arts.get(art); if (!per) { per = new WeakMap(); arts.set(art, per); }
  const key = ink && typeof ink === "object" ? ink : arts; let c = per.get(key);
  if (!c) {
    const rows = S.isCell(art) ? S.partsOf(art).map(String) : [String(art)], inks = new Map();
    if (ink && S.isCell(ink)) for (const k of ink.fieldNames()) inks.set(k, colour(ink.field(k)));
    c = document.createElement("canvas"); c.width = Math.max(1, ...rows.map(r => r.length)); c.height = Math.max(1, rows.length);
    const g = c.getContext("2d"); rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const k = inks.get(r[x]); if (k) { g.fillStyle = k; g.fillRect(x, y, 1, 1); } } });
    per.set(key, c);
  }
  return c;
}
function textBox(a) {
  const size = +a[3] || (pixel ? 8 : 16), t = S.format(a[0]), w = pixel ? t.length * size : t.length * size * 0.58;
  const x = a[5] === "left" ? +a[1] : a[5] === "right" ? +a[1] - w : +a[1] - w / 2;
  return [x, +a[2] - size / 2, w, size];
}
// ghost: leave out what fills the screen (backgrounds, maps, words), so a trail shows what moves
function paint(g, list, ghost) {
  const tau = Math.PI * 2;
  g.imageSmoothingEnabled = !pixel;
  for (const [name, a] of list) {
    try {
      if (name === "clear") { if (!ghost) { g.fillStyle = colour(a[0]); g.fillRect(0, 0, W, H); } }
      else if (name === "rect") { if (ghost && (a[2] >= W * 0.6 || a[3] >= H * 0.6 || a[2] * a[3] > W * H * 0.2)) continue; g.fillStyle = colour(a[4]); const r = +a[5] || 0; g.beginPath(); if (r > 0 && g.roundRect) g.roundRect(+a[0], +a[1], +a[2], +a[3], r); else g.rect(+a[0], +a[1], +a[2], +a[3]); g.fill(); }
      else if (name === "circle") { if (+a[2] > 0) { g.fillStyle = colour(a[3]); g.beginPath(); g.arc(+a[0], +a[1], +a[2], 0, tau); g.fill(); } }
      else if (name === "line") { g.strokeStyle = colour(a[4]); g.lineWidth = +a[5] || (pixel ? 1 : 2); g.lineCap = "round"; g.beginPath(); g.moveTo(+a[0], +a[1]); g.lineTo(+a[2], +a[3]); g.stroke(); }
      else if (name === "ring") { g.strokeStyle = colour(a[3]); g.lineWidth = +a[4] || 2; g.lineCap = "round"; g.beginPath(); g.arc(+a[0], +a[1], Math.max(0, +a[2]), (a[5] === undefined ? 0 : +a[5]) * tau, (a[6] === undefined ? 1 : +a[6]) * tau); g.stroke(); }
      else if (name === "glow") { if (ghost) continue; const r = Math.max(1, +a[2]), gr = g.createRadialGradient(+a[0], +a[1], 0, +a[0], +a[1], r); gr.addColorStop(0, colour(a[3])); gr.addColorStop(1, "rgba(0,0,0,0)"); g.save(); g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.fillRect(+a[0] - r, +a[1] - r, r * 2, r * 2); g.restore(); }
      else if (name === "gradient") { if (ghost) continue; const gr = g.createLinearGradient(0, +a[1], 0, +a[1] + +a[3]); gr.addColorStop(0, colour(a[4])); gr.addColorStop(1, colour(a[5] === undefined ? a[4] : a[5])); g.fillStyle = gr; g.fillRect(+a[0], +a[1], +a[2], +a[3]); }
      else if (name === "text") { if (ghost) continue; const size = +a[3] || (pixel ? 8 : 16); g.fillStyle = colour(a[4] === undefined ? "#ffffff" : a[4]); g.font = pixel ? size + 'px "Press Start 2P",monospace' : "600 " + size + "px -apple-system,system-ui,sans-serif"; g.textAlign = a[5] === "left" || a[5] === "right" ? a[5] : "center"; g.textBaseline = "middle"; g.fillText(S.format(a[0]), +a[1], +a[2]); }
      else if (name === "sprite") { if (!a[0] || typeof a[0] !== "object") continue; const bm = bitmap(a[0], a[3]), k = Math.max(0.05, +a[5] || 1), w = bm.width * k, h = bm.height * k, flip = a[4] === true || a[4] === -1, turn = +a[6] || 0;
        g.save(); g.translate(+a[1] + w / 2, +a[2] + h / 2); if (turn) g.rotate(turn * tau); if (flip) g.scale(-1, 1); g.drawImage(bm, -w / 2, -h / 2, w, h); g.restore(); }
      else if (name === "tiles") { if (ghost) continue; const rows = S.partsOf(a[0]).map(String), set = new Map(S.partsOf(a[1]).map(p => [String(S.partsOf(p)[0]), S.partsOf(p)[1]]));
        const first = set.values().next().value; if (!first) continue; const t = bitmap(first, a[2]);
        rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const art = set.get(r[x]); if (art) g.drawImage(bitmap(art, a[2]), +a[3] + x * t.width, +a[4] + y * t.height); } }); }
    } catch (e) { /* one odd shape never stops the frame */ }
  }
}
// a ghost frame, faint and (for the future) tinted, laid onto a trail canvas
function ghostOnto(target, list, alpha, tint) {
  gcx.setTransform(1, 0, 0, 1, 0, 0); gcx.clearRect(0, 0, gcv.width, gcv.height); gcx.setTransform(scale, 0, 0, scale, 0, 0);
  paint(gcx, list, true);
  if (tint) { gcx.save(); gcx.setTransform(1, 0, 0, 1, 0, 0); gcx.globalCompositeOperation = "source-atop"; gcx.fillStyle = tint; gcx.fillRect(0, 0, gcv.width, gcv.height); gcx.restore(); }
  target.save(); target.setTransform(1, 0, 0, 1, 0, 0); target.globalAlpha = alpha; target.drawImage(gcv, 0, 0); target.restore();
}
const wipe = c => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, c.canvas.width, c.canvas.height); c.restore(); };
let scale = 1;
function sizeStage() {
  scale = pixel ? 1 : Math.min(2, window.devicePixelRatio || 1);
  for (const [c, x] of [[cv, cx], [cv2, cx2], [tcv, tcx], [fcv, fcx], [gcv, gcx]]) { c.width = Math.round(W * scale); c.height = Math.round(H * scale); x.setTransform(scale, 0, 0, scale, 0, 0); }
  $("#mainStage").classList.toggle("pixel", pixel); $("#forkStage").classList.toggle("pixel", pixel);
  fitStage();
}
function fitStage() {
  const n = fork ? 2 : 1, box = $("#stages"), roomW = (box.clientWidth - 28 - (n - 1) * 10) / n, roomH = Math.max(160, window.innerHeight * (window.innerWidth > 900 ? 0.5 : 0.46));
  const k = Math.min(roomW / W, roomH / H, pixel ? 4 : 2);
  for (const c of [cv, cv2]) { c.style.width = Math.floor(W * k) + "px"; c.style.height = "auto"; }
}
addEventListener("resize", fitStage);

// ===================================================================== the editor
const ta = $("#ta"), hlIn = $("#hlIn"), gutIn = $("#gutIn"), ovIn = $("#ovIn");
let lines = [], CH = 7.8, LH = 20, PADT = 12, PADL = 12;
function measure() {
  const s = document.createElement("span"); s.style.cssText = "position:absolute;visibility:hidden;white-space:pre"; s.style.font = getComputedStyle(ta).font; s.textContent = "0".repeat(100);
  $("#codeBox").appendChild(s); CH = s.getBoundingClientRect().width / 100 || 7.8; s.remove();
  LH = parseFloat(getComputedStyle(ta).lineHeight) || 20; PADT = parseFloat(getComputedStyle(ta).paddingTop) || 12; PADL = parseFloat(getComputedStyle(ta).paddingLeft) || 12;
}
const vcol = (s, i) => { let c = 0; for (let k = 0; k < i; k++) c += s[k] === "\t" ? 2 : 1; return c; };
function paintCode() {
  lines = code.split("\n");
  hlIn.innerHTML = lines.map((l, i) => `<div data-l="${i + 1}">${l ? HL.line(l) : " "}</div>`).join("");
  gutIn.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join("");
  marks(); reparse(); numbers(); values();
}
function setCode(c) { code = c; if (ta.value !== c) { const s = ta.scrollTop; ta.value = c; ta.scrollTop = s; } paintCode(); }
function marks() {
  const kids = gutIn.children, errLine = broken && broken.line;
  for (let i = 0; i < kids.length; i++) kids[i].className = errLine === i + 1 ? "err" : noteLines.has(i + 1) ? "note" : "";
}
ta.addEventListener("input", () => { code = ta.value; paintCode(); applySoon(220); });
ta.addEventListener("scroll", () => { const t = `translate(${-ta.scrollLeft}px,${-ta.scrollTop}px)`; hlIn.style.transform = t; ovIn.style.transform = t; gutIn.style.transform = `translateY(${-ta.scrollTop}px)`; numbersSoon(); });
ta.addEventListener("keydown", e => {
  if (e.key === "Tab") { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText("  ", s, ta.selectionEnd, "end"); ta.dispatchEvent(new Event("input")); }
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); restart(); }
});
for (const ev of ["click", "keyup", "select"]) ta.addEventListener(ev, cursorMoved);
function lineOfOffset(o) { let n = 1; for (let i = 0; i < o && i < code.length; i++) if (code.charCodeAt(i) === 10) n++; return n; }
function offsetOf(line, col) { let o = 0; for (let i = 0; i < line; i++) o += lines[i].length + 1; return o + col; }
function goLine(n) {
  const top = (n - 1) * LH; if (top < ta.scrollTop + LH || top > ta.scrollTop + ta.clientHeight - 3 * LH) ta.scrollTop = Math.max(0, top - ta.clientHeight / 3);
  const el = hlIn.children[n - 1]; if (el) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
}

// ---- numbers you drag: a click puts the caret there; a drag left or right changes the number, live; Alt or Shift for fine
function numbersIn(s) {
  const out = []; let i = 0; const n = s.length;
  while (i < n) {
    const c = s[i];
    if (c === "-" && s[i + 1] === "-") break;
    if (c === '"') { i++; while (i < n && s[i] !== '"') { if (s[i] === "\\") i++; i++; } i++; continue; }
    if (" \t[](),|:".includes(c)) { i++; continue; }
    const lit = S.lexLiteral(s, i); if (lit) { i += lit.length; continue; }
    let j = i; while (j < n && !" \t[](),|:\"".includes(s[j]) && !(s[j] === "-" && s[j + 1] === "-" && j > i)) j++;
    const w = s.slice(i, j); if (/^-?\d+(\.\d+)?$/.test(w)) out.push({ col: i, text: w });
    i = Math.max(j, i + 1);
  }
  return out;
}
let numTimer = 0, drag = null;
function numbersSoon() { if (numTimer) return; numTimer = requestAnimationFrame(() => { numTimer = 0; numbers(); }); }
function numbers() {
  if (drag) return;
  const first = Math.max(0, Math.floor((ta.scrollTop - PADT) / LH) - 2), last = Math.min(lines.length - 1, Math.ceil((ta.scrollTop + ta.clientHeight) / LH) + 2);
  let html = "";
  for (let i = first; i <= last; i++) for (const t of numbersIn(lines[i])) html += `<span class="num" data-l="${i}" data-c="${t.col}" data-n="${t.text.length}" style="left:${PADL + vcol(lines[i], t.col) * CH}px;top:${PADT + i * LH}px;width:${t.text.length * CH}px"></span>`;
  $("#ovNums").innerHTML = html;
}
ovIn.innerHTML = `<div id="ovNums"></div><div id="ovVals"></div>`;
const tip = $("#tip");
ovIn.addEventListener("pointerdown", e => {
  const n = e.target.closest(".num");
  if (n) {
    e.preventDefault();
    const line = +n.dataset.l, col = +n.dataset.c, text = lines[line].substr(col, +n.dataset.n), dec = (text.split(".")[1] || "").length, orig = parseFloat(text);
    drag = { line, col, len: text.length, orig, dec, x0: e.clientX, moved: false, el: n };
    n.classList.add("drag");
    addEventListener("pointermove", numMove); addEventListener("pointerup", numUp, { once: true });
    return;
  }
  const gh = e.target.closest(".ghost"); if (gh) { e.preventDefault(); const v = ghostVals.find(g => g.id === gh.dataset.g); if (v) inspect(v.get(), v.label); }
});
function numMove(e) {
  if (!drag) return;
  const dx = e.clientX - drag.x0; if (!drag.moved && Math.abs(dx) < 3) return; drag.moved = true;
  const fine = e.altKey || e.shiftKey, base = drag.dec > 0 ? Math.pow(10, -drag.dec) : Math.max(1, Math.pow(10, Math.floor(Math.log10(Math.abs(drag.orig) || 1)) - 1));
  const step = fine ? base / 10 : base, places = step < 1 ? Math.max(drag.dec, Math.round(-Math.log10(step))) : 0;
  const v = drag.orig + Math.round(dx / (fine ? 7 : 4)) * step, text = places ? v.toFixed(places) : String(Math.round(v));
  const s = lines[drag.line]; lines[drag.line] = s.slice(0, drag.col) + text + s.slice(drag.col + drag.len); drag.len = text.length;
  code = lines.join("\n"); const top = ta.scrollTop; ta.value = code; ta.scrollTop = top;
  hlIn.children[drag.line].innerHTML = HL.line(lines[drag.line]); drag.el.style.width = text.length * CH + "px";
  tip.style.display = "block"; tip.style.left = e.clientX + "px"; tip.style.top = e.clientY + "px"; tip.textContent = text;
  applySoon(0);
}
function numUp() {
  removeEventListener("pointermove", numMove); tip.style.display = "none";
  const d = drag; drag = null; if (!d) return; d.el.classList.remove("drag");
  if (!d.moved) { ta.focus(); const at = offsetOf(d.line, d.col + d.len); ta.setSelectionRange(at, at); cursorMoved(); }
  paintCode();
}

// ---- each line's value, ghosted at its end: the game's state at its start lines (live), every other top-level name
let ghostVals = [];
const short = v => { let t; try { t = S.format(v); } catch (e) { t = "?"; } t = t.replace(/\s+/g, " "); return t.length > 46 ? t.slice(0, 45) + "…" : t; };
const fieldOf = (rec, k) => { try { if (!S.isCell(rec) || !rec.fieldNames().includes(k)) return undefined; return rec.field(k); } catch (e) { return undefined; } };
function values() {
  if (!game) { $("#ovVals").innerHTML = ""; ghostVals = []; return; }
  const out = [];
  for (const b of ast) {
    if (b.type !== "bind" || !b.line) continue;
    if (b.name === "start") {
      const cell = b.value && b.value.terms && b.value.terms.find(t => t.type === "cell");
      if (cell) for (const f of cell.items) if (f.type === "bind" && f.line) { const name = f.name; out.push({ id: "s:" + name, line: f.line - 1, kind: "live", label: name, get: () => fieldOf(game.state, name) }); }
      continue;
    }
    const name = b.name; let v; try { v = game.file.field(name); } catch (e) { continue; }
    if (v === S.UNSET || v === undefined) continue;
    const cell = v instanceof S.Cell && typeof v.takesInput === "function" && v.takesInput();
    out.push({ id: "t:" + name, line: b.line - 1, kind: cell ? "cell" : "", label: name, cell, get: () => game.file.field(name) });
  }
  const same = out.length === ghostVals.length && out.every((g, i) => g.id === ghostVals[i].id && g.line === ghostVals[i].line);
  ghostVals = out;
  if (!same) $("#ovVals").innerHTML = out.map(g => `<span class="ghost ${g.kind}" data-g="${esc(g.id)}" style="left:${PADL + (vcol(lines[g.line] || "", (lines[g.line] || "").length) + 2) * CH}px;top:${PADT + g.line * LH}px"></span>`).join("");
  const els = $("#ovVals").children;
  out.forEach((g, i) => { const el = els[i]; if (!el) return; const v = g.get(), t = g.cell ? "cell" : v === undefined ? "" : short(v); if (el.textContent !== t) el.textContent = t; el.style.display = t ? "" : "none"; });
}

// ===================================================================== hot swap: every edit goes in, the program keeps running
let applyTimer = 0, applying = false, again = false;
function applySoon(ms) { clearTimeout(applyTimer); applyTimer = setTimeout(apply, ms); }
async function apply() {
  if (applying) { again = true; return; }
  applying = true;
  try {
    store.set("gh.code." + prog.id, code === original ? null : code);
    await libs(code);
    if (!game) { await begin(); return; }
    try { swapIn(game, code); lastGood = code; fail(null); if (idx >= 0) { pastGhosts(); future(); } }
    catch (e) { fail(e); }
  } finally { applying = false; if (again) { again = false; apply(); } }
}
function fail(e) {
  broken = e ? { line: e.line || (/line (\d+)/.exec(e.message || "") || [])[1] | 0 || 0, message: String(e.message || e) } : null;
  const bar = $("#errBar");
  bar.classList.toggle("on", !!broken);
  bar.innerHTML = broken ? `<b>${broken.line ? "line " + broken.line + ": " : ""}</b>${esc(broken.message)} <span>· the program keeps running the last version that worked</span>` : "";
  status(); marks();
}
function status() {
  const st = $("#status"); st.className = broken ? "bad" : idx >= 0 ? "past" : "";
  $("#statusText").textContent = broken ? "not taken" : idx >= 0 ? "time travelling" : running ? "live" : "paused";
}

// ===================================================================== running: sixty ticks a second, input from keys and the stage
const KEYS = new Set(), LATCH = new Set();
const KEYNAME = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down", z: "one", j: "one", x: "two", k: "two", " ": "two", c: "three", v: "four" };
const held = () => { const m = new Map(); for (const k of KEYS) m.set(k, true); for (const k of LATCH) m.set(k, true); return S.valueCellOf([], m); };
const typing = t => t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.tagName === "SELECT");
addEventListener("keydown", e => {
  if (e.key === "F2") { e.preventDefault(); togglePlay(); return; }
  if (e.key === "F3") { e.preventDefault(); toggleTrails(); return; }
  if (e.key === "F4") { e.preventDefault(); togglePick(); return; }
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); restart(); return; }
  if (typing(e.target)) return;
  if (idx >= 0 && (e.key === "[" || e.key === "]")) { goTo(idx + (e.key === "]" ? 1 : -1)); return; }
  const k = KEYNAME[e.key] || KEYNAME[e.key.toLowerCase()]; if (k) { KEYS.add(k); LATCH.add(k); e.preventDefault(); }
});
addEventListener("keyup", e => { const k = KEYNAME[e.key] || KEYNAME[e.key.toLowerCase()]; if (k) KEYS.delete(k); });
addEventListener("blur", () => KEYS.clear());
const toGame = (e, c) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
let touching = false;
cv.addEventListener("pointerdown", e => {
  audio(); if (picking) { pick(...toGame(e, cv)); return; }
  if (!game || idx >= 0) return; touching = true; const [x, y] = toGame(e, cv);
  try { use(game); game.down(x, y); if (fork) { use(fork); fork.down(x, y); use(game); } } catch (err) { fail(err); }
});
cv.addEventListener("pointermove", e => { if (!touching || !game) return; const [x, y] = toGame(e, cv); try { use(game); game.move(x, y); if (fork) { use(fork); fork.move(x, y); use(game); } } catch (err) {} });
const lift = () => { if (!touching || !game) return; touching = false; try { use(game); game.up(); if (fork) { use(fork); fork.up(); use(game); } } catch (err) {} };
cv.addEventListener("pointerup", lift); cv.addEventListener("pointercancel", lift);

let acc = 0, lastT = 0, frameNo = 0, slowT = 0;
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, Math.max(0, (t - lastT) / 1000)); lastT = t;
  if (game && running && idx < 0) { acc += dt; let n = 0; while (acc >= STEP && n < 4) { tick(); acc -= STEP; n++; } if (n === 4) acc = 0; }
  frame();
  if (t - slowT > 160) { slowT = t; slow(); }
}
function tick() {
  const h = held();
  try { use(game); game.tick(STEP, h); } catch (e) { fail(e); running = false; status(); }
  if (fork) { try { use(fork); fork.tick(STEP, h); } catch (e) {} use(game); }
  LATCH.clear();
  // trails: every third frame's moving shapes laid onto a canvas that fades
  if (trails && frameNo++ % 3 === 0) { tcx.save(); tcx.setTransform(1, 0, 0, 1, 0, 0); tcx.globalCompositeOperation = "destination-out"; tcx.fillStyle = "rgba(0,0,0,0.16)"; tcx.fillRect(0, 0, tcv.width, tcv.height); tcx.restore(); try { use(game); ghostOnto(tcx, game.draw().slice(), 0.5, null); } catch (e) {} }
}
function frame() {
  if (!game) { cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = "#05080b"; cx.fillRect(0, 0, cv.width, cv.height); cx.restore(); return; }
  let list = [];
  try { use(game); list = game.draw().slice(); } catch (e) { if (!broken) fail(e); }
  cx.save();
  if (shakeT > 0) { shakeT--; cx.translate((Math.random() - 0.5) * shakeA, (Math.random() - 0.5) * shakeA); }
  paint(cx, list, false);
  cx.setTransform(1, 0, 0, 1, 0, 0);
  if (trails || idx >= 0) { cx.globalAlpha = idx >= 0 ? 0.9 : 0.7; cx.drawImage(tcv, 0, 0); }
  if (idx >= 0) { cx.globalAlpha = 1; cx.drawImage(fcv, 0, 0); }
  cx.restore();
  if (picked) { cx.save(); const [x, y, w, h] = picked.box; cx.strokeStyle = "#6cc6ff"; cx.lineWidth = 2 / scale; cx.setLineDash([4 / scale, 3 / scale]); cx.strokeRect(x - 2, y - 2, w + 4, h + 4); cx.restore(); }
  lastList = list;
  if (fork) { let fl = []; try { use(fork); fl = fork.draw().slice(); } catch (e) {} use(game); paint(cx2, fl, false); }
}
function slow() {
  if (!game) return;
  const hist = game.history, time = $("#time");
  time.max = Math.max(0, hist.length - 1);
  if (idx < 0) { time.value = time.max; $("#tLabel").textContent = running ? "live" : "paused"; }
  else $("#tLabel").textContent = "−" + ((hist.length - 1 - idx) / 60).toFixed(2) + " s";
  values();
  if ($("#p-signals").classList.contains("on")) signals();
}

// ===================================================================== time: scrub back, edit there, see the future move
function goTo(i) {
  if (!game || !game.history.length) return;
  running = false; idx = Math.max(0, Math.min(game.history.length - 1, i));
  use(game); game.rewind(idx); $("#time").value = idx;
  pastGhosts(); futureGhosts(); document.body.classList.add("past"); status(); playUI(); slow();
}
// the frames before this one, from the recording, as fading ghosts
function pastGhosts() {
  wipe(tcx);
  const hist = game.history, from = Math.max(0, idx - 48);
  try { for (let k = from; k < idx; k += 4) { game.rewind(k); ghostOnto(tcx, game.draw().slice(), 0.12 + 0.45 * (k - from) / Math.max(1, idx - from), null); } } catch (e) {}
  game.rewind(idx);
}
// after an edit: the recorded future played again from here with the new code, the same inputs and the same luck; with
// nothing recorded after here, a probe runs on with no input, to show where things are heading
function future() {
  const hist = game.history, end = Math.min(hist.length - 1, idx + FUTURE);
  use(game);
  if (end > idx) {
    try { for (let k = idx; k < end; k++) { game.replayFrom(k); hist[k + 1].state = game.state; } } catch (e) { fail(e); }
    hist.length = end + 1; game.rewind(idx);
  }
  futureGhosts();
}
function futureGhosts() {
  wipe(fcx);
  const hist = game.history, lists = [];
  use(game);
  try {
    if (idx < hist.length - 1) { for (let k = idx + 4; k < hist.length && k <= idx + FUTURE; k += 4) { game.rewind(k); lists.push(game.draw().slice()); } game.rewind(idx); }
    else {
      if (!probe || probeCode !== code) { probe = make(code); probeCode = code; use(game); }
      use(probe); probe.setState(game.state, game.clock); const none = S.valueCellOf([], new Map());
      for (let k = 1; k <= 90; k++) { probe.tick(STEP, none); if (k % 4 === 0) lists.push(probe.draw().slice()); }
      use(game);
    }
  } catch (e) { use(game); }
  lists.forEach((l, i) => ghostOnto(fcx, l, 0.55 - 0.4 * i / Math.max(1, lists.length), "rgba(255,179,71,0.85)"));
}
function playFromHere() {
  if (!game) return;
  if (idx >= 0) { game.history.length = idx + 1; use(game); game.rewind(idx); }
  idx = -1; running = true; wipe(tcx); wipe(fcx); document.body.classList.remove("past"); status(); playUI();
}
function togglePlay() { if (!game) return; if (running && idx < 0) goTo(game.history.length - 1); else playFromHere(); }
function playUI() { const b = $("#bPlay"); b.textContent = idx >= 0 ? "Play" : "Pause"; b.classList.toggle("paused", idx >= 0); }
$("#time").addEventListener("input", e => goTo(+e.target.value));
$("#bBack").onclick = () => goTo((idx < 0 && game ? game.history.length - 1 : idx) - 1);
$("#bFwd").onclick = () => { if (idx >= 0) goTo(idx + 1); };
$("#bHere").onclick = playFromHere;
$("#bPlay").onclick = togglePlay;

// ===================================================================== the inspector: a value's kind, insides and messages
let stack = [];
function ask(v, message) {
  const logs = []; sink = logs;
  try { const r = S.load("result : inspected " + message, { host: { inspected: v } }).field("result"); return { ok: !logs.length, value: r, text: S.format(r), logs }; }
  catch (e) { return { ok: false, text: String(e.message || e), logs }; }
  finally { sink = null; use(game); }
}
function inspect(value, label) { stack = [{ label, value }]; showInspector(); tab("inspect"); }
function showInspector() {
  const top = stack[stack.length - 1], v = top.value;
  $("#inspectHint").hidden = true; $("#insp").hidden = false;
  $("#crumbs").innerHTML = stack.map((s, i) => i === stack.length - 1 ? `<span>${esc(s.label)}</span>` : `<button data-i="${i}">${esc(s.label)}</button><span>›</span>`).join("");
  const kind = ask(v, "kind"); $("#iKind").textContent = kind.ok ? kind.text : typeof v;
  let full = ""; try { full = S.format(v); } catch (e) { full = String(v); }
  $("#iVal").textContent = full.length > 3000 ? full.slice(0, 3000) + " …" : full;
  const rows = [];
  if (S.isCell(v)) { try { for (const k of v.fieldNames()) rows.push([k, v.field(k)]); S.partsOf(v).slice(0, 60).forEach((p, i) => rows.push(["@ " + (i + 1), p])); } catch (e) {} }
  $("#iSummary").textContent = S.isCell(v) ? `${v.fieldNames().length} fields, ${S.partsOf(v).length} parts` : "";
  $("#iFieldsWrap").hidden = !rows.length;
  $("#iFields").innerHTML = rows.map(([k, x], i) => `<button data-r="${i}"><span class="k">${esc(k)}</span><span class="v">${esc(short(x))}</span></button>`).join("");
  $("#iFields").onclick = e => { const b = e.target.closest("button"); if (!b) return; const [k, x] = rows[+b.dataset.r]; stack.push({ label: k, value: x }); showInspector(); };
  const msgs = ask(v, "messages"), names = msgs.value && S.isCell(msgs.value) ? S.partsOf(msgs.value).map(String) : [];
  $("#iMsgs").innerHTML = names.map(n => `<button>${esc(n)}</button>`).join("");
  $("#answer").textContent = ""; $("#answer").className = "";
}
$("#crumbs").onclick = e => { const b = e.target.closest("button"); if (!b) return; stack.length = +b.dataset.i + 1; showInspector(); };
$("#iMsgs").onclick = e => { const b = e.target.closest("button"); if (!b) return; $("#send").value = b.textContent; sendIt(); };
$("#send").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); sendIt(); } });
function sendIt() {
  if (!stack.length) return;
  const top = stack[stack.length - 1], m = $("#send").value.trim(); if (!m) return;
  const r = ask(top.value, m), out = $("#answer");
  out.className = r.ok ? "" : "bad"; out.textContent = r.ok ? "→ " + r.text : (r.logs.length ? r.logs.join("\n") : r.text);
  if (r.ok && r.value !== undefined && typeof r.value === "object") { const b = document.createElement("button"); b.textContent = "inspect this"; b.className = "cand"; b.onclick = () => { stack.push({ label: m, value: r.value }); showInspector(); }; out.appendChild(document.createElement("br")); out.appendChild(b); }
}

// ===================================================================== signals: every number in the state over the last ten seconds
function seriesOf(state) {
  const out = [], skip = new Set(["dt", "clock", "input", "input2", "keep", "song", "saved"]);
  if (!S.isCell(state)) return out;
  for (const k of state.fieldNames()) {
    if (skip.has(k)) continue; const v = state.field(k);
    if (typeof v === "number") out.push([k, s => fieldOf(s, k)]);
    else if (v && typeof v === "object" && v.methods && v.methods.x && v.methods.y) { out.push([k + " x", s => { const p = fieldOf(s, k); return p && p.methods ? p.methods.x.run(p) : undefined; }]); out.push([k + " y", s => { const p = fieldOf(s, k); return p && p.methods ? p.methods.y.run(p) : undefined; }]); }
    else if (S.isCell(v) && v.fieldNames().length && v.fieldNames().length <= 8) for (const j of v.fieldNames()) if (typeof v.field(j) === "number") out.push([k + " " + j, s => fieldOf(fieldOf(s, k), j)]);
    if (out.length >= 12) break;
  }
  return out;
}
function signals() {
  if (!game) return;
  const hist = game.history, n = hist.length; if (n < 2) { $("#sigIn").innerHTML = ""; return; }
  const at = idx >= 0 ? idx : n - 1, rows = [];
  for (const [name, get] of seriesOf(game.state)) {
    const ys = []; for (let i = 0; i < n; i += 2) { const y = get(hist[i].state); ys.push(typeof y === "number" ? y : NaN); }
    const ok = ys.filter(y => !isNaN(y)); if (!ok.length) continue;
    const lo = Math.min(...ok), hi = Math.max(...ok), span = hi - lo || 1, w = ys.length;
    const pts = ys.map((y, i) => isNaN(y) ? "" : `${i},${(28 - (y - lo) / span * 26).toFixed(1)}`).filter(Boolean).join(" ");
    const now = get(game.state);
    rows.push(`<div class="sig"><b title="${esc(name)}">${esc(name)}</b><svg viewBox="0 0 ${w} 30" preserveAspectRatio="none" data-n="${n}"><polyline points="${pts}"/><line x1="${at / 2}" x2="${at / 2}" y1="0" y2="30"/></svg><span>${typeof now === "number" ? +now.toFixed(2) : ""}</span></div>`);
  }
  $("#sigIn").innerHTML = rows.join("") || `<p class="hint">No numbers in this program's state.</p>`;
}
$("#sigIn").onclick = e => { const s = e.target.closest("svg"); if (!s) return; const r = s.getBoundingClientRect(); goTo(Math.round((e.clientX - r.left) / r.width * (+s.dataset.n - 1))); };

// ===================================================================== the program as a tree, and as a lick
const lineOfNode = n => { if (!n || typeof n !== "object") return 0; if (n.line) return n.line; for (const k of ["value", "terms", "items"]) { const v = n[k]; if (Array.isArray(v)) { for (const x of v) { const l = lineOfNode(x); if (l) return l; } } else if (v && typeof v === "object") { const l = lineOfNode(v); if (l) return l; } } return 0; };
function said(n, depth) {
  if (!n || typeof n !== "object") return String(n);
  if (depth > 2) return "…";
  switch (n.type) {
    case "bind": return n.name + " : " + said(n.value, depth + 1);
    case "chain": return n.terms.map(t => said(t, depth + 1)).join(" ");
    case "cell": return "[" + (n.names && n.names.length ? n.names.map(x => x.name || "?").join(" ") + " | " : "") + (n.items.length > 3 || depth > 1 ? n.items.length + (n.items.length === 1 ? " line" : " lines") : n.items.map(i => said(i, depth + 1)).join(", ")) + "]";
    case "word": return n.value; case "num": return String(n.value); case "literal": return n.text;
    case "text": case "str": return JSON.stringify(n.value === undefined ? n.text : n.value);
    default: return n.value !== undefined ? (typeof n.value === "object" ? "(" + n.type + ")" : String(n.value)) : n.text || "(" + n.type + ")";
  }
}
function cellsIn(n) { const out = []; const walk = x => { if (!x || typeof x !== "object") return; if (x.type === "cell") { out.push(x); return; } for (const k of ["value", "terms"]) { const v = x[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") walk(v); } }; walk(n); return out; }
function treeHTML(items, depth) {
  return items.map(n => {
    const line = lineOfNode(n), kids = n.type === "bind" ? cellsIn(n.value) : n.type === "chain" ? cellsIn(n) : [], inner = kids.flatMap(c => c.items);
    const label = n.type === "bind" ? `<span class="t">${kids.length && kids[0].names && kids[0].names.length ? "cell" : kids.length ? "record" : "name"}</span><span class="nm">${esc(n.name)}</span> ${esc(said(n.value, 1)).slice(0, 90)}` : `<span class="t">${esc(n.type)}</span>${esc(said(n, 1)).slice(0, 90)}`;
    return inner.length && depth < 6 ? `<details${depth === 0 ? "" : " open"}><summary data-line="${line}"><span class="ln">${line || ""}</span>${label}</summary>${treeHTML(inner, depth + 1)}</details>` : `<div class="leaf" data-line="${line}"><span class="ln">${line || ""}</span>${label}</div>`;
  }).join("");
}
function lickOf(items, depth) {
  return items.map(n => {
    const kids = n.type === "bind" ? cellsIn(n.value) : n.type === "chain" ? cellsIn(n) : [], inner = kids.flatMap(c => c.items);
    const head = n.type === "bind" ? n.name + " " + said(n.value, 2) : n.type + " " + said(n, 2);
    return "  ".repeat(depth) + head.replace(/\s+/g, " ").slice(0, 100) + (inner.length && depth < 8 ? "\n" + lickOf(inner, depth + 1) : "");
  }).join("\n");
}
let parseTimer = 0;
function reparse() {
  try { ast = S.parse(code) || []; } catch (e) { return; }
  clearTimeout(parseTimer); parseTimer = setTimeout(() => { $("#treeIn").innerHTML = treeHTML(ast, 0); if ($("#lickOut").style.display === "block") $("#lickOut").textContent = lickOf(ast, 0); cursorMoved(); }, 150);
}
function cursorMoved() {
  const line = lineOfOffset(ta.selectionStart);
  for (const el of hlIn.querySelectorAll(".cur")) el.classList.remove("cur");
  if (hlIn.children[line - 1]) hlIn.children[line - 1].classList.add("cur");
  for (const el of $("#treeIn").querySelectorAll(".hit")) el.classList.remove("hit");
  const hits = $("#treeIn").querySelectorAll(`[data-line="${line}"]`), hit = hits[hits.length - 1];
  if (hit) { hit.classList.add("hit"); let p = hit.parentElement; while (p && p.id !== "treeIn") { if (p.tagName === "DETAILS") p.open = true; p = p.parentElement; } if ($("#p-tree").classList.contains("on")) hit.scrollIntoView({ block: "nearest" }); }
}
$("#treeIn").addEventListener("click", e => { const el = e.target.closest("[data-line]"); if (!el || !+el.dataset.line) return; const n = +el.dataset.line; ta.focus(); const at = offsetOf(n - 1, 0); ta.setSelectionRange(at, at); goLine(n); cursorMoved(); });
$("#bLick").onclick = () => { const o = $("#lickOut"), on = o.style.display !== "block"; o.style.display = on ? "block" : "none"; if (on) o.textContent = lickOf(ast, 0); $("#bLick").textContent = on ? "Hide the lick" : "Show as a lick"; };
$("#bCopyLick").onclick = () => { try { navigator.clipboard.writeText(lickOf(ast, 0)); } catch (e) {} };

// ===================================================================== pick: the shape under a click, and the lines that drew it
function boxOf(name, a) {
  if (name === "rect" || name === "gradient") return [+a[0], +a[1], +a[2], +a[3]];
  if (name === "circle" || name === "glow") return [a[0] - a[2], a[1] - a[2], a[2] * 2, a[2] * 2];
  if (name === "ring") { const r = +a[2] + (+a[4] || 2) / 2; return [a[0] - r, a[1] - r, r * 2, r * 2]; }
  if (name === "line") return [Math.min(a[0], a[2]) - 2, Math.min(a[1], a[3]) - 2, Math.abs(a[2] - a[0]) + 4, Math.abs(a[3] - a[1]) + 4];
  if (name === "text") return textBox(a);
  if (name === "sprite" && a[0] && typeof a[0] === "object") { const bm = bitmap(a[0], a[3]), k = +a[5] || 1; return [+a[1], +a[2], bm.width * k, bm.height * k]; }
  if (name === "tiles") { const rows = S.partsOf(a[0]).map(String), first = S.partsOf(S.partsOf(a[1])[0])[1], t = bitmap(first, a[2]); return [+a[3], +a[4], Math.max(...rows.map(r => r.length)) * t.width, rows.length * t.height]; }
  if (name === "clear") return [0, 0, W, H];
  return null;
}
function hits(name, a, x, y) {
  const b = boxOf(name, a); if (!b) return false;
  if (name === "circle" || name === "glow") return Math.hypot(x - a[0], y - a[1]) <= +a[2] + 1;
  if (name === "line") { const dx = a[2] - a[0], dy = a[3] - a[1], l = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l)); return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy) <= 4; }
  return x >= b[0] && x <= b[0] + b[2] && y >= b[1] && y <= b[1] + b[3];
}
const hex = t => { t = String(t).toLowerCase(); return /^#[0-9a-f]{3}$/.test(t) ? "#" + t.slice(1).split("").map(c => c + c).join("") : t.slice(0, 7); };
function pick(x, y) {
  if (running && idx < 0) goTo(game.history.length - 1);
  let found = null;
  for (let i = lastList.length - 1; i >= 0 && !found; i--) { const [name, a] = lastList[i]; if (name !== "clear" && hits(name, a, x, y)) found = [name, a]; }
  if (!found) { const c = lastList.find(d => d[0] === "clear"); if (c) found = c; }
  picked = found ? { name: found[0], a: found[1], box: boxOf(found[0], found[1]) } : null;
  showPick(); tab("pick");
}
function showPick() {
  if (!picked) { $("#pickIn").innerHTML = `<p class="hint">Nothing drawn there.</p>`; return; }
  const { name, a } = picked, call = name + " [" + a.map(v => { try { return S.format(v); } catch (e) { return "?"; } }).map(t => t.length > 24 ? t.slice(0, 22) + "…" : t).join(", ") + "]";
  const colours = a.map(v => { try { return typeof v === "string" ? v : S.format(v); } catch (e) { return ""; } }).filter(t => /^#[0-9a-f]{3,8}$/i.test(t)).map(hex);
  const nums = a.filter(v => typeof v === "number" && Number.isInteger(v) && Math.abs(v) >= 2).map(String);
  const words = name === "text" ? S.format(a[0]).split(/[^A-Za-z]+/).filter(w => w.length >= 3) : [];
  let art = null; if ((name === "sprite" || name === "tiles") && game) for (const n of game.file.fieldNames()) { try { if (game.file.field(n) === a[0]) art = n; } catch (e) {} }
  const ranked = [];
  lines.forEach((l, i) => {
    const s = l.replace(/--.*$/, ""); let score = 0;
    if (new RegExp("(^|[^\\w-])" + name + "\\s*\\[").test(s)) score += 3;
    const inLine = (s.match(/#[0-9a-fA-F]{3,8}\b/g) || []).map(hex);
    for (const c of colours) if (inLine.includes(c)) score += 3;
    for (const n of nums) if (new RegExp("(^|[^\\w.])" + n + "([^\\w.]|$)").test(s)) score += 1;
    for (const w of words) if (s.includes(w)) score += 2;
    if (art && new RegExp("(^|[^\\w-])" + art + "([^\\w-]|$)").test(s)) score += 4;
    if (score >= 3) ranked.push([score, i]);
  });
  ranked.sort((p, q) => q[0] - p[0]);
  $("#pickIn").innerHTML = `<div class="pickcall">${esc(call)}</div><h4>Most likely drawn by</h4>` + (ranked.length ? ranked.slice(0, 5).map(([s, i], k) => `<button class="cand${k ? "" : " best"}" data-l="${i + 1}"><b>line ${i + 1}</b>${esc(lines[i].trim())}</button>`).join("") : `<p class="hint">No line says it outright; a kit or a cell made it.</p>`);
  if (ranked.length) goLine(ranked[0][1] + 1);
}
$("#pickIn").onclick = e => { const b = e.target.closest(".cand"); if (b) goLine(+b.dataset.l); };

// ===================================================================== the buttons
function togglePick() { picking = !picking; $("#bPick").classList.toggle("on", picking); document.body.classList.toggle("picking", picking); if (!picking) picked = null; }
function toggleTrails() { trails = !trails; store.set("gh.trails", trails); $("#bTrails").classList.toggle("on", trails); if (!trails && idx < 0) wipe(tcx); }
function toggleFork() {
  if (fork) { fork = null; if (game) game.setRandom(null); $("#forkStage").hidden = true; $("#bFork").classList.remove("on"); $("#capMain").textContent = "now"; fitStage(); return; }
  if (!game) return;
  const seed = 1 + Math.floor(Math.random() * 1e6);
  try { fork = make(lastGood, seeded(seed)); fork.setState(game.state, game.clock); use(game); game.setRandom(seeded(seed)); }
  catch (e) { fork = null; use(game); fail(e); return; }
  $("#forkStage").hidden = false; $("#bFork").classList.add("on"); $("#capMain").textContent = "now, with your edits"; fitStage();
  note("what if: the code as it was keeps running on the right, from this moment, with the same luck", "print");
}
$("#bTrails").onclick = toggleTrails; $("#bPick").onclick = togglePick; $("#bFork").onclick = toggleFork;
$("#bSound").onclick = () => { sound = !sound; audio(); $("#bSound").classList.toggle("on", sound); if (window.zzfxVolume) window.zzfxVolume(sound ? 0.3 : 0); };
$("#bRestart").onclick = () => restart();
$("#bRevert").onclick = () => { store.set("gh.code." + prog.id, null); setCode(original); restart(); };
function tab(name) { for (const b of document.querySelectorAll("#tabs button")) b.classList.toggle("on", b.dataset.t === name); for (const p of document.querySelectorAll(".panel")) p.classList.toggle("on", p.id === "p-" + name); if (name === "signals") signals(); if (name === "tree") cursorMoved(); }
$("#tabs").onclick = e => { const b = e.target.closest("button"); if (b) tab(b.dataset.t); };

// ===================================================================== opening a program
async function begin() {
  game = null; probe = null; idx = -1; running = true; picked = null; wipe(tcx); wipe(fcx); document.body.classList.remove("past");
  await libs(code);
  try { game = make(code); lastGood = code; fail(null); game.tick(STEP, held()); } catch (e) { game = null; fail(e); }
  status(); playUI(); values();
}
async function restart() { if (fork) toggleFork(); await begin(); }
async function open(id) {
  prog = PROGRAMS.find(p => p.id === id) || PROGRAMS[0];
  $("#prog").value = prog.id; $("#fileName").textContent = prog.id + ".sp";
  const meta = prog.reg ? await metaOf(prog.id) : null, sc = screenOf(meta, prog);
  W = sc.w; H = sc.h; pixel = sc.pixel;
  try { original = prog.src !== undefined ? prog.src : await (await fetch("examples/" + prog.id + ".sp", { cache: "no-cache" })).text(); } catch (e) { original = "-- couldn't load " + prog.id + "\n"; }
  const draft = store.get("gh.code." + prog.id, null);
  if (fork) toggleFork();
  sizeStage(); setCode(draft !== null ? draft : original); ta.scrollTop = 0;
  await begin();
  if (location.hash.slice(1) !== prog.id) history.replaceState(null, "", "#" + prog.id);
}
const sel = $("#prog"), groups = [...new Set(PROGRAMS.map(p => p.group))];
sel.innerHTML = groups.map(g => `<optgroup label="${esc(g)}">${PROGRAMS.filter(p => p.group === g).map(p => `<option value="${p.id}">${esc(p.title)}</option>`).join("")}</optgroup>`).join("");
sel.onchange = () => open(sel.value);
addEventListener("hashchange", () => { const id = location.hash.slice(1); if (id && id !== prog.id) open(id); });

// for the tests, and for poking at the lab from the console
window.Greenhouse = { get game() { return game; }, get fork() { return fork; }, get code() { return code; }, get idx() { return idx; }, get lastList() { return lastList; }, get picked() { return picked; },
  setCode(c) { setCode(c); return apply(); }, goTo, playFromHere, inspect, open, pick, toggleFork, toggleTrails, togglePick, get W() { return W; }, get H() { return H; } };

$("#bTrails").classList.toggle("on", trails);
measure(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); numbers(); values(); });
open(location.hash.slice(1) || "leap").then(() => requestAnimationFrame(loop));
})();
