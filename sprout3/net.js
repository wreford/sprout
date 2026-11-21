// Two players, no server (decision 107). Two browsers connect straight to each other with WebRTC. The details each needs
// to find the other travel as links sent by text message: an invite one way, a reply the other.
// Then the game runs in lockstep: each screen sends only its touches and keys, both run the same Sprout game frame by
// frame (a few frames behind, to hide the trip), and a seeded random source keeps their luck the same. Now and then
// they compare the state; if it ever differs, the inviter's state is sent across and both carry on from it.
// Code edits travel too, and both screens swap them in on the same frame, so two people can live-code one game.
(function () {
"use strict";
const $ = id => document.getElementById(id);
const ICE = [{ urls: "stun:stun.l.google.com:19302" }];
const STEP = 1 / 60, DELAY = 4, HASH_EVERY = 120;

// ===================================================================== invite and reply links
const b64 = bytes => { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const unb64 = s => { const t = atob(s.replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(t, c => c.charCodeAt(0)); };
async function pack(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (window.CompressionStream) { const out = await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer(); return "z" + b64(new Uint8Array(out)); }
  return "j" + b64(bytes);
}
async function unpack(s) {
  let bytes = unb64(s.slice(1));
  if (s[0] === "z") bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
  return JSON.parse(new TextDecoder().decode(bytes));
}
const pageUrl = () => location.origin + location.pathname;
function iceDone(pc, ms) { return new Promise(ok => { if (pc.iceGatheringState === "complete") return ok(); const t = setTimeout(ok, ms || 3000); pc.addEventListener("icegatheringstatechange", () => { if (pc.iceGatheringState === "complete") { clearTimeout(t); ok(); } }); }); }

// ===================================================================== values across the wire, exactly
function toWire(v) {
  if (v === null || typeof v !== "object") return typeof v === "number" && !Number.isFinite(v) ? { n: String(v) } : v;
  if (v instanceof S.Cell && v.takesInput()) return { c: S.words.sourceOf(v) };
  if (S.isCell(v)) { const f = {}; for (const k of v.fieldNames()) f[k] = toWire(v.field(k)); return { f, p: S.partsOf(v).map(toWire) }; }
  if (v.kind && typeof v.sproutText === "function") return { k: v.kind, t: S.words.sourceOf(v) };
  return String(v);
}
function fromWire(x) {
  if (x === null || typeof x !== "object") return x;
  if (x.n) return Number(x.n);
  if (x.c) return S.globals.eval.fn(x.c);
  if (x.k) return S.words.literal(x.k, x.t, 0);
  return S.valueCellOf(x.p.map(fromWire), new Map(Object.entries(x.f).map(([k, v]) => [k, fromWire(v)])));
}
const fnv = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return h >>> 0; };
const seeded = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// ===================================================================== the connection
const NET = window.NET = {
  active: false, me: 1, seed: 0, frame: 0, pc: null, dc: null, id: "", acc: 0, waiting: false,
  inputs: { 1: new Map(), 2: new Map() }, past: new Map(), queue: [], codeAt: new Map(), hashes: new Map(), theirs: new Map(), applying: false,
  gameOptions() { return this.active ? { players: 2, me: this.me, random: this.random } : {}; },
};
// the page can set its own wording (window.NET_TEXT): SilverEye's invite says SilverEye, not Sprout
const T = Object.assign({ invite: "Play my Sprout game with me:", reply: "Here's my reply, tap it to start:", game: "this game" }, window.NET_TEXT || {});
// a big message (a game's whole code) goes in pieces: Safari won't send one over about 64 KB
const PIECE = 12000;
function send(msg) {
  if (!NET.dc || NET.dc.readyState !== "open") return;
  const text = JSON.stringify(msg);
  if (text.length <= PIECE) { NET.dc.send(text); return; }
  const id = Math.random().toString(36).slice(2, 8), n = Math.ceil(text.length / PIECE);
  for (let i = 0; i < n; i++) NET.dc.send(JSON.stringify({ t: "piece", id, i, n, d: text.slice(i * PIECE, (i + 1) * PIECE) }));
}
const pieces = new Map();
function gotPiece(m) {
  const p = pieces.get(m.id) || { n: m.n, parts: [] }; pieces.set(m.id, p); p.parts[m.i] = m.d;
  if (p.parts.filter(x => x !== undefined).length === p.n) { pieces.delete(m.id); receive(JSON.parse(p.parts.join(""))); }
}
function wire(dc) {
  NET.dc = dc;
  dc.onopen = () => { if (NET.me === 1) { const seed = (Math.random() * 2 ** 31) | 0; send({ t: "start", seed, src: code }); begin(seed, code); } };
  dc.onmessage = e => { const m = JSON.parse(e.data); if (m.t === "piece") gotPiece(m); else receive(m); };
  dc.onclose = () => { if (NET.active) { NET.active = false; toast("Your friend left. You're playing alone now."); netUI(); restartAlone(); } };
}
function newPeer() {
  const pc = new RTCPeerConnection({ iceServers: ICE });
  pc.onconnectionstatechange = () => { if (pc.connectionState === "failed") { boxStatus("The phones couldn't reach each other. On the same Wi-Fi it works best; some mobile networks block direct connections."); } };
  return pc;
}
// the inviter: an offer, waiting for a reply
async function invite() {
  if (NET.pc) NET.pc.close();
  NET.me = 1; NET.id = Math.random().toString(36).slice(2, 10); NET.replied = false;
  const pc = NET.pc = newPeer(); wire(pc.createDataChannel("sprout", { ordered: true }));
  await pc.setLocalDescription(await pc.createOffer()); await iceDone(pc);
  // a short link: the game's code goes over the connection once it opens (a long link breaks in some messaging apps)
  return pageUrl() + "#join=" + await pack({ v: 1, id: NET.id, sdp: pc.localDescription.sdp, src: code.length < 3000 ? code : undefined, ex: curEx });
}
async function acceptReply(text) {
  const m = /#?answer=([\w-]+)/.exec(text || ""); if (!m || !NET.pc) return false;
  // a reply can reach this tab more than once (a message from another tab, and storage): take it only once
  if (NET.replied || NET.pc.signalingState !== "have-local-offer") return true;
  NET.replied = true;   // set at once: two copies can arrive together, before the first has finished
  try { localStorage.removeItem("sprout-net-answer"); } catch (e) {}
  const a = await unpack(m[1]).catch(() => null); if (!a || a.id !== NET.id) { NET.replied = false; boxStatus("That reply is for a different invite."); return false; }
  await NET.pc.setRemoteDescription({ type: "answer", sdp: a.sdp }); boxStatus("Connecting…"); return true;
}
// the friend: a reply to an invite
async function reply(offer) {
  if (NET.pc) NET.pc.close();
  NET.me = 2; NET.id = offer.id;
  const pc = NET.pc = newPeer(); pc.ondatachannel = e => wire(e.channel);
  await pc.setRemoteDescription({ type: "offer", sdp: offer.sdp });
  await pc.setLocalDescription(await pc.createAnswer()); await iceDone(pc);
  return pageUrl() + "#answer=" + await pack({ v: 1, id: offer.id, sdp: pc.localDescription.sdp });
}

// ===================================================================== lockstep
function begin(seed, src) {
  NET.seed = seed; NET.random = seeded(seed); NET.active = true; NET.frame = 0; NET.acc = 0;
  NET.inputs = { 1: new Map(), 2: new Map() }; NET.queue = []; NET.codeAt = new Map(); NET.hashes = new Map(); NET.theirs = new Map(); NET.checks = 0; NET.mismatches = 0; NET.past = new Map();
  for (let f = 0; f < DELAY; f++) { NET.inputs[1].set(f, { ev: [], held: [] }); NET.inputs[2].set(f, { ev: [], held: [] }); }
  if (src !== code) setCode(src);
  NET.applying = true; try { build(src, true); } finally { NET.applying = false; }
  setPaused(false); closeBox(); netUI();
  toast("Connected. You're player " + NET.me + (NET.me === 1 ? " (the first)" : " (the second)") + ".");
}
NET.input = ev => { NET.queue.push(ev); };
// held keys go across as names; a held value that isn't just true (a stick's tilt, say) goes as [name, value]
const heldOf = keys => S.valueCellOf([], new Map(keys.map(k => Array.isArray(k) ? k : [k, true])));
const heldList = held => held.fieldNames().map(k => { const v = held.field(k); return v === true ? k : [k, v]; });
NET.advance = function (dt, held) {
  if (!game) return;
  NET.acc = Math.min(NET.acc + dt, 0.25);
  let steps = 0;
  while (NET.acc >= STEP && steps < 4) {
    // this screen's input for a few frames ahead goes to both
    const ahead = NET.frame + DELAY, mine = NET.inputs[NET.me];
    if (!mine.has(ahead)) { const msg = { ev: NET.queue.splice(0), held: heldList(held) }; mine.set(ahead, msg); send({ t: "in", f: ahead, ...msg }); }
    const a = NET.inputs[1].get(NET.frame), b = NET.inputs[2].get(NET.frame);
    if (!a || !b) { NET.waiting = true; break; }
    NET.waiting = false;
    const src = NET.codeAt.get(NET.frame);
    if (src !== undefined) { NET.codeAt.delete(NET.frame); applyCode(src); }
    for (const [who, input] of [[1, a], [2, b]]) for (const e of input.ev) {
      const p = who === 2 ? 2 : undefined;
      if (e.kind === "down") game.down(e.x, e.y, p); else if (e.kind === "move") game.move(e.x, e.y, p); else game.up(p);
    }
    game.tick(STEP, heldOf(a.held), heldOf(b.held));
    // used inputs are kept a couple of seconds, in case a resync sends this screen back a few frames
    NET.past.set(NET.frame, { 1: a, 2: b }); NET.past.delete(NET.frame - 150);
    NET.inputs[1].delete(NET.frame); NET.inputs[2].delete(NET.frame);
    NET.frame++; NET.acc -= STEP; steps++;
    if (NET.frame % HASH_EVERY === 0) { const h = fnv(S.format(game.state)); NET.hashes.set(NET.frame, h); send({ t: "hash", f: NET.frame, h }); compare(NET.frame); }
  }
  netUI();
};
// both fingerprints of a frame, compared when the second arrives; if the states differ (floating point can differ
// between browsers), the inviter's state wins
function compare(f) {
  const mine = NET.hashes.get(f), theirs = NET.theirs.get(f);
  if (mine === undefined || theirs === undefined) return;
  NET.hashes.delete(f); NET.theirs.delete(f); NET.checks = (NET.checks || 0) + 1;
  if (mine !== theirs) { NET.mismatches = (NET.mismatches || 0) + 1; if (NET.me === 1) send({ t: "state", f: NET.frame, clock: game.clock, state: toWire(game.state) }); }
}
function receive(m) {
  if (m.t === "start") begin(m.seed, m.src);
  else if (m.t === "in") NET.inputs[NET.me === 1 ? 2 : 1].set(m.f, { ev: m.ev, held: m.held });
  else if (m.t === "code") { NET.codeAt.set(m.f, m.src); }
  else if (m.t === "hash") { NET.theirs.set(m.f, m.h); compare(m.f); }
  else if (m.t === "state" && NET.me === 2) {
    game.setState(fromWire(m.state), m.clock);
    for (const k of [...NET.inputs[1].keys()]) if (k < m.f) NET.inputs[1].delete(k);
    for (const k of [...NET.inputs[2].keys()]) if (k < m.f) NET.inputs[2].delete(k);
    // this screen may already be past m.f: put back the inputs it used for those frames, so they can run again
    for (let f = m.f; f < NET.frame; f++) { const used = NET.past.get(f); if (used) { if (!NET.inputs[1].has(f)) NET.inputs[1].set(f, used[1]); if (!NET.inputs[2].has(f)) NET.inputs[2].set(f, used[2]); } }
    NET.frame = m.f; NET.resyncs = (NET.resyncs || 0) + 1;
    // the frames just ahead of the jump need this screen's input too, or both screens would wait for it forever:
    // send an empty one for each that's missing (the inviter already has its own for them)
    for (let f = m.f; f < m.f + DELAY; f++) if (!NET.inputs[NET.me].has(f)) { const msg = { ev: [], held: [] }; NET.inputs[NET.me].set(f, msg); send({ t: "in", f, ...msg }); }
  }
}
// an edit goes to both screens and is swapped in on the same frame
function applyCode(src) {
  NET.applying = true;
  try { if (src !== code && document.activeElement !== ta) setCode(src); build(src, false); } finally { NET.applying = false; }
}
const baseBuild = window.build;
window.build = function (src, fresh) {
  if (!NET.active || NET.applying || !game || fresh) return baseBuild(src, fresh);
  if (src === running) return true;
  try { S.load(src); } catch (e) { setErr({ line: lineOf(e), msg: msgOf(e) }); return false; }
  const f = NET.frame + DELAY; NET.codeAt.set(f, src); send({ t: "code", f, src }); setErr(null);
  return true;
};
function restartAlone() { NET.applying = true; try { build(code, true); } finally { NET.applying = false; } }

// ===================================================================== the box that walks through it
const css = document.createElement("style");
css.textContent = `
#netBox{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.35);padding:16px}
#netBox.on{display:flex}
#netBox .in{width:min(420px,100%);background:var(--card);border-radius:18px;padding:18px 18px 16px;box-shadow:0 20px 50px rgba(0,0,0,.3);font:500 15px/1.45 var(--sans);color:var(--fg)}
#netBox h3{margin:0 0 6px;font:600 19px var(--serif, var(--sans))}
#netBox p{margin:6px 0 10px;color:var(--fg2)}
#netBox .st{font-size:13px;color:var(--fg3);min-height:18px}
#netBox .row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 4px}
#netBox button{height:40px;padding:0 16px;border-radius:999px;font:600 14px var(--sans);background:var(--card2);box-shadow:0 0 0 1px var(--line);color:var(--fg)}
#netBox button.pri{background:var(--acc);color:#fff;box-shadow:none}
#netBox textarea{width:100%;height:64px;border-radius:10px;border:1px solid var(--line);background:var(--card2);color:var(--fg);font:12px var(--mono);padding:8px;resize:none}
#netBadge{position:absolute;top:8px;left:8px;z-index:4;display:none;padding:3px 9px;border-radius:999px;background:rgba(0,0,0,.55);color:#fff;font:600 11px var(--sans);letter-spacing:.03em}
body.net #netBadge{display:block}
`;
document.head.appendChild(css);
const box = document.createElement("div"); box.id = "netBox"; box.innerHTML = '<div class="in"></div>'; document.body.appendChild(box);
const badge = document.createElement("div"); badge.id = "netBadge"; $("stage").appendChild(badge);
const inner = () => box.firstChild;
function openBox(html) { inner().innerHTML = html; box.classList.add("on"); }
function closeBox() { box.classList.remove("on"); }
function boxStatus(t) { const s = box.querySelector(".st"); if (s) s.textContent = t; else toast(t); }
box.addEventListener("pointerdown", e => { if (e.target === box) closeBox(); });
async function shareLink(link, text) {
  const message = text + " " + link;
  if (navigator.share) { try { await navigator.share({ text: message }); return "shared"; } catch (e) { if (e && e.name === "AbortError") return "cancelled"; } }
  try { await navigator.clipboard.writeText(message); toast("Copied. Paste it into a message."); return "copied"; } catch (e) { prompt("Copy this and send it:", message); return "shown"; }
}
function netUI() {
  document.body.classList.toggle("net", NET.active);
  badge.textContent = NET.active ? "Player " + NET.me + (NET.waiting ? " · waiting" : " · two players") : "";
}

// the inviter's box
async function openInvite() {
  openBox(`<h3>Play ${T.game} with a friend</h3><p>1. Send your friend the invite. 2. They tap Join and send you a reply. 3. Tap their reply (or Paste reply here) and you're in. No server: the two phones talk straight to each other.</p>
    <div class="st">Making your invite…</div><div class="row"><button class="pri" id="nSend" disabled>Send invite</button><button id="nCopy" disabled>Copy</button></div>
    <p style="margin-top:14px">Got their reply? Tap its link, or copy it and:</p>
    <div class="row"><button class="pri" id="nPasteBtn">Paste reply</button><button id="nClose">Close</button></div>
    <textarea id="nPaste" placeholder="…or paste the reply here"></textarea><div class="row"><button id="nUse">Use reply</button></div>`);
  $("nClose").onclick = closeBox;
  let link;
  try { link = await invite(); } catch (e) { boxStatus("This browser can't make a direct connection (" + (e.message || e) + ")."); return; }
  boxStatus("Your invite is ready. Keep this open (or come back to it) for their reply.");
  $("nSend").disabled = $("nCopy").disabled = false;
  $("nSend").onclick = async () => { const how = await shareLink(link, T.invite); if (how !== "cancelled") boxStatus("Invite sent. When their reply comes, tap it, or copy it and tap Paste reply."); };
  $("nCopy").onclick = async () => { try { await navigator.clipboard.writeText(link); toast("Invite copied"); } catch (e) { prompt("Copy this:", link); } };
  $("nPasteBtn").onclick = async () => {
    let text = ""; try { text = await navigator.clipboard.readText(); } catch (e) { boxStatus("Couldn't read the clipboard here: paste the reply into the box below."); $("nPaste").focus(); return; }
    if (!await acceptReply(text)) boxStatus("That isn't a reply link: copy the whole message your friend sent, then tap Paste reply.");
  };
  $("nUse").onclick = async () => { if (!await acceptReply($("nPaste").value)) boxStatus("That doesn't look like a reply link."); };
  $("nPaste").oninput = async () => { if (/answer=/.test($("nPaste").value)) await acceptReply($("nPaste").value); };
}
// a reply opened in another tab is left in this browser's storage; the tab that made the invite takes it as soon as it
// runs again (a tab in the background is often asleep, so a message to it can be missed)
const ANSWER_KEY = "sprout-net-answer";
async function takeStoredAnswer() {
  if (!NET.pc || NET.me !== 1 || NET.active) return;
  let a = null; try { a = JSON.parse(localStorage.getItem(ANSWER_KEY) || "null"); } catch (e) {}
  if (!a || a.id !== NET.id) return;
  try { localStorage.removeItem(ANSWER_KEY); } catch (e) {}
  await acceptReply("#answer=" + a.blob);
}
addEventListener("storage", e => { if (e.key === ANSWER_KEY) takeStoredAnswer(); });
addEventListener("focus", takeStoredAnswer);
document.addEventListener("visibilitychange", () => { if (!document.hidden) takeStoredAnswer(); });
setInterval(takeStoredAnswer, 1500);
// a reply opened in another tab is handed to the tab that made the invite
const channel = window.BroadcastChannel ? new BroadcastChannel("sprout-net") : null;
if (channel) channel.onmessage = async e => {
  const m = e.data || {};
  if (m.t === "answer" && NET.pc && m.id === NET.id && NET.me === 1) { await acceptReply("#answer=" + m.blob); channel.postMessage({ t: "taken", id: m.id }); }
};
async function handleHash() {
  const join = /^#join=([\w-]+)/.exec(location.hash), answer = /^#answer=([\w-]+)/.exec(location.hash);
  if (!join && !answer) return;
  history.replaceState(null, "", location.pathname);
  if (answer) {
    // this tab made the invite itself: take it here
    if (NET.pc && NET.me === 1) { await acceptReply("#answer=" + answer[1]); return; }
    const a = await unpack(answer[1]).catch(() => null);
    if (a) try { localStorage.setItem(ANSWER_KEY, JSON.stringify({ id: a.id, blob: answer[1], at: Date.now() })); } catch (e) {}
    openBox(`<h3>Reply received</h3><p>Now switch back to the tab where you sent the invite: it connects by itself as soon as it's open.</p>
      <p>Playing from your home screen? Tap Copy, open the game and tap Paste reply.</p><div class="st"></div>
      <div class="row"><button class="pri" id="nCopyReply">Copy</button><button id="nClose">Close</button></div>`);
    $("nClose").onclick = closeBox;
    $("nCopyReply").onclick = async () => { try { await navigator.clipboard.writeText(location.origin + location.pathname + "#answer=" + answer[1]); toast("Reply copied"); } catch (e) { prompt("Copy this:", location.origin + location.pathname + "#answer=" + answer[1]); } };
    if (!a) { boxStatus("That reply link is broken."); return; }
    if (channel) {
      channel.onmessage = e => { if (e.data && e.data.t === "taken" && e.data.id === a.id) boxStatus("Done: your game took it. Go back to that tab."); };
      channel.postMessage({ t: "answer", id: a.id, blob: answer[1] });
    }
    return;
  }
  const offer = await unpack(join[1]).catch(() => null);
  if (!offer) { toast("That invite link is broken"); return; }
  if (offer.src) { curEx = offer.ex || ""; dirty = true; setCode(offer.src); build(offer.src, true); }
  openBox(`<h3>You're invited</h3><p>A friend wants to play ${T.game} with you. Tap Join, send them the reply, then come back here: the game starts when they tap it.</p>
    <div class="st"></div><div class="row"><button class="pri" id="nJoin">Join</button><button id="nClose">Not now</button></div>`);
  $("nClose").onclick = closeBox;
  $("nJoin").onclick = async () => {
    boxStatus("Making your reply…"); $("nJoin").disabled = true;
    let link; try { link = await reply(offer); } catch (e) { boxStatus("This browser can't make a direct connection (" + (e.message || e) + ")."); return; }
    inner().querySelector(".row").innerHTML = '<button class="pri" id="nSend">Send reply</button><button id="nCopy">Copy</button><button id="nClose2">Close</button>';
    boxStatus("Send this back to your friend, then come back here: the game starts by itself when they tap it.");
    $("nSend").onclick = () => shareLink(link, T.reply);
    $("nCopy").onclick = async () => { try { await navigator.clipboard.writeText(link); toast("Reply copied"); } catch (e) { prompt("Copy this:", link); } };
    $("nClose2").onclick = closeBox;
  };
}
addEventListener("hashchange", handleHash);
handleHash();

NET.invite = openInvite; NET.toWire = toWire; NET.fromWire = fromWire; NET.pack = pack; NET.unpack = unpack; NET.begin = begin; NET.receive = receive;
})();
