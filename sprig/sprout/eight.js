// SPROUT·8 (decision 113): an 8-bit games console for Sprout. A page calls Eight.start({ game: "examples/x.sp" }) and
// gets a 256x192 screen whose colours are snapped to 64 (red, green and blue each at one of four levels), pixel art
// drawn with sprite and tiles, an 8x8 pixel font, square waves and hiss, a song player, and a D-pad with two buttons
// from the keys, the touch screen or a controller. Sprout's game layer (live3.js) runs the game sixty times a second.
//
// What a game can use beyond the 2D words:
//   sprite [art, x, y, ink, flip]   art is a list of rows of text, ink a record from letter to colour ("." is clear)
//   tiles [map, set, ink, x, y]     map is rows of text, set a list of [character, art]; drawn whole, cached
//   hiss [length, pitch]            the noise channel; beep [frequency, length] is the square wave
//   song : "name" in the state      plays songs's song of that name: [bpm, beats, lead, bass, drums, once]
//   keep : [...] in the state       saved on this phone, and handed back next time as saved
//   held keys: left, right, up, down, one, two
(function (root) {
"use strict";
const S = root.Sprout3, LIVE = root.Sprout3Live;
const W = 256, H = 192, STEP = 1 / 60;

// ---------------------------------------------------------------- the console's look
const CSS = `
@font-face{font-family:"Press Start 2P";src:url("vendor/fonts/press-start-2p.woff2") format("woff2");font-display:block}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;height:100%;background:#09090c;color:#d9d9e0;overflow:hidden;font:13px/1.4 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  -webkit-user-select:none;user-select:none;-webkit-touch-callout:none;overscroll-behavior:none;touch-action:none}
#e8{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;
  padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom));
  background:radial-gradient(120% 70% at 50% 0%,#1c1c24,#09090c 70%)}
#e8 .shell{width:100%;max-width:980px;display:flex;flex-direction:column;align-items:center;gap:10px;height:100%}
#e8 .top{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px}
#e8 .logo{font:15px "Press Start 2P",monospace;color:#e83a3a;letter-spacing:1px;font-style:italic;text-shadow:0 2px 0 #0008;white-space:nowrap}
#e8 .logo b{color:#ececf2;font-weight:400}
#e8 .name{font:9px "Press Start 2P",monospace;color:#8b8b96;letter-spacing:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#e8 .bezel{position:relative;flex:1 1 auto;min-height:0;width:100%;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(180deg,#26262d,#18181d);border-radius:14px;box-shadow:inset 0 2px 0 #ffffff12,inset 0 -3px 0 #0008,0 18px 50px #000a;padding:14px}
#e8 .bezel:before{content:"";position:absolute;left:14px;right:14px;top:6px;height:3px;border-radius:2px;background:linear-gradient(90deg,#e83a3a,#e83a3a 40%,transparent 40%)}
#e8 canvas{display:block;image-rendering:pixelated;image-rendering:crisp-edges;background:#000;border-radius:3px;box-shadow:0 0 0 2px #000,0 0 30px #0009}
#e8 .led{position:absolute;right:16px;bottom:5px;font:7px "Press Start 2P",monospace;color:#77777f;display:flex;align-items:center;gap:5px}
#e8 .led i{width:6px;height:6px;border-radius:50%;background:#ff3b30;box-shadow:0 0 6px #ff3b30}
#e8 .pad{width:100%;display:none;align-items:center;justify-content:space-between;padding:4px 6px 0;flex:0 0 auto}
#e8.touch .pad{display:flex;flex:1 1 auto;align-items:center}
#e8.touch .bezel{flex:0 0 auto;padding:8px}#e8.touch .led{display:none}
#e8 .dpad{position:relative;width:150px;height:150px;touch-action:none}
#e8 .dpad i{position:absolute;background:#2b2b33;box-shadow:inset 0 2px 0 #ffffff14,0 3px 0 #000;border-radius:6px}
#e8 .dpad .h{left:0;right:0;top:50px;height:50px}#e8 .dpad .v{top:0;bottom:0;left:50px;width:50px}
#e8 .dpad .c{left:62px;top:62px;width:26px;height:26px;border-radius:50%;background:#222229;box-shadow:inset 0 2px 4px #0008}
#e8 .dpad.on-left .h{box-shadow:inset 18px 0 0 #3c3c46}#e8 .dpad.on-right .h{box-shadow:inset -18px 0 0 #3c3c46}
#e8 .dpad.on-up .v{box-shadow:inset 0 18px 0 #3c3c46}#e8 .dpad.on-down .v{box-shadow:inset 0 -18px 0 #3c3c46}
#e8 .mid{display:flex;flex-direction:column;gap:12px;align-items:center}
#e8 .pill{font:7px "Press Start 2P",monospace;color:#9a9aa5;background:#202027;border-radius:12px;padding:8px 12px;box-shadow:inset 0 1px 0 #ffffff10,0 2px 0 #000;touch-action:none}
#e8 .btns{display:flex;gap:16px;align-items:flex-end;transform:rotate(-14deg)}
#e8 .btn{width:68px;height:68px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#ff5a50,#c42222 70%);box-shadow:inset 0 -4px 0 #0005,0 4px 0 #000,0 0 0 4px #1a1a20;
  display:flex;align-items:center;justify-content:center;font:12px "Press Start 2P",monospace;color:#ffd9d6;touch-action:none}
#e8 .btn.down{transform:translateY(3px);box-shadow:inset 0 -1px 0 #0005,0 1px 0 #000,0 0 0 4px #1a1a20}
#e8 .btn.two{margin-bottom:34px}
#e8 .hint{font:8px "Press Start 2P",monospace;color:#6e6e78;text-align:center;line-height:1.9}
#e8.touch .hint{display:none}
#e8 .tools{display:flex;gap:8px}
#e8 .tools button{font:8px "Press Start 2P",monospace;color:#a5a5b0;background:#1f1f26;border:0;border-radius:8px;padding:8px 10px;cursor:pointer;box-shadow:inset 0 1px 0 #ffffff10}
#e8 .boot{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000;z-index:5;transition:opacity .5s}
#e8 .boot span{font:22px "Press Start 2P",monospace;color:#e83a3a;font-style:italic;animation:e8in 1.1s steps(8) both}
#e8 .boot span b{color:#fff;font-weight:400}
@keyframes e8in{from{transform:translateY(-120px);opacity:0}to{transform:none;opacity:1}}
@media (orientation:landscape) and (max-height:560px){
  #e8{padding:6px max(10px,env(safe-area-inset-left))}#e8 .top{display:none}
  #e8 .bezel{padding:6px;border-radius:10px}#e8 .bezel:before,#e8 .led{display:none}
  #e8.touch .pad{position:fixed;inset:auto 0 max(8px,env(safe-area-inset-bottom)) 0;pointer-events:none;padding:0 max(14px,env(safe-area-inset-right)) 0 max(14px,env(safe-area-inset-left))}
  #e8.touch .pad>*{pointer-events:auto;opacity:.6}
}`;

// ---------------------------------------------------------------- colours: 64 of them
const snapped = new Map();
function snap(c) {
  const t = typeof c === "string" ? c : S.format(c);
  let s = snapped.get(t);
  if (s === undefined) {
    let hex = t.trim();
    if (/^#[0-9a-f]{3}$/i.test(hex)) hex = "#" + hex.slice(1).split("").map(h => h + h).join("");
    s = /^#[0-9a-f]{6}/i.test(hex) ? "#" + [1, 3, 5].map(i => (Math.round(parseInt(hex.slice(i, i + 2), 16) / 85) * 85).toString(16).padStart(2, "0")).join("") : t;
    snapped.set(t, s);
  }
  return s;
}
const rgbOf = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

// ---------------------------------------------------------------- pixel art, drawn once and kept
const NOINK = {}, arts = new WeakMap(), maps = new WeakMap();
const rowsOf = art => S.isCell(art) ? S.partsOf(art).map(String) : [String(art)];
function inkOf(ink) { const m = new Map(); if (ink && S.isCell(ink)) for (const k of ink.fieldNames()) m.set(k, snap(ink.field(k))); return m; }
function keyed(cache, a, b, make) {
  let per = cache.get(a); if (!per) { per = new WeakMap(); cache.set(a, per); }
  const k = b && typeof b === "object" ? b : NOINK; let v = per.get(k);
  if (!v) { v = make(); per.set(k, v); }
  return v;
}
function bitmap(art, ink) {
  return keyed(arts, art, ink, () => {
    const rows = rowsOf(art), colours = inkOf(ink), c = document.createElement("canvas");
    c.width = Math.max(1, ...rows.map(r => r.length)); c.height = Math.max(1, rows.length);
    const g = c.getContext("2d");
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const col = colours.get(r[x]); if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } } });
    return c;
  });
}
function tileCanvas(map, set, ink) {
  let bySet = maps.get(map); if (!bySet) { bySet = new WeakMap(); maps.set(map, bySet); }
  return keyed(bySet, set, ink, () => {
    const rows = rowsOf(map), pieces = new Map();
    for (const p of S.partsOf(set)) { const [ch, art] = S.partsOf(p); pieces.set(String(ch), art); }
    const first = pieces.values().next().value, size = first ? rowsOf(first) : ["x"], tw = size[0].length, th = size.length;
    const c = document.createElement("canvas"); c.width = Math.max(1, ...rows.map(r => r.length)) * tw; c.height = rows.length * th;
    const g = c.getContext("2d");
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const art = pieces.get(r[x]); if (art) g.drawImage(bitmap(art, ink), x * tw, y * th); } });
    return c;
  });
}
// words in the 8x8 font, drawn in one colour with no soft edges
const words = new Map();
function wordBitmap(t, colour) {
  const key = colour + "|" + t; let c = words.get(key);
  if (!c) {
    c = document.createElement("canvas"); c.width = Math.max(1, t.length * 8); c.height = 8;
    const g = c.getContext("2d"); g.font = '8px "Press Start 2P",monospace'; g.textBaseline = "top"; g.fillStyle = "#fff"; g.fillText(t, 0, 0);
    const img = g.getImageData(0, 0, c.width, 8), d = img.data, [r, gr, b] = rgbOf(colour);
    for (let i = 0; i < d.length; i += 4) { const on = d[i + 3] >= 120; d[i] = r; d[i + 1] = gr; d[i + 2] = b; d[i + 3] = on ? 255 : 0; }
    g.putImageData(img, 0, 0);
    if (words.size > 800) words.clear();
    words.set(key, c);
  }
  return c;
}

