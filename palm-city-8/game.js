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
  "'": '04040800000000', ',': '000000000c0408', '/': '01010204081010', '+': '0004041f040400', '>': '10080402040810', '<': '01020408040201', '(': '02040808080402', ')': '08040202020408', '%': '19190204081313', '&': '0c12140812150d', '*': '0015 0e1f0e1500', ' ': '00000000000000'
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
const SEA = 0, SAND = 1, ROAD = 2, WALK = 3, BLD = 4, GRASS = 5, POND = 6, PATH = 7, LOT = 8, RUNWAY = 9, RAMP = 10, FAIRWAY = 11, BUNKER = 12, PIER = 13, PLAZA = 14, SPRAY = 15;
const SPRAYS = [];   // Paint N Spray pads: drive on to lose the heat and fix the car
const map = new Uint8Array(MW * MH), blocked = new Uint8Array(MW * MH), ring = new Uint8Array(MW * MH), rampDir = new Float32Array(MW * MH);
const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
const at = (x, y) => inMap(x, y) ? map[y * MW + x] : SEA;
const set = (x, y, v) => { if (inMap(x, y)) map[y * MW + x] = v; };
const isWater = t => t === SEA || t === POND;
const isGridRoadT = (x, y) => at(x, y) === ROAD && !ring[y * MW + x];
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
    } else if ((bi === 3 && bj === 2) || (bi === 9 && bj === 4) || (bi === 8 && bj === 8)) {   // a few parking lots, some with a Paint N Spray
      for (let y = y0 + 1; y < y0 + 8; y++) for (let x = x0 + 1; x < x0 + 8; x++) set(x, y, LOT);
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
  // three Paint N Spray pads on parking lots next to a street
  for (let y = 0; y < MH && SPRAYS.length < 4; y++) for (let x = 0; x < MW && SPRAYS.length < 4; x++)
    if (at(x, y) === LOT && at(x + 1, y) === LOT && (isGridRoadT(x, y + 1) || (at(x, y + 1) === WALK && isGridRoadT(x, y + 2))) && SPRAYS.every(s => Math.hypot(s.x / T - x, s.y / T - y) > 30)) { set(x, y, SPRAY); set(x + 1, y, SPRAY); SPRAYS.push({ x: (x + 1) * T, y: y * T + 8 }); }
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
    case SPRAY: px(sx, sy, 16, 16, P.lot); for (let i = 0; i < 4; i++) px(sx, sy + i * 4, 16, 4, [P.pink, P.sun, P.teal, P.violet][(i + x) % 4]); px(sx, sy, 16, 1, P.white); px(sx, sy + 15, 16, 1, P.white); break;
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
    job: null, say: null, markers: {}, cam: { x: START.x, y: START.y }, tapes: [],
    onFoot: false, fa: 0, step: 0, knock: 0, kvx: 0, kvy: 0, hp: 100, carHp: 100, rideLook: -1, parked: [], runners: [], bullets: [], cops: [], weapon: 'PISTOL', ammo: 0, fireCool: 0, hurtT: 0, down: null, downT: 0, maidCool: 0 };
  placePickups();
  S.peds = []; S.combo = { n: 0, t: 0 }; S.lastShot = null; S.boss = null; S.goons = []; S.hitTargets = bossHit;
  const saved = loadSave(); if (saved) { S.cash = saved.cash || 0; S.tapes = saved.tapes || []; S.stunts = saved.stunts || []; S.bossBeaten = saved.bossBeaten || 0; S.traps = saved.traps || {}; }
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
    if (c.wreck) { if (frame % 6 === 0) puff(c.x, c.y, 1, '#3a3440', 1, 40, 4, .5); if (!--c.wreck) Object.assign(c, spawnTraffic(true)); continue; }
    // queue behind whatever is ahead
    const ax = c.x + c.dx * 20, ay = c.y + c.dy * 20;
    const byYou = !S.air && Math.abs(S.x - ax) < 13 && Math.abs(S.y - ay) < 13;
    let stop = byYou || S.traffic.some(o => o !== c && Math.abs(o.x - ax) < 10 && Math.abs(o.y - ay) < 10);
    if (stop) c.wait++; else c.wait = 0;
    if (c.honk) c.honk--;
    if (byYou && c.wait === 45) { c.honk = 50; c.honkLine = pick(['HONK!', 'MOVE IT!', 'BEEP BEEP', 'HELLO?']); if (Math.abs(c.x - S.x) < 200) sfx('honk'); }
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
    if (S.onFoot && !S.down && c.v > .6 && Math.abs(c.x - S.x) < 10 && Math.abs(c.y - S.y) < 10 && !S.knock) { hurt(Math.round(c.v * 8)); S.knock = 14; S.kvx = c.dx * 3 + (S.x - c.x) * .2; S.kvy = c.dy * 3 + (S.y - c.y) * .2; c.v = 0; flash('WATCH IT!', 40); }
    else if (!S.onFoot && !S.air && !S.sink && Math.abs(c.x - S.x) < 14 && Math.abs(c.y - S.y) < 14) {
      if (Math.hypot(S.v, S.side) > 1.6) { sfx('crash'); S.shake = 6; jobBump(); if (Math.hypot(S.v, S.side) > 2.6) addHeat(1, 'FENDER BENDER'); hurt(Math.round(Math.hypot(S.v, S.side) * 3)); }
      S.v *= -.35; S.side = 0; S.drift = false; S.x -= Math.cos(S.a) * 6; S.y -= Math.sin(S.a) * 6; c.v = 0; c.wait = 0;
    }
    // cars far behind you come back somewhere nearer
    if (Math.abs(c.x - S.x) > 900 || Math.abs(c.y - S.y) > 700) Object.assign(c, spawnTraffic(true), { hp: 6 });
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
  let t = nearCurb(220, 700);
  for (let i = 0; i < 100 && Object.values(S.markers).some(m => m && Math.hypot(m.x - t.x, m.y - t.y) < 200); i++) t = nearCurb(220, 700);
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
    S.job = { kind, cps, i: 0, time: 0, count: 120, par: Math.round(len / (2.3 * 60) + 5) }; S.v = 0; S.side = 0;
  }
  S.job.target = S.job.target || S.job.cps[0];
  S.markers[kind] = null;
}
function endJob() { const kind = S.job.kind; S.job = null; placeMarker(kind); }
function jobBump() { if (S.job && S.job.kind === 'taxi') { S.job.bumps++; say(S.job.rider + ': ' + pick(SAY_BUMP), 100); } }
function updateJobs() {
  const near = (p, r = 22) => !S.air && !S.sink && Math.hypot(p.x - S.x, p.y - S.y) < r;
  if (!S.job) { for (const k of JOB_KINDS) if (S.markers[k] && near(S.markers[k])) { if (S.onFoot) { if (frame % 60 === 0) flash('GET A CAR FIRST', 50); break; } startJob(k); break; } return; }
  const J = S.job;
  if (J.kind === 'race') {
    if (J.count > 0) { if (J.count % 60 === 0) sfx('count'); J.count--; S.v = 0; S.side = 0; if (!J.count) { sfx('go'); flash('GO!', 40); } return; }
    J.time++;
    if (near(J.cps[J.i], 30)) {
      J.i++; sfx('pickup');
      if (J.i >= J.cps.length) {
        const secs = J.time / 60;
        if (secs <= J.par) { const pay = 150 + Math.round((J.par - secs) * 10); S.cash += pay; S.races++; sfx('deliver'); flash('WIN ' + secs.toFixed(1) + 'S +$' + pay, 150); }
        else { S.cash += 40; sfx('late'); flash('TOO SLOW ' + secs.toFixed(1) + 'S +$40', 150); endJob(); offerRetry('race'); return; }
        return endJob();
      }
      J.target = J.cps[J.i];
    }
    return;
  }
  J.timer--;
  if (near(J.target) && !S.onFoot) {
    const secs = Math.max(0, Math.floor(J.timer / 60));
    if (J.kind === 'deliver') { S.streak++; const pay = 60 + secs * 2 + (S.streak - 1) * 10; S.cash += pay; S.delivered++; flash('DELIVERED +$' + pay); }
    else { const fare = 70 + secs * 2, tip = Math.max(0, 60 - J.bumps * 20), stars = Math.max(1, 5 - J.bumps); S.cash += fare + tip; S.fares++; flash('*'.repeat(stars) + ' +$' + (fare + tip), 150); say(J.rider + ': ' + pick(J.bumps < 2 ? SAY_GOOD : SAY_BAD)); }
    sfx('deliver'); return endJob();
  }
  if (J.timer <= 0) { offerRetry(J.kind); S.streak = 0; sfx('late'); flash(J.kind === 'taxi' ? 'TOO SLOW. THEY GOT OUT' : 'LATE! TRY ANOTHER'); if (J.kind === 'taxi') say(J.rider + ': ' + pick(SAY_BAD)); endJob(); }
}

/* ================= the car ================= */
function driveInput() {
  let gas = keys.up || keys.a ? 1 : 0, brake = keys.down, steer = keys.right - keys.left;
  if (stick.mag > .18) {   // point the stick where you want to go; how far you push it is the throttle
    let want = Math.atan2(stick.y, stick.x);
    const card = Math.round(want / (Math.PI / 2)) * (Math.PI / 2); if (Math.abs(angleDiff(want, card)) < .26 && tileAtPx(S.x, S.y) === ROAD) want = card;   // nearly lined up with the street: line up
    const diff = angleDiff(want, S.a);
    if (Math.abs(diff) > 2.5) { brake = 1; if (S.v <= .3) steer = -clamp(angleDiff(want, S.a + Math.PI) * 2.5, -1, 1); }
    else { steer = clamp(diff * 2.5, -1, 1); gas = Math.max(gas, stick.mag * (Math.abs(diff) > 1.4 ? .55 : 1)); }
  }
  return { gas, brake, steer };
}
function updateCar() {
  let { gas, brake, steer } = driveInput();
  const ground = tileAtPx(S.x, S.y), soft = ground === SAND || ground === GRASS || ground === FAIRWAY || ground === BUNKER, boosting = S.boost > 0;
  const car = rideStats(), top = (car.top + (boosting ? 1.8 : 0)) * (gas || 1) * (soft ? .82 : 1);
  if (boosting) { S.boost--; gas = 1; }
  if (gas && S.v < top) S.v = Math.min(top, S.v + (boosting ? .2 : car.acc) * Math.max(.5, gas));
  else if (brake) S.v = S.v > .3 ? S.v - .16 : Math.max(-1.5, S.v - .07);
  else S.v *= S.v > top ? .985 : .975;
  // drift: hold DRIFT while turning; the back end slides and a charge builds; let go for a boost
  if (!S.drift && keys.b && Math.abs(steer) > .3 && S.v > 1.9) { S.drift = true; S.charge = 0; sfx('skid'); }
  if (S.drift && (!keys.b || Math.hypot(S.v, S.side) < 1.2)) {
    const lvl = S.charge > 110 ? 2 : S.charge > 40 ? 1 : 0;
    if (lvl && !keys.b) { S.boost = lvl === 2 ? 90 : 50; sfx('boost'); flash(lvl === 2 ? 'MEGA BOOST!' : 'BOOST!', 50); }
    S.drift = false; S.charge = 0;
  }
  const turn = car.turn * (S.drift ? 1.3 : 1) * (S.v < -.05 ? -1 : 1) * Math.max(.35, Math.min(1, Math.abs(S.v) / 1.2));
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
  if (soft && Math.abs(S.v) > .6) {   // tyre tracks stay in sand and grass
    groundCtx.fillStyle = ground === SAND || ground === BUNKER ? 'rgba(160,110,60,.22)' : 'rgba(30,70,20,.18)';
    for (const k of [-4, 4]) groundCtx.fillRect(Math.round(S.x - ca * 8 - sa * k), Math.round(S.y - sa * 8 + ca * k), 2, 2);
  }
  if (soft && Math.abs(S.v) > 1.5 && frame % 4 === 0) puff(S.x - ca * 10, S.y - sa * 10, 1, ground === SAND || ground === BUNKER ? P.sand2 : P.grass2, .7, 20, 3);
  const nx = S.x + vx, ny = S.y + vy;
  if (blockedAt(nx, ny, 6) && !blockedAt(nx, S.y, 6) && Math.abs(vx) > .2) { S.x = nx; S.v *= .9; S.side *= .5; }
  else if (blockedAt(nx, ny, 6) && !blockedAt(S.x, ny, 6) && Math.abs(vy) > .2) { S.y = ny; S.v *= .9; S.side *= .5; }
  else if (blockedAt(nx, ny, 6)) { if (Math.abs(S.v) > 1.8) { sfx('crash'); S.shake = 8; jobBump(); puff(nx + ca * 8, ny + sa * 8, 6, P.sun, 2.5, 14, 2); hurt(Math.round(Math.abs(S.v) * 3)); } S.v *= -.25; S.side = 0; S.drift = false; S.boost = 0; }
  else { S.x = nx; S.y = ny; }
  const under = tileAtPx(S.x, S.y), i = Math.floor(S.y / T) * MW + Math.floor(S.x / T);
  if (under === RAMP && S.v > 1.8 && Math.abs(angleDiff(S.a, rampDir[i])) < 1.1) launch(rampDir[i], RAMP_ID[i]);
  else if (isWater(under)) splash();
  else if (under === ROAD && frame % 20 === 0) S.safe = { x: S.x, y: S.y, a: S.a };
}
function launch(a, id) {
  const sp = Math.min(5.4, Math.hypot(S.v, S.side));
  S.air = 1; S.airMax = Math.round(10 + sp * 6); S.a = a; S.avx = Math.cos(a) * sp; S.avy = Math.sin(a) * sp; S.drift = false; S.side = 0; S.rampId = id; S.spin = 0; sfx('jump');
}
function airStep() {
  S.air++;
  // 17. steer in the air to spin
  const turnIn = stick.mag > .3 ? clamp(stick.x * 1.4, -1, 1) : keys.right - keys.left; S.spin += turnIn * .2; S.z = Math.sin(Math.PI * S.air / S.airMax) * Math.min(30, S.airMax * .45);
  S.x = clamp(S.x + S.avx, 8, MW * T - 8); S.y = clamp(S.y + S.avy, 8, MH * T - 8);
  if (S.air >= S.airMax) land();
}
function land() {
  S.air = 0; S.z = 0; S.v = Math.hypot(S.avx, S.avy) * .8; S.side = 0; S.shake = 6; sfx('land');
  const t = tileAtPx(S.x, S.y);
  if (isWater(t)) return splash();
  if (blockedAt(S.x, S.y, 6)) { for (let i = 0; i < 60 && blockedAt(S.x, S.y, 6); i++) { S.x -= S.avx * .5; S.y -= S.avy * .5; } S.v = 0; sfx('crash'); flash('OOF'); return; }
  puff(S.x, S.y, 10, t === SAND ? P.sand2 : P.cream, 3, 18, 3);
  let cash = 10 + S.airMax;
  const turns = Math.floor(Math.abs(S.spin) / (Math.PI * 2) + .2), off = Math.abs(angleDiff(S.spin, 0)); S.spin = 0;
  if (turns > 0) { const bonus = turns * 120 / (off > 1 ? 2 : 1); cash += bonus; S.cash += cash; flash(['360!', '720!!', '1080!!!', 'INSANE!!!!'][Math.min(3, turns - 1)] + (off > 1 ? ' SLOPPY LANDING' : '') + ' +$' + cash, 140); sfx('deliver'); if (!S.stunts.includes(S.rampId)) { S.stunts.push(S.rampId); S.cash += 100; } return; }
  S.cash += cash;
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
  if (S.maidCool) S.maidCool--;
  while (!S.maidCool && S.maids.length < Math.min(3, S.heat)) S.maids.push(spawnMaid());
  for (const m of S.maids) {
    if (m.spin) { m.a += .4; if (!--m.spin) { m.dead = true; S.maidCool = 300; } continue; }
    const dx = S.x - m.x, dy = S.y - m.y, d = Math.hypot(dx, dy) || 1, sp = 1.7 + S.heat * .2;
    let mx = m.x + dx / d * sp, my = m.y + dy / d * sp;
    if (chaserBlocked(mx, my, 4)) { if (!chaserBlocked(mx, m.y, 4)) my = m.y; else if (!chaserBlocked(m.x, my, 4)) mx = m.x; else { mx = m.x + (Math.random() - .5) * 6; my = m.y + (Math.random() - .5) * 6; if (chaserBlocked(mx, my, 4)) { mx = m.x; my = m.y; } } }
    if (mx !== m.x || my !== m.y) m.a = Math.atan2(my - m.y, mx - m.x);
    m.x = mx; m.y = my;
    if (d < 13 && !S.air && !S.sink && !S.down) { ticket(); break; }
  }
  S.maids = S.maids.filter(m => !m.dead);
  if (S.heat > 0) { const near = [...S.maids, ...S.cops.filter(c => !c.dead && !c.parked)].some(m => Math.hypot(m.x - S.x, m.y - S.y) < 150); S.heatClock = near ? 0 : S.heatClock + 1;
    if (S.heatClock > 60 * 3.5) { S.heat--; S.heatClock = 0; S.maids.pop(); const live = S.cops.filter(c => !c.dead); if (live.length > Math.max(0, S.heat - 2)) S.cops.splice(S.cops.indexOf(live[live.length - 1]), 1); if (!S.heat) { S.shotsSeen = false; } } }
}

