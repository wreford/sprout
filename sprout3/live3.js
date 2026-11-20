// Sprout 3 game layer: the built-in event loop (decisions 11, 34), queued effects (33),
// recorded outside reads (54), rewind as a list of states (12), hot-swap over the new start (49, 53).
(function (root) {
"use strict";
const S = root.Sprout3 || require("./sprout3.js");
const { VCell, Native, isCell, eq, UNSET } = S;

const ev = fields => S.VFM([], new Map(Object.entries(fields)));
const NOKEYS = new VCell([]);
const DRAW = { clear: 1, rect: 5, circle: 4, line: 5, text: 5 };
const SOUND = { beep: 2, shake: 1 };

function makeGame(src, opts) {
  opts = opts || {};
  const draws = [];
  const argsOf = (a, n) => n === 1 ? [a] : (isCell(a) ? S.partsOf(a) : [a]);
  // host words: drawing happens in draw; sound and shake are effects, queued during update
  const host = { W: opts.W || 360, H: opts.H || 480 };
  for (const name in DRAW) host[name] = new Native(name, a => { draws.push([name, argsOf(a, DRAW[name])]); return false; }, true);
  for (const name in SOUND) host[name] = new Native(name, a => S.effect(() => opts.onEffect && opts.onEffect([name, argsOf(a, SOUND[name])])), true);
  Object.assign(host, opts.host || {});
  if (opts.onPrint) S.setOut(opts.onPrint);

  // outside reads: the random numbers a tick used are recorded, and played back on replay (decision 54)
  let rec = null, replay = null;
  S.setRandom(() => replay ? (replay.length ? replay.shift() : 0) : (r => (rec && rec.push(r), r))(Math.random()));

  let file, handler, state, clock = 0;
  const history = [];
  function wire(f) {
    const upd = f.field("update"); if (upd === UNSET) throw new Error("the game needs an update field");
    handler = S.G.frame.run(upd); // frame update: events in, states out (decision 34)
    file = f;
  }
  wire(S.load(src, { host }));
  state = file.field("start"); if (state === UNSET) throw new Error("the game needs a start field");
  const send = e => { state = handler.run(new VCell([state, e])); };

  // one tick: update runs with effects queued; they are carried out once it returns (unless replaying)
  function tick(dt, held, replayRnd) {
    rec = replayRnd ? null : []; replay = replayRnd ? replayRnd.slice() : null;
    S.queueEffects();
    send(ev({ kind: "tick", dt, clock: clock + dt, held: held || NOKEYS }));
    if (replayRnd) S.dropEffects(); else S.runEffects();
    clock += dt;
    if (!replayRnd) { history.push({ state, rnd: rec, clock, dt, held }); if (history.length > (opts.keep || 600)) history.shift(); }
    rec = replay = null;
  }

  const api = {
    get state() { return state; }, history,
    // which collect, keep and each bodies can run over columns, from the compiler (decision 86)
    get speed() { return file.speed || []; },
    down(x, y) { send(ev({ kind: "down", x, y })); },
    move(x, y) { send(ev({ kind: "move", x, y })); },
    up() { send(ev({ kind: "up" })); },
    tick(dt, held) { tick(dt, held); return api; },
    draw() { draws.length = 0; const d = file.field("draw"); if (d !== UNSET) d.run(state); return draws; },
    // rewind: a saved frame is just the state it held, since cells never change
    rewind(i) { state = history[i].state; clock = history[i].clock; },
    // replay the tick after frame i with the random numbers it used: it comes out the same, with no effects
    replayFrom(i) { const h = history[i], next = history[i + 1]; state = h.state; clock = h.clock; tick(next.dt, next.held, next.rnd); return state; },
    // hot-swap: build the new file; keep live values whose starting value didn't change
    swap(newSrc) {
      const nf = S.load(newSrc, { host }), oldStart = file.field("start"), newStart = nf.field("start");
      const out = S.fieldsOf(state);
      for (const [k, v] of S.fieldsOf(newStart)) { const was = oldStart.field(k); if (was === UNSET || !eq(was, v)) out.set(k, v); }
      wire(nf); state = S.VFM([], out);
    },
  };
  return api;
}

const api = { makeGame };
if (typeof module !== "undefined") module.exports = api; else root.Sprout3Live = api;
})(typeof window !== "undefined" ? window : globalThis);
