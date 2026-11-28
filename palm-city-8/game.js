'use strict';
/* Palm City 8: an island town seen from above, with buildings that lean in fake 3D.
   Everything is drawn in code onto one small canvas that the page scales up. */

/* ================= screen ================= */
const cv = document.getElementById('c'), g = cv.getContext('2d');
g.imageSmoothingEnabled = false;
const SW = 336, SH = 224;
const P = {
  ink: '#1a0726', deep: '#2b0f3a', purp: '#4b1d63', violet: '#7a2bd1', pink: '#ff3ea5', blush: '#ff8fcb', teal: '#26d9d9', cream: '#ffe8f4', sun: '#ffd36b', red: '#ff2a55',
  road: '#3c3843', road2: '#46414d', road3: '#34303a', line: '#ffd36b', white: '#f3eee6',
  walk: '#cfc2b4', walk2: '#b8aa9a', curb: '#8f8478',
  grass: '#5aa83c', grass2: '#4a9432', grass3: '#73c24f', fair: '#6cc04a', fair2: '#62b442',
  sand: '#f2d49b', sand2: '#e3bd7d', wet: '#e2bd84', sea: '#1f86c2', shallow: '#3fb3d8', sea2: '#176fa3', foam: '#e8fbff',
  lot: '#4a4652', path: '#d9c49a', plaza: '#e8d8c8', plaza2: '#dccab8', plank: '#b07a5a', plank2: '#8a5a44',
  trunk: '#7a4a32', frond: '#2fae4f', frond2: '#1f8a3c', glass: '#24203a'
};
let ctx = g;   // what px() draws on: the screen, or a picture being painted
const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
const hash = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000 / 1000;
const pick = list => list[(Math.random() * list.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angleDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
// darken or lighten a #rrggbb colour
function shade(hex, k) { const n = parseInt(hex.slice(1), 16), f = v => clamp(Math.round(v * k), 0, 255); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; }
/* ================= pixel font (5x7) ================= */
// each letter is seven rows of five bits, written as two hex digits per row
const FONT = {};
Object.entries({
  A: '0e11111f111111', B: '1e11111e11111e', C: '0e11101010110e', D: '1e11111111111e', E: '1f10101e10101f', F: '1f10101e101010', G: '0e111017111 10f',
  H: '1111111f111111', I: '0e04040404040e', J: '0702020202120c', K: '11121418141211', L: '1010101010101f', M: '111b1515111111', N: '11111915131111',
  O: '0e11111111110e', P: '1e11111e101010', Q: '0e11111115120d', R: '1e11111e141211', S: '0f10100e01011e', T: '1f040404040404', U: '1111111111110e',
  V: '11111111110a04', W: '11111115151 50a', X: '11110a040a1111', Y: '11110a04040404', Z: '1f01020408101f',
  0: '0e11131519110e', 1: '040c040404040e', 2: '0e11010204081f', 3: '1f02040201110e', 4: '02060a121f0202', 5: '1f101e0101110e', 6: '0608101e11110e',
  7: '1f010204080808', 8: '0e11110e11110e', 9: '0e11110f01020c',
  '$': '040f140e051e04', '!': '04040404040004', ':': '000c0c000c0c00', '.': '00000000000c0c', '-': '0000001f000000', '?': '0e110102040004',
  "'": '04040800000000', ',': '000000000c0408', '/': '01010204081010', '+': '0004041f040400', '*': '0015 0e1f0e1500', ' ': '00000000000000'
}).forEach(([ch, hex]) => { hex = hex.replace(/ /g, ''); FONT[ch] = [0, 1, 2, 3, 4, 5, 6].map(r => parseInt(hex.substr(r * 2, 2), 16)); });
function text(s, x, y, c, k = 1) {
  s = String(s).toUpperCase(); let cx = Math.round(x);
  for (const ch of s) { const rows = FONT[ch] || FONT['?'];
    for (let r = 0; r < 7; r++) for (let b = 0; b < 5; b++) if (rows[r] & (16 >> b)) px(cx + b * k, y + r * k, k, k, c);
    cx += 6 * k; }
}
const tw = (s, k = 1) => String(s).length * 6 * k - k;
function ctext(s, y, c, k = 1, shadow) { const x = Math.round((SW - tw(s, k)) / 2); if (shadow) text(s, x + k, y + k, shadow, k); text(s, x, y, c, k); }

/* ================= the island ================= */
const MW = 164, MH = 142, T = 16;
const SEA = 0, SAND = 1, ROAD = 2, WALK = 3, BLD = 4, GRASS = 5, POND = 6, PATH = 7, LOT = 8, RUNWAY = 9, RAMP = 10, FAIRWAY = 11, BUNKER = 12, PIER = 13, PLAZA = 14;
const map = new Uint8Array(MW * MH), blocked = new Uint8Array(MW * MH), ring = new Uint8Array(MW * MH), rampDir = new Float32Array(MW * MH);
const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
const at = (x, y) => inMap(x, y) ? map[y * MW + x] : SEA;
const set = (x, y, v) => { if (inMap(x, y)) map[y * MW + x] = v; };
const isWater = t => t === SEA || t === POND;
const solidTile = (x, y) => inMap(x, y) && (map[y * MW + x] === BLD || blocked[y * MW + x] === 1);
let seed = 20260;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const IC = { x: 76, y: 68, rx: 64, ry: 56 };
function smoothNoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), u = (x - xi) * (x - xi) * (3 - 2 * (x - xi)), v = (y - yi) * (y - yi) * (3 - 2 * (y - yi));
  return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v;
}
// 0 at the middle of the island, 1 at the shoreline
const islandD = (x, y) => Math.pow(Math.pow(Math.abs(x + .5 - IC.x) / IC.rx, 4) + Math.pow(Math.abs(y + .5 - IC.y) / IC.ry, 4), .25);
const coastD = (x, y) => islandD(x, y) + (smoothNoise(x / 5, y / 5) - .5) * .07;
// streets: three tiles wide every twelve tiles; blocks are the nine tiles between
const gridOff = v => ((v - 8) % 12 + 12) % 12;
const gridX = x => gridOff(x) < 3, gridY = y => gridOff(y) < 3;
const roadBase = v => v - gridOff(v);
const blockOrigin = b => 11 + 12 * b;
const BUILDINGS = [], PALMS = [], LAMPS = [], DECOR = [];
const STUNT_IDS = new Set();
function addRamp(x, y, a, id) { set(x, y, RAMP); rampDir[y * MW + x] = a; STUNT_IDS.add(id); RAMP_ID[y * MW + x] = id; }
const RAMP_ID = new Int16Array(MW * MH);
let SANDBAR_X = 999;
function addPalm(x, y, h) { if (!inMap(x, y)) return; PALMS.push({ x: x * T + 8, y: y * T + 8, h: h || 30 + (hash(x, y) * 18 | 0), bend: hash(y, x) * 2 - 1 }); blocked[y * MW + x] = 1; }
// big open areas: block ranges merged together, streets and all
const ZONES = [
  { kind: 'park', bi0: 1, bj0: 1, bi1: 2, bj1: 2, name: 'PALM PARK' },
  { kind: 'links', bi0: 8, bj0: 1, bi1: 9, bj1: 2, name: 'THE LINKS' },
  { kind: 'drag', bi0: 3, bj0: 8, bi1: 7, bj1: 8, name: 'DRAG STRIP' },
  { kind: 'mall', bi0: 5, bj0: 6, bi1: 6, bj1: 7, name: 'MEGAMALL 86' },
  { kind: 'mansion', bi0: 8, bj0: 6, bi1: 9, bj1: 7, name: 'STREAM HOUSE' }
];
const zoneRect = z => ({ x0: blockOrigin(z.bi0), y0: blockOrigin(z.bj0), x1: blockOrigin(z.bi1) + 8, y1: blockOrigin(z.bj1) + 8 });
const zoneOfBlock = (bi, bj) => ZONES.find(z => bi >= z.bi0 && bi <= z.bi1 && bj >= z.bj0 && bj <= z.bj1);
function districtOfBlock(bi, bj) {
  if (bj === 5 && bi >= 4 && bi <= 8) return 'strip';
  if (bi >= 4 && bi <= 7 && bj >= 2 && bj <= 4) return 'downtown';
  if (bi >= 1 && bi <= 3 && bj >= 4 && bj <= 8) return 'oldtown';
  return 'mid';
}
// 80s parody signs for rooftops
const SIGNS = ['PIXEL PALACE', 'BLOCKBUSTA VIDEO', 'RADICAL RINK', 'NEW KOLA', 'HAIRSPRAY 9000', 'JUST SAY MAYBE', 'TUBULAR TANS', 'VHS 4 LIFE', 'BOOMBOX BROS', 'NEON NIGHTS', 'MALL RATS', 'SYNTH CITY', 'LEG WARMERZ', 'TOTALLY RAD'];
const WALLS = ['#f2a7c3', '#9be3c9', '#c3a6e8', '#ffc49b', '#9fd3f0', '#f3e6c8', '#ffd6e8', '#b8f0e0'];
function addBuilding(tx, ty, w, h, height, style, extra = {}) {
  for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) set(x, y, BLD);
  const wall = style === 'tower' ? pick(['#4f7fa8', '#5a8fb0', '#6a7fb8', '#4a9aa0']) : style === 'house' ? pick(['#ffd1b3', '#f6c1d8', '#c9e8d2', '#fbe3a0', '#d4c8f0']) : pick(WALLS);
  const b = { x0: tx * T, y0: ty * T, x1: (tx + w) * T, y1: (ty + h) * T, tw: w, th: h, h: height, style, wall, seed: (tx * 31 + ty * 17) % 97, ...extra };
  b.faces = { s: wall, e: shade(wall, .82), w: shade(wall, .7), n: shade(wall, .6) };
  BUILDINGS.push(b); return b;
}
function buildIsland() {
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const d = islandD(x, y), dn = coastD(x, y); let v;
    if (dn >= 1) v = SEA; else if (dn > .87) v = SAND; else if (d > .79) { v = ROAD; ring[y * MW + x] = 1; } else if (gridX(x) || gridY(y)) v = ROAD; else v = WALK;
    set(x, y, v);
  }
  // blocks
  for (let bj = 0; bj <= 10; bj++) for (let bi = 0; bi <= 10; bi++) {
    if (zoneOfBlock(bi, bj)) continue;
    const x0 = blockOrigin(bi), y0 = blockOrigin(bj);
    let whole = true; for (let y = y0; y < y0 + 9; y++) for (let x = x0; x < x0 + 9; x++) if (at(x, y) !== WALK) whole = false;
    if (!whole) {   // blocks cut by the coast road become little beach parks
      for (let y = y0; y < y0 + 9; y++) for (let x = x0; x < x0 + 9; x++) if (at(x, y) === WALK) { set(x, y, GRASS); if (rnd() < .08) addPalm(x, y); }
      continue;
    }
    const kind = districtOfBlock(bi, bj), r = rnd();
    if (kind === 'oldtown') {
      for (const [ox, oy] of [[1, 1], [5, 1], [1, 5], [5, 5]]) addBuilding(x0 + ox, y0 + oy, 3, 3, 18 + (rnd() * 8 | 0), 'house');
      for (let y = y0 + 1; y < y0 + 8; y++) for (let x = x0 + 1; x < x0 + 8; x++) if (at(x, y) === WALK) { set(x, y, GRASS); if (rnd() < .1 && (x - x0 === 4 || y - y0 === 4)) addPalm(x, y, 26); }
    } else if (kind === 'downtown') {
      if (r < .65) addBuilding(x0 + 1, y0 + 1, 7, 7, 84 + (rnd() * 40 | 0), 'tower', { helipad: rnd() < .5 });
      else { addBuilding(x0 + 1, y0 + 1, 7, 3, 64 + (rnd() * 40 | 0), 'tower'); addBuilding(x0 + 1, y0 + 5, 7, 3, 64 + (rnd() * 40 | 0), 'tower'); }
    } else if (kind === 'strip') {
      if (bi === 6) addBuilding(x0 + 1, y0 + 1, 7, 7, 46, 'casino', { sign: 'CASINO' });
      else addBuilding(x0 + 1, y0 + 1, 7, 7, 34 + (rnd() * 18 | 0), 'deco', { sign: SIGNS[(bi * 3 + bj) % SIGNS.length], neon: true });
    } else if (r < .14) {   // plaza with palms and a fountain
      for (let y = y0 + 1; y < y0 + 8; y++) for (let x = x0 + 1; x < x0 + 8; x++) set(x, y, PLAZA);
      set(x0 + 4, y0 + 4, POND); for (const [ox, oy] of [[2, 2], [6, 2], [2, 6], [6, 6]]) addPalm(x0 + ox, y0 + oy);
    } else if (r < .24) {   // parking lot
      for (let y = y0 + 1; y < y0 + 8; y++) for (let x = x0 + 1; x < x0 + 8; x++) set(x, y, LOT);
    } else if (r < .55) addBuilding(x0 + 1, y0 + 1, 7, 7, 28 + (rnd() * 22 | 0), 'deco', { sign: rnd() < .35 ? SIGNS[(bi * 5 + bj * 3) % SIGNS.length] : null });
    else if (r < .78) { addBuilding(x0 + 1, y0 + 1, 7, 3, 24 + (rnd() * 30 | 0), 'deco'); addBuilding(x0 + 1, y0 + 5, 7, 3, 24 + (rnd() * 30 | 0), 'deco'); }
    else { addBuilding(x0 + 1, y0 + 1, 3, 7, 24 + (rnd() * 30 | 0), 'deco'); addBuilding(x0 + 5, y0 + 1, 3, 7, 24 + (rnd() * 30 | 0), 'deco'); }
  }
  // the open areas
  for (const z of ZONES) {
    const { x0, y0, x1, y1 } = zoneRect(z), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const own = (x, y) => !ring[y * MW + x] && at(x, y) !== SEA && at(x, y) !== SAND;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!own(x, y)) continue;
      if (z.kind === 'park') {
        const d = Math.hypot((x - cx) / 6, (y - cy) / 4.5);
        set(x, y, d < 1 ? POND : d < 1.35 || Math.abs(x - cx) < .6 || Math.abs(y - cy) < .6 ? PATH : GRASS);
        if (at(x, y) === GRASS && rnd() < .07) addPalm(x, y);
      } else if (z.kind === 'links') {
        set(x, y, smoothNoise(x / 3, y / 3) > .72 ? BUNKER : Math.hypot(x - cx - 4, y - cy + 3) < 2.6 ? POND : FAIRWAY);
      } else if (z.kind === 'drag') set(x, y, RUNWAY);
      else if (z.kind === 'mall') set(x, y, LOT);
      else if (z.kind === 'mansion') set(x, y, GRASS);
    }
    if (z.kind === 'links') { addRamp(Math.round(cx) - 5, Math.round(cy) + 2, -Math.PI / 2, 10); addRamp(Math.round(cx) - 4, Math.round(cy) + 2, -Math.PI / 2, 10); DECOR.push({ kind: 'flag', x: (cx + 4) * T, y: (cy - 6) * T }, { kind: 'flag', x: (cx - 6) * T, y: (cy + 5) * T }); }
    if (z.kind === 'drag') { for (const rx of [x0 + 16, x0 + 34]) for (let y = y0 + 3; y <= y0 + 5; y++) addRamp(rx, y, 0, 20 + rx); DECOR.push({ kind: 'start', x: (x0 + 2) * T, y: y0 * T, h: (y1 - y0 + 1) * T }); }
    if (z.kind === 'mall') addBuilding(Math.round(cx) - 6, Math.round(cy) - 4, 12, 7, 30, 'mall', { sign: 'MEGAMALL 86' });
    if (z.kind === 'mansion') {
      addBuilding(Math.round(cx) - 5, Math.round(cy) - 5, 10, 5, 34, 'mansion', { sign: 'STREAM HOUSE' });
      for (let y = Math.round(cy) + 1; y <= Math.round(cy) + 3; y++) for (let x = Math.round(cx) - 3; x <= Math.round(cx) + 2; x++) set(x, y, POND);
      for (let y = Math.round(cy) + 4; y <= y1; y++) set(Math.round(cx) + 4, y, PATH);
      for (const [ox, oy] of [[-8, -6], [7, -6], [-8, 4], [7, 4], [-8, -1], [7, -1]]) addPalm(Math.round(cx) + ox, Math.round(cy) + oy, 40);
    }
  }
  // street lamps on the corners
  for (let j = 0; j <= 11; j++) for (let i = 0; i <= 11; i++) {
    const x = 8 + 12 * i, y = 8 + 12 * j;
    for (const [dx, dy] of [[-1, -1], [3, -1], [-1, 3], [3, 3]]) if (at(x + dx, y + dy) === WALK && !ring[(y + 1) * MW + x + 1]) LAMPS.push({ x: (x + dx) * T + 8, y: (y + dy) * T + 8 });
  }
  // the beach: palms, ramps, a pier out to a sandbar
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (at(x, y) === SAND && rnd() < .035 && at(x + 1, y) === SAND && at(x - 1, y) === SAND) addPalm(x, y);
  const midSand = (x, y, dx, dy) => { while (inMap(x, y) && at(x, y) !== SAND) { x += dx; y += dy; } return [x + dx * 2, y + dy * 2]; };
  { const [x, y] = midSand(IC.x - 14, 0, 0, 1); addRamp(x, y, 0, 1); addRamp(x, y + 1, 0, 1); }
  { const [x, y] = midSand(IC.x + 10, MH - 1, 0, -1); addRamp(x, y, Math.PI, 2); addRamp(x, y - 1, Math.PI, 2); }
  { const [x, y] = midSand(0, IC.y + 12, 1, 0); addRamp(x, y, -Math.PI / 2, 3); addRamp(x + 1, y, -Math.PI / 2, 3); }
  const py = IC.y - 2; let pierX = MW - 1; while (at(pierX - 1, py) === SEA) pierX--;
  const pe = pierX + 9, ic = pe + 8;   // pier end, sandbar centre
  for (let x = pierX; x <= pe; x++) for (const y of [py, py + 1]) set(x, y, PIER);
  addRamp(pe, py, 0, 4); addRamp(pe, py + 1, 0, 4);
  for (let y = py - 8; y <= py + 9; y++) for (let x = ic - 6; x <= ic + 6; x++) if (Math.hypot((x - ic) / 5.2, (y - py - .5) / 8.6) < 1) set(x, y, SAND);
  addRamp(ic - 4, py, Math.PI, 5); addRamp(ic - 4, py + 1, Math.PI, 5);
  addPalm(ic + 1, py - 5, 42); addPalm(ic + 2, py + 6, 36); addPalm(ic - 1, py + 3, 30); SANDBAR_X = ic - 6;
  for (let i = 0; i < 40; i++) { const x = (rnd() * MW) | 0, y = (rnd() * MH) | 0; if (at(x, y) === SAND && !blocked[y * MW + x]) DECOR.push({ kind: 'towel', x: x * T + 8, y: y * T + 8, c: i % 4 }); }
  paintGround(); paintRadar();
  for (const b of BUILDINGS) b.roof = paintRoof(b);
}

