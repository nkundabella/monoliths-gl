/* ================================================================
   ANOMALOUS ARCHITECTURE — GLSL Shaders
   Exported as template-literal strings for use with ShaderMaterial.
   ================================================================ */

/* ── Vertex Shader ────────────────────────────────────────────
   Receives per-instance position (via instanceMatrix) and displaces
   vertices using audio-driven sine/cosine wave fields.
   ──────────────────────────────────────────────────────────── */

export const vertexShader = /* glsl */ `
  precision highp float;

  // Audio uniforms (0–1 smoothed)
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uTime;

  // Derived effects
  uniform float uBassScale;      // overall scale multiplier from bass
  uniform float uMidSlide;       // slide offset from mid
  uniform float uTrebleFlicker;  // brightness flicker

  varying vec3  vWorldPos;
  varying vec3  vNormal;
  varying float vDepth;
  varying float vBass;
  varying float vMid;
  varying float vTreble;

  // Pseudo-random from 2D seed
  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    // Decompose instance matrix → world position
    vec4 instancePos = instanceMatrix * vec4(position, 1.0);

    // Per-instance unique seed from its world XZ grid position
    vec2  seed    = floor(instancePos.xz * 0.1);
    float randVal = rand(seed);
    float randVal2= rand(seed + 0.5);

    // ── BASS: explosive vertical displacement ──────────────────
    float bassDisplace = uBass * 8.0 * sin(uTime * 2.0 + randVal * 6.2831);
    instancePos.y += bassDisplace * randVal2;

    // ── BASS: structural scale pulse ──────────────────────────
    float scale = 1.0 + uBass * 0.45 * randVal;
    instancePos.xyz *= scale;

    // ── MID: sliding along vector axes ────────────────────────
    float slideDir = sign(randVal - 0.5);
    instancePos.x += uMid * 4.0 * slideDir * sin(uTime * 1.5 + randVal2 * 3.14);
    instancePos.z += uMid * 4.0 * (1.0 - slideDir) * cos(uTime * 1.3 + randVal * 3.14);

    // ── TREBLE: fine vertex-level jitter (shimmer) ────────────
    vec3 jitter = vec3(
      sin(uTime * 60.0 + position.x * 5.0) * uTreble * 0.15,
      cos(uTime * 55.0 + position.y * 5.0) * uTreble * 0.15,
      sin(uTime * 65.0 + position.z * 5.0) * uTreble * 0.15
    );
    instancePos.xyz += jitter;

    // ── BASS: camera-space shake (applied to local pos) ───────
    // (actual camera shake is handled in JS, this is geometry-level)

    // Pass varying data
    vWorldPos = instancePos.xyz;
    vNormal   = normalize(normalMatrix * normal);
    vDepth    = gl_Position.z;
    vBass     = uBass;
    vMid      = uMid;
    vTreble   = uTreble;

    gl_Position = projectionMatrix * modelViewMatrix * instancePos;
  }
`;

/* ── Fragment Shader ──────────────────────────────────────────
   Procedural concrete/brutalist look with:
   - Voronoi-cell noise for stone texture
   - Distance fog
   - Audio-driven edge glow (bass) and specular flicker (treble)
   ──────────────────────────────────────────────────────────── */

export const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform vec3  uLightDir;
  uniform vec3  uCameraPos;

  varying vec3  vWorldPos;
  varying vec3  vNormal;
  varying float vDepth;
  varying float vBass;
  varying float vMid;
  varying float vTreble;

  // ── Noise helpers ────────────────────────────────────────────

  // Value noise 3D
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float valueNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);  // smoothstep
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
    f.z);
  }

  // FBM (fractal brownian motion) for concrete texture
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * valueNoise(p);
      p *= 2.1;
      a *= 0.5;
    }
    return v;
  }

  // ── Main ─────────────────────────────────────────────────────

  void main() {
    // --- Concrete base texture ---
    float noise  = fbm(vWorldPos * 0.35 + uTime * 0.01);
    float noise2 = fbm(vWorldPos * 1.2);

    // Concrete colour (desaturated warm grey)
    vec3 concreteLight = vec3(0.62, 0.60, 0.58);
    vec3 concreteDark  = vec3(0.22, 0.21, 0.20);
    vec3 baseColor = mix(concreteDark, concreteLight, noise * 0.7 + noise2 * 0.3);

    // --- Diffuse lighting ---
    vec3  N     = normalize(vNormal);
    vec3  L     = normalize(uLightDir);
    float diff  = max(dot(N, L), 0.0) * 0.8 + 0.2;

    // --- Specular (metallic glints, treble-driven) ---
    vec3  V     = normalize(uCameraPos - vWorldPos);
    vec3  H     = normalize(L + V);
    float spec  = pow(max(dot(N, H), 0.0), 64.0);
    float trebleFlicker = 0.5 + 0.5 * sin(uTime * 30.0 + vWorldPos.y);
    float specStr = uTreble * trebleFlicker * spec * 2.0;

    // --- Edge detection glow (bass-driven) ---
    // Use screen-space derivative for approximate silhouette edges
    float edgeX = abs(dFdx(noise));
    float edgeY = abs(dFdy(noise));
    float edge  = smoothstep(0.0, 0.03, edgeX + edgeY) * uBass * 3.0;

    // --- Bass colour pulse ---
    vec3 bassGlow   = vec3(1.0, 0.24, 0.12) * edge;
    // --- Mid accent colour ---
    vec3 midAccent  = vec3(0.91, 1.0, 0.0) * uMid * 0.18 * (0.5 + 0.5 * sin(uTime * 4.0 + vWorldPos.x));
    // --- Treble specular colour ---
    vec3 trebleSpec = vec3(0.0, 0.83, 1.0) * specStr;

    // --- Compose ---
    vec3 color = baseColor * diff + bassGlow + midAccent + trebleSpec;

    // --- Distance fog (dark void) ---
    float dist    = length(vWorldPos) * 0.025;
    float fogFact = 1.0 - exp(-dist * dist * 0.4);
    color = mix(color, vec3(0.02, 0.02, 0.03), fogFact);

    // --- Bass flash: full scene brightness surge on transients ---
    color += vec3(0.04) * uBass * (1.0 - fogFact);

    gl_FragColor = vec4(color, 1.0);
  }
`;
