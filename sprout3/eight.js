// SPROUT·8 (decision 113): an 8-bit games console for Sprout. A page calls Eight.start({ game: "examples/x.sp" }) and
// gets a 256x192 screen whose colours are snapped to 64 (red, green and blue each at one of four levels), pixel art
// drawn with sprite and tiles, an 8x8 pixel font, square waves and hiss, a song player, and a D-pad with two buttons
// from the keys, the touch screen or a controller. Sprout's game layer (live3.js) runs the game sixty times a second.
//
// What a game can use beyond the 2D words:
//   sprite [art, x, y, ink, flip, scale]   art is rows of text, ink a record from letter to colour ("." is clear)
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
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;touch-action:none}
html,body{margin:0;height:100%;background:#09090c;color:#d9d9e0;overflow:hidden;font:13px/1.4 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  -webkit-user-select:none;user-select:none;-webkit-touch-callout:none;overscroll-behavior:none}
#e8{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  background:radial-gradient(110% 80% at 50% 10%,var(--page2),var(--page) 72%);padding:max(8px,env(safe-area-inset-top)) 8px max(8px,env(safe-area-inset-bottom))}
/* the handheld: a portrait body with the big rounded corner, the screen in its bezel, the maker's plate, the controls */
#e8 .gb{position:relative;width:min(94vw,calc((100vh - 64px) * 0.62));aspect-ratio:62/100;display:grid;grid-template-columns:1fr 1fr;
  grid-template-rows:auto auto auto 1fr auto;grid-template-areas:"top top" "bezel bezel" "brand brand" "dpad btns" "pills pills";
  background:linear-gradient(165deg,var(--body) 0%,var(--body) 55%,var(--body2) 100%);border-radius:16px 16px 74px 16px;padding:0 0 30px;
  box-shadow:inset 0 2px 0 #ffffff44,inset 0 -4px 0 #00000040,inset 4px 0 0 #ffffff18,inset -4px 0 0 #00000024,0 24px 60px #000a}
#e8 .top{grid-area:top;display:flex;align-items:center;gap:8px;padding:10px 16px 8px;font:7px "Press Start 2P",monospace;color:var(--ink);letter-spacing:1px}
#e8 .top i{flex:1;height:2px;border-radius:1px;background:#00000030;box-shadow:0 1px 0 #ffffff33}
#e8 .bezel{grid-area:bezel;position:relative;margin:0 7%;padding:26px 5% 18px 13%;background:var(--bezel);border-radius:10px 10px 44px 10px;
  box-shadow:inset 0 2px 7px #0009,0 1px 0 #ffffff33;display:flex;align-items:center;justify-content:center}
#e8 .bezel .lines{position:absolute;left:12px;right:12px;top:10px;display:flex;align-items:center;gap:7px;font:6px "Press Start 2P",monospace;color:var(--bezel-ink);white-space:nowrap}
#e8 .bezel .lines i{height:2px;flex:1;background:var(--s1);box-shadow:0 4px 0 var(--s2)}
#e8 .screen{position:relative;line-height:0}
#e8 .screen canvas{display:block;image-rendering:pixelated;image-rendering:crisp-edges;background:#000;border-radius:2px;box-shadow:0 0 0 2px #0009}
#e8 .led{position:absolute;left:3.6%;top:44%;display:flex;flex-direction:column;align-items:center;gap:5px;font:5px "Press Start 2P",monospace;color:var(--bezel-ink)}
#e8 .led i{width:7px;height:7px;border-radius:50%;background:#ff3b30;box-shadow:0 0 7px #ff3b30}
#e8 .brand{grid-area:brand;display:flex;align-items:center;gap:10px;padding:12px 9% 0;min-width:0}
#e8 .brand .logo{font:var(--logo-weight) var(--logo-size)/1 var(--brand),system-ui,sans-serif;font-style:var(--logo-style);letter-spacing:var(--logo-track);color:var(--logo);
  text-shadow:0 1px 0 #ffffff44,0 -1px 0 #00000033;white-space:nowrap}
#e8 .brand .sub{font:italic 800 11px/1 -apple-system,system-ui,sans-serif;color:var(--sub);letter-spacing:2px;align-self:flex-end;padding-bottom:3px;white-space:nowrap}
#e8 .brand .mascot{margin-left:auto;width:48px;height:48px;image-rendering:pixelated;flex:0 0 auto}
#e8 .dpad{grid-area:dpad;justify-self:center;align-self:center;position:relative;width:118px;height:118px}
#e8 .dpad i{position:absolute;background:var(--dpad);box-shadow:inset 0 2px 0 #ffffff22,0 3px 0 #0008;border-radius:5px}
#e8 .dpad .h{left:0;right:0;top:39px;height:40px}#e8 .dpad .v{top:0;bottom:0;left:39px;width:40px}
#e8 .dpad .c{left:50px;top:50px;width:18px;height:18px;border-radius:50%;background:#0003;box-shadow:inset 0 2px 3px #0006}
#e8 .dpad.on-left .h{box-shadow:inset 14px 0 0 #ffffff2a}#e8 .dpad.on-right .h{box-shadow:inset -14px 0 0 #ffffff2a}
#e8 .dpad.on-up .v{box-shadow:inset 0 14px 0 #ffffff2a}#e8 .dpad.on-down .v{box-shadow:inset 0 -14px 0 #ffffff2a}
#e8 .btns{grid-area:btns;justify-self:center;align-self:center;display:flex;gap:16px;align-items:flex-end;transform:rotate(-24deg)}
#e8 .btn{width:58px;height:58px;border-radius:50%;background:radial-gradient(circle at 36% 30%,#ffffff55,transparent 46%),var(--btn);
  box-shadow:inset 0 -4px 0 #0004,0 4px 0 #0007,0 0 0 4px #00000022;display:flex;align-items:center;justify-content:center;font:12px "Press Start 2P",monospace;color:var(--btn-ink)}
#e8 .btn.down{transform:translateY(3px);box-shadow:inset 0 -1px 0 #0004,0 1px 0 #0007,0 0 0 4px #00000022}
#e8 .btn.two{margin-bottom:30px}
#e8 .pills{grid-area:pills;display:flex;gap:20px;justify-content:center;padding:4px 0 0}
#e8 .pill{transform:rotate(-24deg);display:flex;flex-direction:column;align-items:center;gap:6px;font:6px "Press Start 2P",monospace;color:var(--ink)}
#e8 .pill b{display:block;width:46px;height:12px;border-radius:7px;background:var(--pill);box-shadow:inset 0 -2px 0 #0005,0 1px 0 #ffffff33}
#e8 .grille{position:absolute;right:24px;bottom:24px;display:flex;gap:7px;transform:rotate(-28deg);pointer-events:none}
#e8 .grille i{width:5px;height:44px;border-radius:3px;background:#00000030;box-shadow:inset 0 2px 2px #0005,0 1px 0 #ffffff22}
#e8 .below{display:flex;gap:12px;align-items:center;font:7px "Press Start 2P",monospace;color:var(--hint)}
#e8 .below button{font:7px "Press Start 2P",monospace;color:var(--hint);background:#ffffff14;border:0;border-radius:8px;padding:7px 9px;cursor:pointer}
#e8.touch .below{display:none}
#e8 .boot{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:var(--body);z-index:5;transition:opacity .5s}
#e8 .boot span{font:var(--logo-weight) calc(var(--logo-size) * 1.3)/1 var(--brand),system-ui,sans-serif;font-style:var(--logo-style);letter-spacing:var(--logo-track);color:var(--logo);animation:e8in 1.1s steps(8) both}
@keyframes e8in{from{transform:translateY(-120px);opacity:0}to{transform:none;opacity:1}}
/* options a skin can choose (decision 120): a round D-pad, buttons in a row, a plate behind the brand, a wide body */
#e8 .dpad.disc{border-radius:50%;background:var(--dpad);box-shadow:inset 0 3px 0 #ffffff22,0 4px 0 #0008,0 0 0 5px #00000026}
#e8 .dpad.disc i{background:#ffffff16;box-shadow:none}#e8 .dpad.disc .h{left:14px;right:14px;top:52px;height:14px}#e8 .dpad.disc .v{top:14px;bottom:14px;left:52px;width:14px}
#e8 .dpad.disc .c{display:none}
#e8 .dpad.disc.on-left{box-shadow:inset 16px 0 0 #ffffff26,0 4px 0 #0008,0 0 0 5px #00000026}#e8 .dpad.disc.on-right{box-shadow:inset -16px 0 0 #ffffff26,0 4px 0 #0008,0 0 0 5px #00000026}
#e8 .dpad.disc.on-up{box-shadow:inset 0 16px 0 #ffffff26,0 4px 0 #0008,0 0 0 5px #00000026}#e8 .dpad.disc.on-down{box-shadow:inset 0 -16px 0 #ffffff26,0 4px 0 #0008,0 0 0 5px #00000026}
#e8 .btns.row{transform:none;align-items:center}#e8 .btns.row .btn.two{margin-bottom:0}
#e8[class*="pattern-"] .top span,#e8[class*="pattern-"] .pill span{background:var(--plate);color:var(--ink);padding:3px 6px;border-radius:5px}
#e8 .brand.plate{background:var(--plate);border-radius:12px;margin:10px 7% 0;padding:8px 12px;box-shadow:inset 0 1px 3px #0005}
@media (orientation:landscape) and (min-height:561px){
  #e8 .gb.wide{width:min(96vw,calc((100vh - 64px) * 1.8));aspect-ratio:18/10;border-radius:46% 46% 46% 46% / 22% 22% 30% 30%;padding:0 0 16px;
    grid-template-columns:1fr auto 1fr;grid-template-rows:auto 1fr auto;grid-template-areas:"top top top" "dpad bezel btns" "pills brand ."}
  #e8 .gb.wide .top{padding:14px 18% 6px}
  #e8 .gb.wide .bezel{margin:0;align-self:center;padding:24px 18px 16px 44px;border-radius:14px}
  #e8 .gb.wide .brand{justify-content:center;padding:10px 0 0;margin:8px 0 0}#e8 .gb.wide .brand.plate{padding:6px 14px}
  #e8 .gb.wide .pills{align-self:center;padding:0}#e8 .gb.wide .grille{right:9%;bottom:16%}
}
/* a phone: the handheld fills the screen */
#e8.touch{padding:0}
#e8.touch .gb{width:100vw;height:100%;aspect-ratio:auto;border-radius:0 0 74px 0;padding:env(safe-area-inset-top) 0 max(30px,env(safe-area-inset-bottom))}
#e8.touch .bezel{margin:0 4%;padding:24px 3% 14px 10%}
/* a phone on its side: the screen in the middle, the D-pad on the left, the buttons on the right */
@media (orientation:landscape) and (max-height:560px){
  #e8 .gb,#e8.touch .gb{width:100vw;height:100%;aspect-ratio:auto;border-radius:0;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
    grid-template-columns:auto 1fr auto;grid-template-rows:1fr auto;grid-template-areas:"dpad bezel btns" "dpad bezel pills"}
  #e8 .top,#e8 .brand,#e8 .grille,#e8 .below{display:none}
  #e8 .bezel,#e8.touch .bezel{margin:6px 0;padding:6px 6px 6px 22px;border-radius:8px}#e8 .bezel .lines{display:none}#e8 .led{left:7px;font-size:0}
  #e8 .dpad{margin:0 16px}#e8 .btns{margin:0 16px}#e8 .pills{padding:0 0 12px;gap:10px}
}`;
// the look a game gets when it brings none: the SPROUT·8 console's own
const PLAIN = { logo: "SPROUT·8", sub: "", badge: "SPROUT·8", tagline: "8-BIT COLOUR", page: "#09090c", page2: "#1c1c24", body: "#2e2e35", body2: "#202026",
  ink: "#9a9aa5", bezel: "#17171c", bezelInk: "#77777f", stripe1: "#e83a3a", stripe2: "#2f5fd0", logoColour: "#e83a3a", subColour: "#9a9aa5",
  font: "Press Start 2P", logoSize: "17px", logoWeight: "400", logoStyle: "italic", logoTrack: "1px", button: "#c42222", buttonInk: "#ffd9d6", dpad: "#1c1c22",
  pill: "#3a3a44", hint: "#6e6e78" };

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
  const skin = Object.assign({}, PLAIN, opts.skin || {});
  const style = document.createElement("style");
  style.textContent = CSS + (skin.fontFile ? `@font-face{font-family:"${skin.font}";src:url("vendor/fonts/${skin.fontFile}") format("woff2");font-display:swap}` : "");
  document.head.appendChild(style);
  const touch = matchMedia("(pointer: coarse)").matches || "ontouchstart" in root;
  const box = document.createElement("div"); box.id = "e8"; if (touch) box.classList.add("touch");
  if (skin.pattern) box.classList.add("pattern-" + skin.pattern);
  const vars = { plate: skin.plate || "transparent", page: skin.page, page2: skin.page2, body: skin.body, body2: skin.body2, ink: skin.ink, bezel: skin.bezel, "bezel-ink": skin.bezelInk, s1: skin.stripe1, s2: skin.stripe2,
    logo: skin.logoColour, sub: skin.subColour, brand: `"${skin.font}"`, "logo-size": skin.logoSize, "logo-weight": skin.logoWeight, "logo-style": skin.logoStyle, "logo-track": skin.logoTrack,
    btn: skin.button, "btn-ink": skin.buttonInk, dpad: skin.dpad, pill: skin.pill, hint: skin.hint };
  for (const k in vars) box.style.setProperty("--" + k, vars[k]);
  const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  box.innerHTML = `<div class="gb${skin.shape === "wide" ? " wide" : ""}">
  <div class="top"><i></i><span>${esc(skin.badge)}</span><i></i></div>
  <div class="bezel"><div class="lines"><i></i><span>${esc(skin.tagline)}</span><i></i></div><div class="led"><i></i>POWER</div><div class="screen"><canvas width="${W}" height="${H}"></canvas></div></div>
  <div class="brand${skin.plate ? " plate" : ""}"><span class="logo">${esc(skin.logo)}</span><span class="sub">${esc(skin.sub)}</span><canvas class="mascot" width="16" height="16"></canvas></div>
  <div class="dpad${skin.dpadShape === "disc" ? " disc" : ""}"><i class="h"></i><i class="v"></i><i class="c"></i></div>
  <div class="btns${skin.buttonRow ? " row" : ""}"><div class="btn one">1</div><div class="btn two">2</div></div>
  <div class="pills"><div class="pill mute2"><b></b><span>SOUND</span></div><div class="pill pause"><b></b><span>PAUSE</span></div></div>
  <div class="grille"><i></i><i></i><i></i><i></i><i></i><i></i></div>