/* ================= update ================= */
function update() {
  frame++;
  if (mode === 'title') stickNav(TITLE, titlePress);
  if (S && mode === 'play') S.clock = (S.clock || 0) + 1;
  if (mode === 'casino') { updateCasino(); return; }
  if (mode === 'map') { updateMapCursor(); return; }
  if (mode !== 'play') return;
  if (S.down) { if (!--S.downT) getUp(); }
  else if (S.onFoot) updateFoot();
  else if (S.sink) { S.sink--; if (frame % 3 === 0) puff(S.x, S.y, 2, P.foam, 2, 20, 2); if (!S.sink) respawn(); }
  else if (S.air) airStep();
  else updateCar();
  if (S.fireCool) S.fireCool--;
  if (keys.fire && !S.down) fire();
  if (S.hurtT) S.hurtT--;
  if (!S.onFoot && S.carHp < 35 && frame % 5 === 0) puff(S.x, S.y, 1, S.carHp < 15 ? '#ff7a2a' : '#5a5462', 1, 40, 4, .5);
  for (const r of S.runners) { r.x += Math.cos(r.a) * 2; r.y += Math.sin(r.a) * 2; r.step++; if (walkBlocked(r.x, r.y)) r.a += 1.6; r.t--; }
  S.runners = S.runners.filter(r => r.t > 0);
  for (const c of S.parked) if (c.wreck) { c.wreck--; if (frame % 6 === 0) puff(c.x, c.y, 1, '#3a3440', 1, 40, 4, .5); }
  S.parked = S.parked.filter(c => !(c.wreck === 0));
  updateBullets(); updateCops(); updateBoss(); updatePickups(); updatePeds(); updateProps(); updateTapes();
  if (frame % 600 === 0) save();
  updateTips(); updateTraps(); updateSeaLife(); updateAtms(); updateRad(); updateQol();
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
  const lead = S.onFoot ? 0 : 1; S.cam.x += (S.x + vx * 22 * lead - S.cam.x) * .08; S.cam.y += (S.y + vy * 16 * lead - S.cam.y) * .08;
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
    const night = nightLevel(), on = hash(u + b.seed, z * 7 + face.charCodeAt(0)) < lit + night * .3;
    g.fillStyle = on ? (tall ? '#bfe8ff' : '#ffe9a8') : (tall ? '#2a3a5a' : '#3a2a48'); g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    if (on && night > .2) LIT.push([Math.round(x), Math.round(y), Math.round(w), Math.round(h), tall ? '#d8f2ff' : '#ffe08a']);
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
  for (let z = 0; z <= p.h; z += 2) { const sway = Math.sin(frame / 50 + p.x * .01) * 2.2 * (z / p.h) * (z / p.h), bend = Math.sin(z / p.h * 1.6) * 6 * p.bend + sway, q = proj(p.x + bend, p.y, z); g.fillStyle = (z >> 1) % 3 === 0 ? '#5a3424' : P.trunk; g.fillRect(Math.round(q[0]) - 1, Math.round(q[1]) - 1, 3, 3); top = q; }
  const s = F / (F - p.h), [cx, cy] = top;
  for (const [dx, dy] of [[-10, 1], [10, 1], [-7, 6], [7, 6], [0, -8], [-7, -6], [7, -6], [0, 8]]) {
    const flap = Math.sin(frame / 22 + dx + p.y * .01) * .8;
    for (let i = 1; i <= 4; i++) { const f = i / 4; g.fillStyle = i < 3 ? P.frond2 : P.frond; g.fillRect(Math.round(cx + dx * f * s) - 2, Math.round(cy + dy * f * s + f * f * (3 + flap)) - 1, 4, 3); }
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
      if (hash(tx * 3 + (frame >> 4), ty) < .07 && nightLevel() < .5) { const kx = sx + (hash(ty, tx + (frame >> 4)) * 14 | 0), ky = sy + (hash(tx, ty * 7) * 14 | 0); px(kx, ky, 2, 1, '#ffffff'); px(kx, ky - 1, 1, 3, 'rgba(255,255,255,.6)'); }
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
  if (mode === 'casino') return drawCasino();
  ctx = g;
  const sh = S.shake ? (blink(1) ? 2 : -2) : 0;
  camCX = clamp(Math.round(S.cam.x), SW / 2, MW * T - SW / 2) + sh; camCY = clamp(Math.round(S.cam.y), SH / 2, MH * T - SH / 2);
  camX = camCX - SW / 2; camY = camCY - SH / 2;
  g.drawImage(groundPic, camX, camY, SW, SH, 0, 0, SW, SH);
  drawWaves(); drawSeaLife(); drawGpsRoad();
  const tc = S.job ? JOB_COLOUR[S.job.kind] : P.cream;
  if (!S.job) { for (const k of JOB_KINDS) if (S.markers[k]) drawPin(S.markers[k].x - camX, S.markers[k].y - camY, JOB_COLOUR[k], k); }
  else if (S.job.kind === 'race') { const J = S.job; if (J.cps[J.i + 1]) drawRing(J.cps[J.i + 1].x - camX, J.cps[J.i + 1].y - camY, P.purp); drawRing(J.target.x - camX, J.target.y - camY, P.sun, J.i + 1 + '/' + J.cps.length); }
  else drawPin(S.job.target.x - camX, S.job.target.y - camY, tc, 'drop');
  for (const c of S.traffic) { const x = c.x - camX, y = c.y - camY; if (x > -20 && y > -20 && x < SW + 20 && y < SH + 20) drawSprite(trafficCar(c.look), x, y, Math.atan2(c.dy, c.dx)); }
  drawPickups(); drawProps(); drawTapes(); drawBossPin(); drawTraps(); drawAtms(); drawRad();
  if (casinoDoor) { const x = casinoDoor.x - camX, y = casinoDoor.y - camY; if (x > -40 && x < SW + 40 && y > -30 && y < SH + 30) { px(x - 8, y - 12, 16, 14, '#b3123a'); px(x - 8, y - 12, 16, 1, P.sun); px(x - 8, y + 1, 16, 1, P.sun);
    if (Math.hypot(S.x - casinoDoor.x, S.y - casinoDoor.y) < 60) { const l = S.onFoot ? 'DOOR: GO IN' : 'GET OUT TO GO IN'; px(x - tw(l) / 2 - 3, y + 8, tw(l) + 6, 10, P.ink); text(l, x - tw(l) / 2, y + 10, blink(4) ? P.sun : P.cream); } } }
  for (const s of SPRAYS) { const x = s.x - camX, y = s.y - camY; if (x > -40 && x < SW + 40 && y > -30 && y < SH + 30) { px(x - 30, y - 20, 60, 9, P.ink); text('PAINT N SPRAY', x - tw('PAINT N SPRAY') / 2, y - 19, blink(4) ? P.pink : P.teal); } }
  for (const c of S.parked) { const x = c.x - camX, y = c.y - camY; if (x > -20 && y > -20 && x < SW + 20 && y < SH + 20) drawSprite(c.wreck ? WRECK() : c.look === -1 ? PLAYER_CAR() : c.look === 'cop' ? COP_CAR() : trafficCar(c.look), x, y, c.a); }
  for (const c of S.cops) { const x = c.x - camX, y = c.y - camY; if (x > -20 && y > -20 && x < SW + 20 && y < SH + 20) { drawSprite(c.dead ? WRECK() : COP_CAR(), x, y, c.a); if (!c.dead) { px(x - 2, y - 2, 2, 3, blink(2) ? P.red : '#3a7aff'); px(x, y - 2, 2, 3, blink(2) ? '#3a7aff' : P.red); } } }
  for (const r of S.runners) drawPerson(personSprites('runner' + r.look, SHIRTS[r.look], '#3a3a44', SKINS[r.look % 4], HAIRS[r.look % 6]), r.x - camX, r.y - camY, r.a, r.step);
  for (const m of S.maids) { const x = m.x - camX, y = m.y - camY; drawSprite(SCOOTER(), x, y, m.a); px(x - 2, y - 2, 4, 4, blink(3) ? P.red : '#3a7aff'); }
  drawPeds(); drawAerobics(); drawBoss();
  const carX = S.x - camX, carY = S.y - camY;
  if (S.sink) { const r = 8 + (50 - S.sink) / 3; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; px(carX + Math.cos(a) * r, carY + Math.sin(a) * r * .6, 2, 1, P.foam); } if (S.sink > 25) drawSprite(PLAYER_CAR(), carX, carY, S.a, 0, (S.sink - 25) / 25); }
  else if (S.onFoot) { if (!S.down || blink(2)) drawPerson(PLAYER_FOOT(), carX, carY, S.fa, S.step, S.down === 'wasted'); }
  else if (!S.air) drawSprite(rideSprite(), carX, carY, S.a, 0);
  for (const b of S.bullets) { const x = b.x - camX, y = b.y - camY; if (b.word) { text(b.word, x - tw(b.word) / 2 + 1, y - 2, P.ink); text(b.word, x - tw(b.word) / 2, y - 3, blink(2) ? '#3aff7a' : '#ffffff'); } else if (b.phone) { px(x - 2, y - 3, 5, 7, '#141018'); px(x - 1, y - 2, 3, 4, P.teal); } else if (b.laser) { px(x - b.vx * .6, y - b.vy * .6, 3, 3, P.teal); px(x - 1, y - 1, 3, 3, '#ffffff'); } else { px(x - b.vx * .3, y - b.vy * .3, 1, 1, P.sun); px(x - 1, y - 1, 2, 2, b.mine ? '#fff6c8' : P.red); } }
  for (const q of S.parts) px(q.x - camX - q.size / 2, q.y - camY - q.size / 2, q.size, q.size, q.col);
  // tall things, farthest from the middle first, so nearer ones cover them
  const tall = [];
  for (const b of BUILDINGS) if (b.x1 > camX - 200 && b.x0 < camX + SW + 200 && b.y1 > camY - 200 && b.y0 < camY + SH + 200) tall.push([Math.hypot((b.x0 + b.x1) / 2 - camCX, (b.y0 + b.y1) / 2 - camCY), b, 0]);
  for (const p of PALMS) if (Math.abs(p.x - camCX) < SW && Math.abs(p.y - camCY) < SH) tall.push([Math.hypot(p.x - camCX, p.y - camCY), p, 1]);
  for (const l of LAMPS) if (Math.abs(l.x - camCX) < SW && Math.abs(l.y - camCY) < SH) tall.push([Math.hypot(l.x - camCX, l.y - camCY), l, 2]);
  tall.sort((a, b) => b[0] - a[0]);
  for (const [, o, k] of tall) k === 0 ? drawBuilding(o) : k === 1 ? drawPalm(o) : drawLamp(o);
  drawGulls(); drawStreetLabels();
  for (const c of S.traffic) if (c.honk) bubble(c.honkLine, c.x - camX, c.y - camY - 12);
  if (S.air) drawSprite(rideSprite(), carX, carY, S.a + (S.spin || 0), S.z);   // in the air you fly over everything
  if (S.drift) { const c = S.charge > 110 ? P.pink : S.charge > 40 ? P.teal : P.cream, w = Math.min(40, S.charge / 110 * 40); px(carX - 20, carY + 15, 40, 3, P.ink); px(carX - 20, carY + 15, w, 3, c); }
  // arrow toward the job when it is off screen
  drawTargetArrow();
  drawNight(); drawSpeedFx();
  drawHUD();
  if (S.hurtT && S.onFoot) { px(0, 21, SW, 2, P.red); px(0, SH - 2, SW, 2, P.red); px(0, 21, 2, SH, P.red); px(SW - 2, 21, 2, SH, P.red); }
  if (S.down) { const t = S.down === 'busted' ? 'BUSTED' : 'TOTALLY WASTED', sub = S.down === 'busted' ? 'GNARLY. -$' + S.downLoss : 'BOGUS. -$' + S.downLoss; px(0, 80, SW, 56, 'rgba(26,7,38,.85)'); ctext(t, 88, S.down === 'busted' ? '#3a7aff' : P.red, 3, P.ink); ctext(sub, 118, P.cream, 1); }
  if (mode === 'map') drawMap();
  if (mode === 'paused') drawPauseMenu();
  document.getElementById('lamp').classList.toggle('on', S.heat > 0 && !!blink(4));
}
function drawHUD() {
  px(0, 0, SW, 18, P.ink); px(0, 18, SW, 2, P.pink); px(0, 20, SW, 1, P.teal);
  text('$' + S.cash, 6, 2, P.cream, 2);
  const J = S.job;
  if (!J) ctext('PICK A PIN', 6, P.blush);
  else if (J.kind === 'race') ctext(J.count ? 'GET READY' : (J.time / 60).toFixed(1) + '/' + J.par + 'S', 2, J.time / 60 > J.par ? P.pink : P.sun, 2);
  else { const s = Math.max(0, Math.ceil(J.timer / 60)); ctext((J.kind === 'taxi' ? 'FARE ' : 'DROP ') + s + 'S', 2, s <= 5 && blink(3) ? P.pink : JOB_COLOUR[J.kind], 2); }
  drawWanted();
  if (S.streak > 1) text('STREAK X' + S.streak, 6, 26, P.sun);
  if (S.boss) drawBossBar(); else if (S.rampage) {} else if (S.banner && (S.banner.t > 30 || blink(2))) ctext(S.banner.text, 28, P.cream, 2, P.ink);
  if (S.say) { const w = tw(S.say.text) + 10, x = (SW - w) / 2; px(x, 46, w, 13, P.ink); px(x, 46, 2, 13, P.teal); ctext(S.say.text, 49, P.cream); }
  if (J && J.kind === 'race' && J.count) { const n = Math.ceil(J.count / 60); px(SW / 2 - 30, 64, 60, 72, P.ink); px(SW / 2 - 30, 64, 60, 3, P.sun); px(SW / 2 - 30, 133, 60, 3, P.pink); ctext(String(n), 75, n === 1 ? P.pink : P.sun, 7); }
  if (S.flashT) { const k = tw(S.flash, 2) + 20 > SW - 8 ? 1 : 2, w = tw(S.flash, k) + 20, x = (SW - w) / 2, h = k === 2 ? 24 : 16; px(x, 158, w, h, P.ink); px(x, 158, w, 2, P.pink); px(x, 156 + h, w, 2, P.teal); ctext(S.flash, k === 2 ? 163 : 162, P.cream, k); }
  drawTip(); drawCarBanner(); drawRetry();
  if (S.fade) { g.fillStyle = 'rgba(26,7,38,' + S.fade / 30 + ')'; g.fillRect(0, 21, SW, SH - 21); }
  drawRadar();
  const hx = 72, hy = SH - 14; px(hx, hy, 52, 8, P.ink); px(hx + 1, hy + 1, Math.max(0, S.hp) / 2, 6, S.hp < 30 && blink(3) ? P.cream : P.red); text('HP', hx + 55, hy + 1, P.blush);
  if (!S.onFoot) { px(hx, hy - 10, 52, 6, P.ink); px(hx + 1, hy - 9, Math.max(0, S.carHp) / 2, 4, S.carHp < 35 ? P.sun : P.teal); text('CAR', hx + 55, hy - 11, P.teal); }
  const ck = clockText(); text(ck, SW - 6 - tw(ck), SH - 33, nightLevel() > .5 ? P.teal : P.sun);
  const wl = S.weapon + (S.weapon === 'PISTOL' ? '' : ' ' + S.ammo); text(wl, SW - 6 - tw(wl), SH - 22, S.weapon === 'PISTOL' ? P.cream : P.sun);
  const kmh = S.onFoot ? 'ON FOOT' : Math.round(Math.hypot(S.v, S.side) * 26) + ' KM/H'; text(kmh, SW - 6 - tw(kmh), SH - 11, P.cream);
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
  drawGpsOn(rx, ry, x0, y0, RW, RH, 1, S.job ? JOB_COLOUR[S.job.kind] : P.cream);
  if (S.waypoint && !S.job) dot(S.waypoint.x, S.waypoint.y, blink(3) ? P.cream : P.sun, 4);
  if (S.job) { dot(S.job.target.x, S.job.target.y, blink(3) ? JOB_COLOUR[S.job.kind] : P.cream, 4); if (S.job.cps) for (let i = S.job.i + 1; i < S.job.cps.length; i++) dot(S.job.cps[i].x, S.job.cps[i].y, P.sun, 2, false); }
  else for (const k of JOB_KINDS) if (S.markers[k]) dot(S.markers[k].x, S.markers[k].y, JOB_COLOUR[k], 4);
  if (casinoDoor) dot(casinoDoor.x, casinoDoor.y, '#ffffff', 2, false);
  for (const a of AEROBICS) dot(a.x, a.y, P.pink, 2, false);
  if (STREAM) dot(STREAM.gate.x, STREAM.gate.y, blink(3) ? P.red : '#ffffff', 3, false);
  TAPES.forEach((t, i) => { if (!S.tapes.includes(i) && Math.hypot(t.x - S.x, t.y - S.y) < 220 && blink(3)) dot(t.x, t.y, P.violet, 2, false); });
  for (const m of S.maids) dot(m.x, m.y, blink(2) ? P.red : '#3a7aff', 2, false);
  px(rx + RW / 2 - 1, ry + RH / 2 - 1, 3, 3, '#ffffff'); px(rx + RW / 2 + Math.round(Math.cos(S.a) * 3), ry + RH / 2 + Math.round(Math.sin(S.a) * 3), 1, 1, '#ffffff');
  px(rx - 2, ry - 2, RW + 4, 1, P.teal); px(rx - 2, ry + RH + 1, RW + 4, 1, P.pink);
}
function drawMap() {
  const k = 1.12, w = Math.round(MW * k), h = Math.round(MH * k), x0 = Math.round((SW - w) / 2), y0 = 32;
  px(0, 21, SW, SH - 21, 'rgba(26,7,38,.94)');
  g.drawImage(radarPic, 0, 0, MW, MH, x0, y0, w, h);
  const dot = (wx, wy, c, size) => px(x0 + wx / T * k - size / 2, y0 + wy / T * k - size / 2, size, size, c);
  if (S.job) dot(S.job.target.x, S.job.target.y, blink(3) ? JOB_COLOUR[S.job.kind] : P.cream, 6);
  else for (const kd of JOB_KINDS) if (S.markers[kd]) dot(S.markers[kd].x, S.markers[kd].y, JOB_COLOUR[kd], 6);
  drawGpsOn(x0, y0, 0, 0, w, h, k, S.job ? JOB_COLOUR[S.job.kind] : P.cream);
  if (S.waypoint) dot(S.waypoint.x, S.waypoint.y, P.sun, 6);
  if (S.cursor) { const cx = x0 + S.cursor.x / T * k, cy = y0 + S.cursor.y / T * k; px(cx - 6, cy, 13, 1, '#ffffff'); px(cx, cy - 6, 1, 13, '#ffffff'); px(cx - 2, cy - 2, 5, 5, blink(3) ? P.pink : P.sun); }
  if (blink(2)) dot(S.x, S.y, '#ffffff', 5);
  if (casinoDoor) { dot(casinoDoor.x, casinoDoor.y, P.sun, 5); text('CASINO', x0 + casinoDoor.x / T * k + 4, y0 + casinoDoor.y / T * k - 3, P.sun); }
  for (const z of ZONES) { const r = zoneRect(z); text(z.name, x0 + (r.x0 + r.x1) / 2 * k - tw(z.name) / 2, y0 + (r.y0 + r.y1) / 2 * k - 3, P.cream); }
  ctext('PALM CITY   TAPES ' + S.tapes.length + '/' + TAPE_TOTAL + '   STUNTS ' + S.stunts.length + '/' + STUNT_IDS.size, 24, P.cream);
  const ly = y0 + h + 4; text('DELIVER', 40, ly, P.pink); text('TAXI', 100, ly, P.teal); text('RACE', 136, ly, P.sun); text('YOU', 172, ly, '#ffffff'); text('STICK MOVES  GAS WAYPOINT  DOOR CAB $' + CAB_FARE, 18, ly + 10, P.blush);
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
  px(0, 204, SW, 20, P.ink); ctext('AN 8-BIT ISLAND JOYRIDE', 210, P.blush);
  const sv = loadSave(); if (sv) text('SAVED $' + sv.cash + '  TAPES ' + (sv.tapes || []).length + '/24', 6, 6, P.cream); else if (best) text('BEST $' + best, 6, 6, P.cream);
  const ml = musicOn ? radioName() : 'RADIO OFF'; text(ml, SW - 6 - tw(ml), 6, musicOn ? P.teal : P.blush);
  drawTitleMenu();
}

/* ================= people ================= */
// a person seen from above, facing east; four walking frames
function personPicture(shirt, pants, skin, hair, f) {
  return makeSprite(11, 11, () => {
    const l = [-2, 0, 2, 0][f];
    px(4 + l, 2, 3, 2, pants); px(4 - l, 7, 3, 2, pants);          // legs
    px(3 - l, 0, 3, 2, skin); px(3 + l, 9, 3, 2, skin);             // hands swing against the legs
    px(2, 1, 5, 9, shirt); px(2, 1, 5, 1, shade(shirt, 1.2));       // shoulders
    px(4, 3, 5, 5, skin); px(3, 3, 3, 5, hair); px(4, 3, 2, 1, hair);   // head and hair
  });
}
const SKINS = ['#f2c9a0', '#d9a877', '#a8714a', '#7a4a2e'], SHIRTS = [P.pink, P.teal, P.sun, P.violet, '#ffffff', '#9fd3f0', P.blush, '#3a3a44', '#ff7a2a'], HAIRS = ['#2b1a12', '#5a2638', '#ffd36b', '#7a3b2e', '#e9d6f0', '#1a1a1a'];
function personSprites(key, shirt, pants, skin, hair) { return [0, 1, 2, 3].map(f => sprite(key + f, () => personPicture(shirt, pants, skin, hair, f))); }
const PLAYER_FOOT = () => personSprites('you', '#ffffff', '#3a5a9a', '#f2c9a0', '#2b1a12');   // white tee, blue jeans
function drawPerson(sp, x, y, a, step, lying) {
  const s = sp[lying ? 0 : (step >> 3) & 3], i = headingIndex(a), pic = s.look[i], half = pic.width / 2;
  g.drawImage(s.shadow[i], Math.round(x - half + 1), Math.round(y - half + 2)); g.drawImage(pic, Math.round(x - half), Math.round(y - half));
}

