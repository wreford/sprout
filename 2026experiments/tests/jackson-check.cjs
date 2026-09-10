const { chromium } = require('playwright');
const SP='/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/';
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:430,height:900},isMobile:true,hasTouch:true});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,150)));
  await p.goto('http://localhost:8899/jackson/', {waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.JVW);

  const sim = await p.evaluate(()=>{
    const learnOrder=JVW.KID_MOVES.filter(m=>!m.heal&&!["poke","yell","stick"].includes(m.id)).map(m=>m.id);
    const results=[];
    for(let tier=0;tier<JVW.TOTAL-1;tier++){
      const lvl=5+2*tier;
      const learned=Math.min(Math.floor((tier)/2),learnOrder.length);
      let pool=["poke","yell","stick"].concat(learnOrder.slice(0,learned)).map(id=>JVW.moveById(id));
      let wins=0,turnsSum=0;
      for(let run=0;run<300;run++){
        const f=JVW.FOES[tier];
        let fhp=f.hp,khp=26+lvl*6,juice=3,turns=0,alive=true;
        const atk=10+lvl*2.2,def=8+lvl*1.6;
        const foeLvl=Math.max(1,Math.round((tier+1)*4.6));
        while(turns++<80){
          const best=pool.reduce((a,m)=>{
            const e=JVW.effOf(m.t,f);
            return (m.p*e>(a?a.p*JVW.effOf(a.t,f):0))?m:a;},null);
          if(khp<(26+lvl*6)*0.35&&juice>0){ juice--; khp=Math.min(26+lvl*6,khp+Math.round((26+lvl*6)*0.42)); }
          else {
            const e=JVW.effOf(best.t,f);
            const crit=Math.random()<1/16?1.5:1;
            fhp-=Math.max(1,Math.round((((2*lvl/5+2)*best.p*(atk/f.def))/50+2)*e*crit*(0.85+Math.random()*0.15)));
          }
          if(fhp<=0){ wins++; turnsSum+=turns; break; }
          const fm=f.moves[Math.floor(Math.random()*f.moves.length)];
          khp-=Math.max(1,Math.round((((2*foeLvl/5+2)*fm.p*(f.atk/def))/50+2)*(0.85+Math.random()*0.15)));
          if(khp<=0){ alive=false; break; }
        }
      }
      results.push({tier,foe:JVW.FOES[tier].n,winPct:Math.round(wins/300*100),avgTurns:wins?+(turnsSum/wins).toFixed(1):0});
    }
    return results;
  });
  sim.forEach(r=>console.log(`    · T${r.tier+1} ${r.foe}: ${r.winPct}% win, ~${r.avgTurns} turns`));
  const bad=sim.filter(r=>r.winPct<45);
  bad.length===0 ? ok('all 13 mortal foes winnable at natural level (min '+Math.min(...sim.map(r=>r.winPct))+'%)')
    : fail('too hard: '+bad.map(r=>r.foe+'='+r.winPct+'%').join(', '));
  const tooEasy=sim.slice(5).filter(r=>r.winPct===100&&r.avgTurns<4);
  tooEasy.length<=2 ? ok('late game keeps some tension') : console.log('    · note: late fights breezy');

  const ui = await p.evaluate(async ()=>{
    localStorage.clear();
    JVW.S={tier:0,lvl:5,moves:["poke","yell","juice","stick"],wins:0,gear:[],runs:0};
    document.getElementById('btnStart').click();
    const started=document.getElementById('game').classList.contains('show');
    JVW.rng=()=>0.5;
    for(let i=0;i<12&&!document.getElementById('winOv').classList.contains('show');i++){
      const btn=document.querySelector('[data-m="stick"]');
      btn.click();
      await new Promise(r=>setTimeout(r,2300));
    }
    return { started, win:document.getElementById('winOv').classList.contains('show'),
      title:document.getElementById('winT').textContent,
      lvl:document.getElementById('winLvl').textContent.includes('Lv 7') };
  });
  (ui.started&&ui.win&&ui.title.includes('FRUIT FLY')&&ui.lvl)
    ? ok('UI battle: fruit fly defeated, level-up overlay (Lv 5→7)') : fail('ui: '+JSON.stringify(ui));
  await p.screenshot({path:SP+'jvw-win.png'});

  const god = await p.evaluate(async ()=>{
    document.getElementById('winOv').classList.remove('show');
    JVW.S.tier=13; JVW.S.lvl=31; JVW.S.moves=["tantrum","friend","juice","look"];
    JVW.startBattle();
    const name=document.getElementById('foeName').textContent;
    const hpTxt=document.getElementById('foeHpN').textContent;
    for(let i=0;i<4;i++){ await JVW.playerMove('tantrum'); await new Promise(r=>setTimeout(r,300)); }
    await new Promise(r=>setTimeout(r,3800));
    return { name, hpTxt, end:document.getElementById('endOv').classList.contains('show'),
      forfeit:document.getElementById('textbox').textContent.includes('forfeit')||document.getElementById('endP').textContent.includes('forfeit') };
  });
  (god.name==='GOD'&&god.hpTxt.includes('??')&&god.end&&god.forfeit)
    ? ok('GOD fight: HP hidden as ??, immune to damage, ends in divine forfeit after 4 rounds')
    : fail('god: '+JSON.stringify(god));
  await p.screenshot({path:SP+'jvw-god.png'});


  const gear = await p.evaluate(async ()=>{
    localStorage.clear();
    JVW.S={tier:0,lvl:5,moves:["poke","yell","juice","stick"],wins:0,gear:[],runs:0};
    JVW.startBattle();
    JVW.rng=()=>0.5;
    for(let i=0;i<14&&!document.getElementById('winOv').classList.contains('show');i++){
      document.querySelector('[data-m="stick"]').click();
      await new Promise(r=>setTimeout(r,2300));
    }
    const gotMedal=JVW.S.gear.includes('medal');
    const overlayShows=document.getElementById('winMove').textContent.includes('Participation Medal');
    const hpBefore=26+JVW.S.lvl*6;
    const hpWithGear=JVW.kidMaxHp();
    return { gotMedal, overlayShows, hpBoost:hpWithGear-hpBefore===6 };
  });
  (gear.gotMedal&&gear.overlayShows&&gear.hpBoost)
    ? ok('gear drop: Participation Medal looted, shown in overlay, +6 max HP applied') : fail('gear: '+JSON.stringify(gear));

  const ng = await p.evaluate(()=>{
    JVW.S.gear=['medal','battery','coin','book','star']; JVW.S.runs=1; JVW.S.tier=0; JVW.S.lvl=40;
    JVW.startBattle();
    const scaled=JVW.B.foeMax;
    const g=JVW.gearStat();
    JVW.rosterPaint();
    const shelf=document.getElementById('gearShelf').textContent;
    return { scaled, base:JVW.FOES[0].hp, atkBonus:g.atk===10, dmgBonus:Math.abs(g.dmg-0.22)<0.001,
      badge:shelf.includes('RUN #2'), shelfCount:shelf.includes('5/14') };
  });
  (ng.scaled>ng.base&&ng.atkBonus&&ng.dmgBonus&&ng.badge&&ng.shelfCount)
    ? ok('New Game+: foes scaled ('+ng.base+'→'+ng.scaled+' hp), gear stats stack, run badge + shelf 5/14')
    : fail('ng+: '+JSON.stringify(ng));

  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.JVW);
  const persist = await p.evaluate(()=>JVW.S.gear.includes('medal'));
  persist ? ok('gear looted in battle survives reload') : fail('persistence');

  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
