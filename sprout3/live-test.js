const L=require('./live3.js'),S=require('./sprout3.js'),fs=require('fs');
S.setLog(()=>{});
const src=fs.readFileSync('examples/sprout.sp','utf8');
const g=L.makeGame(src);
g.down(100,300);for(let f=0;f<200;f++)g.tick(1/60);
// replay: frame 150 re-run with its recorded random numbers gives the same next state
const i=150,a=S.format(g.history[i+1].state),b=S.format(g.replayFrom(i,1/60));
console.log('replay identical:',a===b);
// rewind is free: old states are untouched values
const before=S.format(g.history[50].state);g.rewind(50);for(let f=0;f<30;f++)g.tick(1/60);
console.log('history kept its old states:',S.format(g.history[50].state)===before);
// hot-swap: change update code only -> score and drops carry over
const sc=g.state.field('score'),dn=g.state.field('drops').count();
g.swap(src.replace('beep [880, 0.06]','beep [440, 0.06]'));
console.log('code swap keeps state:',g.state.field('score')===sc&&g.state.field('drops').count()===dn);
// change a starting value -> that field takes the new value, others carry over
g.swap(src.replace('height : 40','height : 90'));
console.log('start change takes new value:',g.state.field('height')===90,'score kept:',g.state.field('score')===sc);
g.tick(1/60);console.log('runs after swap:',typeof g.state.field('score'));
