// Blade Beach '90: a bot rides all three stretches (jumping, kicking, grinding, grabbing tapes), beats the roller-derby
// giant and starts the second lap, all without a message
module.exports = ({ S, L, fs, ok, logs, held, quiet }) => {
  const restore = quiet("zzfx", ["preset", "play"]);
  logs.length = 0;
  const g = L.makeGame(fs.readFileSync(__dirname + "/../examples/blade-beach.sp", "utf8"), { W: 256, H: 192, host: { saved: S.valueCellOf([], new Map()) }, onEffect: () => {} });
  const st = k => g.state.field(k), legs = S.partsOf(g.file.field("legs")).map(l => l.field("plan"));
  let holdOne = 0, grinded = false, tapes = 0, kicks = 0, reachedBoss = false, t = 0;
  const step = keys => { g.tick(1 / 60, held(keys)); t++; };
  while (t < 60 * 240 && !(st("mode") === "ride" && st("lap") === 2) && st("mode") !== "over") {
    const mode = st("mode");
    if (mode === "title") { step(["one"]); step([]); continue; }
    if (mode === "cleared") { step([]); continue; }
    const keys = [];
    if (mode === "ride") {
      const plan = legs[st("leg") - 1], at = st("at"), lift = st("lift"), k = Math.floor(at / 32) + 1;
      if (st("grinding")) grinded = true;
      for (let n = k; n <= k + 4 && n <= plan.length; n++) {
        const c = plan[n - 1], centre = (n - 0.5) * 32, d = centre - at;
        if ((c === "h" || c === "b") && d > 14 && d < 32 && lift === 0 && !holdOne) holdOne = 5;
        if (c === "_" && plan[n - 2] !== "_" && (n - 1) * 32 - at > 0 && (n - 1) * 32 - at < 22 && lift === 0 && !holdOne) holdOne = 24;
        if (c === "r" && plan[n - 2] !== "r" && d > 30 && d < 42 && lift === 0 && !holdOne) holdOne = 3;
        if (c === "p") { const px = centre - 0.4 * Math.max(0, 220 - (centre - at)); if (px - at > 4 && px - at < 30 && t % 2 === 0) keys.push("two"); }
      }
      if (holdOne > 0) { keys.push("one"); holdOne--; }
    } else if (mode === "boss") {
      if (!reachedBoss) reachedBoss = true;
      const b = st("boss"), bx = st("bx"), gap = b.field("x") - bx, state = b.field("state");
      if (state === "charge") {
        if (Math.abs(gap) < 64 && gap * b.field("dir") < 0 && st("lift") === 0 && !holdOne) holdOne = 22;
        if (Math.abs(gap) > 90) keys.push(gap > 0 ? "left" : "right");
      } else if (state === "wait") {
        if (Math.abs(gap) < 80) keys.push(gap > 0 ? "left" : "right");
      } else if (state === "dizzy") {
        if (Math.abs(gap) > 24) keys.push(gap > 0 ? "right" : "left");
        else if (t % 2 === 0) keys.push("two");
      }
      if (holdOne > 0) { keys.push("one"); holdOne--; }
    }
    step(keys);
    if (st("sfx") === "tape") tapes++;
    if (st("sfx") === "hit") kicks++;
  }
  ok("blade beach: a bot rides the beach, the pier and the neon strip to the giant", reachedBoss, [st("mode"), st("leg"), Math.round(st("at")), st("lives")]);
  ok("blade beach: the bot beats the giant and rolls into a faster second lap", st("mode") === "ride" && st("lap") === 2, [st("mode"), st("lap"), st("lives")]);
  ok("blade beach: it grinds a rail, grabs tapes and kicks gang skaters on the way", grinded && tapes > 3 && kicks > 3, [grinded, tapes, kicks]);
  ok("blade beach: the ride says nothing", logs.length === 0, logs.slice(0, 3));
  restore();
};