// ---------------------------------------------------------------- sound: two square-wave voices, a triangle bass and hiss
let AC = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null, muted = false;
function audio() {
  if (!AC) {
    try {
      AC = new (root.AudioContext || root.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(AC.destination);
      sfxBus = AC.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
      musicBus = AC.createGain(); musicBus.gain.value = 0.3; musicBus.connect(master);
    } catch (e) { AC = null; return null; }
  }
  if (AC.state === "suspended") AC.resume();
  if (root.zzfxX && root.zzfxX.state === "suspended") root.zzfxX.resume();
  return AC;
}
function tone(type, freq, len, when, bus, vol) {
  const o = AC.createOscillator(), e = AC.createGain(); o.type = type; o.frequency.value = freq;
  e.gain.setValueAtTime(0.0001, when); e.gain.linearRampToValueAtTime(vol, when + 0.004);
  e.gain.setValueAtTime(vol, when + Math.max(0.006, len - 0.025)); e.gain.linearRampToValueAtTime(0.0001, when + len);
  o.connect(e).connect(bus); o.start(when); o.stop(when + len + 0.02);
  return o;
}
function hiss(len, pitch, when, bus, vol) {
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), e = AC.createGain();
  s.buffer = noiseBuf; s.loop = true; f.type = "bandpass"; f.frequency.value = pitch; f.Q.value = 0.7;
  e.gain.setValueAtTime(vol, when); e.gain.exponentialRampToValueAtTime(0.0005, when + Math.max(0.02, len));
  s.connect(f).connect(e).connect(bus); s.start(when, Math.random() * 0.5); s.stop(when + len + 0.03);
}
const hz = n => 440 * Math.pow(2, (n - 69) / 12);
function drum(kind, when) {
  if (kind === "kick") { const o = tone("square", 150, 0.09, when, musicBus, 0.18); o.frequency.exponentialRampToValueAtTime(45, when + 0.08); hiss(0.05, 300, when, musicBus, 0.25); }
  else if (kind === "snare") hiss(0.13, 1900, when, musicBus, 0.5);
  else if (kind === "hat") hiss(0.035, 7500, when, musicBus, 0.3);
  else if (kind === "crash") hiss(0.5, 5200, when, musicBus, 0.35);
}

