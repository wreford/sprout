// The ACE page: the theme switch, the hero's derive story, and the eight examples running on the page.
// The games run here with Sprout's own game layer (live3.js) and a small painter, as the guide's seedling does.
// The programs that only print run in a worker (ace-worker.js), so a million runs never stall the page.
(() => {
"use strict";
const V = "20261123a", SP = "../sprout3/";
const $ = (s, el) => (el || document).querySelector(s), $$ = (s, el) => [...(el || document).querySelectorAll(s)];
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const root = document.documentElement;

// ---------------------------------------------------------------- light and dark
const systemDark = matchMedia("(prefers-color-scheme: dark)");
const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : systemDark.matches;
const themeBtn = $("#theme");
function themeUI() { const d = isDark(); themeBtn.setAttribute("aria-pressed", String(d)); themeBtn.title = d ? "Switch to light" : "Switch to dark"; }
themeBtn.addEventListener("click", () => { root.dataset.theme = isDark() ? "light" : "dark"; store.set("ace.theme", root.dataset.theme); themeUI(); });
if (systemDark.addEventListener) systemDark.addEventListener("change", themeUI);
themeUI();

// the header gets a hairline once the page moves under it
const top = $("#top");
const lined = () => top.classList.toggle("lined", scrollY > 8);
addEventListener("scroll", lined, { passive: true }); lined();

// sections fade up as they arrive
const rv = $$(".rv");
if ("IntersectionObserver" in window && !reduced()) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
  rv.forEach(el => io.observe(el));
} else rv.forEach(el => el.classList.add("in"));

// ---------------------------------------------------------------- the hero: done, derived, one step at a time
// The graph is read from the SVG itself (each atom's kind and links are on it). Each step adds what people did;
// done is worked out again from nothing, as ace-board does it: close whatever the rules allow, until a pass closes nothing.
const svg = $(".graph");
if (svg) {
  const nodes = $$(".n", svg).map(el => ({ el, id: el.dataset.id, kind: el.dataset.kind, req: (el.dataset.req || "").split(" ").filter(Boolean),
    has: (el.dataset.has || "").split(" ").filter(Boolean), name: $(".nm", el).textContent, kd: $(".kd", el) }));
  const byId = new Map(nodes.map(n => [n.id, n]));
  const edges = $$(".e", svg).map(el => ({ el, from: el.dataset.from }));
  const DID = [
    [[], [], "Nothing is closed yet. Work that requires nothing is workable."],
    [["survey"], [], "Someone closes the survey."],
    [["permit"], [], "The permit is closed too, but it is verified work: it needs a witness before it counts."],
    [[], ["permit"], "The witness signs. Excavation is workable now: everything it requires is done."],
    [["dig"], [], "Excavation closes. Placing rebar still waits on the rebar and on the RFI."],
    [["reply", "rebar"], [], "The rebar arrives and the engineer replies. Nobody closes the RFI: it is a gate, and it closes itself."],
    [["place"], [], "The rebar is placed. The inspection is workable."],
    [["inspect"], ["inspect"], "The inspector closes the inspection and signs it. The pour is workable."],
    [["pour"], [], "The pour closes, and the pedestal closes itself: a rollup is done when all its children are."],
  ];
  // the facts at each step: everything closed and signed so far
  const STEPS = []; DID.reduce((f, [c, s, say]) => { const next = { closed: f.closed.concat(c), signed: f.signed.concat(s), say }; STEPS.push(next); return next; }, { closed: [], signed: [] });

  const derive = facts => {
    const ok = new Map(), closed = new Set(facts.closed), signed = new Set(facts.signed), passes = [];
    const met = n => n.req.every(r => ok.has(r)) && n.has.every(r => ok.has(r));
    const closes = n => n.kind === "trivial" || (met(n) && (n.kind === "gate" || n.kind === "rollup" || (closed.has(n.id) && (n.kind === "leaf" || signed.has(n.id)))));
    for (;;) {
      const more = nodes.filter(n => !ok.has(n.id) && closes(n));
      passes.push(more);
      if (!more.length) break;
      more.forEach(n => ok.set(n.id, passes.length));
    }
    const state = n => ok.has(n.id) ? "done" : (n.kind === "leaf" || n.kind === "verified") && n.req.every(r => ok.has(r)) ? (closed.has(n.id) ? "half" : "work") : "wait";
    return { ok, passes, state };
  };

  const say = $("#say"), log = $("#log"), sN = $("#sN"), ctl = $("#ctl"), pips = $("#pips");
  pips.innerHTML = STEPS.map(() => "<i></i>").join("");
  let step = 5, playing = !reduced(), timer = 0, onScreen = true, shown = null;

  function render(i, animate) {
    step = i;
    const d = derive(STEPS[i]);
    // newly done atoms light up in the order of the pass that closed them
    const fresh = nodes.filter(n => d.ok.has(n.id) && !(shown && shown.has(n.id)));
    const first = fresh.length ? Math.min(...fresh.map(n => d.ok.get(n.id))) : 0;
    const delay = n => animate && fresh.includes(n) ? (d.ok.get(n.id) - first) * 0.28 : 0;
    for (const n of nodes) {
      const s = d.state(n);
      n.el.classList.remove("done", "half", "work", "wait", "pop");
      n.el.style.setProperty("--d", delay(n) + "s");
      if (animate && fresh.includes(n)) { void n.el.getBoundingClientRect(); n.el.classList.add("pop"); }
      n.el.classList.add(s);
      if (n.kd && n.kind !== "rollup") n.kd.textContent = s === "half" ? "needs a witness" : n.kind;
    }
    for (const e of edges) { const n = byId.get(e.from); e.el.style.setProperty("--d", (n ? delay(n) : 0) + "s"); e.el.classList.toggle("on", d.ok.has(e.from)); }
    shown = d.ok;
    say.textContent = STEPS[i].say;
    if (animate) { say.classList.remove("swap"); void say.offsetWidth; say.classList.add("swap"); }
    log.innerHTML = "derive, from nothing: " + d.passes.map((p, k) => "<b>" + (k + 1) + "</b> " + (p.length ? esc(p.map(n => n.name).join(", ")) : "nothing new, so stop")).join(" · ");
    sN.textContent = (i + 1) + " / " + STEPS.length;
    $$("i", pips).forEach((p, k) => p.classList.toggle("on", k === i));
    return fresh.length ? (Math.max(...fresh.map(n => d.ok.get(n.id))) - first) * 280 : 0;
  }
  function schedule(extra) {
    clearTimeout(timer);
    if (!playing || !onScreen || document.hidden) return;
    timer = setTimeout(() => { if (step === STEPS.length - 1) shown = null; schedule(render((step + 1) % STEPS.length, true)); }, (step === STEPS.length - 1 ? 4600 : 2900) + (extra || 0));
  }
  function setPlaying(on) { playing = on; ctl.classList.toggle("paused", !on); $("#sPlay").setAttribute("aria-label", on ? "Pause the story" : "Play the story"); schedule(); }
  $("#sPrev").addEventListener("click", () => { setPlaying(false); shown = null; render((step + STEPS.length - 1) % STEPS.length, false); });
  $("#sNext").addEventListener("click", () => { setPlaying(false); if (step === STEPS.length - 1) shown = null; render((step + 1) % STEPS.length, !reduced()); });
  $("#sPlay").addEventListener("click", () => setPlaying(!playing));
  document.addEventListener("visibilitychange", () => schedule());
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { onScreen = es[0].isIntersecting; schedule(); }, { threshold: 0.2 }).observe(svg);
  render(step, false);
  setPlaying(playing);
}

