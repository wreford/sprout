// Popular JavaScript libraries, wrapped as Sprout modules (decision 106). Each module is a global cell of words, like the
// standard library's, and its library is loaded only when a program names it: from vendor/ on the page (play.html waits
// for it before running), and straight from the same files in Node. Values cross over both ways: lists and arrays,
// records and objects, Sprout colours and hex text, Sprout dates and JavaScript dates.
(function (root) {
"use strict";
const S = root.Sprout3 || (typeof module !== "undefined" ? require("./sprout3.js") : null);
const I = S.internals, W = S.words;
const { list, record, argumentsOf } = W;
const inNode = typeof window === "undefined";

// ===================================================================== values across the border
function toJS(v) {
  if (v === null || v === undefined) return null;
  if (typeof v !== "object") return v;
  if (W.Colour && v instanceof W.Colour) return v.sproutText();
  if (W.SproutDate && v instanceof W.SproutDate) { const [y, m, d] = v.parts(); return new Date(y, m - 1, d, 12); }
  if (W.Pair && v instanceof W.Pair) return [v.x, v.y];
  if (W.Word && v instanceof W.Word) return v.name;
  if (I.isCell(v)) {
    const keys = v.fieldNames(), parts = I.partsOf(v);
    if (keys.length && !parts.length) { const o = {}; for (const k of keys) o[k] = toJS(v.field(k)); return o; }
    return parts.map(toJS);
  }
  return typeof v.sproutText === "function" ? v.sproutText() : String(v);
}
function fromJS(x) {
  if (x === null || x === undefined) return false;
  if (typeof x === "number" || typeof x === "string" || typeof x === "boolean") return x;
  if (Array.isArray(x)) return list(x.map(fromJS));
  if (x instanceof Date) return isNaN(x) ? false : S.globals.date.fn(list([x.getFullYear(), x.getMonth() + 1, x.getDate()]));
  if (x && x.constructor === Object) { const keys = Object.keys(x); return record(keys, keys.map(k => fromJS(x[k]))); }
  if (x && typeof x.toArray === "function") return fromJS(x.toArray());     // a math.js matrix
  return String(x);
}
const colourOf = hex => S.globals.colour.fn(hex);
const args = (a, n) => argumentsOf(a, n).map(toJS);
const word = (name, fn, effect) => new I.Native(name, a => { try { return fn(a); } catch (e) { return I.logMiss(name + ": " + (e && e.message || e)); } }, effect);

// ===================================================================== the libraries
// for each: where its file is, the global it makes, and its words (each with what it does and an example)
const LIBRARIES = {
  chroma: {
    title: "chroma.js", file: "vendor/chroma/chroma.min.js", global: "chroma", licence: "BSD",
    about: "Colour scales, colour-blind-safe palettes, contrast for reading, and mixing that looks even to the eye.",
    words: lib => ({
      scale: ["a colour part of the way along a list of colours, mixed in Lab so the steps look even: [colours, t]", "chroma scale [[#fafa6e, #2a4858], 0.5]",
        a => { const [cs, t] = args(a, 2); return colourOf(lib.scale(cs).mode("lab")(t).hex()); }],
      steps: ["n colours evenly along a list of colours: [colours, n]", "chroma steps [[#fafa6e, #2a4858], 4]",
        a => { const [cs, n] = args(a, 2); return list(lib.scale(cs).mode("lab").colors(n).map(colourOf)); }],
      brewer: ["n colours from a ColorBrewer palette by name, such as Viridis, YlGnBu, Spectral or Set2: [name, n]", 'chroma brewer ["Viridis", 5]',
        a => { const [name, n] = args(a, 2); return list(lib.scale(name).colors(n).map(colourOf)); }],
      contrast: ["the WCAG contrast between two colours: 4.5 or more is easy to read", "chroma contrast [#ffffff, #5fa8d3]",
        a => { const [x, y] = args(a, 2); return +lib.contrast(x, y).toFixed(2); }],
      readable: ["black or white, whichever reads better on a colour", "chroma readable #5fa8d3",
        a => colourOf(lib.contrast(toJS(a), "#000") >= lib.contrast(toJS(a), "#fff") ? "#000000" : "#ffffff")],
      mix: ["two colours mixed in Lab: [a, b, t]", "chroma mix [#ff0000, #0000ff, 0.5]",
        a => { const [x, y, t] = args(a, 3); return colourOf(lib.mix(x, y, t === null ? 0.5 : t, "lab").hex()); }],
      named: ["a colour by its CSS name", 'chroma named "tomato"', a => colourOf(lib(toJS(a)).hex())],
      temperature: ["the colour of light at a temperature in kelvin", "chroma temperature 3500", a => colourOf(lib.temperature(toJS(a)).hex())],
      darken: ["a colour darker by an amount (1 is a lot)", "chroma darken [#5fa8d3, 1]", a => { const [c, k] = args(a, 2); return colourOf(lib(c).darken(k).hex()); }],
      brighten: ["a colour brighter by an amount", "chroma brighten [#1f6f8b, 1]", a => { const [c, k] = args(a, 2); return colourOf(lib(c).brighten(k).hex()); }],
      saturate: ["a colour more saturated by an amount", "chroma saturate [#9a978d, 2]", a => { const [c, k] = args(a, 2); return colourOf(lib(c).saturate(k).hex()); }],
      luminance: ["how bright a colour is to the eye, from 0 to 1", "chroma luminance #5fa8d3", a => +lib(toJS(a)).luminance().toFixed(3)],
    }),
  },
  simplex: {
    title: "simplex-noise", file: "vendor/simplex/simplex-noise.js", global: "SimplexNoise", licence: "MIT",
    about: "Smooth noise: values that drift gently from place to place, for terrain, clouds, wobble and wandering. The same input always gives the same value.",
    words: lib => {
      const Noise = lib.SimplexNoise || lib, cache = new Map();
      const gen = seed => { let n = cache.get(seed); if (!n) { n = new Noise(String(seed)); cache.set(seed, n); } return n; };
      const fractal = (n, x, y, octaves) => { let total = 0, amp = 1, freq = 1, norm = 0; for (let k = 0; k < octaves; k++) { total += n.noise2D(x * freq, y * freq) * amp; norm += amp; amp /= 2; freq *= 2; } return total / norm; };
      return {
        noise: ["smooth noise at x, y, from -1 to 1", "simplex noise [0.5, 1.25]", a => { const [x, y] = args(a, 2); return gen("sprout").noise2D(x, y || 0); }],
        noise3: ["smooth noise at x, y, z (z is often time, for noise that moves)", "simplex noise3 [0.5, 1.25, 2]", a => { const [x, y, z] = args(a, 3); return gen("sprout").noise3D(x, y, z); }],
        fractal: ["noise in several layers, big shapes with small detail on top: [x, y, layers]", "simplex fractal [0.5, 1.25, 4]", a => { const [x, y, o] = args(a, 3); return fractal(gen("sprout"), x, y, o || 4); }],
        seeded: ["noise from its own seed, for a different world: [seed, x, y]", "simplex seeded [7, 0.5, 1.25]", a => { const [s, x, y] = args(a, 3); return gen(s).noise2D(x, y); }],
      };
    },
  },
  mathjs: {
    title: "math.js", file: "vendor/mathjs/math.js", global: "math", licence: "Apache 2.0",
    about: "Math written as text: expressions, units and conversions, exact fractions, matrices and equations, derivatives and simplifying.",
    words: lib => {
      const out = r => typeof r === "number" ? r : r && r.isMatrix ? fromJS(r.toArray()) : Array.isArray(r) ? fromJS(r) : r && r.isResultSet ? fromJS(r.entries.map(e => typeof e === "number" ? e : lib.format(e, { precision: 10 }))) : typeof r === "boolean" ? r : lib.format(r, { precision: 10 });
      return {
        evaluate: ["an expression written as text: units, functions and all", 'mathjs evaluate "sqrt(3^2 + 4^2) * 2 cm to inch"', a => out(lib.evaluate(toJS(a)))],
        convert: ["an amount in another unit, as a number: [amount, unit]", 'mathjs convert ["60 mi/h", "km/h"]', a => { const [v, u] = args(a, 2); return +lib.unit(v).toNumber(u).toFixed(10); }],
        fraction: ["exact fractions, as text", 'mathjs fraction "1/3 + 1/6"', a => { const tree = lib.parse(toJS(a)).transform(n => n.isConstantNode && typeof n.value === "number" ? new lib.ConstantNode(lib.fraction(n.value)) : n); return lib.format(tree.evaluate(), { fraction: "ratio" }); }],
        solve: ["x for a set of linear equations A x = b: [A, b]", "mathjs solve [[[2, 1], [1, 3]], [3, 5]]", a => { const [A, b] = args(a, 2); return fromJS(lib.lusolve(A, b).map(r => +r[0].toFixed(10))); }],
        multiply: ["two matrices (or a matrix and a vector) multiplied", "mathjs multiply [[[1, 2], [3, 4]], [5, 6]]", a => { const [x, y] = args(a, 2); return out(lib.multiply(x, y)); }],
        inverse: ["the inverse of a square matrix", "mathjs inverse [[4, 7], [2, 6]]", a => fromJS(lib.inv(toJS(a)).map(r => r.map(v => +v.toFixed(10))))],
        determinant: ["the determinant of a square matrix", "mathjs determinant [[4, 7], [2, 6]]", a => +lib.det(toJS(a)).toFixed(10)],
        derivative: ["the derivative of an expression, as text: [expression, variable]", 'mathjs derivative ["x^3 + 2x", "x"]', a => { const [e, v] = args(a, 2); return lib.derivative(e, v).toString(); }],
        simplify: ["an expression made simpler, as text", 'mathjs simplify "2x + 3x - x"', a => lib.simplify(toJS(a)).toString()],
      };
    },
  },
  "date-fns": {
    title: "date-fns", file: "vendor/date-fns/date-fns.min.js", global: "dateFns", licence: "MIT",
    about: "Dates written for people: formatting with a pattern, how long ago, parsing, weeks and months. Takes and gives Sprout dates like 2026-11-20.",
    words: lib => ({
      format: ["a date as text, by a pattern (EEEE is the day's name, d the day, MMMM the month, yyyy the year)", 'date-fns format [2026-11-20, "EEEE d MMMM yyyy"]', a => { const [d, p] = args(a, 2); return lib.format(d, p); }],
      distance: ["how far apart two dates are, in words", "date-fns distance [2026-11-20, 2027-02-14]", a => { const [x, y] = args(a, 2); return lib.formatDistance(x, y); }],
      parse: ["a date from text, by a pattern: [text, pattern]", 'date-fns parse ["20/11/2026", "dd/MM/yyyy"]', a => { const [t, p] = args(a, 2); return fromJS(lib.parse(t, p, new Date(2000, 0, 1, 12))); }],
      week: ["the ISO week number of a date", "date-fns week 2026-11-20", a => lib.getISOWeek(toJS(a))],
      "days-in-month": ["how many days the month of a date has", "date-fns days-in-month 2028-02-01", a => lib.getDaysInMonth(toJS(a))],
      "start-of-month": ["the first day of the month of a date", "date-fns start-of-month 2026-11-20", a => fromJS(lib.startOfMonth(toJS(a)))],
      "end-of-month": ["the last day of the month of a date", "date-fns end-of-month 2026-11-20", a => fromJS(lib.endOfMonth(toJS(a)))],
      "is-leap-year": ["is the year of a date a leap year?", "date-fns is-leap-year 2028-01-01", a => lib.isLeapYear(toJS(a))],
    }),
  },
  fuse: {
    title: "Fuse.js", file: "vendor/fuse/fuse.min.js", global: "Fuse", licence: "Apache 2.0",
    about: "Fuzzy search: find what was meant even when it is misspelt. Works on lists of text, or of records (searching every text field).",
    words: lib => {
      const fuse = items => { const xs = I.partsOf(items).map(toJS), options = { includeScore: true, threshold: 0.4 }; if (xs.length && xs[0] && typeof xs[0] === "object") options.keys = Object.keys(xs[0]).filter(k => typeof xs[0][k] === "string"); return new lib(xs, options); };
      return {
        search: ["the items that match, best first: [items, query]", 'fuse search [["apple", "banana", "pineapple", "grape"], "aple"]', a => { const [items, q] = argumentsOf(a, 2); return list(fuse(items).search(String(q)).map(r => fromJS(r.item))); }],
        best: ["the one item that matches best, or false", 'fuse best [[[name : "Ada"], [name : "Alan"], [name : "Grace"]], "grase"]', a => { const [items, q] = argumentsOf(a, 2); const r = fuse(items).search(String(q))[0]; return r ? fromJS(r.item) : false; }],
        scored: ["each match with how close it is, from 0 (exact) to 1", 'fuse scored [["sprout", "spout", "trout"], "sprot"]', a => { const [items, q] = argumentsOf(a, 2); return list(fuse(items).search(String(q)).map(r => record(["item", "score"], [fromJS(r.item), +r.score.toFixed(3)]))); }],
      };
    },
  },
  nlp: {
    title: "compromise", file: "vendor/compromise/compromise.js", global: "nlp", licence: "MIT",
    about: "English, understood a little: the nouns, verbs, people and places in text, plurals, tenses and numbers written as words.",
    words: lib => {
      const out = xs => list(xs.map(fromJS));
      return {
        nouns: ["the nouns in some text", 'nlp nouns "The quick fox jumps over the lazy dogs"', a => out(lib(toJS(a)).nouns().out("array"))],
        verbs: ["the verbs in some text", 'nlp verbs "She sells shells and he sang"', a => out(lib(toJS(a)).verbs().out("array"))],
        people: ["the people named in some text", 'nlp people "Ada Lovelace wrote to Charles Babbage"', a => out(lib(toJS(a)).people().out("array"))],
        places: ["the places named in some text", 'nlp places "From Paris to New York by way of Iceland"', a => out(lib(toJS(a)).places().out("array"))],
        sentences: ["text split into sentences", 'nlp sentences "It rained. Then it stopped! Did it?"', a => out(lib(toJS(a)).sentences().out("array"))],
        plural: ["a noun made plural", 'nlp plural "goose"', a => lib(toJS(a)).nouns().toPlural().text() || toJS(a)],
        singular: ["a noun made singular", 'nlp singular "mice"', a => lib(toJS(a)).nouns().toSingular().text() || toJS(a)],
        past: ["text put in the past tense", 'nlp past "she walks to the shop"', a => { const d = lib(toJS(a)); d.verbs().toPastTense(); return d.text(); }],
        future: ["text put in the future tense", 'nlp future "she walks to the shop"', a => { const d = lib(toJS(a)); d.verbs().toFutureTense(); return d.text(); }],
        numbers: ["the numbers in some text, even written as words", 'nlp numbers "five apples and twenty-two pears"', a => out(lib(toJS(a)).numbers().get())],
      };
    },
  },
  tone: {
    title: "Tone.js", file: "vendor/tone/Tone.js", global: "Tone", licence: "MIT", browserOnly: true,
    about: "Music in the browser: notes, chords and drums. These are effects, like beep: in update they happen after the frame, and never again on rewind.",
    words: lib => {
      let synth = null, poly = null, kick = null, snare = null, hat = null;
      const ready = () => { if (!synth) { synth = new lib.Synth().toDestination(); poly = new lib.PolySynth(lib.Synth).toDestination(); kick = new lib.MembraneSynth().toDestination(); snare = new lib.NoiseSynth({ envelope: { attack: 0.001, decay: 0.18, sustain: 0 } }).toDestination(); hat = new lib.MetalSynth({ envelope: { attack: 0.001, decay: 0.06, release: 0.01 }, volume: -18 }).toDestination(); } };
      const effectWord = (name, f) => word(name, a => S.effect(() => { try { if (lib.context.state !== "running") lib.start(); ready(); f(a); } catch (e) { I.logMiss("tone " + name + ": " + e.message); } }), true);
      return {
        play: ["a note for a time, both as text: [note, length]. Lengths are like 8n (an eighth) or 0.5 (seconds)", null, effectWord("play", a => { const [n, d] = args(a, 2); synth.triggerAttackRelease(n, d || "8n"); })],
        chord: ["several notes at once: [notes, length]", null, effectWord("chord", a => { const [ns, d] = args(a, 2); poly.triggerAttackRelease(ns, d || "4n"); })],
        drum: ["a drum: kick, snare or hat", null, effectWord("drum", a => { const k = toJS(a); if (k === "kick") kick.triggerAttackRelease("C1", "8n"); else if (k === "snare") snare.triggerAttackRelease("16n"); else hat.triggerAttackRelease("C6", "32n"); })],
        frequency: ["a note's frequency in hertz", null, word("frequency", a => +lib.Frequency(toJS(a)).toFrequency().toFixed(3))],
      };
    },
  },
  zzfx: {
    title: "ZzFX", file: "vendor/zzfx/zzfx.js", global: "zzfx", licence: "MIT", browserOnly: true,
    about: "Tiny 8-bit sound effects made on the spot from a list of numbers (the Zuper Zmall Zound Zynth, by Frank Force), with ready-made ones for games. These are effects, like beep: in update they happen after the frame, and never again on rewind.",
    words: lib => {
      // ready-made sounds: [volume, randomness, frequency, attack, sustain, release, shape, shape curve, slide, delta slide,
      // pitch jump, pitch jump time, repeat time, noise, modulation, bit crush, delay, sustain volume, decay, tremolo];
      // shape 0 with a curve of 0 is a square wave, as an 8-bit sound chip makes
      const PRESETS = {
        coin: [0.9, 0.02, 1046, 0, 0.03, 0.12, 0, 0, 0, 0, 523, 0.05],
        jump: [0.7, 0.03, 260, 0.005, 0.05, 0.1, 0, 0, 9],
        hit: [1, 0.05, 140, 0, 0.02, 0.1, 4, 1.5, -6],
        hurt: [1, 0.05, 340, 0, 0.06, 0.22, 2, 1.4, -9, 0, 0, 0, 0, 0.5],
        explode: [1.4, 0.2, 80, 0.01, 0.18, 0.5, 4, 0.6, 0, 0, 0, 0, 0, 1.1, 0, 0.4, 0, 0.5, 0.2],
        power: [0.8, 0, 392, 0.02, 0.18, 0.2, 0, 0, 0, 0, 196, 0.06, 0.06],
        laser: [0.6, 0.05, 1100, 0, 0.03, 0.08, 0, 0, -30],
        blip: [0.5, 0, 880, 0, 0.02, 0.04, 0, 0],
        select: [0.6, 0, 660, 0, 0.03, 0.06, 0, 0, 0, 0, 330, 0.03],
        step: [0.25, 0.1, 110, 0, 0.01, 0.03, 4],
      };
      const fx = (name, f) => word(name, a => S.effect(() => { try { if (root.zzfxX && root.zzfxX.state !== "running") root.zzfxX.resume(); f(a); } catch (e) { I.logMiss("zzfx " + name + ": " + e.message); } }), true);
      return {
        play: ["a sound from ZzFX's own numbers: [volume, randomness, frequency, attack, sustain, release, shape, ...]", null, fx("play", a => lib(...toJS(a).map(v => v === null ? undefined : v)))],
        preset: ["a ready-made sound by name: coin, jump, hit, hurt, explode, power, laser, blip, select or step; or [name, pitch] to play it higher (2) or lower (0.5)", null,
          fx("preset", a => { const v = toJS(a), [name, pitch] = Array.isArray(v) ? v : [v, 1], p = PRESETS[name]; if (!p) throw new Error("there's no sound called " + name); const q = p.slice(); q[2] *= pitch || 1; lib(...q); })],
        names: ["the names of the ready-made sounds", null, word("names", () => list(Object.keys(PRESETS)))],
      };
    },
  },
  turf: {
    title: "Turf", file: "vendor/turf/turf.min.js", global: "turf", licence: "MIT",
    about: "Geography on a round Earth: distances, bearings, areas and points along a route. A point is [longitude, latitude]; a line or a polygon is a list of points.",
    words: lib => {
      const ring = pts => { const p = pts.slice(); const a = p[0], b = p[p.length - 1]; if (a[0] !== b[0] || a[1] !== b[1]) p.push(a); return p; };
      return {
        distance: ["the distance between two points, in km", "turf distance [[-0.1276, 51.5072], [2.3522, 48.8566]] round", a => { const [x, y] = args(a, 2); return lib.distance(lib.point(x), lib.point(y)); }],
        bearing: ["the direction from one point to another, in degrees from north", "turf bearing [[-0.1276, 51.5072], [2.3522, 48.8566]] round", a => { const [x, y] = args(a, 2); return lib.bearing(lib.point(x), lib.point(y)); }],
        destination: ["the point some km away in a direction: [point, km, bearing]", "turf destination [[0, 0], 111.195, 90]", a => { const [p, km, b] = args(a, 3); return fromJS(lib.destination(lib.point(p), km, b).geometry.coordinates.map(v => +v.toFixed(6))); }],
        midpoint: ["the point halfway between two points", "turf midpoint [[0, 0], [10, 0]]", a => { const [x, y] = args(a, 2); return fromJS(lib.midpoint(lib.point(x), lib.point(y)).geometry.coordinates.map(v => +v.toFixed(6))); }],
        length: ["the length of a line of points, in km", "turf length [[0, 0], [1, 0], [1, 1]] round", a => lib.length(lib.lineString(toJS(a)))],
        area: ["the area inside a polygon of points, in square km", "turf area [[0, 0], [1, 0], [1, 1], [0, 1]] round", a => lib.area(lib.polygon([ring(toJS(a))])) / 1e6],
        along: ["the point some km along a line: [points, km]", "turf along [[[0, 0], [0, 10]], 111.195]", a => { const [pts, km] = args(a, 2); return fromJS(lib.along(lib.lineString(pts), km).geometry.coordinates.map(v => +v.toFixed(6))); }],
        inside: ["is a point inside a polygon? [point, polygon]", "turf inside [[0.5, 0.5], [[0, 0], [1, 0], [1, 1], [0, 1]]]", a => { const [p, poly] = args(a, 2); return lib.booleanPointInPolygon(lib.point(p), lib.polygon([ring(poly)])); }],
      };
    },
  },
};

// ===================================================================== loading
const loaded = {}, modules = {}, pending = {};
let base = "";
function libraryOf(name) {
  if (loaded[name]) return loaded[name];
  const L = LIBRARIES[name];
  if (inNode) {
    if (L.browserOnly) return null;
    // the browser file, run with a module object of its own (and a window for those that only set one)
    const fs = require("fs"), path = require("path");
    const src = fs.readFileSync(path.join(__dirname, L.file), "utf8"), mod = { exports: {} }, win = {};
    new Function("module", "exports", "window", "self", "define", src)(mod, mod.exports, win, win, undefined);
    const got = Object.keys(mod.exports).length || typeof mod.exports === "function" ? mod.exports : win[L.global];
    loaded[name] = got && got.default && !got[L.global] && name !== "chroma" ? got.default : got;
    if (name === "simplex" && loaded[name].SimplexNoise) loaded[name] = loaded[name].SimplexNoise;
    return loaded[name];
  }
  return root[L.global] ? (loaded[name] = root[L.global]) : null;
}
function moduleOf(name) {
  if (modules[name]) return modules[name];
  const lib = libraryOf(name);
  if (!lib) { I.logMiss(LIBRARIES[name].browserOnly && inNode ? name + " works only in a browser" : name + " (" + LIBRARIES[name].title + ") is still loading"); return false; }
  const words = LIBRARIES[name].words(lib), keys = Object.keys(words);
  return (modules[name] = record(keys, keys.map(k => words[k][2] instanceof I.Native ? words[k][2] : word(name + " " + k, words[k][2]))));
}
for (const name in LIBRARIES) Object.defineProperty(S.globals, name, { get: () => moduleOf(name), enumerable: true, configurable: true });

// the libraries a program names, so a page can load them before it runs
const mentions = src => Object.keys(LIBRARIES).filter(name => new RegExp("(^|[\\s\\[(,|])" + name.replace("-", "\\-") + "(?=[\\s\\])]|$)", "m").test(src.replace(/--.*$/gm, "")));
function missing(src) { return mentions(src).filter(name => !libraryOf(name)); }
function load(names) {
  return Promise.all(names.map(name => pending[name] || (pending[name] = new Promise((ok, no) => {
    const s = document.createElement("script"); s.src = base + LIBRARIES[name].file; s.async = true;
    s.onload = () => { if (name === "simplex" && root.SimplexNoise) loaded[name] = root.SimplexNoise; ok(); };
    s.onerror = () => { delete pending[name]; no(new Error("couldn't load " + LIBRARIES[name].title)); };
    document.head.appendChild(s);
  }))));
}
// browsers start sound only after a tap or a key: Tone.js is started on the first one after it loads
if (!inNode) ["pointerdown", "keydown"].forEach(t => document.addEventListener(t, () => { if (root.Tone && root.Tone.context && root.Tone.context.state !== "running") root.Tone.start(); }, true));
S.libraries = { LIBRARIES, names: Object.keys(LIBRARIES), mentions, missing, load, moduleOf, toJS, fromJS, setBase: b => { base = b; } };
})(typeof window !== "undefined" ? window : globalThis);