/* ================= on foot ================= */
const FOOT_R = 4;
function walkBlocked(x, y) { return blockedAt(x, y, FOOT_R) || isWater(tileAtPx(x, y)); }
function updateFoot() {
  let mx = keys.right - keys.left, my = keys.down - keys.up, run = 1;
  if (stick.mag > .18) { mx = stick.x; my = stick.y; run = stick.mag; }
  const m = Math.hypot(mx, my);
  if (m > .1) {
    S.fa = Math.atan2(my, mx); const sp = (m > 1 ? 1 : m) * (run > .85 ? 2.1 : 1.4);
    const nx = S.x + Math.cos(S.fa) * sp, ny = S.y + Math.sin(S.fa) * sp;
    if (!walkBlocked(nx, S.y)) S.x = nx; if (!walkBlocked(S.x, ny)) S.y = ny;
    S.step++;
  }
  if (S.knock) { S.x += S.kvx; S.y += S.kvy; S.kvx *= .85; S.kvy *= .85; if (walkBlocked(S.x, S.y)) { S.x -= S.kvx * 2; S.y -= S.kvy * 2; } S.knock--; }
}
// DOOR: get out when slow, or get into the nearest car: one you left, or anyone's (they run off)
function door() {
  if (S.down) return;
  if (S.onFoot && nearCasino()) { enterCasino(); return; }   // the casino door wins over anything next to it
  { const a = nearAerobics(S.onFoot ? 24 : 40); if (a && (S.onFoot || Math.hypot(S.v, S.side) < 1.2)) { jazzercise(a); return; } }
  if (S.onFoot && nearAtm()) { say('ATM: ' + pick(['CARD DECLINED.', 'INSUFFICIENT FUNDS. TOTALLY BOGUS.', 'PLEASE INSERT CARD. ANY CARD.']), 90); sfx('late'); return; }
  if (!S.onFoot) {
    if (Math.hypot(S.v, S.side) > 1.2 || S.air || S.sink) { flash('SLOW DOWN TO GET OUT', 50); return; }
    S.parked.push({ x: S.x, y: S.y, a: S.a, look: S.rideLook, hp: S.carHp });
    if (S.parked.length > 6) S.parked.shift();
    for (const side of [-1, 1, 0]) { const ox = S.x + Math.cos(S.a + side * Math.PI / 2) * 15, oy = S.y + Math.sin(S.a + side * Math.PI / 2) * 15; if (!walkBlocked(ox, oy) || side === 0) { S.x = ox; S.y = oy; break; } }
    S.onFoot = true; S.fa = S.a; S.v = 0; S.side = 0; S.drift = false; S.boost = 0; sfx('door'); return;
  }
  let best = null, bd = 26, from = null;
  for (const c of S.parked) { const d = Math.hypot(c.x - S.x, c.y - S.y); if (d < bd) { bd = d; best = c; from = 'parked'; } }
  for (const c of S.traffic) if (!c.wreck) { const d = Math.hypot(c.x - S.x, c.y - S.y); if (d < bd) { bd = d; best = c; from = 'traffic'; } }
  for (const c of S.cops) if (c.parked) { const d = Math.hypot(c.x - S.x, c.y - S.y); if (d < bd) { bd = d; best = c; from = 'cop'; } }
  if (!best) { callCar(); return; }
  if (from === 'parked') { S.parked.splice(S.parked.indexOf(best), 1); S.x = best.x; S.y = best.y; S.a = best.a; S.rideLook = best.look; S.carHp = best.hp; }
  else if (from === 'cop') { S.cops.splice(S.cops.indexOf(best), 1); S.x = best.x; S.y = best.y; S.a = best.a; S.rideLook = 'cop'; S.carHp = 70; addHeat(2, 'STOLE A COP CAR!'); }
  else {
    const i = S.traffic.indexOf(best); S.traffic[i] = spawnTraffic(true);
    S.x = best.x; S.y = best.y; S.a = Math.atan2(best.dy, best.dx); S.rideLook = best.look; S.carHp = best.hp || 100;
    const away = S.a + Math.PI / 2; S.runners.push({ x: best.x + Math.cos(away) * 12, y: best.y + Math.sin(away) * 12, a: away, t: 150, look: (Math.random() * 6) | 0, step: 0 });
    flash('CAR JACKED', 50);
  }
  S.onFoot = false; S.v = 0; S.side = 0; sfx('door'); carBanner();
}
const rideSprite = () => S.rideLook === -1 ? PLAYER_CAR() : S.rideLook === 'cop' ? COP_CAR() : trafficCar(S.rideLook);

/* ================= guns ================= */
const GUNS = { PISTOL: { cool: 14, dmg: 1, speed: 7, spread: .03 }, UZI: { cool: 5, dmg: 1, speed: 8, spread: .1 }, BLASTER: { cool: 22, dmg: 4, speed: 9, spread: 0, laser: true } };
function fire() {
  if (S.fireCool > 0 || S.down || S.sink) return;
  const gun = GUNS[S.weapon];
  let a = S.onFoot ? S.fa : S.a;
  if (S.onFoot) {   // a little aim help toward anything worth shooting
    let bestD = 220, best = null;
    for (const o of [...S.cops, ...S.maids, ...(S.boss ? [S.boss] : []), ...(S.goons || [])]) { if (o.dead) continue; const d = Math.hypot(o.x - S.x, o.y - S.y), da = Math.abs(angleDiff(Math.atan2(o.y - S.y, o.x - S.x), a)); if (d < bestD && da < .45) { bestD = d; best = o; } }
    if (best) a = Math.atan2(best.y - S.y, best.x - S.x);
  }
  a += (Math.random() - .5) * gun.spread * 2;
  const ox = S.x + Math.cos(a) * (S.onFoot ? 7 : 14), oy = S.y + Math.sin(a) * (S.onFoot ? 7 : 14);
  S.bullets.push({ x: ox, y: oy, vx: Math.cos(a) * gun.speed, vy: Math.sin(a) * gun.speed, life: 50, dmg: gun.dmg, laser: gun.laser, mine: true });
  S.fireCool = gun.cool; sfx(gun.laser ? 'laser' : 'shot'); S.lastShot = { x: S.x, y: S.y, t: frame };
  if (S.weapon !== 'PISTOL' && --S.ammo <= 0) { S.weapon = 'PISTOL'; S.ammo = 0; flash('OUT OF AMMO', 40); }
  if (S.heat < 1 && !S.shotsSeen) { S.shotsSeen = true; addHeat(1, 'SHOTS FIRED'); }
}
function hurt(n, why) {
  if (S.down) return;
  if (S.onFoot) { S.hp -= n; S.hurtT = 12; sfx('hurt'); if (S.hp <= 0) goDown('wasted'); }
  else { S.carHp -= n; S.hurtT = 8; if (S.carHp <= 0) explodeRide(); }
}
function boom(x, y, big = 1, hitsYou = true) {
  sfx('boom'); S.shake = 14; if (Math.abs(x - S.x) < 260 && Math.abs(y - S.y) < 200) S.blast = 14;
  puff(x, y, 26 * big, P.sun, 5 * big, 26, 4); puff(x, y, 16 * big, '#ff7a2a', 4 * big, 32, 4); puff(x, y, 14 * big, '#3a3440', 3, 60, 5, .6);
  for (const c of S.traffic) if (!c.wreck && Math.hypot(c.x - x, c.y - y) < 36) { c.hp = 0; wreckCar(c, true); }
  if (hitsYou && Math.hypot(S.x - x, S.y - y) < 40 && !S.down) hurt(S.onFoot ? 35 : 25);
}
function wreckCar(c, quiet) { c.wreck = 60 * 10; c.v = 0; if (!quiet) boom(c.x, c.y); }
function explodeRide() {
  S.parked.push({ x: S.x, y: S.y, a: S.a, look: S.rideLook, hp: 0, wreck: 60 * 10 });
  boom(S.x, S.y, 1.4, false);
  S.onFoot = true; S.fa = S.a; S.v = 0; S.side = 0; S.carHp = 100; S.hp -= 30; S.x += Math.cos(S.a + Math.PI / 2) * 16; S.y += Math.sin(S.a + Math.PI / 2) * 16;
  flash('YOUR RIDE BLEW UP', 90); if (S.hp <= 0) goDown('wasted');
}
function updateBullets() {
  for (const b of S.bullets) {
    for (let k = 0; k < 2 && b.life > 0; k++) {   // two half steps so fast bullets do not skip through things
      b.x += b.vx / 2; b.y += b.vy / 2;
      if (solidAtPx(b.x, b.y)) { puff(b.x, b.y, 3, P.sun, 1.5, 10, 2); b.life = 0; break; }
      if (b.mine) {
        for (const c of S.traffic) if (!c.wreck && Math.abs(c.x - b.x) < 10 && Math.abs(c.y - b.y) < 10) { c.hp = (c.hp ?? 6) - b.dmg; c.v = 0; c.wait = 0; b.life = 0; puff(b.x, b.y, 3, P.cream, 1.5, 10, 2); if (c.hp <= 0) { wreckCar(c); addHeat(1, 'KABOOM'); } break; }
        for (const c of S.cops) if (!c.dead && Math.abs(c.x - b.x) < 11 && Math.abs(c.y - b.y) < 11) { c.hp -= b.dmg; b.life = 0; puff(b.x, b.y, 3, P.cream, 1.5, 10, 2); if (c.hp <= 0) { c.dead = 60 * 8; boom(c.x, c.y); addHeat(1, 'COP CAR DOWN'); } break; }
        for (const m of S.maids) if (Math.abs(m.x - b.x) < 8 && Math.abs(m.y - b.y) < 8) { m.spin = 40; b.life = 0; sfx('hurt'); flash('SCOOTER DOWN', 40); break; }
        if (S.hitTargets) S.hitTargets(b);
      } else if (Math.abs(S.x - b.x) < (S.onFoot ? 6 : 11) && Math.abs(S.y - b.y) < (S.onFoot ? 6 : 11)) { hurt(b.dmg); b.life = 0; }
    }
    b.life--;
  }
  S.bullets = S.bullets.filter(b => b.life > 0);
}

/* ================= cops ================= */
const COP_CAR = () => sprite('cop', () => { const c = carPicture('sedan', '#f3eee6', '#23328a'); ctx = c.getContext('2d'); px(11, 3, 2, 3, P.red); px(11, 7, 2, 3, '#3a7aff'); ctx = g; return c; });
function spawnCop() {
  for (let k = 0; k < 400; k++) { const a = Math.random() * Math.PI * 2, r = 260 + Math.random() * 80, x = S.x + Math.cos(a) * r, y = S.y + Math.sin(a) * r, tx = Math.floor(x / T), ty = Math.floor(y / T);
    if (at(tx, ty) === ROAD) return { x: tx * T + 8, y: ty * T + 8, a: Math.atan2(S.y - y, S.x - x), v: 0, hp: 6, stuck: 0, back: 0, bump: 0 }; }
  return null;
}
function updateCops() {
  const want = S.heat >= 3 ? S.heat - 2 : 0;
  if (S.cops.filter(c => !c.dead && !c.parked).length < want && frame % 30 === 0) { const c = spawnCop(); if (c) S.cops.push(c); }
  for (const c of S.cops) {
    if (c.dead) { c.dead--; if (frame % 6 === 0) puff(c.x, c.y, 1, '#3a3440', 1, 40, 4, .5); continue; }
    if (c.parked) continue;
    const top = 2.9 + S.heat * .18, want = Math.atan2(S.y - c.y, S.x - c.x), d = Math.hypot(S.x - c.x, S.y - c.y);
    if (c.back > 0) { c.back--; c.v = -1.2; c.a += .05; }
    else { c.a += clamp(angleDiff(want, c.a), -.07, .07); c.v = Math.min(top, c.v + .08); if (d < 40 && S.onFoot) c.v = Math.min(c.v, 1.2); }
    const nx = c.x + Math.cos(c.a) * c.v, ny = c.y + Math.sin(c.a) * c.v;
    if (blockedAt(nx, ny, 6) || isWater(tileAtPx(nx, ny))) { if (!blockedAt(nx, c.y, 6) && !isWater(tileAtPx(nx, c.y))) c.x = nx; else if (!blockedAt(c.x, ny, 6) && !isWater(tileAtPx(c.x, ny))) c.y = ny; else { c.v = 0; } c.stuck++; }
    else { c.x = nx; c.y = ny; c.stuck = Math.max(0, c.stuck - 1); }
    if (c.stuck > 40) { c.back = 30; c.stuck = 0; }
    if (c.bump) c.bump--;
    if (d < 16 && !c.bump && !S.air && !S.down) {
      c.bump = 40;
      if (S.onFoot) { goDown('busted'); return; }
      hurt(8); sfx('crash'); S.shake = 6; const k = Math.atan2(S.y - c.y, S.x - c.x); S.x += Math.cos(k) * 6; S.y += Math.sin(k) * 6; c.v = -.5;
    }
    if (S.heat >= 5 && d < 180 && frame % 50 === (c.hp * 7) % 50) { const a = want + (Math.random() - .5) * .2; S.bullets.push({ x: c.x, y: c.y, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5, life: 50, dmg: 5 }); sfx('shot'); }
  }
  S.cops = S.cops.filter(c => !(c.dead === 0) && Math.hypot(c.x - S.x, c.y - S.y) < 900);
}

/* ================= pickups, spray shops, going down ================= */
function placePickups() {
  S.pickups = [];
  const kinds = ['UZI', 'UZI', 'UZI', 'BLASTER', 'BLASTER', 'COLA', 'COLA', 'COLA', 'COLA', 'COLA', 'COLA'];
  for (const kind of kinds) { const t = randomCurb(); S.pickups.push({ x: t.x, y: t.y, kind, gone: 0 }); }
}
function updatePickups() {
  for (const q of S.pickups) {
    if (q.gone) { q.gone--; continue; }
    if (Math.hypot(q.x - S.x, q.y - S.y) < 22 && S.onFoot === true || (Math.hypot(q.x - S.x, q.y - S.y) < 16 && !S.onFoot && q.kind !== 'COLA')) {
      if (q.kind === 'COLA') { if (S.hp >= 100) continue; S.hp = Math.min(100, S.hp + 40); flash('NEW KOLA +40 HP', 60); }
      else { S.weapon = q.kind; S.ammo = q.kind === 'UZI' ? 160 : 24; flash(q.kind === 'UZI' ? 'UZI! 160 ROUNDS' : 'BLASTER 2000!', 70); }
      sfx('pickup'); q.gone = 60 * 45;
    }
  }
  for (const s of SPRAYS) if (!S.onFoot && Math.hypot(s.x - S.x, s.y - S.y) < 18) {
    if (S.sprayLock) continue; S.sprayLock = true;
    const fixed = S.heat > 0 || S.carHp < 100; S.heat = 0; S.maids = []; S.cops = S.cops.filter(c => c.dead); S.carHp = 100; S.shotsSeen = false; S.heatClock = 0;
    sfx('deliver'); flash(fixed ? 'PAINT N SPRAY: HEAT GONE' : 'PAINT N SPRAY', 90); puff(S.x, S.y, 20, pick([P.pink, P.teal, P.sun]), 3, 30, 3);
  }
  if (S.sprayLock && SPRAYS.every(s => Math.hypot(s.x - S.x, s.y - S.y) > 40)) S.sprayLock = false;
}
function goDown(why) {
  if (S.down) return;
  S.down = why; S.downT = 170; S.v = 0; S.side = 0;
  const loss = Math.floor(S.cash * (why === 'busted' ? .2 : .1)); S.cash -= loss; S.downLoss = loss;
  sfx(why === 'busted' ? 'ticket' : 'late'); save();
  if (S.job) { S.job = null; for (const k of JOB_KINDS) if (!S.markers[k]) placeMarker(k); }
}
function getUp() {
  S.down = null; S.boss = null; S.goons = []; S.heat = 0; S.maids = []; S.cops = []; S.bullets = []; S.hp = 100; S.carHp = 100; S.shotsSeen = false;
  S.onFoot = false; S.rideLook = -1; const r = nearestRoad(S.x, S.y, 10); if (r) { S.x = r[0] * T + 8; S.y = r[1] * T + 8; } else { S.x = START.x; S.y = START.y; } S.a = -Math.PI / 2; S.cam.x = S.x; S.cam.y = S.y; S.weapon = 'PISTOL'; S.ammo = 0;
}
function drawPickups() {
  for (const q of S.pickups) {
    if (q.gone) continue; const x = q.x - camX, y = q.y - camY - 4 - blink(3) * 2; if (x < -10 || y < -10 || x > SW + 10 || y > SH + 10) continue;
    px(x - 5, y + 6, 10, 3, 'rgba(26,7,38,.3)');
    if (q.kind === 'COLA') { px(x - 3, y - 5, 6, 10, P.red); px(x - 3, y - 2, 6, 3, P.cream); px(x - 2, y - 6, 4, 1, '#c8c2cc'); }
    else if (q.kind === 'UZI') { px(x - 5, y - 2, 10, 3, '#2a2430'); px(x - 1, y + 1, 3, 4, '#2a2430'); px(x + 3, y - 3, 2, 1, '#6a6472'); }
    else { px(x - 6, y - 2, 11, 3, P.teal); px(x - 6, y - 2, 11, 1, '#c8fffb'); px(x - 2, y + 1, 3, 4, P.violet); px(x + 5, y - 1, 2, 1, P.pink); }
    if (blink(4)) px(x + 4, y - 7, 2, 2, '#ffffff');
  }
}
const WRECK = () => sprite('wreck', () => carPicture('sedan', '#3a3440', '#2a2430'));

/* ================= Lucky Cassette Casino ================= */
// walk up to the casino door and press DOOR; GAS plays, DRIFT goes back, the stick picks
const GAMES = [
  { id: 'slots', name: 'SLOTS', blurb: 'THREE OF A KIND. SEVENS PAY 50X' },
  { id: 'blackjack', name: 'BLACKJACK', blurb: 'BEAT THE DEALER TO 21' },
  { id: 'roulette', name: 'ROULETTE', blurb: 'RED, BLACK, ODD, EVEN OR A NUMBER' },
  { id: 'highlow', name: 'HIGH-LOW', blurb: 'GUESS THE NEXT CARD. LET IT RIDE' },
  { id: 'wheel', name: 'WHEEL OF FORTUNA', blurb: 'SPIN IT. UP TO 5X' },
  { id: 'scratch', name: 'RAD SCRATCH', blurb: 'MATCH THREE TO WIN' }
];
const BETS = [10, 25, 50, 100, 250, 500];
let C = null;   // what is on the casino screen
let casinoDoor = null;
function findCasinoDoor() { const b = BUILDINGS.find(q => q.style === 'casino'); casinoDoor = b ? { x: (b.x0 + b.x1) / 2, y: b.y1 + 10 } : null; }
const nearCasino = () => casinoDoor && Math.hypot(S.x - casinoDoor.x, S.y - casinoDoor.y) < 22;
function enterCasino() { C = { screen: 'menu', sel: 0, bet: 25, msg: '', t: 0, held: null, holdT: 0 }; mode = 'casino'; sfx('deliver'); S.gambled = S.gambled || 0; }
function leaveCasino() { save(); mode = 'play'; C = null; S.y = casinoDoor.y + 6; sfx('door'); }
const canBet = () => { if (S.cash < C.bet) { const ok = BETS.filter(b => b <= S.cash); if (!ok.length) { C.msg = 'COME BACK WITH CASH'; sfx('late'); return false; } C.bet = ok[ok.length - 1]; } S.cash -= C.bet; S.gambled += C.bet; return true; };
function win(amount, line) { S.cash += amount; C.msg = line + (amount ? ' +$' + amount : ''); sfx(amount > C.bet ? 'deliver' : amount ? 'pickup' : 'late'); if (amount >= C.bet * 10) C.jackpot = 120; }
function stepBet(d) { const i = clamp(BETS.indexOf(C.bet) + d, 0, BETS.length - 1); C.bet = BETS[i]; sfx('count'); }

