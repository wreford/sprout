const L=require('./live3.js'),S=require('./sprout3.js'),fs=require('fs');
const src=fs.readFileSync(process.argv[2]||'examples/sprout.sp','utf8');
const g=L.makeGame(src,{onEffect:e=>{eff[e[0]]=(eff[e[0]]||0)+1}});const eff={};
let x=180;
for(let f=0;f<1200;f++){
  if(f%40===0){x=40+Math.random()*280;g.down(x,300)} if(f%40===20)g.up();
  g.tick(1/60); if(f%300===0){const d=g.draw();console.log('frame',f,'draw calls',d.length)}
}
const s=g.state;const show=k=>S.fmt(s.field(k));
console.log('score',show('score'),'height',show('height'),'drops',s.field('drops').count(),'bugs',s.field('bugs').count(),'sparks',s.field('sparks').count(),'over',show('over'));
console.log('effects',JSON.stringify(eff));
