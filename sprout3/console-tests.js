// Browser tests for SilverEye on the POCKET64 page (/silvereye/): run with `node console-tests.js` where Playwright and
// Chromium are installed. It serves the site from the repository root on a spare port, opens the console at phone size,
// and plays it with the stick and buttons the way a person would. Any error on the page fails it.
const http = require("http"), fs = require("fs"), path = require("path");
let chromium, devices;
try { ({ chromium, devices } = require("playwright")); } catch (e) { console.log("console tests skipped: Playwright isn't installed"); process.exit(0); }

const ROOT = path.join(__dirname, ".."), TYPES = { ".html": "text/html", ".js": "text/javascript", ".sp": "text/plain", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".ogg": "audio/ogg", ".webmanifest": "application/manifest+json", ".css": "text/css", ".wasm": "application/wasm" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" }); fs.createReadStream(file).pipe(res);
});

let pass = 0, fail = 0;
const ok = (name, cond, detail) => { if (cond) pass++; else { fail++; console.log("FAIL", name, detail === undefined ? "" : JSON.stringify(detail)); } };

server.listen(0, async () => {
  const url = "http://localhost:" + server.address().port + "/silvereye/";
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  try {
    const page = await (await browser.newContext(devices["iPhone 13"])).newPage(), errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(url); await page.waitForSelector("#boot", { timeout: 5000 }).catch(() => {});
    ok("the console switches on with its POCKET64 screen", await page.isVisible("#boot"));
    await page.waitForTimeout(2600);
    ok("the title waits on PRESS START", await page.isVisible("#pressStart") && !(await page.isVisible("#titleMenu")));
    await page.click("#title"); await page.waitForTimeout(150);
    ok("then the title, with the modes", (await page.$$eval("#titleMenu button", bs => bs.map(b => b.dataset.do))).join() === "campaign,sim,duel,agent,settings,program,help");
    await page.click("#titleMenu button[data-do=help]"); await page.click("#help button[data-do=about]");
    ok("About (under How to play) credits the games that inspired it", /GoldenEye 007/.test(await page.textContent("#about")) && /Perfect Dark/.test(await page.textContent("#about")) && /none of their work/.test(await page.textContent("#about")));
    await page.click("#about button[data-do=back]"); await page.click("#help button[data-do=back]");
    // the character creator: step to the next look, spell a codename on the letter grid, and both go with your controls
    await page.click("#titleMenu button[data-do=agent]"); await page.click("#agentMenu button[data-do=look-next]");
    await page.click("#agentMenu button[data-do=codename]");
    for (const ch of "ACE") await page.click("#letterGrid button:text-is('" + ch + "')");
    await page.click("#letterGrid button:text-is('OK')");
    ok("the creator picks a look and a codename", (await page.textContent("#lookName")) === "COMMANDO" && (await page.textContent("#codeName")) === "ACE");
    ok("your look and codename are kept for next time", await page.evaluate(() => JSON.parse(localStorage.getItem("silvereye.agent")).look === 9 && JSON.parse(localStorage.getItem("silvereye.agent")).name === "ACE"));
    await page.click("#agentMenu button[data-do=back]"); await page.click("#titleMenu button[data-do=settings]");
    const fov = await page.textContent("#vFov"); await page.click("#settingsMenu button[data-do=fov]");
    ok("Settings change the view", (await page.textContent("#vFov")) !== fov);
    ok("the picture starts in the n64 style: soft textures and soft video", (await page.textContent("#vDisplay")) === "n64" && await page.evaluate(() => document.body.classList.contains("soft")));
    // gyro aim: on, turning the phone right (clockwise from above) turns you right
    await page.click("#settingsMenu button[data-do=gyro]"); await page.click("#settingsMenu button[data-do=gyro]");
    ok("Gyro aim can be turned on", (await page.textContent("#vGyro")) === "always");
    await page.click("#settingsMenu button[data-do=gyro]");
        await page.click("#settingsMenu button[data-do=back]");
    await page.click("#titleMenu button[data-do=campaign]"); await page.click("#missionMenu button[data-do=stage1]"); await page.waitForTimeout(300);
    const at = () => page.evaluate(() => { const a = game.state.field("agents").part(1); return { x: a.field("x"), shots: a.field("shots-fired") }; });
    const before = await at();
    const zone = await (await page.$("#stickZone")).boundingBox();
    await page.mouse.move(zone.x + zone.width / 2, zone.y + zone.height / 2); await page.mouse.down();
    await page.mouse.move(zone.x + zone.width / 2, zone.y + zone.height / 2 - 40, { steps: 3 }); await page.waitForTimeout(600); await page.mouse.up();
    ok("the stick walks you", (await at()).x > before.x + 0.3, await at());
    // (the phone's motion goes straight to the handler here: whether a browser lets a page have it is up to the browser)
    const turned = await page.evaluate(() => { settings.gyro = "always"; const before = pad.look;
      onMotion(new DeviceMotionEvent("devicemotion", { rotationRate: { alpha: 0, beta: 0, gamma: -90 }, accelerationIncludingGravity: { x: 0, y: -9.8, z: 0 }, interval: 16 }));
      const after = pad.look; settings.gyro = "off"; return after - before; });
    ok("with gyro aim on, turning the phone right turns you right", turned > 0.01 && turned < 0.2, turned);
    const aimTest = await page.evaluate(() => { const look0 = pad.look; pad.zoom = true; aimBy(0.1, 0.05); const r = { yaw: pad.aimYaw, pitch: pad.aimPitch, turned: pad.look - look0 }; aimBy(5, 0); r.pushed = pad.look - look0; pad.zoom = false; held(); r.back = pad.aimYaw; return r; });
    ok("aim mode: a drag moves the sight and not the view, the edge pushes the view round, and letting go brings the sight back", aimTest.yaw > 0.09 && aimTest.pitch > 0.04 && aimTest.turned === 0 && aimTest.pushed > 1 && aimTest.back === 0, aimTest);
    ok("you play as the agent you made", await page.evaluate(() => { const a = game.state.field("agents").part(1); return a.field("skin") === 9 && a.field("tag") === "ACE"; }));
    const a = await (await page.$("#bA")).boundingBox();
    // software 3D draws few frames a second here, and each frame is at most 0.05 s of game time, so hold A a while
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down(); await page.waitForFunction(() => game.state.field("agents").part(1).field("shots-fired") >= 2, null, { timeout: 8000 }).catch(() => {}); await page.mouse.up();
    ok("holding A fires", (await at()).shots >= 2, await at());
    await page.keyboard.down("t"); await page.waitForFunction(() => game.state.field("turrets").count() > 0, null, { timeout: 5000 }).catch(() => {}); await page.keyboard.up("t");
    await page.click("#bSelect"); await page.waitForTimeout(400);
    ok("Select opens the program, coloured as Sprout", await page.isVisible("#prog") && (await page.$$("#srcHL i")).length > 5);
    ok("the strip says which turret it's watching", /^TURRET 1 OF 1/.test(await page.textContent("#knows .who")), await page.textContent("#knows .who"));
    ok("the sheet shows what a turret knows (blue) and answers (gold)", (await page.$$("#knows button[data-w]")).length === 5 && (await page.$$("#knows button.ans")).length === 2);
    await page.click("#knows button[data-w=how-far]");
    ok("tapping one puts it in the program", /it how-far/.test(await page.inputValue("#src")));
    await page.click("#pUndo");
    ok("Undo takes it out again", !/it how-far/.test(await page.inputValue("#src")));
    // a mistake: its line is marked in red and named, and the last program that worked keeps running
    await page.evaluate(() => { ta.value = "turret-program : [it |\n  [turn : it off-target * 4, fire : (it sees-someone]\n]\n"; ta.dispatchEvent(new Event("input")); });
    await page.waitForSelector("#srcHL .bad", { timeout: 3000 }).catch(() => {});
    ok("a mistake marks its line in red, and says which", (await page.$$("#srcHL .bad")).length === 1 && /line 2/.test(await page.textContent("#status")), await page.textContent("#status"));
    await page.click("#pUndo"); await page.waitForTimeout(400);
    ok("fixing it clears the mark", (await page.$$("#srcHL .bad")).length === 0);
    await page.click("#examples button:text-is('Sprayer')"); await page.click("#pUndo");
    ok("and undoes an example, back to the program you had", /it off-target \* 4/.test(await page.inputValue("#src")) && !/Sprayer/.test(await page.inputValue("#src")));
    await page.evaluate(() => { navigator.share = undefined; });
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
    await page.click("#pShare"); await page.waitForTimeout(200);
    ok("Share copies the program, ready for a friend", /^-- from SilverEye's turret program\nturret-program : \[it \|/.test(await page.evaluate(() => navigator.clipboard.readText().catch(() => ""))) || /Copied/.test(await page.textContent("#status")));
    await page.click("#pReset");
    // TUNE: every number the game is built on, on a slider, taken at once
    await page.click("#tabs button[data-p=tune]");
    ok("TUNE groups them under the game's own headings", (await page.$$eval(".kgroup", hs => hs.map(h => h.textContent))).join() === "seeing,moving,mines,turrets,guards,shots,matches and missions");
    ok("TUNE lists the game's numbers with what each does", await page.evaluate(() => [...document.querySelectorAll(".knob b")].map(b => b.textContent).includes("walk-pace") && document.querySelectorAll(".knob").length > 20));
    await page.evaluate(() => { const k = [...document.querySelectorAll(".knob")].find(k => k.querySelector("b").textContent === "walk-pace"), i = k.querySelector("input"); i.value = 4; i.dispatchEvent(new Event("input")); });
    await page.waitForFunction(() => /^walk-pace : 4\b/m.test(code), null, { timeout: 4000 }).catch(() => {});
    ok("sliding one changes the game at once", await page.evaluate(() => /^walk-pace : 4\b/m.test(code) && game.file.field("walk-pace") === 4));
    await page.click("#pReset"); await page.waitForTimeout(100);
    ok("and every number goes back", await page.evaluate(() => /^walk-pace : 2.6\b/m.test(code) && !Object.keys(JSON.parse(localStorage.getItem("silvereye.tune") || "{}")).length));
    await page.click("#tabs button[data-p=turret]");
    await page.click("#pClose");
    await page.click("#bStart"); await page.waitForTimeout(100);
    ok("Start pauses", await page.isVisible("#pause"));
    ok("the pause board names the mission's own objectives", /GENERATORS/.test(await page.textContent("#board")) && /INTEL CASE/.test(await page.textContent("#board")));
    const clockBefore = await page.evaluate(() => game.clock);
    await page.click("#pause button[data-do=again]");
    ok("Start again begins the mission from the top", !(await page.isVisible("#pause")) && await page.evaluate(c => game.clock < c && game.state.field("agents").part(1).field("shots-fired") === 0, clockBefore));
    await page.waitForFunction(() => game.state.field("on-stage") === 1, null, { timeout: 5000 }).catch(() => {});
    // win the mission, press A, and the campaign moves on to mission 2 (the page swaps in the next stage)
    await page.evaluate(() => { const S = Sprout3, m = new Map(S.fieldsOf(game.state)); m.set("over", "won"); m.set("over-at", game.clock - 3); game.setState(S.valueCellOf([], m), game.clock); });
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
    await page.waitForFunction(() => game.state.field("on-stage") === 2, null, { timeout: 8000 }).catch(() => {}); await page.mouse.up();
    ok("A after a won mission starts the next one", await page.evaluate(() => game.state.field("on-stage") === 2 && game.state.field("guards").count() === 7 && game.state.field("over") === ""));
    // beat it again, faster: the console says it's a new best
    await page.evaluate(() => { localStorage.setItem("silvereye.campaign", JSON.stringify({ 1: { best: 9999, medals: 0 } })); stageNum = 1; lastOver = ""; const S = Sprout3, m = new Map(S.fieldsOf(game.state)); m.set("over", "won"); m.set("over-at", game.clock); m.set("began", game.clock - 100); game.setState(S.valueCellOf([], m), game.clock); });
    // (messages wait their turn now, so it may follow one already showing)
    await page.waitForFunction(() => /NEW BEST TIME/.test(document.getElementById("toast").textContent), null, { timeout: 12000 }).catch(() => {});
    ok("a faster win says NEW BEST TIME, with the old one", /NEW BEST TIME · 1:40 \(was 166:39\)/.test(await page.textContent("#toast")), await page.textContent("#toast"));
    ok("the campaign remembers the mission you beat", await page.evaluate(() => !!JSON.parse(localStorage.getItem("silvereye.campaign") || "{}")[1]));
    ok("no errors on the page", errors.length === 0, errors);
    // turned sideways: a wide handheld (the shell solid), then see-through (the game fills the screen)
    for (const shell of ["solid", "clear"]) {
      const ctx = await browser.newContext(devices["iPhone 13 landscape"]); await ctx.addInitScript(s => localStorage.setItem("silvereye.settings", JSON.stringify({ shell: s })), shell);
      const wp = await ctx.newPage(), werr = []; wp.on("pageerror", e => werr.push(e.message));
      await wp.goto(url); await wp.waitForFunction(() => !document.getElementById("boot"), null, { timeout: 15000 }).catch(() => {});
      const st = await wp.evaluate(() => ({ wide: document.body.classList.contains("wide"), see: document.body.classList.contains("see"), GW, GH, SW, SH, iw: innerWidth, a: (r => r.right <= innerWidth && r.bottom <= innerHeight && r.width > 40)(document.getElementById("bA").getBoundingClientRect()) }));
      ok("sideways, " + shell + ": a wide handheld, the game's shape following the screen, every button on screen", st.wide && st.see === (shell !== "solid") && st.GW === 380 && st.a && (shell === "solid" ? st.SW < st.iw * 0.6 : st.SW === st.iw), st);
      await wp.click("#title"); await wp.click("#titleMenu button[data-do=campaign]"); await wp.click("#missionMenu button[data-do=stage1]"); await wp.waitForTimeout(400);
      const ab = await (await wp.$("#bA")).boundingBox(); await wp.mouse.move(ab.x + ab.width / 2, ab.y + ab.height / 2); await wp.mouse.down();
      await wp.waitForFunction(() => game.state.field("agents").part(1).field("shots-fired") >= 1, null, { timeout: 8000 }).catch(() => {}); await wp.mouse.up();
      ok("sideways, " + shell + ": A fires, with no errors", (await wp.evaluate(() => game.state.field("agents").part(1).field("shots-fired"))) >= 1 && werr.length === 0, werr);
      await ctx.close();
    }
    // SPROUT·16 (decision 125): the same console, one number up: a 320x224 screen in 512 colours, the 16-bit test card
    {
      const ctx = await browser.newContext({ viewport: { width: 1100, height: 800 } }), sp = await ctx.newPage(), serr = [];
      sp.on("pageerror", e => serr.push(e.message)); sp.on("console", m => { if (m.type() === "error") serr.push(m.text()); });
      const base = new URL(url).origin + "/sprout3/", runtime = ["sprout3.js", "words.js", "parse.js", "stdlib.js", "libs.js", "kernels.js", "live3.js", "eight.js"];
      await sp.goto(base + "index.html");
      await sp.setContent(`<!doctype html><html><head><meta charset="utf-8"><base href="${base}"></head><body>${runtime.map(f => `<script src="${f}"></script>`).join("")}<script>Eight.start({ game: "examples/test-card-16.sp", title: "Test card", key: "card16", bits: 16 });</script></body></html>`);
      await sp.waitForTimeout(2200);
      const st = await sp.evaluate(() => { const c = document.querySelector(".screen canvas"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let lit = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 0) lit++;
        return { w: c.width, h: c.height, bits: Eight.bits, snap: Eight.snap("#123456"), wide: !!document.querySelector(".gb.wide"), lit }; });
      ok("SPROUT·16: a 320 by 224 screen, colours snapped to eight levels, the wide body, the test card drawn", st.w === 320 && st.h === 224 && st.bits === 16 && st.snap === "#002449" && st.wide && st.lit > 20000, st);
      ok("SPROUT·16: no errors on the page", serr.length === 0, serr);
      await ctx.close();
    }
    // SPROUT·256 (decision 134): a 480x270 screen in true colour with a glow, four buttons in an arc, the boot screen, and
    // the third and fourth buttons reaching the game; Starlane 2025 on it
    {
      const ctx = await browser.newContext({ viewport: { width: 1100, height: 800 } }), sp = await ctx.newPage(), serr = [];
      sp.on("pageerror", e => serr.push(e.message)); sp.on("console", m => { if (m.type() === "error") serr.push(m.text()); });
      const base = new URL(url).origin + "/sprout3/", runtime = ["sprout3.js", "words.js", "parse.js", "stdlib.js", "libs.js", "kernels.js", "live3.js", "eight.js"];
      await sp.goto(base + "index.html");
      await sp.setContent(`<!doctype html><html><head><meta charset="utf-8"><base href="${base}"></head><body>${runtime.map(f => `<script src="${f}"></script>`).join("")}<script>window.E = Eight.start({ game: "examples/starlane.sp", title: "Starlane", key: "starlane-test", bits: 256 });</script></body></html>`);
      const booted = await sp.evaluate(() => !!document.querySelector(".boot.hyper em"));
      await sp.waitForTimeout(3200);
      await sp.keyboard.press("z"); await sp.waitForTimeout(300);
      await sp.keyboard.down("c"); await sp.waitForTimeout(120); await sp.keyboard.up("c"); await sp.waitForTimeout(200);
      const st = await sp.evaluate(() => { const c = document.querySelector(".screen canvas"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let lit = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 60) lit++;
        const g = E.game.state; return { w: c.width, h: c.height, bits: Eight.bits, snap: Eight.snap("#123456"), buttons: document.querySelectorAll(".btns.arc .btn").length, mem: !!document.querySelector(".led .mem"),
          mode: g.field("mode"), spun: g.field("spin-until") > 0, lit }; });
      ok("SPROUT·256: a 480 by 270 screen in true colour, four buttons in an arc, a MEMORY light and the boot screen", st.w === 480 && st.h === 270 && st.bits === 256 && st.snap === "#123456" && st.buttons === 4 && st.mem && booted, st);
      ok("SPROUT·256: button 1 starts Starlane and button 3 (the C key) spins", st.mode === "run" && st.spun && st.lit > 30000, st);
      ok("SPROUT·256: no errors on the page", serr.length === 0, serr);
      await ctx.close();
    }
  } catch (e) { fail++; console.log("FAIL the console tests stopped:", e.message); }
  await browser.close(); server.close();
  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
});