// --- cards ---
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const drawCard = () => ({ r: (Math.random() * 13) | 0, s: (Math.random() * 4) | 0 });
const cardVal = c => c.r === 0 ? 11 : Math.min(10, c.r + 1);
function handVal(h) { let v = 0, aces = 0; for (const c of h) { v += cardVal(c); if (c.r === 0) aces++; } while (v > 21 && aces--) v -= 10; return v; }
function drawSuit(s, x, y) {
  const c = s < 2 ? P.red : P.ink;
  if (s === 0) { px(x, y, 2, 2, c); px(x + 3, y, 2, 2, c); px(x, y + 1, 5, 2, c); px(x + 1, y + 3, 3, 1, c); px(x + 2, y + 4, 1, 1, c); }        // heart
  else if (s === 1) { px(x + 2, y, 1, 1, c); px(x + 1, y + 1, 3, 1, c); px(x, y + 2, 5, 1, c); px(x + 1, y + 3, 3, 1, c); px(x + 2, y + 4, 1, 1, c); }   // diamond
  else if (s === 2) { px(x + 2, y, 1, 1, c); px(x + 1, y + 1, 3, 1, c); px(x, y + 2, 5, 2, c); px(x + 2, y + 4, 1, 2, c); }                          // spade
  else { px(x + 1, y, 3, 2, c); px(x, y + 2, 2, 2, c); px(x + 3, y + 2, 2, 2, c); px(x + 2, y + 2, 1, 4, c); }                                       // club
}
function drawCardAt(c, x, y, hidden) {
  px(x + 1, y + 2, 22, 30, 'rgba(0,0,0,.35)'); px(x, y, 22, 30, hidden ? P.violet : '#fffaf2'); px(x, y, 22, 1, '#ffffff');
  if (hidden) { for (let i = 2; i < 28; i += 4) px(x + 2, y + i, 18, 2, P.pink); return; }
  text(RANKS[c.r], x + 2, y + 2, c.s < 2 ? P.red : P.ink); drawSuit(c.s, x + 15, y + 3); drawSuit(c.s, x + 8, y + 16);
}

// --- slot symbols ---
const SYMBOLS = ['7', 'CHERRY', 'PALM', 'TAPE', 'BOOMBOX', 'FLAMINGO', 'SHADES'], WEIGHTS = [1, 4, 5, 4, 4, 3, 3];
const spinSymbol = () => { let r = Math.random() * WEIGHTS.reduce((a, b) => a + b); for (let i = 0; i < WEIGHTS.length; i++) if ((r -= WEIGHTS[i]) < 0) return i; return 2; };
function drawSymbol(i, x, y) {
  const n = SYMBOLS[i];
  if (n === '7') { text('7', x + 4, y + 2, P.ink, 3); text('7', x + 3, y + 1, P.red, 3); }
  else if (n === 'CHERRY') { px(x + 3, y + 11, 7, 7, P.red); px(x + 11, y + 12, 7, 7, P.red); px(x + 4, y + 12, 2, 2, '#ffb0b8'); px(x + 7, y + 3, 2, 9, '#3a8a2e'); px(x + 9, y + 3, 6, 2, '#3a8a2e'); px(x + 14, y + 5, 2, 7, '#3a8a2e'); }
  else if (n === 'PALM') { px(x + 10, y + 7, 3, 14, '#7a4a32'); for (const [dx, dy] of [[-7, 0], [6, 0], [-5, 4], [5, 4], [0, -3]]) px(x + 10 + dx, y + 5 + dy, 7, 3, '#2fae4f'); }
  else if (n === 'TAPE') { px(x + 1, y + 5, 20, 13, '#2a2430'); px(x + 3, y + 7, 16, 6, P.cream); px(x + 5, y + 9, 3, 3, '#2a2430'); px(x + 14, y + 9, 3, 3, '#2a2430'); px(x + 3, y + 7, 16, 1, P.pink); }
  else if (n === 'BOOMBOX') { px(x + 1, y + 6, 20, 12, '#8a8490'); px(x + 6, y + 3, 10, 3, '#5a5462'); px(x + 3, y + 9, 6, 6, '#2a2430'); px(x + 13, y + 9, 6, 6, '#2a2430'); px(x + 5, y + 11, 2, 2, P.teal); px(x + 15, y + 11, 2, 2, P.teal); }
  else if (n === 'FLAMINGO') { px(x + 6, y + 8, 10, 6, P.pink); px(x + 14, y + 2, 2, 8, P.pink); px(x + 14, y + 1, 4, 3, P.pink); px(x + 17, y + 2, 2, 1, P.ink); px(x + 9, y + 14, 1, 7, P.pink); }
  else { px(x + 1, y + 8, 20, 2, P.ink); px(x + 2, y + 9, 8, 6, P.ink); px(x + 12, y + 9, 8, 6, P.ink); px(x + 3, y + 10, 3, 2, P.teal); px(x + 13, y + 10, 3, 2, P.teal); }
}

// --- roulette ---
const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const ROUL_BETS = ['RED', 'BLACK', 'ODD', 'EVEN', '1-18', '19-36', 'NUMBER'];
function rouletteWins(bet, n, pick) {
  if (bet === 'NUMBER') return n === pick ? 36 : 0;
  if (n === 0) return 0;
  return ({ RED: REDS.has(n), BLACK: !REDS.has(n), ODD: n % 2 === 1, EVEN: n % 2 === 0, '1-18': n <= 18, '19-36': n >= 19 })[bet] ? 2 : 0;
}
const FORTUNA = [0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 5, 0, 1, 0, 1];

