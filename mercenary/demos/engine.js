// Mercenary Keep demo framework: the game-engine half (mk.js holds art, sound and UI).
// Load order: roster.js, mk.js, engine.js. Everything hangs off MK so demos read MK.grid.path(...), MK.loop(...), etc.
"use strict";
(()=>{
const {$,sfx}=MK;
const wait=ms=>new Promise(r=>setTimeout(r,ms));

// ---- seeded random (mulberry32): same seed, same dungeon
function rng(seed){let a=(seed>>>0)||1;const f=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 f.int=(lo,hi)=>lo+Math.floor(f()*(hi-lo+1));f.pick=a=>a[Math.floor(f()*a.length)];f.chance=p=>f()<p;
 f.shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(f()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};return f}

// ---- square grids. cost(x,y) returns a move cost, or Infinity for a wall
const D4=[[1,0],[-1,0],[0,1],[0,-1]],D8=[...D4,[1,1],[1,-1],[-1,1],[-1,-1]];
const key=(x,y)=>x+","+y,unkey=k=>k.split(",").map(Number);
// a tiny binary heap keyed on .p
function heap(){const h=[];return{get size(){return h.length},push(v,p){h.push({v,p});let i=h.length-1;while(i){const j=(i-1)>>1;if(h[j].p<=h[i].p)break;[h[i],h[j]]=[h[j],h[i]];i=j}},
 pop(){const top=h[0],last=h.pop();if(h.length){h[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<h.length&&h[l].p<h[m].p)m=l;if(r<h.length&&h[r].p<h[m].p)m=r;if(m===i)break;[h[i],h[m]]=[h[m],h[i]];i=m}}return top.v}}}
const grid={D4,D8,key,unkey,
 inb:(W,H,x,y)=>x>=0&&y>=0&&x<W&&y<H,
 md:(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y),
 cheb:(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y)),
 // every tile reachable from (sx,sy) within budget: Map "x,y" -> cost spent
 reach(sx,sy,budget,cost,dirs){const R=new Map([[key(sx,sy),0]]),Q=heap();Q.push([sx,sy],0);
  while(Q.size){const [x,y]=Q.pop(),c0=R.get(key(x,y));for(const [dx,dy] of dirs||D4){const nx=x+dx,ny=y+dy,c=c0+cost(nx,ny,x,y);if(!(c<=budget))continue;const k=key(nx,ny);if(!R.has(k)||R.get(k)>c){R.set(k,c);Q.push([nx,ny],c)}}}return R},
 // cheapest path from start to goal (A*), excluding the start tile; [] if none. max caps the cost searched
 path(sx,sy,tx,ty,cost,dirs,max){dirs=dirs||D4;const h=dirs===D8?(x,y)=>Math.max(Math.abs(x-tx),Math.abs(y-ty)):(x,y)=>Math.abs(x-tx)+Math.abs(y-ty);
  const G=new Map([[key(sx,sy),0]]),prev=new Map(),Q=heap();Q.push([sx,sy],h(sx,sy));let n=0;
  while(Q.size&&n++<4000){const [x,y]=Q.pop();if(x===tx&&y===ty)break;const c0=G.get(key(x,y));for(const [dx,dy] of dirs){const nx=x+dx,ny=y+dy,c=c0+cost(nx,ny,x,y);if(!(c<=(max??Infinity)))continue;const k=key(nx,ny);if(!G.has(k)||G.get(k)>c){G.set(k,c);prev.set(k,[x,y]);Q.push([nx,ny],c+h(nx,ny))}}}
  const p=[];let k=key(tx,ty);while(prev.has(k)){p.unshift(unkey(k));const q=prev.get(k);k=key(q[0],q[1])}return p},
 // flood distances from many sources (for monsters that chase the player); walls give Infinity
 flow(srcs,cost,W,H){const D=new Float32Array(W*H).fill(Infinity),Q=heap();srcs.forEach(([x,y])=>{D[y*W+x]=0;Q.push([x,y],0)});
  while(Q.size){const [x,y]=Q.pop(),c0=D[y*W+x];for(const [dx,dy] of D8){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const c=c0+cost(nx,ny);if(c<D[ny*W+nx]){D[ny*W+nx]=c;Q.push([nx,ny],c)}}}return D},
 // field of view by ray casting: returns a Set of "x,y" the eye at (ox,oy) can see within r
 fov(ox,oy,r,opaque){const S=new Set([key(ox,oy)]),N=Math.ceil(2*Math.PI*r*1.6);for(let i=0;i<N;i++){const a=i/N*2*Math.PI,dx=Math.cos(a),dy=Math.sin(a);let x=ox+.5,y=oy+.5;
  for(let s=0;s<r;s++){x+=dx;y+=dy;const tx=Math.floor(x),ty=Math.floor(y);if(Math.hypot(tx-ox,ty-oy)>r)break;S.add(key(tx,ty));if(opaque(tx,ty))break}}return S},
 // Bresenham line, for line of sight and arrows
 line(x0,y0,x1,y1){const p=[],dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;for(;;){p.push([x0,y0]);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx}if(e2<=dx){e+=dx;y0+=sy}}return p}};

