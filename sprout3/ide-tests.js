// Browser tests for Greenhouse, Sprout's experimental IDE (decision 146): node ide-tests.js [shots-dir], where Playwright
// and Chromium are installed. It serves the site from the repository's root, opens the lab, and uses it the way a
// person would: drags a number, inspects a live value and sends it a message, pauses and scrubs back in time and edits
// there, picks a shape on the stage, forks a what-if, reads the tree, opens an 8-bit game. Any page error fails it.
const fs = require("fs"), path = require("path");
let chromium, devices;
try { ({ chromium, devices } = require("playwright")); } catch (e) { console.log("ide tests skipped: Playwright isn't installed"); process.exit(0); }
const ROOT = path.join(__dirname, ".."), SHOTS = process.argv[2] || "";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".sp": "text/plain", ".json": "application/json", ".woff2": "font/woff2", ".png": "image/png" };
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log("FAIL", name, extra === undefined ? "" : JSON.stringify(extra)); } };
const serve = page => page.route("http://lab.test/**", route => {
  let rel = decodeURIComponent(new URL(route.request().url()).pathname); if (rel.endsWith("/")) rel += "index.html";
  const file = path.join(ROOT, rel); if (!file.startsWith(ROOT) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: "" });
  route.fulfill({ status: 200, body: fs.readFileSync(file), contentType: TYPES[path.extname(file)] || "application/octet-stream" });
});
(async () => {
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 860 } }), page = await ctx.newPage(), errors = [];
    page.on("pageerror", e => errors.push(e.message)); page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    await serve(page);
    await page.goto("http://lab.test/sprout3/ide.html#leap");
    await page.waitForFunction(() => window.Greenhouse && Greenhouse.game && Greenhouse.game.history.length > 30, null, { timeout: 15000 });
    const lit = await page.evaluate(() => { const c = document.getElementById("cv"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 16) if (d[i] + d[i + 1] + d[i + 2] > 60) n++; return n; });
    ok("Leap runs beside its code, drawn on the stage", lit > 500, lit);

    // a number dragged: gravity's 900 goes up, and the running game has it
    const num = await page.$('#ovNums .num[data-l="2"]'), box = await num.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    for (let i = 1; i <= 8; i++) await page.mouse.move(box.x + box.width / 2 + i * 6, box.y + box.height / 2);
    await page.mouse.up(); await page.waitForTimeout(300);
    const g2 = await page.evaluate(() => [Sprout3.format(Greenhouse.game.file.field("gravity")), Greenhouse.code.split("\n")[2]]);
    ok("dragging a number changes it in the code and in the running game, which keeps its state", +g2[0] > 900 && g2[1] === "gravity : " + g2[0] && await page.evaluate(() => Sprout3.format(Greenhouse.game.state.field("hops")) !== "0"), g2);

    // a live value at the end of a line, inspected, and sent a message
    await page.waitForSelector("#ovVals .ghost.live", { timeout: 5000 });
    await page.click('#ovVals .ghost[data-g="s:hops"]');
    const kind = await page.textContent("#iKind"), msgs = await page.$$eval("#iMsgs button", bs => bs.map(b => b.textContent));
    ok("a live value opens the inspector: its kind and the messages it understands", kind === "number" && msgs.includes("succ") && msgs.includes("between"), [kind, msgs.length]);
    await page.fill("#send", "* 10"); await page.press("#send", "Enter");
    ok("the inspector sends it a message and shows the answer", /^→ \d+/.test(await page.textContent("#answer")), await page.textContent("#answer"));
    await page.click('#ovVals .ghost[data-g="t:floor"]');
    ok("a top-level name's value inspects too", (await page.textContent("#iKind")) === "number" && (await page.textContent("#iVal")) === "390");

    // time: pause, scrub back a second, edit there: the recorded future is played again with the new code
    await page.waitForFunction(() => Greenhouse.game.history.length > 200, null, { timeout: 15000 });
    await page.click("#bPlay"); await page.waitForTimeout(100);
    const back = await page.evaluate(() => { const n = Greenhouse.game.history.length; const i = n - 90; const t = document.getElementById("time"); t.value = i; t.dispatchEvent(new Event("input")); return i; });
    const before = await page.evaluate(i => Sprout3.format(Greenhouse.game.history[i + 60].state.field("y")), back);
    const seen = await page.evaluate(() => [Greenhouse.idx, document.getElementById("time").max, document.getElementById("time").value, Greenhouse.game.history.length, document.body.className]);
    ok("scrubbing back shows that moment", seen[0] === back && seen[4].includes("past"), [back, seen]);
    await page.evaluate(() => Greenhouse.setCode(Greenhouse.code.replace(/^leap : \d+/m, "leap : 640")));
    await page.waitForTimeout(250);
    const after = await page.evaluate(i => Sprout3.format(Greenhouse.game.history[i + 60].state.field("y")), back);
    ok("an edit in the past plays the future again with the new code (a higher leap)", after !== before && (await page.evaluate(() => Greenhouse.idx)) === back, [before, after]);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "ide-time.png") });
    await page.click("#bHere"); await page.waitForTimeout(200);
    ok("play from here carries on from that moment", (await page.evaluate(() => Greenhouse.idx)) === -1 && !(await page.evaluate(() => document.body.classList.contains("past"))));

    // pick: the shape under a click, and the line that drew it
    await page.evaluate(() => Greenhouse.togglePick());
    const spot = await page.evaluate(() => { const c = document.getElementById("cv"), r = c.getBoundingClientRect(); return [r.left + 300 / Greenhouse.W * r.width, r.top + 70 / Greenhouse.H * r.height]; });
    await page.mouse.click(spot[0], spot[1]);
    const pk = await page.evaluate(() => Greenhouse.picked && Greenhouse.picked.name), best = await page.textContent("#pickIn .cand.best").catch(() => "");
    ok("picking the sun finds its circle and the line that drew it", pk === "circle" && /circle \[300, 70, 26/.test(best), [pk, best]);
    await page.evaluate(() => Greenhouse.togglePick()); await page.click("#bHere").catch(() => {}); await page.evaluate(() => Greenhouse.playFromHere());

    // the tree follows the program
    await page.click('#tabs button[data-t="tree"]');
    ok("the tree shows the program's top-level names", (await page.textContent("#treeIn")).includes("update") && (await page.textContent("#treeIn")).includes("gravity"));
    await page.click("#bLick");
    ok("and as a lick outline", (await page.textContent("#lickOut")).split("\n").some(l => /^ {2}\S/.test(l)));

    // what if: the code as it was runs on beside the edits, from the same moment
    await page.evaluate(() => Greenhouse.toggleFork());
    await page.evaluate(() => Greenhouse.setCode(Greenhouse.code.replace(/^speed : \d+/m, "speed : 260")));
    await page.waitForTimeout(900);
    const xs = await page.evaluate(() => [Sprout3.format(Greenhouse.game.state.field("x")), Sprout3.format(Greenhouse.fork.state.field("x"))]);
    ok("the what-if fork runs the code as it was beside the code as it is", !(await page.$eval("#forkStage", e => e.hidden)) && xs[0] !== xs[1], xs);
    await page.click('#tabs button[data-t="signals"]'); await page.waitForTimeout(400);
    ok("signals graph the state's numbers over time", (await page.$$("#sigIn .sig")).length >= 3);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "ide-desk.png") });
    await page.evaluate(() => Greenhouse.toggleFork());

    // a broken edit is shown gently and the game keeps running the last good version
    const clock0 = await page.evaluate(() => Greenhouse.game.clock);
    await page.evaluate(() => Greenhouse.setCode(Greenhouse.code + '\noops : "never closed'));
    await page.waitForTimeout(400);
    ok("a broken edit is shown in place, and the program keeps running", (await page.$eval("#errBar", e => e.classList.contains("on"))) && (await page.evaluate(() => Greenhouse.game.clock)) > clock0);

    // an 8-bit game from the console, its sprites and map drawn
    await page.selectOption("#prog", "crate-cove");
    await page.waitForFunction(() => Greenhouse.game && Greenhouse.W === 256 && Greenhouse.lastList.length > 3, null, { timeout: 15000 });
    await page.keyboard.press("z"); await page.waitForTimeout(500);
    ok("an 8-bit game opens on its own 256 by 192 screen", await page.evaluate(() => Greenhouse.lastList.some(d => d[0] === "sprite" || d[0] === "tiles")));
    ok("no errors on the page", errors.length === 0, errors.slice(0, 5));

    // a phone
    const phone = await browser.newContext(devices["iPhone 13"]), pp = await phone.newPage(), perr = [];
    pp.on("pageerror", e => perr.push(e.message)); await serve(pp);
    await pp.goto("http://lab.test/sprout3/ide.html#leap"); await pp.waitForFunction(() => window.Greenhouse && Greenhouse.game, null, { timeout: 15000 }); await pp.waitForTimeout(800);
    const fits = await pp.evaluate(() => document.getElementById("cv").getBoundingClientRect().right <= innerWidth + 1);
    ok("on a phone the stage fits, with no errors", fits && perr.length === 0, perr);
    if (SHOTS) await pp.screenshot({ path: path.join(SHOTS, "ide-phone.png") });
    await phone.close(); await ctx.close();
  } catch (e) { fail++; console.log("FAIL the ide tests stopped:", e.message); }
  await browser.close();
  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
