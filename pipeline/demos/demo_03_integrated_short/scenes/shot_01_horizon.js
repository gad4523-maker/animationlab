import * as THREE from '/pipeline/vendor/three/three.module.min.js';
import { evalCameraTrack, applyCameraState, clamp, ramp } from '/pipeline/core/camera.js';
import { createCinemaComposer } from '/pipeline/core/postprocess.js';
import { createStarfield, createFresnelGlowMaterial, createAccretionDiscMaterial, createGlowSpriteTexture, createSeededRng } from '/pipeline/core/assets.js';
import { drawTelemetryHUD } from '/pipeline/core/overlay_hud.js';

export async function initShot({ glCanvas, hudCanvas, width, height, shot, params }) {
  const ctxHud = hudCanvas.getContext('2d');
  const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: false, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#04050a');
  const cam = new THREE.PerspectiveCamera(46, width / height, 0.05, 220);
  const composer = createCinemaComposer(renderer, width, height);

  scene.add(createStarfield(1100, 16, 52, 0.14, 31));

  // Depth-writing black shadow sphere prevents far-side stars/halo bleed
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.92, 48, 36),
    new THREE.MeshBasicMaterial({ color: '#000000', depthWrite: true })
  );
  scene.add(core);
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.14, 48, 36), createFresnelGlowMaterial('#ff8822', 2.4, 2.2)));

  // Continuous GLSL FBM swirling Doppler accretion disk
  const discMat = createAccretionDiscMaterial({ innerR: 1.05, outerR: 2.65, hueWarm: '#ea580c', hueHot: '#fff3c4' });
  const disc = new THREE.Mesh(new THREE.RingGeometry(1.05, 2.65, 96, 24), discMat);
  disc.rotation.x = Math.PI * 0.36;
  disc.rotation.y = 0.16;
  scene.add(disc);

  // Secondary vertical lensed halo shell wrapping behind core (simulates Einstein light bending above/below shadow)
  const lensedMat = createAccretionDiscMaterial({ innerR: 1.02, outerR: 1.55, hueWarm: '#f97316', hueHot: '#fef3c7' });
  const lensedArc = new THREE.Mesh(new THREE.RingGeometry(1.02, 1.55, 96, 16), lensedMat);
  lensedArc.position.z = -0.15;
  scene.add(lensedArc);

  const pCount = 240;
  const pPos = new Float32Array(pCount * 3);
  const rand = createSeededRng(505);
  const pMeta = [];
  for (let i = 0; i < pCount; i++) pMeta.push([1.15 + rand() * 1.45, rand() * Math.PI * 2, (rand() - 0.5) * 0.12, 1.4 + rand() * 1.6]);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMesh = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      color: '#fde68a',
      size: 0.13,
      map: createGlowSpriteTexture(64),
      transparent: true,
      opacity: 0.88,
      alphaTest: 0.005,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  disc.add(pMesh);

  const dur = Number(shot.duration_sec || 5.9);
  const epStart = Number(shot._start_sec || 0.0);
  const epTotal = Number(shot._total_sec || dur * 2.8);

  // Pull camera to 9.4..8.2 so the entire outerR=2.65 accretion disc sits cleanly inside 9:16 width!
  const keyframes = [
    { t: 0.0, pos: [2.4, 2.1, 9.6], look: [0, -0.05, 0], fov: 46, focus: 9.8, aperture: 0.18 },
    { t: dur * 0.55, pos: [0.3, 1.4, 8.2], look: [0, -0.05, 0], fov: 44, focus: 8.3, aperture: 0.28 },
    { t: dur, pos: [-2.0, 0.9, 7.8], look: [0, -0.05, 0], fov: 42, focus: 8.0, aperture: 0.22 },
  ];

  return {
    async renderFrame(_frame, t) {
      const cState = evalCameraTrack(keyframes, t);
      applyCameraState(cam, cState, t);
      lensedArc.lookAt(cam.position);
      discMat.uniforms.uTime.value = t;
      lensedMat.uniforms.uTime.value = t * 1.1;
      disc.rotation.z = t * 0.45;

      const attr = pGeo.attributes.position;
      for (let i = 0; i < pCount; i++) {
        const [r, a0, z0, spd] = pMeta[i];
        const ang = a0 + t * spd * (1.8 / r);
        attr.setXYZ(i, Math.cos(ang) * r, Math.sin(ang) * r, z0);
      }
      attr.needsUpdate = true;

      composer.render(scene, cam, { focus: cState.focus, aperture: cState.aperture, bloom: 0.88, time: t });

      ctxHud.clearRect(0, 0, width, height);
      drawTelemetryHUD(ctxHud, width, height, {
        badge: params.badge,
        title: params.title,
        subtitle: 'GRAVITATIONAL RADIUS // 29.5 KM',
        statLabel: 'ORBITAL VELOCITY',
        statValue: '0.84 c',
        accent: '#f59e0b',
        warn: '#ef4444',
        progress: clamp((epStart + t) / epTotal),
        fadeIn: ramp(t, 0.0, 0.35),
        fadeOut: 1.0 - ramp(t, dur - 0.25, dur),
        t,
      });
    },
  };
}
