// COLON TUNNEL SHADER — drop into tapeworm5.html after agent finishes
// Copy void rift's dual-canvas approach, recolor for flesh/colon

// Add before game canvas:
// <canvas id="bg"></canvas>
// <canvas id="c" style="position:fixed;top:0;left:0;background:transparent"></canvas>

// JS to add at top of script:

var bgCanvas = document.getElementById('bg');
var gl = bgCanvas.getContext('webgl') || bgCanvas.getContext('experimental-webgl');
var bgProgram = null;
var bgTime = 0;

// World colors for shader [r, g, b] — flesh/colon base, shifts per world
var WORLD_SHADER_COLORS = [
  [0.5, 0.15, 0.12],  // World 1 Tokyo — pinkish red
  [0.15, 0.25, 0.12],  // World 2 Paris — gray green sewer
  [0.5, 0.2, 0.05],    // World 3 Texas — orange fire
  [0.45, 0.15, 0.08],  // World 4 Australia — dusty red
  [0.2, 0.1, 0.5],     // World 5 Space — purple void
];

if (gl) {
  var vsrc = "attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}";
  var fsrc = [
    "precision mediump float;",
    "uniform float t;",
    "uniform vec2 r;",
    "uniform vec3 wc;", // world color
    "void main(){",
    "  vec2 uv=(gl_FragCoord.xy-r*0.5)/min(r.x,r.y);",
    "  float d=length(uv);",
    "  float a=atan(uv.y,uv.x);",
    "  float tunnel=0.5/d;",
    "  float tx=tunnel+t*0.3;",
    "  float ty=a/3.14159;",
    // Intestinal wall texture — bumpy organic pattern
    "  float pattern=sin(tx*8.0)*sin(ty*12.0)+sin(tx*3.0+ty*5.0)*0.5;",
    "  float glow=0.015/d;",
    "  vec3 col=vec3(0.0);",
    // Base flesh glow from center
    "  col+=wc*glow*1.5;",
    // Wall texture — veiny organic look
    "  col+=wc*0.4*max(0.0,pattern)*0.25;",
    // Peristalsis rings — slow moving muscle contractions
    "  float ring=abs(sin(tunnel*4.0-t*1.5));",
    "  col+=wc*1.5*smoothstep(0.92,1.0,ring)*0.12/d;",
    // Vein-like highlights
    "  float vein=abs(sin(a*6.0+tunnel*2.0-t*0.8));",
    "  col+=wc*0.6*smoothstep(0.95,1.0,vein)*0.08/d;",
    // Dark center, lit walls
    "  col*=smoothstep(0.0,0.25,d);",
    // Subtle warm ambient
    "  col+=vec3(0.02,0.005,0.005);",
    "  gl_FragColor=vec4(col,1.0);",
    "}"
  ].join("\n");

  function compileShader(src, type) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  var vs = compileShader(vsrc, gl.VERTEX_SHADER);
  var fs = compileShader(fsrc, gl.FRAGMENT_SHADER);
  bgProgram = gl.createProgram();
  gl.attachShader(bgProgram, vs);
  gl.attachShader(bgProgram, fs);
  gl.linkProgram(bgProgram);
  gl.useProgram(bgProgram);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
  var pLoc = gl.getAttribLocation(bgProgram, "p");
  gl.enableVertexAttribArray(pLoc);
  gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);
}

function drawBg() {
  if (!gl || !bgProgram) return;
  gl.useProgram(bgProgram);
  gl.uniform1f(gl.getUniformLocation(bgProgram, "t"), bgTime);
  gl.uniform2f(gl.getUniformLocation(bgProgram, "r"), W, H);
  // Pick world color based on current wave
  var worldIdx = Math.min(4, Math.floor((wave - 1) / 5));
  var wc = WORLD_SHADER_COLORS[worldIdx];
  gl.uniform3f(gl.getUniformLocation(bgProgram, "wc"), wc[0], wc[1], wc[2]);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// Call drawBg() at the start of each frame
// Increment bgTime += 0.016 each frame
