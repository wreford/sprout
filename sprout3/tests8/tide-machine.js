// Tide Machine (16-bit): the reels module's rules in the game, a bot that keeps the light for several tides and buys
// charms from the gull, and the game says nothing while it plays
module.exports = ({ S, L, fs, ok, logs, held, quiet, dir }) => {
  const restore = quiet("zzfx", ["preset", "play"]);
  logs.length = 0;
  const src = fs.readFileSync(dir + "/examples/tide-machine.sp", "utf8") +
    '\nrow-check : reels wins [[["pearl", "pearl", "pearl", "fish", "shell"], ["shell", "fish", "anchor", "fish", "shell"], ["fish", "shell", "anchor", "shell", "fish"]], paylines, 3]' +
    '\npay-check : row-check collect [w | win-pay [w, ["PEARL DIVER"], "shell"]] sum\nstar-check : win-pay [row-check @ 1, ["LUCKY STAR"], "pearl"]\n';
  const g = L.makeGame(src, { W: 320, H: 224, host: { saved: S.valueCellOf([], new Map()) }, onEffect: () => {} });
  const wins = S.partsOf(g.file.field("row-check"));
  ok("tide machine: three pearls along the top row are one win on the fourteen paylines", wins.length === 1 && wins[0].field("symbol") === "pearl" && wins[0].field("alike") === 3, S.format(g.file.field("row-check")));
  ok("tide machine: the pearl diver doubles pearls (14 to 28), and the lucky star makes the lucky one pay three times", g.file.field("pay-check") === 28 && g.file.field("star-check") === 42, [g.file.field("pay-check"), g.file.field("star-check")]);
  const st = k => g.state.field(k), tap = k => { g.tick(1 / 60, held([k])); g.tick(1 / 60, held([])); };
  for (let t = 0; t < 20; t++) g.tick(1 / 60, held([]));
  tap("one");
  ok("tide machine: button 1 lights the lamp and starts the first tide with six pulls", st("mode") === "tide" && st("spins") === 6 && st("coins") === 5);
  let bought = 0, mostTide = 1, pulls = 0, sawStop = false;
  for (let i = 0; i < 20000 && st("mode") !== "dark"; i++) {
    const mode = st("mode");
    if (mode === "tide") {
      if (st("rolling")) { g.tick(1 / 60, held([])); if (st("rolling")) sawStop = sawStop || g.draw().length > 0; else pulls++; }
      else tap("one");
    } else if (mode === "shop") { const before = S.partsOf(st("charms")).length; tap("one"); bought += S.partsOf(st("charms")).length - before; tap("two"); }
    else g.tick(1 / 60, held([]));
    mostTide = Math.max(mostTide, st("tide"));
  }
  ok("tide machine: a bot that always pulls keeps the light for two tides or more, buying a charm from the gull", st("kept") >= 2 && bought >= 1 && pulls >= 12, [st("kept"), bought, pulls]);
  ok("tide machine: the light goes out in the end, and the best is kept", st("mode") === "dark" && st("best") >= st("kept") && st("keep").field("best") === st("best"));
  ok("tide machine: plays without a message", logs.length === 0 && sawStop, logs.slice(0, 3));
  restore();
};
