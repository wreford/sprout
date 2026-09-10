const { chromium } = require('playwright');
const SP='/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/';
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:600,height:860},hasTouch:true});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,160)));
  await p.goto('http://localhost:8899/smorey/', {waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.SM7);

  const boot = await p.evaluate(()=>{
    const total=SM7.DECKDEF.reduce((a,[v,n])=>a+n,0);
    const vals=SM7.DECKDEF.map(([v])=>v);
    SM7.seed(7); SM7.start();
    const st=SM7.state();
    return { total, no69: !vals.includes(6)&&!vals.includes(9),
      mode: st.mode, deck: st.deck, turn: st.turn,
      allTented: st.pawns.every(pl=>pl.every(x=>x===-1)) };
  });
  (boot.total===45&&boot.no69&&boot.mode==='play'&&boot.deck===45&&boot.turn===0&&boot.allTented)
    ? ok('boots: 45-card deck (no sixes, no nines), 16 mallows in tents, Mallow first')
    : fail('boot: '+JSON.stringify(boot));

  const start1 = await p.evaluate(()=>{
    SM7.setCard(1); SM7.draw();
    const ms=SM7.moves();
    const si=ms.findIndex(m=>m.t==='start');
    SM7.play(si);
    return { hadStart: si>=0, pos: SM7.state().pawns[0][ms[si].pj] };
  });
  (start1.hadStart&&start1.pos===0)
    ? ok('card 1: leaves the tent onto the track') : fail('start1: '+JSON.stringify(start1));

  const back4 = await p.evaluate(()=>{
    SM7.start(); SM7.setPawn(0,0,2);
    SM7.setCard(4); SM7.draw();
    const m=SM7.moves().find(m=>m.pj===0);
    SM7.play(SM7.moves().findIndex(x=>x.pj===0));
    return { dest: m&&m.dest, pos: SM7.state().pawns[0][0] };
  });
  (back4.dest===58&&back4.pos===58)
    ? ok('card 4: backward wrap 2 → 58 (the classic tent shortcut)') : fail('back4: '+JSON.stringify(back4));

  const bump = await p.evaluate(()=>{
    SM7.start(); SM7.setPawn(0,0,7); SM7.setPawn(1,0,55);
    SM7.setCard(3); SM7.draw();
    const mi=SM7.moves().findIndex(m=>m.pj===0&&m.dest===10);
    SM7.play(mi);
    const st=SM7.state();
    return { me: st.pawns[0][0], them: st.pawns[1][0] };
  });
  (bump.me===10&&bump.them===-1)
    ? ok('landing on a rival: TOASTED, back to the tent') : fail('bump: '+JSON.stringify(bump));

  const slide = await p.evaluate(()=>{
    SM7.start(); SM7.setPawn(0,0,14); SM7.setPawn(1,1,4);
    SM7.setCard(3); SM7.draw();
    const mi=SM7.moves().findIndex(m=>m.pj===0&&m.dest===17);
    SM7.play(mi);
    const st=SM7.state();
    return { me: st.pawns[0][0], victim: st.pawns[1][1] };
  });
  (slide.me===20&&slide.victim===-1)
    ? ok('log slide: landing on a foreign slide carries to the end, bumping the path')
    : fail('slide: '+JSON.stringify(slide));

  const home = await p.evaluate(()=>{
    SM7.start(); SM7.setPawn(0,0,63); SM7.setPawn(0,1,63-20);
    SM7.setCard(2); SM7.draw();
    const ms=SM7.moves();
    const overshoot=ms.some(m=>m.dest>65);
    const mi=ms.findIndex(m=>m.pj===0&&m.dest===65);
    SM7.play(mi);
    const st=SM7.state();
    return { overshoot, pos: st.pawns[0][0], again: st.turn===0&&st.phase==='draw' };
  });
  (!home.overshoot&&home.pos===65&&home.again)
    ? ok('exact count reaches the fire; card 2 grants another draw') : fail('home: '+JSON.stringify(home));

  const smorey = await p.evaluate(()=>{
    SM7.start(); SM7.setPawn(1,0,20);
    SM7.setCard('S'); SM7.draw();
    const mi=SM7.moves().findIndex(m=>m.t==='smorey');
    SM7.play(mi);
    const st=SM7.state();
    return { me: st.pawns[0][0], them: st.pawns[1][0] };
  });
  (smorey.me===35&&smorey.them===-1)
    ? ok("S'MOREY card: yoinks the rival's spot from the tent") : fail('smorey: '+JSON.stringify(smorey));

  const swap = await p.evaluate(()=>{
    SM7.start(); SM7.setPawn(0,0,5); SM7.setPawn(1,0,30);
    SM7.setCard(11); SM7.draw();
    const mi=SM7.moves().findIndex(m=>m.t==='swap');
    SM7.play(mi);
    const st=SM7.state();
    return { me: st.pawns[0][0], them: st.pawns[1][0] };
  });
  (swap.me===45&&swap.them===50)
    ? ok('card 11 swap: seats exchanged across the camp') : fail('swap: '+JSON.stringify(swap));

  const split = await p.evaluate(()=>{
    SM7.start(); SM7.setPawn(0,0,10); SM7.setPawn(0,1,30);
    SM7.setCard(7); SM7.draw();
    const mi=SM7.moves().findIndex(m=>m.pj===0&&m.split&&m.dest===13);
    if(mi<0) return { fail:'no split option' };
    SM7.play(mi);
    const mid=SM7.state();
    const mi2=SM7.moves().findIndex(m=>m.pj===1);
    SM7.play(mi2);
    const st=SM7.state();
    return { midSplit: mid.splitLeft, a: st.pawns[0][0], b: st.pawns[0][1] };
  });
  (split.midSplit===4&&split.a===13&&split.b===34)
    ? ok('card 7: split like firewood — 3 + 4 across two mallows') : fail('split: '+JSON.stringify(split));

  const pass = await p.evaluate(()=>{
    SM7.start(); SM7.setCard(3); SM7.draw();
    const st1=SM7.state();
    SM7.ff(1.5);
    return { phase: st1.phase, after: SM7.state().turn };
  });
  (pass.phase==='pass'&&pass.after===1)
    ? ok('no legal move: sip cocoa, turn passes to Choco') : fail('pass: '+JSON.stringify(pass));

  const cpus = await p.evaluate(()=>{
    const d0=SM7.state().deck;
    SM7.ff(12);
    const st=SM7.state();
    return { turn: st.turn, phase: st.phase, drew: d0-st.deck>=2, mode: st.mode };
  });
  (cpus.turn===0&&cpus.phase==='draw'&&cpus.drew&&cpus.mode==='play')
    ? ok('three CPU campers take their turns and play returns to Mallow')
    : fail('cpus: '+JSON.stringify(cpus));

  const win = await p.evaluate(()=>{
    SM7.start();
    SM7.setPawn(0,0,65); SM7.setPawn(0,1,65); SM7.setPawn(0,2,65); SM7.setPawn(0,3,64);
    SM7.setCard(1); SM7.draw();
    const mi=SM7.moves().findIndex(m=>m.dest===65);
    SM7.play(mi);
    const st=SM7.state();
    return { mode: st.mode, winner: st.winner, wins: st.wins, games: st.games };
  });
  (win.mode==='over'&&win.winner===0&&win.wins>=1)
    ? ok('all four mallows toasted: Mallow wins camp, record saved ('+win.wins+'/'+win.games+')')
    : fail('win: '+JSON.stringify(win));

  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.SM7);
  const persist = await p.evaluate(()=>SM7.state().wins);
  persist>=1 ? ok('win record survives reload') : fail('persist: '+persist);

  await p.evaluate(()=>{ SM7.seed(42); SM7.start();
    SM7.setPawn(0,0,12); SM7.setPawn(1,0,30); SM7.setPawn(2,2,8); SM7.setPawn(3,1,50);
    SM7.setCard(8); SM7.draw(); });
  await p.waitForTimeout(400);
  await p.screenshot({path:SP+'sm7.png'});
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