</div>
<div class="below"><span>ARROWS MOVE &nbsp; Z 1 &nbsp; X 2 &nbsp; ENTER PAUSE</span><button class="mute">SOUND ON</button><button class="full">FULL SCREEN</button></div>
<div class="boot"><span>${esc(skin.logo)}</span></div>`;
  document.body.appendChild(box);
  document.body.style.background = skin.page;
  if (skin.pattern === "zebra") {
    const band = (y, w) => `<path d='M-20 ${y} C 20 ${y - 18}, 50 ${y + 22}, 90 ${y} S 160 ${y - 16}, 200 ${y + 6}' stroke='%23111' stroke-width='${w}' fill='none' stroke-linecap='round'/>`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'>${[[14, 13], [52, 9], [86, 15], [122, 8], [158, 12]].map(([y, w]) => band(y, w)).join("")}</svg>`;
    const body = box.querySelector(".gb");
    body.style.backgroundImage = `url("data:image/svg+xml,${svg.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/ /g, "%20")}"),linear-gradient(165deg,${skin.body},${skin.body2})`;
    body.style.backgroundSize = "180px 180px, auto";
  }
  // iOS Safari zooms in on a quick second tap, and on a pinch, whatever the viewport says (it ignores user-scalable=no):
  // a game wants neither, so the second tap of a double tap and every pinch are cancelled. Text boxes are left alone.
  let lastTap = 0;
  const typing = t => t && t.closest && t.closest("input, textarea, select, [contenteditable]");
  document.addEventListener("touchend", e => { const now = e.timeStamp; if (now - lastTap < 350 && !typing(e.target)) e.preventDefault(); lastTap = now; }, { passive: false });
  document.addEventListener("touchmove", e => { if (e.touches.length > 1 && !typing(e.target)) e.preventDefault(); }, { passive: false });
  for (const t of ["gesturestart", "gesturechange", "gestureend", "dblclick"]) document.addEventListener(t, e => e.preventDefault(), { passive: false });
  const $ = sel => box.querySelector(sel), canvas = $(".screen canvas"), g = canvas.getContext("2d");
  g.imageSmoothingEnabled = false;
  const store = { get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const saveKey = "eight." + (opts.key || "game");
  muted = store.get("eight.muted", false);
  const showMute = () => { $(".mute").textContent = muted ? "SOUND OFF" : "SOUND ON"; $(".mute2 span").textContent = muted ? "MUTED" : "SOUND"; if (master) master.gain.value = muted ? 0 : 0.9; if (root.zzfxVolume) root.zzfxVolume(muted ? 0 : 0.3); };
  const toggleMute = () => { muted = !muted; store.set("eight.muted", muted); audio(); showMute(); };
  const toggleFull = () => { const el = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); };
  $(".mute").onclick = toggleMute; $(".mute2").addEventListener("pointerdown", e => { e.preventDefault(); toggleMute(); });
  $(".full").onclick = toggleFull;
  setTimeout(() => { const b = $(".boot"); if (b) { b.style.opacity = 0; setTimeout(() => b.remove(), 600); } }, 1500);

  // the screen as big as the bezel lets it be: whole pixels from three times up, else as big as it goes
  function fit() {
    const bz = $(".bezel"), r = bz.getBoundingClientRect(), cs = getComputedStyle(bz);
    const roomW = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const wide = innerWidth > innerHeight && innerHeight < 560;
    const gb = $(".gb").getBoundingClientRect();
    const wideBody = skin.shape === "wide" && !wide && matchMedia("(orientation:landscape) and (min-height:561px)").matches;
    const roomH = wide ? r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) : gb.height * (wideBody ? 0.6 : 0.46);
    let k = wideBody ? Math.min(gb.width * 0.5 / W, roomH / H) : Math.min(roomW / W, roomH / H); if (k >= 3) k = Math.floor(k);
    canvas.style.width = Math.max(W / 2, W * k) + "px"; canvas.style.height = Math.max(H / 2, H * k) + "px";
  }
  addEventListener("resize", fit); setTimeout(fit, 0); setTimeout(fit, 300);

  // ---- input: keys, the touch pad and buttons, a controller
  // a press is latched until the next frame has seen it, so a tap quicker than a frame still counts (decision 120)
  const KEYS = new Set(), TOUCH = new Set(), PADKEYS = new Set(), LATCH = new Set();
  const KEYNAME = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down", z: "one", j: "one", c: "one", x: "two", k: "two", " ": "two" };
  let paused = false;
  const setPaused = p => { paused = p; if (musicBus) musicBus.gain.value = p ? 0.08 : 0.3; };
  addEventListener("keydown", e => {
    audio();
    if (e.key === "Enter" || e.key === "Escape" || e.key === "p") { setPaused(!paused); e.preventDefault(); return; }
    if (e.key === "m") { toggleMute(); return; }
    if (e.key === "f") { toggleFull(); return; }
    const k = KEYNAME[e.key] || KEYNAME[e.key.toLowerCase()]; if (k) { KEYS.add(k); LATCH.add(k); e.preventDefault(); }
  });
  addEventListener("keyup", e => { const k = KEYNAME[e.key] || KEYNAME[e.key.toLowerCase()]; if (k) KEYS.delete(k); });
  addEventListener("blur", () => { KEYS.clear(); TOUCH.clear(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) setPaused(true); });
  const dpad = $(".dpad"), dirOf = new Map();
  function dpadSet(id, e) {
    const r = dpad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), far = Math.hypot(dx, dy);
    const dirs = []; if (far > 12) { const a = Math.atan2(dy, dx), oct = Math.round(a / (Math.PI / 4)); const m = { 0: ["right"], 1: ["right", "down"], 2: ["down"], 3: ["down", "left"], 4: ["left"], "-4": ["left"], "-3": ["left", "up"], "-2": ["up"], "-1": ["up", "right"] }; dirs.push(...(m[oct] || [])); }
    dirOf.set(id, dirs); for (const d of dirs) LATCH.add(d); refreshPad();
  }
  function refreshPad() { for (const d of ["left", "right", "up", "down"]) TOUCH.delete(d); for (const ds of dirOf.values()) for (const d of ds) TOUCH.add(d); for (const d of ["left", "right", "up", "down"]) dpad.classList.toggle("on-" + d, TOUCH.has(d)); }
  dpad.addEventListener("pointerdown", e => { e.preventDefault(); audio(); dpad.setPointerCapture(e.pointerId); dpadSet(e.pointerId, e); });
  dpad.addEventListener("pointermove", e => { if (dirOf.has(e.pointerId)) dpadSet(e.pointerId, e); });
  const dpadUp = e => { dirOf.delete(e.pointerId); refreshPad(); };
  dpad.addEventListener("pointerup", dpadUp); dpad.addEventListener("pointercancel", dpadUp);
  for (const name of ["one", "two"]) {
    const b = $(".btn." + name), on = new Set();
    b.addEventListener("pointerdown", e => { e.preventDefault(); audio(); b.setPointerCapture(e.pointerId); on.add(e.pointerId); TOUCH.add(name); LATCH.add(name); b.classList.add("down"); if (navigator.vibrate) navigator.vibrate(8); });
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
  const heldCell = () => { const m = new Map(); for (const set of [KEYS, TOUCH, PADKEYS, LATCH]) for (const k of set) m.set(k, true); return S.valueCellOf([], m); };

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
        // a sixth value, a whole number, draws it that many times bigger (decision 120)
        const bm = bitmap(a[0], a[3]), x = Math.round(a[1]), y = Math.round(a[2]), k = Math.max(1, Math.round(+a[5] || 1)), w = bm.width * k, h = bm.height * k;
        if (a[4] === true || a[4] === -1) { g.save(); g.translate(x + w, y); g.scale(-1, 1); g.drawImage(bm, 0, 0, w, h); g.restore(); } else g.drawImage(bm, x, y, w, h);
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
      // the maker's plate shows the game's own hero, drawn from its art
      try { const art = skin.mascot ? game.file.field(skin.mascot) : S.UNSET, ink = game.file.field(skin.mascotInk || "ink");
        if (art !== S.UNSET && S.isCell(art)) { const bm = bitmap(art, ink === S.UNSET ? null : ink), m = $(".mascot"); m.width = bm.width; m.height = bm.height; m.getContext("2d").drawImage(bm, 0, 0); } else $(".mascot").style.display = "none"; } catch (e) {}
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
        if (!paused) { acc += dt; let n = 0; while (acc >= STEP && n < 4) { game.tick(STEP, heldCell()); LATCH.clear(); acc -= STEP; n++; } if (n === 4) acc = 0; }
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
