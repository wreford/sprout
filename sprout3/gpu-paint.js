// A WebGPU painter for Sprout games. Every circle, rect and line of a frame goes into one instance buffer
// and is drawn in a single call, in the order the game drew them (later shapes on top).
// Shapes are smoothed in the fragment shader, so circles and lines have soft edges like Canvas 2D.
// Text is handed back to the caller, to draw on a 2D canvas laid over the top.
(function (root) {
"use strict";

const WGSL = `
struct U { size : vec2f, scale : f32, pad : f32, shift : vec2f, pad2 : vec2f };
@group(0) @binding(0) var<uniform> u : U;
struct VIn { @builtin(vertex_index) vi : u32, @location(0) a : vec4f, @location(1) b : vec4f, @location(2) col : vec4f };
struct VOut {
  @builtin(position) pos : vec4f, @location(0) p : vec2f,
  @location(1) @interpolate(flat) a : vec4f, @location(2) @interpolate(flat) b : vec4f, @location(3) @interpolate(flat) col : vec4f
};
// kind 0: rect (a = x1 y1 x2 y2)   kind 1: circle (a = x y r)   kind 2: line (a = x1 y1 x2 y2, b.y = width)
@vertex fn vs(v : VIn) -> VOut {
  let c = vec2f(f32(v.vi & 1u), f32(v.vi >> 1u));
  let edge = 1.0 / u.scale;
  var p : vec2f;
  if (v.b.x < 0.5) {
    p = mix(v.a.xy, v.a.zw, c);
  } else if (v.b.x < 1.5) {
    p = v.a.xy + (c * 2.0 - 1.0) * (v.a.z + edge);
  } else {
    let d = v.a.zw - v.a.xy; let len = length(d);
    var dir = vec2f(1.0, 0.0); if (len > 1e-5) { dir = d / len; }
    let nrm = vec2f(-dir.y, dir.x); let hw = v.b.y * 0.5 + edge;
    p = v.a.xy - dir * hw + dir * (len + 2.0 * hw) * c.x + nrm * (c.y * 2.0 - 1.0) * hw;
  }
  let q = (p + u.shift) * u.scale;
  var o : VOut;
  o.pos = vec4f(q.x / u.size.x * 2.0 - 1.0, 1.0 - q.y / u.size.y * 2.0, 0.0, 1.0);
  o.p = p; o.a = v.a; o.b = v.b; o.col = v.col;
  return o;
}
@fragment fn fs(i : VOut) -> @location(0) vec4f {
  var cover = 1.0;
  if (i.b.x > 0.5 && i.b.x < 1.5) {
    cover = clamp(0.5 - (distance(i.p, i.a.xy) - i.a.z) * u.scale, 0.0, 1.0);
  } else if (i.b.x > 1.5) {
    let pa = i.p - i.a.xy; let ba = i.a.zw - i.a.xy;
    let h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    cover = clamp(0.5 - (length(pa - ba * h) - i.b.y * 0.5) * u.scale, 0.0, 1.0);
  }
  let a = i.col.a * cover;
  if (a <= 0.0) { discard; }
  return vec4f(i.col.rgb * a, a);
}`;

// CSS colours to [r, g, b, a] from 0 to 1, worked out once per colour by a 2D canvas
function colourParser() {
  const c = document.createElement("canvas").getContext("2d"), cache = new Map();
  return s => {
    let v = cache.get(s); if (v) return v;
    c.fillStyle = "#000"; c.fillStyle = s; const f = c.fillStyle;
    if (f[0] === "#") v = [parseInt(f.slice(1, 3), 16) / 255, parseInt(f.slice(3, 5), 16) / 255, parseInt(f.slice(5, 7), 16) / 255, 1];
    else { const m = f.match(/[\d.]+/g) || [0, 0, 0, 1]; v = [m[0] / 255, m[1] / 255, m[2] / 255, m[3] === undefined ? 1 : +m[3]]; }
    if (cache.size > 4096) cache.clear();
    cache.set(s, v); return v;
  };
}

async function makeGpuPainter(canvas) {
  if (!root.navigator || !navigator.gpu) return null;
  const adapter = await navigator.gpu.requestAdapter(); if (!adapter) return null;
  const device = await adapter.requestDevice();
  const ctx = canvas.getContext("webgpu"); if (!ctx) return null;
  // the GPU can be lost (the phone sleeps, the driver resets): from then on paint gives null, and the page uses Canvas 2D
  let lost = false;
  device.lost.then(() => { lost = true; });
  const format = navigator.gpu.getPreferredCanvasFormat();
  ctx.configure({ device, format, alphaMode: "premultiplied" });
  const module = device.createShaderModule({ code: WGSL });
  const blend = { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" };
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module, entryPoint: "vs", buffers: [{ arrayStride: 48, stepMode: "instance", attributes: [
      { shaderLocation: 0, offset: 0, format: "float32x4" }, { shaderLocation: 1, offset: 16, format: "float32x4" }, { shaderLocation: 2, offset: 32, format: "float32x4" }] }] },
    fragment: { module, entryPoint: "fs", targets: [{ format, blend: { color: blend, alpha: blend } }] },
    primitive: { topology: "triangle-strip" }
  });
  const ubuf = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const bind = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: ubuf } }] });
  const colour = colourParser(), uni = new Float32Array(8);
  let cap = 0, vbuf = null, data = null;
  const grow = n => { if (n <= cap) return; cap = 1024; while (cap < n) cap *= 2; if (vbuf) vbuf.destroy(); vbuf = device.createBuffer({ size: cap * 48, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST }); data = new Float32Array(cap * 12); };
  const str = c => typeof c === "string" ? c : String(c);
  const put = (n, a0, a1, a2, a3, kind, w, col) => { const o = n * 12, k = colour(str(col)); data[o] = a0; data[o + 1] = a1; data[o + 2] = a2; data[o + 3] = a3; data[o + 4] = kind; data[o + 5] = w; data[o + 8] = k[0]; data[o + 9] = k[1]; data[o + 10] = k[2]; data[o + 11] = k[3]; };

  // draw one frame's draw list into a texture of tw by th pixels; gives back the texts, for a 2D canvas on top
  function encode(list, view, tw, th, gw, gh, sx, sy) {
    grow(list.length + 1);
    let n = 0, clear = [0, 0, 0, 1]; const texts = [];
    for (let i = 0; i < list.length; i++) {
      const name = list[i][0], a = list[i][1];
      switch (name) {
        case "clear": if (n === 0) clear = colour(str(a[0])); else put(n++, 0, 0, gw, gh, 0, 0, a[0]); break;
        case "rect": put(n++, a[0], a[1], a[0] + a[2], a[1] + a[3], 0, 0, a[4]); break;
        case "circle": if (a[2] > 0) put(n++, a[0], a[1], a[2], 0, 1, 0, a[3]); break;
        case "line": put(n++, a[0], a[1], a[2], a[3], 2, 2, a[4]); break;
        case "text": texts.push(a); break;
      }
    }
    uni[0] = tw; uni[1] = th; uni[2] = tw / gw; uni[4] = sx || 0; uni[5] = sy || 0;
    device.queue.writeBuffer(ubuf, 0, uni);
    if (n) device.queue.writeBuffer(vbuf, 0, data, 0, n * 12);
    const enc = device.createCommandEncoder();
    const pass = enc.beginRenderPass({ colorAttachments: [{ view, loadOp: "clear", storeOp: "store",
      clearValue: { r: clear[0] * clear[3], g: clear[1] * clear[3], b: clear[2] * clear[3], a: clear[3] } }] });
    if (n) { pass.setPipeline(pipeline); pass.setBindGroup(0, bind); pass.setVertexBuffer(0, vbuf); pass.draw(4, n); }
    pass.end();
    return { enc, texts };
  }
  // draw one frame. Safari can give no texture for a frame (after the canvas is resized, or while the page is hidden):
  // the canvas is configured again and asked once more, and if there's still nothing, paint gives null and the page
  // draws that frame with Canvas 2D.
  function paint(list, gw, gh, sx, sy) {
    if (lost) return null;
    let texture = ctx.getCurrentTexture();
    if (!texture) { try { ctx.configure({ device, format, alphaMode: "premultiplied" }); texture = ctx.getCurrentTexture(); } catch (e) { texture = null; } }
    if (!texture) return null;
    const frame = encode(list, texture.createView(), canvas.width, canvas.height, gw, gh, sx, sy);
    device.queue.submit([frame.enc.finish()]);
    return frame.texts;
  }

  // a self-test before trusting the GPU: draw a known scene off screen and read three pixels back.
  // Red square on the left, green circle on the right, blue behind. Any error or a wrong pixel, and the page keeps Canvas 2D.
  async function selfTest() {
    const W = 32, tex = device.createTexture({ size: [W, W], format, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC });
    const r = encode([["clear", ["#0000ff"]], ["rect", [0, 0, 16, 32, "#ff0000"]], ["circle", [24, 16, 6, "#00ff00"]]], tex.createView(), W, W, W, W, 0, 0);
    const buf = device.createBuffer({ size: 256 * W, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    r.enc.copyTextureToBuffer({ texture: tex }, { buffer: buf, bytesPerRow: 256 }, [W, W]);
    device.queue.submit([r.enc.finish()]);
    const timeout = new Promise((_, no) => setTimeout(() => no(new Error("the GPU didn't answer")), 2000));
    await Promise.race([buf.mapAsync(GPUMapMode.READ), timeout]);
    const px = new Uint8Array(buf.getMappedRange()).slice(), bgra = format.startsWith("bgra");
    buf.unmap(); buf.destroy(); tex.destroy();
    const at = (x, y) => { const o = y * 256 + x * 4; return bgra ? [px[o + 2], px[o + 1], px[o]] : [px[o], px[o + 1], px[o + 2]]; };
    const near = (c, want) => c.every((v, i) => Math.abs(v - want[i]) < 40);
    if (!(near(at(8, 16), [255, 0, 0]) && near(at(24, 16), [0, 255, 0]) && near(at(24, 2), [0, 0, 255]))) throw new Error("the GPU drew the test scene wrong");
    return true;
  }
  // draw a list off screen and read the pixels back as RGBA rows: for tests and benchmarks
  async function snapshot(list, gw, gh, w, h) {
    const row = Math.ceil(w * 4 / 256) * 256, tex = device.createTexture({ size: [w, h], format, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC });
    const r = encode(list, tex.createView(), w, h, gw, gh, 0, 0), buf = device.createBuffer({ size: row * h, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    r.enc.copyTextureToBuffer({ texture: tex }, { buffer: buf, bytesPerRow: row }, [w, h]); device.queue.submit([r.enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);
    const raw = new Uint8Array(buf.getMappedRange()), out = new Uint8Array(w * h * 4), bgra = format.startsWith("bgra");
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * row + x * 4, o = (y * w + x) * 4; out[o] = raw[i + (bgra ? 2 : 0)]; out[o + 1] = raw[i + 1]; out[o + 2] = raw[i + (bgra ? 0 : 2)]; out[o + 3] = raw[i + 3]; }
    buf.unmap(); buf.destroy(); tex.destroy();
    return out;
  }
  // time k frames drawn off screen: the CPU cost of building and submitting each one, and the total until the GPU has finished them
  async function timeFrames(list, gw, gh, w, h, k) {
    const tex = device.createTexture({ size: [w, h], format, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC }), view = tex.createView();
    const sync = device.createBuffer({ size: 256, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const t0 = performance.now(); let cpu = 0;
    for (let i = 0; i < k; i++) { const c0 = performance.now(); const r = encode(list, view, w, h, gw, gh, 0, 0); device.queue.submit([r.enc.finish()]); cpu += performance.now() - c0; }
    const e = device.createCommandEncoder(); e.copyTextureToBuffer({ texture: tex }, { buffer: sync, bytesPerRow: 256 }, [1, 1]); device.queue.submit([e.finish()]);
    await sync.mapAsync(GPUMapMode.READ); const total = performance.now() - t0;
    sync.unmap(); sync.destroy(); tex.destroy();
    return { cpu: cpu / k, total: total / k };
  }
  const info = adapter.info || {};
  const painter = { paint, snapshot, timeFrames, device, name: "WebGPU", get lost() { return lost; }, adapter: [info.vendor, info.architecture].filter(Boolean).join(" "), done: () => device.queue.onSubmittedWorkDone() };
  await selfTest();
  return painter;
}

root.SproutGpu = { makeGpuPainter };
})(typeof window !== "undefined" ? window : globalThis);
