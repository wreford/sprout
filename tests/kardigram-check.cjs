const { chromium } = require('playwright');
let jsQR=null;
try{ jsQR=require('/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/qrtest/node_modules/jsqr'); }catch(_){}
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:430,height:900},isMobile:true,hasTouch:true});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,150)));
  await p.goto('http://localhost:8899/kardigram/', {waitUntil:'domcontentloaded', timeout:60000});
  await p.waitForFunction(()=>window.KG);
  await p.waitForTimeout(800);

  const noimg = await p.evaluate(()=>document.querySelectorAll('img').length);
  noimg===0 ? ok('zero <img> elements anywhere') : fail('images found: '+noimg);

  const walk = await p.evaluate(async ()=>{
    localStorage.clear();
    KG.startWiz('physical');
    document.querySelector('[data-o="birthday"]').click();
    const s0=KG.state.step===0&&KG.state.headline==='Happy Birthday';
    document.getElementById('stNext').click();
    document.getElementById('fMsg').value='Happy birthday Grandma! Love you tons.';
    document.getElementById('fMsg').dispatchEvent(new Event('input'));
    document.getElementById('fUrl').value='https://youtube.com/watch?v=abc123';
    document.getElementById('fUrl').dispatchEvent(new Event('input'));
    document.querySelector('[data-i="wine"]').click();
    document.querySelector('[data-f="hand"]').click();
    document.getElementById('stNext').click();
    document.getElementById('rSender').value='Keira & Dad';
    document.getElementById('rSender').dispatchEvent(new Event('input'));
    document.getElementById('rName').value='Grandma';
    document.getElementById('rName').dispatchEvent(new Event('input'));
    document.getElementById('rStreet').value='42 Dundas St';
    document.getElementById('rStreet').dispatchEvent(new Event('input'));
    document.getElementById('rCity').value='London';
    document.getElementById('rCity').dispatchEvent(new Event('input'));
    document.getElementById('rProv').value='ON';
    document.getElementById('rProv').dispatchEvent(new Event('input'));
    document.getElementById('rPostal').value='N6A 1B5';
    document.getElementById('rPostal').dispatchEvent(new Event('input'));
    const nextOn=!document.getElementById('stNext').disabled;
    document.getElementById('stNext').click();
    const preview=document.querySelectorAll('#wizBody .pv').length===2;
    const qrInPreview=!!document.getElementById('pvQr');
    document.getElementById('stNext').click();
    await new Promise(r=>setTimeout(r,200));
    const sent=document.getElementById('sent').classList.contains('show');
    const order=KG.orders[0];
    return { s0, nextOn, preview, qrInPreview, sent,
      orderOk: order&&order.mode==='single'&&order.recipientName==='Grandma'&&order.ink==='wine' };
  });
  Object.entries(walk).every(([k,v])=>v) ? ok('physical flow: 4 steps, preview, QR, sent, order saved')
    : fail('walk: '+JSON.stringify(walk));

  const qr = await p.evaluate(()=>{
    const cvs=KG.qrCanvas('https://kardigram.co/test',400);
    return { data:[...cvs.getContext('2d').getImageData(0,0,400,400).data], w:400 };
  });
  if(jsQR){
    const dec=jsQR(new Uint8ClampedArray(qr.data),qr.w,qr.w);
    (dec&&dec.data==='https://kardigram.co/test') ? ok('QR round-trip decodes') : fail('QR: '+(dec?dec.data:'none'));
  } else console.log('  · jsQR unavailable, QR decode skipped');

  const pdf = await p.evaluate(async ()=>{
    const blob=await KG.makePDF({ headline:'Happy Birthday', message:'Test note\nwith two lines.',
      sender:'Keira', recipientName:'Grandma', attachUrl:'https://example.com/x', ink:'ocean', face:'serif' });
    const buf=new Uint8Array(await blob.arrayBuffer());
    let s=''; for(let i=0;i<buf.length;i+=0x8000) s+=String.fromCharCode.apply(null,buf.subarray(i,i+0x8000));
    return { size:buf.length, pages:(/\/Count (\d+)/.exec(s.slice(0,3000))||[])[1],
      dct:(s.match(/DCTDecode/g)||[]).length, eof:s.endsWith('%%EOF\n') };
  });
  (pdf.pages==='2'&&pdf.dct===2&&pdf.eof&&pdf.size>40000)
    ? ok('two-page typographic PDF: '+(pdf.size/1024|0)+'KB, /Count 2') : fail('pdf: '+JSON.stringify(pdf));

  const ecard = await p.evaluate(async ()=>{
    KG.startWiz('ecard');
    document.querySelector('[data-o="just"]').click();
    document.getElementById('stNext').click();
    document.getElementById('fMsg').value='Just thinking of you.';
    document.getElementById('fMsg').dispatchEvent(new Event('input'));
    document.getElementById('stNext').click();
    const noAddress=!document.getElementById('rStreet');
    document.getElementById('rSender').value='Keira';
    document.getElementById('rSender').dispatchEvent(new Event('input'));
    document.getElementById('rName').value='Ms. Chen';
    document.getElementById('rName').dispatchEvent(new Event('input'));
    document.getElementById('stNext').click();
    document.getElementById('stNext').click();
    await new Promise(r=>setTimeout(r,2500));
    return { noAddress, share:document.getElementById('shareModal').classList.contains('show'),
      order:KG.orders[0].mode==='virtual' };
  });
  (ecard.noAddress&&ecard.share&&ecard.order) ? ok('ecard flow: no address asked, share sheet with PDF, order saved')
    : fail('ecard: '+JSON.stringify(ecard));

  const again = await p.evaluate(async ()=>{
    document.getElementById('shareClose').click();
    document.getElementById('ordersBtn').click();
    const pdfBtn=document.querySelector('[data-pdf]'), reBtn=document.querySelector('[data-re]');
    return { pdfBtn:!!pdfBtn, reBtn:!!reBtn, count:KG.orders.length };
  });
  (again.pdfBtn&&again.reBtn&&again.count===2) ? ok('orders: reorder + PDF-again present, 2 orders')
    : fail('orders: '+JSON.stringify(again));

  const p2=await ctx.newPage(); const e2=[];
  p2.on('pageerror', e=>e2.push(e.message));
  await p2.goto('http://localhost:8899/kardigram/admin/',{waitUntil:'domcontentloaded'});
  await p2.waitForTimeout(1200);
  e2.length===0 ? ok('admin console loads clean') : fail('admin: '+e2.join('|').slice(0,150));
  await p2.close();

  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
