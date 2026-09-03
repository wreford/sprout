const { chromium } = require('playwright');
const SP='/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/';
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:440,height:860},hasTouch:true});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,160)));
  await p.goto('http://localhost:8899/dragonrider/', {waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.DR);

  const boot = await p.evaluate(()=>({
    spaces: document.querySelectorAll('.space').length,
    help: document.getElementById('helpOv').classList.contains('show'),
    st: DR.state() }));
  (boot.spaces===16&&boot.help&&boot.st.pos===0&&boot.st.heart===10&&boot.st.fury===1)
    ? ok('boots: 16-space ring, rules overlay, dragon ready at the roost')
    : fail('boot: '+JSON.stringify(boot));

  const village = await p.evaluate(async ()=>{
    DR.fast=true; DR.start();
    DR.setState({heart:7});
    DR.force(2, 1);
    await DR.turn();
    return DR.state();
  });
  (village.pos===2&&village.heart===9&&village.rot.includes(3))
    ? ok('fly 2 to the village: heal 2, then the rot claims space 3')
    : fail('village: '+JSON.stringify(village));

  const scav = await p.evaluate(async ()=>{
    DR.setState({pos:0,heart:5,rot:[1]});
    DR.force(1, 6,1, 2);
    await DR.turn();
    return DR.state();
  });
  (scav.pos===1&&scav.heart===6&&!scav.rot.includes(1))
    ? ok('wraith fight won: ground cleansed, embers scavenged (+1 heart)')
    : fail('scav: '+JSON.stringify(scav));

  const lose1 = await p.evaluate(async ()=>{
    DR.setState({pos:0,heart:10,fury:1,rot:[]});
    DR.force(1, 1,6, 1);
    await DR.turn();
    return DR.state();
  });
  (lose1.heart===5)
    ? ok('wraith fight lost: 2 vs 7 costs exactly the 5-point difference')
    : fail('lose1: '+JSON.stringify(lose1));

  const tie = await p.evaluate(async ()=>{
    DR.setState({pos:0,heart:10,fury:1,rot:[]});
    DR.force(1, 3,3, 6,1, 1);
    await DR.turn();
    return DR.state();
  });
  (tie.heart===10)
    ? ok('tied clash rerolls — no blood spilled, second roll settles it')
    : fail('tie: '+JSON.stringify(tie));

  const relic = await p.evaluate(async ()=>{
    DR.setState({pos:3,heart:10,fury:1,relics:0,rot:[]});
    DR.force(1, 6,1, 1);
    await DR.turn();
    return { st: DR.state(), dive: document.getElementById('diveBtn').disabled };
  });
  (relic.st.relics===1&&relic.st.fury===2&&relic.dive)
    ? ok('guardian beaten at the cache: relic 1/3, fury +2, dive still locked')
    : fail('relic: '+JSON.stringify(relic));

  const boost = await p.evaluate(async ()=>{
    DR.setState({pos:0,heart:10,fury:1,relics:1,rot:[2,3,6,7,8,9]});
    DR.force(1, 1,6, 1);
    await DR.turn();
    return DR.state();
  });
  (boost.heart===4)
    ? ok('rot at 6+: foes get +1 (2 vs 8 costs 6 hearts)')
    : fail('boost: '+JSON.stringify(boost));

  const divewin = await p.evaluate(async ()=>{
    DR.setState({heart:10,fury:4,relics:3,rot:[]});
    const enabled=!document.getElementById('diveBtn').disabled;
    DR.force(6,1, 6,1);
    await DR.dive();
    return { enabled, st: DR.state() };
  });
  (divewin.enabled&&divewin.st.over&&divewin.st.end&&divewin.st.end.includes('Dawn')
    &&divewin.st.wins>=1)
    ? ok('three relics unlock the dive; the Wraith King falls — Dawn breaks, win recorded')
    : fail('divewin: '+JSON.stringify(divewin));

  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.DR);
  const persist = await p.evaluate(()=>DR.state().wins);
  persist>=1 ? ok('win record survives reload ('+persist+')') : fail('persist: '+persist);

  const death = await p.evaluate(async ()=>{
    DR.fast=true; DR.start();
    DR.setState({pos:0,heart:1,fury:1,rot:[]});
    DR.force(1, 1,6, 1);
    await DR.turn();
    return DR.state();
  });
  (death.over&&death.end&&death.end.includes('ring falls'))
    ? ok('0 hearts: the dragon falls, honest game over')
    : fail('death: '+JSON.stringify(death));

  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.DR);
  const rotloss = await p.evaluate(async ()=>{
    DR.fast=true; DR.start();
    DR.setState({pos:4,heart:10,fury:1,rot:[0,1,2,3,6,7,8,9,10,12,13]});
    DR.force(1, 6);
    await DR.turn();
    return DR.state();
  });
  (rotloss.over&&rotloss.rot.length>=12&&rotloss.end&&rotloss.end.includes('ring falls'))
    ? ok('twelfth rotted space: the ring falls')
    : fail('rotloss: '+JSON.stringify(rotloss));

  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.DR);
  await p.evaluate(()=>{ DR.start(); DR.setState({heart:7,relics:2,rot:[1,5,9]}); });
  await p.waitForTimeout(400);
  await p.screenshot({path:SP+'dr.png'});
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
