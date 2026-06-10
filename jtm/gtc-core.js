// GTC -- Generative Text Codec core pipeline.
// Pure functions over raw RGBA buffers so the same code runs in Node tests and the browser.

// ---------- color helpers ----------

function hex(r, g, b) {
  return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
function unhex(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function dist2(a, b) {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}
function luma(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }

// ---------- palette ----------

const KEYS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function makePalette(tolerance) {
  const entries = []; // [r,g,b]
  return {
    key(rgb) {
      let best = -1, bestD = Infinity;
      for (let i = 0; i < entries.length; i++) {
        const d = dist2(entries[i], rgb);
        if (d < bestD) { bestD = d; best = i; }
      }
      if (best >= 0 && bestD <= tolerance * tolerance) return KEYS[best];
      if (entries.length >= KEYS.length) return KEYS[best];
      entries.push(rgb.slice());
      return KEYS[entries.length - 1];
    },
    toObject() {
      const o = {};
      entries.forEach((e, i) => { o[KEYS[i]] = hex(e[0], e[1], e[2]); });
      return o;
    }
  };
}

// ---------- slicing + measurement ----------

function sliceCells(img, cellSize) {
  const { data, w, h } = img;
  const cols = Math.ceil(w / cellSize), rows = Math.ceil(h / cellSize);
  const cells = [];
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const x0 = cx * cellSize, y0 = cy * cellSize;
      const cw = Math.min(cellSize, w - x0), ch = Math.min(cellSize, h - y0);
      let sr = 0, sg = 0, sb = 0, n = 0;
      let lumaSum = 0, lumaSq = 0, edgeSum = 0, edgeN = 0;
      const buckets = new Map(); // 12-bit color -> count
      let topSum = 0, topN = 0, botSum = 0, botN = 0, leftSum = 0, leftN = 0, rightSum = 0, rightN = 0;
      const topC = [0, 0, 0], botC = [0, 0, 0], leftC = [0, 0, 0], rightC = [0, 0, 0];
      for (let y = y0; y < y0 + ch; y++) {
        for (let x = x0; x < x0 + cw; x++) {
          const i = (y * w + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          sr += r; sg += g; sb += b; n++;
          const L = luma(r, g, b);
          lumaSum += L; lumaSq += L * L;
          const bk = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
          buckets.set(bk, (buckets.get(bk) || 0) + 1);
          if (x + 1 < x0 + cw) {
            const j = i + 4;
            edgeSum += Math.abs(L - luma(data[j], data[j + 1], data[j + 2])); edgeN++;
          }
          if (y + 1 < y0 + ch) {
            const j = i + w * 4;
            edgeSum += Math.abs(L - luma(data[j], data[j + 1], data[j + 2])); edgeN++;
          }
          const fy = (y - y0) / ch, fx = (x - x0) / cw;
          if (fy < 0.25) { topSum += L; topN++; topC[0] += r; topC[1] += g; topC[2] += b; }
          if (fy >= 0.75) { botSum += L; botN++; botC[0] += r; botC[1] += g; botC[2] += b; }
          if (fx < 0.25) { leftSum += L; leftN++; leftC[0] += r; leftC[1] += g; leftC[2] += b; }
          if (fx >= 0.75) { rightSum += L; rightN++; rightC[0] += r; rightC[1] += g; rightC[2] += b; }
        }
      }
      const mean = [sr / n, sg / n, sb / n];
      const lumaMean = lumaSum / n;
      const lumaStd = Math.sqrt(Math.max(0, lumaSq / n - lumaMean * lumaMean));
      const edgeMean = edgeN ? edgeSum / edgeN : 0;
      const sorted = [...buckets.entries()].sort((p, q) => q[1] - p[1]);
      const domCover = sorted.length ? sorted[0][1] / n : 1;
      const top2Cover = sorted.length > 1 ? (sorted[0][1] + sorted[1][1]) / n : domCover;
      cells.push({
        cx, cy, x: x0, y: y0, w: cw, h: ch,
        mean, lumaStd, edgeMean, domCover, top2Cover,
        vTrend: (botN && topN) ? botSum / botN - topSum / topN : 0,
        hTrend: (rightN && leftN) ? rightSum / rightN - leftSum / leftN : 0,
        topColor: topN ? topC.map(v => v / topN) : mean,
        botColor: botN ? botC.map(v => v / botN) : mean,
        leftColor: leftN ? leftC.map(v => v / leftN) : mean,
        rightColor: rightN ? rightC.map(v => v / rightN) : mean
      });
    }
  }
  return { cells, cols, rows };
}

// ---------- classification ----------

function classify(cells, opts) {
  const flatStd = opts.flatStd ?? 5;
  const gradEdge = opts.gradEdge ?? 7;
  const gradTrend = opts.gradTrend ?? 10;
  const edgeCover = opts.edgeCover ?? 0.85;
  for (const c of cells) {
    if (c.lumaStd < flatStd && c.domCover > 0.6) c.kind = "flat";
    else if (c.edgeMean < gradEdge && (Math.abs(c.vTrend) > gradTrend || Math.abs(c.hTrend) > gradTrend)) {
      c.kind = "gradient";
      c.gradAxis = Math.abs(c.vTrend) >= Math.abs(c.hTrend) ? "v" : "h";
    }
    else if (c.top2Cover > edgeCover) c.kind = "edge";
    else c.kind = "texture";
  }
}

// ---------- merging ----------

// Greedy maximal rectangles over flat cells of similar color -> rect ops.
function mergeFlat(cells, cols, rows, tol) {
  const grid = [];
  for (const c of cells) grid[c.cy * cols + c.cx] = c;
  const used = new Set();
  const rects = [];
  const similar = (a, b) => dist2(a.mean, b.mean) <= tol * tol;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const c = grid[cy * cols + cx];
      if (!c || c.kind !== "flat" || used.has(c)) continue;
      // extend right
      let wCells = 1;
      while (cx + wCells < cols) {
        const nx = grid[cy * cols + cx + wCells];
        if (!nx || nx.kind !== "flat" || used.has(nx) || !similar(c, nx)) break;
        wCells++;
      }
      // extend down while the whole row matches
      let hCells = 1;
      outer: while (cy + hCells < rows) {
        for (let k = 0; k < wCells; k++) {
          const nx = grid[(cy + hCells) * cols + cx + k];
          if (!nx || nx.kind !== "flat" || used.has(nx) || !similar(c, nx)) break outer;
        }
        hCells++;
      }
      let sr = 0, sg = 0, sb = 0, m = 0;
      for (let j = 0; j < hCells; j++) for (let k = 0; k < wCells; k++) {
        const nx = grid[(cy + j) * cols + cx + k];
        used.add(nx);
        sr += nx.mean[0]; sg += nx.mean[1]; sb += nx.mean[2]; m++;
      }
      const last = grid[(cy + hCells - 1) * cols + cx + wCells - 1];
      rects.push({
        x: c.x, y: c.y,
        w: last.x + last.w - c.x, h: last.y + last.h - c.y,
        color: [sr / m, sg / m, sb / m]
      });
    }
  }
  return rects;
}