/* ================= painting the ground ================= */
let frame = 0;
const groundPic = document.createElement('canvas'); groundPic.width = MW * T; groundPic.height = MH * T;
const groundCtx = groundPic.getContext('2d');
const nearT = (x, y, t) => at(x - 1, y) === t || at(x + 1, y) === t || at(x, y - 1) === t || at(x, y + 1) === t;
function speckle(sx, sy, n, c, tx, ty, w = 1, h = 1) { for (let i = 0; i < n; i++) px(sx + (hash(tx * 7 + i, ty * 3 - i) * (16 - w) | 0), sy + (hash(ty * 5 + i, tx + i * 11) * (16 - h) | 0), w, h, c); }
function paintTile(x, y) {
  const t = at(x, y), sx = x * T, sy = y * T;
  switch (t) {
    case SEA: { const dn = coastD(x, y); px(sx, sy, 16, 16, dn < 1.05 ? P.shallow : dn < 1.12 ? '#2a9bcf' : P.sea); speckle(sx, sy, 2, dn < 1.05 ? '#5cc4e4' : P.sea2, x, y, 3, 1); break; }
    case SAND: px(sx, sy, 16, 16, nearT(x, y, SEA) ? P.wet : P.sand); speckle(sx, sy, 5, P.sand2, x, y); if (hash(x, y) < .04) px(sx + 6, sy + 7, 2, 2, '#fff4e0'); break;
    case ROAD: paintRoad(x, y, sx, sy); break;
    case WALK: {
      px(sx, sy, 16, 16, P.walk); px(sx, sy + 7, 16, 1, P.walk2); px(sx + 7, sy, 1, 16, P.walk2); px(sx, sy + 15, 16, 1, P.walk2); px(sx + 15, sy, 1, 16, P.walk2);
      if (hash(x, y) < .2) px(sx + 2, sy + 10, 2, 1, '#a89a8a');
      const r = (ax, ay) => at(ax, ay) === ROAD;
      if (r(x, y - 1)) px(sx, sy, 16, 2, P.curb); if (r(x, y + 1)) px(sx, sy + 14, 16, 2, P.curb); if (r(x - 1, y)) px(sx, sy, 2, 16, P.curb); if (r(x + 1, y)) px(sx + 14, sy, 2, 16, P.curb);
      break; }
    case GRASS: px(sx, sy, 16, 16, P.grass); speckle(sx, sy, 6, P.grass2, x, y, 1, 3); speckle(sx, sy, 3, P.grass3, x + 50, y, 2, 1);
      if (hash(x + 9, y) < .12) { const fx = sx + 4 + (hash(y, x) * 8 | 0), fy = sy + 5 + (hash(x + 1, y) * 6 | 0); px(fx - 1, fy, 3, 1, pick(['#ff8fcb', '#fff1a8', '#ffffff'])); px(fx, fy - 1, 1, 3, '#ff8fcb'); } break;
    case FAIRWAY: px(sx, sy, 16, 16, (y & 1) ? P.fair : P.fair2); speckle(sx, sy, 2, P.grass3, x, y, 2, 1); break;
    case BUNKER: px(sx, sy, 16, 16, '#efd9a5'); speckle(sx, sy, 4, '#dcc28a', x, y); if (at(x, y - 1) !== BUNKER) px(sx, sy, 16, 2, '#c9ad72'); break;
    case POND: px(sx, sy, 16, 16, P.shallow); if (!isWater(at(x, y - 1))) px(sx, sy, 16, 3, '#a99f95'); if (!isWater(at(x, y + 1))) px(sx, sy + 14, 16, 2, '#c8beb3'); if (!isWater(at(x - 1, y))) px(sx, sy, 2, 16, '#b5aba0'); if (!isWater(at(x + 1, y))) px(sx + 14, sy, 2, 16, '#b5aba0'); break;
    case PATH: px(sx, sy, 16, 16, P.path); speckle(sx, sy, 5, '#c4ad80', x, y, 2, 2); break;
    case PLAZA: for (let i = 0; i < 4; i++) px(sx + (i & 1) * 8, sy + (i >> 1) * 8, 8, 8, ((x * 2 + (i & 1)) + (y * 2 + (i >> 1))) & 1 ? P.plaza : P.plaza2); break;
    case LOT: px(sx, sy, 16, 16, P.lot); speckle(sx, sy, 3, '#55505e', x, y); if (y % 3 !== 1) px(sx, sy + 2, 1, 12, P.white); else if (x % 4 === 0) px(sx + 4, sy + 7, 8, 2, P.white); break;
    case RUNWAY: px(sx, sy, 16, 16, P.road); speckle(sx, sy, 4, P.road3, x, y); if ((y - 107) === 4 && (x & 1)) px(sx + 2, sy + 7, 12, 2, P.white); if (at(x, y - 1) !== RUNWAY) px(sx, sy, 16, 2, P.white); if (at(x, y + 1) !== RUNWAY) px(sx, sy + 14, 16, 2, P.white); break;
    case PIER: px(sx, sy, 16, 16, P.plank); for (let i = 0; i < 16; i += 4) px(sx + i, sy, 1, 16, P.plank2); if (at(x, y - 1) !== PIER) px(sx, sy, 16, 2, P.white); if (at(x, y + 1) !== PIER) px(sx, sy + 14, 16, 2, P.white); break;
    case RAMP: paintRamp(x, y, sx, sy); break;
    case BLD: px(sx, sy, 16, 16, '#2a2430'); break;
  }
}
function paintRoad(x, y, sx, sy) {
  px(sx, sy, 16, 16, P.road); speckle(sx, sy, 6, P.road2, x, y); speckle(sx, sy, 3, P.road3, x + 3, y, 2, 1);
  if (ring[y * MW + x]) { if (at(x, y - 1) === SAND) px(sx, sy, 16, 1, P.white); if (at(x, y + 1) === SAND) px(sx, sy + 15, 16, 1, P.white); if (at(x - 1, y) === SAND) px(sx, sy, 1, 16, P.white); if (at(x + 1, y) === SAND) px(sx + 15, sy, 1, 16, P.white); return; }
  const v = gridX(x), h = gridY(y), ox = gridOff(x), oy = gridOff(y);
  if (v && h) return;   // crossings stay plain
  if (v) {
    if (ox === 1) px(sx + 7, sy + (y & 1 ? 0 : 8), 2, 6, P.line);           // dashed centre line
    if (ox === 0) px(sx + 1, sy, 1, 16, '#8a8590'); if (ox === 2) px(sx + 14, sy, 1, 16, '#8a8590');
    if (gridY(y - 1) && !ring[(y - 1) * MW + x]) for (let i = 0; i < 4; i++) px(sx + 1 + i * 4, sy + 2, 2, 7, P.white);   // crosswalks
    if (gridY(y + 1) && !ring[(y + 1) * MW + x]) for (let i = 0; i < 4; i++) px(sx + 1 + i * 4, sy + 7, 2, 7, P.white);
  } else if (h) {
    if (oy === 1) px(sx + (x & 1 ? 0 : 8), sy + 7, 6, 2, P.line);
    if (oy === 0) px(sx, sy + 1, 16, 1, '#8a8590'); if (oy === 2) px(sx, sy + 14, 16, 1, '#8a8590');
    if (gridX(x - 1) && !ring[y * MW + x - 1]) for (let i = 0; i < 4; i++) px(sx + 2, sy + 1 + i * 4, 7, 2, P.white);
    if (gridX(x + 1) && !ring[y * MW + x + 1]) for (let i = 0; i < 4; i++) px(sx + 7, sy + 1 + i * 4, 7, 2, P.white);
  }
}
function paintRamp(x, y, sx, sy) {
  const a = rampDir[y * MW + x], dx = Math.round(Math.cos(a)), dy = Math.round(Math.sin(a)), under = at(x - dx, y - dy);
  px(sx, sy, 16, 16, under === SAND ? P.sand : under === PIER ? P.plank : under === FAIRWAY ? P.fair : P.road);
  const shades = ['#6a3cab', '#7a48bd', '#8a5ad1', '#9b6ae0', '#ad7eea', '#c095f0', '#d3aef6', '#e6cdfb'];
  for (let i = 0; i < 8; i++) { if (dx) px(sx + (dx > 0 ? i * 2 : 14 - i * 2), sy + 1, 2, 14, shades[i]); else px(sx + 1, sy + (dy > 0 ? i * 2 : 14 - i * 2), 14, 2, shades[i]); }
  if (dx) px(dx > 0 ? sx + 14 : sx, sy + 1, 2, 14, P.sun); else px(sx + 1, dy > 0 ? sy + 14 : sy, 14, 2, P.sun);
  if (dx) px(sx + 6, sy + 7, 4, 2, P.pink); else px(sx + 7, sy + 6, 2, 4, P.pink);
}
function paintGround() {
  ctx = groundCtx;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) paintTile(x, y);
  // decorations on the ground
  for (const d of DECOR) {
    if (d.kind === 'towel') { const c = [[P.pink, P.cream], [P.teal, P.cream], [P.sun, P.pink], [P.violet, P.sun]][d.c]; px(d.x - 4, d.y - 7, 9, 14, c[0]); px(d.x - 4, d.y - 3, 9, 3, c[1]); px(d.x - 4, d.y + 3, 9, 2, c[1]); }
    if (d.kind === 'flag') { px(d.x - 3, d.y + 2, 7, 3, '#2a2430'); px(d.x, d.y - 14, 1, 16, P.white); px(d.x + 1, d.y - 14, 6, 4, P.red); }
    if (d.kind === 'start') for (let y = 0; y < d.h; y += 4) for (let i = 0; i < 2; i++) px(d.x + i * 4, d.y + y, 4, 4, ((y >> 2) + i) & 1 ? P.ink : P.white);
  }
  // shadows: light from the top left, so buildings and palms throw shadows down and right
  ctx.fillStyle = 'rgba(16,8,24,.30)';
  for (const b of BUILDINGS) { const k = b.h * .45, dx = k, dy = k * .7; ctx.beginPath(); ctx.moveTo(b.x1, b.y0); ctx.lineTo(b.x1 + dx, b.y0 + dy); ctx.lineTo(b.x1 + dx, b.y1 + dy); ctx.lineTo(b.x0 + dx, b.y1 + dy); ctx.lineTo(b.x0, b.y1); ctx.lineTo(b.x1, b.y1); ctx.closePath(); ctx.fill(); }
  for (const p of PALMS) { ctx.beginPath(); ctx.ellipse(p.x + p.h * .4, p.y + p.h * .28, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx = g;
}
// the roof of each building is painted once, then drawn scaled to its height each frame
function paintRoof(b) {
  const c = document.createElement('canvas'); c.width = b.x1 - b.x0; c.height = b.y1 - b.y0; ctx = c.getContext('2d');
  const W = c.width, H = c.height, s = b.seed;
  if (b.style === 'house') {
    const roofs = ['#c8644a', '#b85a7a', '#5a7ab8', '#4a9a7a', '#d08a3a'], rc = roofs[s % roofs.length];
    px(0, 0, W, H, rc); px(0, 0, W, H / 2, shade(rc, 1.15)); px(0, H / 2 - 1, W, 2, shade(rc, .7));
    for (let y = 3; y < H; y += 4) px(0, y, W, 1, shade(rc, .85));
    px(W - 10, 4, 5, 7, '#8a7a7a'); px(W - 10, 4, 5, 2, '#5a4a4a');   // chimney
  } else {
    const roof = b.style === 'tower' ? '#7d8a99' : b.style === 'mall' ? '#b9b2c2' : '#a89fae';
    px(0, 0, W, H, roof); px(0, 0, W, 3, shade(roof, 1.25)); px(0, 0, 3, H, shade(roof, 1.15)); px(0, H - 3, W, 3, shade(roof, .75)); px(W - 3, 0, 3, H, shade(roof, .82));
    for (let y = 6; y < H - 6; y += 6) for (let x = 6; x < W - 6; x += 6) if (hash(x + s, y) < .5) px(x, y, 1, 1, shade(roof, .9));
    if (b.helipad) { const cx = W / 2, cy = H / 2; ctx.fillStyle = '#4a5260'; ctx.beginPath(); ctx.arc(cx, cy, Math.min(W, H) * .32, 0, Math.PI * 2); ctx.fill(); px(cx - 6, cy - 8, 3, 16, P.sun); px(cx + 4, cy - 8, 3, 16, P.sun); px(cx - 6, cy - 1, 13, 3, P.sun); }
    else if (b.style !== 'mall') for (let i = 0; i < 3; i++) { const ax = 8 + (hash(s, i) * (W - 28) | 0), ay = 8 + (hash(i, s) * (H - 24) | 0); px(ax, ay, 12, 9, '#d8d2de'); px(ax, ay + 9, 12, 2, '#6a6470'); for (let k = 0; k < 4; k++) px(ax + 2 + k * 3, ay + 2, 1, 6, '#8a8490'); }
    if (b.style === 'mall') for (let y = 12; y < H - 12; y += 16) for (let x = 12; x < W - 20; x += 22) { px(x, y, 14, 8, '#7fd3e8'); px(x, y, 14, 2, '#c8f2fb'); }
    if (b.style === 'tower' && !b.helipad) { px(W / 2 - 1, 6, 2, 18, '#5a6270'); px(W / 2 - 4, 6, 8, 2, P.red); }
    if (b.style === 'deco' || b.style === 'casino' || b.style === 'mansion') { px(4, 4, W - 8, 2, shade(b.wall, 1)); px(4, H - 6, W - 8, 2, shade(b.wall, 1)); }
  }
  if (b.sign) {   // a billboard on the roof
    const k = b.sign.length * 6 + 6 > W - 8 ? 1 : 2, w = tw(b.sign, k) + 8, x = Math.round((W - w) / 2), y = Math.round(H / 2 - 6 * k);
    const bg = b.style === 'casino' ? P.ink : b.neon ? P.deep : '#2a2430';
    px(x - 2, y - 2, w + 4, 7 * k + 12, '#1a1420'); px(x, y, w, 7 * k + 8, bg);
    text(b.sign, x + 4, y + 4, b.style === 'casino' ? P.sun : pick([P.pink, P.teal, P.sun, P.blush]), k);
    if (b.style === 'casino') for (let i = 0; i < w; i += 4) { px(x + i, y - 1, 2, 2, P.sun); px(x + i, y + 7 * k + 7, 2, 2, P.sun); }
  }
  ctx = g; return c;
}

/* ================= sprites ================= */
function makeSprite(w, h, paint) { const c = document.createElement('canvas'); c.width = w; c.height = h; ctx = c.getContext('2d'); paint(w, h); ctx = g; return c; }
function turnSprite(src, n, shadow = false) {
  const w = src.width, h = src.height, data = src.getContext('2d').getImageData(0, 0, w, h).data, D = Math.ceil(Math.hypot(w, h)) + 2, out = [];
  for (let i = 0; i < n; i++) {
    const a = i * Math.PI * 2 / n, co = Math.cos(a), si = Math.sin(a), c = document.createElement('canvas'); c.width = c.height = D;
    const cc = c.getContext('2d'), img = cc.createImageData(D, D);
    for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) {
      const dx = x + .5 - D / 2, dy = y + .5 - D / 2, sx = Math.floor(dx * co + dy * si + w / 2), sy = Math.floor(-dx * si + dy * co + h / 2);
      if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
      const s = (sy * w + sx) * 4, d = (y * D + x) * 4; if (!data[s + 3]) continue;
      if (shadow) img.data[d + 3] = 85; else { img.data[d] = data[s]; img.data[d + 1] = data[s + 1]; img.data[d + 2] = data[s + 2]; img.data[d + 3] = data[s + 3]; }
    }
    cc.putImageData(img, 0, 0); out.push(c);
  }
  return out;
}
const TURNS = 32;
const headingIndex = a => ((Math.round(a / (Math.PI * 2 / TURNS)) % TURNS) + TURNS) % TURNS;
// cars face east in their pictures: the front is on the right
function carPicture(kind, body, trim) {
  const W = kind === 'van' ? 26 : 24, H = 13;
  return makeSprite(W, H, () => {
    const dark = shade(body, .62), lite = shade(body, 1.25);
    for (const [x, y] of [[4, 0], [W - 9, 0], [4, H - 2], [W - 9, H - 2]]) px(x, y, 5, 2, '#141018');   // tyres
    px(2, 1, W - 4, H - 2, body); px(1, 2, W - 2, H - 4, body);
    px(2, 1, W - 4, 1, lite); px(2, H - 2, W - 4, 1, dark);                       // light from above
    if (kind === 'van') { px(W - 7, 2, 2, H - 4, P.glass); px(W - 6, 3, 1, 2, '#9fd3f0'); px(3, 2, W - 11, H - 4, shade(body, 1.08)); for (let i = 5; i < W - 9; i += 4) px(i, 2, 1, H - 4, dark); }
    else {
      px(W - 8, 2, 3, H - 4, P.glass); px(W - 7, 3, 1, 3, '#9fd3f0');            // windscreen
      px(7, 2, W - 15, H - 4, kind === 'sports' ? shade(body, .85) : lite); px(7, 2, W - 15, 1, shade(body, 1.4));   // roof
      px(5, 2, 2, H - 4, P.glass);                                               // back window
    }
    if (trim) { px(1, 5, W - 2, 3, trim); }
    if (kind === 'taxi') { px(10, 4, 5, 5, P.sun); px(11, 5, 3, 3, '#3a2408'); }
    if (kind === 'sports') { px(0, 1, 2, H - 2, '#141018'); }                     // spoiler
    px(W - 2, 2, 1, 2, '#fff6c8'); px(W - 2, H - 4, 1, 2, '#fff6c8');              // headlights
    px(1, 2, 1, 2, P.red); px(1, H - 4, 1, 2, P.red);                              // tail lights
    px(W - 9, 0, 1, 1, dark); px(W - 9, H - 1, 1, 1, dark);                          // mirrors
  });
}
function scooterPicture() {
  return makeSprite(14, 9, () => { px(0, 3, 3, 3, '#141018'); px(11, 3, 3, 3, '#141018'); px(2, 2, 10, 5, P.cream); px(10, 0, 1, 9, '#141018'); px(3, 1, 5, 7, '#3a5a9a'); px(4, 2, 4, 5, '#ffffff'); px(5, 3, 2, 3, '#1a2a4a'); });
}
const SPRITES = {};
function sprite(name, make) { if (!SPRITES[name]) { const pic = make(); SPRITES[name] = { look: turnSprite(pic, TURNS), shadow: turnSprite(pic, TURNS, true) }; } return SPRITES[name]; }
function drawSprite(sp, x, y, a, z = 0, shrink = 1) {
  const i = headingIndex(a), pic = sp.look[i], half = pic.width / 2, k = (1 + z / 40) * shrink, w = Math.round(pic.width * k);
  if (shrink === 1) g.drawImage(sp.shadow[i], Math.round(x - half + 2 + z * .5), Math.round(y - half + 3 + z * .6));
  g.drawImage(pic, Math.round(x - w / 2), Math.round(y - w / 2 - z), w, w);
}
const PLAYER_CAR = () => sprite('player', () => carPicture('sports', P.pink, P.teal));
const TRAFFIC_LOOKS = [['sedan', '#e8e2d6', null], ['sedan', '#4a7ab8', null], ['taxi', '#ffcf3a', null], ['van', '#f3eee6', P.teal], ['sedan', '#c8484a', null], ['sports', '#2fae9f', P.cream], ['sedan', '#8a5ad1', null], ['van', '#ffb07a', P.cream], ['sedan', '#3a3a44', null]];
const trafficCar = i => sprite('traffic' + i, () => carPicture(...TRAFFIC_LOOKS[i]));
const SCOOTER = () => sprite('scooter', scooterPicture);

