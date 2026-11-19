const S=require('./sprout3.js'),fs=require('fs');
const src=fs.readFileSync(process.argv[2],'utf8');
try{const c=S.load(src);c.run(S.BANG)}catch(e){console.log('ERROR',e.message,e.line||'');if(process.argv[3])console.log(e.stack)}