// Merge runs of vertical-gradient cells along a row into bands; horizontal-gradient cells along a column.
function mergeGradients(cells, cols, rows, tol) {
  const grid = [];
  for (const c of cells) grid[c.cy * cols + c.cx] = c;
  const used = new Set();
  const bands = [];
  const close = (a, b) => dist2(a, b) <= tol * tol;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const c = grid[cy * cols + cx];
      if (!c || c.kind !== "gradient" || used.has(c)) continue;
      if (c.gradAxis === "v") {
        let wCells = 1;
        while (cx + wCells < cols) {
          const nx = grid[cy * cols + cx + wCells];
          if (!nx || nx.kind !== "gradient" || nx.gradAxis !== "v" || used.has(nx)
            || !close(c.topColor, nx.topColor) || !close(c.botColor, nx.botColor)) break;
          wCells++;
        }
        // try extending the band downward (sky spans several cell rows)
        let hCells = 1;
        outer: while (cy + hCells < rows) {
          for (let k = 0; k < wCells; k++) {
            const nx = grid[(cy + hCells) * cols + cx + k];
            const above = grid[(cy + hCells - 1) * cols + cx + k];
            if (!nx || nx.kind !== "gradient" || nx.gradAxis !== "v" || used.has(nx)
              || !close(above.botColor, nx.topColor)) break outer;
          }
          hCells++;
        }
        let x1 = c.x, y1 = c.y;
        const lastRow = cy + hCells - 1, lastCol = cx + wCells - 1;
        const last = grid[lastRow * cols + lastCol];
        for (let j = 0; j < hCells; j++) for (let k = 0; k < wCells; k++) used.add(grid[(cy + j) * cols + cx + k]);
        const topAvg = [0, 0, 0], botAvg = [0, 0, 0];
        for (let k = 0; k < wCells; k++) {
          const t = grid[cy * cols + cx + k], b = grid[lastRow * cols + cx + k];
          for (let i = 0; i < 3; i++) { topAvg[i] += t.topColor[i] / wCells; botAvg[i] += b.botColor[i] / wCells; }
        }
        bands.push({ axis: "v", x: x1, y: y1, w: last.x + last.w - x1, h: last.y + last.h - y1, c1: topAvg, c2: botAvg });
      } else {
        let hCells = 1;
        while (cy + hCells < rows) {
          const nx = grid[(cy + hCells) * cols + cx];
          if (!nx || nx.kind !== "gradient" || nx.gradAxis !== "h" || used.has(nx)
            || !close(c.leftColor, nx.leftColor) || !close(c.rightColor, nx.rightColor)) break;
          hCells++;
        }
        const last = grid[(cy + hCells - 1) * cols + cx];
        for (let j = 0; j < hCells; j++) used.add(grid[(cy + j) * cols + cx]);
        bands.push({ axis: "h", x: c.x, y: c.y, w: c.w, h: last.y + last.h - c.y, c1: c.leftColor, c2: c.rightColor });
      }
    }
  }
  return bands;
}