/* ================= state ================= */
const best = (() => { try { return +localStorage.getItem('palmcity8.best') || 0; } catch (e) { return 0; } })();
let S, mode = 'title', musicOn = (() => { try { return localStorage.getItem('palmcity8.music') !== 'off'; } catch (e) { return true; } })();
let station = (() => { try { return +localStorage.getItem('palmcity8.station') || 0; } catch (e) { return 0; } })();
const keys = { up: 0, down: 0, left: 0, right: 0, a: 0, b: 0, fire: 0, door: 0 };
const stick = { x: 0, y: 0, mag: 0 };
const START = { x: (8 + 12 * 6 + 1.5) * T, y: (8 + 12 * 4 + 1.5) * T + 40 };   // downtown
function newGame() {
  S = { x: START.x, y: START.y, a: -Math.PI / 2, v: 0, side: 0, cash: 0, heat: 0, heatClock: 0, best, streak: 0, delivered: 0, fares: 0, races: 0,
    flash: null, flashT: 0, traffic: [], maids: [], shake: 0, drift: false, charge: 0, boost: 0, parts: [], geysers: [],
    air: 0, airMax: 0, z: 0, avx: 0, avy: 0, sink: 0, safe: { x: START.x, y: START.y, a: -Math.PI / 2 }, stunts: [], district: '', banner: null,
    job: null, say: null, markers: {}, cam: { x: START.x, y: START.y }, tapes: [] };
  for (let i = 0; i < 34; i++) S.traffic.push(spawnTraffic());
  for (const k of JOB_KINDS) placeMarker(k);
}
function flash(s, t = 90) { S.flash = s; S.flashT = t; }
function puff(x, y, n, col, spd, life, size = 2, up = 0) { for (let i = 0; i < n && S.parts.length < 400; i++) S.parts.push({ x, y, vx: (Math.random() - .5) * spd, vy: (Math.random() - .5) * spd - up, life: life * (.6 + Math.random() * .6), col, size }); }
const tileAtPx = (x, y) => at(Math.floor(x / T), Math.floor(y / T));
const solidAtPx = (x, y) => solidTile(Math.floor(x / T), Math.floor(y / T));
const blockedAt = (x, y, r) => solidAtPx(x - r, y - r) || solidAtPx(x + r, y - r) || solidAtPx(x - r, y + r) || solidAtPx(x + r, y + r);
const chaserBlocked = (x, y, r) => blockedAt(x, y, r) || isWater(tileAtPx(x, y));
const isGridRoad = (x, y) => at(x, y) === ROAD && !ring[y * MW + x];
function randomCurb() { for (;;) { const x = (Math.random() * MW) | 0, y = (Math.random() * MH) | 0; if (at(x, y) === WALK && (isGridRoad(x - 1, y) || isGridRoad(x + 1, y) || isGridRoad(x, y - 1) || isGridRoad(x, y + 1))) return { x: x * T + 8, y: y * T + 8 }; } }

