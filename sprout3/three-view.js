// The 3D view (decision 108): a game's draw list may hold 3D words, and this draws them with three.js.
// Each frame the list is the whole scene, as with the 2D words: view (the camera), block (a box with a texture or a
// colour), model (a glTF model, posed by the game's own clock), hold (a model held in front of the camera), flash (a
// light with a glow) and fog. The scene objects are kept from frame to frame and reused, so a frame only moves them.
// Models are scaled to the height asked for and stood on the floor, whatever size they were made at.
import * as THREE from "./vendor/three/three.module.min.js";
import { GLTFLoader } from "./vendor/three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "./vendor/three/addons/libs/meshopt_decoder.module.js";
import * as SkeletonUtils from "./vendor/three/addons/utils/SkeletonUtils.js";

const WORDS = new Set(["view", "block", "model", "hold", "flash", "fog", "light", "sky", "beam"]);
const fmt = v => typeof v === "string" ? v : window.Sprout3 ? Sprout3.format(v) : String(v);
const num = (v, d) => typeof v === "number" && isFinite(v) ? v : d;
// Sprout's angles: 0 looks along +x, and they turn towards +z. three.js cameras look down -z, models face +z.
const cameraYaw = a => -a - Math.PI / 2, modelYaw = a => Math.PI / 2 - a;

