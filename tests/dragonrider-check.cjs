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
    cvw: document.getElementById('cv').width,
    help: document.getElementById('helpOv').classList.contains('show'),
    st: DR.state() }));
  (boot.cvw===832&&boot.help&&boot.st.phase==='idle'&&boot.st.heart===10)
    ? ok('boots: painted canvas ring, rules overlay, dragon ready')
    : fail('boot: '+JSON.stringify(boot));

  const offer = await p.evaluate(()=>{
    DR.fast=true; DR.start();
    DR.force(2,5); DR.roll();
    return DR.state();
  });
  (offer.phase==='pick'&&offer.options.length===2
    &&offer.options[0].die===2&&offer.options[0].dest===2&&offer.options[0].rotTarget===7
    &&offer.options[1].die===5&&offer.options[1].dest===5&&offer.options[1].rotTarget===7)
    ? ok('roll offers both dice with destination AND rot previews')
    : fail('offer: '+JSON.stringify(offer.options));

  const heal = await p.evaluate(async ()=>{
    DR.setState({heart:6});
    await DR.choose(0);
    return DR.state();
  });
  (heal.pos===2&&heal.heart===8&&heal.rot.includes(7)&&heal.phase==='idle')
    ? ok('fly 2 to the village: heal 2, the rejected 5 feeds the rot (space 7)')
    : fail('heal: '+JSON.stringify(heal));

  const skip = await p.evaluate(async ()=>{
    DR.setState({pos:0});
    DR.force(2,5); DR.roll();
    await DR.choose(1);
    return DR.state();
  });
  (skip.pos===5&&skip.rot.includes(8))
    ? ok('rot skips already-claimed ground (7 taken, creeps on to 8)')
    : fail('skip: '+JSON.stringify(skip));

  const claw = await p.evaluate(async ()=>{
    DR.setState({pos:0,heart:5,fury:1,rot:[1]});
    DR.force(1,4); DR.roll();
    await DR.choose(0);
    const mid=DR.state().phase;
    DR.force(6,1);
    await DR.act('claw');
    return { mid, st: DR.state() };
  });
  (claw.mid==='fight'&&claw.st.heart===6&&!claw.st.rot.includes(1)&&claw.st.rot.includes(5)&&claw.st.phase==='idle')
    ? ok('claw win on rotted barrow: cleansed, embers scavenged, rot takes the spare die')
    : fail('claw: '+JSON.stringify(claw));

  const fire = await p.evaluate(async ()=>{
    DR.setState({pos:0,heart:10,fury:1,rot:[]});
    DR.force(1,4); DR.roll();
    await DR.choose(0);
    DR.force(1,2);
    await DR.act('fire');
    return DR.state();
  });
  (fire.heart===10&&fire.phase==='idle')
    ? ok('firebreath gamble: pay 1 heart for +2, turn a loss into a win (net even after scavenge)')
    : fail('fire: '+JSON.stringify(fire));

  const tie = await p.evaluate(async ()=>{
    DR.clear(); DR.setState({pos:0,heart:10,fury:1,rot:[]});
    DR.force(1,4); DR.roll();
    await DR.choose(0);
    DR.force(2,2);
    await DR.act('claw');
    const mid=DR.state().phase;
    DR.force(6,1);
    await DR.act('claw');
    return { mid, done: DR.state().phase };
  });
  (tie.mid==='fight'&&tie.done==='idle')
    ? ok('tied clash stays in the fight — you choose your blow again')
    : fail('tie: '+JSON.stringify(tie));

  const relic = await p.evaluate(async ()=>{
    DR.clear(); DR.setState({pos:3,heart:10,fury:1,relics:0,rot:[]});
    DR.force(1,2); DR.roll();
    await DR.choose(0);
    DR.force(6,1);
    await DR.act('claw');
    return DR.state();
  });
  (relic.relics===1&&relic.fury===2)
    ? ok('guardian beaten at the cache: relic 1/3, fury rises')
    : fail('relic: '+JSON.stringify(relic));

  const boss = await p.evaluate(async ()=>{
    DR.clear(); DR.setState({heart:10,fury:4,relics:3,rot:[]});
    await DR.dive();
    const hp0=DR.state().kingHp;
    DR.force(6,1); await DR.act('claw');
    const hp1=DR.state().kingHp;
    DR.force(6,1); await DR.act('claw');
    return { hp0, hp1, st: DR.state() };
  });
  (boss.hp0===6&&boss.hp1===1&&boss.st.over&&boss.st.end&&boss.st.end.includes('Dawn')&&boss.st.wins>=1)
    ? ok('the dive: king bleeds by the margin (6→1), falls — Dawn breaks, win recorded')
    : fail('boss: '+JSON.stringify(boss));

  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.DR);
  const persist = await p.evaluate(()=>DR.state().wins);
  persist>=1 ? ok('win record survives reload ('+persist+')') : fail('persist: '+persist);

  const death = await p.evaluate(async ()=>{
    DR.fast=true; DR.start();
    DR.setState({pos:0,heart:1,fury:1,rot:[]});
    DR.force(1,4); DR.roll();
    await DR.choose(0);
    DR.force(1,6);
    await DR.act('claw');
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
    DR.force(1,6); DR.roll();
    await DR.choose(0);
    return DR.state();
  });
  (rotloss.over&&rotloss.rot.length>=12&&rotloss.end&&rotloss.end.includes('ring falls'))
    ? ok('twelfth rotted space: the ring falls')
    : fail('rotloss: '+JSON.stringify(rotloss));

  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.DR);
  await p.evaluate(()=>{ DR.start(); DR.setState({heart:7,relics:2,rot:[1,6,9]});
    DR.force(3,5); DR.roll(); });
  await p.waitForTimeout(600);
  await p.screenshot({path:SP+'dr2.png'});
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