/* ================= traffic: keeps right, turns at crossings ================= */
// lane centres: southbound and westbound use the first tile of a street, northbound and eastbound the third
function laneOf(c) {
  const tx = Math.floor(c.x / T), ty = Math.floor(c.y / T);
  if (c.dy) return { x: (roadBase(tx) + (c.dy > 0 ? 0 : 2)) * T + 8, y: null };
  return { x: null, y: (roadBase(ty) + (c.dx > 0 ? 2 : 0)) * T + 8 };
}
function spawnTraffic(far) {
  for (let k = 0; k < 800; k++) {
    const x = (Math.random() * MW) | 0, y = (Math.random() * MH) | 0;
    if (!isGridRoad(x, y) || (gridX(x) && gridY(y))) continue;
    if (far && Math.hypot(x * T - S.x, y * T - S.y) < 260) continue;
    const vert = gridX(x), c = { x: x * T + 8, y: y * T + 8, dx: vert ? 0 : (Math.random() < .5 ? 1 : -1), dy: vert ? (Math.random() < .5 ? 1 : -1) : 0, sp: 1 + Math.random() * .6, v: 1, look: (Math.random() * TRAFFIC_LOOKS.length) | 0, wait: 0, lastTurn: -1 };
    const l = laneOf(c); if (l.x !== null) c.x = l.x; else c.y = l.y; return c;
  }
  return { x: START.x, y: START.y - 200, dx: 0, dy: -1, sp: 1, v: 1, look: 0, wait: 0, lastTurn: -1 };
}
function updateTraffic() {
  for (const c of S.traffic) {
    // queue behind whatever is ahead
    const ax = c.x + c.dx * 20, ay = c.y + c.dy * 20;
    let stop = S.traffic.some(o => o !== c && Math.abs(o.x - ax) < 10 && Math.abs(o.y - ay) < 10) || (!S.air && Math.abs(S.x - ax) < 13 && Math.abs(S.y - ay) < 13);
    if (stop) c.wait++; else c.wait = 0;
    if (c.wait > 120) stop = false;   // nobody waits forever
    c.v = stop ? Math.max(0, c.v - .12) : Math.min(c.sp, c.v + .05);
    const tx = Math.floor(c.x / T), ty = Math.floor(c.y / T);
    // the middle tile of a crossing: maybe turn
    if (gridX(tx) && gridY(ty) && gridOff(tx) === 1 && gridOff(ty) === 1 && c.lastTurn !== tx * 1000 + ty) {
      const cx = tx * T + 8, cy = ty * T + 8;
      if (Math.abs(c.x - cx) <= c.v + .5 && Math.abs(c.y - cy) <= c.v + .5) {
        c.lastTurn = tx * 1000 + ty;
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !(dx === -c.dx && dy === -c.dy) && isGridRoad(tx + dx * 3, ty + dy * 3) && isGridRoad(tx + dx * 5, ty + dy * 5));
        if (opts.length) { const o = Math.random() < .5 && opts.some(q => q[0] === c.dx && q[1] === c.dy) ? [c.dx, c.dy] : pick(opts); c.dx = o[0]; c.dy = o[1]; c.x = cx; c.y = cy; }
      }
    }
    // dead end (the coast road, a park): turn round
    if (!isGridRoad(Math.floor((c.x + c.dx * 14) / T), Math.floor((c.y + c.dy * 14) / T))) { c.dx = -c.dx; c.dy = -c.dy; }
    // ease into the right lane
    const l = laneOf(c);
    if (l.x !== null) c.x += clamp(l.x - c.x, -1, 1); else c.y += clamp(l.y - c.y, -1, 1);
    c.x += c.dx * c.v; c.y += c.dy * c.v;
    if (!S.air && !S.sink && Math.abs(c.x - S.x) < 14 && Math.abs(c.y - S.y) < 14) {
      if (Math.hypot(S.v, S.side) > 1.6) { sfx('crash'); S.shake = 6; jobBump(); if (Math.hypot(S.v, S.side) > 2.6) addHeat(1, 'FENDER BENDER'); }
      S.v *= -.35; S.side = 0; S.drift = false; S.x -= Math.cos(S.a) * 6; S.y -= Math.sin(S.a) * 6; c.v = 0; c.wait = 0;
    }
    // cars far behind you come back somewhere nearer
    if (Math.abs(c.x - S.x) > 900 || Math.abs(c.y - S.y) > 700) Object.assign(c, spawnTraffic(true));
  }
}

/* ================= jobs: drive into a pin ================= */
const JOB_KINDS = ['deliver', 'taxi', 'race'];
const JOB_COLOUR = { deliver: P.pink, taxi: P.teal, race: P.sun };
const RIDERS = ['BRENDA', 'DUSTIN', 'MARIO', 'KAYLEE', 'DOUG', 'PRIYA', 'CHAD', 'NANA ROSE', 'GORD', 'TASHA'];
const SAY_START = ['TAKE ME TO BRUNCH. I AM LATE', 'NO SHORTCUTS THROUGH THE PARK', 'MY CAR GOT TOWED. LONG STORY', 'DRIVE LIKE MY NANA IS WATCHING', 'I HAVE A JOB INTERVIEW. HURRY', 'IS THIS A CAB OR A FLAMINGO?', 'I NEED TO RETURN THESE TAPES'];
const SAY_BUMP = ['MY SMOOTHIE!', 'EASY!', 'I JUST GOT MY NAILS DONE', 'WAS THAT A HYDRANT?', 'I HAVE A BAD BACK', 'IS THIS PART OF THE TOUR?', 'MY PERM!'];
const SAY_GOOD = ['SMOOTH. HERE IS A TIP', 'FIVE STARS. NO NOTES', 'NICE DRIVING. TELL NOBODY I SAID THAT'];
const SAY_BAD = ['I AM WALKING NEXT TIME', 'KEEP THE CHANGE. JUST LET ME OUT', 'I NEED A MINUTE'];
function say(line, t = 150) { S.say = { text: line, t }; }
function farCurb(min) { let t = randomCurb(); for (let i = 0; i < 300 && Math.hypot(t.x - S.x, t.y - S.y) < min; i++) t = randomCurb(); return t; }
function placeMarker(kind) {
  let t = farCurb(180);
  for (let i = 0; i < 100 && Object.values(S.markers).some(m => m && Math.hypot(m.x - t.x, m.y - t.y) < 260); i++) t = farCurb(180);
  S.markers[kind] = t;
}
// race route: a walk along the street grid, never through the coast road, parks or water
function streetOK(i0, j0, i1, j1) {
  if (i0 === i1) { const x = 8 + 12 * i0 + 1; for (let y = 8 + 12 * Math.min(j0, j1); y <= 8 + 12 * Math.max(j0, j1) + 2; y++) if (!isGridRoad(x, y)) return false; }
  else { const y = 8 + 12 * j0 + 1; for (let x = 8 + 12 * Math.min(i0, i1); x <= 8 + 12 * Math.max(i0, i1) + 2; x++) if (!isGridRoad(x, y)) return false; }
  return true;
}
function buildRoute(x, y) {
  for (let tries = 0; tries < 40; tries++) {
    let i = clamp(Math.round((x / T - 9.5) / 12), 0, 11), j = clamp(Math.round((y / T - 9.5) / 12), 0, 11), pdx = 0, pdy = 0;
    const pts = [];
    for (let n = 0; n < 14 && pts.length < 6; n++) {
      const opts = [];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (dx === -pdx && dy === -pdy) continue; const len = 1 + ((Math.random() * 2) | 0), ni = i + dx * len, nj = j + dy * len; if (ni >= 0 && nj >= 0 && ni <= 11 && nj <= 11 && streetOK(i, j, ni, nj)) opts.push([dx, dy, len]); }
      if (!opts.length) break;
      const [dx, dy, len] = pick(opts); i += dx * len; j += dy * len; pdx = dx; pdy = dy;
      pts.push({ x: (8 + 12 * i + 1.5) * T, y: (8 + 12 * j + 1.5) * T });
    }
    if (pts.length >= 5) return pts;
  }
  return [{ x: START.x, y: START.y - 400 }];
}
function startJob(kind) {
  const from = S.markers[kind];
  if (kind === 'deliver') { const t = farCurb(420); S.job = { kind, target: t, timer: Math.round(Math.hypot(t.x - S.x, t.y - S.y) / 62 + 18) * 60 }; sfx('pickup'); flash('PACKAGE IN. DROP IT OFF'); }
  else if (kind === 'taxi') { const t = farCurb(380); S.job = { kind, target: t, timer: Math.round(Math.hypot(t.x - S.x, t.y - S.y) / 55 + 24) * 60, bumps: 0, rider: pick(RIDERS) }; sfx('pickup'); flash('HOP IN'); say(S.job.rider + ': ' + pick(SAY_START)); }
  else {
    const cps = buildRoute(from.x, from.y); let len = Math.hypot(cps[0].x - S.x, cps[0].y - S.y);
    for (let i = 1; i < cps.length; i++) len += Math.hypot(cps[i].x - cps[i - 1].x, cps[i].y - cps[i - 1].y);
    S.job = { kind, cps, i: 0, time: 0, count: 180, par: Math.round(len / (2.3 * 60) + 5) }; S.v = 0; S.side = 0;
  }
  S.job.target = S.job.target || S.job.cps[0];
  S.markers[kind] = null;
}
function endJob() { const kind = S.job.kind; S.job = null; placeMarker(kind); }
function jobBump() { if (S.job && S.job.kind === 'taxi') { S.job.bumps++; say(S.job.rider + ': ' + pick(SAY_BUMP), 100); } }
function updateJobs() {
  const near = (p, r = 22) => !S.air && !S.sink && Math.hypot(p.x - S.x, p.y - S.y) < r;
  if (!S.job) { for (const k of JOB_KINDS) if (S.markers[k] && near(S.markers[k])) { startJob(k); break; } return; }
  const J = S.job;
  if (J.kind === 'race') {
    if (J.count > 0) { if (J.count % 60 === 0) sfx('count'); J.count--; S.v = 0; S.side = 0; if (!J.count) { sfx('go'); flash('GO!', 40); } return; }
    J.time++;
    if (near(J.cps[J.i], 30)) {
      J.i++; sfx('pickup');
      if (J.i >= J.cps.length) {
        const secs = J.time / 60;
        if (secs <= J.par) { const pay = 150 + Math.round((J.par - secs) * 10); S.cash += pay; S.races++; sfx('deliver'); flash('WIN ' + secs.toFixed(1) + 'S +$' + pay, 150); }
        else { S.cash += 40; sfx('late'); flash('TOO SLOW ' + secs.toFixed(1) + 'S +$40', 150); }
        return endJob();
      }
      J.target = J.cps[J.i];
    }
    return;
  }
  J.timer--;
  if (near(J.target)) {
    const secs = Math.max(0, Math.floor(J.timer / 60));
    if (J.kind === 'deliver') { S.streak++; const pay = 60 + secs * 2 + (S.streak - 1) * 10; S.cash += pay; S.delivered++; flash('DELIVERED +$' + pay); }
    else { const fare = 70 + secs * 2, tip = Math.max(0, 60 - J.bumps * 20), stars = Math.max(1, 5 - J.bumps); S.cash += fare + tip; S.fares++; flash('*'.repeat(stars) + ' +$' + (fare + tip), 150); say(J.rider + ': ' + pick(J.bumps < 2 ? SAY_GOOD : SAY_BAD)); }
    sfx('deliver'); return endJob();
  }
  if (J.timer <= 0) { S.streak = 0; sfx('late'); flash(J.kind === 'taxi' ? 'TOO SLOW. THEY GOT OUT' : 'LATE! TRY ANOTHER'); if (J.kind === 'taxi') say(J.rider + ': ' + pick(SAY_BAD)); endJob(); }
}

