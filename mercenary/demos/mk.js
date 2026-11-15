// Mercenary Keep demos: shared helpers. Art and audio: Battle for Wesnoth (GNU GPL v2+), see ../CREDITS.txt
"use strict";
const MK=(()=>{
const IMG=p=>"../img/"+p;
const $=id=>document.getElementById(id);
const rnd=(a,b)=>a+Math.random()*(b-a),ri=(a,b)=>Math.floor(rnd(a,b+1)),pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const U={};ROSTER.forEach(r=>U[r.id]=r);
const unit=id=>U[id];
// ---- images: loaded once, recoloured by team (blue = you, red = them) on the Wesnoth magenta palette
const IM={},MAG=["3F0016","55002A","690039","7B0045","8C0051","9E005D","B10069","C30074","D6007F","EC008C","EE3D96","EF5BA1","F172AC","F287B6","F49AC1","F6ADCD","F8C1D9","FAD5E5","FDE9F1"];
const MAGSET=new Map(MAG.map(h=>{const v=parseInt(h,16);return [v,((v>>16)+((v>>8)&255)+(v&255))/3]}));
const TEAM=[[44,92,190],[196,36,32],[80,160,70],[200,160,40]];
function img(p,cb){if(IM[p]){if(cb){if(IM[p].complete&&IM[p].naturalWidth)cb(IM[p]);else IM[p].addEventListener("load",()=>cb(IM[p]))}return IM[p]}const i=new Image();i.src=IMG(p);IM[p]=i;if(cb)i.addEventListener("load",()=>cb(i));return i}
const ok=i=>i&&i.complete&&i.naturalWidth>0;
const TC={};
function tc(p,side){const k=p+"|"+side;if(TC[k])return TC[k];const im=img(p);if(!ok(im))return null;const c=document.createElement("canvas");c.width=im.naturalWidth;c.height=im.naturalHeight;const q=c.getContext("2d");q.drawImage(im,0,0);
 try{const d=q.getImageData(0,0,c.width,c.height),a=d.data,[R,G,B]=TEAM[side||0],mid=125.3;for(let i=0;i<a.length;i+=4){if(!a[i+3])continue;const L=MAGSET.get((a[i]<<16)|(a[i+1]<<8)|a[i+2]);if(L===undefined)continue;
  if(L<=mid){const k=L/mid;a[i]=R*k;a[i+1]=G*k;a[i+2]=B*k}else{const k=(L-mid)/(255-mid);a[i]=R+(255-R)*k;a[i+1]=G+(255-G)*k;a[i+2]=B+(255-B)*k}}q.putImageData(d,0,0)}catch(e){}
 return TC[k]=c}
const URL_={};
// a data URL of a team-coloured sprite, for <img> tags; falls back to the raw file until it has loaded
function spriteURL(p,side,cb){const k=p+"#"+(side||0);if(URL_[k])return URL_[k];img(p,()=>{const c=tc(p,side);if(c){try{URL_[k]=c.toDataURL()}catch(e){URL_[k]=IMG(p)}if(cb)cb(URL_[k])}});return IMG(p)}
function sprImg(p,side,cls){const id="s"+Math.random().toString(36).slice(2);const u=spriteURL(p,side,url=>{const e=document.getElementById(id);if(e)e.src=url});return `<img id="${id}" class="spr ${cls||""}" src="${u}" alt="">`}
const portrait=u=>u.pt[0]==="!"?IMG(u.pt.slice(1)):IMG("portraits/"+u.pt+".webp");
function preload(paths,done){let n=paths.length;if(!n){done&&done();return}paths.forEach(p=>img(p,()=>{tc(p,0);tc(p,1);if(--n===0&&done)done()}));setTimeout(()=>{if(n>0&&done){n=-1;done()}},4000)}
// ---- sound: lazy-loaded Web Audio buffers, plus streamed music
let AC=null,sOn=true;const BUF={},LOAD={};
try{sOn=localStorage.getItem("mk.demoSnd")!=="0"}catch(e){}
function initAudio(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}
["pointerdown","keydown"].forEach(ev=>addEventListener(ev,()=>{initAudio();if(AC&&AC.state==="suspended")AC.resume()},{once:false,passive:true}));
function loadSnd(n){if(LOAD[n]||!AC)return;LOAD[n]=1;fetch("../audio/"+n+".mp3").then(r=>r.arrayBuffer()).then(b=>AC.decodeAudioData(b)).then(b=>BUF[n]=b).catch(()=>{})}
function sfx(n,vol){if(!sOn||!AC)return;const b=BUF[n];if(!b){loadSnd(n);return}try{const s=AC.createBufferSource(),g=AC.createGain();s.buffer=b;g.gain.value=vol||.6;s.connect(g);g.connect(AC.destination);s.start()}catch(e){}}
const WSND={spear:"spear",lance:"spear",bow:"bow","bow-elven":"bow","bow-orcish":"bow",crossbow:"bow","magic-missile":"magic-missile-1",lightbeam:"magic-holy-1","dark-missile":"magic-dark","faerie-fire":"magic-faeriefire",curse:"lightning",entangle:"entangle","fire-breath-drake":"flame-big",fireball:"flame-big","fire-blast":"flame-big",axe:"axe",battleaxe:"axe","axe-undead":"axe",club:"club","hammer-troll":"club","crush-wose":"club",mace:"mace","fangs-animal":"bite","fangs-ant":"bite","fangs-spider":"bite","fangs-rodent":"bite",claws:"claws","claws-undead":"claws","claws-animal":"claws","touch-zombie":"squishy-hit","dagger-human":"knife","dagger-thrown-poison-orcish":"throwing-knife",thunderstick:"thunderstick",sling:"throwing-knife","spear-orcish":"spear"};
const VOICE={beast:["bite","groan"],human:["human-hit-1","human-die-1"],femme:["human-female-hit-1","human-female-die-1"],elf:["elf-hit-1","human-die-1"],orc:["orc-hit-1","orc-die-1"],goblin:["goblin-hit-1","goblin-die-1"],troll:["troll-hit-1","troll-die-1"],skel:["skeleton-hit-1","skeleton-die-1"],zombie:["squishy-hit","groan"],lich:["lich-hit-1","lich-die"],dwarf:["dwarf-hit-1","dwarf-die-1"],drake:["drake-hit-1","drake-die"],hiss:["hiss-hit","hiss-die"],wose:["groan","groan"],gryph:["gryphon-shriek-1","gryphon-shriek-1"]};
const atkSnd=u=>WSND[u.wp]||"sword-1";
const hitSnd=u=>(VOICE[u.voice]||VOICE.human)[0],dieSnd=u=>(VOICE[u.voice]||VOICE.human)[1];
let music=null,mOn=true;try{mOn=localStorage.getItem("mk.demoMus")!=="0"}catch(e){}
function playMusic(t,vol){if(music&&music._t===t)return;if(music){const m=music;fade(m,0,500,()=>m.pause())}music=null;if(!mOn||!t)return;const a=new Audio("../audio/m-"+t+".mp3");a._t=t;a.loop=true;a.volume=0;music=a;
 const go=()=>a.play().then(()=>fade(a,vol||.35,900)).catch(()=>{});go();addEventListener("pointerdown",function f(){if(a.paused&&music===a)go();removeEventListener("pointerdown",f)})}
function fade(a,v,ms,done){const s=a.volume,t0=performance.now();const iv=setInterval(()=>{const k=Math.min(1,(performance.now()-t0)/ms);a.volume=s+(v-s)*k;if(k>=1){clearInterval(iv);done&&done()}},40)}
function soundToggle(btn){const draw=()=>btn.textContent=sOn?"♪ on":"♪ off";draw();btn.onclick=()=>{sOn=!sOn;mOn=sOn;try{localStorage.setItem("mk.demoSnd",sOn?"1":"0");localStorage.setItem("mk.demoMus",mOn?"1":"0")}catch(e){}if(!mOn&&music){music.pause();music=null}draw()}}
// ---- storage
const ls={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
// ---- the top bar every demo shares
const DEMOS=[["deck","The Gauntlet","Deckbuilder"],["jrpg","Ballad of the Keep","JRPG"],["quest","Hollow Woods","Action adventure"],["tactics","Ford of Ashes","Tactics"],["idle","The Ledger","Idle"],["march","March of Banners","Squad campaign"],["saga","Mercenary Saga","The combo"],["crawl","The Undercroft","Dungeon crawl"],["keep3d","Siege of Gravenhold","First-person shooter"],["drums","War Drums","Rhythm"],["quill","Quill & Blade","Typing defense"],["trebuchet","Trebuchet","Physics siege"],["gate","The Gatekeeper","Paperwork"],["contract","Contract Night","Dating sim"],["ashvale","Banners of Ashvale","Hex strategy"],["qa","QA Tester","Rank & feedback"]];
function topbar(cur){const d=DEMOS.find(x=>x[0]===cur);const b=document.createElement("header");b.className="mkbar";
 b.innerHTML=`<a class="back" href="../index.html">‹ Keep</a><b>${d?d[1]:""}</b><small>${d?d[2]:""} demo</small><span class="sp"></span><button class="mini" id="mkSnd"></button><select class="mini" id="mkNav" aria-label="Other demos">${DEMOS.map(x=>`<option value="${x[0]}" ${x[0]===cur?"selected":""}>${x[1]}</option>`).join("")}</select>`;
 document.body.prepend(b);soundToggle($("mkSnd"));$("mkNav").onchange=e=>location.href=e.target.value+".html"}
function toast(t,ms){let e=$("mkToast");if(!e){e=document.createElement("div");e.id="mkToast";document.body.appendChild(e)}e.innerHTML=t;e.classList.add("on");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove("on"),ms||1800)}
function modal(html,cls){let m=$("mkModal");if(!m){m=document.createElement("div");m.id="mkModal";document.body.appendChild(m)}m.className="on "+(cls||"");m.innerHTML=`<div class="box frame">${html}</div>`;return m}
function closeModal(){const m=$("mkModal");if(m)m.className=""}
function floatText(parent,txt,cls){const e=document.createElement("div");e.className="flt "+(cls||"");e.textContent=txt;parent.appendChild(e);setTimeout(()=>e.remove(),900)}
return {IMG,$,rnd,ri,pick,clamp,shuffle,unit,ROSTER,img,ok,tc,spriteURL,sprImg,portrait,preload,sfx,atkSnd,hitSnd,dieSnd,playMusic,ls,topbar,toast,modal,closeModal,floatText,DEMOS,TEAM}})();
