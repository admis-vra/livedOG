// Hero "forge core": a lattice of metal cubes that assembles out of chaos into structure
// (ProblemForge's "chaos into structure"), wrapped around an ember core: GODEVIL inside livedOG.
//
// Loaded lazily by main.js after the page content is on screen. If WebGL is unavailable,
// the static fallback in the HTML stays visible and nothing here runs.

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

const COLORS = {
  steel: 0x232a3d,
  cyan: 0x7dd3fc,
  ember: 0xff7a59,
  violet: 0xa78bfa
};

export function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

function detectLowPower() {
  const small = window.matchMedia('(max-width: 640px)').matches;
  const cores = navigator.hardwareConcurrency || 8;
  const memory = navigator.deviceMemory || 8;
  return small || cores <= 4 || memory <= 4;
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export async function mountHeroScene({ host, hero, reducedMotion = false, autoStart = true }) {
  const THREE = await import(THREE_URL);
  const lowPower = detectLowPower();

  /* ---------- Renderer, scene, camera ---------- */

  const renderer = new THREE.WebGLRenderer({
    antialias: !lowPower,
    alpha: true,
    powerPreference: 'high-performance'
  });
  let maxDpr = lowPower ? 1.25 : 1.75;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

  // Reflections without downloading an HDR: render a tiny "room" with glowing panels once
  // and pre-filter it into an environment map.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const panel = (color, strength, w, h, pos, look) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), side: THREE.DoubleSide })
    );
    m.position.set(...pos);
    m.lookAt(...look);
    envScene.add(m);
    return m;
  };
  panel(COLORS.cyan, 3.2, 8, 5, [-7, 5, 4], [0, 0, 0]);
  panel(COLORS.ember, 3.6, 6, 6, [7, -3, 3], [0, 0, 0]);
  panel(0xffffff, 1.4, 12, 3, [0, 9, -2], [0, 0, 0]);
  panel(COLORS.violet, 1.6, 10, 4, [0, -8, -6], [0, 0, 0]);
  const envTarget = pmrem.fromScene(envScene, 0.04);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 1.6;
  envScene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  pmrem.dispose();

  /* ---------- Lattice ---------- */

  const N = lowPower ? 7 : 9;
  const half = (N - 1) / 2;
  const homes = [];
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      for (let z = 0; z < N; z++) {
        const onShell = x === 0 || y === 0 || z === 0 || x === N - 1 || y === N - 1 || z === N - 1;
        if (onShell) homes.push([x - half, y - half, z - half]);
      }
    }
  }
  const count = homes.length;

  // Deterministic randomness so the lattice looks the same on every visit
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const data = homes.map(([hx, hy, hz]) => {
    const r = 9 + rand() * 9;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    return {
      home: new THREE.Vector3(hx, hy, hz),
      chaos: new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi) * 0.7, r * Math.sin(phi) * Math.sin(theta)),
      dir: new THREE.Vector3(hx, hy, hz).normalize(),
      phase: rand() * Math.PI * 2,
      spin: 0.3 + rand() * 0.8,
      // Forge from the bottom up, with some noise so it reads as organic rather than mechanical
      delay: clamp01((hy + half) / (N - 1) * 0.6 + rand() * 0.4),
      // ~10% never settle: the leftover chaos orbiting the finished structure
      free: rand() < 0.1
    };
  });

  const cubeGeo = new THREE.BoxGeometry(0.62, 0.62, 0.62);
  // Partly metallic so faces pick up both the coloured reflections and the diffuse fill light
  const cubeMat = new THREE.MeshStandardMaterial({ color: COLORS.steel, metalness: 0.65, roughness: 0.38 });
  const lattice = new THREE.InstancedMesh(cubeGeo, cubeMat, count);
  lattice.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const tint = new THREE.Color();
  data.forEach((d, i) => {
    const roll = rand();
    if (roll < 0.07) tint.set(COLORS.ember).multiplyScalar(1.6);
    else if (roll < 0.14) tint.set(COLORS.cyan).multiplyScalar(1.4);
    else tint.setRGB(1, 1, 1);
    lattice.setColorAt(i, tint);
  });

  const group = new THREE.Group();
  group.add(lattice);

  /* ---------- Ember core ---------- */

  const coreGeo = new THREE.IcosahedronGeometry(N * 0.13, 0);
  const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS.ember).multiplyScalar(2.2) });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const g = glowCanvas.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,140,100,0.9)');
  grad.addColorStop(0.35, 'rgba(255,110,80,0.25)');
  grad.addColorStop(1, 'rgba(255,90,60,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.setScalar(N * 1.1);
  group.add(glow);

  const coreLight = new THREE.PointLight(COLORS.ember, 60, N * 1.6, 2);
  group.add(coreLight);
  scene.add(group);

  /* ---------- Lights that follow the pointer ---------- */

  // Cool from above (livedOG), warm from below (GODEVIL)
  scene.add(new THREE.HemisphereLight(COLORS.cyan, COLORS.ember, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(-6, 10, 12);
  scene.add(key);
  const pointerLight = new THREE.PointLight(COLORS.cyan, 140, 60, 2);
  pointerLight.position.set(0, 0, 14);
  scene.add(pointerLight);

  /* ---------- Dust ---------- */

  const dustCount = lowPower ? 120 : 260;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const r = 6 + rand() * 18;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    dustPos.set([r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)], i * 3);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: COLORS.cyan,
    size: 0.07,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  /* ---------- Layout ---------- */

  const BASE_TILT = { x: 0.52, y: 0.78 }; // roughly isometric, three faces visible
  let viewW = 1;
  let viewH = 1;

  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    // Fit the lattice: ~50% of viewport height on wide screens, ~70% of width on tall ones
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const size = N * 1.7;
    const zForHeight = size / (2 * 0.52 * tanHalf);
    const widthShare = camera.aspect < 0.6 ? 0.5 : 0.6; // phones: smaller, so it fits above the text
    const zForWidth = size / (2 * widthShare * tanHalf * camera.aspect);
    camera.position.set(0, 0, Math.max(zForHeight, zForWidth));
    camera.updateProjectionMatrix();

    viewH = 2 * camera.position.z * tanHalf;
    viewW = viewH * camera.aspect;
    // Text sits on the left on wide screens and at the bottom on tall ones, so move the core aside
    group.position.x = camera.aspect > 1.15 ? viewW * 0.2 : 0;
    group.position.y = camera.aspect > 1.15 ? 0 : viewH * (camera.aspect < 0.6 ? 0.29 : 0.23);
    if (!running) render(performance.now());
  };

  /* ---------- State ---------- */

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let assemble = reducedMotion ? 1 : 0;
  let assembleTarget = reducedMotion ? 1 : 0;
  let scatterUntil = 0;
  let heroProgress = 0;
  let idleSpin = 0;
  let last = performance.now();
  const dummy = new THREE.Object3D();
  const tmp = new THREE.Vector3();

  const updateLattice = (t) => {
    const explode = heroProgress * 2.2;
    for (let i = 0; i < count; i++) {
      const d = data[i];
      // Each cube starts moving once global progress passes its delay, then eases into place
      const local = d.free ? 0 : clamp01((assemble * 1.6 - d.delay) / 0.6);
      const e = easeInOut(local);

      // Chaos drifts on slow, independent sine paths
      tmp.copy(d.chaos);
      tmp.x += Math.sin(t * 0.25 + d.phase) * 0.8;
      tmp.y += Math.cos(t * 0.2 + d.phase) * 0.8;
      const breathe = reducedMotion ? 0 : Math.sin(t * 1.2 + d.phase) * 0.03;
      dummy.position.set(
        tmp.x + (d.home.x + d.dir.x * (explode + breathe) - tmp.x) * e,
        tmp.y + (d.home.y + d.dir.y * (explode + breathe) - tmp.y) * e,
        tmp.z + (d.home.z + d.dir.z * (explode + breathe) - tmp.z) * e
      );
      const spin = (1 - e) * (t * d.spin + d.phase);
      dummy.rotation.set(spin, spin * 0.7, spin * 0.4);
      dummy.updateMatrix();
      lattice.setMatrixAt(i, dummy.matrix);
    }
    lattice.instanceMatrix.needsUpdate = true;
  };

  function render(now) {
    const t = now / 1000;
    // Clamp both ways: long gaps (tab switches) shouldn't jump, out-of-order calls shouldn't rewind
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = Math.max(last, now);

    if (!reducedMotion) {
      if (scatterUntil && now > scatterUntil) {
        scatterUntil = 0;
        assembleTarget = 1;
      }
      // Assemble slowly, scatter fast
      const rate = assembleTarget > assemble ? 0.42 : 2.4;
      assemble += Math.sign(assembleTarget - assemble) * Math.min(Math.abs(assembleTarget - assemble), rate * dt);
      idleSpin += dt * 0.12;

      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
    }

    group.rotation.x = BASE_TILT.x + pointer.y * 0.25 + heroProgress * 0.4;
    group.rotation.y = BASE_TILT.y + idleSpin + pointer.x * 0.45 + heroProgress * 1.2;

    const pulse = reducedMotion ? 1 : 1 + Math.sin(t * 2.1) * 0.08;
    core.scale.setScalar(pulse * (0.4 + 0.6 * assemble));
    core.rotation.y = t * 0.4;
    glow.material.opacity = 0.35 + 0.65 * assemble;
    coreLight.intensity = 25 + 55 * assemble * pulse;

    pointerLight.position.set(
      group.position.x + pointer.x * viewW * 0.45,
      group.position.y + pointer.y * viewH * 0.45,
      14
    );
    dust.rotation.y = t * 0.02;
    dust.rotation.x = t * 0.01;

    updateLattice(t);
    renderer.render(scene, camera);
  }

  /* ---------- Loop: only while visible ---------- */

  let running = false;
  let heroVisible = true;
  let rafId = 0;
  let frames = 0;
  let frameTimeSum = 0;
  let degraded = false;

  const loop = (now) => {
    rafId = requestAnimationFrame(loop);
    // Adaptive quality: if the first ~2s average under ~30fps, drop resolution and dust once
    if (!degraded && frames < 120) {
      frames++;
      frameTimeSum += now - last;
      if (frames === 120 && frameTimeSum / frames > 33) {
        degraded = true;
        maxDpr = 1;
        renderer.setPixelRatio(1);
        dust.visible = false;
        resize();
      }
    }
    render(now);
  };

  const updateRunning = () => {
    const shouldRun = !reducedMotion && heroVisible && !document.hidden;
    if (shouldRun === running) return;
    running = shouldRun;
    if (running) {
      last = performance.now();
      rafId = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(rafId);
    }
  };

  const io = new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    updateRunning();
  });
  io.observe(hero);

  const ro = new ResizeObserver(resize);
  ro.observe(host);

  const onVisibility = () => updateRunning();
  document.addEventListener('visibilitychange', onVisibility);

  const onPointer = (e) => {
    if (e.pointerType === 'touch') return;
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  const onScroll = () => {
    const r = hero.getBoundingClientRect();
    heroProgress = clamp01(-r.top / r.height);
    if (!running && heroVisible) render(performance.now());
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    hero.classList.remove('is-scene-ready');
    destroy();
  });

  resize();
  onScroll();
  render(performance.now());
  updateRunning();
  if (autoStart) start();

  /* ---------- Public controls ---------- */

  function start() {
    assembleTarget = 1;
  }

  function scatter() {
    if (reducedMotion) return;
    assembleTarget = 0;
    scatterUntil = performance.now() + 650;
  }

  // Steps the simulation without rAF; used for testing when the browser throttles frames
  function advance(seconds, fps = 60) {
    const step = 1000 / fps;
    let now = last;
    for (let i = 0; i < seconds * fps; i++) {
      now += step;
      render(now);
    }
  }

  function destroy() {
    cancelAnimationFrame(rafId);
    running = false;
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('scroll', onScroll);
    [cubeGeo, coreGeo, dustGeo].forEach((x) => x.dispose());
    [cubeMat, coreMat, glowMat, dustMat].forEach((x) => x.dispose());
    glowTex.dispose();
    envTarget.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { start, scatter, destroy, advance, lowPower, get assemble() { return assemble; } };
}