/* ================= the car ================= */
function driveInput() {
  let gas = keys.up || keys.a ? 1 : 0, brake = keys.down, steer = keys.right - keys.left;
  if (stick.mag > .18) {   // point the stick where you want to go; how far you push it is the throttle
    const want = Math.atan2(stick.y, stick.x), diff = angleDiff(want, S.a);
    if (Math.abs(diff) > 2.5) { brake = 1; if (S.v <= .3) steer = -clamp(angleDiff(want, S.a + Math.PI) * 2.5, -1, 1); }
    else { steer = clamp(diff * 2.5, -1, 1); gas = Math.max(gas, stick.mag * (Math.abs(diff) > 1.4 ? .55 : 1)); }
  }
  return { gas, brake, steer };
}
function updateCar() {
  let { gas, brake, steer } = driveInput();
  const ground = tileAtPx(S.x, S.y), soft = ground === SAND || ground === GRASS || ground === FAIRWAY || ground === BUNKER, boosting = S.boost > 0;
  const top = (3.6 + (boosting ? 1.8 : 0)) * (gas || 1) * (soft ? .82 : 1);
  if (boosting) { S.boost--; gas = 1; }
  if (gas && S.v < top) S.v = Math.min(top, S.v + (boosting ? .2 : .095) * Math.max(.5, gas));
  else if (brake) S.v = S.v > .3 ? S.v - .16 : Math.max(-1.5, S.v - .07);
  else S.v *= S.v > top ? .985 : .975;
  // drift: hold DRIFT while turning; the back end slides and a charge builds; let go for a boost
  if (!S.drift && keys.b && Math.abs(steer) > .3 && S.v > 1.9) { S.drift = true; S.charge = 0; sfx('skid'); }
  if (S.drift && (!keys.b || Math.hypot(S.v, S.side) < 1.2)) {
    const lvl = S.charge > 110 ? 2 : S.charge > 40 ? 1 : 0;
    if (lvl && !keys.b) { S.boost = lvl === 2 ? 90 : 50; sfx('boost'); flash(lvl === 2 ? 'MEGA BOOST!' : 'BOOST!', 50); }
    S.drift = false; S.charge = 0;
  }
  const turn = .062 * (S.drift ? 1.3 : 1) * (S.v < -.05 ? -1 : 1) * Math.max(.35, Math.min(1, Math.abs(S.v) / 1.2));
  const vx0 = Math.cos(S.a) * S.v - Math.sin(S.a) * S.side, vy0 = Math.sin(S.a) * S.v + Math.cos(S.a) * S.side;
  S.a += steer * turn;
  const ca = Math.cos(S.a), sa = Math.sin(S.a);
  S.v = vx0 * ca + vy0 * sa; S.side = (-vx0 * sa + vy0 * ca) * (S.drift ? .9 : keys.b ? .85 : .45);
  if (S.drift) { if (S.v < 2.4 && Math.abs(S.side) > .8) S.v += .06; S.v *= .997; if (Math.abs(S.side) > .35) S.charge += Math.abs(S.side) * 1.3 + .3; }
  const vx = ca * S.v - sa * S.side, vy = sa * S.v + ca * S.side;
  if ((S.drift && Math.abs(S.side) > .3) || (brake && S.v > 2)) {
    groundCtx.fillStyle = 'rgba(26,16,30,.25)';
    for (const k of [-4, 4]) groundCtx.fillRect(Math.round(S.x - ca * 8 - sa * k), Math.round(S.y - sa * 8 + ca * k), 2, 2);
    if (frame % 3 === 0) puff(S.x - ca * 10, S.y - sa * 10, 1, 'rgba(255,245,250,.6)', .6, 24, 3);
    if (S.drift && frame % 2 === 0) { const c = S.charge > 110 ? P.pink : S.charge > 40 ? P.teal : null; if (c) puff(S.x - ca * 10, S.y - sa * 10, 2, c, 1.6, 14, 2); }
  }
  if (boosting && frame % 2 === 0) puff(S.x - ca * 12, S.y - sa * 12, 2, frame % 4 ? P.sun : P.pink, .8, 12, 3);
  if (soft && Math.abs(S.v) > 1.5 && frame % 4 === 0) puff(S.x - ca * 10, S.y - sa * 10, 1, ground === SAND || ground === BUNKER ? P.sand2 : P.grass2, .7, 20, 3);
  const nx = S.x + vx, ny = S.y + vy;
  if (blockedAt(nx, ny, 6) && !blockedAt(nx, S.y, 6) && Math.abs(vx) > .2) { S.x = nx; S.v *= .9; S.side *= .5; }
  else if (blockedAt(nx, ny, 6) && !blockedAt(S.x, ny, 6) && Math.abs(vy) > .2) { S.y = ny; S.v *= .9; S.side *= .5; }
  else if (blockedAt(nx, ny, 6)) { if (Math.abs(S.v) > 1.8) { sfx('crash'); S.shake = 8; jobBump(); puff(nx + ca * 8, ny + sa * 8, 6, P.sun, 2.5, 14, 2); } S.v *= -.25; S.side = 0; S.drift = false; S.boost = 0; }
  else { S.x = nx; S.y = ny; }
  const under = tileAtPx(S.x, S.y), i = Math.floor(S.y / T) * MW + Math.floor(S.x / T);
  if (under === RAMP && S.v > 1.8 && Math.abs(angleDiff(S.a, rampDir[i])) < 1.1) launch(rampDir[i], RAMP_ID[i]);
  else if (isWater(under)) splash();
  else if (under === ROAD && frame % 20 === 0) S.safe = { x: S.x, y: S.y, a: S.a };
}
function launch(a, id) {
  const sp = Math.min(5.4, Math.hypot(S.v, S.side));
  S.air = 1; S.airMax = Math.round(10 + sp * 6); S.a = a; S.avx = Math.cos(a) * sp; S.avy = Math.sin(a) * sp; S.drift = false; S.side = 0; S.rampId = id; sfx('jump');
}
function airStep() {
  S.air++; S.z = Math.sin(Math.PI * S.air / S.airMax) * Math.min(30, S.airMax * .45);
  S.x = clamp(S.x + S.avx, 8, MW * T - 8); S.y = clamp(S.y + S.avy, 8, MH * T - 8);
  if (S.air >= S.airMax) land();
}
function land() {
  S.air = 0; S.z = 0; S.v = Math.hypot(S.avx, S.avy) * .8; S.side = 0; S.shake = 6; sfx('land');
  const t = tileAtPx(S.x, S.y);
  if (isWater(t)) return splash();
  if (blockedAt(S.x, S.y, 6)) { for (let i = 0; i < 60 && blockedAt(S.x, S.y, 6); i++) { S.x -= S.avx * .5; S.y -= S.avy * .5; } S.v = 0; sfx('crash'); flash('OOF'); return; }
  puff(S.x, S.y, 10, t === SAND ? P.sand2 : P.cream, 3, 18, 3);
  const cash = 10 + S.airMax; S.cash += cash;
  if (!S.stunts.includes(S.rampId)) { S.stunts.push(S.rampId); S.cash += 100; flash('STUNT ' + S.stunts.length + '/' + STUNT_IDS.size + ' +$' + (cash + 100), 120); sfx('deliver'); }
  else flash('BIG AIR +$' + cash);
}
function splash() { S.sink = 50; S.v = 0; S.side = 0; S.boost = 0; S.drift = false; jobBump(); sfx('splash'); puff(S.x, S.y, 30, P.foam, 4, 30, 3, 1); flash('SPLASH!', 80); }
function respawn() { S.x = S.safe.x; S.y = S.safe.y; S.a = S.safe.a; S.v = 0; S.side = 0; }
function districtAt(x, y) {
  const tx = Math.floor(x / T), ty = Math.floor(y / T);
  if (tx >= SANDBAR_X) return 'SANDBAR';
  if (at(tx, ty) === PIER) return 'THE PIER';
  if (at(tx, ty) === SAND || at(tx, ty) === SEA) return 'THE BEACH';
  if (ring[ty * MW + tx]) return 'OCEAN DRIVE';
  const bi = Math.floor((tx - 11) / 12), bj = Math.floor((ty - 11) / 12), z = zoneOfBlock(bi, bj);
  if (z) return z.name;
  return { strip: 'THE STRIP', downtown: 'DOWNTOWN', oldtown: 'OLD TOWN', mid: bj < 5 ? 'UPTOWN' : 'SOUTH SIDE' }[districtOfBlock(bi, bj)];
}

/* ================= heat: parking scooters ================= */
function addHeat(n, why) { S.heat = Math.min(5, S.heat + n); S.heatClock = 0; flash(why); }
function spawnMaid() { for (let i = 0; i < 200; i++) { const a = Math.random() * Math.PI * 2, r = 200 + Math.random() * 60, x = S.x + Math.cos(a) * r, y = S.y + Math.sin(a) * r; if (!chaserBlocked(x, y, 4) && inMap(x / T, y / T)) return { x, y, a: 0 }; } return { x: S.x + 220, y: S.y, a: Math.PI }; }
function ticket() { const fine = Math.min(S.cash, Math.max(15, Math.floor(S.cash * .1))); S.cash -= fine; S.heat = 0; S.maids = []; S.streak = 0; sfx('ticket'); flash('TICKET! -$' + fine, 120); S.v = 0; S.side = 0; S.boost = 0; }
function updateMaids() {
  while (S.maids.length < Math.min(3, S.heat)) S.maids.push(spawnMaid());
  for (const m of S.maids) {
    const dx = S.x - m.x, dy = S.y - m.y, d = Math.hypot(dx, dy) || 1, sp = 1.7 + S.heat * .2;
    let mx = m.x + dx / d * sp, my = m.y + dy / d * sp;
    if (chaserBlocked(mx, my, 4)) { if (!chaserBlocked(mx, m.y, 4)) my = m.y; else if (!chaserBlocked(m.x, my, 4)) mx = m.x; else { mx = m.x + (Math.random() - .5) * 6; my = m.y + (Math.random() - .5) * 6; if (chaserBlocked(mx, my, 4)) { mx = m.x; my = m.y; } } }
    if (mx !== m.x || my !== m.y) m.a = Math.atan2(my - m.y, mx - m.x);
    m.x = mx; m.y = my;
    if (d < 13 && !S.air && !S.sink) { ticket(); break; }
  }
  if (S.heat > 0) { const near = S.maids.some(m => Math.hypot(m.x - S.x, m.y - S.y) < 130); S.heatClock = near ? 0 : S.heatClock + 1;
    if (S.heatClock > 60 * 5) { S.heat--; S.heatClock = 0; S.maids.pop(); if (!S.heat) flash('LOST THEM'); } }
}

/* ================= update ================= */
function update() {
  frame++;
  if (mode !== 'play') return;
  if (S.sink) { S.sink--; if (frame % 3 === 0) puff(S.x, S.y, 2, P.foam, 2, 20, 2); if (!S.sink) respawn(); }
  else if (S.air) airStep();
  else updateCar();
  for (const q of S.parts) { q.x += q.vx; q.y += q.vy; q.vx *= .93; q.vy *= .93; q.life--; }
  S.parts = S.parts.filter(q => q.life > 0);
  updateTraffic(); updateMaids(); updateJobs();
  if (frame % 20 === 0) { const d = districtAt(S.x, S.y); if (d !== S.district) { S.district = d; S.banner = { text: d, t: 150 }; } }
  if (S.banner && !--S.banner.t) S.banner = null;
  if (S.say && !--S.say.t) S.say = null;
  if (S.flashT) S.flashT--;
  if (S.shake) S.shake--;
  // the camera looks ahead of the car
  const vx = Math.cos(S.a) * S.v - Math.sin(S.a) * S.side, vy = Math.sin(S.a) * S.v + Math.cos(S.a) * S.side;
  S.cam.x += (S.x + vx * 22 - S.cam.x) * .08; S.cam.y += (S.y + vy * 16 - S.cam.y) * .08;
}

