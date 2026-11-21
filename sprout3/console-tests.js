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
    ok("then the title, with the modes", (await page.$$eval("#titleMenu button", bs => bs.map(b => b.dataset.do))).join() === "campaign,sim,duel,settings,program,help,about");
    await page.click("#titleMenu button[data-do=about]");
    ok("About credits the games that inspired it", /GoldenEye 007/.test(await page.textContent("#about")) && /Perfect Dark/.test(await page.textContent("#about")) && /none of their work/.test(await page.textContent("#about")));
    await page.click("#about button[data-do=back]"); await page.click("#titleMenu button[data-do=settings]");
    const fov = await page.textContent("#vFov"); await page.click("#settingsMenu button[data-do=fov]");
    ok("Settings change the view", (await page.textContent("#vFov")) !== fov);
    await page.click("#settingsMenu button[data-do=back]");
    await page.click("#titleMenu button[data-do=campaign]"); await page.click("#missionMenu button[data-do=stage1]"); await page.waitForTimeout(300);
    const at = () => page.evaluate(() => { const a = game.state.field("agents").part(1); return { x: a.field("x"), shots: a.field("shots-fired") }; });
    const before = await at();
    const zone = await (await page.$("#stickZone")).boundingBox();
    await page.mouse.move(zone.x + zone.width / 2, zone.y + zone.height / 2); await page.mouse.down();
    await page.mouse.move(zone.x + zone.width / 2, zone.y + zone.height / 2 - 40, { steps: 3 }); await page.waitForTimeout(600); await page.mouse.up();
    ok("the stick walks you", (await at()).x > before.x + 0.3, await at());
    const a = await (await page.$("#bA")).boundingBox();
    // software 3D draws few frames a second here, and each frame is at most 0.05 s of game time, so hold A a while
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down(); await page.waitForFunction(() => game.state.field("agents").part(1).field("shots-fired") >= 2, null, { timeout: 8000 }).catch(() => {}); await page.mouse.up();
    ok("holding A fires", (await at()).shots >= 2, await at());
    await page.click("#bSelect"); await page.waitForTimeout(200);
    ok("Select opens the program, coloured as Sprout", await page.isVisible("#prog") && (await page.$$("#srcHL i")).length > 5);
    await page.click("#pClose");
    await page.click("#bStart"); await page.waitForTimeout(100);
    ok("Start pauses", await page.isVisible("#pause"));
    await page.click("#pause button[data-do=resume]");
    // win the mission, press A, and the campaign moves on to mission 2 (the page swaps in the next stage)
    await page.evaluate(() => { const S = Sprout3, m = new Map(S.fieldsOf(game.state)); m.set("over", "won"); m.set("over-at", game.clock - 3); game.setState(S.valueCellOf([], m), game.clock); });
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
    await page.waitForFunction(() => game.state.field("on-stage") === 2, null, { timeout: 8000 }).catch(() => {}); await page.mouse.up();
    ok("A after a won mission starts the next one", await page.evaluate(() => game.state.field("on-stage") === 2 && game.state.field("guards").count() === 7 && game.state.field("over") === ""));
    ok("the campaign remembers the mission you beat", await page.evaluate(() => !!JSON.parse(localStorage.getItem("silvereye.campaign") || "{}")[1]));
    ok("no errors on the page", errors.length === 0, errors);
  } catch (e) { fail++; console.log("FAIL the console tests stopped:", e.message); }
  await browser.close(); server.close();
  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
});
