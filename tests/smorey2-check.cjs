const { chromium } = require('playwright');
const SP='/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/';
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:640,height:900},hasTouch:true});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,160)));
  await p.goto('http://localhost:8899/smorey2/', {waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.SM17);

  const boot = await p.evaluate(()=>{
    const st=SM17.state();
    return { mode: st.mode, boards: SM17.BOARDS.length, rules: SM17.RULEDEF.length,
      w: document.getElementById('cv').width, h: document.getElementById('cv').height };
  });
  (boot.mode==='attract'&&boot.boards===3&&boot.rules===3&&boot.w===416&&boot.h===528)
    ? ok('boots: attract on a 416×528 canvas, 3 boards, 3 house rules')
    : fail('boot: '+JSON.stringify(boot));

  const classic = await p.evaluate(()=>{
    SM17.seed(7); SM17.setBoard('classic');
    SM17.setRule('quick',false); SM17.setRule('spicy',false); SM17.setRule('gentle',false);
    SM17.start();
    SM17.setPawn(0,0,14); SM17.setPawn(1,1,4);
    SM17.setCard(3); SM17.draw();
    const mi=SM17.moves().findIndex(m=>m.pj===0&&m.dest===17);
    SM17.play(mi);
    const st=SM17.state();
    return { slides: st.slides, me: st.pawns[0][0], victim: st.pawns[1][1], deck0:45 };
  });
  (classic.slides===8&&classic.me===20&&classic.victim===-1)
    ? ok('classic board: 8 slides, landing at 17 rides to 20 and toasts the path')
    : fail('classic: '+JSON.stringify(classic));

  const white = await p.evaluate(()=>{
    SM17.setBoard('white'); SM17.start();
    SM17.setPawn(0,0,13);
    SM17.setCard(3); SM17.draw();
    const mi=SM17.moves().findIndex(m=>m.pj===0&&m.dest===16);
    SM17.play(mi);
    const st=SM17.state();
    return { slides: st.slides, me: st.pawns[0][0] };
  });
  (white.slides===12&&white.me===20)
    ? ok('whitewater board: 12 slides, the abs-16 rapids carry 16 → 20')
    : fail('white: '+JSON.stringify(white));

  const still = await p.evaluate(()=>{
    SM17.setBoard('still'); SM17.start();
    SM17.setPawn(0,0,14);
    SM17.setCard(3); SM17.draw();
    const mi=SM17.moves().findIndex(m=>m.pj===0&&m.dest===17);
    SM17.play(mi);
    const st=SM17.state();
    return { slides: st.slides, me: st.pawns[0][0] };
  });
  (still.slides===0&&still.me===17)
    ? ok('stillwater board: zero slides — landing at 17 just stays at 17')
    : fail('still: '+JSON.stringify(still));

  const gentle = await p.evaluate(()=>{
    SM17.setBoard('classic'); SM17.setRule('gentle',true); SM17.start();
    SM17.setPawn(0,0,20);
    SM17.setCard(4); SM17.draw();
    const g=SM17.moves().find(m=>m.pj===0);
    SM17.setRule('gentle',false);
    return { dest: g&&g.dest };
  });
  gentle.dest===24
    ? ok('gentle mode: fours go forward (20 → 24, no raccoon)') : fail('gentle: '+JSON.stringify(gentle));

  const normal4 = await p.evaluate(()=>{
    SM17.start(); SM17.setPawn(0,0,2);
    SM17.setCard(4); SM17.draw();
    const m=SM17.moves().find(m=>m.pj===0);
    return { dest: m&&m.dest };
  });
  normal4.dest===58
    ? ok('gentle off: fours wrap backward 2 → 58, the classic shortcut') : fail('normal4: '+JSON.stringify(normal4));

  const spicy = await p.evaluate(()=>{
    SM17.setRule('spicy',true); SM17.start();
    const d1=SM17.state().deck;
    SM17.setRule('spicy',false); SM17.start();
    const d2=SM17.state().deck;
    return { spicyDeck: d1, normalDeck: d2 };
  });
  (spicy.spicyDeck===49&&spicy.normalDeck===45)
    ? ok("spicy deck: 49 cards with doubled S'MOREYs, 45 without") : fail('spicy: '+JSON.stringify(spicy));

  const quick = await p.evaluate(()=>{
    SM17.setRule('quick',true); SM17.start();
    const out=SM17.state().pawns.map(pl=>pl[0]);
    SM17.setRule('quick',false);
    return { out };
  });
  quick.out.every(x=>x===0)
    ? ok('quick camp: every camper starts with a mallow at the gate') : fail('quick: '+JSON.stringify(quick));

  const core = await p.evaluate(()=>{
    SM17.start();
    SM17.setPawn(1,0,20);
    SM17.setCard('S'); SM17.draw();
    const mi=SM17.moves().findIndex(m=>m.t==='smorey');
    SM17.play(mi);
    const a=SM17.state();
    SM17.start(); SM17.setPawn(0,0,63); SM17.setCard(2); SM17.draw();
    SM17.play(SM17.moves().findIndex(m=>m.pj===0&&m.dest===65));
    const h=SM17.state();
    return { yoink: a.pawns[0][0]===35&&a.pawns[1][0]===-1,
      home: h.pawns[0][0]===65, again: h.turn===0&&h.phase==='draw' };
  });
  (core.yoink&&core.home&&core.again)
    ? ok("core rules intact: S'MOREY yoink, exact-count home, draw-again 2s")
    : fail('core: '+JSON.stringify(core));

  const cpus = await p.evaluate(()=>{
    SM17.start(); SM17.setCard(3); SM17.draw(); SM17.ff(1.5);
    const d0=SM17.state().deck;
    SM17.ff(12);
    const st=SM17.state();
    return { turn: st.turn, phase: st.phase, drew: d0-st.deck>=2, mode: st.mode };
  });
  (cpus.turn===0&&cpus.phase==='draw'&&cpus.drew&&cpus.mode==='play')
    ? ok('CPU campers play a full round back to Mallow') : fail('cpus: '+JSON.stringify(cpus));

  const music = await p.evaluate(()=>{
    const seq=[SM17.state().mus];
    SM17.cycleMusic(); seq.push(SM17.state().mus);
    SM17.cycleMusic(); seq.push(SM17.state().mus);
    SM17.cycleMusic(); seq.push(SM17.state().mus);
    return { seq, label: document.getElementById('oMus').textContent };
  });
  (music.seq.join(',')==='calm,hype,off,calm'&&music.label==='MUSIC CALM')
    ? ok('music cycles CALM → HYPE → OFF → CALM with live label') : fail('music: '+JSON.stringify(music));

  const win = await p.evaluate(()=>{
    SM17.start();
    SM17.setPawn(0,0,65); SM17.setPawn(0,1,65); SM17.setPawn(0,2,65); SM17.setPawn(0,3,64);
    SM17.setCard(1); SM17.draw();
    SM17.play(SM17.moves().findIndex(m=>m.dest===65));
    return SM17.state();
  });
  (win.mode==='over'&&win.winner===0&&win.wins>=1)
    ? ok('Mallow wins camp; record saved ('+win.wins+'/'+win.games+')') : fail('win: '+JSON.stringify(win));

  await p.evaluate(()=>{ SM17.setBoard('white'); SM17.setRule('gentle',true); });
  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.SM17);
  const persist = await p.evaluate(()=>{
    const st=SM17.state();
    return { board: st.board, gentle: st.rules.gentle, wins: st.wins };
  });
  (persist.board==='white'&&persist.gentle===true&&persist.wins>=1)
    ? ok('board choice, house rules, and win record survive reload')
    : fail('persist: '+JSON.stringify(persist));

  await p.evaluate(()=>{ SM17.setBoard('classic'); SM17.setRule('gentle',false); SM17.seed(42); SM17.start();
    SM17.setPawn(0,0,12); SM17.setPawn(1,0,30); SM17.setPawn(2,2,8); SM17.setPawn(3,1,50);
    SM17.setCard(8); SM17.draw(); });
  await p.waitForTimeout(400);
  await p.screenshot({path:SP+'sm17.png'});
  await p.evaluate(()=>SM17.setup());
  await p.waitForTimeout(300);
  await p.screenshot({path:SP+'sm17-setup.png'});
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