/* ================= drawing: fake 3D ================= */
// the camera hangs F pixels above the ground; things with height lean away from the middle of the screen
const F = 470;
let camX = 0, camY = 0, camCX = 0, camCY = 0;
const proj = (wx, wy, z) => { const s = F / (F - z); return [SW / 2 + (wx - camCX) * s, SH / 2 + (wy - camCY) * s]; };
function quad(a, b, c, d, col) { g.fillStyle = col; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fill(); }
function windows(b, face, along0, along1, fixed, lit) {
  const tall = b.style === 'tower', rowH = tall ? 10 : 9, colW = tall ? 6 : 8, ww = tall ? 4 : 4, wh = tall ? 7 : 5;
  const vert = face === 'e' || face === 'w';
  for (let z = b.style === 'house' ? 4 : 6; z + wh < b.h - 3; z += rowH) for (let u = along0 + 3; u + ww <= along1 - 3; u += colW) {
    const p0 = vert ? proj(fixed, u, z) : proj(u, fixed, z), p1 = vert ? proj(fixed, u + ww, z + wh) : proj(u + ww, fixed, z + wh);
    const x = Math.min(p0[0], p1[0]), y = Math.min(p0[1], p1[1]), w = Math.max(1, Math.abs(p1[0] - p0[0])), h = Math.max(1, Math.abs(p1[1] - p0[1]));
    const on = hash(u + b.seed, z * 7 + face.charCodeAt(0)) < lit;
    g.fillStyle = on ? (tall ? '#bfe8ff' : '#ffe9a8') : (tall ? '#2a3a5a' : '#3a2a48'); g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
}
function drawBuilding(b) {
  const h = b.h, B = (x, y) => [x - camX, y - camY];
  const t00 = proj(b.x0, b.y0, h), t10 = proj(b.x1, b.y0, h), t01 = proj(b.x0, b.y1, h), t11 = proj(b.x1, b.y1, h);
  if (Math.max(t11[0], b.x1 - camX) < 0 || Math.min(t00[0], b.x0 - camX) > SW || Math.max(t11[1], b.y1 - camY) < 0 || Math.min(t00[1], b.y0 - camY) > SH) return;
  const lit = b.style === 'tower' ? .35 : .3;
  if (camCY > b.y1) { quad(B(b.x0, b.y1), B(b.x1, b.y1), t11, t01, b.faces.s); windows(b, 's', b.x0, b.x1, b.y1, lit); }
  if (camCY < b.y0) { quad(B(b.x0, b.y0), B(b.x1, b.y0), t10, t00, b.faces.n); windows(b, 'n', b.x0, b.x1, b.y0, lit); }
  if (camCX > b.x1) { quad(B(b.x1, b.y0), B(b.x1, b.y1), t11, t10, b.faces.e); windows(b, 'e', b.y0, b.y1, b.x1, lit); }
  if (camCX < b.x0) { quad(B(b.x0, b.y0), B(b.x0, b.y1), t01, t00, b.faces.w); windows(b, 'w', b.y0, b.y1, b.x0, lit); }
  // a darker band at street level and a door on the south side
  if (camCY > b.y1 && b.style !== 'tower') { const d0 = B(b.x0 + (b.x1 - b.x0) / 2 - 5, b.y1), d1 = proj(b.x0 + (b.x1 - b.x0) / 2 + 5, b.y1, 12); g.fillStyle = b.style === 'casino' ? P.sun : '#2a1a30'; g.fillRect(Math.round(d0[0]), Math.round(d1[1]), Math.round(d1[0] - d0[0]), Math.max(1, Math.round(d0[1] - d1[1]))); }
  g.drawImage(b.roof, Math.round(t00[0]), Math.round(t00[1]), Math.round(t11[0] - t00[0]), Math.round(t11[1] - t00[1]));
}
function drawPalm(p) {
  const sx = p.x - camX, sy = p.y - camY; if (sx < -60 || sy < -60 || sx > SW + 60 || sy > SH + 60) return;
  let top;
  for (let z = 0; z <= p.h; z += 2) { const bend = Math.sin(z / p.h * 1.6) * 6 * p.bend, q = proj(p.x + bend, p.y, z); g.fillStyle = (z >> 1) % 3 === 0 ? '#5a3424' : P.trunk; g.fillRect(Math.round(q[0]) - 1, Math.round(q[1]) - 1, 3, 3); top = q; }
  const s = F / (F - p.h), [cx, cy] = top;
  for (const [dx, dy] of [[-10, 1], [10, 1], [-7, 6], [7, 6], [0, -8], [-7, -6], [7, -6], [0, 8]]) {
    for (let i = 1; i <= 4; i++) { const f = i / 4; g.fillStyle = i < 3 ? P.frond2 : P.frond; g.fillRect(Math.round(cx + dx * f * s) - 2, Math.round(cy + dy * f * s + f * f * 3) - 1, 4, 3); }
  }
  g.fillStyle = '#7a4a2e'; g.fillRect(Math.round(cx) - 2, Math.round(cy) - 2, 4, 4);
}
function drawLamp(l) {
  const sx = l.x - camX, sy = l.y - camY; if (sx < -20 || sy < -40 || sx > SW + 20 || sy > SH + 40) return;
  for (let z = 0; z <= 30; z += 3) { const q = proj(l.x, l.y, z); g.fillStyle = '#4a4452'; g.fillRect(Math.round(q[0]), Math.round(q[1]), 1, 3); }
  const q = proj(l.x, l.y, 30); g.fillStyle = '#2a2430'; g.fillRect(Math.round(q[0]) - 2, Math.round(q[1]) - 1, 5, 3); g.fillStyle = '#fff1b8'; g.fillRect(Math.round(q[0]) - 1, Math.round(q[1]), 3, 1);
}
const blink = n => (frame >> n) & 1;
function drawWaves() {
  const tx0 = Math.floor(camX / T), ty0 = Math.floor(camY / T);
  for (let ty = ty0; ty <= ty0 + SH / T + 1; ty++) for (let tx = tx0; tx <= tx0 + SW / T + 1; tx++) {
    const t = at(tx, ty); if (!isWater(t)) continue;
    const sx = tx * T - camX, sy = ty * T - camY, w = ((frame >> 4) + tx * 3 + ty * 5) % 4;
    if (t === SEA) {
      px(sx + w * 3, sy + 4, 6, 1, 'rgba(232,251,255,.55)'); px(sx + ((w + 2) % 4) * 3 + 2, sy + 11, 5, 1, 'rgba(10,60,100,.35)');
      const fw = 2 + ((frame >> 4) + tx + ty) % 3 * 2;
      if (at(tx - 1, ty) === SAND || at(tx - 1, ty) === PIER) px(sx, sy, fw, 16, P.foam); if (at(tx + 1, ty) === SAND) px(sx + 16 - fw, sy, fw, 16, P.foam);
      if (at(tx, ty - 1) === SAND) px(sx, sy, 16, fw, P.foam); if (at(tx, ty + 1) === SAND) px(sx, sy + 16 - fw, 16, fw, P.foam);
    } else if ((tx + ty + (frame >> 5)) % 3 === 0) px(sx + 3 + w * 2, sy + 7, 5, 1, '#c8f2fb');
  }
}
function drawPin(x, y, c, icon) {
  const r = 7 + ((frame >> 2) % 8);
  for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; px(x + Math.cos(a) * r - 1, y + Math.sin(a) * r * .5, 2, 1, c); }
  const by = y - 28 - blink(3) * 3;
  [6, 10, 12, 12, 12, 12, 10, 8, 6, 4, 2].forEach((w, i) => px(x - w / 2, by + i, w, 1, c));
  px(x - 1, by + 11, 2, 6, c);
  if (icon === 'deliver') { px(x - 3, by + 2, 6, 5, '#c98a5a'); px(x - 3, by + 4, 6, 1, '#8a5a3a'); }
  else if (icon === 'taxi') { px(x - 1, by + 1, 3, 3, '#f2c9a0'); px(x - 2, by + 4, 5, 4, P.purp); }
  else if (icon === 'race') { for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) px(x - 3 + i * 2, by + 2 + k * 2, 2, 2, (i + k) & 1 ? P.ink : P.cream); }
  else px(x - 2, by + 3, 4, 4, P.cream);
}
function drawRing(x, y, c, label) {
  const r = 20 + blink(3);
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; px(x + Math.cos(a) * r - 1, y + Math.sin(a) * r - 1, 3, 3, c); }
  if (label) { text(label, x - tw(label) / 2 + 1, y - 2, P.ink); text(label, x - tw(label) / 2, y - 3, c); }
}
function draw() {
  if (mode === 'title') return drawTitle();
  ctx = g;
  const sh = S.shake ? (blink(1) ? 2 : -2) : 0;
  camCX = clamp(Math.round(S.cam.x), SW / 2, MW * T - SW / 2) + sh; camCY = clamp(Math.round(S.cam.y), SH / 2, MH * T - SH / 2);
  camX = camCX - SW / 2; camY = camCY - SH / 2;
  g.drawImage(groundPic, camX, camY, SW, SH, 0, 0, SW, SH);
  drawWaves();
  const tc = S.job ? JOB_COLOUR[S.job.kind] : P.cream;
  if (!S.job) { for (const k of JOB_KINDS) if (S.markers[k]) drawPin(S.markers[k].x - camX, S.markers[k].y - camY, JOB_COLOUR[k], k); }
  else if (S.job.kind === 'race') { const J = S.job; if (J.cps[J.i + 1]) drawRing(J.cps[J.i + 1].x - camX, J.cps[J.i + 1].y - camY, P.purp); drawRing(J.target.x - camX, J.target.y - camY, P.sun, J.i + 1 + '/' + J.cps.length); }
  else drawPin(S.job.target.x - camX, S.job.target.y - camY, tc, 'drop');
  for (const c of S.traffic) { const x = c.x - camX, y = c.y - camY; if (x > -20 && y > -20 && x < SW + 20 && y < SH + 20) drawSprite(trafficCar(c.look), x, y, Math.atan2(c.dy, c.dx)); }
  for (const m of S.maids) { const x = m.x - camX, y = m.y - camY; drawSprite(SCOOTER(), x, y, m.a); px(x - 2, y - 2, 4, 4, blink(3) ? P.red : '#3a7aff'); }
  const carX = S.x - camX, carY = S.y - camY;
  if (S.sink) { const r = 8 + (50 - S.sink) / 3; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; px(carX + Math.cos(a) * r, carY + Math.sin(a) * r * .6, 2, 1, P.foam); } if (S.sink > 25) drawSprite(PLAYER_CAR(), carX, carY, S.a, 0, (S.sink - 25) / 25); }
  else if (!S.air) drawSprite(PLAYER_CAR(), carX, carY, S.a, 0);
  for (const q of S.parts) px(q.x - camX - q.size / 2, q.y - camY - q.size / 2, q.size, q.size, q.col);
  // tall things, farthest from the middle first, so nearer ones cover them
  const tall = [];
  for (const b of BUILDINGS) if (b.x1 > camX - 200 && b.x0 < camX + SW + 200 && b.y1 > camY - 200 && b.y0 < camY + SH + 200) tall.push([Math.hypot((b.x0 + b.x1) / 2 - camCX, (b.y0 + b.y1) / 2 - camCY), b, 0]);
  for (const p of PALMS) if (Math.abs(p.x - camCX) < SW && Math.abs(p.y - camCY) < SH) tall.push([Math.hypot(p.x - camCX, p.y - camCY), p, 1]);
  for (const l of LAMPS) if (Math.abs(l.x - camCX) < SW && Math.abs(l.y - camCY) < SH) tall.push([Math.hypot(l.x - camCX, l.y - camCY), l, 2]);
  tall.sort((a, b) => b[0] - a[0]);
  for (const [, o, k] of tall) k === 0 ? drawBuilding(o) : k === 1 ? drawPalm(o) : drawLamp(o);
  if (S.air) drawSprite(PLAYER_CAR(), carX, carY, S.a, S.z);   // in the air you fly over everything
  if (S.drift) { const c = S.charge > 110 ? P.pink : S.charge > 40 ? P.teal : P.cream, w = Math.min(40, S.charge / 110 * 40); px(carX - 20, carY + 15, 40, 3, P.ink); px(carX - 20, carY + 15, w, 3, c); }
  // arrow toward the job when it is off screen
  const aim = S.job && S.job.target;
  if (aim && (aim.x - camX < 0 || aim.y - camY < 22 || aim.x - camX > SW || aim.y - camY > SH)) {
    const ang = Math.atan2(aim.y - S.y, aim.x - S.x), ax = SW / 2 + Math.cos(ang) * 140, ay = SH / 2 + 10 + Math.sin(ang) * 80;
    for (let i = 0; i < 9; i++) { const s = 9 - i; px(ax + Math.cos(ang) * i * 1.6 - s / 2, ay + Math.sin(ang) * i * 1.6 - s / 2, s, s, i < 2 ? P.ink : tc); }
  }
  drawHUD();
  if (mode === 'map') drawMap();
  if (mode === 'paused') { px(68, 66, 200, 84, P.ink); px(68, 66, 200, 3, P.teal); px(68, 147, 200, 3, P.pink); ctext('PAUSED', 82, P.teal, 4, P.purp); ctext('PAUSE TO GO ON', 124, P.cream, 2); }
  document.getElementById('lamp').classList.toggle('on', S.heat > 0 && !!blink(4));
}
function drawHUD() {
  px(0, 0, SW, 18, P.ink); px(0, 18, SW, 2, P.pink); px(0, 20, SW, 1, P.teal);
  text('$' + S.cash, 6, 2, P.cream, 2);
  const J = S.job;
  if (!J) ctext('PICK A PIN', 6, P.blush);
  else if (J.kind === 'race') ctext(J.count ? 'GET READY' : (J.time / 60).toFixed(1) + '/' + J.par + 'S', 2, J.time / 60 > J.par ? P.pink : P.sun, 2);
  else { const s = Math.max(0, Math.ceil(J.timer / 60)); ctext((J.kind === 'taxi' ? 'FARE ' : 'DROP ') + s + 'S', 2, s <= 5 && blink(3) ? P.pink : JOB_COLOUR[J.kind], 2); }
  text('HEAT', SW - 6 - 5 * 10 - 26, 6, P.blush);
  for (let i = 0; i < 5; i++) { const on = i < S.heat, x = SW - 6 - 5 * 10 + i * 10; px(x, 4, 8, 8, on ? (blink(3) ? P.red : '#3a7aff') : P.purp); }
  if (S.streak > 1) text('STREAK X' + S.streak, 6, 26, P.sun);
  if (S.banner && (S.banner.t > 30 || blink(2))) ctext(S.banner.text, 28, P.cream, 2, P.ink);
  if (S.say) { const w = tw(S.say.text) + 10, x = (SW - w) / 2; px(x, 46, w, 13, P.ink); px(x, 46, 2, 13, P.teal); ctext(S.say.text, 49, P.cream); }
  if (J && J.kind === 'race' && J.count) { const n = Math.ceil(J.count / 60); px(SW / 2 - 30, 64, 60, 72, P.ink); px(SW / 2 - 30, 64, 60, 3, P.sun); px(SW / 2 - 30, 133, 60, 3, P.pink); ctext(String(n), 75, n === 1 ? P.pink : P.sun, 7); }
  if (S.flashT) { const w = tw(S.flash, 2) + 20, x = (SW - w) / 2; px(x, 158, w, 24, P.ink); px(x, 158, w, 2, P.pink); px(x, 180, w, 2, P.teal); ctext(S.flash, 163, P.cream, 2); }
  drawRadar();
  const kmh = Math.round(Math.hypot(S.v, S.side) * 26) + ' KM/H'; text(kmh, SW - 6 - tw(kmh), SH - 11, P.cream);
}
// radar: one pixel per tile around the car
const radarPic = document.createElement('canvas'); radarPic.width = MW; radarPic.height = MH;
function paintRadar() {
  const rc = radarPic.getContext('2d'), img = rc.createImageData(MW, MH);
  const col = { [ROAD]: '#e9dfe6', [WALK]: '#9a8a9a', [BLD]: '#3a2a48', [GRASS]: '#3f8a2e', [FAIRWAY]: '#4f9a3a', [BUNKER]: '#d9c28a', [POND]: '#2a8fc0', [PATH]: '#c9b48a', [SAND]: '#e8c98f', [SEA]: '#165f8f', [PIER]: '#b07a5a', [RAMP]: '#ffd36b', [LOT]: '#6a6472', [RUNWAY]: '#5a5462', [PLAZA]: '#d8c8b8' };
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const h = col[at(x, y)] || '#000000', i = (y * MW + x) * 4; img.data[i] = parseInt(h.substr(1, 2), 16); img.data[i + 1] = parseInt(h.substr(3, 2), 16); img.data[i + 2] = parseInt(h.substr(5, 2), 16); img.data[i + 3] = 255; }
  rc.putImageData(img, 0, 0);
}
function drawRadar() {
  const RW = 64, RH = 48, rx = 4, ry = SH - RH - 4, cx = Math.floor(S.x / T), cy = Math.floor(S.y / T), x0 = cx - RW / 2, y0 = cy - RH / 2;
  px(rx - 2, ry - 2, RW + 4, RH + 4, P.ink); px(rx, ry, RW, RH, '#165f8f');
  const sx = Math.max(0, x0), sy = Math.max(0, y0), ex = Math.min(MW, x0 + RW), ey = Math.min(MH, y0 + RH);
  if (ex > sx && ey > sy) g.drawImage(radarPic, sx, sy, ex - sx, ey - sy, rx + sx - x0, ry + sy - y0, ex - sx, ey - sy);
  const dot = (wx, wy, c, size = 3, clampIt = true) => { let dx = wx / T - x0, dy = wy / T - y0; if (!clampIt && (dx < 0 || dy < 0 || dx >= RW || dy >= RH)) return; dx = clamp(dx, 1, RW - 2); dy = clamp(dy, 1, RH - 2); px(rx + dx - size / 2, ry + dy - size / 2, size, size, c); };
  if (S.job) { dot(S.job.target.x, S.job.target.y, blink(3) ? JOB_COLOUR[S.job.kind] : P.cream, 4); if (S.job.cps) for (let i = S.job.i + 1; i < S.job.cps.length; i++) dot(S.job.cps[i].x, S.job.cps[i].y, P.sun, 2, false); }
  else for (const k of JOB_KINDS) if (S.markers[k]) dot(S.markers[k].x, S.markers[k].y, JOB_COLOUR[k], 4);
  for (const m of S.maids) dot(m.x, m.y, blink(2) ? P.red : '#3a7aff', 2, false);
  px(rx + RW / 2 - 1, ry + RH / 2 - 1, 3, 3, '#ffffff'); px(rx + RW / 2 + Math.round(Math.cos(S.a) * 3), ry + RH / 2 + Math.round(Math.sin(S.a) * 3), 1, 1, '#ffffff');
  px(rx - 2, ry - 2, RW + 4, 1, P.teal); px(rx - 2, ry + RH + 1, RW + 4, 1, P.pink);
}
function drawMap() {
  const k = 1.3, w = Math.round(MW * k), h = Math.round(MH * k), x0 = Math.round((SW - w) / 2), y0 = 32;
  px(0, 21, SW, SH - 21, 'rgba(26,7,38,.94)');
  g.drawImage(radarPic, 0, 0, MW, MH, x0, y0, w, h);
  const dot = (wx, wy, c, size) => px(x0 + wx / T * k - size / 2, y0 + wy / T * k - size / 2, size, size, c);
  if (S.job) dot(S.job.target.x, S.job.target.y, blink(3) ? JOB_COLOUR[S.job.kind] : P.cream, 6);
  else for (const kd of JOB_KINDS) if (S.markers[kd]) dot(S.markers[kd].x, S.markers[kd].y, JOB_COLOUR[kd], 6);
  if (blink(2)) dot(S.x, S.y, '#ffffff', 5);
  for (const z of ZONES) { const r = zoneRect(z); text(z.name, x0 + (r.x0 + r.x1) / 2 * k - tw(z.name) / 2, y0 + (r.y0 + r.y1) / 2 * k - 3, P.cream); }
  ctext('PALM CITY', 24, P.cream);
  const ly = y0 + h + 4; text('DELIVER', 40, ly, P.pink); text('TAXI', 100, ly, P.teal); text('RACE', 136, ly, P.sun); text('YOU', 172, ly, '#ffffff'); text('MAP TO CLOSE', 216, ly, P.blush);
}
function drawTitle() {
  ctx = g;
  const bands = [P.deep, P.purp, P.violet, P.pink, '#ff7ac2', P.sun], H = 100, bh = H / bands.length;
  bands.forEach((c, i) => { px(0, i * bh, SW, Math.ceil(bh), c); if (i) for (let x = (i & 1); x < SW; x += 2) px(x, i * bh - 1, 1, 1, bands[i - 1]); });
  for (let y = 0; y < 54; y++) { const w = Math.round(2 * Math.sqrt(54 * 54 - (54 - y) * (54 - y))); if (y > 26 && (y % 6) < 1 + (y - 26) / 7) continue; px(SW / 2 - w / 2, H - 54 + y, w, 1, y < 26 ? P.cream : '#ffd0e8'); }
  // skyline silhouettes leaning like the game
  for (const [x, w, h] of [[16, 26, 40], [46, 20, 58], [70, 30, 30], [236, 24, 52], [264, 34, 70], [302, 22, 36]]) { px(x, H - h, w, h, P.ink); for (let y = H - h + 4; y < H - 4; y += 6) for (let i = x + 3; i < x + w - 3; i += 5) if (hash(i, y) < .35) px(i, y, 2, 3, P.sun); }
  px(0, H, SW, SH - H, P.deep);
  for (let i = 0; i < 11; i++) { const y = H + Math.round(i * i * .95 + ((frame >> 1) % 8) * i * .12); if (y < SH) px(0, y, SW, 1, P.teal); }
  for (let i = -11; i <= 11; i++) for (let y = H; y < SH; y++) { const t = (y - H) / (SH - H); px(SW / 2 + i * (6 + t * 50), y, 1, 1, P.teal); }
  px(0, H, SW, 2, P.pink);
  for (const [x, h] of [[30, 70], [300, 78]]) { for (let y = 0; y < h; y++) px(x + Math.sin(y / 16) * 4, H - y, 4, 1, P.ink); const tx = x + Math.sin(h / 16) * 4, ty = H - h; for (const [dx, dy, l] of [[-1, 0, 20], [1, 0, 20], [-1, 1, 14], [1, 1, 14], [-1, -1, 10], [1, -1, 10]]) for (let i = 0; i < l; i++) px(tx + dx * i, ty + dy * i * .5 + (i * i) / 40, 4, 3, P.ink); }
  ctext('PALM CITY', 108, P.pink, 4, P.ink);
  ctext('8', 142, P.teal, 5, P.ink);
  if (blink(5)) ctext('PRESS PAUSE OR GAS', 186, P.cream, 2, P.ink);
  px(0, 204, SW, 20, P.ink); ctext('AN 8-BIT ISLAND JOYRIDE', 210, P.blush);
  if (best) text('BEST $' + best, 6, 6, P.cream);
  const ml = musicOn ? radioName() : 'RADIO OFF'; text(ml, SW - 6 - tw(ml), 6, musicOn ? P.teal : P.blush);
}
/* ================= lo-fi beats (Web Audio) ================= */
let AC = null, master = null, musicGain = null, nextStep = 0, stepN = 0, sched = null, crackle = null;
let STEP = 60 / 78 / 4, dubSend = null;
const CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60, 64], [48, 52, 55, 59]];   // Fmaj7, Em7, Dm9, Cmaj7
const BASS = [41, 40, 38, 36];
const hz = n => 440 * Math.pow(2, (n - 69) / 12);
// iPhones mute web audio when the silent switch is on, unless the page asks to be treated as media playback.
// Newer Safari has audioSession for that; older ones need a silent <audio> element playing alongside.
let silentTrack = null;
function silentWav() {   // half a second of silence as a WAV file
  const n = 4000, b = new ArrayBuffer(44 + n), v = new DataView(b), w = (o, str) => [...str].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}