function casinoPress(k) {
  if (!C) return;
  const back = k === 'b' || k === 'start', go = k === 'a' || k === 'door' || k === 'up' && false;
  if (C.screen === 'menu') {
    if (k === 'up') { C.sel = (C.sel + GAMES.length - 1) % GAMES.length; sfx('count'); }
    else if (k === 'down') { C.sel = (C.sel + 1) % GAMES.length; sfx('count'); }
    else if (k === 'left' || k === 'right') stepBet(k === 'left' ? -1 : 1);
    else if (back) leaveCasino();
    else if (k === 'a' || k === 'door' || k === 'fire') { const id = GAMES[C.sel].id; Object.assign(C, { screen: id, phase: 'bet', msg: '' }); if (id === 'roulette') Object.assign(C, { rb: 0, num: 17, angle: 0 }); if (id === 'wheel') C.angle = 0; sfx('pickup'); }
    return;
  }
  if (back && !C.busy) {   // walking away never throws money away
    if (C.screen === 'highlow' && C.phase === 'guess') win(C.pot, 'CASHED OUT');
    if (C.screen === 'blackjack' && C.phase === 'play') { blackjackEnd(); return; }
    C.screen = 'menu'; C.msg = ''; sfx('count'); return; }
  const game = C.screen;
  if (game === 'slots') {
    if (k === 'left' || k === 'right') { if (!C.busy) stepBet(k === 'left' ? -1 : 1); }
    else if ((k === 'a' || k === 'door' || k === 'fire') && !C.busy && canBet()) { C.result = [spinSymbol(), spinSymbol(), spinSymbol()]; C.busy = 1; C.t = 0; C.msg = ''; sfx('skid'); }
  } else if (game === 'blackjack') {
    if (C.phase === 'bet' || C.phase === 'done') {
      if (k === 'left' || k === 'right') stepBet(k === 'left' ? -1 : 1);
      else if ((k === 'a' || k === 'door') && canBet()) {
        C.you = [drawCard(), drawCard()]; C.dealer = [drawCard(), drawCard()]; C.phase = 'play'; C.stake = C.bet; C.msg = 'GAS HIT  FIRE STAND  DOOR DOUBLE'; sfx('count');
        if (handVal(C.you) === 21) blackjackEnd();
      }
    } else if (C.phase === 'play') {
      if (k === 'a') { C.you.push(drawCard()); sfx('count'); if (handVal(C.you) > 21) blackjackEnd(); else if (handVal(C.you) === 21) blackjackEnd(); }
      else if (k === 'fire') blackjackEnd();
      else if (k === 'door' && C.you.length === 2 && S.cash >= C.stake) { S.cash -= C.stake; S.gambled += C.stake; C.stake *= 2; C.you.push(drawCard()); blackjackEnd(); }
    }
  } else if (game === 'roulette') {
    if (C.busy) return;
    if (k === 'left' || k === 'right') { C.rb = (C.rb + (k === 'left' ? ROUL_BETS.length - 1 : 1)) % ROUL_BETS.length; sfx('count'); }
    else if ((k === 'up' || k === 'down') && ROUL_BETS[C.rb] === 'NUMBER') { C.num = (C.num + (k === 'up' ? 1 : 36)) % 37; sfx('count'); }
    else if (k === 'up' || k === 'down') stepBet(k === 'up' ? 1 : -1);
    else if ((k === 'a' || k === 'door' || k === 'fire') && canBet()) { C.result = (Math.random() * 37) | 0; C.busy = 1; C.t = 0; C.msg = ''; C.spin0 = C.angle; sfx('skid'); }
  } else if (game === 'highlow') {
    if (C.phase === 'bet' || C.phase === 'done') {
      if (k === 'left' || k === 'right') stepBet(k === 'left' ? -1 : 1);
      else if ((k === 'a' || k === 'door') && canBet()) { C.card = drawCard(); C.pot = C.bet; C.streak = 0; C.phase = 'guess'; C.msg = 'UP HIGHER  DOWN LOWER  FIRE CASH OUT'; C.next = null; sfx('count'); }
    } else if (C.phase === 'guess') {
      if (k === 'up' || k === 'down') {
        const n = drawCard(), a = C.card.r, b = n.r; C.next = n;
        if (a === b) { C.msg = 'SAME CARD. PUSH'; C.card = n; sfx('count'); }
        else if ((k === 'up') === (b > a)) { C.pot *= 2; C.streak++; C.card = n; C.msg = 'YES! POT $' + C.pot; sfx('pickup'); if (C.streak >= 6) { win(C.pot, 'SIX IN A ROW!'); C.phase = 'done'; } }
        else { C.msg = 'NOPE. POT GONE'; C.card = n; C.phase = 'done'; sfx('late'); }
      } else if (k === 'fire' || k === 'a') { win(C.pot, 'CASHED OUT'); C.phase = 'done'; }
    }
  } else if (game === 'wheel') {
    if (C.busy) return;
    if (k === 'left' || k === 'right') stepBet(k === 'left' ? -1 : 1);
    else if ((k === 'a' || k === 'door' || k === 'fire') && canBet()) { C.result = (Math.random() * FORTUNA.length) | 0; C.busy = 1; C.t = 0; C.msg = ''; C.spin0 = C.angle; sfx('skid'); }
  } else if (game === 'scratch') {
    if (C.phase === 'bet' || C.phase === 'done') {
      if (k === 'left' || k === 'right') stepBet(k === 'left' ? -1 : 1);
      else if ((k === 'a' || k === 'door') && canBet()) { C.boxes = scratchTicket(); C.shown = 0; C.phase = 'scratch'; C.msg = 'GAS TO SCRATCH'; sfx('count'); }
    } else if (C.phase === 'scratch' && (k === 'a' || k === 'door' || k === 'fire')) {
      C.shown++; sfx('skid');
      if (C.shown >= 6) { const m = C.boxes.find(v => C.boxes.filter(q => q === v).length >= 3); C.phase = 'done'; if (m) win(C.bet * m, 'MATCHED ' + m + 'X'); else win(0, 'NO MATCH'); }
    }
  }
}
function scratchTicket() {
  const prizes = [1, 2, 5, 10, 50], out = [];
  if (Math.random() < .33) { const m = Math.random() < .55 ? 1 : Math.random() < .7 ? 2 : Math.random() < .75 ? 5 : Math.random() < .85 ? 10 : 50; out.push(m, m, m); }
  while (out.length < 6) { const v = pick(prizes); if (out.filter(q => q === v).length < 2) out.push(v); }
  for (let i = out.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
function blackjackEnd() {
  const you = handVal(C.you);
  if (you <= 21) while (handVal(C.dealer) < 17) C.dealer.push(drawCard());
  const d = handVal(C.dealer), natural = you === 21 && C.you.length === 2;
  C.phase = 'done';
  if (you > 21) win(0, 'BUST');
  else if (natural && !(d === 21 && C.dealer.length === 2)) win(Math.floor(C.stake * 2.5), 'BLACKJACK!');
  else if (d > 21 || you > d) win(C.stake * 2, 'YOU WIN');
  else if (you === d) win(C.stake, 'PUSH');
  else win(0, 'DEALER WINS');
}
function updateCasino() {
  if (!C) return;
  C.t++; if (C.jackpot) C.jackpot--;
  // the stick works like a d-pad here
  let dir = null;
  if (stick.mag > .55) dir = Math.abs(stick.x) > Math.abs(stick.y) ? (stick.x > 0 ? 'right' : 'left') : (stick.y > 0 ? 'down' : 'up');
  if (dir && dir !== C.held) { casinoPress(dir); C.holdT = 0; } else if (dir && ++C.holdT > 18) { casinoPress(dir); C.holdT = 10; }
  C.held = dir;
  if (C.screen === 'slots' && C.busy) {
    if (C.t % 4 === 0) sfx('count');
    if (C.t > 90) {
      C.busy = 0; const [a, b, c] = C.result, n = SYMBOLS;
      if (a === b && b === c) win(C.bet * (n[a] === '7' ? 50 : n[a] === 'CHERRY' ? 15 : 10), n[a] === '7' ? 'JACKPOT!' : 'THREE ' + n[a] + 'S');
      else if ([a, b, c].filter(q => n[q] === '7').length === 2) win(C.bet * 5, 'TWO SEVENS');
      else if (a === b || b === c || a === c) win(C.bet * 2, 'A PAIR');
      else if ([a, b, c].some(q => n[q] === 'CHERRY')) win(C.bet, 'CHERRY. MONEY BACK');
      else win(0, 'NOTHING');
    }
  }
  if (C.screen === 'roulette' && C.busy) {
    const D = 160, f = Math.min(1, C.t / D), ease = 1 - Math.pow(1 - f, 3), slot = WHEEL_ORDER.indexOf(C.result);
    const target = Math.PI * 2 * 5 + (-slot / 37) * Math.PI * 2 - (C.spin0 % (Math.PI * 2));
    C.angle = C.spin0 + target * ease;
    if (C.t % 6 === 0 && f < .9) sfx('count');
    if (C.t >= D) { C.busy = 0; const pay = rouletteWins(ROUL_BETS[C.rb], C.result, C.num) * C.bet; win(pay, (C.result === 0 ? 'GREEN ' : REDS.has(C.result) ? 'RED ' : 'BLACK ') + C.result); }
  }
  if (C.screen === 'wheel' && C.busy) {
    const D = 170, f = Math.min(1, C.t / D), ease = 1 - Math.pow(1 - f, 3), seg = Math.PI * 2 / FORTUNA.length;
    const target = Math.PI * 2 * 4 + (-C.result * seg) - (C.spin0 % (Math.PI * 2));
    C.angle = C.spin0 + target * ease;
    if (C.t % 5 === 0 && f < .92) sfx('count');
    if (C.t >= D) { C.busy = 0; const m = FORTUNA[C.result]; win(C.bet * m, m ? m + 'X!' : 'ZERO. OUCH'); }
  }
}
function drawCasino() {
  ctx = g;
  // carpet
  for (let y = 0; y < SH; y += 8) for (let x = 0; x < SW; x += 8) px(x, y, 8, 8, ((x + y) >> 3) & 1 ? '#3a0f2a' : '#4a1436');
  for (let y = 4; y < SH; y += 16) for (let x = 4; x < SW; x += 16) { px(x, y, 2, 2, P.sun); px(x + 8, y + 8, 2, 2, P.teal); }
  px(0, 0, SW, 24, P.ink); px(0, 24, SW, 2, P.sun);
  ctext('LUCKY CASSETTE CASINO', 4, C.jackpot && blink(2) ? P.pink : P.sun, 2);
  text('$' + S.cash, 6, 30, P.cream, 2); const bl = 'BET $' + C.bet; text(bl, SW - 6 - tw(bl, 2), 30, P.teal, 2);
  const foot = (s) => { px(0, SH - 14, SW, 14, P.ink); ctext(s, SH - 10, P.blush); };
  if (C.msg) { const w = tw(C.msg, 2) + 16; px((SW - w) / 2, 176, w, 20, P.ink); px((SW - w) / 2, 176, w, 2, P.pink); ctext(C.msg, 180, P.cream, C.msg.length > 24 ? 1 : 2); }
  if (C.screen === 'menu') {
    GAMES.forEach((gm, i) => { const y = 52 + i * 19, on = i === C.sel; px(60, y, 216, 16, on ? P.pink : 'rgba(26,7,38,.75)'); text(gm.name, 70, y + 4, on ? P.ink : P.cream); if (on) text('>', 62, y + 4, P.ink); });
    ctext(GAMES[C.sel].blurb, 168, P.sun);
    foot('STICK PICKS  LEFT/RIGHT BET  GAS PLAY  DRIFT LEAVE'); return;
  }
  const felt = (x, y, w, h) => { px(x, y, w, h, '#1f6a3a'); px(x, y, w, 2, '#c9a24a'); px(x, y + h - 2, w, 2, '#c9a24a'); for (let i = x + 4; i < x + w; i += 12) px(i, y + 6, 1, 1, '#2a7a46'); };
  if (C.screen === 'slots') {
    px(84, 54, 168, 92, '#c9a24a'); px(88, 58, 160, 84, P.ink); ctext('PALM CITY SLOTS', 62, P.pink);
    for (let r = 0; r < 3; r++) {
      const x = 98 + r * 48, y = 80; px(x, y, 44, 44, '#fffaf2'); px(x, y, 44, 2, '#ffffff');
      const stopped = !C.busy || C.t > 40 + r * 20, sym = !C.result ? r * 2 : stopped ? C.result[r] : (C.t + r * 3) % SYMBOLS.length;
      drawSymbol(sym, x + 11, y + 11 + (stopped ? 0 : (C.t * 3 % 8) - 4));
    }
    foot('LEFT/RIGHT BET  GAS SPIN  DRIFT BACK');
  } else if (C.screen === 'blackjack') {
    felt(24, 50, 288, 118); text('DEALER', 34, 56, P.cream);
    if (C.dealer) { C.dealer.forEach((c, i) => drawCardAt(c, 34 + i * 26, 66, C.phase === 'play' && i === 1)); if (C.phase !== 'play') text(String(handVal(C.dealer)), 34 + C.dealer.length * 26 + 4, 76, P.sun); }
    text('YOU', 34, 108, P.cream);
    if (C.you) { C.you.forEach((c, i) => drawCardAt(c, 34 + i * 26, 118, false)); text(String(handVal(C.you)), 34 + C.you.length * 26 + 4, 128, P.sun); }
    foot(C.phase === 'play' ? 'GAS HIT  FIRE STAND  DOOR DOUBLE' : 'LEFT/RIGHT BET  GAS DEAL  DRIFT BACK');
  } else if (C.screen === 'roulette') {
    felt(16, 48, 304, 122);
    const cx = 92, cy = 108, R = 52;
    for (let i = 0; i < 37; i++) { const n = WHEEL_ORDER[i], a = C.angle + i / 37 * Math.PI * 2 - Math.PI / 2, col = n === 0 ? '#2fae4f' : REDS.has(n) ? P.red : P.ink;
      for (let r = R - 12; r < R; r += 2) px(cx + Math.cos(a) * r - 2, cy + Math.sin(a) * r - 2, 4, 4, col); }
    ctx.fillStyle = '#7a4a32'; ctx.beginPath(); ctx.arc(cx, cy, R - 14, 0, Math.PI * 2); ctx.fill(); px(cx - 3, cy - 3, 6, 6, P.sun);
    px(cx - 2, cy - R - 6, 5, 6, '#ffffff');   // the ball sits at the top when the wheel stops
    const label = ROUL_BETS[C.rb] === 'NUMBER' ? 'NUMBER ' + C.num : ROUL_BETS[C.rb];
    text('YOUR BET', 172, 66, P.cream); px(172, 78, 130, 22, P.ink); text('< ' + label + ' >', 178, 85, P.sun);
    text(ROUL_BETS[C.rb] === 'NUMBER' ? 'PAYS 36X. UP/DOWN NUMBER' : 'PAYS 2X. UP/DOWN BET', 172, 108, P.blush);
    if (!C.busy && C.result !== undefined) { const n = C.result; px(172, 124, 40, 30, n === 0 ? '#2fae4f' : REDS.has(n) ? P.red : P.ink); text(String(n), 180, 132, '#ffffff', 2); }
    foot('LEFT/RIGHT PICK  GAS SPIN  DRIFT BACK');
  } else if (C.screen === 'highlow') {
    felt(40, 50, 256, 118);
    if (C.card) drawCardAt(C.card, 156, 80, false);
    if (C.phase === 'guess') { text('POT $' + C.pot, 70, 90, P.sun, 2); text('STREAK ' + C.streak + '/6', 70, 112, P.cream); text('HIGHER?', 196, 84, P.teal); text('LOWER?', 196, 112, P.pink); }
    foot(C.phase === 'guess' ? 'UP HIGHER  DOWN LOWER  FIRE CASH OUT' : 'LEFT/RIGHT BET  GAS DEAL  DRIFT BACK');
  } else if (C.screen === 'wheel') {
    const cx = SW / 2, cy = 112, R = 58, n = FORTUNA.length, cols = [P.pink, P.teal, P.sun, P.violet];
    for (let i = 0; i < n; i++) { const a0 = C.angle + i / n * Math.PI * 2 - Math.PI / 2 - Math.PI / n; ctx.fillStyle = FORTUNA[i] === 0 ? '#2a2430' : cols[i % 4]; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a0 + Math.PI * 2 / n); ctx.closePath(); ctx.fill();
      const am = a0 + Math.PI / n, lbl = FORTUNA[i] + 'X'; text(lbl, cx + Math.cos(am) * (R - 16) - tw(lbl) / 2, cy + Math.sin(am) * (R - 16) - 3, FORTUNA[i] === 0 ? P.blush : P.ink); }
    px(cx - 4, cy - 4, 8, 8, P.cream); px(cx - 3, cy - R - 8, 7, 10, '#ffffff'); px(cx - 1, cy - R + 2, 3, 3, '#ffffff');
    foot('LEFT/RIGHT BET  GAS SPIN  DRIFT BACK');
  } else if (C.screen === 'scratch') {
    px(78, 50, 180, 118, '#fff1a8'); px(78, 50, 180, 3, P.pink); ctext('RAD SCRATCH', 58, P.pink, 2); ctext('MATCH 3. WIN THAT X YOUR BET', 76, P.ink);
    for (let i = 0; i < 6; i++) { const x = 92 + (i % 3) * 52, y = 92 + ((i / 3) | 0) * 34; px(x, y, 46, 28, P.cream);
      if (!C.boxes || i >= C.shown) { px(x, y, 46, 28, '#b9b2c2'); for (let k = 0; k < 6; k++) px(x + 3 + k * 7, y + 4 + (k % 2) * 10, 5, 2, '#d8d2de'); }
      else { const l = C.boxes[i] + 'X'; text(l, x + 23 - tw(l, 2) / 2, y + 7, P.violet, 2); } }
    foot(C.phase === 'scratch' ? 'GAS SCRATCH' : 'LEFT/RIGHT PRICE  GAS BUY A TICKET  DRIFT BACK');
  }
}

/* ================= people on the street ================= */
const PED_LOOKS = 12;
const pedSprites = i => personSprites('ped' + i, SHIRTS[i % SHIRTS.length], ['#3a3a44', '#3a5a9a', '#e9d6f0', '#2a2430'][i % 4], SKINS[(i * 7) % 4], HAIRS[(i * 5) % 6]);
const PED_PANIC = ['HEY!', 'BOGUS!', 'GAG ME!', 'AS IF!', 'NOT COOL!', 'MY PERM!', 'RADICAL... NOT!', 'WHOA!'];
const PED_CHAT = ['TOTALLY TUBULAR', 'WHERE IS THE BEEF?', 'NICE RIDE', 'GNARLY', 'BE KIND, REWIND', 'NEW KOLA IS BACK!', 'SEEN MY WALKMAN?', 'I LOVE THIS TAPE', 'MALL CLOSES AT 9', 'FEEL THE BURN'];
const pedWalkable = t => t === WALK || t === PLAZA || t === PATH || t === SAND;
function spawnPed() {
  for (let k = 0; k < 200; k++) {
    const a = Math.random() * Math.PI * 2, r = 180 + Math.random() * 160, x = S.x + Math.cos(a) * r, y = S.y + Math.sin(a) * r, tx = Math.floor(x / T), ty = Math.floor(y / T);
    if (!pedWalkable(at(tx, ty)) || blocked[ty * MW + tx]) continue;
    return { x: tx * T + 8, y: ty * T + 8, a: pick([0, Math.PI / 2, Math.PI, -Math.PI / 2]), look: (Math.random() * PED_LOOKS) | 0, step: 0, state: 'walk', t: 0, say: null, sayT: 0, ride: Math.random() < .2 ? pick(['board', 'skates']) : null };
  }
  return null;
}
function pedSay(p, list) { p.say = pick(list); p.sayT = 70; }
function updatePeds() {
  while (S.peds.length < 34) { const p = spawnPed(); if (!p) break; S.peds.push(p); }
  const fast = !S.onFoot && Math.hypot(S.v, S.side) > 2;
  for (const p of S.peds) {
    if (p.sayT) p.sayT--;
    const d = Math.hypot(p.x - S.x, p.y - S.y);
    if (p.state === 'dive') { p.x += p.vx; p.y += p.vy; p.vx *= .88; p.vy *= .88; if (--p.t <= 0) { p.state = 'flee'; p.t = 60; } continue; }
    if (fast && d < 26 && !S.air) {   // leap out of the way
      const k = Math.atan2(p.y - S.y, p.x - S.x); p.vx = Math.cos(k) * 3; p.vy = Math.sin(k) * 3; p.state = 'dive'; p.t = 18; pedSay(p, PED_PANIC); continue;
    }
    if (S.lastShot && frame - S.lastShot.t < 30 && Math.hypot(p.x - S.lastShot.x, p.y - S.lastShot.y) < 150 && p.state !== 'flee') { p.state = 'flee'; p.t = 120; if (Math.random() < .4) pedSay(p, PED_PANIC); }
    let sp = p.ride ? 1.25 : .45;
    if (p.state === 'flee') { sp = 1.7; p.a = Math.atan2(p.y - S.y, p.x - S.x) + Math.sin(frame / 9 + p.look) * .5; if (--p.t <= 0) { p.state = 'walk'; p.a = pick([0, Math.PI / 2, Math.PI, -Math.PI / 2]); } }
    const nx = p.x + Math.cos(p.a) * sp, ny = p.y + Math.sin(p.a) * sp, ahead = tileAtPx(nx + Math.cos(p.a) * 6, ny + Math.sin(p.a) * 6);
    if ((p.state === 'walk' && !pedWalkable(ahead)) || blockedAt(nx, ny, 3) || isWater(ahead)) {
      if (p.state === 'walk') { const opts = [0, Math.PI / 2, Math.PI, -Math.PI / 2].filter(a => pedWalkable(tileAtPx(p.x + Math.cos(a) * 14, p.y + Math.sin(a) * 14)) && !blockedAt(p.x + Math.cos(a) * 8, p.y + Math.sin(a) * 8, 3)); p.a = opts.length ? pick(opts) : p.a + Math.PI; }
      else p.a += 1.2;
    } else { p.x = nx; p.y = ny; p.step++; }
    if (p.state === 'walk' && d < 40 && !p.sayT && Math.random() < .004) pedSay(p, PED_CHAT);
  }
  S.peds = S.peds.filter(p => Math.hypot(p.x - S.x, p.y - S.y) < 460);
}
function drawPeds() {
  for (const p of S.peds) {
    const x = p.x - camX, y = p.y - camY; if (x < -12 || y < -12 || x > SW + 12 || y > SH + 12) continue;
    if (p.ride && p.state !== 'dive') {   // 15. skateboards and roller skates
      const ca = Math.cos(p.a), sa = Math.sin(p.a);
      if (p.ride === 'board') { for (let i = -5; i <= 5; i += 2) px(x + ca * i - 1, y + sa * i - 1, 3, 3, i === -5 || i === 5 ? '#2a2430' : P.sun); }
      else for (const s of [-2, 2]) { px(x - sa * s + ca * 3 - 1, y + ca * s + sa * 3 - 1, 2, 2, P.pink); px(x - sa * s - ca * 3 - 1, y + ca * s - sa * 3 - 1, 2, 2, P.pink); }
      drawPerson(pedSprites(p.look), x, y, p.a, p.ride === 'board' ? 0 : p.step, false);
    } else drawPerson(pedSprites(p.look), x, y, p.a, p.step, p.state === 'dive');
  }
}
// signs and speech go on top of the buildings
function drawStreetLabels() {
  for (const p of S.peds) if (p.sayT) bubble(p.say, p.x - camX, p.y - camY - 12);
  for (const a of AEROBICS) {
    const x = a.x - camX, y = a.y - camY; if (x < -60 || y < -40 || x > SW + 60 || y > SH + 40) continue;
    px(x - 34, y - 26, 68, 11, '#fffaf2'); px(x - 34, y - 26, 68, 1, P.pink); text('NOT HOOKERS', x - 32, y - 24, P.pink); px(x - 1, y - 15, 2, 6, '#8a7a6a');
    if (Math.hypot(a.x - S.x, a.y - S.y) < 40) { const l = a.cool ? 'CLASS FULL' : 'DOOR: JAZZERCISE $20'; px(x - tw(l) / 2 - 3, y + 10, tw(l) + 6, 10, P.ink); text(l, x - tw(l) / 2, y + 12, blink(4) ? P.sun : P.cream); }
  }
}
function bubble(s, x, y) { const w = tw(s) + 6; px(x - w / 2, y - 9, w, 10, P.cream); px(x - 1, y + 1, 3, 2, P.cream); text(s, x - w / 2 + 3, y - 7, P.ink); }

/* ================= aerobics instructors (not hookers) ================= */
const AEROBICS = [];
const AERO_LINES = ['WE TEACH STEP CLASS. THAT IS ALL.', 'FEEL THE BURN!', 'LEG WARMERS ARE NOT A CRY FOR HELP', 'AND FIVE, SIX, SEVEN, EIGHT!', 'GRAPEVINE LEFT! GRAPEVINE RIGHT!', 'HYDRATE, BABE. WITH NEW KOLA.'];
function placeAerobics() {
  for (const bi of [4, 6, 8]) { const x0 = blockOrigin(bi), y = blockOrigin(5) + 8; if (at(x0 + 1, y) === WALK) AEROBICS.push({ x: (x0 + 1) * T + 8, y: y * T + 8, cool: 0, look: AEROBICS.length }); }
}
const aeroSprites = i => personSprites('aero' + i, [P.pink, P.teal, P.violet][i % 3], [P.teal, P.pink, P.sun][i % 3], SKINS[(i * 3 + 1) % 4], [P.sun, '#2b1a12', '#7a3b2e'][i % 3]);
function nearAerobics(r) { return AEROBICS.find(a => Math.hypot(a.x - S.x, a.y - S.y) < r); }
function jazzercise(a) {
  if (a.cool) { say('INSTRUCTOR: CLASS IS FULL. COME BACK LATER', 90); return; }
  if (S.cash < 20) { say('INSTRUCTOR: CLASS IS $20, SWEETIE', 90); return; }
  S.cash -= 20; S.hp = 100; if (!S.onFoot) S.carHp = Math.min(100, S.carHp + 40); a.cool = 60 * 30;
  flash('JAZZERCISE! HEALTH FULL', 100); say('INSTRUCTOR: ' + pick(AERO_LINES), 150); sfx('deliver'); puff(S.x, S.y, 16, pick([P.pink, P.teal, P.sun]), 3, 30, 3);
}
function drawAerobics() {
  for (const a of AEROBICS) {
    if (a.cool) a.cool--;
    const x = a.x - camX, y = a.y - camY; if (x < -60 || y < -40 || x > SW + 60 || y > SH + 40) continue;
    const hop = ((frame >> 3) & 1) * 2;
    drawPerson(aeroSprites(a.look), x, y - hop, Math.PI / 2, frame);
  }
}

/* ================= cassette tapes ================= */
const TAPES = [], TAPE_TOTAL = 24;
function placeTapes() {
  const ok = t => t === SAND || t === PATH || t === PLAZA || t === LOT || t === FAIRWAY || t === RUNWAY || t === WALK || t === PIER || t === BUNKER;
  for (let k = 0; k < 20000 && TAPES.length < TAPE_TOTAL; k++) {
    const x = (rnd() * MW) | 0, y = (rnd() * MH) | 0;
    if (!ok(at(x, y)) || blocked[y * MW + x] || TAPES.some(t => Math.hypot(t.x / T - x, t.y / T - y) < 15)) continue;
    TAPES.push({ x: x * T + 8, y: y * T + 8 });
  }
}
function updateTapes() {
  TAPES.forEach((t, i) => {
    if (S.tapes.includes(i) || Math.hypot(t.x - S.x, t.y - S.y) > 26 || S.air) return;
    S.tapes.push(i); S.cash += 50; sfx('tape'); const n = S.tapes.length;
    const unlocked = STATIONS.find(st => st.unlock === n);
    if (n === TAPE_TOTAL) { S.cash += 1000; flash('ALL 24 TAPES! +$1000', 180); }
    else if (unlocked) { flash('NEW STATION: ' + unlocked.name, 150); if (musicOn) { station = STATIONS.indexOf(unlocked); try { localStorage.setItem('palmcity8.station', station); } catch (e) {} } }
    else flash('TAPE ' + n + '/' + TAPE_TOTAL + ' +$50', 90);
    save();
  });
}
function drawTapes() {
  TAPES.forEach((t, i) => {
    if (S.tapes.includes(i)) return; const x = t.x - camX, y = t.y - camY - 3 - blink(3) * 2; if (x < -10 || y < -10 || x > SW + 10 || y > SH + 10) return;
    px(x - 5, y + 7, 10, 2, 'rgba(26,7,38,.3)'); px(x - 6, y - 4, 12, 8, '#2a2430'); px(x - 5, y - 3, 10, 3, P.pink); px(x - 4, y, 2, 2, P.cream); px(x + 2, y, 2, 2, P.cream);
    if (blink(4)) { px(x + 6, y - 7, 1, 3, '#ffffff'); px(x + 5, y - 6, 3, 1, '#ffffff'); }
  });
}

/* ================= things to knock over ================= */
const PROPS = [];
function placeProps() {
  for (let k = 0; k < 30000 && PROPS.length < 220; k++) {
    const x = (rnd() * MW) | 0, y = (rnd() * MH) | 0, t = at(x, y); if (blocked[y * MW + x]) continue;
    let kind = null;
    if (t === WALK && (isGridRoadT(x - 1, y) || isGridRoadT(x + 1, y) || isGridRoadT(x, y - 1) || isGridRoadT(x, y + 1))) kind = rnd() < .4 ? 'cone' : rnd() < .6 ? 'bin' : 'box';
    else if (t === SAND && !nearT(x, y, SEA)) kind = rnd() < .65 ? 'chair' : 'ball';
    else if (t === PLAZA || t === PATH) kind = 'bin';
    else if (t === LOT) kind = 'cone';
    if (!kind || PROPS.some(p => Math.abs(p.hx / T - x) < 2 && Math.abs(p.hy / T - y) < 2)) continue;
    const ox = (rnd() - .5) * 6, oy = (rnd() - .5) * 6;
    PROPS.push({ hx: x * T + 8 + ox, hy: y * T + 8 + oy, x: x * T + 8 + ox, y: y * T + 8 + oy, kind, fly: 0, vx: 0, vy: 0, z: 0, gone: 0, spin: 0 });
  }
}
function knock(o, vx, vy, byCar) {
  const ball = o.kind === 'ball';
  o.vx = vx * (ball ? 1.6 : 1.3) + (Math.random() - .5) * 2; o.vy = vy * (ball ? 1.6 : 1.3) + (Math.random() - .5) * 2; o.fly = ball ? 70 : 40; o.spin = 0;
  sfx(ball ? 'boing' : 'smash'); puff(o.x, o.y, ball ? 2 : 5, ball ? P.cream : o.kind === 'cone' ? '#ff7a2a' : '#8a8490', 2, 14, 2);
  if (ball || !byCar) return;
  if (S.rampage) S.rampage.n++;
  S.combo.n = S.combo.t > 0 ? S.combo.n + 1 : 1; S.combo.t = 120; const pay = 5 * S.combo.n; S.cash += pay;
  flash(S.combo.n > 1 ? 'SMASH X' + S.combo.n + ' +$' + pay : '+$5', 50);
  if (S.combo.n % 10 === 0) addHeat(1, 'VANDAL!');
}
function updateProps() {
  if (S.combo.t) S.combo.t--;
  const sp = Math.hypot(S.v, S.side), vx = Math.cos(S.a) * S.v - Math.sin(S.a) * S.side, vy = Math.sin(S.a) * S.v + Math.cos(S.a) * S.side;
  for (const o of PROPS) {
    if (Math.abs(o.hx - S.x) > 420 || Math.abs(o.hy - S.y) > 320) { if (o.gone && Math.abs(o.hx - S.x) > 420) { o.gone = 0; o.x = o.hx; o.y = o.hy; } continue; }
    if (o.gone) continue;
    if (o.fly) {
      o.x += o.vx; o.y += o.vy; o.vx *= .95; o.vy *= .95; o.spin++; o.fly--;
      o.z = o.kind === 'ball' ? Math.abs(Math.sin(o.fly / 9)) * o.fly * .2 : Math.sin(Math.PI * (40 - o.fly) / 40) * 12;
      if (solidAtPx(o.x, o.y)) { o.vx *= -.6; o.vy *= -.6; o.x += o.vx * 2; o.y += o.vy * 2; }
      if (!o.fly && o.kind !== 'ball') o.gone = 1;
      continue;
    }
    if (S.air || S.sink) continue;
    const d = Math.hypot(o.x - S.x, o.y - S.y);
    if (!S.onFoot && sp > .8 && d < 12) { knock(o, vx, vy, true); S.v *= .95; }
    else if (S.onFoot && o.kind === 'ball' && d < 8) { knock(o, Math.cos(S.fa) * 2.5, Math.sin(S.fa) * 2.5, false); }
  }
  for (const b of S.bullets) if (b.mine) for (const o of PROPS) if (!o.gone && !o.fly && Math.abs(o.x - b.x) < 6 && Math.abs(o.y - b.y) < 6) { knock(o, b.vx * .3, b.vy * .3, false); b.life = 0; }
}
function drawProps() {
  for (const o of PROPS) {
    if (o.gone) continue; const x = o.x - camX, y = o.y - camY - o.z; if (x < -10 || y < -20 || x > SW + 10 || y > SH + 10) continue;
    const flip = (o.spin >> 2) & 1;
    px(o.x - camX - 4, o.y - camY + 3, 8, 2, 'rgba(26,7,38,.25)');
    if (o.kind === 'cone') { if (flip) { px(x - 4, y - 1, 8, 3, '#ff7a2a'); px(x - 1, y - 1, 2, 3, P.white); } else { px(x - 3, y + 1, 7, 2, '#ff7a2a'); px(x - 2, y - 3, 4, 4, '#ff7a2a'); px(x - 2, y - 2, 4, 1, P.white); px(x - 1, y - 5, 2, 2, '#ff7a2a'); } }
    else if (o.kind === 'bin') { px(x - 3, y - 4, 7, 8, '#3f6f5a'); px(x - 4, y - 5, 9, 2, '#5a8f7a'); if (!flip) px(x - 1, y - 2, 1, 5, '#2f5a48'); }
    else if (o.kind === 'box') { px(x - 3, y - 4, 7, 8, '#3a7aff'); px(x - 2, y - 3, 5, 3, P.cream); px(x - 2, y + 1, 5, 1, '#2a5acc'); }
    else if (o.kind === 'chair') { for (let i = 0; i < 4; i++) px(x - 3, y - 5 + i * 2 + flip, 7, 2, i & 1 ? P.cream : P.pink); }
    else { px(x - 3, y - 3, 6, 6, P.cream); px(x - 3, y - 3, 3, 3, P.red); px(x, y, 3, 3, '#3a7aff'); px(x - 2, y - 2, 1, 1, '#ffffff'); }
  }
}

/* ================= saving ================= */
const SAVE_KEY = 'palmcity8.save';
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ cash: S.cash, tapes: S.tapes, stunts: S.stunts, bossBeaten: S.bossBeaten || 0, traps: S.traps || {} })); } catch (e) {} }
function loadSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || null; } catch (e) { return null; } }
function buildExtras() { placeAerobics(); placeTapes(); placeProps(); }

