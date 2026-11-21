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
  inputs: { 1: new Map(), 2: new Map() }, queue: [], codeAt: new Map(), hashes: new Map(), theirs: new Map(), applying: false,
  gameOptions() { return this.active ? { players: 2, me: this.me, random: this.random } : {}; },
};
function send(msg) { if (NET.dc && NET.dc.readyState === "open") NET.dc.send(JSON.stringify(msg)); }
function wire(dc) {
  NET.dc = dc;
  dc.onopen = () => { if (NET.me === 1) { const seed = (Math.random() * 2 ** 31) | 0; send({ t: "start", seed, src: code }); begin(seed, code); } };
  dc.onmessage = e => receive(JSON.parse(e.data));
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
  NET.me = 1; NET.id = Math.random().toString(36).slice(2, 10);
  const pc = NET.pc = newPeer(); wire(pc.createDataChannel("sprout", { ordered: true }));
  await pc.setLocalDescription(await pc.createOffer()); await iceDone(pc);
  return pageUrl() + "#join=" + await pack({ v: 1, id: NET.id, sdp: pc.localDescription.sdp, src: code, ex: curEx });
}
async function acceptReply(text) {
  const m = /#?answer=([\w-]+)/.exec(text || ""); if (!m || !NET.pc) return false;
  const a = await unpack(m[1]); if (a.id !== NET.id) { boxStatus("That reply is for a different invite."); return false; }
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
  NET.inputs = { 1: new Map(), 2: new Map() }; NET.queue = []; NET.codeAt = new Map(); NET.hashes = new Map(); NET.theirs = new Map(); NET.checks = 0; NET.mismatches = 0;
  for (let f = 0; f < DELAY; f++) { NET.inputs[1].set(f, { ev: [], held: [] }); NET.inputs[2].set(f, { ev: [], held: [] }); }
  if (src !== code) setCode(src);
  NET.applying = true; try { build(src, true); } finally { NET.applying = false; }
  setPaused(false); closeBox(); netUI();
  toast("Connected. You're player " + NET.me + (NET.me === 1 ? " (the first)" : " (the second)") + ".");
}
NET.input = ev => { NET.queue.push(ev); };
const heldOf = keys => S.valueCellOf([], new Map(keys.map(k => [k, true])));
NET.advance = function (dt, held) {
  if (!game) return;
  NET.acc = Math.min(NET.acc + dt, 0.25);
  let steps = 0;
  while (NET.acc >= STEP && steps < 4) {
    // this screen's input for a few frames ahead goes to both
    const ahead = NET.frame + DELAY, mine = NET.inputs[NET.me];
    if (!mine.has(ahead)) { const msg = { ev: NET.queue.splice(0), held: held.fieldNames() }; mine.set(ahead, msg); send({ t: "in", f: ahead, ...msg }); }
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
    NET.frame = m.f; NET.resyncs = (NET.resyncs || 0) + 1;
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
  openBox(`<h3>Play with a friend</h3><p>Send an invite by text. Your friend opens it and sends you a reply; tap the reply, and you're both in the same game. No server: the two phones talk straight to each other.</p>
    <div class="st">Making your invite…</div><div class="row"><button class="pri" id="nSend" disabled>Send invite</button><button id="nCopy" disabled>Copy</button></div>
    <p style="margin-top:14px">Got the reply? Tap its link, or paste it here:</p><textarea id="nPaste" placeholder="Paste the reply here"></textarea>
    <div class="row"><button id="nUse">Use reply</button><button id="nClose">Close</button></div>`);
  $("nClose").onclick = closeBox;
  let link;
  try { link = await invite(); } catch (e) { boxStatus("This browser can't make a direct connection (" + (e.message || e) + ")."); return; }
  boxStatus("Your invite is ready. It holds this game's code.");
  $("nSend").disabled = $("nCopy").disabled = false;
  $("nSend").onclick = () => shareLink(link, "Play Sprout with me:");
  $("nCopy").onclick = async () => { try { await navigator.clipboard.writeText(link); toast("Invite copied"); } catch (e) { prompt("Copy this:", link); } };
  $("nUse").onclick = async () => { if (!await acceptReply($("nPaste").value)) boxStatus("That doesn't look like a reply link."); };
  $("nPaste").oninput = async () => { if (/answer=/.test($("nPaste").value)) await acceptReply($("nPaste").value); };
}
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
    openBox(`<h3>Reply received</h3><p>Sending it to your game in the other tab…</p><div class="st"></div><div class="row"><button id="nClose">Close</button></div>`);
    $("nClose").onclick = closeBox;
    if (!channel || !a) { boxStatus("Open the game tab and paste this reply there."); return; }
    let taken = false;
    channel.onmessage = e => { if (e.data && e.data.t === "taken" && e.data.id === a.id) { taken = true; boxStatus("Done. Go back to the other tab: the game starts there."); } };
    channel.postMessage({ t: "answer", id: a.id, blob: answer[1] });
    setTimeout(() => { if (!taken) boxStatus("The game tab didn't answer. Go back to it and paste the reply into Play with a friend."); }, 2500);
    return;
  }
  const offer = await unpack(join[1]).catch(() => null);
  if (!offer) { toast("That invite link is broken"); return; }
  curEx = offer.ex || ""; dirty = true; setCode(offer.src); build(offer.src, true);
  openBox(`<h3>You're invited</h3><p>A friend wants to play this game with you. Join, then send them the reply. The game starts when they tap it.</p>
    <div class="st"></div><div class="row"><button class="pri" id="nJoin">Join</button><button id="nClose">Not now</button></div>`);
  $("nClose").onclick = closeBox;
  $("nJoin").onclick = async () => {
    boxStatus("Making your reply…"); $("nJoin").disabled = true;
    let link; try { link = await reply(offer); } catch (e) { boxStatus("This browser can't make a direct connection (" + (e.message || e) + ")."); return; }
    inner().querySelector(".row").innerHTML = '<button class="pri" id="nSend">Send reply</button><button id="nCopy">Copy</button><button id="nClose2">Close</button>';
    boxStatus("Send this back to your friend. When they tap it, you're connected.");
    $("nSend").onclick = () => shareLink(link, "Here's my reply, tap it to start:");
    $("nCopy").onclick = async () => { try { await navigator.clipboard.writeText(link); toast("Reply copied"); } catch (e) { prompt("Copy this:", link); } };
    $("nClose2").onclick = closeBox;
  };
}
addEventListener("hashchange", handleHash);
handleHash();

NET.invite = openInvite; NET.toWire = toWire; NET.fromWire = fromWire; NET.pack = pack; NET.unpack = unpack; NET.begin = begin; NET.receive = receive;
})();