// called on every finished tap, click or key press: iOS only lets sound start from those
function unlockAudio() {
  if (!AC) return;
  if (AC.state !== 'running') AC.resume().catch(() => {});
  const b = AC.createBuffer(1, 1, 22050), s = AC.createBufferSource(); s.buffer = b; s.connect(AC.destination); s.start(0);
  if (!(navigator.audioSession) && !silentTrack) { try { silentTrack = new Audio(silentWav()); silentTrack.loop = true; silentTrack.setAttribute('playsinline', ''); silentTrack.play().catch(() => { silentTrack = null; }); } catch (e) {} }
}
function audioInit() {
  if (AC) { unlockAudio(); return; }
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  master = AC.createGain(); master.gain.value = .55;
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;   // the lo-fi dullness
  master.connect(lp); lp.connect(AC.destination);
  musicGain = AC.createGain(); musicGain.gain.value = musicOn ? 1 : 0; musicGain.connect(master);
  // vinyl crackle: a looped noise buffer with sparse pops
  const len = AC.sampleRate * 2, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * .012 + (Math.random() < .0009 ? (Math.random() * 2 - 1) * .6 : 0);
  crackle = AC.createBufferSource(); crackle.buffer = buf; crackle.loop = true;
  const cg = AC.createGain(); cg.gain.value = .5; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400;
  crackle.connect(bp); bp.connect(cg); cg.connect(musicGain); crackle.start();
  // dub echo: a feedback delay the dub station sends its chords into
  const dl = AC.createDelay(1), fb = AC.createGain(), lpf = AC.createBiquadFilter(); dl.delayTime.value = .32; fb.gain.value = .42; lpf.type = 'lowpass'; lpf.frequency.value = 1800;
  dubSend = AC.createGain(); dubSend.connect(musicGain); dubSend.connect(dl); dl.connect(lpf); lpf.connect(fb); fb.connect(dl); lpf.connect(musicGain);
  nextStep = AC.currentTime + .1;
  sched = setInterval(schedule, 25);
  unlockAudio();
}
function noiseBuf() { const b = AC.createBuffer(1, AC.sampleRate * .4, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
let NB = null;
function kick(t, v = .9) { const o = AC.createOscillator(), gn = AC.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + .18);
  gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(.001, t + .35); o.connect(gn); gn.connect(musicGain); o.start(t); o.stop(t + .4); }
function snare(t, v = .35) { const s = AC.createBufferSource(); s.buffer = NB; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = .8;
  const gn = AC.createGain(); gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(.001, t + .22); s.connect(f); f.connect(gn); gn.connect(musicGain); s.start(t); s.stop(t + .25); }
function hat(t, v, open) { const s = AC.createBufferSource(); s.buffer = NB; const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
  const gn = AC.createGain(); gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(.001, t + (open ? .25 : .05)); s.connect(f); f.connect(gn); gn.connect(musicGain); s.start(t); s.stop(t + .3); }
function keysChord(t, notes, dur, dest = musicGain) {   // soft electric-piano chord, slightly detuned, rolled
  notes.forEach((n, i) => { const tt = t + i * .018; for (const [type, det, vol] of [['sine', 0, .07], ['triangle', 6, .035]]) {
    const o = AC.createOscillator(), gn = AC.createGain(), f = AC.createBiquadFilter(); o.type = type; o.frequency.value = hz(n); o.detune.value = det + (Math.random() * 6 - 3);
    f.type = 'lowpass'; f.frequency.value = 1400; gn.gain.setValueAtTime(0, tt); gn.gain.linearRampToValueAtTime(vol, tt + .03); gn.gain.exponentialRampToValueAtTime(.0005, tt + dur);
    o.connect(f); f.connect(gn); gn.connect(dest); o.start(tt); o.stop(tt + dur + .05); } });
}
function pluck(t, n, dur) {   // the arpeggio: a square wave, filtered down
  const o = AC.createOscillator(), gn = AC.createGain(), f = AC.createBiquadFilter(); o.type = 'square'; o.frequency.value = hz(n);
  f.type = 'lowpass'; f.frequency.setValueAtTime(2200, t); f.frequency.exponentialRampToValueAtTime(500, t + dur);
  gn.gain.setValueAtTime(.035, t); gn.gain.exponentialRampToValueAtTime(.0005, t + dur); o.connect(f); f.connect(gn); gn.connect(musicGain); o.start(t); o.stop(t + dur + .05);
}
function pad(t, notes, dur) { for (const n of notes) { const o = AC.createOscillator(), gn = AC.createGain(); o.type = 'triangle'; o.frequency.value = hz(n); o.detune.value = Math.random() * 10 - 5;
  gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(.014, t + dur * .3); gn.gain.linearRampToValueAtTime(0, t + dur); o.connect(gn); gn.connect(musicGain); o.start(t); o.stop(t + dur + .05); } }
function bass(t, n, dur) { const o = AC.createOscillator(), gn = AC.createGain(); o.type = 'sine'; o.frequency.value = hz(n);
  gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(.32, t + .02); gn.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(gn); gn.connect(musicGain); o.start(t); o.stop(t + dur + .05); }
// three stations; the second and third unlock with the tapes hidden around town
const STATIONS = [
  { name: 'SUNSET FM', bpm: 78, unlock: 0, style: 'keys', chords: CHORDS, bass: BASS },
  { name: 'NIGHT DRIVE', bpm: 96, unlock: 6, style: 'arp', chords: [[57, 60, 64, 67, 71], [53, 57, 60, 64, 67], [55, 59, 62, 65, 69], [52, 55, 59, 62, 64]], bass: [45, 41, 43, 40] },   // Am9 Fmaj9 G9 Em7
  { name: 'PALM DUB', bpm: 70, unlock: 14, style: 'dub', chords: [[55, 58, 62, 65], [51, 55, 58, 62], [53, 57, 60, 63], [50, 53, 57, 60]], bass: [43, 39, 41, 38] }   // Gm7 Ebmaj7 F7 Dm7
];
const DUB_BASS = [[0, 0, 3], [3, 7, 2], [6, 10, 2], [10, 0, 3], [14, 5, 2]];   // step, interval, length
function schedule() {
  if (!NB) NB = noiseBuf();
  const st = STATIONS[station] || STATIONS[0]; STEP = 60 / st.bpm / 4;
  while (nextStep < AC.currentTime + .15) {
    const s = stepN % 16, bar = ((stepN / 16) | 0) % 4, ch = st.chords[bar], root = st.bass[bar];
    const swing = (s & 1) ? STEP * (st.style === 'arp' ? .1 : .28) : 0, t = nextStep + swing;
    if (st.style === 'keys') {
      if (s === 0 || s === 7 || s === 10) kick(t);
      if (s === 4 || s === 12) snare(t);
      if (s === 15 && bar === 3) snare(t, .12);
      if (!(s & 1)) hat(t, s % 4 === 2 ? .09 : .05, s === 14 && bar % 2 === 1);
      if (s === 0) keysChord(t, ch, STEP * 14);
      if (s === 8 && bar % 2 === 0) keysChord(t, ch.slice(1).map(n => n + 12), STEP * 5);
      if (s === 0) bass(t, root, STEP * 5); if (s === 10) bass(t, root + 7, STEP * 3);
    } else if (st.style === 'arp') {
      if (s % 4 === 0) kick(t, .7);
      if (s === 4 || s === 12) snare(t, .22);
      hat(t, s & 1 ? .05 : .03, s === 14);
      pluck(t, ch[stepN % ch.length] + (s >= 8 ? 12 : 0), STEP * 1.6);
      if (s === 0) pad(t, ch, STEP * 16);
      if (!(s & 1)) bass(t, root + (s % 8 === 6 ? 12 : 0), STEP * 1.7);
    } else {
      if (s === 8) { kick(t); snare(t, .2); }   // one drop: everything lands on beat three
      if (!(s & 1)) hat(t, .035, false);
      if (s === 4 || s === 12) keysChord(t, ch, STEP * 1.2, dubSend);
      for (const [at, iv, len] of DUB_BASS) if (s === at) bass(t, root + iv, STEP * len);
    }
    nextStep += STEP; stepN++;
  }
}
function sfx(name) {   // chip sounds, kept quiet under the beat
  if (!AC) return; const t = AC.currentTime;
  const beep = (f1, f2, dur, type = 'square', vol = .08, at = 0) => { const o = AC.createOscillator(), gn = AC.createGain(); o.type = type;
    o.frequency.setValueAtTime(f1, t + at); o.frequency.exponentialRampToValueAtTime(f2, t + at + dur); gn.gain.setValueAtTime(vol, t + at); gn.gain.exponentialRampToValueAtTime(.001, t + at + dur);
    o.connect(gn); gn.connect(master); o.start(t + at); o.stop(t + at + dur + .02); };
  if (name === 'pickup') { beep(660, 990, .08); beep(990, 1320, .1, 'square', .07, .08); }
  if (name === 'deliver') { [523, 659, 784, 1047].forEach((f, i) => beep(f, f, .09, 'square', .07, i * .07)); }
  if (name === 'crash') { if (!NB) NB = noiseBuf(); const s = AC.createBufferSource(); s.buffer = NB; const gn = AC.createGain(); gn.gain.setValueAtTime(.25, t); gn.gain.exponentialRampToValueAtTime(.001, t + .25); s.connect(gn); gn.connect(master); s.start(t); s.stop(t + .3); }
  if (name === 'ticket') { beep(880, 440, .18, 'square', .08); beep(880, 440, .18, 'square', .08, .22); }
  if (name === 'late') beep(330, 160, .35, 'triangle', .1);
  if (name === 'boost') { beep(220, 880, .35, 'sawtooth', .06); beep(330, 1320, .3, 'square', .04, .05); }
  if (name === 'skid') { if (!NB) NB = noiseBuf(); const s2 = AC.createBufferSource(); s2.buffer = NB; const f2 = AC.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 900; f2.Q.value = 4; const gn = AC.createGain(); gn.gain.setValueAtTime(.12, t); gn.gain.exponentialRampToValueAtTime(.001, t + .35); s2.connect(f2); f2.connect(gn); gn.connect(master); s2.start(t); s2.stop(t + .4); }
  if (name === 'jump') { beep(200, 600, .25, 'square', .06); }
  if (name === 'land') { beep(120, 60, .12, 'triangle', .14); }
  if (name === 'splash') { if (!NB) NB = noiseBuf(); const s3 = AC.createBufferSource(); s3.buffer = NB; const f3 = AC.createBiquadFilter(); f3.type = 'lowpass'; f3.frequency.setValueAtTime(3000, t); f3.frequency.exponentialRampToValueAtTime(300, t + .6); const gn = AC.createGain(); gn.gain.setValueAtTime(.3, t); gn.gain.exponentialRampToValueAtTime(.001, t + .7); s3.connect(f3); f3.connect(gn); gn.connect(master); s3.start(t); s3.stop(t + .4); beep(600, 150, .4, 'sine', .08); }
  if (name === 'count') beep(440, 440, .12, 'square', .07);
  if (name === 'go') beep(880, 880, .3, 'square', .08);
  if (name === 'start') { [392, 523, 659].forEach((f, i) => beep(f, f, .08, 'square', .07, i * .06)); }
}
function radioName() { return musicOn ? (STATIONS[station] || STATIONS[0]).name : 'RADIO OFF'; }
// MUSIC button: next unlocked station, then off, then back to the first
function toggleMusic() {
  const tapes = S && S.tapes ? S.tapes.length : 0, open = STATIONS.filter(st => tapes >= st.unlock);
  if (!musicOn) { musicOn = true; station = 0; }
  else { const i = open.indexOf(STATIONS[station]); if (i >= 0 && i < open.length - 1) station = STATIONS.indexOf(open[i + 1]); else musicOn = false; }
  try { localStorage.setItem('palmcity8.music', musicOn ? 'on' : 'off'); localStorage.setItem('palmcity8.station', station); } catch (e) {}
  if (musicGain) musicGain.gain.setTargetAtTime(musicOn ? 1 : 0, AC.currentTime, .1);
  if (S && mode !== 'title') flash(musicOn ? 'RADIO: ' + radioName() : 'RADIO OFF', 70);
}


/* ================= input ================= */
function startGame() { audioInit(); newGame(); mode = 'play'; sfx('start'); }
function press(k, down) {
  if (k in keys) keys[k] = down ? 1 : 0;
  if (!down) return;
  audioInit();
  if (k === 'select') { toggleMusic(); return; }
  if (mode === 'title') { if (k === 'start' || k === 'a' || k === 'up' || k === 'door') startGame(); return; }
  if (k === 'start') { mode = mode === 'paused' || mode === 'map' ? 'play' : 'paused'; sfx('pickup'); return; }
  if (k === 'map') { if (mode === 'play' || mode === 'map') { mode = mode === 'map' ? 'play' : 'map'; sfx('pickup'); } return; }
  if ((k === 'fire' || k === 'door') && mode === 'play') flash(k === 'fire' ? 'GUNS: NEXT UPDATE' : 'ON FOOT: NEXT UPDATE', 50);
}
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', z: 'a', x: 'b', c: 'fire', ' ': 'fire', e: 'door', f: 'door', Enter: 'door', p: 'start', Escape: 'start', m: 'map', r: 'select' };
const keyOf = e => KEYMAP[e.key] || KEYMAP[e.key && e.key.toLowerCase()];
addEventListener('keydown', e => { const k = keyOf(e); if (k) { e.preventDefault(); if (!e.repeat || k in keys) press(k, true); } });
addEventListener('keyup', e => { const k = keyOf(e); if (k) press(k, false); });
document.querySelectorAll('[data-k]').forEach(b => {
  const k = b.dataset.k;
  const on = e => { e.preventDefault(); b.classList.add('down'); press(k, true); if (navigator.vibrate) navigator.vibrate(8); };
  const off = e => { e.preventDefault(); b.classList.remove('down'); press(k, false); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
});
for (const ev of ['touchend', 'pointerup', 'click', 'keydown']) addEventListener(ev, () => { audioInit(); }, { capture: true, passive: true });
cv.addEventListener('pointerdown', () => { if (mode === 'title') startGame(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') mode = 'paused'; });
// the stick: its base jumps to wherever your thumb lands in the left half, then the knob follows the thumb
(() => {
  const zone = document.getElementById('stickzone'), base = document.getElementById('stick'), knob = document.getElementById('knob');
  let id = null, cx = 0, cy = 0, home = null;
  const place = () => { const z = zone.getBoundingClientRect(), b = base.getBoundingClientRect(); return { z, r: b.width / 2 }; };
  const move = e => {
    const { r } = place(); let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy), lim = r * .78;
    if (d > lim) { dx *= lim / d; dy *= lim / d; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    const m = Math.min(1, d / lim); stick.x = dx / (lim || 1); stick.y = dy / (lim || 1); stick.mag = m;
  };
  zone.addEventListener('pointerdown', e => {
    e.preventDefault(); audioInit(); if (mode === 'title') { startGame(); return; }
    id = e.pointerId; zone.setPointerCapture(id); zone.classList.add('on');
    const { z, r } = place(); if (!home) home = { left: base.style.left, top: base.style.top };
    cx = e.clientX; cy = e.clientY;
    base.style.left = (cx - z.left - r) + 'px'; base.style.top = (cy - z.top - r) + 'px';
    move(e); if (navigator.vibrate) navigator.vibrate(6);
  });
  zone.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
  const end = e => { if (e.pointerId !== id) return; id = null; zone.classList.remove('on'); stick.x = stick.y = stick.mag = 0; knob.style.transform = '';
    if (home) { base.style.left = home.left; base.style.top = home.top; } };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
})();

/* ================= loop ================= */
buildIsland();
let last = performance.now(), acc = 0;
function loop(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
  draw();
  if (S && mode === 'play' && S.cash > (S.best || 0)) { S.best = S.cash; try { localStorage.setItem('palmcity8.best', S.cash); } catch (e) {} }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.__pc8 = { get S() { return S; }, get mode() { return mode; }, get audio() { return AC ? AC.state + ':' + stepN : 'none'; }, press, at, MW, MH, T, stick, jobBump, BUILDINGS, PALMS, ZONES, zoneRect, START };
