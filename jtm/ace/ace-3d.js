/**
 * ACE 3D — Raymarched Nuclear Plant Visualization + Presentation Mode
 *
 * WebGL2 fragment-shader raymarcher rendering the NDX 5×1000 MWe CANDU station.
 * Construction progress driven by ACE simulation state.
 * Presentation mode overlays whitepaper slides on the 3D scene.
 *
 * Depends on ACE, ACE_Schedule, ACE_Data from earlier scripts.
 */

var ACE_3D = (function () {
  'use strict';

  var canvas, gl, program, startTime;
  var camAngle = 0, camPitch = 0.3, camDist = 8.0;
  var camMode = 'orbit';
  var mouseDown = false, lastMX = 0, lastMY = 0;
  var animFrame = null;
  var active = false;
  var presentMode = false;
  var slideIdx = 0;

  // Construction progress (0-1) per building, driven by sim
  var progress = {
    site: 0, foundation: 0, reactor: 0, containment: 0,
    turbine: 0, cooling: 0, aux: 0, crane: 0, pipes: 0
  };

  // Camera presets
  var CAMS = {
    orbit:   { label: 'Orbit',   pitch: 0.3,  dist: 8.0,  auto: true },
    aerial:  { label: 'Aerial',  pitch: 1.2,  dist: 12.0, auto: true },
    reactor: { label: 'Reactor', pitch: 0.2,  dist: 4.0,  auto: false, angle: 0.3 },
    turbine: { label: 'Turbine', pitch: 0.15, dist: 5.0,  auto: false, angle: 2.0 },
    crane:   { label: 'Crane',   pitch: 0.6,  dist: 6.0,  auto: true },
    ground:  { label: 'Ground',  pitch: 0.05, dist: 5.5,  auto: true }
  };

  // Presentation slides
  var SLIDES = [
    { title: 'ACE', sub: 'Atomic Constraint Engine', body: 'A constraint-driven scheduling and risk simulation platform for nuclear megaprojects.\n\nEvery scope item is an atom. Atoms link via requires and contains. Completion propagates automatically through the graph.' },
    { title: 'The Atom', sub: 'One primitive, two kinds', body: 'Manual atoms require human evidence to clear.\nDerived atoms auto-complete when all children and prerequisites are done.\n\nThree link types: contains (hierarchy), requires (dependency), tag (metadata).' },
    { title: 'NDX Station', sub: '5 × 1000 MWe CANDU', body: '116 atoms across 14 construction phases.\n35 milestones from Notice to Proceed through Commercial Operation.\n$58B budget. 108-month baseline.\n\nThe 3D model you see represents the physical plant being constructed.' },
    { title: 'Critical Path', sub: 'CPM + Monte Carlo', body: 'Topological sort identifies the critical path — the longest chain of dependent activities.\n\n1000 Monte Carlo iterations sample triangular distributions on every duration, incorporating risk probabilities.\n\nResult: P10/P50/P80/P90 confidence intervals.' },
    { title: 'Risk Engine', sub: '16 risks, probabilistic firing', body: 'Each risk has a probability (8%–45%) and impact (2–10 months).\n\nDuring simulation, risks fire stochastically. The Monte Carlo engine samples risk outcomes across iterations.\n\nRisk sensitivity analysis ranks risks by Expected Value = P × I.' },
    { title: 'AWP / IWP', sub: 'Advanced Work Packaging', body: 'Construction Work Areas (CWA) → Construction Work Packages (CWP) → Install Work Packages (IWP).\n\n3 CWAs, 10 CWPs, 21 IWPs model the workface.\nEach IWP tracks constraint readiness: materials, labor, engineering, equipment, access.' },
    { title: 'Triage', sub: 'Decision under pressure', body: '8 construction decision points embedded in the timeline.\n\nWhen the simulation reaches a triage month, it pauses for your decision.\nOption A vs Option B — each with cost, schedule, and safety trade-offs.\n\nEvery decision is logged to the narrative audit trail.' },
    { title: 'Earned Value', sub: 'SPI, CPI, EAC', body: 'The S-curve tracks Planned Value vs Earned Value over time.\n\nSchedule Performance Index (SPI) = ES / AT\nCost Performance Index (CPI) = EV / AC\nEstimate at Completion (EAC) = Budget / SPI\n\nAll metrics update live during simulation.' },
    { title: 'Simulation', sub: 'Play. Decide. Learn.', body: 'Press Play to watch construction unfold.\nAtoms auto-complete based on CPM schedule.\nTriages pause for your input.\nBackground events generate realistic construction narrative.\n\nSpeed: 1x, 2x, 5x, 10x. Keyboard: Space, arrows, /, ?' }
  ];

  // ── Vertex shader (fullscreen quad) ──
  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}';

  // ── Fragment shader (raymarcher) ──
  var FS = [
    'precision highp float;',
    'uniform float t,ar;',
    'uniform vec3 cam;',
    'uniform float pr_site,pr_fnd,pr_rx,pr_ct,pr_tb,pr_cool,pr_aux,pr_crane,pr_pipe;',
    '',
    'float box(vec3 p,vec3 b){vec3 d=abs(p)-b;return min(max(d.x,max(d.y,d.z)),0.)+length(max(d,0.));}',
    'float cyl(vec3 p,float r,float h){return max(length(p.xz)-r,abs(p.y)-h);}',
    'float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}',
    '',
    'float ground(vec3 p){return p.y+.01;}',
    '',
    'float building(vec3 p,vec3 pos,vec3 sz,float vis){',
    '  if(vis<.001)return 1e5;',
    '  return box(p-pos,sz*vis)/vis;',
    '}',
    '',
    'float scene(vec3 p){',
    '  float d=ground(p);',
    // Foundation pad
    '  d=min(d,building(p,vec3(0,-.45,0),vec3(3.5,.05,2.5),pr_fnd));',
    // Reactor building (cylinder)
    '  float rx=cyl(p-vec3(-1.,pr_rx*.9,0.),0.8,pr_rx*.9);',
    '  if(pr_rx>.001)d=min(d,rx);',
    // Containment dome
    '  float dome=length(p-vec3(-1.,pr_ct*1.8,0.))-1.0;',
    '  dome=max(dome,-(p.y-pr_ct*1.6));',
    '  if(pr_ct>.3)d=min(d,dome);',
    // Turbine building (box)
    '  d=min(d,building(p,vec3(1.2,.4,0.),vec3(1.2,.4,.8),pr_tb));',
    // Cooling towers (2)
    '  float ct1=cyl(p-vec3(2.5,pr_cool*1.2,-1.),0.5-0.15*(p.y/2.),pr_cool*1.2);',
    '  float ct2=cyl(p-vec3(2.5,pr_cool*1.2,1.),0.5-0.15*(p.y/2.),pr_cool*1.2);',
    '  if(pr_cool>.001){d=min(d,ct1);d=min(d,ct2);}',
    // Auxiliary building
    '  d=min(d,building(p,vec3(-.2,.2,-1.5),vec3(.6,.2,.4),pr_aux));',
    // Crane
    '  float crH=pr_crane*3.;',
    '  if(pr_crane>.001){',
    '    d=min(d,box(p-vec3(0.,crH*.5,1.8),vec3(.04,crH*.5,.04)));',
    '    d=min(d,box(p-vec3(0.,crH,1.8),vec3(1.5,.03,.03)));',
    '  }',
    // Pipes (connecting reactor to turbine)
    '  if(pr_pipe>.3){',
    '    float pipe=cyl(vec3(p.y-.3,p.z,p.x-.1),.06,1.2);',
    '    d=min(d,pipe);',
    '  }',
    '  return d;',
    '}',
    '',
    'vec3 norm(vec3 p){vec2 e=vec2(.001,0);return normalize(vec3(',
    '  scene(p+e.xyy)-scene(p-e.xyy),',
    '  scene(p+e.yxy)-scene(p-e.yxy),',
    '  scene(p+e.yyx)-scene(p-e.yyx)));}',
    '',
    'float shadow(vec3 ro,vec3 rd,float mint,float maxt){',
    '  float res=1.;',
    '  for(float t2=mint;t2<maxt;){',
    '    float h=scene(ro+rd*t2);',
    '    if(h<.001)return 0.;',
    '    res=min(res,8.*h/t2);',
    '    t2+=h;',
    '  }return res;}',
    '',
    'void main(){',
    '  vec2 uv=(gl_FragCoord.xy/vec2(textureSize(0))-0.5);',
    '  uv.x*=ar;',
    '',
    '  vec3 ro=cam;',
    '  vec3 ta=vec3(0,.5,0);',
    '  vec3 fwd=normalize(ta-ro);',
    '  vec3 right=normalize(cross(fwd,vec3(0,1,0)));',
    '  vec3 up=cross(right,fwd);',
    '  vec3 rd=normalize(fwd+uv.x*right+uv.y*up);',
    '',
    '  vec3 col=vec3(.92,.90,.85);', // sky
    '  float td=0.;',
    '  for(int i=0;i<80;i++){',
    '    vec3 p=ro+rd*td;',
    '    float d=scene(p);',
    '    if(d<.001){',
    '      vec3 n=norm(p);',
    '      vec3 ld=normalize(vec3(.8,1.,.6));',
    '      float diff=max(dot(n,ld),0.);',
    '      float sh=shadow(p+n*.01,ld,.02,10.);',
    '      float ao=1.;',
    // Material colors
    '      vec3 mat;',
    '      if(p.y<.01)mat=vec3(.85,.82,.75);', // ground
    '      else if(abs(p.x+1.)<.9&&length(p.xz-vec2(-1.,0.))<.85)mat=vec3(.75,.75,.78);', // reactor gray
    '      else if(p.x>0.&&p.y>.1&&abs(p.z)<.9)mat=vec3(.55,.60,.65);', // turbine steel
    '      else if(length(p.xz-vec2(2.5,0.))>1.5)mat=vec3(.82,.78,.72);', // cooling
    '      else mat=vec3(.78,.74,.68);', // default concrete
    '      col=mat*(0.25+0.75*diff*sh);',
    '      break;',
    '    }',
    '    td+=d;',
    '    if(td>25.)break;',
    '  }',
    // Fog
    '  col=mix(col,vec3(.92,.90,.85),1.-exp(-.015*td*td));',
    '  col=pow(col,vec3(.9));', // gamma
    '  gl_FragColor=vec4(col,1);',
    '}'].join('\n');

  // Fix: use resolution uniform instead of textureSize
  var FS_FIXED = FS.replace('vec2(textureSize(0))', 'res').replace(
    'uniform float pr_site',
    'uniform vec2 res;\nuniform float pr_site'
  );

  function initGL(cvs) {
    canvas = cvs;
    gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return false;

    var vs = compile(gl.VERTEX_SHADER, VS);
    var fs = compile(gl.FRAGMENT_SHADER, FS_FIXED);
    if (!vs || !fs) return false;

    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('ACE 3D link error:', gl.getProgramInfoLog(program));
      return false;
    }
    gl.useProgram(program);

    // Fullscreen quad
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    var pLoc = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

    startTime = performance.now();
    return true;
  }

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('ACE 3D shader error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  function updateProgress() {
    if (typeof ACE === 'undefined') return;
    var pct = function(id) { return ACE.percentComplete(id) / 100; };
    var simM = (typeof ACE_UI !== 'undefined' && ACE_UI.getSimMonth) ? ACE_UI.getSimMonth() : 0;
    var t = simM / (ACE_Data.PLANT.baselineMonths || 108);

    progress.site = Math.min(1, t * 6);
    progress.foundation = pct('PH-EXCAV') || Math.min(1, Math.max(0, (t - 0.05) * 4));
    progress.reactor = pct('PH-REACT') || Math.min(1, Math.max(0, (t - 0.3) * 3));
    progress.containment = pct('PH-CONTAIN') || Math.min(1, Math.max(0, (t - 0.2) * 2.5));
    progress.turbine = pct('PH-MECH') || Math.min(1, Math.max(0, (t - 0.25) * 3));
    progress.cooling = Math.min(1, Math.max(0, (t - 0.15) * 2));
    progress.aux = pct('PH-AUX') || Math.min(1, Math.max(0, (t - 0.3) * 3));
    progress.crane = t < 0.85 ? Math.min(1, t * 3) : Math.max(0, (1 - t) * 6);
    progress.pipes = pct('PH-PIPE') || Math.min(1, Math.max(0, (t - 0.35) * 3));
  }

  function render() {
    if (!active || !gl) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth * dpr;
    var h = canvas.clientHeight * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);

    var time = (performance.now() - startTime) / 1000;
    var cam = CAMS[camMode] || CAMS.orbit;

    if (cam.auto) camAngle += 0.003;
    var pitch = cam.pitch !== undefined ? cam.pitch : camPitch;
    var dist = cam.dist !== undefined ? cam.dist : camDist;
    var angle = cam.angle !== undefined ? cam.angle : camAngle;

    var cx = Math.cos(angle) * Math.cos(pitch) * dist;
    var cy = Math.sin(pitch) * dist + 1.0;
    var cz = Math.sin(angle) * Math.cos(pitch) * dist;

    updateProgress();

    var u = function(name) { return gl.getUniformLocation(program, name); };
    gl.uniform1f(u('t'), time);
    gl.uniform1f(u('ar'), w / h);
    gl.uniform2f(u('res'), w, h);
    gl.uniform3f(u('cam'), cx, cy, cz);
    gl.uniform1f(u('pr_site'), progress.site);
    gl.uniform1f(u('pr_fnd'), progress.foundation);
    gl.uniform1f(u('pr_rx'), progress.reactor);
    gl.uniform1f(u('pr_ct'), progress.containment);
    gl.uniform1f(u('pr_tb'), progress.turbine);
    gl.uniform1f(u('pr_cool'), progress.cooling);
    gl.uniform1f(u('pr_aux'), progress.aux);
    gl.uniform1f(u('pr_crane'), progress.crane);
    gl.uniform1f(u('pr_pipe'), progress.pipes);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    animFrame = requestAnimationFrame(render);
  }

  function start(cvs) {
    var glOk = false;
    try { glOk = initGL(cvs); } catch (e) { glOk = false; }
    if (!glOk) {
      // Replace canvas with a fresh one for 2D fallback
      var parent = cvs.parentElement;
      var newCvs = document.createElement('canvas');
      newCvs.id = cvs.id;
      newCvs.style.cssText = cvs.style.cssText;
      parent.replaceChild(newCvs, cvs);
      startFallback(newCvs);
      return;
    }
    active = true;
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    render();
  }

  function stop() {
    active = false;
    if (animFrame) cancelAnimationFrame(animFrame);
    if (canvas) {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
    }
  }

  // ── Fallback 2D renderer (no WebGL) ──
  function startFallback(cvs) {
    canvas = cvs;
    active = true;
    renderFallback();
  }

  function renderFallback() {
    if (!active) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var c = canvas.getContext('2d');
    if (!c) { animFrame = requestAnimationFrame(renderFallback); return; }
    c.scale(dpr, dpr);

    updateProgress();
    var time = performance.now() / 1000;
    var simM = (typeof ACE_UI !== 'undefined' && ACE_UI.getSimMonth) ? ACE_UI.getSimMonth() : 0;
    var pctDone = (typeof ACE !== 'undefined') ? ACE.summary().percent : 0;

    // Dark blueprint background
    c.fillStyle = '#1a1d21';
    c.fillRect(0, 0, w, h);

    // Subtle grid (isometric)
    c.strokeStyle = 'rgba(44,93,120,.08)';
    c.lineWidth = 0.5;
    var gs = 30;
    for (var gx = 0; gx < w; gx += gs) { c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, h); c.stroke(); }
    for (var gy = 0; gy < h; gy += gs) { c.beginPath(); c.moveTo(0, gy); c.lineTo(w, gy); c.stroke(); }

    var groundY = h * 0.68;
    var cx = w * 0.40;
    var s = Math.min(w, h) * 0.0032;

    // Isometric helpers
    var ISO_ANGLE = 0.46;
    var cosA = Math.cos(ISO_ANGLE), sinA = Math.sin(ISO_ANGLE);
    function isoX(x, z) { return cx + (x * cosA - z * cosA) * s; }
    function isoY(x, z, y) { return groundY + (x * sinA + z * sinA) * s * 0.5 - y * s; }

    // Ground line
    c.strokeStyle = 'rgba(168,64,31,.4)';
    c.lineWidth = 1;
    c.setLineDash([8, 4]);
    c.beginPath(); c.moveTo(0, groundY); c.lineTo(w, groundY); c.stroke();
    c.setLineDash([]);

    // -- Isometric 3D box drawing --
    function isoBox(bx, bz, bw, bd, bh, prog, color, label) {
      var ghostAlpha = 0.15 + 0.08 * Math.sin(time * 1.5);
      var h2 = bh * Math.max(0.001, prog);
      // 4 base corners
      var fl = [isoX(bx - bw/2, bz - bd/2), isoY(bx - bw/2, bz - bd/2, 0)];
      var fr = [isoX(bx + bw/2, bz - bd/2), isoY(bx + bw/2, bz - bd/2, 0)];
      var bl = [isoX(bx - bw/2, bz + bd/2), isoY(bx - bw/2, bz + bd/2, 0)];
      var br = [isoX(bx + bw/2, bz + bd/2), isoY(bx + bw/2, bz + bd/2, 0)];
      // 4 top corners
      var tfl = [isoX(bx - bw/2, bz - bd/2), isoY(bx - bw/2, bz - bd/2, h2)];
      var tfr = [isoX(bx + bw/2, bz - bd/2), isoY(bx + bw/2, bz - bd/2, h2)];
      var tbl = [isoX(bx - bw/2, bz + bd/2), isoY(bx - bw/2, bz + bd/2, h2)];
      var tbr = [isoX(bx + bw/2, bz + bd/2), isoY(bx + bw/2, bz + bd/2, h2)];

      // Ghost outline (always)
      c.strokeStyle = 'rgba(168,130,90,' + ghostAlpha + ')';
      c.lineWidth = 1;
      c.setLineDash([5, 4]);
      var gh = bh;
      var gfl = [fl[0], isoY(bx-bw/2,bz-bd/2,gh)];
      var gfr = [fr[0], isoY(bx+bw/2,bz-bd/2,gh)];
      var gbr = [br[0], isoY(bx+bw/2,bz+bd/2,gh)];
      c.beginPath(); c.moveTo(fl[0],fl[1]); c.lineTo(fr[0],fr[1]); c.lineTo(gfr[0],gfr[1]); c.lineTo(gfl[0],gfl[1]); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(fr[0],fr[1]); c.lineTo(br[0],br[1]); c.lineTo(gbr[0],gbr[1]); c.lineTo(gfr[0],gfr[1]); c.closePath(); c.stroke();
      c.setLineDash([]);

      if (prog > 0.01) {
        // Front face
        c.fillStyle = color;
        c.globalAlpha = 0.7;
        c.beginPath(); c.moveTo(fl[0],fl[1]); c.lineTo(fr[0],fr[1]); c.lineTo(tfr[0],tfr[1]); c.lineTo(tfl[0],tfl[1]); c.closePath(); c.fill();
        // Right face (darker)
        c.globalAlpha = 0.5;
        c.beginPath(); c.moveTo(fr[0],fr[1]); c.lineTo(br[0],br[1]); c.lineTo(tbr[0],tbr[1]); c.lineTo(tfr[0],tfr[1]); c.closePath(); c.fill();
        // Top face (lighter)
        c.globalAlpha = 0.85;
        c.beginPath(); c.moveTo(tfl[0],tfl[1]); c.lineTo(tfr[0],tfr[1]); c.lineTo(tbr[0],tbr[1]); c.lineTo(tbl[0],tbl[1]); c.closePath(); c.fill();
        c.globalAlpha = 1;
        // Edges
        c.strokeStyle = 'rgba(242,236,223,.3)';
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(tfl[0],tfl[1]); c.lineTo(tfr[0],tfr[1]); c.lineTo(tbr[0],tbr[1]); c.lineTo(tbl[0],tbl[1]); c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(fl[0],fl[1]); c.lineTo(tfl[0],tfl[1]); c.stroke();
        c.beginPath(); c.moveTo(fr[0],fr[1]); c.lineTo(tfr[0],tfr[1]); c.stroke();
        c.beginPath(); c.moveTo(br[0],br[1]); c.lineTo(tbr[0],tbr[1]); c.stroke();
      }
      // Label
      var lx = isoX(bx, bz - bd/2 - 8);
      var ly = isoY(bx, bz - bd/2 - 8, 0) + 4;
      c.fillStyle = prog > 0.1 ? 'rgba(242,236,223,.7)' : 'rgba(154,144,119,.3)';
      c.font = Math.max(9, 8 * s) + 'px IBM Plex Mono, monospace';
      c.textAlign = 'center';
      c.fillText(label, lx, ly);
      if (prog > 0.05) {
        c.fillStyle = color;
        c.fillText(Math.round(prog * 100) + '%', isoX(bx, bz), isoY(bx, bz, h2) - 6);
      }
    }

    // Isometric ground plane
    c.fillStyle = 'rgba(154,144,119,.06)';
    c.beginPath();
    c.moveTo(isoX(-120, -80), isoY(-120, -80, 0));
    c.lineTo(isoX(180, -80), isoY(180, -80, 0));
    c.lineTo(isoX(180, 80), isoY(180, 80, 0));
    c.lineTo(isoX(-120, 80), isoY(-120, 80, 0));
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(168,64,31,.2)'; c.lineWidth = 1; c.setLineDash([6,4]); c.stroke(); c.setLineDash([]);

    // Buildings (back to front for proper overlap)
    // Cooling Towers (far right, back)
    isoBox(160, 30, 25, 25, 90, progress.cooling, 'rgb(107,76,154)', 'CT-2');
    isoBox(160, -30, 25, 25, 90, progress.cooling, 'rgb(107,76,154)', 'CT-1');

    // Turbine Building (right)
    isoBox(60, 0, 80, 50, 55, progress.turbine, 'rgb(44,93,120)', 'TB');

    // Auxiliary Building (front left)
    isoBox(-40, 40, 35, 30, 30, progress.aux, 'rgb(184,134,11)', 'AUX');

    // Reactor Building (left, tall)
    isoBox(-60, 0, 50, 50, 120, progress.reactor, 'rgb(168,64,31)', 'RB');

    // Containment dome on top of reactor
    if (progress.containment > 0.05) {
      var dCx = isoX(-60, 0), dCy = isoY(-60, 0, 120 * progress.reactor);
      var dR = 22 * s * progress.containment;
      c.fillStyle = 'rgba(168,64,31,.45)';
      c.beginPath(); c.arc(dCx, dCy, dR, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(242,236,223,.3)'; c.lineWidth = 1;
      c.beginPath(); c.arc(dCx, dCy, dR, 0, Math.PI * 2); c.stroke();
    }

    // Crane (center, tallest)
    var crBase = [isoX(10, -10), isoY(10, -10, 0)];
    var crTopH = 160 * (progress.crane > 0 ? progress.crane : 1);
    var crTop = [isoX(10, -10), isoY(10, -10, crTopH)];
    c.strokeStyle = progress.crane > 0 ? 'rgba(168,64,31,.8)' : 'rgba(154,144,119,.12)';
    c.lineWidth = progress.crane > 0 ? 2 : 1;
    if (progress.crane <= 0) c.setLineDash([4, 3]);
    c.beginPath(); c.moveTo(crBase[0], crBase[1]); c.lineTo(crTop[0], crTop[1]); c.stroke();
    // Boom
    var boomL = [isoX(-60, -10), isoY(-60, -10, crTopH)];
    var boomR = [isoX(80, -10), isoY(80, -10, crTopH)];
    c.beginPath(); c.moveTo(boomL[0], boomL[1]); c.lineTo(boomR[0], boomR[1]); c.stroke();
    c.setLineDash([]);
    // Swinging cable
    if (progress.crane > 0) {
      var swing = Math.sin(time * 1.5) * 6;
      var hookX = isoX(40 + swing, -10);
      var hookTopY = isoY(40 + swing, -10, crTopH);
      var hookBotY = isoY(40 + swing * 1.3, -10, crTopH * 0.35);
      c.strokeStyle = 'rgba(168,64,31,.4)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(hookX, hookTopY); c.lineTo(isoX(40 + swing * 1.3, -10), hookBotY); c.stroke();
    }

    // Pipes (connecting RB to TB)
    if (progress.pipes > 0) {
      c.strokeStyle = 'rgba(44,93,120,.6)'; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(isoX(-35, 0), isoY(-35, 0, 25));
      c.lineTo(isoX(20, 0), isoY(20, 0, 25));
      c.stroke();
    }

    // -- HUD overlay --
    // Title
    c.fillStyle = '#a8401f';
    c.font = 'bold ' + Math.max(14, 14 * s) + 'px Fraunces, serif';
    c.textAlign = 'left';
    c.fillText('NDX Nuclear Generating Station', 16, 28);
    c.fillStyle = 'rgba(154,144,119,.7)';
    c.font = Math.max(11, 10 * s) + 'px IBM Plex Mono, monospace';
    c.fillText('5 × 1000 MWe CANDU  |  M' + Math.round(simM) + '/' + (ACE_Data.PLANT.baselineMonths || 108) + '  |  ' + pctDone + '%', 16, 46);

    // Progress bar at bottom
    var barY = h - 24, barH = 6, barW = w - 32;
    c.fillStyle = 'rgba(154,144,119,.15)';
    c.fillRect(16, barY, barW, barH);
    if (pctDone > 0) {
      var pGrad = c.createLinearGradient(16, barY, 16 + barW * pctDone / 100, barY);
      pGrad.addColorStop(0, '#a8401f');
      pGrad.addColorStop(1, '#2f7d4f');
      c.fillStyle = pGrad;
      c.fillRect(16, barY, barW * pctDone / 100, barH);
    }
    c.fillStyle = 'rgba(154,144,119,.5)';
    c.font = '9px IBM Plex Mono, monospace';
    c.textAlign = 'right';
    c.fillText(pctDone + '% complete', w - 16, barY - 4);

    // Phase status list (right side)
    var phases = ['PH-SITE', 'PH-EXCAV', 'PH-CIVIL', 'PH-CONTAIN', 'PH-MECH', 'PH-PIPE', 'PH-ELEC', 'PH-REACT', 'PH-COMM'];
    var phY = 70;
    c.textAlign = 'right';
    c.font = '10px IBM Plex Mono, monospace';
    phases.forEach(function (pid) {
      var a = (typeof ACE !== 'undefined') ? ACE.get(pid) : null;
      if (!a) return;
      var pp = (typeof ACE !== 'undefined') ? ACE.percentComplete(pid) : 0;
      c.fillStyle = pp >= 100 ? 'rgba(47,125,79,.8)' : pp > 0 ? 'rgba(168,64,31,.7)' : 'rgba(154,144,119,.3)';
      c.fillText((pp >= 100 ? '✓ ' : '') + a.name, w - 16, phY);
      // Mini bar
      c.fillStyle = 'rgba(154,144,119,.1)';
      c.fillRect(w - 16 - 60, phY + 2, 60, 3);
      if (pp > 0) {
        c.fillStyle = pp >= 100 ? 'rgba(47,125,79,.6)' : 'rgba(168,64,31,.5)';
        c.fillRect(w - 16 - 60, phY + 2, 60 * pp / 100, 3);
      }
      phY += 18;
    });

    animFrame = requestAnimationFrame(renderFallback);
  }

  // ── Mouse/touch controls ──
  function onMouseDown(e) { mouseDown = true; lastMX = e.clientX; lastMY = e.clientY; camMode = 'orbit'; }
  function onMouseMove(e) {
    if (!mouseDown) return;
    camAngle += (e.clientX - lastMX) * 0.005;
    camPitch = Math.max(0.05, Math.min(1.4, camPitch + (lastMY - e.clientY) * 0.005));
    CAMS.orbit.pitch = camPitch;
    CAMS.orbit.auto = false;
    lastMX = e.clientX;
    lastMY = e.clientY;
  }
  function onMouseUp() { mouseDown = false; }
  function onWheel(e) {
    e.preventDefault();
    camDist = Math.max(2, Math.min(20, camDist + e.deltaY * 0.01));
    CAMS.orbit.dist = camDist;
  }
  var touchDist = 0;
  function onTouchStart(e) {
    if (e.touches.length === 1) {
      mouseDown = true;
      lastMX = e.touches[0].clientX;
      lastMY = e.touches[0].clientY;
      camMode = 'orbit';
    }
    if (e.touches.length === 2) {
      touchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
    e.preventDefault();
  }
  function onTouchMove(e) {
    if (e.touches.length === 1 && mouseDown) {
      camAngle += (e.touches[0].clientX - lastMX) * 0.005;
      camPitch = Math.max(0.05, Math.min(1.4, camPitch + (lastMY - e.touches[0].clientY) * 0.005));
      CAMS.orbit.pitch = camPitch;
      CAMS.orbit.auto = false;
      lastMX = e.touches[0].clientX;
      lastMY = e.touches[0].clientY;
    }
    if (e.touches.length === 2) {
      var nd = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      camDist = Math.max(2, Math.min(20, camDist - (nd - touchDist) * 0.02));
      CAMS.orbit.dist = camDist;
      touchDist = nd;
    }
    e.preventDefault();
  }
  function onTouchEnd() { mouseDown = false; }

  // ── Camera mode ──
  function setCamera(mode) {
    if (CAMS[mode]) {
      camMode = mode;
      if (CAMS[mode].angle !== undefined) camAngle = CAMS[mode].angle;
      if (CAMS[mode].pitch !== undefined) camPitch = CAMS[mode].pitch;
      if (CAMS[mode].dist !== undefined) camDist = CAMS[mode].dist;
    }
  }

  // ── Presentation mode ──
  function togglePresent() {
    presentMode = !presentMode;
    slideIdx = 0;
    return presentMode;
  }

  function nextSlide() {
    slideIdx = Math.min(SLIDES.length - 1, slideIdx + 1);
    return SLIDES[slideIdx];
  }

  function prevSlide() {
    slideIdx = Math.max(0, slideIdx - 1);
    return SLIDES[slideIdx];
  }

  function getSlide() {
    return SLIDES[slideIdx];
  }

  function getSlideCount() { return SLIDES.length; }
  function getSlideIdx() { return slideIdx; }

  function isPresenting() { return presentMode; }

  return {
    start: start,
    stop: stop,
    setCamera: setCamera,
    togglePresent: togglePresent,
    nextSlide: nextSlide,
    prevSlide: prevSlide,
    getSlide: getSlide,
    getSlideCount: getSlideCount,
    getSlideIdx: getSlideIdx,
    isPresenting: isPresenting,
    CAMS: CAMS,
    SLIDES: SLIDES
  };
})();
