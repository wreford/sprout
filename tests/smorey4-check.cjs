const { chromium } = require('playwright');
const SP='/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/';
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:640,height:900},hasTouch:true});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,160)));
  await p.goto('http://localhost:8899/smorey4/', {waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.SM1K);

  const boot = await p.evaluate(()=>{
    const st=SM1K.state();
    return { mode: st.mode, boards: SM1K.BOARDS.length, rules: SM1K.RULEDEF.length,
      w: document.getElementById('cv').width, h: document.getElementById('cv').height };
  });
  (boot.mode==='attract'&&boot.boards===3&&boot.rules===3&&boot.w===832&&boot.h===1056)
    ? ok('boots: attract on an 832×1056 hi-dpi canvas, 3 boards, 3 house rules')
    : fail('boot: '+JSON.stringify(boot));

  const classic = await p.evaluate(()=>{
    SM1K.seed(7); SM1K.setBoard('classic');
    SM1K.setRule('quick',false); SM1K.setRule('spicy',false); SM1K.setRule('gentle',false);
    SM1K.start();
    SM1K.setPawn(0,0,14); SM1K.setPawn(1,1,4);
    SM1K.setCard(3); SM1K.draw();
    const mi=SM1K.moves().findIndex(m=>m.pj===0&&m.dest===17);
    SM1K.play(mi);
    const st=SM1K.state();
    return { slides: st.slides, me: st.pawns[0][0], victim: st.pawns[1][1], deck0:45 };
  });
  (classic.slides===8&&classic.me===20&&classic.victim===-1)
    ? ok('classic board: 8 slides, landing at 17 rides to 20 and toasts the path')
    : fail('classic: '+JSON.stringify(classic));

  const white = await p.evaluate(()=>{
    SM1K.setBoard('white'); SM1K.start();
    SM1K.setPawn(0,0,13);
    SM1K.setCard(3); SM1K.draw();
    const mi=SM1K.moves().findIndex(m=>m.pj===0&&m.dest===16);
    SM1K.play(mi);
    const st=SM1K.state();
    return { slides: st.slides, me: st.pawns[0][0] };
  });
  (white.slides===12&&white.me===20)
    ? ok('whitewater board: 12 slides, the abs-16 rapids carry 16 → 20')
    : fail('white: '+JSON.stringify(white));

  const still = await p.evaluate(()=>{
    SM1K.setBoard('still'); SM1K.start();
    SM1K.setPawn(0,0,14);
    SM1K.setCard(3); SM1K.draw();
    const mi=SM1K.moves().findIndex(m=>m.pj===0&&m.dest===17);
    SM1K.play(mi);
    const st=SM1K.state();
    return { slides: st.slides, me: st.pawns[0][0] };
  });
  (still.slides===0&&still.me===17)
    ? ok('stillwater board: zero slides — landing at 17 just stays at 17')
    : fail('still: '+JSON.stringify(still));

  const gentle = await p.evaluate(()=>{
    SM1K.setBoard('classic'); SM1K.setRule('gentle',true); SM1K.start();
    SM1K.setPawn(0,0,20);
    SM1K.setCard(4); SM1K.draw();
    const g=SM1K.moves().find(m=>m.pj===0);
    SM1K.setRule('gentle',false);
    return { dest: g&&g.dest };
  });
  gentle.dest===24
    ? ok('gentle mode: fours go forward (20 → 24, no raccoon)') : fail('gentle: '+JSON.stringify(gentle));

  const normal4 = await p.evaluate(()=>{
    SM1K.start(); SM1K.setPawn(0,0,2);
    SM1K.setCard(4); SM1K.draw();
    const m=SM1K.moves().find(m=>m.pj===0);
    return { dest: m&&m.dest };
  });
  normal4.dest===58
    ? ok('gentle off: fours wrap backward 2 → 58, the classic shortcut') : fail('normal4: '+JSON.stringify(normal4));

  const spicy = await p.evaluate(()=>{
    SM1K.setRule('spicy',true); SM1K.start();
    const d1=SM1K.state().deck;
    SM1K.setRule('spicy',false); SM1K.start();
    const d2=SM1K.state().deck;
    return { spicyDeck: d1, normalDeck: d2 };
  });
  (spicy.spicyDeck===49&&spicy.normalDeck===45)
    ? ok("spicy deck: 49 cards with doubled S'MOREYs, 45 without") : fail('spicy: '+JSON.stringify(spicy));

  const quick = await p.evaluate(()=>{
    SM1K.setRule('quick',true); SM1K.start();
    const out=SM1K.state().pawns.map(pl=>pl[0]);
    SM1K.setRule('quick',false);
    return { out };
  });
  quick.out.every(x=>x===0)
    ? ok('quick camp: every camper starts with a mallow at the gate') : fail('quick: '+JSON.stringify(quick));

  const core = await p.evaluate(()=>{
    SM1K.start();
    SM1K.setPawn(1,0,20);
    SM1K.setCard('S'); SM1K.draw();
    const mi=SM1K.moves().findIndex(m=>m.t==='smorey');
    SM1K.play(mi);
    const a=SM1K.state();
    SM1K.start(); SM1K.setPawn(0,0,63); SM1K.setCard(2); SM1K.draw();
    SM1K.play(SM1K.moves().findIndex(m=>m.pj===0&&m.dest===65));
    const h=SM1K.state();
    return { yoink: a.pawns[0][0]===35&&a.pawns[1][0]===-1,
      home: h.pawns[0][0]===65, again: h.turn===0&&h.phase==='draw' };
  });
  (core.yoink&&core.home&&core.again)
    ? ok("core rules intact: S'MOREY yoink, exact-count home, draw-again 2s")
    : fail('core: '+JSON.stringify(core));

  const cpus = await p.evaluate(()=>{
    SM1K.start(); SM1K.setCard(3); SM1K.draw(); SM1K.ff(1.5);
    const d0=SM1K.state().deck;
    SM1K.ff(12);
    const st=SM1K.state();
    return { turn: st.turn, phase: st.phase, drew: d0-st.deck>=2, mode: st.mode };
  });
  (cpus.turn===0&&cpus.phase==='draw'&&cpus.drew&&cpus.mode==='play')
    ? ok('CPU campers play a full round back to Mallow') : fail('cpus: '+JSON.stringify(cpus));

  const music = await p.evaluate(()=>{
    const seq=[SM1K.state().mus];
    SM1K.cycleMusic(); seq.push(SM1K.state().mus);
    SM1K.cycleMusic(); seq.push(SM1K.state().mus);
    SM1K.cycleMusic(); seq.push(SM1K.state().mus);
    return { seq, label: document.getElementById('oMus').textContent };
  });
  (music.seq.join(',')==='calm,hype,off,calm'&&music.label==='MUSIC CALM')
    ? ok('music cycles CALM → HYPE → OFF → CALM with live label') : fail('music: '+JSON.stringify(music));

  const win = await p.evaluate(()=>{
    SM1K.start();
    SM1K.setPawn(0,0,65); SM1K.setPawn(0,1,65); SM1K.setPawn(0,2,65); SM1K.setPawn(0,3,64);
    SM1K.setCard(1); SM1K.draw();
    SM1K.play(SM1K.moves().findIndex(m=>m.dest===65));
    return SM1K.state();
  });
  (win.mode==='over'&&win.winner===0&&win.wins>=1)
    ? ok('Mallow wins camp; record saved ('+win.wins+'/'+win.games+')') : fail('win: '+JSON.stringify(win));

  await p.evaluate(()=>{ SM1K.setBoard('white'); SM1K.setRule('gentle',true); });
  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.SM1K);
  const persist = await p.evaluate(()=>{
    const st=SM1K.state();
    return { board: st.board, gentle: st.rules.gentle, wins: st.wins };
  });
  (persist.board==='white'&&persist.gentle===true&&persist.wins>=1)
    ? ok('board choice, house rules, and win record survive reload')
    : fail('persist: '+JSON.stringify(persist));

  const juice = await p.evaluate(()=>{
    SM1K.setBoard('classic'); SM1K.start();
    SM1K.setPawn(0,0,7); SM1K.setPawn(1,0,55);
    SM1K.setCard(3); SM1K.draw();
    SM1K.play(SM1K.moves().findIndex(m=>m.pj===0&&m.dest===10));
    return { parts: SM1K.state().parts, bumped: SM1K.state().pawns[1][0]===-1 };
  });
  (juice.parts>0&&juice.bumped)
    ? ok('toasting a rival bursts '+juice.parts+' particles') : fail('juice: '+JSON.stringify(juice));

  await p.evaluate(()=>{ SM1K.setBoard('classic'); SM1K.setRule('gentle',false); SM1K.seed(42); SM1K.start();
    SM1K.setPawn(0,0,12); SM1K.setPawn(1,0,30); SM1K.setPawn(2,2,8); SM1K.setPawn(3,1,50);
    SM1K.setCard(8); SM1K.draw(); });
  await p.waitForTimeout(400);
  await p.screenshot({path:SP+'sm127.png'});
  await p.evaluate(()=>SM1K.setup());
  await p.waitForTimeout(300);
  await p.screenshot({path:SP+'sm127-setup.png'});
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