// ---------------------------------------------------------------- Sprout, loaded the first time an example needs it
const files = {};
function load(src) {
  return files[src] || (files[src] = new Promise((ok, no) => {
    const s = document.createElement("script"); s.src = src; s.async = false;
    s.onload = ok; s.onerror = () => no(new Error("Couldn't load " + src.split("?")[0].split("/").pop()));
    document.head.appendChild(s);
  }));
}
let runtimeP = null;
const runtime = () => runtimeP || (runtimeP = Promise.all(["sprout3.js", "words.js", "parse.js", "stdlib.js", "libs.js", "live3.js"].map(f => load(SP + f + "?v=" + V)))
  .then(() => { if (!window.Sprout3 || !window.Sprout3Live) throw new Error("Sprout didn't start"); return { S: window.Sprout3, L: window.Sprout3Live }; })
  .catch(e => { runtimeP = null; throw e; }));
const sources = {};
const source = name => sources[name] || (sources[name] = fetch(SP + "examples/" + name + ".sp?v=" + V)
  .then(r => { if (!r.ok) throw new Error("Couldn't load " + name + ".sp"); return r.text(); })
  .catch(e => { delete sources[name]; throw e; }));
const msgOf = e => String(e && e.message || e);
const lineOf = e => e && e.line ? " (line " + e.line + ")" : "";
function setState(panel, text, state) { $(".live-state", panel).textContent = text; panel.dataset.state = state || ""; }
const watch = (el, fn, margin) => { if (!("IntersectionObserver" in window)) { fn(true); return; } new IntersectionObserver(es => fn(es[es.length - 1].isIntersecting), { rootMargin: margin || "0px" }).observe(el); };