// opts.lowRes: draw this many pixels across and let the page stretch them, for a chunky old-console look
export function makeView(canvas, base, opts) {
  opts = opts || {};
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !opts.lowRes, alpha: false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // filmic tone mapping: brighter highlights roll off softly instead of clipping, and the darks keep their colour
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.45;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(70, 0.75, 0.05, 200);
  scene.add(camera);
  // a cool sky light from above and a warm bounce from the floor, with a key light from one side
  const hemi = new THREE.HemisphereLight(0xdde6f5, 0x3a2e22, 1.25); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.35); sun.position.set(4, 10, 3); scene.add(sun);
  // light [sky colour, floor colour, key colour, strength]: each frame's lighting; without it, these defaults
  const LIGHT_DEFAULT = [0xdde6f5, 0x3a2e22, 0xfff1dc, 1];
  // the gun in your hands has its own scene and camera, drawn over the world: it sits the same in the corner however
  // wide the view is (a wide view would otherwise shrink it into the middle), lit by the same lights
  const holdScene = new THREE.Scene(), holdCamera = new THREE.PerspectiveCamera(62, 0.75, 0.01, 10);
  holdScene.add(holdCamera);
  const holdHemi = new THREE.HemisphereLight(0xdde6f5, 0x3a2e22, 1.25), holdSun = new THREE.DirectionalLight(0xfff1dc, 1.35);
  holdSun.position.set(-1.5, 2.5, 1.5); holdScene.add(holdHemi); holdScene.add(holdSun);
  // a flash close in front of you (your own shot) lights the gun in your hands as well as the room
  const holdFlash = new THREE.PointLight(0xffaa55, 0, 2.5, 2); holdFlash.position.set(0.1, -0.05, -0.85); holdScene.add(holdFlash);
  const holdGroup = new THREE.Group(); holdCamera.add(holdGroup);
  renderer.autoClear = false;
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const textureLoader = new THREE.TextureLoader();

  // ---- assets: models and textures, loaded once, by name
  const assets = new Map();   // name -> { scene, clips, size, ready }
  function asset(name) {
    let a = assets.get(name);
    if (!a) {
      a = { ready: false };
      assets.set(name, a);
      loader.load(base + "vendor/models/" + name + ".glb", gltf => {
        const box = new THREE.Box3().setFromObject(gltf.scene), size = box.getSize(new THREE.Vector3());
        a.scene = gltf.scene; a.clips = gltf.animations; a.height = size.y || 1; a.longest = Math.max(size.x, size.y, size.z) || 1; a.floor = box.min.y; a.centre = box.getCenter(new THREE.Vector3()); a.ready = true;
        gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; } });
      }, undefined, () => { a.failed = true; });
    }
    return a;
  }
  const textures = new Map(), materials = new Map(), skies = new Map();
  let soft = !!opts.soft;
  // the sky dome: a big ball round the camera, drawn first, never fogged
  const dome = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false }));
  dome.renderOrder = -1; dome.visible = false; scene.add(dome);
  let domeMap = null;
  function skyPainting(top, low) {
    const W = 512, H = 256, c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, top); gr.addColorStop(0.3, top); gr.addColorStop(0.5, low); gr.addColorStop(1, low); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // soft clouds in a band above the horizon, wrapping round so there's no seam (the same every time)
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 30; i++) {
      const x = rnd() * W, y = H * (0.33 + rnd() * 0.13), rx = 16 + rnd() * 40, ry = 3 + rnd() * 6, a = 0.14 + rnd() * 0.26;
      for (const dx of [-W, 0, W]) {
        const rg = g.createRadialGradient(x + dx, y, 0, x + dx, y, rx);
        rg.addColorStop(0, "rgba(255,255,255," + a + ")"); rg.addColorStop(1, "rgba(255,255,255,0)");
        g.save(); g.translate(x + dx, y); g.scale(1, ry / rx); g.translate(-(x + dx), -y); g.fillStyle = rg; g.beginPath(); g.arc(x + dx, y, rx, 0, Math.PI * 2); g.fill(); g.restore();
      }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData.low = new THREE.Color(low); return t;
  }
  function material(spec, sx, sy, sz) {
    const name = fmt(spec), isColour = /^#|^rgb/.test(name), key = isColour ? name : name + " " + sx + " " + sy + " " + sz;
    let m = materials.get(key);
    if (m) return m;
    // glow:#colour is lit from within: drawn at full brightness whatever the lights (lamps, screens, signs)
    if (/^glow:/.test(name)) { m = new THREE.MeshBasicMaterial({ color: new THREE.Color(name.slice(5, 12)), toneMapped: false }); materials.set(key, m); return m; }
    if (isColour) m = new THREE.MeshStandardMaterial({ color: new THREE.Color(name.slice(0, 7)), roughness: 0.9 });
    else {
      // a texture repeats once a metre; each size needs its own copy, made once the image has arrived. Two kinds:
      // sharp (the full image, each texel a hard square) and soft (cut down to 64 by 64 and filtered smoothly, the
      // slightly blurred look of the late-90s consoles' small textures); setSoft switches every material between them
      m = new THREE.MeshStandardMaterial({ color: 0x8a8a86, roughness: 0.95 });
      m.userData.tex = name; m.userData.rep = [Math.max(sx, sz), sy];
      let t = textures.get(name);
      if (!t) {
        t = { image: null, soft: null, waiting: [] }; textures.set(name, t);
        textureLoader.load(base + "vendor/textures/" + name + ".png", tex => {
          tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          const c = document.createElement("canvas"); c.width = c.height = 64; c.getContext("2d").drawImage(tex.image, 0, 0, 64, 64);
          const s = new THREE.CanvasTexture(c); s.colorSpace = THREE.SRGBColorSpace; s.wrapS = s.wrapT = THREE.RepeatWrapping;
          s.magFilter = THREE.LinearFilter; s.minFilter = THREE.LinearMipmapLinearFilter;
          t.image = tex; t.soft = s; for (const f of t.waiting.splice(0)) f(t);
        });
      }
      const give = tt => { const r = (soft ? tt.soft : tt.image).clone(); r.repeat.set(m.userData.rep[0], m.userData.rep[1]); m.map = r; m.color.set(0xffffff); m.needsUpdate = true; };
      m.userData.give = give;
      if (t.image) give(t); else t.waiting.push(give);
    }
    materials.set(key, m); return m;
  }

  // ---- objects kept between frames
  const blocks = new Map(), unitBox = new THREE.BoxGeometry(1, 1, 1);
  const pools = new Map();   // model name -> [{ root, mixer, actions }]
  const holds = new Map();
  const flashes = [], glow = new THREE.SphereGeometry(1, 16, 12);
  // beams: thin bright streaks between two points, a shot's tracer; a pool, reused frame to frame
  const beams = [], beamEnd = new THREE.Vector3();
  // blob shadows, as the old consoles did: a soft dark disc on the floor under everything that stands in the world
  const blobTexture = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 2, 32, 32, 31); r.addColorStop(0, "rgba(0,0,0,0.62)"); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const blobGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), blobMaterial = new THREE.MeshBasicMaterial({ map: blobTexture, transparent: true, depthWrite: false });
  function instance(name, k, parent) {
    const a = asset(name); if (!a.ready) return null;
    let pool = pools.get(name + (parent === holdGroup ? "@hold" : ""));
    if (!pool) { pool = []; pools.set(name + (parent === holdGroup ? "@hold" : ""), pool); }
    while (pool.length <= k) {
      const root = new THREE.Group(), body = SkeletonUtils.clone(a.scene);
      // a model in the world stands on the floor at its height, centred over where it is put (some files sit off their origin); one held is centred and measured by its longest side
      if (parent === holdGroup) { body.scale.setScalar(1 / a.longest); body.position.copy(a.centre).multiplyScalar(-1 / a.longest); }
      else { body.scale.setScalar(1 / a.height); body.position.set(-a.centre.x / a.height, -a.floor / a.height, -a.centre.z / a.height); }
      root.add(body); parent.add(root);
      if (parent !== holdGroup) { const blob = new THREE.Mesh(blobGeometry, blobMaterial); blob.scale.setScalar(0.62); blob.position.y = 0.012; blob.renderOrder = 1; root.add(blob); root.userData.blob = blob; }
      const mixer = a.clips.length ? new THREE.AnimationMixer(body) : null;
      pool.push({ root, mixer, actions: new Map(), current: null });
    }
    return pool[k];
  }
  // a model can hold another in its right hand (model's ninth argument): it goes on the wrist bone, so it moves with
  // every animation, and it's sized in the world (a fifth of the character's height) whatever the bone's own scale
  const tmpScale = new THREE.Vector3();
  function handOf(inst) {
    if (inst.hand !== undefined) return inst.hand;
    let h = null; inst.root.traverse(o => { if (!h && o.isBone && /(wrist|hand|palm)[._ ]?r(ight)?$|right.?hand/i.test(o.name)) h = o; });
    return (inst.hand = h);
  }
  function carry(inst, heldName, size) {
    if (!heldName) { if (inst.carried) inst.carried.pivot.visible = false; return; }
    const ha = asset(heldName), hand = handOf(inst); if (!ha.ready || !hand) return;
    if (!inst.carried || inst.carried.name !== heldName) {
      if (inst.carried) hand.remove(inst.carried.pivot);
      const obj = SkeletonUtils.clone(ha.scene), pivot = new THREE.Group(), turn = new THREE.Group();
      obj.position.copy(ha.centre).multiplyScalar(-1); turn.add(obj); pivot.add(turn);
      // the blasters' barrels run along their length: turned to run along the hand, out past the fingers
      turn.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
      hand.add(pivot); inst.carried = { name: heldName, pivot, longest: ha.longest };
    }
    inst.root.updateMatrixWorld(true); hand.getWorldScale(tmpScale);
    inst.carried.pivot.scale.setScalar(0.2 * size / (inst.carried.longest * (tmpScale.x || 1)));
    inst.carried.pivot.visible = true;
  }
  function pose(inst, name, clipName, time) {
    const a = asset(name); if (!inst.mixer || !clipName) return;
    let action = inst.actions.get(clipName);
    if (!action) {
      const want = String(clipName).toLowerCase();
      const clip = a.clips.find(c => c.name.toLowerCase() === want) || a.clips.find(c => c.name.toLowerCase().split("|").pop() === want) || a.clips.find(c => c.name.toLowerCase().includes(want));
      if (!clip) return;
      action = inst.mixer.clipAction(clip); inst.actions.set(clipName, action);
    }
    if (inst.current !== action) { if (inst.current) inst.current.stop(); action.play(); inst.current = action; }
    // the time comes from the game, so rewinding and replaying pose the same; death and the like stop at their end
    const d = action.getClip().duration || 1, once = /death|die|land|hit/i.test(action.getClip().name);
    action.time = once ? Math.min(num(time, 0), d - 0.001) : ((num(time, 0) % d) + d) % d;
    inst.mixer.update(0);
  }

  function render(list, width, height, shakeX, shakeY) {
    if (opts.lowRes) { const r = opts.lowRes / Math.max(1, width); if (renderer.getPixelRatio() !== r) renderer.setPixelRatio(r); }
    if (canvas.width !== Math.round(width * renderer.getPixelRatio()) || canvas.height !== Math.round(height * renderer.getPixelRatio())) renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const seenBlocks = new Set(), counts = new Map(), holdCounts = new Map();
    let flashCount = 0, beamCount = 0, fogSet = false, lightSet = false, skyTexture = null, nearFlash = null;
    for (const [word, a] of list) {
      if (!WORDS.has(word)) continue;
      if (word === "view") {
        camera.position.set(num(a[0], 0), num(a[1], 1.6), num(a[2], 0));
        camera.rotation.set(0, 0, 0); camera.rotation.order = "YXZ";
        camera.rotation.y = cameraYaw(num(a[3], 0)); camera.rotation.x = num(a[4], 0);
        camera.fov = num(a[5], 70); camera.updateProjectionMatrix();
        camera.position.x += (shakeX || 0) * 0.004; camera.position.y += (shakeY || 0) * 0.004;
      } else if (word === "block") {
        const key = a.map(fmt).join(","); seenBlocks.add(key);
        if (!blocks.has(key)) {
          const [x, y, z, sx, sy, sz] = a.map((v, i) => i < 6 ? num(v, 1) : v);
          const m = new THREE.Mesh(unitBox, material(a[6] === undefined ? "#888888" : a[6], sx, sy, sz));
          m.position.set(x, y, z); m.scale.set(sx, sy, sz); scene.add(m); blocks.set(key, m);
        }
      } else if (word === "model") {
        const name = fmt(a[0]), k = counts.get(name) || 0; counts.set(name, k + 1);
        const inst = instance(name, k, scene); if (!inst) continue;
        inst.root.visible = true; inst.root.position.set(num(a[1], 0), num(a[2], 0), num(a[3], 0));
        // the shadow stays on the floor when a model floats (pickups bob)
        if (inst.root.userData.blob) inst.root.userData.blob.position.y = (0.012 - num(a[2], 0)) / Math.max(0.01, num(a[5], 1));
        inst.root.rotation.y = modelYaw(num(a[4], 0)); inst.root.scale.setScalar(num(a[5], 1));
        pose(inst, name, a[6] === undefined || a[6] === false ? null : fmt(a[6]), a[7]);
        carry(inst, a[8] === undefined || a[8] === false ? null : fmt(a[8]), num(a[5], 1));
      } else if (word === "hold") {
        const name = fmt(a[0]), k = holdCounts.get(name) || 0; holdCounts.set(name, k + 1);
        const inst = instance(name, k, holdGroup); if (!inst) continue;
        inst.root.visible = true; inst.root.position.set(num(a[1], 0.25), num(a[2], -0.25), num(a[3], -0.5));
        inst.root.rotation.set(num(a[5], 0), num(a[4], 0), 0); inst.root.scale.setScalar(num(a[6], 0.3));
      } else if (word === "flash") {
        let f = flashes[flashCount];
        if (!f) { f = { light: new THREE.PointLight(0xffaa55, 0, 0, 2), ball: new THREE.Mesh(glow, new THREE.MeshBasicMaterial({ color: 0xffaa55, transparent: true, opacity: 0.85 })) }; scene.add(f.light); scene.add(f.ball); flashes.push(f); }
        // a colour written smoke:#rrggbb is a puff of smoke: see-through, and it gives off no light
        const spec = fmt(a[4]), smoke = spec.startsWith("smoke:"), c = new THREE.Color((smoke ? spec.slice(6) : spec).slice(0, 7)), r = num(a[3], 0.3);
        f.light.color.copy(c); f.light.intensity = 6 * r * r + 0.6; f.light.distance = r * 8 + 1; f.light.position.set(num(a[0], 0), num(a[1], 1), num(a[2], 0));
        f.ball.material.color.copy(c); f.ball.position.copy(f.light.position); f.ball.scale.setScalar(r); f.ball.visible = true; f.light.visible = !smoke;
        f.ball.material.opacity = smoke ? 0.3 : 0.85; f.ball.material.depthWrite = !smoke;
        if (!smoke && f.light.position.distanceTo(camera.position) < 1.2) nearFlash = { c, r };
        flashCount++;
      } else if (word === "beam") {
        // beam [x1, y1, z1, x2, y2, z2, colour]: a streak from the first point to the second, lit from within
        let b = beams[beamCount];
        if (!b) { b = new THREE.Mesh(unitBox, new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.9, toneMapped: false, depthWrite: false })); scene.add(b); beams.push(b); }
        b.position.set(num(a[0], 0), num(a[1], 1), num(a[2], 0)); beamEnd.set(num(a[3], 0), num(a[4], 1), num(a[5], 0));
        const len = Math.max(0.01, b.position.distanceTo(beamEnd));
        b.position.lerp(beamEnd, 0.5); b.lookAt(beamEnd); b.scale.set(0.022, 0.022, len);
        b.material.color.set(fmt(a[6] === undefined ? "#ffe08a" : a[6]).slice(0, 7)); b.visible = true; beamCount++;
      } else if (word === "sky") {
        // sky [top colour, horizon colour]: a dome round the camera, the gradient painted on it with soft clouds above
        // the horizon, so the clouds stay put as you turn; made once per pair of colours
        const top = fmt(a[0]).slice(0, 7), low = fmt(a[1]).slice(0, 7), k = top + low;
        if (!skies.has(k)) skies.set(k, skyPainting(top, low));
        skyTexture = skies.get(k);
      } else if (word === "light") {
        const k = num(a[3], 1); lightSet = true;
        hemi.color.set(fmt(a[0]).slice(0, 7)); hemi.groundColor.set(fmt(a[1]).slice(0, 7)); sun.color.set(fmt(a[2]).slice(0, 7));
        hemi.intensity = 1.25 * k; sun.intensity = 1.35 * k;
      } else if (word === "fog") {
        const c = new THREE.Color(fmt(a[0]).slice(0, 7));
        if (!scene.fog) scene.fog = new THREE.Fog(c, 1, 20);
        scene.fog.color.copy(c); scene.fog.near = num(a[1], 1); scene.fog.far = num(a[2], 20); scene.background = c; fogSet = true;
      }
    }
    // what wasn't asked for this frame is put away
    for (const [key, m] of blocks) if (!seenBlocks.has(key)) { scene.remove(m); blocks.delete(key); }
    for (const [poolName, pool] of pools) {
      const used = poolName.endsWith("@hold") ? holdCounts.get(poolName.slice(0, -5)) || 0 : counts.get(poolName) || 0;
      pool.forEach((p, i) => { if (i >= used) p.root.visible = false; });
    }
    flashes.forEach((f, i) => { if (i >= flashCount) f.light.visible = f.ball.visible = false; });
    beams.forEach((b, i) => { if (i >= beamCount) b.visible = false; });
    if (!fogSet) { scene.fog = null; scene.background = new THREE.Color(0x101215); }
    if (skyTexture) { dome.material.map = skyTexture; dome.material.needsUpdate = dome.material.map !== domeMap; domeMap = skyTexture; dome.visible = true; dome.position.copy(camera.position); scene.background = skyTexture.userData.low; }
    else dome.visible = false;
    if (!lightSet) { hemi.color.setHex(LIGHT_DEFAULT[0]); hemi.groundColor.setHex(LIGHT_DEFAULT[1]); sun.color.setHex(LIGHT_DEFAULT[2]); hemi.intensity = 1.25; sun.intensity = 1.35; }
    renderer.clear(); renderer.render(scene, camera);
    if (holdGroup.children.some(c => c.visible)) {
      holdHemi.color.copy(hemi.color); holdHemi.groundColor.copy(hemi.groundColor); holdHemi.intensity = hemi.intensity;
      holdSun.color.copy(sun.color); holdSun.intensity = sun.intensity;
      if (nearFlash) { holdFlash.color.copy(nearFlash.c); holdFlash.intensity = 4 + nearFlash.r * 20; } else holdFlash.intensity = 0;
      holdCamera.aspect = camera.aspect; holdCamera.updateProjectionMatrix();
      renderer.clearDepth(); renderer.render(holdScene, holdCamera);
    }
  }
  // soft textures on or off: every textured material takes the other kind of its texture
  function setSoft(on) {
    on = !!on; if (on === soft) return; soft = on;
    for (const m of materials.values()) { const t = m.userData && m.userData.tex && textures.get(m.userData.tex); if (t && t.image && m.userData.give) m.userData.give(t); }
  }
  return { render, setSoft, setLowRes: n => { opts.lowRes = n; }, has3d: list => list.some(d => WORDS.has(d[0])), loading: () => [...assets.values()].some(a => !a.ready && !a.failed) };
}
export { WORDS };
