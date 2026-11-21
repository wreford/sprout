// Spork on the GPU (decision 93): a kernel worked out ahead (decision 91) as a WebGPU compute shader.
// The GPU does 32-bit math, so its answers can differ from WebAssembly and JavaScript in the last digits;
// the host chooses whether big sporks may use it.
// A GPU answer comes back later, but Sprout runs straight through, so the page runs a program in passes:
// a spork the GPU hasn't answered yet starts a job and stops the pass (SPORK_WAIT); when the jobs are done
// the program runs again from the start and finds the answers waiting. Games never wait: they use SIMD.
(function (root) {
"use strict";
const WAIT = { spork: "wait" };

// a 32-bit float constant, written as its exact bits (WGSL has no literal for infinity or NaN)
const f32bits = v => { const b = new Uint32Array(new Float32Array([v]).buffer)[0]; return "bitcast<f32>(0x" + b.toString(16) + "u)"; };

function wgsl(kernel) {
  const nodes = kernel.nodes, r = i => "v" + i, types = new Array(nodes.length);
  let body = "";
  for (let i = 0; i < nodes.length; i++) {
    const [op, a, b, c, v] = nodes[i]; let e, ty = "f32";
    switch (op) {
      case "constant": e = f32bits(v); break;
      case "constantBool": e = String(v); ty = "bool"; break;
      case "input": e = "item"; break;
      case "outside": e = "outside[" + v + "]"; break;
      case "add": e = r(a) + " + " + r(b); break; case "sub": e = r(a) + " - " + r(b); break;
      case "mul": e = r(a) + " * " + r(b); break; case "div": e = r(a) + " / " + r(b); break;
      case "min": case "max": e = op + "(" + r(a) + ", " + r(b) + ")"; break;
      case "noise": e = "noise2(" + r(a) + ", " + r(b) + ")"; break;
      case "neg": e = "-" + r(a); break;
      case "abs": case "floor": case "ceil": case "sqrt": e = op + "(" + r(a) + ")"; break;
      case "round": e = "floor(" + r(a) + " + 0.5)"; break;
      case "lt": case "gt": case "le": case "ge": case "eq": case "ne": case "boolEquals":
        e = r(a) + ({ lt: " < ", gt: " > ", le: " <= ", ge: " >= ", eq: " == ", ne: " != ", boolEquals: " == " })[op] + r(b); ty = "bool"; break;
      case "and": e = r(a) + " && " + r(b); ty = "bool"; break;
      case "or": e = r(a) + " || " + r(b); ty = "bool"; break;
      case "not": e = "!" + r(a); ty = "bool"; break;
      case "choose": e = "select(" + r(c) + ", " + r(b) + ", " + r(a) + ")"; ty = types[b]; break;
      default: throw new Error("no GPU step for " + op);
    }
    types[i] = ty;
    body += "  let v" + i + ": " + ty + " = " + e + ";\n";
  }
  const guards = kernel.checks.length ? "  if (!(" + kernel.checks.map(r).join(" && ") + ")) { atomicStore(&failed, 1u); }\n" : "";
  const outs = kernel.outputs.map((o, j) => "  outputs[" + (j ? j + "u * params.count + " : "") + "i] = " + (kernel.kind === "bools" ? "select(0.0, 1.0, " + r(o) + ")" : r(o)) + ";\n").join("");
  return `struct Params { count: u32, hasInputs: u32, groupsAcross: u32, pad: u32 }
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> outside: array<f32>;
@group(0) @binding(2) var<storage, read> inputs: array<f32>;
@group(0) @binding(3) var<storage, read_write> outputs: array<f32>;
@group(0) @binding(4) var<storage, read_write> failed: atomic<u32>;
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
  let i = g.x + g.y * params.groupsAcross * 256u;
  if (i >= params.count) { return; }
  var item: f32 = f32(i + 1u);
  if (params.hasInputs == 1u) { item = inputs[i]; }
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
  const pipelineFor = kernel => {
    const code = shader(kernel);
    let p = pipes.get(code);
    if (!p) { p = device.createComputePipelineAsync({ layout: plLayout, compute: { module: device.createShaderModule({ code }), entryPoint: "main" } }); pipes.set(code, p); }
    return p;
  };
  const MAXN = 1 << 24;   // the input is a 32-bit float: whole numbers are exact up to 2^24
  // run a kernel on n inputs: Float64Array outputs, or null if a check failed
  async function run(kernel, n, inputs, outside) {
    const pipe = await pipelineFor(kernel), outputCount = kernel.outputs.length;
    const makeBuffer = (size, usage) => device.createBuffer({ size: Math.max(16, (size + 3) & ~3), usage });
    const USAGE = GPUBufferUsage;
    const paramsBuffer = makeBuffer(16, USAGE.UNIFORM | USAGE.COPY_DST), outsideBuffer = makeBuffer(outside.length * 4, USAGE.STORAGE | USAGE.COPY_DST), inputBuffer = makeBuffer(inputs ? n * 4 : 4, USAGE.STORAGE | USAGE.COPY_DST);
    const outputBuffer = makeBuffer(outputCount * n * 4, USAGE.STORAGE | USAGE.COPY_SRC), failedBuffer = makeBuffer(4, USAGE.STORAGE | USAGE.COPY_SRC | USAGE.COPY_DST);
    const readBuffer = makeBuffer(outputCount * n * 4 + 16, USAGE.MAP_READ | USAGE.COPY_DST);
    const groups = Math.ceil(n / 256), groupsAcross = Math.min(groups, 65535), groupsDown = Math.ceil(groups / groupsAcross);
    device.queue.writeBuffer(paramsBuffer, 0, new Uint32Array([n, inputs ? 1 : 0, groupsAcross, 0]));
    if (outside.length) device.queue.writeBuffer(outsideBuffer, 0, new Float32Array(outside));
    if (inputs) device.queue.writeBuffer(inputBuffer, 0, new Float32Array(inputs));
    device.queue.writeBuffer(failedBuffer, 0, new Uint32Array([0]));
    const bindGroup = device.createBindGroup({ layout, entries: [paramsBuffer, outsideBuffer, inputBuffer, outputBuffer, failedBuffer].map((b, i) => ({ binding: i, resource: { buffer: b } })) });
    const encoder = device.createCommandEncoder(), pass = encoder.beginComputePass();
    pass.setPipeline(pipe); pass.setBindGroup(0, bindGroup); pass.dispatchWorkgroups(groupsAcross, groupsDown); pass.end();
    const outBytes = outputCount * n * 4, failedOffset = (outBytes + 15) & ~15;
    encoder.copyBufferToBuffer(outputBuffer, 0, readBuffer, 0, outBytes);
    encoder.copyBufferToBuffer(failedBuffer, 0, readBuffer, failedOffset, 4);
    device.queue.submit([encoder.finish()]);
    await readBuffer.mapAsync(GPUMapMode.READ);
    const m = readBuffer.getMappedRange(), f = new Float32Array(m, 0, outputCount * n), anyFailed = new Uint32Array(m, failedOffset, 1)[0] !== 0;
    const outputs = anyFailed ? null : kernel.outputs.map((o, j) => Float64Array.from(f.subarray(j * n, (j + 1) * n)));
    readBuffer.unmap(); [paramsBuffer, outsideBuffer, inputBuffer, outputBuffer, failedBuffer, readBuffer].forEach(b => b.destroy());
    return outputs;
  }

  // the hook spork calls: an answer already back, or (when a pass may wait) a new job and SPORK_WAIT
  const ids = new WeakMap(); let nextId = 1;
  const answers = new Map(), jobs = [];
  let mayWait = false, min = opts.min || 100000, last = null;
  const keyOf = (kernel, n, inputs, outside) => {
    let id = ids.get(kernel); if (!id) { id = shader(kernel); ids.set(kernel, id); }
    let h = 2166136261;
    if (inputs) { const u = new Uint32Array(inputs.buffer, inputs.byteOffset, inputs.length * 2); for (let i = 0; i < u.length; i++) h = Math.imul(h ^ u[i], 16777619); }
    return id + "|" + n + "|" + (inputs ? "x" + (h >>> 0) : "r") + "|" + outside.join(",");
  };
  function hook(kernel, n, inputs, outside) {
    if (n < min || n > MAXN) return undefined;
    const key = keyOf(kernel, n, inputs, outside);
    if (answers.has(key)) { const a = answers.get(key); last = a.info; return a.outputs; }
    if (!mayWait) return undefined;
    const t0 = performance.now();
    jobs.push(run(kernel, n, inputs, outside).then(outputs => {
      const info = { n, ms: performance.now() - t0 };
      if (outputs) outputs.ms = info.ms;
      answers.set(key, { outputs, info }); while (answers.size > 8) answers.delete(answers.keys().next().value);
    }));
    throw WAIT;
  }
  return {
    hook, run, wgsl: shader, WAIT, device, adapter: [...new Set([info.vendor, info.architecture || info.device].filter(Boolean))].join(" ") || "available",
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
