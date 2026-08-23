const { chromium } = require('playwright');
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:430,height:900},isMobile:true,hasTouch:true});
  const p = await ctx.newPage();
  const perr=[];
  p.on('pageerror', e=>perr.push(e.message));
  p.on('console', m=>{ if(m.type()==='error') perr.push('console: '+m.text().slice(0,120)); });
  await p.goto('http://localhost:8899/kardigram/', {waitUntil:'domcontentloaded', timeout:60000});
  await p.waitForTimeout(2500);
  ok('landing loaded, pageerrors so far: '+perr.length);
  perr.slice(0,6).forEach(e=>console.log('    ·', e.slice(0,160)));

  const hasWiz = await p.evaluate(()=>typeof startWiz==='function'&&typeof makeVirtualPDF==='function'&&typeof jpegBlobToPDF==='function');
  hasWiz ? ok('wizard + PDF functions present') : fail('missing core functions');

  const pdf = await p.evaluate(async ()=>{
    cart.occasion='birthday'; cart.designImg=location.origin+'/kardigram/hero.jpg';
    cart.designArtist='Test Artist'; cart.designTitle='Hero Test';
    cart.message='Happy birthday!\nThis is a canvas embed test with a couple of lines of text to wrap around and around.';
    cart.sender='Keira'; cart.recipient={name:'Grandma'};
    const blob=await makeVirtualPDF();
    const bytes=new Uint8Array(await blob.arrayBuffer());
    const head=String.fromCharCode(...bytes.slice(0,8));
    const tail=String.fromCharCode(...bytes.slice(-40));
    let txt=''; for(let i=0;i<Math.min(bytes.length,3000);i++) txt+=String.fromCharCode(bytes[i]);
    return { size:bytes.length, head, tailHasEOF:tail.includes('%%EOF'), hasDCT:txt.includes('DCTDecode'), hasPage:txt.includes('/Type /Page') };
  });
  (pdf.head.startsWith('%PDF-1.4')&&pdf.tailHasEOF&&pdf.hasDCT&&pdf.size>60000)
    ? ok('virtual PDF with same-origin art: '+(pdf.size/1024|0)+'KB, valid header/EOF/DCTDecode')
    : fail('pdf: '+JSON.stringify(pdf));

  const pdf2 = await p.evaluate(async ()=>{
    cart.designImg='https://images.metmuseum.org/CRDImages/ep/original/DT1567.jpg';
    const blob=await makeVirtualPDF();
    return { size:blob.size };
  });
  console.log('  · remote-art PDF (blocked host, placeholder path): '+(pdf2.size/1024|0)+'KB');

  for(const path of ['/kardigram/admin/','/kardigram/artist/']){
    const p2=await ctx.newPage(); const e2=[];
    p2.on('pageerror', e=>e2.push(e.message));
    await p2.goto('http://localhost:8899'+path,{waitUntil:'domcontentloaded'});
    await p2.waitForTimeout(1200);
    e2.length===0 ? ok(path+' loads clean') : fail(path+' errors: '+e2.join(' | ').slice(0,200));
    await p2.close();
  }
  console.log('\nPAGE ERRORS: '+perr.length);
  await ctx.close(); await b.close();
  process.exit(errs.length?1:0);
})();
