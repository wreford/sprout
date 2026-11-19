const S3=require('./sprout3.js');const O=require('./old-sprout2.js');const L=require('./live3.js');const fs=require('fs');
S3.setLog(()=>{});S3.setOut(()=>{});
const best=(f,n=5)=>{let b=1e9,r;for(let i=0;i<n;i++){const t=performance.now();r=f();b=Math.min(b,performance.now()-t)}return [b,r]};
function old(src){const js=O.SproutToJS.compile(src);const R=O.SproutRuntime;const names=Object.keys(R);
  const fn=new Function(...names,'prnt','v_print',js+';\nreturn typeof v_result!=="undefined"?v_result:null');return ()=>fn(...names.map(k=>R[k]),x=>x,x=>x)}
const B={
 fib:{s3:`fib : [n | n < 2 [n] else [fib (n - 1) + (fib (n - 2))]]\nresult : fib 25`,
      old:`fib : [n | n < 2 [n, (fib (n - 1)) + (fib (n - 2))]]\nresult : fib 25`,
      js:()=>{const f=n=>n<2?n:f(n-1)+f(n-2);return f(25)}},
 fold:{s3:`result : range 1000000 fold [0, [t n | t + n]]`,
      old:`xs : range 1000000\nresult : xs fold 0 [t, x | t + x]`,
      js:()=>{let t=0;for(let i=1;i<=1e6;i++)t+=i;return t}},
 records:{s3:`step : [rs | rs collect [r | r with [y : r y + 1]] keep [r | r y > 0]]
go : [rs k | k = 0 [rs] else [go [step rs, k - 1]]]
result : go [range 10000 collect [n | [x : n, y : 0]], 20] length`,
      old:`rs : range 10000 collect [{x : _, y : 0}]
20 times [rs := rs collect [r | {x : r.x, y : r.y + 1}]]
result : rs length`,
      js:()=>{let rs=[];for(let i=1;i<=1e4;i++)rs.push({x:i,y:0});for(let k=0;k<20;k++)rs=rs.map(r=>({...r,y:r.y+1})).filter(r=>r.y>0);return rs.length}},
};
const rows=[];
for(const [name,b] of Object.entries(B)){
  const c3=S3.load(b.s3);const r3=best(()=>{c3._a=null;return c3.field("result")},9);
  const fo=old(b.old);const ro=best(fo,9);const rj=best(b.js,9);
  rows.push([name,r3[0].toFixed(1),ro[0].toFixed(1),rj[0].toFixed(2),S3.fmt(r3[1]),String(ro[1]),String(rj[1])]);
}
// game: ms per frame
const src=fs.readFileSync('examples/sprout.sp','utf8');
const g=L.makeGame(src);g.down(100,300);for(let f=0;f<300;f++)g.tick(1/60);
const [gt]=best(()=>{for(let f=0;f<1000;f++){g.tick(1/60);g.draw()}},9);
rows.push(['game x1000',gt.toFixed(1),'','','ms/frame '+(gt/1000).toFixed(3),'','']);
console.log('bench        sprout3(ms) old2.0(ms) js(ms)   results s3 / old / js');
for(const r of rows)console.log(r[0].padEnd(12),r[1].padStart(10),r[2].padStart(10),r[3].padStart(8),'  ',r[4],'/',r[5],'/',r[6]);
