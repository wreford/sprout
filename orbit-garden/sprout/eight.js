// SPROUT·8 (decision 113): an 8-bit games console for Sprout. A page calls Eight.start({ game: "examples/x.sp" }) and
// gets a 256x192 screen whose colours are snapped to 64 (red, green and blue each at one of four levels), pixel art
// drawn with sprite and tiles, an 8x8 pixel font, square waves and hiss, a song player, and a D-pad with two buttons
// from the keys, the touch screen or a controller. Sprout's game layer (live3.js) runs the game sixty times a second.
//
// What a game can use beyond the 2D words:
//   sprite [art, x, y, ink, flip, scale]   art is rows of text, ink a record from letter to colour ("." is clear)
//   tiles [map, set, ink, x, y]     map is rows of text, set a list of [character, art]; drawn whole, cached
//   hiss [length, pitch]            the noise channel; beep [frequency, length] is the square wave
//   song : "name" in the state      plays songs's song of that name: [bpm, beats, lead, bass, drums, once]
//   keep : [...] in the state       saved on this phone, and handed back next time as saved
//   held keys: left, right, up, down, one, two
// SPROUT·16 (decision 125): Eight.start({ bits: 16 }) makes the same console a 16-bit one: a 320x224 screen, colours
// snapped to 512 (eight levels of red, green and blue), and songs played with a warmer sawtooth lead through a filter,
// with a little echo. Everything else is the same, so a game moves up by changing one number.
// SPROUT·256 (decision 134): Eight.start({ bits: 256 }) is the handheld a 1995 designer drew for 2025: a 480x270 screen in
// true colour (rgba colours too), every bright pixel glowing (a bloom the shell adds), faint scanlines, sprites that turn
// and zoom (sprite [art, x, y, ink, flip, scale, turn], the turn in whole turns), four buttons in an arc (one, two,
// three and four: Z X C V), a boot screen with a big logo and a jingle, and a MEMORY light that shows when the game saves.
(function (root) {
"use strict";
const S = root.Sprout3, LIVE = root.Sprout3Live;
let W = 256, H = 192, LEVELS = 4, BITS = 8;
// SPROUT·NOW (decision 145): "modern" draws smooth, sharp and in true colour, with no handheld round the screen
let STYLE = "retro";
const STEP = 1 / 60;

// ---------------------------------------------------------------- the console's look
const CSS = `
@font-face{font-family:"Press Start 2P";src:url("vendor/fonts/press-start-2p.woff2") format("woff2");font-display:block}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;touch-action:none}
html,body{margin:0;height:100%;background:#09090c;color:#d9d9e0;overflow:hidden;font:13px/1.4 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  -webkit-user-select:none;user-select:none;-webkit-touch-callout:none;overscroll-behavior:none}
#e8{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  background:radial-gradient(110% 80% at 50% 10%,var(--page2),var(--page) 72%);padding:max(8px,env(safe-area-inset-top)) 8px max(8px,env(safe-area-inset-bottom))}
/* the handheld: a portrait body with the big rounded corner, the screen in its bezel, the maker's plate, the controls */
#e8 .gb{position:relative;width:min(94vw,calc((100vh - 64px) * 0.62));aspect-ratio:62/100;display:grid;grid-template-columns:1fr 1fr;
  grid-template-rows:auto auto auto 1fr auto;grid-template-areas:"top top" "bezel bezel" "brand brand" "dpad btns" "pills pills";
  background:linear-gradient(165deg,var(--body) 0%,var(--body) 55%,var(--body2) 100%);border-radius:16px 16px 74px 16px;padding:0 0 30px;
  box-shadow:inset 0 2px 0 #ffffff44,inset 0 -4px 0 #00000040,inset 4px 0 0 #ffffff18,inset -4px 0 0 #00000024,0 24px 60px #000a}
#e8 .top{grid-area:top;display:flex;align-items:center;gap:8px;padding:10px 16px 8px;font:7px "Press Start 2P",monospace;color:var(--ink);letter-spacing:1px}
#e8 .top i{flex:1;height:2px;border-radius:1px;background:#00000030;box-shadow:0 1px 0 #ffffff33}
#e8 .bezel{grid-area:bezel;position:relative;margin:0 7%;padding:26px 5% 18px 13%;background:var(--bezel);border-radius:10px 10px 44px 10px;
  box-shadow:inset 0 2px 7px #0009,0 1px 0 #ffffff33;display:flex;align-items:center;justify-content:center}
#e8 .bezel .lines{position:absolute;left:12px;right:12px;top:10px;display:flex;align-items:center;gap:7px;font:6px "Press Start 2P",monospace;color:var(--bezel-ink);white-space:nowrap}
#e8 .bezel .lines i{height:2px;flex:1;background:var(--s1);box-shadow:0 4px 0 var(--s2)}
#e8 .screen{position:relative;line-height:0}
#e8 .screen canvas{display:block;image-rendering:pixelated;image-rendering:crisp-edges;background:#000;border-radius:2px;box-shadow:0 0 0 2px #0009}
#e8 .led{position:absolute;left:3.6%;top:44%;display:flex;flex-direction:column;align-items:center;gap:5px;font:5px "Press Start 2P",monospace;color:var(--bezel-ink)}
#e8 .led i{width:7px;height:7px;border-radius:50%;background:#ff3b30;box-shadow:0 0 7px #ff3b30}
#e8 .brand{grid-area:brand;display:flex;align-items:center;gap:10px;padding:12px 9% 0;min-width:0}
#e8 .brand .logo{font:var(--logo-weight) var(--logo-size)/1 var(--brand),system-ui,sans-serif;font-style:var(--logo-style);letter-spacing:var(--logo-track);color:var(--logo);
  text-shadow:0 1px 0 #ffffff44,0 -1px 0 #00000033;white-space:nowrap}
#e8 .brand .sub{font:italic 800 11px/1 -apple-system,system-ui,sans-serif;color:var(--sub);letter-spacing:2px;align-self:flex-end;padding-bottom:3px;white-space:nowrap}
#e8 .brand .mascot{margin-left:auto;width:48px;height:48px;image-rendering:pixelated;flex:0 0 auto}
#e8 .dpad{grid-area:dpad;justify-self:center;align-self:center;position:relative;width:118px;height:118px}
#e8 .dpad i{position:absolute;background:var(--dpad);box-shadow:inset 0 2px 0 #ffffff22,0 3px 0 #0008;border-radius:5px}
#e8 .dpad .h{left:0;right:0;top:39px;height:40px}#e8 .dpad .v{top:0;bottom:0;left:39px;width:40px}
#e8 .dpad .c{left:50px;top:50px;width:18px;height:18px;border-radius:50%;background:#0003;box-shadow:inset 0 2px 3px #0006}
#e8 .dpad.on-left .h{box-shadow:inset 14px 0 0 #ffffff2a}#e8 .dpad.on-right .h{box-shadow:inset -14px 0 0 #ffffff2a}
#e8 .dpad.on-up .v{box-shadow:inset 0 14px 0 #ffffff2a}#e8 .dpad.on-down .v{box-shadow:inset 0 -14px 0 #ffffff2a}
#e8 .btns{grid-area:btns;justify-self:center;align-self:center;display:flex;gap:16px;align-items:flex-end;transform:rotate(-24deg)}
#e8 .btn{width:58px;height:58px;border-radius:50%;background:radial-gradient(circle at 36% 30%,#ffffff55,transparent 46%),var(--btn);
  box-shadow:inset 0 -4px 0 #0004,0 4px 0 #0007,0 0 0 4px #00000022;display:flex;align-items:center;justify-content:center;font:12px "Press Start 2P",monospace;color:var(--btn-ink)}
#e8 .btn.down{transform:translateY(3px);box-shadow:inset 0 -1px 0 #0004,0 1px 0 #0007,0 0 0 4px #00000022}
#e8 .btn.two{margin-bottom:30px}
#e8 .pills{grid-area:pills;display:flex;gap:20px;justify-content:center;padding:4px 0 0}
#e8 .pill{transform:rotate(-24deg);display:flex;flex-direction:column;align-items:center;gap:6px;font:6px "Press Start 2P",monospace;color:var(--ink)}
#e8 .pill b{display:block;width:46px;height:12px;border-radius:7px;background:var(--pill);box-shadow:inset 0 -2px 0 #0005,0 1px 0 #ffffff33}
#e8 .grille{position:absolute;right:24px;bottom:24px;display:flex;gap:7px;transform:rotate(-28deg);pointer-events:none}
#e8 .grille i{width:5px;height:44px;border-radius:3px;background:#00000030;box-shadow:inset 0 2px 2px #0005,0 1px 0 #ffffff22}
#e8 .below{display:flex;gap:12px;align-items:center;font:7px "Press Start 2P",monospace;color:var(--hint)}
#e8 .below button{font:7px "Press Start 2P",monospace;color:var(--hint);background:#ffffff14;border:0;border-radius:8px;padding:7px 9px;cursor:pointer}
#e8.touch .below{display:none}
#e8 .boot{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:var(--body);z-index:5;transition:opacity .5s;pointer-events:none}
#e8 .boot span{font:var(--logo-weight) calc(var(--logo-size) * 1.3)/1 var(--brand),system-ui,sans-serif;font-style:var(--logo-style);letter-spacing:var(--logo-track);color:var(--logo);animation:e8in 1.1s steps(8) both}
@keyframes e8in{from{transform:translateY(-120px);opacity:0}to{transform:none;opacity:1}}
/* options a skin can choose (decision 120): a round D-pad, buttons in a row, a plate behind the brand, a wide body */
#e8 .dpad.disc{border-radius:50%;background:var(--dpad);box-shadow:inset 0 3px 0 #ffffff22,0 4px 0 #0008,0 0 0 5px #00000026}
#e8 .dpad.disc i{background:#ffffff16;box-shadow:none}#e8 .dpad.disc .h{left:14px;right:14px;top:52px;height:14px}#e8 .dpad.disc .v{top:14px;bottom:14px;left:52px;width:14px}
#e8 .dpad.disc .c{display:none}
#e8 .dpad.disc.on-left{box-shadow:inset 16px 0 0 #ffffff26,0 4px 0 #0008,0 0 0 5px #00000026}#e8 .dpad.disc.on-right{box-shadow:inset -16px 0 0 #ffffff26,0 4px 0 #0008,0 0 0 5px #00000026}
#e8 .dpad.disc.on-up{box-shadow:inset 0 16px 0 #ffffff26,0 4px 0 #0008,0 0 0 5px #00000026}#e8 .dpad.disc.on-down{box-shadow:inset 0 -16px 0 #ffffff26,0 4px 0 #0008,0 0 0 5px #00000026}
#e8 .btns.row{transform:none;align-items:center}#e8 .btns.row .btn.two{margin-bottom:0}
#e8[class*="pattern-"] .top span,#e8[class*="pattern-"] .pill span{background:var(--plate);color:var(--ink);padding:3px 6px;border-radius:5px}
#e8 .brand.plate{background:var(--plate);border-radius:12px;margin:10px 7% 0;padding:8px 12px;box-shadow:inset 0 1px 3px #0005}
/* an arcade cabinet (decision 123): the logo lit up in a marquee on top, a square bezel, a joystick and big buttons */
#e8 .gb.cabinet{border-radius:22px 22px 12px 12px;grid-template-rows:auto auto 1fr auto;grid-template-areas:"brand brand" "bezel bezel" "dpad btns" "pills pills"}
#e8 .gb.cabinet .top,#e8 .gb.cabinet .grille,#e8 .gb.cabinet .led{display:none}
#e8 .gb.cabinet .brand{position:relative;flex-direction:column;justify-content:center;gap:7px;margin:14px 6% 12px;padding:12px 56px;border-radius:10px;background:var(--plate);
  box-shadow:0 0 0 3px #0007,inset 0 0 22px #000a,0 0 26px color-mix(in srgb,var(--logo) 40%,transparent)}
#e8 .gb.cabinet .brand .sub{order:-1;align-self:center;padding:0}
#e8 .gb.cabinet .brand .logo{text-shadow:0 0 10px var(--logo),0 2px 0 #0009}
#e8 .gb.cabinet .brand .mascot{position:absolute;right:10px;top:50%;width:40px;height:40px;margin:-20px 0 0}
#e8 .gb.cabinet .bezel{margin:0 6%;padding:22px 4% 14px;border-radius:10px}
#e8.touch .gb.cabinet{border-radius:0}
/* a joystick: a ball on a stick in a round gate, leaning the way it's pushed */
#e8 .dpad.stick{border-radius:50%;background:radial-gradient(circle,#0000 29%,#0000004d 30% 34%,#0000 35%),var(--dpad);box-shadow:inset 0 3px 7px #000a,0 2px 0 #ffffff22,0 0 0 6px #00000030}
#e8 .dpad.stick .h,#e8 .dpad.stick .v{display:none}
#e8 .dpad.stick .c{left:33px;top:33px;width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 36% 30%,#ffffffaa,transparent 42%),var(--stick);
  box-shadow:0 6px 0 #0007,0 11px 12px #0006;transform:translate(var(--sx,0px),var(--sy,0px));transition:transform .05s}
#e8 .dpad.stick.on-left{--sx:-18px}#e8 .dpad.stick.on-right{--sx:18px}#e8 .dpad.stick.on-up{--sy:-18px}#e8 .dpad.stick.on-down{--sy:18px}
/* buttons like basketballs, black seams and all */
#e8 .btns.ball .btn{--seam:#24100a;text-shadow:0 0 3px #000,0 0 3px #000;background:radial-gradient(circle at 34% 28%,#ffffff66,transparent 38%),
  linear-gradient(90deg,#0000 calc(50% - 1.5px),var(--seam) 0 calc(50% + 1.5px),#0000 0),linear-gradient(#0000 calc(50% - 1.5px),var(--seam) 0 calc(50% + 1.5px),#0000 0),
  radial-gradient(circle at -22% 50%,#0000 57%,var(--seam) 0 calc(57% + 3px),#0000 0),radial-gradient(circle at 122% 50%,#0000 57%,var(--seam) 0 calc(57% + 3px),#0000 0),var(--btn)}
/* SPROUT·256 (decision 134): smoky purple plastic over its circuits, chrome trim, a visor bezel with scanlines, a
   holographic sticker and four buttons in an arc, red, yellow, green and blue */
#e8 .gb.hyper{background:radial-gradient(120% 90% at 50% 0%,#ffffff22,#0000 55%),
  url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cg fill='none' stroke='%23e0b04a' stroke-opacity='.28' stroke-width='1.5'%3E%3Cpath d='M0 20h40l10 10h30l10-10h30M0 60h20l10 10h50M120 90H90l-10 10H40M60 0v20M100 30v40l-10 10M20 120V90l10-10h20'/%3E%3C/g%3E%3Cg fill='%23e0b04a' fill-opacity='.35'%3E%3Ccircle cx='40' cy='20' r='2.5'/%3E%3Ccircle cx='80' cy='70' r='2.5'/%3E%3Ccircle cx='50' cy='80' r='2.5'/%3E%3Ccircle cx='100' cy='30' r='2.5'/%3E%3C/g%3E%3C/svg%3E"),
  linear-gradient(165deg,color-mix(in srgb,var(--body) 92%,transparent),color-mix(in srgb,var(--body2) 96%,transparent));
  box-shadow:inset 0 0 0 3px #d9dce6,inset 0 0 0 5px #6d7184,inset 0 3px 0 5px #ffffff55,inset 0 -8px 18px #000a,0 0 60px color-mix(in srgb,var(--s1) 30%,transparent),0 24px 60px #000c}
#e8 .gb.hyper .bezel{border-radius:40px 40px 18px 18px / 30px 30px 18px 18px;background:linear-gradient(180deg,#1a1030,var(--bezel) 30%);box-shadow:inset 0 0 0 2px #c9ccd8,inset 0 2px 10px #000,0 0 18px color-mix(in srgb,var(--s2) 35%,transparent)}
#e8 .gb.hyper .screen::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:2px;
  background:repeating-linear-gradient(180deg,#00000038 0 1px,#0000 1px 3px),linear-gradient(160deg,#ffffff1c,#0000 38%),radial-gradient(130% 120% at 50% 50%,#0000 62%,#0007)}
#e8 .led .mem{display:block;width:7px;height:7px;border-radius:50%;background:#3a2a10;margin-top:6px}
#e8 .led .mem.on{background:#ffc23a;box-shadow:0 0 8px #ffc23a}
#e8 .btns.arc{transform:none;gap:10px;align-items:flex-start}
#e8 .btns.arc .btn{width:46px;height:46px;font-size:10px;margin:0}
#e8 .btns.arc .btn.one{margin-top:34px;--btn:#ff3344}#e8 .btns.arc .btn.two{margin-top:12px;--btn:#ffd21f;--btn-ink:#3a2a00}
#e8 .btns.arc .btn.three{margin-top:0;--btn:#2fd36b}#e8 .btns.arc .btn.four{margin-top:4px;--btn:#3b7bff}
#e8 .holo{position:absolute;right:7%;top:12px;padding:3px 8px;border-radius:4px;font:italic 9px "Press Start 2P",monospace;color:#1a0f2e;pointer-events:none;
  background:linear-gradient(115deg,#ff9de2,#9fe8ff,#c6ffb3,#ffe49b,#ff9de2);background-size:300% 100%;animation:e8holo 4s linear infinite;box-shadow:0 0 0 1px #ffffff99,0 2px 6px #0008}
@keyframes e8holo{to{background-position:300% 0}}
#e8 .boot.hyper{flex-direction:column;gap:14px;background:radial-gradient(circle at 50% 50%,#2a0f4a,#06030d 70%);overflow:hidden}
#e8 .boot.hyper::before{content:"";position:absolute;inset:-50%;background:repeating-conic-gradient(from 0deg,#ffffff0d 0 6deg,#0000 6deg 12deg);animation:e8spin 6s linear infinite}
#e8 .boot.hyper span{position:relative;font:italic 900 48px/1 var(--brand),system-ui,sans-serif;letter-spacing:4px;color:#fff;
  background:linear-gradient(180deg,#ffffff,#b9c3ff 45%,#5b3fd6 52%,#ff7ad9);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  filter:drop-shadow(0 0 14px #ff3fb4) drop-shadow(0 0 30px #38e8ff);animation:e8zoom 1.2s cubic-bezier(.2,.9,.2,1) both}
#e8 .boot.hyper em{position:relative;font:12px "Press Start 2P",monospace;color:#38e8ff;font-style:normal;letter-spacing:3px;animation:e8fade .5s .9s both}
#e8 .boot.hyper small{position:relative;font:9px "Press Start 2P",monospace;color:#ffc23a;letter-spacing:4px;animation:e8fade .5s 1.3s both}
@keyframes e8zoom{from{transform:scale(7);opacity:0;filter:blur(8px)}to{transform:none;opacity:1}}
@keyframes e8fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes e8spin{to{transform:rotate(360deg)}}
#e8 .gb.hyper .led{left:10px;font-size:5px}
#e8 .gb.wide.hyper .bezel,#e8 .gb.hyper .bezel{padding-left:58px}
@media (max-width:560px){
  #e8 .btns.arc{gap:6px}#e8 .btns.arc .btn{width:38px;height:38px;font-size:9px}
  #e8 .btns.arc .btn.one{margin-top:28px}#e8 .btns.arc .btn.two{margin-top:9px}
  #e8 .gb.hyper .brand .logo{font-size:calc(var(--logo-size) * 0.78)}#e8 .gb.hyper .brand .mascot{width:34px;height:34px}
  #e8 .holo{top:auto;right:auto;left:16px;bottom:34px}
  #e8 .gb.hyper .bezel,#e8.touch .gb.hyper .bezel{padding-left:46px}
}
/* a tall screen (decision 143): the screen takes the body's width and nearly all its height, the controls a low row */
#e8 .gb.tall{width:min(96vw,calc((100vh - 52px) * 0.6));height:calc(100vh - 52px);aspect-ratio:auto;grid-template-columns:1fr auto 1fr;
  grid-template-rows:auto 1fr auto auto;grid-template-areas:"top top top" "bezel bezel bezel" "dpad brand btns" "pills pills pills";padding:0 0 8px;border-radius:18px 18px 44px 18px}
#e8 .gb.tall .bezel{margin:0 3%;padding:18px 3% 10px;border-radius:12px;min-height:0}
#e8 .gb.tall .led,#e8 .gb.tall .grille{display:none}
#e8 .gb.tall .brand{flex-direction:column;justify-content:center;align-items:center;padding:8px 0 0;gap:4px;margin:0}
#e8 .gb.tall .brand .mascot{width:30px;height:30px;margin:0}#e8 .gb.tall .brand .sub{align-self:center;padding:0}
#e8 .gb.tall .dpad{width:104px;height:104px;margin-top:10px}#e8 .gb.tall .dpad .h{top:34px;height:36px}#e8 .gb.tall .dpad .v{left:34px;width:36px}#e8 .gb.tall .dpad .c{left:43px;top:43px}
#e8 .gb.tall .btns{transform:none;gap:12px}#e8 .gb.tall .btn{width:50px;height:50px}#e8 .gb.tall .btn.two{margin-bottom:22px}
#e8 .gb.tall .pills{padding:2px 0 0}
#e8.touch .gb.tall{width:100vw;height:100%;border-radius:0;padding-bottom:max(8px,env(safe-area-inset-bottom))}
@media (orientation:landscape) and (min-height:561px){
  #e8 .gb.wide{width:min(96vw,calc((100vh - 64px) * 1.8));aspect-ratio:18/10;border-radius:46% 46% 46% 46% / 22% 22% 30% 30%;padding:0 0 16px;
    grid-template-columns:1fr auto 1fr;grid-template-rows:auto 1fr auto;grid-template-areas:"top top top" "dpad bezel btns" "pills brand ."}
  #e8 .gb.wide .top{padding:14px 18% 6px}
  #e8 .gb.wide .bezel{margin:0;align-self:center;padding:24px 18px 16px 44px;border-radius:14px}
  #e8 .gb.wide .brand{justify-content:center;padding:10px 0 0;margin:8px 0 0}#e8 .gb.wide .brand.plate{padding:6px 14px}
  #e8 .gb.wide .pills{align-self:center;padding:0}#e8 .gb.wide .grille{right:9%;bottom:16%}
}
/* a phone: the handheld fills the screen */
#e8.touch{padding:0}
#e8.touch .gb{width:100vw;height:100%;aspect-ratio:auto;border-radius:0 0 74px 0;padding:env(safe-area-inset-top) 0 max(30px,env(safe-area-inset-bottom))}
#e8.touch .bezel{margin:0 4%;padding:24px 3% 14px 10%}
/* a phone on its side: the screen in the middle, the D-pad on the left, the buttons on the right */
@media (orientation:landscape) and (max-height:560px){
  #e8 .gb,#e8.touch .gb{width:100vw;height:100%;aspect-ratio:auto;border-radius:0;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
    grid-template-columns:auto 1fr auto;grid-template-rows:1fr auto;grid-template-areas:"dpad bezel btns" "dpad bezel pills"}
  #e8 .top,#e8 .brand,#e8 .grille,#e8 .below{display:none}
  #e8 .bezel,#e8.touch .bezel{margin:6px 0;padding:6px 6px 6px 22px;border-radius:8px}#e8 .bezel .lines{display:none}#e8 .led{left:7px;font-size:0}
  #e8 .dpad{margin:0 16px}#e8 .btns{margin:0 16px}#e8 .pills{padding:0 0 12px;gap:10px}
}`;
// the look a 16-bit game gets when it brings none: SPROUT·16's black plastic
const PLAIN16 = { shape: "wide", logo: "SPROUT·16", badge: "SPROUT·16", tagline: "16-BIT COLOUR", page: "#050507", page2: "#1a1a22", body: "#1b1b1f", body2: "#0c0c0e",
  ink: "#8d8d96", bezel: "#0a0a0c", bezelInk: "#6c6c74", stripe1: "#e8202c", stripe2: "#f2f2f2", logoColour: "#f2f2f2", subColour: "#e8202c",
  button: "#2b2b31", buttonInk: "#e8202c", dpad: "#0e0e10", pill: "#2b2b31", hint: "#6c6c74" };
// the look SPROUT·256 has when a game brings none: the future as 1995 saw it, smoky purple plastic over its circuits
const PLAIN256 = { shape: "hyper", dpadShape: "stick", logo: "SPROUT·256", sub: "HYPER 256-BIT", badge: "SPROUT·256 · 1995 + 30", tagline: "HYPER 256-BIT · TRUE COLOUR",
  page: "#06030d", page2: "#2a0f4a", body: "#3b1b63", body2: "#140726", ink: "#d9c8ff", bezel: "#05030b", bezelInk: "#8f7ab8", stripe1: "#ff3fb4", stripe2: "#38e8ff",
  logoColour: "#e9ecff", subColour: "#38e8ff", logoStyle: "italic", button: "#ff3344", buttonInk: "#ffffff", stick: "#ff3344", dpad: "#0b0614", pill: "#2a1747", hint: "#8f7ab8", plate: "#0b0614" };
// SPROUT·NOW (decision 145): no handheld; the game is the page on a phone, and a phone-shaped glass card on a computer
const MODERN_CSS = `
#e8.modern{background:radial-gradient(120% 85% at 50% 0%,var(--page2),var(--page) 75%);gap:12px;padding:0}
#e8.modern .gb,#e8.modern .below{display:none}
#e8.modern .card{position:relative;line-height:0;border-radius:42px;overflow:hidden;background:#000;
  box-shadow:0 40px 90px -20px #000a,0 0 0 1px #ffffff22,inset 0 0 0 1px #ffffff12}
#e8.modern .card canvas{display:block;touch-action:none}
#e8.modern .snd{position:absolute;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));width:34px;height:34px;padding:0;border:0;border-radius:50%;
  background:#ffffff2e;color:#fff;font:800 15px/34px Sora,system-ui,sans-serif;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);opacity:.8;cursor:pointer}
#e8.modern .snd.off{opacity:.35;text-decoration:line-through}
#e8.modern .hint{font:800 10px Sora,system-ui,sans-serif;letter-spacing:1px;color:#ffffff70}
#e8.modern.touch .hint{display:none}
#e8.modern.touch .card{position:fixed;inset:0;border-radius:0;box-shadow:none;display:flex;align-items:center;justify-content:center;background:var(--page)}
#e8.modern .boot{background:var(--page)}
#e8.modern .boot span{font:800 36px Sora,system-ui,sans-serif;letter-spacing:-0.5px;color:#fff;font-style:normal;animation:e8now 1s cubic-bezier(.2,.8,.2,1) both}
@keyframes e8now{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}`;
// the look a game gets when it brings none: the SPROUT·8 console's own
const PLAIN = { logo: "SPROUT·8", sub: "", badge: "SPROUT·8", tagline: "8-BIT COLOUR", page: "#09090c", page2: "#1c1c24", body: "#2e2e35", body2: "#202026",
  ink: "#9a9aa5", bezel: "#17171c", bezelInk: "#77777f", stripe1: "#e83a3a", stripe2: "#2f5fd0", logoColour: "#e83a3a", subColour: "#9a9aa5",
  font: "Press Start 2P", logoSize: "17px", logoWeight: "400", logoStyle: "italic", logoTrack: "1px", button: "#c42222", buttonInk: "#ffd9d6", dpad: "#1c1c22",
  pill: "#3a3a44", hint: "#6e6e78" };

// ---------------------------------------------------------------- colours: 64 of them, or 512 on SPROUT·16
const snapped = new Map();
function snap(c) {
  const t = typeof c === "string" ? c : S.format(c);
  let s = snapped.get(t);
  if (s === undefined) {
    let hex = t.trim();
    if (/^#[0-9a-f]{3}$/i.test(hex)) hex = "#" + hex.slice(1).split("").map(h => h + h).join("");
    if (!LEVELS) { snapped.set(t, t.trim()); return t.trim(); }
    const step = 255 / (LEVELS - 1);
    s = /^#[0-9a-f]{6}/i.test(hex) ? "#" + [1, 3, 5].map(i => Math.round(Math.round(parseInt(hex.slice(i, i + 2), 16) / step) * step).toString(16).padStart(2, "0")).join("") : t;
    snapped.set(t, s);
  }
  return s;
}
// a colour's red, green and blue: #rrggbb, #rgb, or rgb(...) and rgba(...) on SPROUT·256
const rgbOf = c => {
  if (/^#[0-9a-f]{6}/i.test(c)) return [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  if (/^#[0-9a-f]{3}$/i.test(c)) return [1, 2, 3].map(i => parseInt(c[i] + c[i], 16));
  const m = /rgba?\(([^)]*)\)/.exec(c); return m ? m[1].split(",").slice(0, 3).map(v => Math.max(0, Math.min(255, Math.round(+v) || 0))) : [255, 255, 255];
};

// ---------------------------------------------------------------- pixel art, drawn once and kept
const NOINK = {}, arts = new WeakMap(), maps = new WeakMap();
const rowsOf = art => S.isCell(art) ? S.partsOf(art).map(String) : [String(art)];
function inkOf(ink) { const m = new Map(); if (ink && S.isCell(ink)) for (const k of ink.fieldNames()) m.set(k, snap(ink.field(k))); return m; }
function keyed(cache, a, b, make) {
  let per = cache.get(a); if (!per) { per = new WeakMap(); cache.set(a, per); }
  const k = b && typeof b === "object" ? b : NOINK; let v = per.get(k);
  if (!v) { v = make(); per.set(k, v); }
  return v;
}
function bitmap(art, ink) {
  return keyed(arts, art, ink, () => {
    const rows = rowsOf(art), colours = inkOf(ink), c = document.createElement("canvas");
    c.width = Math.max(1, ...rows.map(r => r.length)); c.height = Math.max(1, rows.length);
    const g = c.getContext("2d");
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const col = colours.get(r[x]); if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } } });
    return c;
  });
}
function tileCanvas(map, set, ink) {
  let bySet = maps.get(map); if (!bySet) { bySet = new WeakMap(); maps.set(map, bySet); }
  return keyed(bySet, set, ink, () => {
    const rows = rowsOf(map), pieces = new Map();
    for (const p of S.partsOf(set)) { const [ch, art] = S.partsOf(p); pieces.set(String(ch), art); }
    const first = pieces.values().next().value, size = first ? rowsOf(first) : ["x"], tw = size[0].length, th = size.length;
    const c = document.createElement("canvas"); c.width = Math.max(1, ...rows.map(r => r.length)) * tw; c.height = rows.length * th;
    const g = c.getContext("2d");
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const art = pieces.get(r[x]); if (art) g.drawImage(bitmap(art, ink), x * tw, y * th); } });
    return c;
  });
}
// words in the 8x8 font, drawn in one colour with no soft edges
const words = new Map();
function wordBitmap(t, colour) {
  const key = colour + "|" + t; let c = words.get(key);
  if (!c) {
    c = document.createElement("canvas"); c.width = Math.max(1, t.length * 8); c.height = 8;
    const g = c.getContext("2d"); g.font = '8px "Press Start 2P",monospace'; g.textBaseline = "top"; g.fillStyle = "#fff"; g.fillText(t, 0, 0);
    const img = g.getImageData(0, 0, c.width, 8), d = img.data, [r, gr, b] = rgbOf(colour);
    for (let i = 0; i < d.length; i += 4) { const on = d[i + 3] >= 120; d[i] = r; d[i + 1] = gr; d[i + 2] = b; d[i + 3] = on ? 255 : 0; }
    g.putImageData(img, 0, 0);
    if (words.size > 800) words.clear();
    words.set(key, c);
  }
  return c;
}

