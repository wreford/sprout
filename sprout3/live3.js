// Sprout 3 game layer: the built-in event loop (decisions 11, 34), queued effects (33),
// recorded outside reads (54), rewind as a list of states (12), hot-swap over the new start (49, 53).
(function (root) {
"use strict";
const S = root.Sprout3 || require("./sprout3.js");
const { ValueCell, Native, isCell, equal, UNSET } = S;

const ev = fields => S.valueCellOf([], new Map(Object.entries(fields)));
const NOKEYS = new ValueCell([]);
// the 3D words (decision 108) are drawing words too: a page that can show 3D draws them, the 2D ones on top
const DRAW = { clear: 1, rect: 5, circle: 4, line: 5, text: 5, view: 6, block: 7, model: 8, hold: 7, flash: 5, fog: 3 };
const SOUND = { beep: 2, shake: 1, sound: 1 };

function makeGame(src, opts) {
  opts = opts || {};
  const draws = [];
  const argsOf = (a, n) => n === 1 ? [a] : (isCell(a) ? S.partsOf(a) : [a]);
  // host words: drawing happens in draw; sound and shake are effects, queued during update
  // me: which player this screen shows (decision 107); 1 when playing alone. Only draw should read it.
  const host = { W: opts.W || 360, H: opts.H || 480, me: opts.me || 1 };
  for (const name in DRAW) {
    host[name] = new Native(name, a => { draws.push([name, argsOf(a, DRAW[name])]); return false; }, true);
    // the same word with its values given one by one, for column loops: no argument cell per shape
    const n = DRAW[name];
    host[name].direct = n === 1 ? (a) => { draws.push([name, [a]]); return false; } : n === 4 ? (a, b, c, d) => { draws.push([name, [a, b, c, d]]); return false; }
      : (a, b, c, d, e) => { draws.push([name, [a, b, c, d, e]]); return false; };
  }
  for (const name in SOUND) host[name] = new Native(name, a => S.effect(() => opts.onEffect && opts.onEffect([name, argsOf(a, SOUND[name])])), true);
  Object.assign(host, opts.host || {});
  if (opts.onPrint) S.setOut(opts.onPrint);

  // outside reads: the random numbers a tick used are recorded, and played back on replay (decision 54)
  let rec = null, replay = null;
  // the random numbers come from the page (two players share a seeded source), else Math.random
  let randomSource = opts.random || Math.random;
  // every game made sets this as the random source, so each tick sets it again: a page that makes other games
  // (cover art, say) must not leave this one drawing from theirs
  const drawRandom = () => replay ? (replay.length ? replay.shift() : 0) : (r => (rec && rec.push(r), r))(randomSource());
  S.setRandom(drawRandom);

  let file, handler, state, clock = 0;
  const history = [];
  function wire(f) {
    const upd = f.field("update"); if (upd === UNSET) throw new Error("the game needs an update field");
    handler = S.globals.frame.run(upd); // frame update: events in, states out (decision 34)
    file = f;
  }
  wire(S.load(src, { host }));
  state = file.field("start"); if (state === UNSET) throw new Error("the game needs a start field");
  const send = e => { state = handler.run(new ValueCell([state, e])); };

  // one tick: update runs with effects queued; they are carried out once it returns (unless replaying)
  function tick(dt, held, replayRnd, held2) {
    rec = replayRnd ? null : []; replay = replayRnd ? replayRnd.slice() : null;
    S.setRandom(drawRandom);
    S.queueEffects();
    // two players (decision 107): the tick carries player 2's held keys too, and the frame keeps input2
    send(ev(opts.players === 2 ? { kind: "tick", dt, clock: clock + dt, held: held || NOKEYS, held2: held2 || NOKEYS, players: 2 } : { kind: "tick", dt, clock: clock + dt, held: held || NOKEYS }));
    if (replayRnd) S.dropEffects(); else S.runEffects();
    clock += dt;
    if (!replayRnd) { history.push({ state, rnd: rec, clock, dt, held, held2 }); if (history.length > (opts.keep || 600)) history.shift(); }
    rec = replay = null;
  }

  const api = {
    get state() { return state; }, history,
    // the program itself (its top-level names), for an editor that shows their values
    get file() { return file; },
    // which collect, keep and each bodies can run over columns, from the compiler (decision 86)
    get speedNotes() { return file.speedNotes || []; },
    // a touch from player 2 says so (decision 107); player 1's are as they always were
    down(x, y, player) { send(ev(player === 2 ? { kind: "down", x, y, player } : { kind: "down", x, y })); },
    move(x, y, player) { send(ev(player === 2 ? { kind: "move", x, y, player } : { kind: "move", x, y })); },
    up(player) { send(ev(player === 2 ? { kind: "up", player } : { kind: "up" })); },
    tick(dt, held, held2) { tick(dt, held, null, held2); return api; },
    get clock() { return clock; },
    // the state put in place, as when two screens agree to the first one's state again
    setState(v, c) { state = v; if (typeof c === "number") clock = c; },
    setRandom(f) { randomSource = f || Math.random; },
    draw() { draws.length = 0; const d = file.field("draw"); if (d !== UNSET) d.run(state); return draws; },
    // rewind: a saved frame is just the state it held, since cells never change
    rewind(i) { state = history[i].state; clock = history[i].clock; },
    // replay the tick after frame i with the random numbers it used: it comes out the same, with no effects
    replayFrom(i) { const h = history[i], next = history[i + 1]; state = h.state; clock = h.clock; tick(next.dt, next.held, next.rnd, next.held2); return state; },
    // hot-swap: build the new file; keep live values whose starting value didn't change
    swap(newSrc) {
      const nf = S.load(newSrc, { host }), oldStart = file.field("start"), newStart = nf.field("start");
      const out = S.fieldsOf(state);
      for (const [k, v] of S.fieldsOf(newStart)) { const was = oldStart.field(k); if (was === UNSET || !equal(was, v)) out.set(k, v); }
      wire(nf); state = S.valueCellOf([], out);
    },
  };
  return api;
}

const api = { makeGame };
if (typeof module !== "undefined") module.exports = api; else root.Sprout3Live = api;
})(typeof window !== "undefined" ? window : globalThis);