// ---- node graphs (campaign maps): adjacency {a:[b,c]}
const graph={
 adj(edges){const A={};edges.forEach(([a,b])=>{(A[a]=A[a]||[]).push(b);(A[b]=A[b]||[]).push(a)});return A},
 // fewest hops from a to b; blocked(n) skips nodes; [] if unreachable. The result excludes a
 path(A,a,b,blocked){const prev={},Q=[a],seen=new Set([a]);while(Q.length){const x=Q.shift();if(x===b)break;for(const y of A[x]||[]){if(seen.has(y)||(blocked&&y!==b&&blocked(y)))continue;seen.add(y);prev[y]=x;Q.push(y)}}
  const p=[];let k=b;while(k!==undefined&&k!==a){p.unshift(k);k=prev[k]}return k===a?p:[]}};

// ---- the frame loop: fixed max dt, speed multiplier, pauses itself while the tab is hidden
function loop(update,render,o){o=o||{};const L={speed:1,running:true,t:0,stop(){L.running=false}};let last=performance.now();
 function f(t){if(!L.running)return;const dt=Math.min(o.maxDt||.05,(t-last)/1000||0)*L.speed;last=t;L.t+=dt;if(!document.hidden){update&&update(dt,L);render&&render(L)}requestAnimationFrame(f)}
 requestAnimationFrame(f);return L}