// ---------------------------------------------------------------- songs, read from the game's songs record
function readSong(rec) {
  const L = S.libraries, js = L.toJS(rec), events = [];
  for (const voice of ["lead", "harmony", "bass", "drums"]) for (const ev of js[voice] || []) events.push({ beat: ev[0], note: ev[1], beats: ev[2], voice });
  events.sort((a, b) => a.beat - b.beat);
  return { bpm: js.bpm || 120, beats: js.beats || 16, once: !!js.once, events };
}

function start(opts) {
  opts = opts || {};
  const style = document.createElement("style"); style.textContent = CSS; document.head.appendChild(style);
  const touch = matchMedia("(pointer: coarse)").matches || "ontouchstart" in root;
  const box = document.createElement("div"); box.id = "e8"; if (touch) box.classList.add("touch");
  box.innerHTML = `<div class="shell">
  <div class="top"><div class="logo">SPROUT<b>·</b>8</div><div class="name"></div><div class="tools"><button class="mute">SOUND ON</button><button class="full">FULL</button></div></div>
  <div class="bezel"><canvas width="${W}" height="${H}"></canvas><div class="led"><i></i>POWER</div></div>
  <div class="pad"><div class="dpad"><i class="h"></i><i class="v"></i><i class="c"></i></div>
    <div class="mid"><div class="pill pause">PAUSE</div><div class="pill mute2">SOUND</div></div>
    <div class="btns"><div class="btn one">1</div><div class="btn two">2</div></div></div>
  <div class="hint">ARROWS MOVE &nbsp; Z BUTTON 1 &nbsp; X BUTTON 2 &nbsp; ENTER PAUSE</div>
</div><div class="boot"><span>SPROUT<b>·</b>8</span></div>`;
  document.body.appendChild(box);
  const $ = sel => box.querySelector(sel), canvas = $("canvas"), g = canvas.getContext("2d");
  g.imageSmoothingEnabled = false;
  $(".name").textContent = (opts.title || "").toUpperCase();
  const store = { get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const saveKey = "eight." + (opts.key || "game");
  muted = store.get("eight.muted", false);
  const showMute = () => { $(".mute").textContent = muted ? "SOUND OFF" : "SOUND ON"; $(".mute2").textContent = muted ? "MUTED" : "SOUND"; if (master) master.gain.value = muted ? 0 : 0.9; if (root.zzfxVolume) root.zzfxVolume(muted ? 0 : 0.3); };
  const toggleMute = () => { muted = !muted; store.set("eight.muted", muted); audio(); showMute(); };
  $(".mute").onclick = toggleMute; $(".mute2").addEventListener("pointerdown", e => { e.preventDefault(); toggleMute(); });
  $(".full").onclick = () => { const el = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); };
  setTimeout(() => { const b = $(".boot"); if (b) { b.style.opacity = 0; setTimeout(() => b.remove(), 600); } }, 1500);

  // the screen as big as it fits: whole pixels when there's room for two or more, else as big as it goes
  function fit() {
    const r = $(".bezel").getBoundingClientRect(), wide = innerHeight < innerWidth && innerHeight < 560, pad = touch ? (wide ? 6 : 8) : 14;
    const room = touch && !wide ? innerHeight * 0.56 : r.height - pad * 2;
    let k = Math.min((r.width - pad * 2) / W, room / H); if (k >= 2) k = Math.floor(k);
    canvas.style.width = Math.max(W / 2, W * k) + "px"; canvas.style.height = Math.max(H / 2, H * k) + "px";
  }
  addEventListener("resize", fit); setTimeout(fit, 0); setTimeout(fit, 300);

  // ---- input: keys, the touch pad and buttons, a controller
  const KEYS = new Set(), TOUCH = new Set(), PADKEYS = new Set();
  const KEYNAME = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down", z: "one", j: "one", c: "one", x: "two", k: "two", " ": "two" };
  let paused = false;
  const setPaused = p => { paused = p; if (musicBus) musicBus.gain.value = p ? 0.08 : 0.3; };
  addEventListener("keydown", e => {
    audio();
    if (e.key === "Enter" || e.key === "Escape" || e.key === "p") { setPaused(!paused); e.preventDefault(); return; }
    if (e.key === "m") { toggleMute(); return; }
    const k = KEYNAME[e.key] || KEYNAME[e.key.toLowerCase()]; if (k) { KEYS.add(k); e.preventDefault(); }
  });
  addEventListener("keyup", e => { const k = KEYNAME[e.key] || KEYNAME[e.key.toLowerCase()]; if (k) KEYS.delete(k); });
  addEventListener("blur", () => { KEYS.clear(); TOUCH.clear(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) setPaused(true); });
  const dpad = $(".dpad"), dirOf = new Map();
  function dpadSet(id, e) {
    const r = dpad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), far = Math.hypot(dx, dy);
    const dirs = []; if (far > 12) { const a = Math.atan2(dy, dx), oct = Math.round(a / (Math.PI / 4)); const m = { 0: ["right"], 1: ["right", "down"], 2: ["down"], 3: ["down", "left"], 4: ["left"], "-4": ["left"], "-3": ["left", "up"], "-2": ["up"], "-1": ["up", "right"] }; dirs.push(...(m[oct] || [])); }
    dirOf.set(id, dirs); refreshPad();
  }
  function refreshPad() { for (const d of ["left", "right", "up", "down"]) TOUCH.delete(d); for (const ds of dirOf.values()) for (const d of ds) TOUCH.add(d); for (const d of ["left", "right", "up", "down"]) dpad.classList.toggle("on-" + d, TOUCH.has(d)); }
  dpad.addEventListener("pointerdown", e => { e.preventDefault(); audio(); dpad.setPointerCapture(e.pointerId); dpadSet(e.pointerId, e); });
  dpad.addEventListener("pointermove", e => { if (dirOf.has(e.pointerId)) dpadSet(e.pointerId, e); });
  const dpadUp = e => { dirOf.delete(e.pointerId); refreshPad(); };
  dpad.addEventListener("pointerup", dpadUp); dpad.addEventListener("pointercancel", dpadUp);
  for (const name of ["one", "two"]) {
    const b = $(".btn." + name), on = new Set();
    b.addEventListener("pointerdown", e => { e.preventDefault(); audio(); b.setPointerCapture(e.pointerId); on.add(e.pointerId); TOUCH.add(name); b.classList.add("down"); if (navigator.vibrate) navigator.vibrate(8); });
    const lift = e => { on.delete(e.pointerId); if (!on.size) { TOUCH.delete(name); b.classList.remove("down"); } };
    b.addEventListener("pointerup", lift); b.addEventListener("pointercancel", lift);
  }
  $(".pause").addEventListener("pointerdown", e => { e.preventDefault(); audio(); setPaused(!paused); });
  canvas.addEventListener("pointerdown", () => { audio(); if (paused) setPaused(false); });
  let padStart = false;
  function pollPad() {
    PADKEYS.clear();
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue;
      const b = i => p.buttons[i] && p.buttons[i].pressed, ax = i => p.axes[i] || 0;
      if (b(14) || ax(0) < -0.45) PADKEYS.add("left"); if (b(15) || ax(0) > 0.45) PADKEYS.add("right");
      if (b(12) || ax(1) < -0.45) PADKEYS.add("up"); if (b(13) || ax(1) > 0.45) PADKEYS.add("down");
      if (b(0)) PADKEYS.add("two"); if (b(1) || b(2)) PADKEYS.add("one");
      if (b(9) && !padStart) setPaused(!paused); padStart = b(9);
    }
  }
  const heldCell = () => { const m = new Map(); for (const set of [KEYS, TOUCH, PADKEYS]) for (const k of set) m.set(k, true); return S.valueCellOf([], m); };

  // ---- drawing
  function disc(cx, cy, r, colour) {
    g.fillStyle = colour; cx = Math.round(cx); cy = Math.round(cy); r = Math.max(0, Math.round(r));
    for (let dy = -r; dy <= r; dy++) { const half = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35); g.fillRect(cx - half, cy + dy, half * 2 + 1, 1); }
  }
  function pixelLine(x0, y0, x1, y1, colour) {
    g.fillStyle = colour; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy, n = 0;
    for (;;) { g.fillRect(x0, y0, 1, 1); if ((x0 === x1 && y0 === y1) || n++ > 1024) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  }
  function words8(a) {
    const t = String(a[0]), scale = Math.max(1, Math.round((+a[3] || 8) / 8)), bm = wordBitmap(t, snap(a[4] === undefined ? "#ffffff" : a[4]));
    const w = bm.width * scale, h = 8 * scale, align = a[5] === "left" || a[5] === "right" ? a[5] : "center";
    const x = Math.round(align === "left" ? a[1] : align === "right" ? a[1] - w : a[1] - w / 2), y = Math.round(a[2] - h / 2);
    g.drawImage(bm, x, y, w, h);
  }
  let warned = false;
  function paint(list) {
    for (const [name, a] of list) {
      if (name === "clear") { g.fillStyle = snap(a[0]); g.fillRect(0, 0, W, H); }
      else if (name === "rect") { g.fillStyle = snap(a[4]); g.fillRect(Math.round(a[0]), Math.round(a[1]), Math.round(a[2]), Math.round(a[3])); }
      else if (name === "circle") disc(a[0], a[1], a[2], snap(a[3]));
      else if (name === "line") pixelLine(a[0], a[1], a[2], a[3], snap(a[4]));
      else if (name === "text") words8(a);
      else if (name === "sprite") {
        if (!a[0] || typeof a[0] !== "object") { if (!warned) { warned = true; console.warn("sprite wants a list of rows, not " + S.format(a[0])); } continue; }
        const bm = bitmap(a[0], a[3]), x = Math.round(a[1]), y = Math.round(a[2]);
        if (a[4] === true || a[4] === -1) { g.save(); g.translate(x + bm.width, y); g.scale(-1, 1); g.drawImage(bm, 0, 0); g.restore(); } else g.drawImage(bm, x, y);
      }
      else if (name === "tiles") g.drawImage(tileCanvas(a[0], a[1], a[2]), Math.round(a[3]), Math.round(a[4]));
    }
  }

  // ---- the game
  let game = null, shake = 0, song = null, songName = false, saved = "", frames = 0;
  const songs = {};
  function songOf(name) {
    if (name in songs) return songs[name];
    let rec = null; try { const all = game.file.field("songs"); if (all !== S.UNSET && S.isCell(all) && all.fieldNames().includes(name)) rec = all.field(name); } catch (e) {}
    return (songs[name] = rec ? readSong(rec) : null);
  }
  function setSong(name) {
    if (name === songName) return;
    songName = name; const s = typeof name === "string" ? songOf(name) : null;
    song = s && AC ? { s, t0: AC.currentTime + 0.08, i: 0 } : null;
    if (s && !AC) songName = null;      // try again once sound is allowed
  }
  function pumpSong() {
    if (!song || !AC) return;
    const s = song.s, spb = 60 / s.bpm, len = s.beats * spb, horizon = AC.currentTime + 0.2;
    for (let guard = 0; guard < 64; guard++) {
      if (song.i >= s.events.length) { if (s.once || !s.events.length) { song = null; return; } song.i = 0; song.t0 += len; }
      const ev = s.events[song.i], at = song.t0 + ev.beat * spb;
      if (at > horizon) return;
      if (at >= AC.currentTime - 0.02) {
        const dur = Math.max(0.03, ev.beats * spb * 0.92);
        if (ev.voice === "drums") drum(String(ev.note), at);
        else if (typeof ev.note === "number") tone(ev.voice === "bass" ? "triangle" : "square", hz(ev.note), dur, at, musicBus, ev.voice === "bass" ? 0.16 : ev.voice === "harmony" ? 0.035 : 0.055);
      }
      song.i++;
    }
  }
  function onEffect([name, a]) {
    if (name === "shake") { shake = Math.max(shake, +a[0] || 4); return; }
    if (!audio()) return;
    const now = AC.currentTime;
    if (name === "beep") tone("square", +a[0] || 440, Math.max(0.02, +a[1] || 0.08), now, sfxBus, 0.12);
    else if (name === "hiss") hiss(Math.max(0.02, +a[0] || 0.1), +a[1] || 2000, now, sfxBus, 0.6);
  }
  function fail(e) { g.fillStyle = "#000"; g.fillRect(0, 0, W, H); words8(["CAN'T START", W / 2, 80, 8, "#ff5555"]); words8([String(e && e.message || e).slice(0, 30).toUpperCase(), W / 2, 100, 8, "#aaaaaa"]); console.error(e); }

  async function boot() {
    try {
      if (document.fonts && document.fonts.load) await Promise.race([document.fonts.load('8px "Press Start 2P"'), new Promise(r => setTimeout(r, 2500))]);
      const src = await (await fetch(opts.game, { cache: "no-cache" })).text();
      if (S.libraries) { S.libraries.setBase(""); const missing = S.libraries.missing(src); if (missing.length) await S.libraries.load(missing); }
      const keep = store.get(saveKey, null);
      const host = { saved: keep ? S.libraries.fromJS(keep) : S.valueCellOf([], new Map()), console8: true };
      game = LIVE.makeGame(src, { W, H, onEffect, host });
      // one frame first: the state only has its clock, input and dt once update has run
      game.tick(STEP, heldCell());
      showMute();
    } catch (e) { fail(e); return; }
    let last = performance.now(), acc = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      pollPad();
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      try {
        if (!paused) { acc += dt; let n = 0; while (acc >= STEP && n < 4) { game.tick(STEP, heldCell()); acc -= STEP; n++; } if (n === 4) acc = 0; }
        const list = game.draw();
        g.save();
        if (shake > 0.3 && !paused) g.translate(Math.round((Math.random() * 2 - 1) * shake), Math.round((Math.random() * 2 - 1) * shake));
        shake *= 0.86;
        paint(list);
        g.restore();
        if (paused) { g.fillStyle = "#000000aa"; g.fillRect(0, 0, W, H); words8(["PAUSE", W / 2, H / 2, 16, "#ffffff"]); words8([touch ? "TAP TO PLAY" : "ENTER TO PLAY", W / 2, H / 2 + 20, 8, "#aaaaaa"]); }
        const st = game.state;
        if (AC) { setSong(st.fieldNames().includes("song") ? st.field("song") : false); pumpSong(); }
        if (++frames % 30 === 0 && st.fieldNames().includes("keep")) { const k = JSON.stringify(S.libraries.toJS(st.field("keep"))); if (k !== saved) { saved = k; store.set(saveKey, JSON.parse(k)); } }
      } catch (e) { fail(e); }
    }
    requestAnimationFrame(frame);
  }
  boot();
  return { get game() { return game; } };
}

root.Eight = { start, snap, W, H };
})(window);
