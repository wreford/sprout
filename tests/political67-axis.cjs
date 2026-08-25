const { chromium } = require('playwright');
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({viewport:{width:430,height:900}})).newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,120)));
  await p.goto('http://localhost:8899/political67/', {waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.P67);
  const cases=[[-5.1,-5.9,'left','below'],[5,5,'right','above'],[-5,5,'left','above'],[5,-5,'right','below'],[0,0,'center','center']];
  for(const [e,s,hx,hy] of cases){
    const r = await p.evaluate(([e,s])=>{
      localStorage.removeItem('p67hist');
      document.getElementById('rcompass').innerHTML='';
      const W=340,cx=W/2,cy=W/2;
      const html=(()=>{ const fn=P67; return null; })();
      const sc={econ:e,soc:s,cert:0.2,answered:67,strong:10};
      lastResult={sc,v:P67.verdict(sc),short:false};
      document.getElementById('rcompass').innerHTML=compassSVG(e,s,false);
      const t=compassSVG.target;
      const cvs=P67.drawCard();
      const x=cvs.getContext('2d');
      return { px:t.px, py:t.py, cx, cy };
    },[e,s]);
    const okX = hx==='center'?Math.abs(r.px-r.cx)<1 : hx==='left'?r.px<r.cx : r.px>r.cx;
    const okY = hy==='center'?Math.abs(r.py-r.cy)<1 : hy==='above'?r.py<r.cy : r.py>r.cy;
    (okX&&okY) ? ok(`econ ${e}, soc ${s} → dot ${hx}/${hy==='above'?'upper (auth)':hy==='below'?'lower (lib)':'center'} ✓`)
      : fail(`(${e},${s}) px=${r.px.toFixed(0)} py=${r.py.toFixed(0)} expected ${hx}/${hy}`);
  }
  const card = await p.evaluate(()=>{
    const sc={econ:-5.1,soc:-5.9,cert:.2,answered:67,strong:10};
    lastResult={sc,v:P67.verdict(sc),short:false};
    const c=P67.drawCard();
    const x=c.getContext('2d');
    const cs=560,cx0=(1080-cs)/2,cy0=330,mid=cs/2;
    const px=cx0+mid+sc.econ/10*mid, py=cy0+mid-sc.soc/10*mid;
    const d=x.getImageData(Math.round(px),Math.round(py),1,1).data;
    return { goldAtDot: d[0]>180&&d[1]>130&&d[2]<120, py, mid: cy0+mid };
  });
  (card.goldAtDot&&card.py>card.mid) ? ok('PNG card: dot pixel is gold, below midline for libertarian') : fail('card: '+JSON.stringify(card));
  await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