// ---- input: held keys plus an optional on-screen pad for phones
// MK.input({up:["arrowup","w"],...},{atk:fn}) -> {keys, held(name)}
const DEFKEYS={up:["arrowup","w"],down:["arrowdown","s"],left:["arrowleft","a"],right:["arrowright","d"],atk:[" ","j","enter"],wait:[".","z"]};
function input(map,press){map=map||DEFKEYS;press=press||{};const K={},rev={};for(const n in map)map[n].forEach(k=>rev[k]=n);
 addEventListener("keydown",e=>{if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")return;const n=rev[e.key.toLowerCase()];if(!n)return;e.preventDefault();if(!K[n]&&press[n])press[n](e);if(!e.repeat||!press[n])K[n]=true;if(press.any)press.any(n,e)});
 addEventListener("keyup",e=>{const n=rev[e.key.toLowerCase()];if(n)K[n]=false});addEventListener("blur",()=>{for(const n in K)K[n]=false});
 return{keys:K,held:n=>!!K[n],
  // touch pad: a d-pad on the left and action buttons on the right; shown only on touch screens
  pad(actions,o){o=o||{};const P=document.createElement("div");P.className="mkpad"+(o.always?" on":"");
   P.innerHTML=`<div class="dp">${["","up","","left","","right","","down",""].map(d=>d?`<button data-k="${d}">${{up:"▲",down:"▼",left:"◀",right:"▶"}[d]}</button>`:"<span></span>").join("")}</div><div class="ac">${(actions||[]).map(([n,t])=>`<button class="ab" data-k="${n}">${t}</button>`).join("")}</div>`;
   document.body.appendChild(P);P.querySelectorAll("[data-k]").forEach(b=>{const n=b.dataset.k;
    b.addEventListener("pointerdown",e=>{e.preventDefault();if(press[n])press[n](e);K[n]=true;if(press.any)press.any(n,e);if(o.repeat&&o.repeat.includes(n)){clearInterval(b._r);b._r=setInterval(()=>{if(K[n]&&press[n])press[n](e)},o.rate||180)}});
    ["pointerup","pointerleave","pointercancel"].forEach(ev=>b.addEventListener(ev,()=>{K[n]=false;clearInterval(b._r)}))});return P}}}

// ---- canvas helpers
function canvas(cv,w,h){cv.width=w;cv.height=h;const g=cv.getContext("2d");g.imageSmoothingEnabled=false;return g}
// draw a (team-coloured, optionally flipped) sprite centred on x, feet on y
function sprite(g,path,side,x,y,scale,flip,alpha){const c=side==null?MK.img(path):MK.tc(path,side);if(!c||(c.naturalWidth===0))return false;const w=(c.naturalWidth||c.width)*(scale||1),h=(c.naturalHeight||c.height)*(scale||1);
 g.save();if(alpha!=null)g.globalAlpha=alpha;if(flip){g.translate(x,0);g.scale(-1,1);g.drawImage(c,-w/2,y-h*.8,w,h)}else g.drawImage(c,x-w/2,y-h*.8,w,h);g.restore();return true}
function tile(g,path,x,y,s){const i=MK.img(path);if(MK.ok(i)){g.drawImage(i,x,y,s,s);return true}return false}
// a small HP bar drawn on canvas
function bar(g,x,y,w,frac,ally){g.fillStyle="#000";g.fillRect(x-1,y-1,w+2,6);g.fillStyle=ally?"#5fbf4a":"#e2584a";g.fillRect(x,y,w*Math.max(0,Math.min(1,frac)),4)}

// ---- DOM effects shared by card and turn-based screens
const fx={
 restart(el,cls){if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls)},
 shake(el){fx.restart(el,"shake")},
 lunge(el,dx){if(!el)return;el.style.transition="transform .12s";el.style.transform=`translate(${dx||0}px,${dx?0:-14}px)`;setTimeout(()=>el.style.transform="",200)},
 // floating number over an element, inside a positioned container
 pop(el,txt,cls,box){if(!el)return;box=box||el.offsetParent||document.body;const r=el.getBoundingClientRect(),s=box.getBoundingClientRect(),d=document.createElement("div");d.className="flt "+(cls||"");d.textContent=txt;
  d.style.left=(r.left-s.left+r.width/2)+"px";d.style.top=(r.top-s.top+r.height*.2)+"px";box.appendChild(d);setTimeout(()=>d.remove(),900)}};

// ---- turn-based combat maths every demo can agree on
const combat={
 // chance to hit, 5..95
 hit:(acc,avo)=>Math.max(5,Math.min(95,acc-avo)),
 roll:p=>Math.random()*100<p,
 // damage after armour, never below 1, with +/-15% spread unless exact
 dmg:(atk,def,exact)=>Math.max(1,Math.round((atk-(def||0))*(exact?1:.85+Math.random()*.3))),
 xpToLevel:lv=>8+lv*6};

// ---- end screens: one call for win, lose and between-floor summaries
function ending(o){MK.modal(`${o.img?`<img src="${o.img}" alt="" style="max-height:140px;image-rendering:pixelated">`:""}<h2>${o.title}</h2>${o.text?`<p>${o.text}</p>`:""}<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">${(o.buttons||[]).map((b,i)=>`<button class="btn ${i?"alt":""}" id="mkEnd${i}">${b[0]}</button>`).join("")}</div>`);
 (o.buttons||[]).forEach((b,i)=>$("mkEnd"+i).onclick=()=>{MK.closeModal();b[1]&&b[1]()});if(o.music)MK.playMusic(o.music);if(o.sfx)sfx(o.sfx)}

// ---- small state machine for screens (map -> battle -> reward ...)
function scenes(defs){const S={cur:null,data:null,go(n,d){if(S.cur&&defs[S.cur].exit)defs[S.cur].exit();S.cur=n;S.data=d;defs[n].enter&&defs[n].enter(d)}};return S}

Object.assign(MK,{wait,rng,grid,graph,loop,input,canvas,sprite,tile,bar,fx,combat,ending,scenes,heap});
})();
