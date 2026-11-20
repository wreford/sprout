// Spork on the GPU (decision 93): a kernel worked out ahead (decision 91) as a WebGPU compute shader.
// The GPU does 32-bit maths, so its answers can differ from WebAssembly and JavaScript in the last digits;
// the host chooses whether big sporks may use it.
// A GPU answer comes back later, but Sprout runs straight through, so the page runs a program in passes:
// a spork the GPU hasn't answered yet starts a job and stops the pass (SPORK_WAIT); when the jobs are done
// the program runs again from the start and finds the answers waiting. Games never wait: they use SIMD.
(function (root) {
"use strict";
const WAIT = { spork: "wait" };

// a 32-bit float constant, written as its exact bits (WGSL has no literal for infinity or NaN)
const f32bits = v => { const b = new Uint32Array(new Float32Array([v]).buffer)[0]; return "bitcast<f32>(0x" + b.toString(16) + "u)"; };

function wgsl(K) {
  const N = K.nodes, r = i => "v" + i, types = new Array(N.length);
  let body = "";
  for (let i = 0; i < N.length; i++) {
    const [op, a, b, c, v] = N[i]; let e, ty = "f32";
    switch (op) {
      case "c": e = f32bits(v); break;
      case "cb": e = String(v); ty = "bool"; break;
      case "x": e = "x"; break;
      case "k": e = "C[" + v + "]"; break;
      case "add": e = r(a) + " + " + r(b); break; case "sub": e = r(a) + " - " + r(b); break;
      case "mul": e = r(a) + " * " + r(b); break; case "div": e = r(a) + " / " + r(b); break;
      case "min": case "max": e = op + "(" + r(a) + ", " + r(b) + ")"; break;
      case "noise": e = "noise2(" + r(a) + ", " + r(b) + ")"; break;
      case "neg": e = "-" + r(a); break;
      case "abs": case "floor": case "ceil": case "sqrt": e = op + "(" + r(a) + ")"; break;
      case "round": e = "floor(" + r(a) + " + 0.5)"; break;
      case "lt": case "gt": case "le": case "ge": case "eq": case "ne": case "beq":
        e = r(a) + ({ lt: " < ", gt: " > ", le: " <= ", ge: " >= ", eq: " == ", ne: " != ", beq: " == " })[op] + r(b); ty = "bool"; break;
      case "and": e = r(a) + " && " + r(b); ty = "bool"; break;
      case "or": e = r(a) + " || " + r(b); ty = "bool"; break;
      case "not": e = "!" + r(a); ty = "bool"; break;
      case "sel": e = "select(" + r(c) + ", " + r(b) + ", " + r(a) + ")"; ty = types[b]; break;
      default: throw new Error("no GPU step for " + op);
    }
    types[i] = ty;
    body += "  let v" + i + ": " + ty + " = " + e + ";\n";
  }
  const guards = K.guards.length ? "  if (!(" + K.guards.map(r).join(" && ") + ")) { atomicStore(&bad, 1u); }\n" : "";
  const outs = K.outs.map((o, j) => "  O[" + (j ? j + "u * p.n + " : "") + "i] = " + (K.kind === "b" ? "select(0.0, 1.0, " + r(o) + ")" : r(o)) + ";\n").join("");
  return `struct P { n: u32, hasX: u32, nx: u32, pad: u32 }
@group(0) @binding(0) var<uniform> p: P;
@group(0) @binding(1) var<storage, read> C: array<f32>;
@group(0) @binding(2) var<storage, read> X: array<f32>;
@group(0) @binding(3) var<storage, read_write> O: array<f32>;
@group(0) @binding(4) var<storage, read_write> bad: atomic<u32>;
// noise [x, y]: the same 32-bit hash as the CPU, on 32-bit inputs
fn noise2(x: f32, y: f32) -> f32 {
  let fx = floor(x); let fy = floor(y);
  var h = ((bitcast<u32>(i32(fx)) ^ 0x9e3779b9u) * 0x85ebca6bu) ^ ((bitcast<u32>(i32(fy)) + 0x632be5abu) * 0xc2b2ae35u)
    ^ (u32(floor((x - fx) * 4294967296.0)) * 0x27d4eb2fu) ^ (u32(floor((y - fy) * 4294967296.0)) * 0x165667b1u);
  h = h ^ (h >> 16u); h = h * 0x7feb352du; h = h ^ (h >> 15u); h = h * 0x846ca68bu; h = h ^ (h >> 16u);
  return f32(h) / 4294967296.0;
}
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) g: vec3<u32>) {
  let i = g.x + g.y * p.nx * 256u;
  if (i >= p.n) { return; }
  var x: f32 = f32(i + 1u);
  if (p.hasX == 1u) { x = X[i]; }
${body}${guards}${outs}}
`;
}
const shader = wgsl;

async function makeGpuSpork(opts) {
  opts = opts || {};
  if (typeof navigator === "undefined" || !navigator.gpu) throw new Error("this browser has no WebGPU");
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
  if (!adapter) throw new Error("no GPU adapter");
  const device = await adapter.requestDevice();
  const info = adapter.info || {};
  const layout = device.createBindGroupLayout({ entries: [
    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
    { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
    { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } }] });
  const plLayout = device.createPipelineLayout({ bindGroupLayouts: [layout] });
  const pipes = new Map();
  const pipeFor = K => {
    const code = shader(K);
    let p = pipes.get(code);
    if (!p) { p = device.createComputePipelineAsync({ layout: plLayout, compute: { module: device.createShaderModule({ code }), entryPoint: "main" } }); pipes.set(code, p); }
    return p;
  };
  const MAXN = 1 << 24;   // the input is a 32-bit float: whole numbers are exact up to 2^24
  // run a kernel on n inputs: Float64Array outputs, or null if a check failed
  async function run(K, n, X, C) {
    const pipe = await pipeFor(K), nOut = K.outs.length;
    const buf = (size, usage) => device.createBuffer({ size: Math.max(16, (size + 3) & ~3), usage });
    const S = GPUBufferUsage;
    const ub = buf(16, S.UNIFORM | S.COPY_DST), cb = buf(C.length * 4, S.STORAGE | S.COPY_DST), xb = buf(X ? n * 4 : 4, S.STORAGE | S.COPY_DST);
    const ob = buf(nOut * n * 4, S.STORAGE | S.COPY_SRC), bb = buf(4, S.STORAGE | S.COPY_SRC | S.COPY_DST);
    const rb = buf(nOut * n * 4 + 16, S.MAP_READ | S.COPY_DST);
    const groups = Math.ceil(n / 256), nx = Math.min(groups, 65535), ny = Math.ceil(groups / nx);
    device.queue.writeBuffer(ub, 0, new Uint32Array([n, X ? 1 : 0, nx, 0]));
    if (C.length) device.queue.writeBuffer(cb, 0, new Float32Array(C));
    if (X) device.queue.writeBuffer(xb, 0, new Float32Array(X));
    device.queue.writeBuffer(bb, 0, new Uint32Array([0]));
    const bg = device.createBindGroup({ layout, entries: [ub, cb, xb, ob, bb].map((b, i) => ({ binding: i, resource: { buffer: b } })) });
    const enc = device.createCommandEncoder(), pass = enc.beginComputePass();
    pass.setPipeline(pipe); pass.setBindGroup(0, bg); pass.dispatchWorkgroups(nx, ny); pass.end();
    const outBytes = nOut * n * 4, off = (outBytes + 15) & ~15;
    enc.copyBufferToBuffer(ob, 0, rb, 0, outBytes);
    enc.copyBufferToBuffer(bb, 0, rb, off, 4);
    device.queue.submit([enc.finish()]);
    await rb.mapAsync(GPUMapMode.READ);
    const m = rb.getMappedRange(), f = new Float32Array(m, 0, nOut * n), failed = new Uint32Array(m, off, 1)[0] !== 0;
    const O = failed ? null : K.outs.map((o, j) => Float64Array.from(f.subarray(j * n, (j + 1) * n)));
    rb.unmap(); [ub, cb, xb, ob, bb, rb].forEach(b => b.destroy());
    return O;
  }

  // the hook spork calls: an answer already back, or (when a pass may wait) a new job and SPORK_WAIT
  const ids = new WeakMap(); let nextId = 1;
  const answers = new Map(), jobs = [];
  let mayWait = false, min = opts.min || 100000, last = null;
  const keyOf = (K, n, X, C) => {
    let id = ids.get(K); if (!id) { id = shader(K); ids.set(K, id); }
    let h = 2166136261;
    if (X) { const u = new Uint32Array(X.buffer, X.byteOffset, X.length * 2); for (let i = 0; i < u.length; i++) h = Math.imul(h ^ u[i], 16777619); }
    return id + "|" + n + "|" + (X ? "x" + (h >>> 0) : "r") + "|" + C.join(",");
  };
  function hook(K, n, X, C) {
    if (n < min || n > MAXN) return undefined;
    const key = keyOf(K, n, X, C);
    if (answers.has(key)) { const a = answers.get(key); last = a.info; return a.O; }
    if (!mayWait) return undefined;
    const t0 = performance.now();
    jobs.push(run(K, n, X, C).then(O => {
      const info = { n, ms: performance.now() - t0 };
      if (O) O.ms = info.ms;
      answers.set(key, { O, info }); while (answers.size > 8) answers.delete(answers.keys().next().value);
    }));
    throw WAIT;
  }
  return {
    hook, run, wgsl: shader, WAIT, device, adapter: [info.vendor, info.architecture || info.device].filter(Boolean).join(" ") || "available",
    get last() { return last; },
    // the page's own passes: let a spork start a job and stop the pass, then wait for the jobs
    mayWait(on) { mayWait = !!on; if (on) jobs.length = 0; },
    pending() { return Promise.all(jobs.splice(0)); },
    set min(v) { min = v; },
    // run a whole program (a function that runs it), waiting for the GPU as needed; at most a few passes
    async passes(go, onWait) {
      for (let k = 0; k < 6; k++) {
        mayWait = true; jobs.length = 0;
        try { const r = go(); mayWait = false; return r; }
        catch (e) { mayWait = false; if (e !== WAIT) throw e; }
        if (onWait) onWait();
        await Promise.all(jobs.splice(0));
      }
      return go();
    },
    forget() { answers.clear(); },
  };
}

root.SproutGpuSpork = { makeGpuSpork, wgsl: shader, WAIT };
})(typeof window !== "undefined" ? window : globalThis);