// ---------------------------------------------------------------- sound: two square-wave voices, a triangle bass and hiss
let AC = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null, muted = false;
// SPROUT·NOW's sound (decision 145): soft sine and triangle voices in a little room, a reverb made of fading noise
function roomed(bus, amount) {
  const len = Math.floor(AC.sampleRate * 1.6), ir = AC.createBuffer(2, len, AC.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  const conv = AC.createConvolver(), wet = AC.createGain(); conv.buffer = ir; wet.gain.value = amount;
  bus.connect(conv); conv.connect(wet).connect(master);
}
function soft(type, freq, len, when, bus, vol) {
  const o = AC.createOscillator(), e = AC.createGain(); o.type = type; o.frequency.value = freq;
  e.gain.setValueAtTime(0.0001, when); e.gain.exponentialRampToValueAtTime(vol, when + 0.012);
  e.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(0.05, len) + 0.12);
  o.connect(e).connect(bus); o.start(when); o.stop(when + len + 0.2);
  return o;
}
// SPROUT·16's sound (decision 125): the songs go through a little echo, and the lead is a sawtooth through a filter
function echoed(into) {
  const delay = AC.createDelay(1), back = AC.createGain(), wet = AC.createGain();
  delay.delayTime.value = 0.27; back.gain.value = 0.28; wet.gain.value = 0.3;
  into.connect(delay); delay.connect(back).connect(delay); delay.connect(wet).connect(master);
}
function warm(freq, len, when, bus, vol, cutoff) {
  const f = AC.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = cutoff; f.Q.value = 2; f.connect(bus);
  return tone("sawtooth", freq, len, when, f, vol);
}
function audio() {
  if (!AC) {
    try {
      AC = new (root.AudioContext || root.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(AC.destination);
      sfxBus = AC.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
      musicBus = AC.createGain(); musicBus.gain.value = 0.3; musicBus.connect(master);
      if (STYLE === "modern") { roomed(musicBus, 0.32); roomed(sfxBus, 0.22); }
      if (BITS === 16) echoed(musicBus);
    } catch (e) { AC = null; return null; }
  }
  if (AC.state === "suspended") AC.resume();
  if (root.zzfxX && root.zzfxX.state === "suspended") root.zzfxX.resume();
  return AC;
}
function tone(type, freq, len, when, bus, vol) {
  const o = AC.createOscillator(), e = AC.createGain(); o.type = type; o.frequency.value = freq;
  e.gain.setValueAtTime(0.0001, when); e.gain.linearRampToValueAtTime(vol, when + 0.004);
  e.gain.setValueAtTime(vol, when + Math.max(0.006, len - 0.025)); e.gain.linearRampToValueAtTime(0.0001, when + len);
  o.connect(e).connect(bus); o.start(when); o.stop(when + len + 0.02);
  return o;
}
function hiss(len, pitch, when, bus, vol) {
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), e = AC.createGain();
  s.buffer = noiseBuf; s.loop = true; f.type = "bandpass"; f.frequency.value = pitch; f.Q.value = 0.7;
  e.gain.setValueAtTime(vol, when); e.gain.exponentialRampToValueAtTime(0.0005, when + Math.max(0.02, len));
  s.connect(f).connect(e).connect(bus); s.start(when, Math.random() * 0.5); s.stop(when + len + 0.03);
}
const hz = n => 440 * Math.pow(2, (n - 69) / 12);
function drum(kind, when) {
  if (kind === "kick") { const o = tone("square", 150, 0.09, when, musicBus, 0.18); o.frequency.exponentialRampToValueAtTime(45, when + 0.08); hiss(0.05, 300, when, musicBus, 0.25); }
  else if (kind === "snare") hiss(0.13, 1900, when, musicBus, 0.5);
  else if (kind === "hat") hiss(0.035, 7500, when, musicBus, 0.3);
  else if (kind === "crash") hiss(0.5, 5200, when, musicBus, 0.35);
}