// ---------- raster fallback for edge/texture cells ----------

function cellRaster(img, cell, sub, maxColors, palette) {
  const { data, w } = img;
  const px = [];
  const samples = [];
  for (let sy = 0; sy < sub; sy++) {
    for (let sx = 0; sx < sub; sx++) {
      const x0 = cell.x + Math.floor(sx * cell.w / sub);
      const x1 = cell.x + Math.max(x0 - cell.x + 1, Math.floor((sx + 1) * cell.w / sub));
      const y0 = cell.y + Math.floor(sy * cell.h / sub);
      const y1 = cell.y + Math.max(y0 - cell.y + 1, Math.floor((sy + 1) * cell.h / sub));
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * w + x) * 4;
        r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
      }
      samples.push([r / n, g / n, b / n]);
    }
  }
  // local quantization: k-means-lite with maxColors seeds picked greedily by distance
  const seeds = [samples[0].slice()];
  while (seeds.length < maxColors) {
    let far = null, farD = -1;
    for (const s of samples) {
      let d = Infinity;
      for (const sd of seeds) d = Math.min(d, dist2(s, sd));
      if (d > farD) { farD = d; far = s; }
    }
    if (farD < 24 * 24) break;
    seeds.push(far.slice());
  }
  for (let iter = 0; iter < 4; iter++) {
    const acc = seeds.map(() => [0, 0, 0, 0]);
    for (const s of samples) {
      let bi = 0, bd = Infinity;
      seeds.forEach((sd, i) => { const d = dist2(s, sd); if (d < bd) { bd = d; bi = i; } });
      acc[bi][0] += s[0]; acc[bi][1] += s[1]; acc[bi][2] += s[2]; acc[bi][3]++;
    }
    acc.forEach((a, i) => { if (a[3]) seeds[i] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
  }
  for (let sy = 0; sy < sub; sy++) {
    let row = "";
    for (let sx = 0; sx < sub; sx++) {
      const s = samples[sy * sub + sx];
      let bi = 0, bd = Infinity;
      seeds.forEach((sd, i) => { const d = dist2(s, sd); if (d < bd) { bd = d; bi = i; } });
      row += palette.key(seeds[bi].map(Math.round));
    }
    px.push(row);
  }
  return px;
}

// run-length encode a row string when it pays for itself: "bbbbrr" -> "4b2r"
function rle(row) {
  let out = "";
  let i = 0;
  while (i < row.length) {
    let j = i;
    while (j < row.length && row[j] === row[i]) j++;
    const n = j - i;
    out += n > 2 ? n + row[i] : row[i].repeat(n);
    i = j;
  }
  return out.length < row.length ? out : row;
}

// ---------- encode ----------

function encode(img, opts = {}) {
  const cellSize = opts.cellSize ?? 16;
  const sub = opts.sub ?? 8;
  const tol = opts.tol ?? 28;
  const palette = makePalette(opts.paletteTol ?? 20);
  const { cells, cols, rows } = sliceCells(img, cellSize);
  classify(cells, opts);
  const rects = mergeFlat(cells, cols, rows, tol);
  const bands = mergeGradients(cells, cols, rows, tol * 1.4);
  const ops = [];
  for (const b of bands) {
    const g = b.axis === "v" ? "vgrad" : "hgrad";
    ops.push(`${g} ${b.x} ${b.y} ${b.w} ${b.h} ${palette.key(b.c1.map(Math.round))} ${palette.key(b.c2.map(Math.round))}`);
  }
  for (const r of rects) {
    ops.push(`rect ${r.x} ${r.y} ${r.w} ${r.h} ${palette.key(r.color.map(Math.round))}`);
  }
  const blocks = [];
  for (const c of cells) {
    if (c.kind !== "edge" && c.kind !== "texture") continue;
    const maxColors = c.kind === "edge" ? 2 : 4;
    const px = cellRaster(img, c, sub, maxColors, palette).map(rle);
    blocks.push({ x: c.x, y: c.y, w: c.w, h: c.h, px });
  }
  const jtm = {
    kind: "scene", w: img.w, h: img.h,
    palette: palette.toObject(),
    ops, cells: blocks
  };
  return { jtm, cells, cols, rows };
}

function jtmToText(jtm) {
  // canonical formatting: one op per line, one cell per line, rows aligned
  const lines = [];
  lines.push("{");
  lines.push(`  "kind": ${JSON.stringify(jtm.kind)}, "w": ${jtm.w}, "h": ${jtm.h},`);
  lines.push(`  "palette": ${JSON.stringify(jtm.palette)},`);
  lines.push(`  "ops": [`);
  jtm.ops.forEach((op, i) => lines.push(`    ${JSON.stringify(op)}${i < jtm.ops.length - 1 ? "," : ""}`));
  lines.push(`  ],`);
  lines.push(`  "cells": [`);
  jtm.cells.forEach((c, i) => {
    lines.push(`    { "x": ${c.x}, "y": ${c.y}, "w": ${c.w}, "h": ${c.h}, "px": ${JSON.stringify(c.px)} }${i < jtm.cells.length - 1 ? "," : ""}`);
  });
  lines.push(`  ]`);
  lines.push("}");
  return lines.join("\n");
}

// ---------- decode ----------

function rleExpand(row) {
  let out = "";
  let i = 0;
  while (i < row.length) {
    let num = "";
    while (i < row.length && row[i] >= "0" && row[i] <= "9") { num += row[i]; i++; }
    if (i < row.length) {
      out += row[i].repeat(num ? parseInt(num, 10) : 1);
      i++;
    }
  }
  return out;
}

function decode(jtm, out) {
  // out: { data: Uint8ClampedArray, w, h } pre-sized
  const { data, w, h } = out;
  const pal = {};
  for (const k in jtm.palette) pal[k] = unhex(jtm.palette[k]);
  const put = (x, y, rgb) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4;
    data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2]; data[i + 3] = 255;
  };
  const fillRect = (x, y, rw, rh, rgb) => {
    for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) put(xx, yy, rgb);
  };
  for (const op of jtm.ops || []) {
    const t = op.trim().split(/\s+/);
    if (t[0] === "rect") {
      fillRect(+t[1], +t[2], +t[3], +t[4], pal[t[5]] || [255, 0, 255]);
    } else if (t[0] === "vgrad" || t[0] === "hgrad") {
      const [x, y, rw, rh] = [+t[1], +t[2], +t[3], +t[4]];
      const c1 = pal[t[5]] || [0, 0, 0], c2 = pal[t[6]] || [0, 0, 0];
      for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) {
        const f = t[0] === "vgrad" ? (rh <= 1 ? 0 : (yy - y) / (rh - 1)) : (rw <= 1 ? 0 : (xx - x) / (rw - 1));
        put(xx, yy, [c1[0] + (c2[0] - c1[0]) * f, c1[1] + (c2[1] - c1[1]) * f, c1[2] + (c2[2] - c1[2]) * f]);
      }
    } else if (t[0] === "circle") {
      const [x, y, r] = [+t[1], +t[2], +t[3]];
      const rgb = pal[t[4]] || [255, 0, 255];
      for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
        if ((xx - x) * (xx - x) + (yy - y) * (yy - y) <= r * r) put(xx, yy, rgb);
      }
    }
  }
  for (const c of jtm.cells || []) {
    const rowsN = c.px.length;
    for (let sy = 0; sy < rowsN; sy++) {
      const row = rleExpand(c.px[sy]);
      const colsN = row.length;
      for (let sx = 0; sx < colsN; sx++) {
        const rgb = pal[row[sx]] || [255, 0, 255];
        const x0 = c.x + Math.floor(sx * c.w / colsN);
        const x1 = c.x + Math.floor((sx + 1) * c.w / colsN);
        const y0 = c.y + Math.floor(sy * c.h / rowsN);
        const y1 = c.y + Math.floor((sy + 1) * c.h / rowsN);
        for (let y = y0; y < Math.max(y1, y0 + 1); y++) for (let x = x0; x < Math.max(x1, x0 + 1); x++) put(x, y, rgb);
      }
    }
  }
  return out;
}