/* ================= boss: TIKTOK STREAMERDUDE at Stream House ================= */
// a made-up streamer: lime tracksuit, backwards pink cap, big shades, phone on a selfie stick
let STREAM = null;
function setupStreamHouse() {
  const z = ZONES.find(q => q.kind === 'mansion'), r = zoneRect(z), cx = Math.round((r.x0 + r.x1) / 2);
  STREAM = { gate: { x: (cx + 4) * T + 8, y: r.y1 * T + 8 }, arena: { x0: (r.x0 + 1) * T, y0: (r.y0 + 1) * T, x1: r.x1 * T, y1: (r.y1 - 1) * T } };
}
function bossPicture(f) {
  return makeSprite(16, 16, () => {
    const l = [-2, 0, 2, 0][f];
    px(6 + l, 2, 4, 3, '#2a2430'); px(6 - l, 11, 4, 3, '#2a2430');          // shoes
    px(3, 2, 8, 12, '#3aff7a'); px(3, 2, 8, 1, '#a8ffc8'); px(3, 7, 8, 2, '#1fbf5a');   // tracksuit with stripe
    px(6, 4, 6, 8, '#f2c9a0');                                              // head
    px(4, 4, 4, 8, P.pink); px(3, 5, 2, 6, P.pink);                         // cap, backwards
    px(10, 4, 2, 8, '#141018'); px(9, 5, 1, 2, '#141018'); px(9, 9, 1, 2, '#141018');   // shades
    px(11, 12, 5, 1, '#c8c2cc'); px(14, 13, 2, 3, '#141018'); px(14, 13, 1, 1, P.teal);   // selfie stick and phone
  });
}
const bossSprites = () => [0, 1, 2, 3].map(f => sprite('boss' + f, () => bossPicture(f)));
const modSprites = () => personSprites('mod', P.violet, '#2a2430', '#d9a877', '#1a1a1a');
const BOSS_LINES = ['YO CHAT, SMASH THAT LIKE BUTTON', 'THIS IS CONTENT', 'DO NOT FORGET TO SUBSCRIBE', 'MODS, GET THIS GUY', 'I AM NOT MAD. I AM LIVE', 'RING LIGHT, ACTIVATE', 'CHAT, IS THIS REAL?', 'CLIP THAT', 'WORLD RECORD STREAM, BABY'];
const CHAT = ['RATIO', 'NPC', 'W', 'L', 'FIRST!', 'LOL', 'CAP', 'MID', 'POG', 'SUS', 'GG?'];
// somewhere on the lawn that is not the house, a palm or the pool
function lawnSpot() { const A = STREAM.arena; for (let k = 0; k < 300; k++) { const x = A.x0 + 16 + Math.random() * (A.x1 - A.x0 - 32), y = A.y0 + 16 + Math.random() * (A.y1 - A.y0 - 32); if (!blockedAt(x, y, 8) && !isWater(tileAtPx(x, y))) return { x, y }; } return { x: STREAM.gate.x, y: STREAM.gate.y - 40 }; }
function startBoss() {
  const A = STREAM.arena, at0 = lawnSpot();
  S.boss = { x: at0.x, y: at0.y, a: Math.PI / 2, hp: 60, max: 60, t: 0, tx: 0, ty: 0, step: 0, cool: 0, dash: 0, viewers: 1200, called: false, flash: 0 };
  S.goons = [];
  say('STREAMERDUDE: YO CHAT! SOME RANDO IS AT THE HOUSE', 170); flash('BOSS: TIKTOK STREAMERDUDE', 120); sfx('go');
}
function bossShoot(x, y, a, kind) {
  if (kind === 'phone') S.bullets.push({ x, y, vx: Math.cos(a) * 3.2, vy: Math.sin(a) * 3.2, life: 90, dmg: 5, phone: true });
  else S.bullets.push({ x, y, vx: Math.cos(a) * 2.3, vy: Math.sin(a) * 2.3, life: 120, dmg: 3, word: pick(CHAT) });
}
function updateBoss() {
  const B = S.boss;
  if (!B) {
    if (!S.down && !S.air && Math.hypot(STREAM.gate.x - S.x, STREAM.gate.y - S.y) < 22) startBoss();
    return;
  }
  const A = STREAM.arena, d = Math.hypot(S.x - B.x, S.y - B.y);
  if (d > 520) { S.boss = null; S.goons = []; flash('STREAM PAUSED', 80); return; }
  B.t++; B.viewers += 3 + (B.max - B.hp) * .4; if (B.cool) B.cool--; if (B.flash) B.flash--;
  const toYou = Math.atan2(S.y - B.y, S.x - B.x), phase = B.hp > B.max * .5 ? 1 : B.hp > B.max * .25 ? 2 : 3;
  // move: wander the lawn, or dash at you in the last phase
  if (B.dash > 0) { B.dash--; B.x += Math.cos(B.a) * 4.2; B.y += Math.sin(B.a) * 4.2; B.step += 2; if (frame % 2 === 0) puff(B.x, B.y, 2, '#ffffff', 1.5, 14, 2); }
  else {
    if (B.t % 90 === 1 || Math.hypot(B.tx - B.x, B.ty - B.y) < 6) { const q = lawnSpot(); B.tx = q.x; B.ty = q.y; }
    const k = Math.atan2(B.ty - B.y, B.tx - B.x), sp = phase === 3 ? 1.8 : 1.3, nx = B.x + Math.cos(k) * sp, ny = B.y + Math.sin(k) * sp; B.a = k;
    if (!blockedAt(nx, ny, 6)) { B.x = nx; B.y = ny; B.step++; } else { const q = lawnSpot(); B.tx = q.x; B.ty = q.y; }
  }
  B.x = clamp(B.x, A.x0 + 8, A.x1 - 8); B.y = clamp(B.y, A.y0 + 8, A.y1 - 8);
  if (blockedAt(B.x, B.y, 4)) { const q = lawnSpot(); B.x = q.x; B.y = q.y; B.dash = 0; }
  // attacks
  if (B.t % (phase === 1 ? 80 : 64) === 0) { for (const s of [-.3, 0, .3]) bossShoot(B.x, B.y, toYou + s, 'phone'); sfx('laser'); }
  if (B.t % 46 === 23) bossShoot(B.x, B.y, toYou + (Math.random() - .5) * .3, 'word');
  if (B.t % 300 === 150) say('STREAMERDUDE: ' + pick(BOSS_LINES), 120);
  if (phase >= 2 && !B.called) { B.called = true; say('STREAMERDUDE: MODS! MODS!', 120); for (let i = 0; i < 4; i++) S.goons.push({ x: B.x + Math.cos(i * 1.6) * 30, y: B.y + Math.sin(i * 1.6) * 30, a: 0, hp: 4, step: 0, cool: 40 + i * 20 }); }
  if (phase === 3 && B.t % 220 === 0) { B.flash = 24; B.dash = 34; B.a = toYou; sfx('boost'); say('STREAMERDUDE: RING LIGHT, ACTIVATE', 90); }
  // contact
  if (d < (S.onFoot ? 12 : 20) && !B.cool && !S.down) {
    B.cool = 40;
    if (!S.onFoot && Math.hypot(S.v, S.side) > 1.8) { B.hp -= 4; B.viewers += 300; flash('RAMMED! -4', 40); sfx('crash'); B.x -= Math.cos(toYou) * 18; B.y -= Math.sin(toYou) * 18; hurt(3); }
    else hurt(B.dash ? 18 : 8);
  }
  // mods
  for (const m of S.goons) {
    if (m.dead) continue;
    const md = Math.hypot(S.x - m.x, S.y - m.y), ma = Math.atan2(S.y - m.y, S.x - m.x); m.a = ma;
    const sp = md > 90 ? 1.1 : md < 60 ? -.8 : 0, nx = m.x + Math.cos(ma) * sp, ny = m.y + Math.sin(ma) * sp;
    if (!walkBlocked(nx, ny)) { m.x = nx; m.y = ny; if (sp) m.step++; }
    if (--m.cool <= 0) { m.cool = 80; S.bullets.push({ x: m.x, y: m.y, vx: Math.cos(ma) * 3.4, vy: Math.sin(ma) * 3.4, life: 70, dmg: 4 }); sfx('shot'); }
  }
  if (B.hp <= 0) bossDown();
}
function bossHit(b) {
  const B = S.boss; if (!B) return;
  if (Math.abs(B.x - b.x) < 9 && Math.abs(B.y - b.y) < 9) { B.hp -= b.dmg; B.viewers += 40; b.life = 0; puff(b.x, b.y, 4, '#3aff7a', 2, 12, 2); if (Math.random() < .08) say('STREAMERDUDE: ' + pick(['OW! CLIP THAT', 'CHAT, HE HIT ME', 'THAT IS A BAN']), 80); return; }
  for (const m of S.goons) if (!m.dead && Math.abs(m.x - b.x) < 6 && Math.abs(m.y - b.y) < 6) { m.hp -= b.dmg; b.life = 0; if (m.hp <= 0) { m.dead = true; puff(m.x, m.y, 10, P.violet, 3, 20, 3); flash('MOD BANNED', 40); } return; }
}
function bossDown() {
  const B = S.boss;
  for (let i = 0; i < 4; i++) puff(B.x, B.y, 20, pick([P.pink, P.teal, P.sun, '#3aff7a', '#ffffff']), 5, 50, 3);
  sfx('boom'); S.cash += 2500; S.bossBeaten = (S.bossBeaten || 0) + 1;
  flash('STREAM ENDED. GG +$2500', 200); say('STREAMERDUDE: CHAT... I THINK I NEED TO TOUCH GRASS', 200);
  S.boss = null; S.goons = []; save();
}
function drawBossPin() {
  if (S.boss) return;
  const x = STREAM.gate.x - camX, y = STREAM.gate.y - camY; if (x < -40 || y < -50 || x > SW + 40 || y > SH + 40) return;
  drawPin(x, y, P.red, 'live');
  px(x - 12, y - 46, 24, 10, P.red); text('LIVE', x - 11, y - 44, '#ffffff');
}
function drawBoss() {
  const B = S.boss;
  for (const m of S.goons) if (!m.dead) { const x = m.x - camX, y = m.y - camY; drawPerson(modSprites(), x, y, m.a, m.step); px(x - 7, y - 12, 14, 6, P.violet); text('MOD', x - 8, y - 12, '#ffffff'); }
  if (!B) return;
  const x = B.x - camX, y = B.y - camY;
  // the ring light floats behind him
  const rl = x - Math.cos(B.a) * 14, rt = y - Math.sin(B.a) * 14 - 10;
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; px(rl + Math.cos(a) * 7 - 1, rt + Math.sin(a) * 7 - 1, 3, 3, B.flash && blink(1) ? P.sun : '#ffffff'); }
  const sp = bossSprites()[(B.step >> 3) & 3], i = headingIndex(B.a), pic = sp.look[i], w = Math.round(pic.width * 1.5);
  g.drawImage(sp.shadow[i], Math.round(x - w / 2 + 2), Math.round(y - w / 2 + 3), w, w); g.drawImage(pic, Math.round(x - w / 2), Math.round(y - w / 2), w, w);
  if (B.flash) { g.fillStyle = 'rgba(255,255,255,' + (B.flash / 40) + ')'; g.fillRect(0, 21, SW, SH - 21); }
}
function drawBossBar() {
  const B = S.boss; if (!B) return;
  px(40, 24, SW - 80, 20, P.ink); px(40, 24, SW - 80, 1, P.red);
  text('TIKTOK STREAMERDUDE', 46, 27, '#3aff7a');
  const v = B.viewers >= 1000 ? (B.viewers / 1000).toFixed(1) + 'K' : String(Math.round(B.viewers)), l = 'VIEWERS ' + v;
  px(SW - 46 - tw(l) - 12, 27, 7, 7, blink(4) ? P.red : '#7a1020'); text(l, SW - 46 - tw(l), 27, P.cream);
  px(46, 37, SW - 92, 4, '#3a2a48'); px(46, 37, Math.max(0, (SW - 92) * B.hp / B.max), 4, '#3aff7a');
}
// extras added one at a time

/* ================= 2. day and night ================= */
const DAY = 60 * 60 * 6;   // six minutes from midnight to midnight
const dayHour = () => ((S.clock / DAY) + .7) % 1 * 24;   // a new game starts at about 4:48 PM
function nightLevel() { const h = dayHour(); if (h >= 7 && h <= 18) return 0; if (h > 18 && h < 20.5) return (h - 18) / 2.5; if (h >= 20.5 || h < 5) return 1; return 1 - (h - 5) / 2; }
function clockText() { const h = dayHour(), hh = Math.floor(h), mm = Math.floor((h - hh) * 6) * 10; return ((hh % 12) || 12) + ':' + String(mm).padStart(2, '0') + (hh < 12 ? ' AM' : ' PM'); }
const LIT = [];   // lit windows seen this frame, redrawn bright after the dark
function headlight(x, y, a, len, k) {
  const ca = Math.cos(a), sa = Math.sin(a), fx = x + ca * 10, fy = y + sa * 10;
  g.fillStyle = 'rgba(255,238,190,' + (.2 * k) + ')'; g.beginPath();
  g.moveTo(fx - sa * 5, fy + ca * 5); g.lineTo(fx + sa * 5, fy - ca * 5); g.lineTo(fx + ca * len + sa * 24, fy + sa * len - ca * 24); g.lineTo(fx + ca * len - sa * 24, fy + sa * len + ca * 24); g.closePath(); g.fill();
}
function glow(x, y, r, rgb, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
function drawNight() {
  const n = nightLevel();
  // cop lights flash day and night
  g.globalCompositeOperation = 'lighter';
  for (const c of S.cops) if (!c.dead && !c.parked) { const x = c.x - camX, y = c.y - camY; if (x > -40 && y > -40 && x < SW + 40 && y < SH + 40) glow(x, y, 16 + n * 12, blink(2) ? '255,40,80' : '60,120,255', .3 + .3 * n); }
  g.globalCompositeOperation = 'source-over';
  if (n <= 0) { LIT.length = 0; return; }
  const warm = Math.min(1, n * 2), deep = Math.max(0, n * 2 - 1);
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = 'rgb(' + Math.round(255 - 40 * warm - 150 * deep) + ',' + Math.round(255 - 90 * warm - 100 * deep) + ',' + Math.round(255 - 120 * warm - 10 * deep) + ')';
  g.fillRect(0, 21, SW, SH - 21);
  g.globalCompositeOperation = 'lighter';
  for (const l of LAMPS) { const x = l.x - camX, y = l.y - camY; if (x > -40 && y > -40 && x < SW + 40 && y < SH + 40) glow(x + 4, y + 4, 30, '255,200,130', .32 * n); }
  if (!S.onFoot && !S.sink) headlight(S.x - camX, S.y - camY, S.a, 80, n);
  for (const c of S.traffic) { const x = c.x - camX, y = c.y - camY; if (!c.wreck && x > -60 && y > -60 && x < SW + 60 && y < SH + 60) headlight(x, y, Math.atan2(c.dy, c.dx), 56, n * .8); }
  for (const b of BUILDINGS) if (b.sign) { const t = proj((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, b.h), x = t[0], y = t[1]; if (x > -60 && y > -60 && x < SW + 60 && y < SH + 60) glow(x, y, 44, b.style === 'casino' ? '255,211,107' : '255,62,165', .4 * n); }
  if (casinoDoor) glow(casinoDoor.x - camX, casinoDoor.y - camY - 6, 34, '255,60,90', .35 * n);
  g.globalCompositeOperation = 'source-over';
  for (const w of LIT) { g.fillStyle = w[4]; g.fillRect(w[0], w[1], w[2], w[3]); }
  LIT.length = 0;
}

/* ================= 3. engine and tyres ================= */
let engine = null;
function engineInit() {
  if (!AC || engine) return;
  if (!NB) NB = noiseBuf();
  const o = AC.createOscillator(), o2 = AC.createOscillator(), lp = AC.createBiquadFilter(), gn = AC.createGain();
  o.type = 'sawtooth'; o2.type = 'square'; lp.type = 'lowpass'; lp.frequency.value = 400; gn.gain.value = 0;
  o.connect(lp); o2.connect(lp); lp.connect(gn); gn.connect(master); o.start(); o2.start();
  const sq = AC.createBufferSource(), bp = AC.createBiquadFilter(), sg = AC.createGain(); sq.buffer = NB; sq.loop = true; bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 3; sg.gain.value = 0;
  sq.connect(bp); bp.connect(sg); sg.connect(master); sq.start();
  const so = AC.createOscillator(), slp = AC.createBiquadFilter(), sgn = AC.createGain(); so.type = 'square'; slp.type = 'lowpass'; slp.frequency.value = 1800; sgn.gain.value = 0;
  so.connect(slp); slp.connect(sgn); sgn.connect(master); so.start();
  engine = { o, o2, lp, gn, sg, so, sgn };
}
function updateEngineSound() {
  if (!AC || AC.state !== 'running') return;
  engineInit();
  const t = AC.currentTime, driving = mode === 'play' && S && !S.onFoot && !S.sink && !S.down;
  const sp = driving ? Math.hypot(S.v, S.side) + (S.air ? 1.5 : 0) + (S.boost ? 1 : 0) : 0;
  engine.o.frequency.setTargetAtTime(38 + sp * 26, t, .05); engine.o2.frequency.setTargetAtTime(19 + sp * 13, t, .05); engine.lp.frequency.setTargetAtTime(280 + sp * 170, t, .05);
  engine.gn.gain.setTargetAtTime(driving ? .028 + sp * .008 : 0, t, .08);
  const braking = driving && keys.down && S.v > 2;
  const slip = driving && !S.air && (S.drift || braking) ? Math.min(1, Math.abs(S.side) / 2 + (braking ? .5 : 0)) : 0;
  engine.sg.gain.setTargetAtTime(slip * .08, t, .03);
  // siren: a wail that gets louder as the nearest cop car closes in
  let near = 1e9; if (mode === 'play' && S) for (const c of S.cops) if (!c.dead && !c.parked) near = Math.min(near, Math.hypot(c.x - S.x, c.y - S.y));
  const loud = near < 420 ? (1 - near / 420) : 0;
  engine.so.frequency.setTargetAtTime(700 + 320 * Math.sin(frame / 14), t, .02); engine.sgn.gain.setTargetAtTime(loud * .03, t, .1);
}

/* ================= 4. pause menu: stats and controls ================= */
function drawPauseMenu() {
  px(0, 21, SW, SH - 21, 'rgba(20,6,30,.9)');
  ctext('PAUSED', 28, P.teal, 3, P.purp);
  const L = 18, R = 182, top = 58;
  text('YOUR RUN', L, top, P.pink); px(L, top + 9, 140, 1, P.pink);
  const rows = [['CASH', '$' + S.cash], ['TAPES', S.tapes.length + '/' + TAPE_TOTAL], ['STUNTS', S.stunts.length + '/' + STUNT_IDS.size], ['DELIVERIES', S.delivered], ['TAXI FARES', S.fares], ['RACES WON', S.races], ['GAMBLED', '$' + (S.gambled || 0)], ['STREAMERDUDE', S.bossBeaten ? 'BEATEN X' + S.bossBeaten : 'NOT YET'], ['TOP SPEED', Math.max(0, ...Object.values(S.traps || {})) + ' KM/H']];
  rows.forEach(([k, v], i) => { text(k, L, top + 16 + i * 12, P.cream); const s = String(v); text(s, L + 140 - tw(s), top + 16 + i * 12, P.sun); });
  text('BUTTONS', R, top, P.teal); px(R, top + 9, 136, 1, P.teal);
  const keysHelp = [['STICK', 'DRIVE OR WALK'], ['GAS', 'GO'], ['DRIFT', 'HOLD IN A TURN'], ['FIRE', 'SHOOT'], ['DOOR', 'IN, OUT, CALL CAR'], ['RADIO', 'NEXT STATION'], ['MAP', 'WAYPOINT, CAB'], ['FULL', 'FULL SCREEN']];
  keysHelp.forEach(([k, v], i) => { text(k, R, top + 16 + i * 12, P.pink); text(v, R + 136 - tw(v), top + 16 + i * 12, P.cream); });
  if (blink(5)) ctext('PAUSE TO GO ON', SH - 16, P.blush);
}

/* ================= 5. title menu ================= */
const TITLE = { sel: 0, howto: false, erase: 0, held: null, holdT: 0 };
const titleItems = () => loadSave() ? ['CONTINUE', 'NEW GAME', 'HOW TO PLAY'] : ['START', 'HOW TO PLAY'];
const HOWTO = [
  'STICK: POINT WHERE YOU WANT TO GO.',
  'PUSH IT FURTHER TO GO FASTER. PULL BACK TO BRAKE.',
  'HOLD DRIFT IN A TURN. LET GO FOR A BOOST.',
  'PINK PIN: DELIVERY. TEAL: TAXI. GOLD: RACE.',
  'DOOR: GET IN, GET OUT, OR TAKE ANY CAR.',
  'FIRE SHOOTS. COPS NOTICE.',
  'PAINT N SPRAY MAKES THEM FORGET.',
  'MAP: SET A WAYPOINT, OR DOOR FOR A CAB.',
  '24 TAPES ARE HIDDEN. 6 AND 14 UNLOCK STATIONS.',
  'STREAMERDUDE IS LIVE AT STREAM HOUSE.'
];
function titlePress(k) {
  const items = titleItems();
  if (TITLE.howto) { if (['b', 'a', 'door', 'start', 'fire'].includes(k)) { TITLE.howto = false; sfx('count'); } return; }
  if (k === 'up' || k === 'left') { TITLE.sel = (TITLE.sel + items.length - 1) % items.length; TITLE.erase = 0; sfx('count'); return; }
  if (k === 'down' || k === 'right') { TITLE.sel = (TITLE.sel + 1) % items.length; TITLE.erase = 0; sfx('count'); return; }
  if (!['a', 'door', 'start', 'fire'].includes(k)) return;
  const it = items[TITLE.sel] || items[0];
  if (it === 'HOW TO PLAY') { TITLE.howto = true; sfx('pickup'); }
  else if (it === 'NEW GAME') { if (TITLE.erase) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} TITLE.erase = 0; TITLE.sel = 0; startGame(); } else { TITLE.erase = 1; sfx('late'); } }
  else startGame();
}
// the stick works like a d-pad on menus
function stickNav(state, onPress) {
  let dir = null;
  if (stick.mag > .55) dir = Math.abs(stick.x) > Math.abs(stick.y) ? (stick.x > 0 ? 'right' : 'left') : (stick.y > 0 ? 'down' : 'up');
  if (dir && dir !== state.held) { onPress(dir); state.holdT = 0; } else if (dir && ++state.holdT > 18) { onPress(dir); state.holdT = 10; }
  state.held = dir;
}
function drawTitleMenu() {
  const items = titleItems();
  if (TITLE.howto) {
    px(0, 0, SW, SH, 'rgba(20,6,30,.94)'); ctext('HOW TO PLAY', 10, P.pink, 2);
    HOWTO.forEach((l, i) => text(l, 10, 36 + i * 17, i % 2 ? P.cream : P.sun));
    if (blink(5)) ctext('PRESS GAS TO GO BACK', SH - 14, P.blush); return;
  }
  const y = 184, w = items.map(s => tw(s) + 16), total = w.reduce((a, b) => a + b, 0) + (items.length - 1) * 8; let x = (SW - total) / 2;
  items.forEach((s, i) => { const on = i === TITLE.sel; px(x, y - 4, w[i], 15, on ? P.pink : 'rgba(26,7,38,.8)'); text(s, x + 8, y, on ? P.ink : P.cream); x += w[i] + 8; });
  if (TITLE.erase) ctext('PRESS AGAIN TO ERASE YOUR SAVE', 172, P.red); else if (blink(5)) ctext('STICK PICKS  GAS GOES', 172, P.cream);
}