// ---------------------------------------------------------------- games: drawn on a canvas, 360 by 480, as in the playground
const GW = 360, GH = 480, FONT = '-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,"Segoe UI",sans-serif';
let AC = null, muted = store.get("ace.sound") === "off";
function audio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === "suspended") AC.resume().catch(() => {}); }
function beep(f, d) {
  if (muted || !AC) return;
  try { const o = AC.createOscillator(), v = AC.createGain(), t = AC.currentTime; d = +d || .1; o.type = "square"; o.frequency.value = +f || 440;
    v.gain.setValueAtTime(.045, t); v.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(v).connect(AC.destination); o.start(t); o.stop(t + d + .02); } catch (e) {}
}
function soundUI() { $$(".snd").forEach(b => { b.setAttribute("aria-pressed", String(!muted)); b.title = muted ? "Sound off" : "Sound on"; }); }
$$(".snd").forEach(b => b.addEventListener("click", () => { muted = !muted; store.set("ace.sound", muted ? "off" : "on"); if (!muted) audio(); soundUI(); }));
soundUI();

function paint(ctx, list, S) {
  const col = c => typeof c === "string" ? c : S.format(c);
  for (const [name, a] of list) {
    switch (name) {
      case "clear": ctx.fillStyle = col(a[0]); ctx.fillRect(-20, -20, GW + 40, GH + 40); break;
      case "rect": ctx.fillStyle = col(a[4]); ctx.fillRect(a[0], a[1], a[2], a[3]); break;
      case "circle": if (a[2] > 0) { ctx.fillStyle = col(a[3]); ctx.beginPath(); ctx.arc(a[0], a[1], a[2], 0, Math.PI * 2); ctx.fill(); } break;
      case "line": ctx.strokeStyle = col(a[4]); ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[2], a[3]); ctx.stroke(); break;
      case "text": ctx.fillStyle = col(a[4]); ctx.font = "600 " + (+a[3] || 16) + "px " + FONT; ctx.textAlign = a[5] === "left" || a[5] === "right" ? a[5] : "center";
        ctx.textBaseline = "middle"; ctx.fillText(S.format(a[0]), a[1], a[2]); break;
    }
  }
}