// ---------- diff ----------

function diffScore(a, b, cellSize) {
  const { w, h } = a;
  const cols = Math.ceil(w / cellSize), rows = Math.ceil(h / cellSize);
  const scores = [];
  let total = 0;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      let sum = 0, n = 0;
      const x0 = cx * cellSize, y0 = cy * cellSize;
      for (let y = y0; y < Math.min(h, y0 + cellSize); y++) {
        for (let x = x0; x < Math.min(w, x0 + cellSize); x++) {
          const i = (y * w + x) * 4;
          sum += Math.sqrt(dist2([a.data[i], a.data[i + 1], a.data[i + 2]], [b.data[i], b.data[i + 1], b.data[i + 2]]));
          n++;
        }
      }
      const s = sum / n; // mean RGB distance, 0..441
      scores.push({ cx, cy, score: s });
      total += s;
    }
  }
  return { scores, mean: total / scores.length, cols, rows };
}

// ---------- refine: the render/diff/improve loop ----------
// Re-rasterize the worst-scoring cells at higher resolution and append them as
// override blocks (drawn last, so they win). Returns count of refined cells.

function refine(img, jtm, opts = {}) {
  const cellSize = opts.cellSize ?? 16;
  const threshold = opts.threshold ?? 40;
  const sub = opts.refineSub ?? 16;
  const maxColors = opts.refineColors ?? 6;
  const out = { data: new Uint8ClampedArray(img.w * img.h * 4), w: img.w, h: img.h };
  decode(jtm, out);
  const d = diffScore(img, out, cellSize);
  const palette = makePalette(opts.paletteTol ?? 20);
  for (const k in jtm.palette) palette.key(unhex(jtm.palette[k])); // seed with existing palette
  let refined = 0;
  for (const s of d.scores) {
    if (s.score < threshold) continue;
    const x = s.cx * cellSize, y = s.cy * cellSize;
    const cell = { x, y, w: Math.min(cellSize, img.w - x), h: Math.min(cellSize, img.h - y) };
    const px = cellRaster(img, cell, sub, maxColors, palette).map(rle);
    jtm.cells.push({ x: cell.x, y: cell.y, w: cell.w, h: cell.h, px });
    refined++;
  }
  jtm.palette = palette.toObject();
  return { refined, meanBefore: d.mean };
}

if (typeof module !== "undefined") {
  module.exports = { encode, decode, refine, jtmToText, sliceCells, classify, diffScore, rle, rleExpand, hex, unhex };
}
if (typeof window !== "undefined") {
  window.GTC = { encode, decode, refine, jtmToText, sliceCells, classify, diffScore, rle, rleExpand, hex, unhex };
}