/* ================= 6. tips, once each ================= */
const seenTips = (() => { try { return new Set(JSON.parse(localStorage.getItem('palmcity8.tips')) || []); } catch (e) { return new Set(); } })();
function tip(id, line) {
  if (seenTips.has(id) || (S.tip && S.tip.t > 60)) return;
  seenTips.add(id); S.tip = { text: line, t: 300 };
  try { localStorage.setItem('palmcity8.tips', JSON.stringify([...seenTips])); } catch (e) {}
}
function updateTips() {
  if (S.tip && !--S.tip.t) S.tip = null;
  const age = S.clock || 0;
  if (age > 30) tip('steer', 'PUSH THE STICK WHERE YOU WANT TO GO');
  if (age > 60 * 9) tip('pins', 'DRIVE INTO A PIN TO START A JOB');
  if (!S.onFoot && S.v > 3) tip('drift', 'HOLD DRIFT IN A TURN, THEN LET GO');
  if (S.heat > 0) tip('heat', 'LOSE THE HEAT AT A PAINT N SPRAY');
  if (S.onFoot) tip('foot', 'DOOR NEXT TO ANY CAR TAKES IT');
  if (S.hp < 45) tip('heal', 'NEW KOLA CANS AND JAZZERCISE HEAL YOU');
  if (TAPES.some((t, i) => !S.tapes.includes(i) && Math.hypot(t.x - S.x, t.y - S.y) < 220)) tip('tapes', 'PURPLE BLIPS ON THE RADAR ARE TAPES');
  if (S.cash >= 300) tip('casino', 'FEELING LUCKY? THE CASINO IS ON THE STRIP');
}
function drawTip() {
  if (!S.tip) return;
  const l = 'TIP: ' + S.tip.text, w = tw(l) + 12, x = (SW - w) / 2, y = 64;
  px(x, y, w, 14, 'rgba(26,7,38,.9)'); px(x, y, 2, 14, P.sun); text(l, x + 7, y + 4, S.tip.t < 40 && blink(2) ? P.blush : P.sun);
}

/* ================= 7. each car handles its own way ================= */
const CAR_STATS = {
  player: { name: 'PALM 6 TURBO', top: 3.9, acc: .105, turn: .064 },
  cop: { name: 'SQUAD CAR', top: 4, acc: .1, turn: .06 },
  sports: { name: 'SPORTSTER', top: 4.1, acc: .11, turn: .066 },
  sedan: { name: 'SEDAN', top: 3.4, acc: .088, turn: .06 },
  taxi: { name: 'PALM CAB', top: 3.5, acc: .09, turn: .06 },
  van: { name: 'SURF VAN', top: 3, acc: .072, turn: .052 }
};
const LOOK_NAMES = ['GRANDPA SEDAN', 'BLUE SEDAN', 'PALM CAB', 'SURF VAN', 'RED SEDAN', 'SPORTSTER', 'PURPLE SEDAN', 'PEACH VAN', 'BLACK SEDAN'];
function rideStats() {
  if (S.rideLook === -1) return CAR_STATS.player;
  if (S.rideLook === 'cop') return CAR_STATS.cop;
  return CAR_STATS[TRAFFIC_LOOKS[S.rideLook][0]];
}
function rideName() { return S.rideLook === -1 ? CAR_STATS.player.name : S.rideLook === 'cop' ? 'SQUAD CAR' : LOOK_NAMES[S.rideLook]; }
function carBanner() { S.carBanner = { name: rideName(), t: 170 }; }
function drawCarBanner() {
  const B = S.carBanner; if (!B || S.onFoot || S.flashT) return; if (!--B.t) { S.carBanner = null; return; }
  const y = SH - 72, st = musicOn ? 'RADIO: ' + radioName() : 'RADIO OFF';
  text(B.name, SW - 8 - tw(B.name, 2) + 1, y + 1, P.ink, 2); text(B.name, SW - 8 - tw(B.name, 2), y, B.t < 30 && blink(2) ? P.blush : P.cream, 2);
  text(st, SW - 8 - tw(st), y + 17, P.teal);
}

/* ================= 9. wanted stars ================= */
const STAR = [4, 4, 31, 14, 14, 27, 17];   // a 5x7 star, one row of bits per line
function drawStar(x, y, on, k) {
  STAR.forEach((row, r) => { for (let b = 0; b < 5; b++) if (row & (16 >> b)) px(x + b * k, y + r * k, k, k, on); });
}
function drawWanted() {
  const chased = S.maids.length || S.cops.some(c => !c.dead && !c.parked);
  if (S.heat > (S.lastHeat || 0)) S.heatPulse = 40;
  if (S.lastHeat > 0 && S.heat === 0 && !S.down) { const pay = 25 * S.peakHeat; S.cash += pay; flash('ESCAPED! +$' + pay, 120); sfx('deliver'); S.peakHeat = 0; }
  S.peakHeat = Math.max(S.peakHeat || 0, S.heat); S.lastHeat = S.heat;
  if (S.heatPulse) S.heatPulse--;
  for (let i = 0; i < 5; i++) {
    const on = i < S.heat, x = SW - 6 - (5 - i) * 13, big = on && S.heatPulse && i === S.heat - 1;
    const col = on ? (chased && blink(3) ? '#ffffff' : P.sun) : '#4b3a5a';
    drawStar(x + (big ? -2 : 0), 3 + (big ? -1 : 0), col, big ? 2 : 2);
  }
}

/* ================= 10. speed traps ================= */
const TRAPS = [];
function placeTraps() {
  const ringFrom = (x, y, dx, dy) => { while (inMap(x, y) && !ring[y * MW + x]) { x += dx; y += dy; } return { x: x * T + 8 + dx * T, y: y * T + 8 + dy * T }; };
  TRAPS.push({ ...ringFrom(IC.x, 0, 0, 1), name: 'NORTH SHORE' }, { ...ringFrom(IC.x, MH - 1, 0, -1), name: 'SOUTH BEACH' }, { ...ringFrom(0, IC.y, 1, 0), name: 'WEST COAST' }, { ...ringFrom(MW - 1, IC.y + 8, -1, 0), name: 'EAST END' });
  const z = zoneRect(ZONES.find(q => q.kind === 'drag')); TRAPS.push({ x: (z.x0 + 26) * T, y: (z.y0 + 4.5) * T, name: 'DRAG STRIP' });
  TRAPS.forEach((t, i) => t.id = i);
}
function updateTraps() {
  if (S.onFoot || S.air) return;
  S.traps = S.traps || {};
  for (const t of TRAPS) {
    if (t.cool) { t.cool--; continue; }
    if (Math.hypot(t.x - S.x, t.y - S.y) > 22) continue;
    const kmh = Math.round(Math.hypot(S.v, S.side) * 26); t.cool = 120;
    if (kmh < 60) continue;
    const best = S.traps[t.id] || 0; sfx('count');
    if (kmh > best) { const pay = Math.max(10, (kmh - Math.max(best, 60)) * 2); S.traps[t.id] = kmh; S.cash += pay; flash('SPEED TRAP ' + kmh + ' KM/H! +$' + pay, 120); save(); }
    else flash('SPEED TRAP ' + kmh + ' KM/H  BEST ' + best, 90);
  }
}
function drawTraps() {
  for (const t of TRAPS) {
    const x = t.x - camX, y = t.y - camY; if (x < -40 || y < -40 || x > SW + 40 || y > SH + 40) continue;
    for (let i = -20; i < 20; i += 4) { px(x + i, y - 1, 2, 2, (i >> 2) & 1 ? P.white : P.ink); px(x - 1, y + i, 2, 2, (i >> 2) & 1 ? P.white : P.ink); }
    const q = proj(t.x + 22, t.y - 22, 28), b = [t.x + 22 - camX, t.y - 22 - camY];
    g.fillStyle = '#5a5462'; g.fillRect(Math.round(b[0]), Math.round(Math.min(b[1], q[1])), 2, Math.max(2, Math.round(Math.abs(b[1] - q[1]))));
    px(q[0] - 4, q[1] - 3, 9, 6, '#2a2430'); px(q[0] - 3, q[1] - 2, 3, 3, blink(4) ? P.red : '#5a1020');
  }
}

/* ================= 11. boats, surfers and gulls ================= */
const BOATS = [], SURFERS = [], GULLS = [];
function placeSeaLife() {
  for (let k = 0; k < 4000 && BOATS.length < 10; k++) { const x = (rnd() * MW) | 0, y = (rnd() * MH) | 0, d = coastD(x, y); if (at(x, y) === SEA && d > 1.12 && d < 1.5) BOATS.push({ x: x * T + 8, y: y * T + 8, a: rnd() * Math.PI * 2, sail: [P.pink, P.teal, P.sun, P.white, P.violet][BOATS.length % 5] }); }
  for (let k = 0; k < 4000 && SURFERS.length < 12; k++) { const x = (rnd() * MW) | 0, y = (rnd() * MH) | 0; if (at(x, y) === SEA && coastD(x, y) < 1.06) SURFERS.push({ x: x * T + 8, y: y * T + 8, ph: rnd() * 6, board: [P.sun, P.pink, P.teal][SURFERS.length % 3] }); }
  for (let i = 0; i < 9; i++) GULLS.push({ ox: (rnd() - .5) * 300, oy: (rnd() - .5) * 220, r: 30 + rnd() * 50, ph: rnd() * 6, sp: .01 + rnd() * .015, z: 50 + rnd() * 30 });
}
function updateSeaLife() {
  for (const b of BOATS) {
    const nx = b.x + Math.cos(b.a) * .35, ny = b.y + Math.sin(b.a) * .35, tx = Math.floor((nx + Math.cos(b.a) * 20) / T), ty = Math.floor((ny + Math.sin(b.a) * 20) / T);
    if (at(tx, ty) !== SEA || coastD(tx, ty) < 1.08) b.a += .05; else { b.x = nx; b.y = ny; }
    if (frame % 12 === 0 && Math.abs(b.x - S.x) < 260 && Math.abs(b.y - S.y) < 200) puff(b.x - Math.cos(b.a) * 9, b.y - Math.sin(b.a) * 9, 1, 'rgba(232,251,255,.7)', .3, 40, 2);
  }
}
function drawSeaLife() {
  for (const b of BOATS) {
    const x = b.x - camX, y = b.y - camY; if (x < -30 || y < -30 || x > SW + 30 || y > SH + 30) continue;
    const ca = Math.cos(b.a), sa = Math.sin(b.a);
    for (let i = -8; i <= 8; i += 2) px(x + ca * i - 2, y + sa * i - 2, 4, 4, i > 5 ? '#d8d0c8' : '#f3eee6');
    g.fillStyle = b.sail; g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x + 9, y - 2); g.lineTo(x, y - 2); g.closePath(); g.fill();
    px(x, y - 18, 1, 17, '#5a4a3a');
  }
  for (const s of SURFERS) {
    const x = s.x - camX, y = s.y - camY + Math.sin(frame / 20 + s.ph) * 2; if (x < -20 || y < -20 || x > SW + 20 || y > SH + 20) continue;
    px(x - 6, y, 13, 3, s.board); px(x - 1, y - 4, 3, 4, '#2a2430'); px(x - 1, y - 6, 3, 2, '#d9a877');
    if (blink(4)) px(x + 7, y + 1, 3, 1, P.foam);
  }
}
function drawGulls() {
  for (const q of GULLS) {
    const a = frame * q.sp + q.ph, wx = S.cam.x + q.ox + Math.cos(a) * q.r, wy = S.cam.y + q.oy + Math.sin(a) * q.r * .6;
    const sx = wx - camX, sy = wy - camY;
    px(sx + q.z * .4 - 2, sy + q.z * .5, 4, 1, 'rgba(16,8,24,.25)');   // shadow on the ground
    const [x, y] = proj(wx, wy, q.z), up = (frame >> 3) & 1;
    px(x - 4, y - (up ? 2 : 0), 3, 1, '#ffffff'); px(x + 2, y - (up ? 2 : 0), 3, 1, '#ffffff'); px(x - 1, y, 3, 1, '#ffffff'); px(x, y + 1, 1, 1, '#c8c2cc');
  }
}

/* ================= 13. arrow to the target, with distance ================= */
function drawTargetArrow() {
  let aim = S.job && S.job.target, col = S.job ? JOB_COLOUR[S.job.kind] : null, faint = false;
  if (!aim) {   // no job: the nearest pin
    let bd = 1e9; for (const k of JOB_KINDS) { const m = S.markers[k]; if (m) { const d = Math.hypot(m.x - S.x, m.y - S.y); if (d < bd) { bd = d; aim = m; col = JOB_COLOUR[k]; } } }
    faint = true;
  }
  if (!aim) return;
  const sx = aim.x - camX, sy = aim.y - camY; if (sx > 10 && sy > 30 && sx < SW - 10 && sy < SH - 10) return;
  const ang = Math.atan2(aim.y - S.y, aim.x - S.x), ca = Math.cos(ang), sa = Math.sin(ang);
  // put the arrow on an oval inside the screen edge
  const ax = SW / 2 + ca * (SW / 2 - 26), ay = SH / 2 + 10 + sa * (SH / 2 - 34);
  g.globalAlpha = faint ? .55 : 1;
  const tri = (r, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(ax + ca * r * 1.3, ay + sa * r * 1.3); g.lineTo(ax - ca * r * .7 - sa * r, ay - sa * r * .7 + ca * r); g.lineTo(ax - ca * r * .3, ay - sa * r * .3); g.lineTo(ax - ca * r * .7 + sa * r, ay - sa * r * .7 - ca * r); g.closePath(); g.fill(); };
  tri(10, P.ink); tri(7 + blink(3), col);
  const m = Math.round(Math.hypot(aim.x - S.x, aim.y - S.y) / 4), l = m >= 1000 ? (m / 1000).toFixed(1) + ' KM' : m + ' M';
  const lx = clamp(ax - ca * 20 - tw(l) / 2, 2, SW - tw(l) - 2), ly = clamp(ay - sa * 18 - 3, 24, SH - 9);
  px(lx - 2, ly - 2, tw(l) + 4, 11, P.ink); text(l, lx, ly, col);
  g.globalAlpha = 1;
}