const games = [];
let looping = false;
function loop(now) {
  let any = false;
  for (const G of games) if (G.visible && G.game && !G.failed) { any = true; frame(G, now); }
  if (any) requestAnimationFrame(loop); else looping = false;
}
function kick() { if (!looping) { looping = true; requestAnimationFrame(loop); } }
function frame(G, now) {
  const dt = Math.min(.05, Math.max(0, (now - G.last) / 1000)); G.last = now;
  try {
    G.game.tick(dt);
    const c = G.canvas, k = c.width / GW, x = G.ctx;
    let sx = 0, sy = 0;
    if (G.shake > .3) { sx = (Math.random() - .5) * G.shake; sy = (Math.random() - .5) * G.shake; G.shake *= Math.pow(.004, dt); } else G.shake = 0;
    x.setTransform(k, 0, 0, k, k * sx, k * sy);
    paint(x, G.game.draw(), G.S);
  } catch (e) { fail(G, e); }
}
function fail(G, e) {
  G.failed = true;
  const m = $(".screen-msg", G.panel); m.hidden = false;
  m.textContent = "This example stopped: " + msgOf(e) + lineOf(e) + ". Open it in the playground to see where.";
  setState(G.panel, "Stopped", "error");
}
function fresh(G) {
  G.game = G.L.makeGame(G.src, { W: GW, H: GH, onEffect: ([name, a]) => { if (name === "beep") beep(a[0], a[1]); else if (name === "shake") G.shake = Math.max(G.shake, +a[0] || 0); } });
  G.failed = false; G.shake = 0; G.last = performance.now();
  $(".screen-msg", G.panel).hidden = true;
}
function sizeCanvas(G) {
  const r = G.canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
  const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
  if (G.canvas.width !== w || G.canvas.height !== h) { G.canvas.width = w; G.canvas.height = h; }
}
async function start(G) {
  G.started = true;
  setState(G.panel, "Loading Sprout…", "busy");
  $(".screen-msg", G.panel).textContent = "Loading Sprout…";
  try {
    const [{ S, L }, src] = await Promise.all([runtime(), source(G.name)]);
    Object.assign(G, { S, L, src });
    fresh(G);
    $("[data-act=restart]", G.panel).disabled = false;
    setState(G.panel, G.visible ? "Live" : "Paused", G.visible ? "live" : "");
    kick();
  } catch (e) {
    // nothing ran: say so, and try again the next time it scrolls into view
    G.started = false;
    $(".screen-msg", G.panel).textContent = "Sprout couldn't load here (" + msgOf(e) + "). Try again, or open it in the playground.";
    setState(G.panel, "Couldn't start", "error");
  }
}
for (const panel of $$('.live[data-mode="game"]')) {
  const canvas = $("canvas", panel);
  const G = { panel, canvas, ctx: canvas.getContext("2d"), name: panel.dataset.ex, visible: false, started: false, game: null, shake: 0, last: 0, down: false };
  games.push(G);
  sizeCanvas(G);
  if (window.ResizeObserver) new ResizeObserver(() => sizeCanvas(G)).observe(canvas);
  const at = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * GW, (e.clientY - r.top) / r.height * GH]; };
  const send = (f) => { if (!G.game || G.failed) return; try { f(); } catch (e) { fail(G, e); } };
  canvas.addEventListener("pointerdown", e => {
    audio(); if (!G.game) return;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    G.down = true; const [x, y] = at(e); send(() => G.game.down(x, y));
  });
  canvas.addEventListener("pointermove", e => { if (!G.down) return; const [x, y] = at(e); send(() => G.game.move(x, y)); });
  const up = () => { if (!G.down) return; G.down = false; send(() => G.game.up()); };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up); canvas.addEventListener("lostpointercapture", up);
  $("[data-act=restart]", panel).addEventListener("click", () => {
    if (!G.src) return;
    try { fresh(G); setState(panel, G.visible ? "Live" : "Paused", G.visible ? "live" : ""); kick(); } catch (e) { fail(G, e); }
  });
  watch(canvas, vis => {
    G.visible = vis;
    if (vis && !G.started) start(G);
    if (G.game && !G.failed) { setState(panel, vis ? "Live" : "Paused", vis ? "live" : ""); if (vis) { G.last = performance.now(); kick(); } }
  }, "120px 0px");
}

// ---------------------------------------------------------------- programs: run in a worker, and what they print shown here
let worker = null, jobN = 0;
const jobs = new Map();
function getWorker() {
  if (worker) return worker;
  worker = new Worker("ace-worker.js?v=" + V);
  worker.onmessage = e => { const done = jobs.get(e.data.id); if (done) { jobs.delete(e.data.id); done(e.data); } };
  worker.onerror = e => {
    if (e.preventDefault) e.preventDefault();
    const r = { ok: false, lines: [], error: "Sprout couldn't start here" + (e.message ? ": " + e.message : "") };
    for (const done of jobs.values()) done(r);
    jobs.clear(); worker = null;
  };
  return worker;
}
const inWorker = msg => new Promise(res => { const id = ++jobN; jobs.set(id, res); getWorker().postMessage(Object.assign({ id }, msg)); });

