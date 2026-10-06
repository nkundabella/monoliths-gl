/* ================================================================
   ANOMALOUS ARCHITECTURE — Three.js Scene
   Instanced monolith grid, camera rig, lighting, orbit controls.
   ================================================================ */

import * as THREE              from 'three';
import { OrbitControls }       from 'three/addons/controls/OrbitControls.js';
import { vertexShader, fragmentShader } from './shaders.js';

/* ── Constants ────────────────────────────────────────────────── */

const GRID_SIZE    = 16;       // 16×16 grid = 256 pillars
const CELL_SPACING = 6.5;      // world units between pillars
const PILLAR_TYPES = 3;        // different height ratios

/* ── Scene setup ──────────────────────────────────────────────── */

export class Scene {
  constructor(canvas) {
    this.canvas   = canvas;
    this.clock    = new THREE.Clock();
    this.time     = 0;

    // Camera shake state
    this._shakeX  = 0;
    this._shakeY  = 0;

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initLights();
    this._initMonoliths();
    this._initFloor();
    this._initControls();
    this._handleResize();
  }

  /* ── Renderer ─────────────────────────────────────────────── */

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas:      this.canvas,
      antialias:   true,
      alpha:       false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace  = THREE.SRGBColorSpace;
  }

  /* ── THREE scene ──────────────────────────────────────────── */

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050507);
    // Subtle exponential fog
    this.scene.fog = new THREE.FogExp2(0x060608, 0.018);
  }

  /* ── Camera ───────────────────────────────────────────────── */

  _initCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera  = new THREE.PerspectiveCamera(65, aspect, 0.5, 500);
    // Start elevated, looking down the corridor
    this.camera.position.set(0, 18, 55);
    this.camera.lookAt(0, 0, 0);
    this._orbitAngle = 0;
    this._orbitRadius = 55;
  }

  /* ── Lights ───────────────────────────────────────────────── */

  _initLights() {
    // Ambient: very dim, cold
    const ambient = new THREE.AmbientLight(0x1a1a2e, 0.8);
    this.scene.add(ambient);

    // Main directional spotlight — harsh, high-contrast
    this.spotlight = new THREE.DirectionalLight(0xffffff, 4.0);
    this.spotlight.position.set(30, 80, 20);
    this.spotlight.castShadow = true;
    this.spotlight.shadow.mapSize.width  = 2048;
    this.spotlight.shadow.mapSize.height = 2048;
    this.spotlight.shadow.camera.near   = 1;
    this.spotlight.shadow.camera.far    = 300;
    this.spotlight.shadow.camera.left   = -80;
    this.spotlight.shadow.camera.right  =  80;
    this.spotlight.shadow.camera.top    =  80;
    this.spotlight.shadow.camera.bottom = -80;
    this.spotlight.shadow.bias = -0.001;
    this.scene.add(this.spotlight);

    // Secondary fill: acid yellow from below
    this.fillLight = new THREE.PointLight(0xe8ff00, 0, 80);
    this.fillLight.position.set(0, -8, 0);
    this.scene.add(this.fillLight);

    // Rim: cold cyan from behind
    this.rimLight = new THREE.DirectionalLight(0x00d4ff, 0.6);
    this.rimLight.position.set(-40, 20, -60);
    this.scene.add(this.rimLight);

    // Store light direction for shader
    this._lightDir = this.spotlight.position.clone().normalize();
  }

  /* ── Instanced monolith grid ──────────────────────────────── */

  _initMonoliths() {
    const count = GRID_SIZE * GRID_SIZE;

    // Geometry variants: tall, medium, squat
    const geoTall   = new THREE.BoxGeometry(2.2, 14, 2.2);
    const geoMedium = new THREE.BoxGeometry(2.8, 7,  2.8);
    const geoSquat  = new THREE.BoxGeometry(3.5, 3,  3.5);
    const geos      = [geoTall, geoMedium, geoSquat];

    // Shared ShaderMaterial
    this.monolithMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime:          { value: 0 },
        uBass:          { value: 0 },
        uMid:           { value: 0 },
        uTreble:        { value: 0 },
        uBassScale:     { value: 0 },
        uMidSlide:      { value: 0 },
        uTrebleFlicker: { value: 0 },
        uLightDir:      { value: this._lightDir },
        uCameraPos:     { value: new THREE.Vector3() },
      },
      side: THREE.FrontSide,
    });

    // Create 3 instanced meshes (one per geometry type) split evenly
    this.instancedMeshes = geos.map((geo) => {
      const mesh = new THREE.InstancedMesh(geo, this.monolithMaterial, count);
      mesh.castShadow    = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      return mesh;
    });

    // Set instance matrices: arrange in GRID_SIZE × GRID_SIZE
    const dummy   = new THREE.Object3D();
    const halfGrid = (GRID_SIZE - 1) * CELL_SPACING * 0.5;

    for (let iz = 0; iz < GRID_SIZE; iz++) {
      for (let ix = 0; ix < GRID_SIZE; ix++) {
        const idx  = iz * GRID_SIZE + ix;
        // Assign pillar type via checkerboard + random mix
        const typeIdx = (ix + iz + Math.floor(Math.random() * 2)) % PILLAR_TYPES;

        const x = ix * CELL_SPACING - halfGrid;
        const z = iz * CELL_SPACING - halfGrid;
        dummy.position.set(x, 0, z);
        dummy.rotation.y = (Math.random() - 0.5) * 0.35;
        dummy.scale.setScalar(1);
        dummy.updateMatrix();

        for (let t = 0; t < PILLAR_TYPES; t++) {
          // Each mesh gets ALL instance slots but we only show one type per slot
          // by hiding the others (zero scale)
          if (t === typeIdx) {
            this.instancedMeshes[t].setMatrixAt(idx, dummy.matrix);
          } else {
            const zeroScale = new THREE.Matrix4().makeScale(0, 0, 0);
            this.instancedMeshes[t].setMatrixAt(idx, zeroScale);
          }
        }
      }
    }

    this.instancedMeshes.forEach(m => { m.instanceMatrix.needsUpdate = true; });
  }

  /* ── Infinite floor plane ─────────────────────────────────── */

  _initFloor() {
    const geo = new THREE.PlaneGeometry(600, 600, 64, 64);
    const mat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform float uTime;
        uniform float uBass;
        varying vec2 vUv;
        varying vec3 vWorldPos;

        void main() {
          // Grid lines
          vec2 grid = abs(fract(vWorldPos.xz * 0.154) - 0.5);
          float lineX = smoothstep(0.48, 0.5, grid.x);
          float lineZ = smoothstep(0.48, 0.5, grid.y);
          float line = max(lineX, lineZ);

          // Glow on bass hit
          vec3 gridColor  = vec3(0.91, 1.0, 0.0) * 0.35;
          vec3 baseColor  = vec3(0.025, 0.025, 0.03);
          float bassGlow  = uBass * 0.5 * (0.4 + 0.6 * sin(uTime * 6.0));

          vec3 color = mix(baseColor, gridColor, line * (0.4 + bassGlow));

          // Fog towards edges
          float dist = length(vWorldPos.xz) * 0.012;
          float fog  = 1.0 - exp(-dist * dist);
          color = mix(color, vec3(0.02, 0.02, 0.03), fog);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
      },
    });

    this.floor = new THREE.Mesh(geo, mat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -7;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);
    this.floorMat = mat;
  }

  /* ── Orbit Controls ───────────────────────────────────────── */

  _initControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping    = true;
    this.controls.dampingFactor    = 0.06;
    this.controls.minDistance      = 15;
    this.controls.maxDistance      = 110;
    this.controls.maxPolarAngle    = Math.PI * 0.58;
    this.controls.autoRotate       = true;
    this.controls.autoRotateSpeed  = 0.4;
    this.controls.target.set(0, 0, 0);
  }

  /* ── Resize handler ───────────────────────────────────────── */

  _handleResize() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth, h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  /* ── Per-frame update (called from main loop) ─────────────── */

  update(audio) {
    const delta = this.clock.getDelta();
    this.time  += delta;

    const bass   = audio?.bass   ?? 0;
    const mid    = audio?.mid    ?? 0;
    const treble = audio?.treble ?? 0;

    // ── Camera shake (bass transients) ──
    const shakeAmt = audio?.bassPeak ?? 0;
    this._shakeX   = (Math.random() - 0.5) * shakeAmt * 0.8;
    this._shakeY   = (Math.random() - 0.5) * shakeAmt * 0.5;
    this.camera.position.x += this._shakeX;
    this.camera.position.y += this._shakeY;

    // ── Auto-orbit speed scales with mid ──
    this.controls.autoRotateSpeed = 0.4 + mid * 2.5;

    // ── Light pulse (bass and treble) ──
    this.spotlight.intensity   = 4.0 + bass * 12.0;
    this.fillLight.intensity   = bass * 6.0;
    this.rimLight.intensity    = 0.6 + treble * 2.0;

    // ── Update shader uniforms ──
    const u = this.monolithMaterial.uniforms;
    u.uTime.value          = this.time;
    u.uBass.value          = bass;
    u.uMid.value           = mid;
    u.uTreble.value        = treble;
    u.uBassScale.value     = bass;
    u.uMidSlide.value      = mid;
    u.uTrebleFlicker.value = treble;
    u.uCameraPos.value.copy(this.camera.position);

    // ── Update floor uniforms ──
    this.floorMat.uniforms.uTime.value = this.time;
    this.floorMat.uniforms.uBass.value = bass;

    // ── Controls + render ──
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