// ---------------------------------------------------------------- songs, read from the game's songs record
function readSong(rec) {
  const L = S.libraries, js = L.toJS(rec), events = [];
  for (const voice of ["lead", "harmony", "bass", "drums"]) for (const ev of js[voice] || []) events.push({ beat: ev[0], note: ev[1], beats: ev[2], voice });
  events.sort((a, b) => a.beat - b.beat);
  return { bpm: js.bpm || 120, beats: js.beats || 16, once: !!js.once, events };
}

function start(opts) {
  opts = opts || {};
  if (opts.bits === 16) { W = 320; H = 224; LEVELS = 8; BITS = 16; snapped.clear(); }
  if (opts.bits === 256) { W = 480; H = 270; LEVELS = 0; BITS = 256; snapped.clear(); }
  // SPROUT·NOW (decision 145): true colour, a portrait screen 390 wide by default, and on a phone held upright the
  // screen as tall as the phone is, so the game fills it edge to edge
  if (opts.style === "modern") { STYLE = "modern"; LEVELS = 0; snapped.clear(); W = 390; H = 780; }
  const MODERN = STYLE === "modern";
  // a screen of the game's own size (decision 143), as [width, height]; taller than wide makes a tall handheld
  if (Array.isArray(opts.screen) && opts.screen.length === 2) { W = Math.round(+opts.screen[0]) || W; H = Math.round(+opts.screen[1]) || H; }
  const coarse = matchMedia("(pointer: coarse)").matches || "ontouchstart" in root;
  if (MODERN && coarse && innerHeight > innerWidth) H = Math.round(Math.max(W * 1.4, Math.min(W * 2.4, W * innerHeight / innerWidth)));
  const TALL = H > W && !MODERN;
  const skin = Object.assign({}, PLAIN, BITS === 16 ? PLAIN16 : BITS === 256 ? PLAIN256 : {}, opts.skin || {});
  // the buttons: two, or four in an arc on SPROUT·256
  const BUTTONS = BITS === 256 ? ["one", "two", "three", "four"] : ["one", "two"];
  const style = document.createElement("style");
  style.textContent = CSS + (skin.fontFile ? `@font-face{font-family:"${skin.font}";src:url("vendor/fonts/${skin.fontFile}") format("woff2");font-display:swap}` : "")
    + (MODERN ? '@font-face{font-family:"Sora";font-weight:800;src:url("vendor/fonts/sora-800.woff2") format("woff2");font-display:block}' + MODERN_CSS : "");
  document.head.appendChild(style);
  // the game's own handheld (decision 124): its stylesheet laid over the shell's
  if (opts.css) { const link = document.createElement("link"); link.rel = "stylesheet"; link.href = opts.css; document.head.appendChild(link); }
  const touch = matchMedia("(pointer: coarse)").matches || "ontouchstart" in root;
  const box = document.createElement("div"); box.id = "e8"; if (touch) box.classList.add("touch");
  if (skin.pattern) box.classList.add("pattern-" + skin.pattern);
  if (MODERN) box.classList.add("modern");
  const vars = { plate: skin.plate || "transparent", page: skin.page, page2: skin.page2, body: skin.body, body2: skin.body2, ink: skin.ink, bezel: skin.bezel, "bezel-ink": skin.bezelInk, s1: skin.stripe1, s2: skin.stripe2,
    logo: skin.logoColour, sub: skin.subColour, brand: `"${skin.font}"`, "logo-size": skin.logoSize, "logo-weight": skin.logoWeight, "logo-style": skin.logoStyle, "logo-track": skin.logoTrack,
    btn: skin.button, "btn-ink": skin.buttonInk, dpad: skin.dpad, pill: skin.pill, hint: skin.hint, stick: skin.stick || skin.button };
  for (const k in vars) box.style.setProperty("--" + k, vars[k]);
  const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  box.innerHTML = `<div class="gb${TALL ? " tall" : skin.shape === "wide" || skin.shape === "cabinet" ? " " + skin.shape : skin.shape === "hyper" ? " wide hyper" : ""}">
  <div class="top"><i></i><span>${esc(skin.badge)}</span><i></i></div>
  <div class="bezel"><div class="lines"><i></i><span>${esc(skin.tagline)}</span><i></i></div><div class="led"><i></i>POWER${BITS === 256 ? '<b class="mem"></b>MEMORY' : ""}</div><div class="screen"><canvas width="${W}" height="${H}"></canvas></div></div>
  <div class="brand${skin.plate ? " plate" : ""}"><span class="logo">${esc(skin.logo)}</span><span class="sub">${esc(skin.sub)}</span><canvas class="mascot" width="16" height="16"></canvas></div>
  <div class="dpad${skin.dpadShape === "disc" || skin.dpadShape === "stick" ? " " + skin.dpadShape : ""}"><i class="h"></i><i class="v"></i><i class="c"></i></div>
  <div class="btns${skin.buttonRow ? " row" : ""}${skin.buttonStyle === "ball" ? " ball" : ""}${BITS === 256 ? " arc" : ""}">${BUTTONS.map((b, i) => `<div class="btn ${b}">${i + 1}</div>`).join("")}</div>
  ${BITS === 256 ? '<div class="holo">256-BIT</div>' : ""}
  <div class="pills"><div class="pill mute2"><b></b><span>SOUND</span></div><div class="pill pause"><b></b><span>PAUSE</span></div></div>
  <div class="grille"><i></i><i></i><i></i><i></i><i></i><i></i></div>
</div>
<div class="below"><span>ARROWS MOVE &nbsp; Z 1 &nbsp; X 2${BITS === 256 ? " &nbsp; C 3 &nbsp; V 4" : ""} &nbsp; ENTER PAUSE</span><button class="mute">SOUND ON</button><button class="full">FULL SCREEN</button></div>
${MODERN ? `<div class="card"><button class="snd" aria-label="sound">♪</button></div><div class="hint">TAP OR CLICK · ARROWS · Z X · ENTER PAUSES · M SOUND</div>` : ""}
<div class="boot${BITS === 256 ? " hyper" : ""}"><span>${esc(MODERN ? opts.title || skin.logo : skin.logo)}</span>${BITS === 256 ? `<em>${esc(skin.sub || "HYPER 256-BIT")}</em><small>1995 + 30</small>` : ""}</div>`;
  document.body.appendChild(box);
  document.body.style.background = skin.page;
  if (skin.pattern === "zebra") {
    const band = (y, w) => `<path d='M-20 ${y} C 20 ${y - 18}, 50 ${y + 22}, 90 ${y} S 160 ${y - 16}, 200 ${y + 6}' stroke='%23111' stroke-width='${w}' fill='none' stroke-linecap='round'/>`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'>${[[14, 13], [52, 9], [86, 15], [122, 8], [158, 12]].map(([y, w]) => band(y, w)).join("")}</svg>`;
    const body = box.querySelector(".gb");
    body.style.backgroundImage = `url("data:image/svg+xml,${svg.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/ /g, "%20")}"),linear-gradient(165deg,${skin.body},${skin.body2})`;
    body.style.backgroundSize = "180px 180px, auto";
  }
  // hardwood (decision 123): planks with their seams and grain, and the three-point line painted round the controls
  if (skin.pattern === "wood") {
    const body = box.querySelector(".gb");
    body.style.backgroundImage = [`radial-gradient(ellipse 62% 30% at 50% 100%,#0000 calc(100% - 4px),${skin.line || "#f4ecdc"} calc(100% - 4px) 100%,#0000 100%)`,
      "repeating-linear-gradient(90deg,#0000 0 34px,#00000034 34px 36px)", "repeating-linear-gradient(90deg,#ffffff12 0 2px,#0000 2px 9px,#00000014 9px 11px,#0000 11px 18px)",
      `linear-gradient(165deg,${skin.body},${skin.body2})`].join(",");
  }
  // iOS Safari zooms in on a quick second tap, and on a pinch, whatever the viewport says (it ignores user-scalable=no):
  // a game wants neither, so the second tap of a double tap and every pinch are cancelled. Text boxes are left alone.
  let lastTap = 0;
  const typing = t => t && t.closest && t.closest("input, textarea, select, [contenteditable]");
  document.addEventListener("touchend", e => { const now = e.timeStamp; if (now - lastTap < 350 && !typing(e.target)) e.preventDefault(); lastTap = now; }, { passive: false });
  document.addEventListener("touchmove", e => { if (e.touches.length > 1 && !typing(e.target)) e.preventDefault(); }, { passive: false });
  for (const t of ["gesturestart", "gesturechange", "gestureend", "dblclick"]) document.addEventListener(t, e => e.preventDefault(), { passive: false });
  const $ = sel => box.querySelector(sel), canvas = $(".screen canvas"), g = canvas.getContext("2d");
  g.imageSmoothingEnabled = false;
  // the modern style's screen lies in its glass card, not the handheld's bezel
  if (MODERN) { $(".card").insertBefore(canvas, $(".snd")); }
  const store = { get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const saveKey = "eight." + (opts.key || "game");
  muted = store.get("eight.muted", false);
  const showMute = () => { $(".mute").textContent = muted ? "SOUND OFF" : "SOUND ON"; $(".mute2 span").textContent = muted ? "MUTED" : "SOUND"; if ($(".snd")) $(".snd").classList.toggle("off", muted); if (master) master.gain.value = muted ? 0 : 0.9; if (root.zzfxVolume) root.zzfxVolume(muted ? 0 : 0.3); };
  const toggleMute = () => { muted = !muted; store.set("eight.muted", muted); audio(); showMute(); };
  const toggleFull = () => { const el = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); };
  $(".mute").onclick = toggleMute; $(".mute2").addEventListener("pointerdown", e => { e.preventDefault(); toggleMute(); });
  $(".full").onclick = toggleFull;
  if ($(".snd")) $(".snd").addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); toggleMute(); });
  setTimeout(() => { const b = $(".boot"); if (b) { b.style.opacity = 0; setTimeout(() => b.remove(), 600); } }, BITS === 256 ? 2600 : 1500);
  // SPROUT·256's boot jingle, when the page may already make sound
  if (BITS === 256) setTimeout(() => { if (audio() && AC.state === "running") { const t = AC.currentTime + 0.05; [72, 76, 79, 84, 88, 91].forEach((n, i) => warm(hz(n), 0.16, t + i * 0.07, sfxBus, 0.07, 3400)); warm(hz(96), 0.7, t + 0.45, sfxBus, 0.06, 4200); } }, 700);

  // the screen as big as the bezel lets it be: whole pixels from three times up, else as big as it goes
  function fit() {
    // SPROUT·NOW (decision 145): on a phone held upright, the whole phone; on a computer, a phone-shaped card as tall as
    // the window allows; drawn at the device's pixel ratio, so it's sharp on any screen
    if (MODERN) {
      const dpr = Math.min(2, root.devicePixelRatio || 1), full = coarse && innerHeight > innerWidth;
      const k = full ? Math.min(innerWidth / W, innerHeight / H) : Math.max(0.3, Math.min((innerHeight - 84) / H, (innerWidth - 32) / W));
      const cw = W * k, ch = H * k, bw = Math.round(cw * dpr), bh = Math.round(ch * dpr);
      canvas.style.width = cw + "px"; canvas.style.height = ch + "px";
      if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
      return;
    }
    const bz = $(".bezel"), r = bz.getBoundingClientRect(), cs = getComputedStyle(bz);
    const roomW = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    // a tall screen (decision 143) takes all the width and all the height the controls leave, at any size, not whole pixels
    if (TALL && !(innerWidth > innerHeight && innerHeight < 560)) {
      const gbr = $(".gb").getBoundingClientRect(), h = sel => { const el = $(sel); return el && getComputedStyle(el).display !== "none" ? el.getBoundingClientRect().height : 0; };
      const roomH = gbr.height - h(".top") - Math.max(h(".dpad"), h(".btns"), h(".brand")) - h(".pills") - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 28;
      const k = Math.max(0.5, Math.min(roomW / W, roomH / H));
      canvas.style.width = W * k + "px"; canvas.style.height = H * k + "px";
      return;
    }
    const wide = innerWidth > innerHeight && innerHeight < 560;
    const gb = $(".gb").getBoundingClientRect();
    const wideBody = skin.shape === "wide" && !wide && matchMedia("(orientation:landscape) and (min-height:561px)").matches;
    const roomH = wide ? r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) : gb.height * (wideBody ? 0.6 : 0.46);
    let k = wideBody ? Math.min(gb.width * 0.5 / W, roomH / H) : Math.min(roomW / W, roomH / H); if (k >= 3) k = Math.floor(k);
    canvas.style.width = Math.max(W / 2, W * k) + "px"; canvas.style.height = Math.max(H / 2, H * k) + "px";
  }
  addEventListener("resize", fit); setTimeout(fit, 0); setTimeout(fit, 300);

  // ---- input: keys, the touch pad and buttons, a controller
  // a press is latched until the next frame has seen it, so a tap quicker than a frame still counts (decision 120)
  const KEYS = new Set(), TOUCH = new Set(), PADKEYS = new Set(), LATCH = new Set();
  const KEYNAME = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down", z: "one", j: "one", c: "one", x: "two", k: "two", " ": "two" };
  if (BITS === 256) Object.assign(KEYNAME, { c: "three", l: "three", v: "four", ";": "four" });
  let paused = false;
  const setPaused = p => { paused = p; if (musicBus) musicBus.gain.value = p ? 0.08 : 0.3; };
  addEventListener("keydown", e => {
    audio();
    if (e.key === "Enter" || e.key === "Escape" || e.key === "p") { setPaused(!paused); e.preventDefault(); return; }
    if (e.key === "m") { toggleMute(); return; }
    if (e.key === "f") { toggleFull(); return; }
    const k = KEYNAME[e.key] || KEYNAME[e.key.toLowerCase()]; if (k) { KEYS.add(k); LATCH.add(k); e.preventDefault(); }
  });
  addEventListener("keyup", e => { const k = KEYNAME[e.key] || KEYNAME[e.key.toLowerCase()]; if (k) KEYS.delete(k); });
  addEventListener("blur", () => { KEYS.clear(); TOUCH.clear(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) setPaused(true); });
  const dpad = $(".dpad"), dirOf = new Map();
  function dpadSet(id, e) {
    const r = dpad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), far = Math.hypot(dx, dy);
    const dirs = []; if (far > 12) { const a = Math.atan2(dy, dx), oct = Math.round(a / (Math.PI / 4)); const m = { 0: ["right"], 1: ["right", "down"], 2: ["down"], 3: ["down", "left"], 4: ["left"], "-4": ["left"], "-3": ["left", "up"], "-2": ["up"], "-1": ["up", "right"] }; dirs.push(...(m[oct] || [])); }
    dirOf.set(id, dirs); for (const d of dirs) LATCH.add(d); refreshPad();
  }
  function refreshPad() { for (const d of ["left", "right", "up", "down"]) TOUCH.delete(d); for (const ds of dirOf.values()) for (const d of ds) TOUCH.add(d); for (const d of ["left", "right", "up", "down"]) dpad.classList.toggle("on-" + d, TOUCH.has(d)); }
  dpad.addEventListener("pointerdown", e => { e.preventDefault(); audio(); dpad.setPointerCapture(e.pointerId); dpadSet(e.pointerId, e); });
  dpad.addEventListener("pointermove", e => { if (dirOf.has(e.pointerId)) dpadSet(e.pointerId, e); });
  const dpadUp = e => { dirOf.delete(e.pointerId); refreshPad(); };
  dpad.addEventListener("pointerup", dpadUp); dpad.addEventListener("pointercancel", dpadUp);
  for (const name of BUTTONS) {
    const b = $(".btn." + name), on = new Set();
    b.addEventListener("pointerdown", e => { e.preventDefault(); audio(); b.setPointerCapture(e.pointerId); on.add(e.pointerId); TOUCH.add(name); LATCH.add(name); b.classList.add("down"); if (navigator.vibrate) navigator.vibrate(8); });
    const lift = e => { on.delete(e.pointerId); if (!on.size) { TOUCH.delete(name); b.classList.remove("down"); } };
    b.addEventListener("pointerup", lift); b.addEventListener("pointercancel", lift);
  }
  $(".pause").addEventListener("pointerdown", e => { e.preventDefault(); audio(); setPaused(!paused); });
  // a tap on the screen reaches the game as a touch (decision 143), at the screen's own pixels: the frame's input gets
  // tapped, touching, touch-x and touch-y. A tap while paused only carries on.
  const onScreen = e => { const r = canvas.getBoundingClientRect(); return [Math.max(0, Math.min(W - 1, (e.clientX - r.left) / r.width * W)), Math.max(0, Math.min(H - 1, (e.clientY - r.top) / r.height * H))]; };
  let screenTouch = false;
  canvas.addEventListener("pointerdown", e => { audio(); if (paused) { setPaused(false); return; } if (!game) return; e.preventDefault(); try { canvas.setPointerCapture(e.pointerId); } catch (err) {} screenTouch = true; const [x, y] = onScreen(e); game.down(x, y); });
  canvas.addEventListener("pointermove", e => { if (screenTouch && game) { const [x, y] = onScreen(e); game.move(x, y); } });
  const screenUp = () => { if (screenTouch && game) game.up(); screenTouch = false; };
  canvas.addEventListener("pointerup", screenUp); canvas.addEventListener("pointercancel", screenUp);
  let padStart = false;
  function pollPad() {
    PADKEYS.clear();
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue;
      const b = i => p.buttons[i] && p.buttons[i].pressed, ax = i => p.axes[i] || 0;
      if (b(14) || ax(0) < -0.45) PADKEYS.add("left"); if (b(15) || ax(0) > 0.45) PADKEYS.add("right");
      if (b(12) || ax(1) < -0.45) PADKEYS.add("up"); if (b(13) || ax(1) > 0.45) PADKEYS.add("down");
      if (BITS === 256) { ["one", "two", "three", "four"].forEach((name, i) => { if (b(i)) PADKEYS.add(name); }); }
      else { if (b(0)) PADKEYS.add("two"); if (b(1) || b(2)) PADKEYS.add("one"); }
      if (b(9) && !padStart) setPaused(!paused); padStart = b(9);
    }
  }
  const heldCell = () => { const m = new Map(); for (const set of [KEYS, TOUCH, PADKEYS, LATCH]) for (const k of set) m.set(k, true); return S.valueCellOf([], m); };

  // ---- drawing
  function disc(cx, cy, r, colour) {
    g.fillStyle = colour; cx = Math.round(cx); cy = Math.round(cy); r = Math.max(0, Math.round(r));
    for (let dy = -r; dy <= r; dy++) { const half = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35); g.fillRect(cx - half, cy + dy, half * 2 + 1, 1); }
  }
  function pixelLine(x0, y0, x1, y1, colour) {
    g.fillStyle = colour; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy, n = 0;
    for (;;) { g.fillRect(x0, y0, 1, 1); if ((x0 === x1 && y0 === y1) || n++ > 1024) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  }
  function words8(a) {
    const t = String(a[0]), scale = Math.max(1, Math.round((+a[3] || 8) / 8)), bm = wordBitmap(t, snap(a[4] === undefined ? "#ffffff" : a[4]));
    const w = bm.width * scale, h = 8 * scale, align = a[5] === "left" || a[5] === "right" ? a[5] : "center";
    const x = Math.round(align === "left" ? a[1] : align === "right" ? a[1] - w : a[1] - w / 2), y = Math.round(a[2] - h / 2);
    g.drawImage(bm, x, y, w, h);
  }
  // SPROUT·256's glow: the bright part of the frame, made small and soft at a quarter and an eighth of the size, laid
  // back over it with light added, so whatever shines blooms (decision 134)
  let glowA = null, glowB = null;
  function bloom() {
    const small = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
    if (!glowA) { glowA = small(W / 4, Math.ceil(H / 4)); glowB = small(W / 8, Math.ceil(H / 8)); }
    const ga = glowA.getContext("2d", { willReadFrequently: true }), gb = glowB.getContext("2d");
    ga.imageSmoothingEnabled = true; ga.globalCompositeOperation = "copy"; ga.drawImage(canvas, 0, 0, glowA.width, glowA.height);
    const img = ga.getImageData(0, 0, glowA.width, glowA.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const lit = Math.max(d[i], d[i + 1], d[i + 2]), k = lit > 140 ? (lit - 140) / 115 : 0; d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; }
    ga.putImageData(img, 0, 0);
    gb.imageSmoothingEnabled = true; gb.globalCompositeOperation = "copy"; gb.drawImage(glowA, 0, 0, glowB.width, glowB.height);
    g.save(); g.imageSmoothingEnabled = true; g.globalCompositeOperation = "lighter";
    g.globalAlpha = 0.55; g.drawImage(glowA, 0, 0, W, H); g.globalAlpha = 0.75; g.drawImage(glowB, 0, 0, W, H);
    g.restore(); g.imageSmoothingEnabled = false;
  }
  // ---- SPROUT·NOW's drawing (decision 145): smooth shapes in true colour, in the screen's own units
  const clearOf = c => { const t = String(c).trim(); if (/^#[0-9a-f]{6}$/i.test(t)) return t + "00"; if (/^#[0-9a-f]{8}$/i.test(t)) return t.slice(0, 7) + "00"; const m = /^rgba?\(([^,]+),([^,]+),([^,)]+)/i.exec(t); return m ? `rgba(${m[1]},${m[2]},${m[3]},0)` : "rgba(0,0,0,0)"; };
  function modernText(a) {
    const size = Math.max(4, +a[3] || 16), align = a[5] === "left" || a[5] === "right" ? a[5] : "center";
    g.font = `800 ${size}px Sora, system-ui, sans-serif`; g.textAlign = align; g.textBaseline = "middle"; g.fillStyle = snap(a[4] === undefined ? "#ffffff" : a[4]);
    // a soft shadow under the words, so they read on a light sky as well as a dark one
    g.save(); g.shadowColor = "rgba(20,10,40,0.28)"; g.shadowBlur = Math.max(6, size * 0.35); g.shadowOffsetY = Math.max(1, size * 0.05);
    g.fillText(String(a[0]), +a[1], +a[2]); g.restore();
  }
  function paintModern(list) {
    const tau = Math.PI * 2;
    for (const [name, a] of list) {
      if (name === "clear") { g.fillStyle = snap(a[0]); g.fillRect(0, 0, W, H); }
      else if (name === "rect") { g.fillStyle = snap(a[4]); const r = Math.max(0, +a[5] || 0); g.beginPath(); if (r && g.roundRect) g.roundRect(+a[0], +a[1], +a[2], +a[3], r); else g.rect(+a[0], +a[1], +a[2], +a[3]); g.fill(); }
      else if (name === "circle") { g.fillStyle = snap(a[3]); g.beginPath(); g.arc(+a[0], +a[1], Math.max(0, +a[2]), 0, tau); g.fill(); }
      else if (name === "line") { g.strokeStyle = snap(a[4]); g.lineWidth = +a[5] || 2; g.lineCap = "round"; g.beginPath(); g.moveTo(+a[0], +a[1]); g.lineTo(+a[2], +a[3]); g.stroke(); }
      else if (name === "ring") { const from = a[5] === undefined ? 0 : +a[5], to = a[6] === undefined ? 1 : +a[6]; g.strokeStyle = snap(a[3]); g.lineWidth = +a[4] || 2; g.lineCap = "round"; g.beginPath(); g.arc(+a[0], +a[1], Math.max(0, +a[2]), from * tau, to * tau); g.stroke(); }
      else if (name === "glow") { const x = +a[0], y = +a[1], r = Math.max(1, +a[2]), c = snap(a[3]), gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, c); gr.addColorStop(1, clearOf(c)); g.save(); g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
      else if (name === "gradient") { const gr = g.createLinearGradient(0, +a[1], 0, +a[1] + +a[3]); gr.addColorStop(0, snap(a[4])); gr.addColorStop(1, snap(a[5] === undefined ? a[4] : a[5])); g.fillStyle = gr; g.fillRect(+a[0], +a[1], +a[2], +a[3]); }
      else if (name === "text") modernText(a);
      else if (name === "sprite" && a[0] && typeof a[0] === "object") {
        const bm = bitmap(a[0], a[3]), k = Math.max(0.05, +a[5] || 1), w = bm.width * k, h = bm.height * k, turn = +a[6] || 0, flip = a[4] === true || a[4] === -1;
        g.save(); g.imageSmoothingEnabled = false; g.translate(+a[1] + w / 2, +a[2] + h / 2); if (turn) g.rotate(turn * tau); if (flip) g.scale(-1, 1); g.drawImage(bm, -w / 2, -h / 2, w, h); g.restore();
      }
      else if (name === "tiles") { g.save(); g.imageSmoothingEnabled = false; g.drawImage(tileCanvas(a[0], a[1], a[2]), +a[3], +a[4]); g.restore(); }
    }
  }
  // the modern words on the retro screens: drawn plainly, in their colours
  function pixelRing(cx, cy, r, colour, from, to) {
    g.fillStyle = colour; const steps = Math.max(12, Math.round(r * 6.3)), a0 = from * Math.PI * 2, a1 = to * Math.PI * 2;
    for (let i = 0; i <= steps; i++) { const t = a0 + (a1 - a0) * i / steps; g.fillRect(Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), 1, 1); }
  }
  let warned = false;
  function paint(list) {
    if (MODERN) return paintModern(list);
    for (const [name, a] of list) {
      if (name === "clear") { g.fillStyle = snap(a[0]); g.fillRect(0, 0, W, H); }
      else if (name === "rect") { g.fillStyle = snap(a[4]); g.fillRect(Math.round(a[0]), Math.round(a[1]), Math.round(a[2]), Math.round(a[3])); }
      else if (name === "circle") disc(a[0], a[1], a[2], snap(a[3]));
      else if (name === "line") pixelLine(a[0], a[1], a[2], a[3], snap(a[4]));
      else if (name === "text") words8(a);
      else if (name === "sprite") {
        if (!a[0] || typeof a[0] !== "object") { if (!warned) { warned = true; console.warn("sprite wants a list of rows, not " + S.format(a[0])); } continue; }
        // a sixth value, a whole number, draws it that many times bigger (decision 120)
        // on SPROUT·256 the scale can be any size, and a seventh value turns it about its middle, in whole turns (decision 134)
        const bm = bitmap(a[0], a[3]), x = Math.round(a[1]), y = Math.round(a[2]), k = BITS === 256 ? Math.max(0.05, +a[5] || 1) : Math.max(1, Math.round(+a[5] || 1)), w = bm.width * k, h = bm.height * k;
        const flip = a[4] === true || a[4] === -1, turn = +a[6] || 0;
        if (turn) { g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(turn * Math.PI * 2); if (flip) g.scale(-1, 1); g.drawImage(bm, -w / 2, -h / 2, w, h); g.restore(); }
        else if (flip) { g.save(); g.translate(x + w, y); g.scale(-1, 1); g.drawImage(bm, 0, 0, w, h); g.restore(); } else g.drawImage(bm, x, y, w, h);
      }
      else if (name === "tiles") g.drawImage(tileCanvas(a[0], a[1], a[2]), Math.round(a[3]), Math.round(a[4]));
      else if (name === "ring") pixelRing(+a[0], +a[1], Math.max(0, +a[2]), snap(a[3]), a[5] === undefined ? 0 : +a[5], a[6] === undefined ? 1 : +a[6]);
      else if (name === "glow") disc(a[0], a[1], Math.max(1, (+a[2] || 0) / 4), snap(a[3]));
      else if (name === "gradient") { const bands = 8, top = Math.round(+a[1]), tall = Math.round(+a[3]);
        for (let i = 0; i < bands; i++) { g.fillStyle = snap(i < bands / 2 ? a[4] : a[5] === undefined ? a[4] : a[5]); g.fillRect(Math.round(+a[0]), top + Math.round(tall * i / bands), Math.round(+a[2]), Math.ceil(tall / bands)); } }
    }
  }

  // ---- the game
  let game = null, shake = 0, song = null, songName = false, saved = "", frames = 0;
  const songs = {};
  function songOf(name) {
    if (name in songs) return songs[name];
    let rec = null; try { const all = game.file.field("songs"); if (all !== S.UNSET && S.isCell(all) && all.fieldNames().includes(name)) rec = all.field(name); } catch (e) {}
    return (songs[name] = rec ? readSong(rec) : null);
  }
  function setSong(name) {
    if (name === songName) return;
    songName = name; const s = typeof name === "string" ? songOf(name) : null;
    song = s && AC ? { s, t0: AC.currentTime + 0.08, i: 0 } : null;
    if (s && !AC) songName = null;      // try again once sound is allowed
  }
  function pumpSong() {
    if (!song || !AC) return;
    const s = song.s, spb = 60 / s.bpm, len = s.beats * spb, horizon = AC.currentTime + 0.2;
    for (let guard = 0; guard < 64; guard++) {
      if (song.i >= s.events.length) { if (s.once || !s.events.length) { song = null; return; } song.i = 0; song.t0 += len; }
      const ev = s.events[song.i], at = song.t0 + ev.beat * spb;
      if (at > horizon) return;
      if (at >= AC.currentTime - 0.02) {
        const dur = Math.max(0.03, ev.beats * spb * 0.92);
        if (ev.voice === "drums" && STYLE === "modern") { const k = String(ev.note); if (k === "kick") soft("sine", 70, 0.18, at, musicBus, 0.3); else hiss(k === "hat" ? 0.03 : 0.1, k === "hat" ? 8000 : 2400, at, musicBus, 0.12); }
        else if (ev.voice === "drums") drum(String(ev.note), at);
        else if (typeof ev.note === "number" && STYLE === "modern") soft(ev.voice === "lead" ? "sine" : "triangle", hz(ev.note), dur, at, musicBus, ev.voice === "bass" ? 0.2 : ev.voice === "harmony" ? 0.07 : 0.12);
        else if (typeof ev.note === "number" && BITS === 16 && ev.voice !== "bass") warm(hz(ev.note), dur, at, musicBus, ev.voice === "harmony" ? 0.05 : 0.08, ev.voice === "harmony" ? 1500 : 2600);
        else if (typeof ev.note === "number") tone(ev.voice === "bass" ? "triangle" : "square", hz(ev.note), dur, at, musicBus, ev.voice === "bass" ? 0.16 : ev.voice === "harmony" ? 0.035 : 0.055);
      }
      song.i++;
    }
  }
  function onEffect([name, a]) {
    if (name === "shake") { shake = Math.max(shake, +a[0] || 4); return; }
    // buzz (decision 145): a short tap of the phone's vibration, where there is one and sound isn't muted
    if (name === "buzz") { if (!muted && navigator.vibrate) try { navigator.vibrate(Math.max(1, Math.min(200, Math.round(+a[0] || 10)))); } catch (e) {} return; }
    if (!audio()) return;
    const now = AC.currentTime;
    if (name === "beep" && MODERN) soft("sine", +a[0] || 440, Math.max(0.04, +a[1] || 0.1), now, sfxBus, 0.2);
    else if (name === "beep") tone("square", +a[0] || 440, Math.max(0.02, +a[1] || 0.08), now, sfxBus, 0.12);
    else if (name === "hiss") hiss(Math.max(0.02, +a[0] || 0.1), +a[1] || 2000, now, sfxBus, 0.6);
  }
  function fail(e) { g.fillStyle = "#000"; g.fillRect(0, 0, W, H); words8(["CAN'T START", W / 2, 80, 8, "#ff5555"]); words8([String(e && e.message || e).slice(0, 30).toUpperCase(), W / 2, 100, 8, "#aaaaaa"]); console.error(e); }

  async function boot() {
    try {
      if (document.fonts && document.fonts.load) await Promise.race([Promise.all([document.fonts.load('8px "Press Start 2P"'), MODERN ? document.fonts.load('800 20px Sora') : null]), new Promise(r => setTimeout(r, 2500))]);
      const src = await (await fetch(opts.game, { cache: "no-cache" })).text();
      if (S.libraries) { S.libraries.setBase(""); const missing = S.libraries.missing(src); if (missing.length) await S.libraries.load(missing); }
      const keep = store.get(saveKey, null);
      const host = { saved: keep ? S.libraries.fromJS(keep) : S.valueCellOf([], new Map()), console8: true };
      game = LIVE.makeGame(src, { W, H, onEffect, host });
      root.Eight.game = game;
      // the maker's plate shows the game's own hero, drawn from its art
      try { const art = skin.mascot ? game.file.field(skin.mascot) : S.UNSET, ink = game.file.field(skin.mascotInk || "ink");
        if (art !== S.UNSET && S.isCell(art)) { const bm = bitmap(art, ink === S.UNSET ? null : ink), m = $(".mascot"); m.width = bm.width; m.height = bm.height; m.getContext("2d").drawImage(bm, 0, 0); } else $(".mascot").style.display = "none"; } catch (e) {}
      // one frame first: the state only has its clock, input and dt once update has run
      game.tick(STEP, heldCell());
      showMute();
    } catch (e) { fail(e); return; }
    let last = performance.now(), acc = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      pollPad();
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      try {
        if (!paused) { acc += dt; let n = 0; while (acc >= STEP && n < 4) { game.tick(STEP, heldCell()); LATCH.clear(); acc -= STEP; n++; } if (n === 4) acc = 0; }
        const list = game.draw();
        if (MODERN) { g.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0); g.imageSmoothingEnabled = true; }
        g.save();
        if (shake > 0.3 && !paused) g.translate(Math.round((Math.random() * 2 - 1) * shake), Math.round((Math.random() * 2 - 1) * shake));
        shake *= 0.86;
        paint(list);
        g.restore();
        if (BITS === 256) bloom();
        if (paused && MODERN) { g.fillStyle = "#0a0a1a88"; g.fillRect(0, 0, W, H); modernText(["Paused", W / 2, H / 2 - 10, 30, "#ffffff"]); modernText([touch ? "Tap to play" : "Enter to play", W / 2, H / 2 + 28, 15, "#ffffffbb"]); }
        else if (paused) { g.fillStyle = "#000000aa"; g.fillRect(0, 0, W, H); words8(["PAUSE", W / 2, H / 2, 16, "#ffffff"]); words8([touch ? "TAP TO PLAY" : "ENTER TO PLAY", W / 2, H / 2 + 20, 8, "#aaaaaa"]); }
        const st = game.state;
        if (AC) { setSong(st.fieldNames().includes("song") ? st.field("song") : false); pumpSong(); }
        if (++frames % 30 === 0 && st.fieldNames().includes("keep")) { const k = JSON.stringify(S.libraries.toJS(st.field("keep"))); if (k !== saved) { const first = saved === ""; saved = k; store.set(saveKey, JSON.parse(k)); const m = $(".mem"); if (m && !first) { m.classList.add("on"); setTimeout(() => m.classList.remove("on"), 900); } } }
      } catch (e) { fail(e); }
    }
    requestAnimationFrame(frame);
  }
  boot();
  return { get game() { return game; } };
}

root.Eight = { start, snap, get W() { return W; }, get H() { return H; }, get bits() { return BITS; }, get style() { return STYLE; } };
})(window);