/* ================= 18. ATMs ================= */
const ATMS = [];
function placeAtms() {
  for (let k = 0; k < 20000 && ATMS.length < 10; k++) {
    const x = (rnd() * MW) | 0, y = (rnd() * MH) | 0;
    if (at(x, y) !== WALK || blocked[y * MW + x] || at(x, y - 1) !== BLD || ATMS.some(a => Math.hypot(a.x / T - x, a.y / T - y) < 18)) continue;
    ATMS.push({ x: x * T + 8, y: y * T + 4, hp: 3, broke: 0 });
  }
}
function bustAtm(a) {
  a.broke = 60 * 90; const pay = 60 + ((Math.random() * 12) | 0) * 10; S.cash += pay;
  for (let i = 0; i < 18; i++) S.parts.push({ x: a.x, y: a.y, vx: (Math.random() - .5) * 4, vy: Math.random() * 2 + .5, life: 40 + Math.random() * 30, col: i % 2 ? '#7adf8a' : '#3fae5a', size: 3 });
  sfx('boom'); addHeat(2, 'ATM BUSTED! +$' + pay);
}
function updateAtms() {
  for (const a of ATMS) {
    if (a.broke) { if (!--a.broke) a.hp = 3; continue; }
    for (const b of S.bullets) if (b.mine && Math.abs(b.x - a.x) < 7 && Math.abs(b.y - a.y) < 8) { b.life = 0; a.hp -= b.dmg; puff(a.x, a.y, 3, P.sun, 1.5, 10, 2); if (a.hp <= 0) bustAtm(a); }
    if (!a.broke && !S.onFoot && Math.hypot(S.v, S.side) > 2.2 && Math.hypot(a.x - S.x, a.y - S.y) < 14) { bustAtm(a); S.v *= .5; }
  }
}
function nearAtm() { return ATMS.find(a => !a.broke && Math.hypot(a.x - S.x, a.y - S.y) < 18); }
function drawAtms() {
  for (const a of ATMS) {
    const x = a.x - camX, y = a.y - camY; if (x < -20 || y < -30 || x > SW + 20 || y > SH + 20) continue;
    const top = proj(a.x, a.y, 14);
    g.fillStyle = a.broke ? '#3a3440' : '#5a6a8a'; g.fillRect(Math.round(x - 5), Math.round(Math.min(y, top[1])), 10, Math.max(6, Math.round(Math.abs(y - top[1])) + 4));
    px(top[0] - 5, top[1] - 1, 10, 4, a.broke ? '#2a2430' : '#8a9ab8');
    if (!a.broke) { px(x - 3, Math.min(y, top[1]) + 2, 6, 3, blink(4) ? '#7adf8a' : '#3fae5a'); }
    else if (frame % 8 === 0) puff(a.x, a.y - 6, 1, '#5a5462', .6, 30, 3, .5);
    if (!a.broke && S.onFoot && Math.hypot(a.x - S.x, a.y - S.y) < 30) { const l = 'ATM'; px(x - 9, y + 8, 18, 9, P.ink); text(l, x - 8, y + 9, '#7adf8a'); }
  }
}

/* ================= 19. speed lines and explosion flashes ================= */
const STREAKS = Array.from({ length: 22 }, (_, i) => ({ a: i / 22 * Math.PI * 2 + Math.random() * .2, r: Math.random(), len: 14 + Math.random() * 26 }));
function drawSpeedFx() {
  const sp = S.onFoot ? 0 : Math.hypot(S.v, S.side), k = S.boost ? 1 : clamp((sp - 3.4) / 1.2, 0, 1);
  if (k > 0 && !S.down) {
    g.strokeStyle = 'rgba(255,245,250,' + (.35 + .45 * k) + ')'; g.lineWidth = 2; g.beginPath();
    const cx = SW / 2, cy = SH / 2 + 8;
    for (const s of STREAKS) {
      s.r -= .06 + .08 * k; if (s.r < .45) { s.r = 1; s.a = Math.random() * Math.PI * 2; }
      const ca = Math.cos(s.a), sa = Math.sin(s.a), R = Math.hypot(SW, SH) / 2 * s.r;
      g.moveTo(cx + ca * R, cy + sa * R * .75); g.lineTo(cx + ca * (R + s.len * k), cy + sa * (R + s.len * k) * .75);
    }
    g.stroke();
  }
  if (S.blast) { g.fillStyle = 'rgba(255,240,200,' + (S.blast / 14) * .55 + ')'; g.fillRect(0, 21, SW, SH - 21); S.blast--; }
}

/* ================= 20. radical rampage ================= */
const RAD_TOKENS = [];
function placeRad() {
  for (let k = 0; k < 20000 && RAD_TOKENS.length < 4; k++) {
    const x = (rnd() * MW) | 0, y = (rnd() * MH) | 0, t = at(x, y);
    if ((t !== PLAZA && t !== SAND) || blocked[y * MW + x] || nearT(x, y, SEA) || RAD_TOKENS.some(r => Math.hypot(r.x / T - x, r.y / T - y) < 35)) continue;
    RAD_TOKENS.push({ x: x * T + 8, y: y * T + 8, gone: 0 });
  }
}
function updateRad() {
  for (const r of RAD_TOKENS) {
    if (r.gone) { r.gone--; continue; }
    if (!S.rampage && !S.air && Math.hypot(r.x - S.x, r.y - S.y) < 16) { S.rampage = { t: 60 * 30, n: 0, goal: 20 }; r.gone = 60 * 120; flash('RADICAL RAMPAGE! SMASH 20', 120); sfx('go'); }
  }
  const R = S.rampage; if (!R) return;
  R.t--;
  if (R.n >= R.goal) { S.cash += 500; flash('RAMPAGE DONE! +$500', 150); sfx('deliver'); S.rampage = null; }
  else if (R.t <= 0) { flash('RAMPAGE OVER ' + R.n + '/' + R.goal, 120); sfx('late'); S.rampage = null; }
}
function drawRad() {
  for (const r of RAD_TOKENS) {
    if (r.gone) continue; const x = r.x - camX, y = r.y - camY - 4 - Math.abs(Math.sin(frame / 12)) * 4; if (x < -20 || y < -20 || x > SW + 20 || y > SH + 20) continue;
    g.globalCompositeOperation = 'lighter'; glow(x, y, 16, '255,62,165', .5); g.globalCompositeOperation = 'source-over';
    px(x - 9, y - 5, 19, 10, P.ink); px(x - 9, y - 5, 19, 1, P.pink); text('RAD', x - 8, y - 3, blink(3) ? P.pink : P.sun);
  }
  const R = S.rampage; if (!R) return;
  const l = 'RAMPAGE ' + R.n + '/' + R.goal + '  ' + Math.ceil(R.t / 60) + 'S', w = tw(l) + 12;
  px((SW - w) / 2, 24, w, 13, P.pink); text(l, (SW - w) / 2 + 6, 27, P.ink);
}

/* ================= quality of life ================= */
// --- GPS: a route along the roads to the job or your waypoint ---
const drivableT = t => t === ROAD || t === RUNWAY || t === LOT || t === PIER || t === RAMP || t === SPRAY;
const GPS = { dist: null, target: null, path: [], at: -999 };
function gpsTarget() { return S.job ? S.job.target : S.waypoint || null; }
function nearestRoad(x, y, r = 6) {
  const tx = Math.floor(x / T), ty = Math.floor(y / T); let best = null, bd = 1e9;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (drivableT(at(tx + dx, ty + dy)) && dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = [tx + dx, ty + dy]; }
  return best;
}
// distances from the target over every road tile, rebuilt when the target changes
function buildDist(tx, ty) {
  const d = new Int32Array(MW * MH).fill(-1), q = new Int32Array(MW * MH); let h = 0, n = 0;
  d[ty * MW + tx] = 0; q[n++] = ty * MW + tx;
  while (h < n) { const i = q[h++], x = i % MW, y = (i / MW) | 0;
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + ax, ny = y + ay; if (!inMap(nx, ny)) continue; const j = ny * MW + nx; if (d[j] >= 0 || !drivableT(map[j])) continue; d[j] = d[i] + 1; q[n++] = j; } }
  return d;
}
function updateGps() {
  const t = gpsTarget(); if (!t) { GPS.path = []; GPS.target = null; return; }
  if (GPS.target !== t) { const r = nearestRoad(t.x, t.y, 8); GPS.target = t; GPS.dist = r ? buildDist(r[0], r[1]) : null; GPS.at = -999; }
  if (!GPS.dist || frame - GPS.at < 15) return;
  GPS.at = frame; GPS.path = [];
  let p = nearestRoad(S.x, S.y, 5); if (!p) return;
  for (let k = 0; k < 400; k++) {
    GPS.path.push(p); const here = GPS.dist[p[1] * MW + p[0]]; if (here <= 0) break;
    let next = null; for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = p[0] + ax, ny = p[1] + ay; if (inMap(nx, ny) && GPS.dist[ny * MW + nx] >= 0 && GPS.dist[ny * MW + nx] < here) { next = [nx, ny]; break; } }
    if (!next) break; p = next;
  }
}
function drawGpsRoad() {
  const col = S.job ? JOB_COLOUR[S.job.kind] : P.cream;
  for (let i = 2; i < Math.min(GPS.path.length - 1, 60); i += 2) {
    const [x, y] = GPS.path[i], [nx, ny] = GPS.path[i + 1], sx = x * T + 8 - camX, sy = y * T + 8 - camY; if (sx < -8 || sy < -8 || sx > SW + 8 || sy > SH + 8) continue;
    const dx = nx - x, dy = ny - y; g.globalAlpha = .55;
    px(sx - 2 + dx * 2, sy - 2 + dy * 2, 4, 4, col); px(sx - 1 - dx, sy - 1 - dy, 2, 2, col); g.globalAlpha = 1;
  }
}
function drawGpsOn(rx, ry, x0, y0, W, H, k, col) {
  for (let i = 0; i < GPS.path.length; i += (k < 1.2 ? 1 : 1)) { const [x, y] = GPS.path[i], dx = (x - x0) * k, dy = (y - y0) * k; if (dx >= 0 && dy >= 0 && dx < W && dy < H) px(rx + dx, ry + dy, Math.max(1, Math.round(k)), Math.max(1, Math.round(k)), col); }
}
// --- map cursor: set a waypoint, or take a cab there ---
const CAB_FARE = 40;
function mapPress(k) {
  if (!S.cursor) S.cursor = { x: S.x, y: S.y };
  const step = 4 * T;
  if (k === 'left') S.cursor.x -= step; else if (k === 'right') S.cursor.x += step; else if (k === 'up') S.cursor.y -= step; else if (k === 'down') S.cursor.y += step;
  else if (k === 'a') { const r = nearestRoad(S.cursor.x, S.cursor.y, 10); if (r) { S.waypoint = { x: r[0] * T + 8, y: r[1] * T + 8 }; sfx('pickup'); mode = 'play'; flash('WAYPOINT SET', 60); } }
  else if (k === 'fire') { S.waypoint = null; sfx('count'); }
  else if (k === 'door') takeCab();
  S.cursor.x = clamp(S.cursor.x, 0, MW * T); S.cursor.y = clamp(S.cursor.y, 0, MH * T);
}
function takeCab() {
  if (S.cash < CAB_FARE) { flash('CAB IS $' + CAB_FARE, 60); sfx('late'); return; }
  const r = nearestRoad(S.cursor.x, S.cursor.y, 12); if (!r) { flash('NO ROAD THERE', 60); return; }
  S.cash -= CAB_FARE; S.x = r[0] * T + 8; S.y = r[1] * T + 8; S.cam.x = S.x; S.cam.y = S.y; S.v = 0; S.side = 0; S.sink = 0; S.air = 0;
  if (S.onFoot) { S.onFoot = false; S.rideLook = -1; S.carHp = 100; }
  S.heat = 0; S.maids = []; S.cops = S.cops.filter(c => c.dead);
  mode = 'play'; S.fade = 30; sfx('door'); flash('PALM CAB: THAT IS $' + CAB_FARE + ', HUN', 90); carBanner();
}
function updateMapCursor() { if (!S.cursor) S.cursor = { x: S.x, y: S.y }; const sp = 6; if (stick.mag > .3) { S.cursor.x = clamp(S.cursor.x + stick.x * sp * 2, 0, MW * T); S.cursor.y = clamp(S.cursor.y + stick.y * sp * 2, 0, MH * T); } }
// --- call your car when you are on foot with nothing to drive ---
function callCar() {
  if (S.callCool) { flash('YOUR CAR IS ON THE WAY', 40); return; }
  for (const side of [1, -1]) for (let r = 18; r < 70; r += 8) { const a = S.fa + side * Math.PI / 2, x = S.x + Math.cos(a) * r, y = S.y + Math.sin(a) * r;
    if (!blockedAt(x, y, 8) && !isWater(tileAtPx(x, y))) { S.parked = S.parked.filter(c => c.look !== -1); S.parked.push({ x, y, a: S.fa, look: -1, hp: 100 }); S.callCool = 60 * 6; flash('YOUR PALM 6 TURBO IS HERE', 80); sfx('pickup'); return; } }
  flash('NO ROOM FOR A CAR HERE', 50);
}
// --- retry a job you just failed ---
function offerRetry(kind) { S.retry = { kind, t: 60 * 5 }; }
function retryJob() { const k = S.retry.kind; S.retry = null; if (S.job) return; S.markers[k] = { x: S.x, y: S.y }; startJob(k); }
function drawRetry() { if (!S.retry || S.job) return; const l = 'GAS TO RETRY ' + Math.ceil(S.retry.t / 60), w = tw(l) + 12; px((SW - w) / 2, 140, w, 13, P.ink); px((SW - w) / 2, 140, w, 1, P.sun); text(l, (SW - w) / 2 + 6, 143, blink(3) ? P.sun : P.cream); }
// --- keep the pins near you ---
function nearCurb(min, max) { let t = randomCurb(); for (let i = 0; i < 400; i++) { const d = Math.hypot(t.x - S.x, t.y - S.y); if (d >= min && d <= max) return t; t = randomCurb(); } return t; }
function updateQol() {
  if (S.callCool) S.callCool--;
  if (S.retry && !--S.retry.t) S.retry = null;
  if (S.fade) S.fade--;
  if (S.waypoint && Math.hypot(S.waypoint.x - S.x, S.waypoint.y - S.y) < 30) { S.waypoint = null; flash('YOU ARE HERE', 50); sfx('pickup'); }
  if (frame % 300 === 0) for (const k of JOB_KINDS) { const m = S.markers[k]; if (m && Math.hypot(m.x - S.x, m.y - S.y) > 1300) placeMarker(k); }
  updateGps();
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
// 14. a buzz to go with the big moments (Android; iPhones ignore it)
const VIBES = { crash: 35, shot: 8, laser: 12, boom: [90, 40, 90], land: 25, hurt: 20, ticket: [60, 40, 60], late: 120, tape: [20, 30, 20], deliver: [15, 30, 15], splash: 60, boost: 30 };
function sfx(name) {
  if (navigator.vibrate && VIBES[name]) try { navigator.vibrate(VIBES[name]); } catch (e) {}   // chip sounds, kept quiet under the beat
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
  if (name === 'shot') { if (!NB) NB = noiseBuf(); const s4 = AC.createBufferSource(); s4.buffer = NB; const f4 = AC.createBiquadFilter(); f4.type = 'bandpass'; f4.frequency.value = 1400; const gn = AC.createGain(); gn.gain.setValueAtTime(.22, t); gn.gain.exponentialRampToValueAtTime(.001, t + .12); s4.connect(f4); f4.connect(gn); gn.connect(master); s4.start(t); s4.stop(t + .15); beep(300, 80, .08, 'square', .05); }
  if (name === 'laser') { beep(1800, 200, .22, 'sawtooth', .05); beep(1200, 120, .2, 'square', .04); }
  if (name === 'hurt') beep(220, 110, .15, 'square', .07);
  if (name === 'door') { beep(140, 90, .06, 'square', .06); beep(90, 60, .08, 'square', .05, .08); }
  if (name === 'boom') { if (!NB) NB = noiseBuf(); const s5 = AC.createBufferSource(); s5.buffer = NB; const f5 = AC.createBiquadFilter(); f5.type = 'lowpass'; f5.frequency.setValueAtTime(1800, t); f5.frequency.exponentialRampToValueAtTime(120, t + .8); const gn = AC.createGain(); gn.gain.setValueAtTime(.5, t); gn.gain.exponentialRampToValueAtTime(.001, t + .9); s5.connect(f5); f5.connect(gn); gn.connect(master); s5.start(t); s5.stop(t + .4); beep(90, 30, .6, 'sine', .3); }
  if (name === 'smash') { if (!NB) NB = noiseBuf(); const s6 = AC.createBufferSource(); s6.buffer = NB; const f6 = AC.createBiquadFilter(); f6.type = 'highpass'; f6.frequency.value = 2000; const gn = AC.createGain(); gn.gain.setValueAtTime(.18, t); gn.gain.exponentialRampToValueAtTime(.001, t + .18); s6.connect(f6); f6.connect(gn); gn.connect(master); s6.start(t); s6.stop(t + .2); beep(500, 900, .06, 'square', .04); }
  if (name === 'boing') beep(260, 620, .18, 'sine', .12);
  if (name === 'tape') [784, 988, 1175, 1568].forEach((f, i) => beep(f, f, .08, 'triangle', .08, i * .06));
  if (name === 'honk') { beep(392, 380, .25, 'sawtooth', .045); beep(494, 480, .25, 'sawtooth', .035); }
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
function startGame() { audioInit(); newGame(); mode = 'play'; sfx('start'); carBanner(); }
function press(k, down) {
  const was = keys[k];
  if (k in keys) keys[k] = down ? 1 : 0;
  if (!down) return;
  audioInit();
  if (k === 'full') { const d = document.documentElement, fs = document.fullscreenElement || document.webkitFullscreenElement;
    try { if (fs) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else (d.requestFullscreen || d.webkitRequestFullscreen).call(d); } catch (e) {} return; }
  if (k === 'select') { toggleMusic(); return; }
  if (mode === 'casino') { casinoPress(k); return; }
  if (mode === 'title') { titlePress(k); return; }
  if (k === 'start') { mode = mode === 'paused' || mode === 'map' ? 'play' : 'paused'; sfx('pickup'); return; }
  if (k === 'map') { if (mode === 'play' || mode === 'map') { mode = mode === 'map' ? 'play' : 'map'; if (mode === 'map') S.cursor = { x: S.waypoint ? S.waypoint.x : S.x, y: S.waypoint ? S.waypoint.y : S.y }; sfx('pickup'); } return; }
  if (mode === 'map') { mapPress(k); return; }
  if (k === 'a' && !was && S.retry && mode === 'play') { retryJob(); return; }
  if (k === 'door' && mode === 'play') door();
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
cv.addEventListener('pointerdown', () => { if (mode === 'title') titlePress('a'); });
document.addEventListener('visibilitychange', () => { if (document.hidden && S) { save(); if (mode === 'play') mode = 'paused'; } });
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
    e.preventDefault(); audioInit();
    id = e.pointerId; zone.setPointerCapture(id); zone.classList.add('on');
    const { z, r } = place(); if (!home) home = { left: base.style.left, top: base.style.top };
    cx = e.clientX; cy = e.clientY;
    // the stick is centred on its left/top by its CSS margin; keep the whole base inside its area
    const lx = clamp(cx - z.left, r, z.width - r), ly = clamp(cy - z.top, r, z.height - r);
    base.style.left = lx + 'px'; base.style.top = ly + 'px';   // the push is measured from where the thumb landed
    move(e); if (navigator.vibrate) navigator.vibrate(6);
  });
  zone.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
  const end = e => { if (e.pointerId !== id) return; id = null; zone.classList.remove('on'); stick.x = stick.y = stick.mag = 0; knob.style.transform = '';
    if (home) { base.style.left = home.left; base.style.top = home.top; } };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
})();

/* ================= loop ================= */
buildIsland(); findCasinoDoor(); buildExtras(); setupStreamHouse(); placeTraps(); placeSeaLife(); placeAtms(); placeRad();
let last = performance.now(), acc = 0;
function loop(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
  draw(); updateEngineSound();
  if (S && mode === 'play' && S.cash > (S.best || 0)) { S.best = S.cash; try { localStorage.setItem('palmcity8.best', S.cash); } catch (e) {} }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.__pc8 = { get S() { return S; }, get mode() { return mode; }, get audio() { return AC ? AC.state + ':' + stepN : 'none'; }, press, at, MW, MH, T, stick, jobBump, door, goDown, SPRAYS, get C() { return C; }, GPS, RAD_TOKENS, ATMS, TRAPS, BOATS, SURFERS, get engine() { return engine; }, startBoss, get STREAM() { return STREAM; }, TAPES, PROPS, AEROBICS, get casinoDoor() { return casinoDoor; }, BUILDINGS, PALMS, ZONES, zoneRect, START };