// a little colour for the reports: headings, the [x] [>] [!] marks, the critical path's star and the histogram bars
const MARKS = { "[x]": "ok", "[>]": "warn", "[!]": "bad", "[ ]": "mute" };
function decorate(s) {
  if (/^== .* ==$/.test(s)) return '<span class="o-h">' + esc(s) + "</span>";
  let head = "", rest = s;
  if (MARKS[s.slice(0, 3)]) { head = '<span class="o-' + MARKS[s.slice(0, 3)] + '">' + esc(s.slice(0, 3)) + "</span>"; rest = s.slice(3); }
  else if (/^\* /.test(s)) { head = '<span class="o-bad">*</span>'; rest = s.slice(1); }
  return head + esc(rest).replace(/( )(#+)(?= |$)/, '$1<span class="o-bar">$2</span>').replace(/&lt;- this one first/, '<span class="o-warn">$&</span>').replace(/&lt; earned \d+%/, '<span class="o-ok">$&</span>');
}
const WAYS = { gpu: "on the GPU", simd: "on WebAssembly SIMD", js: "in JavaScript", collect: "one at a time" };
const secs = ms => ms < 1000 ? Math.round(ms) + " ms" : (ms / 1000).toFixed(ms < 10000 ? 2 : 1) + " s";

async function runProgram(P, clear) {
  if (P.busy) return;
  P.busy = true; P.ran = true;
  const btns = $$("[data-act]", P.panel), poster = $(".poster", P.panel), con = $(".console", P.panel), note = $(".live-note", P.panel);
  btns.forEach(b => b.disabled = true);
  setState(P.panel, P.heavy ? "Running a million times…" : clear ? "Starting over…" : "Running…", "busy");
  if (poster && !poster.hidden) poster.classList.add("busy"); else con.classList.add("busy");
  let r;
  try { r = await inWorker({ src: await source(P.name), clear: !!clear }); }
  catch (e) { r = { ok: false, lines: [], error: msgOf(e) }; }
  const out = r.lines.map(l => l.note ? '<span class="o-note">note ' + esc(l.s) + "</span>" : decorate(l.s));
  if (!r.ok) out.push('<span class="o-err">Stopped: ' + esc(r.error) + (r.line ? " (line " + r.line + ")" : "") + "</span>");
  if (poster) { poster.hidden = true; poster.classList.remove("busy"); }
  con.hidden = false; con.classList.remove("busy");
  con.innerHTML = out.join("\n") || '<span class="o-wait">It printed nothing.</span>';
  con.scrollTop = 0; con.scrollLeft = 0;
  if (r.ok) {
    setState(P.panel, "Ran in " + secs(r.ms), "done");
    const sp = (r.sporks || []).filter(x => x.n > 1);
    note.textContent = sp.length ? sp.map(x => "spork ran " + x.n.toLocaleString("en-GB") + " runs " + (WAYS[x.how] || x.how) + " in " + secs(x.ms) + ".").join(" ") + " The whole program took " + secs(r.ms) + "." : "";
    if (P.db) note.textContent = "The database is kept in this browser. Start over empties it.";
  } else { setState(P.panel, "Stopped", "error"); note.textContent = "Open it in the playground to see where it stopped."; }
  const run = $("[data-act=run]", P.panel);
  if (run && !P.db) run.textContent = "Run again";
  btns.forEach(b => b.disabled = false);
  P.busy = false;
}
for (const panel of $$('.live[data-mode="print"]')) {
  const P = { panel, name: panel.dataset.ex, heavy: panel.hasAttribute("data-heavy"), db: panel.hasAttribute("data-db"), busy: false, ran: false };
  $$("[data-act]", panel).forEach(b => b.addEventListener("click", () => runProgram(P, b.dataset.act === "clear")));
  if (panel.hasAttribute("data-auto")) watch(panel, vis => { if (vis && !P.ran) runProgram(P); }, "200px 0px");
}
})();
