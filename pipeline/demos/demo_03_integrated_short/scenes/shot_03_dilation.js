import * as THREE from '/pipeline/vendor/three/three.module.min.js';
import { evalCameraTrack, applyCameraState, clamp, lerp, ramp } from '/pipeline/core/camera.js';
import { createCinemaComposer } from '/pipeline/core/postprocess.js';
import { createStarfield, createFresnelGlowMaterial, createAccretionDiscMaterial, createGlowSpriteTexture, createSeededRng } from '/pipeline/core/assets.js';
import { drawTelemetryHUD } from '/pipeline/core/overlay_hud.js';

export async function initShot({ glCanvas, hudCanvas, width, height, shot, params }) {
  const ctxHud = hudCanvas.getContext('2d');
  const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: false, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#04050d');
  const cam = new THREE.PerspectiveCamera(45, width / height, 0.05, 250);
  const composer = createCinemaComposer(renderer, width, height);

  const stars = createStarfield(1300, 16, 55, 0.14, 88);
  scene.add(stars);

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.92, 48, 36), new THREE.MeshBasicMaterial({ color: '#000000', depthWrite: true }));
  scene.add(core);
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.14, 48, 36), createFresnelGlowMaterial('#60a5fa', 2.2, 2.2)));
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.32, 48, 36), createFresnelGlowMaterial('#bae6fd', 1.6, 3.2)));

  const discMat = createAccretionDiscMaterial({ innerR: 1.08, outerR: 2.85, hueWarm: '#f59e0b', hueHot: '#fef9c3' });
  const disc = new THREE.Mesh(new THREE.RingGeometry(1.08, 2.85, 96, 24), discMat);
  disc.rotation.x = Math.PI * 0.40;
  scene.add(disc);

  // Secondary vertical lensed Einstein arc behind core
  const lensedMat = createAccretionDiscMaterial({ innerR: 1.02, outerR: 1.58, hueWarm: '#38bdf8', hueHot: '#e0f2fe' });
  const lensedArc = new THREE.Mesh(new THREE.RingGeometry(1.02, 1.58, 96, 16), lensedMat);
  lensedArc.position.z = -0.15;
  scene.add(lensedArc);

  const jCount = 240;
  const jPos = new Float32Array(jCount * 3);
  const rand = createSeededRng(707);
  const jSeeds = [];
  for (let i = 0; i < jCount; i++) jSeeds.push([rand(), (i % 2 === 0 ? 1 : -1), (rand() - 0.5) * 0.22, (rand() - 0.5) * 0.22]);
  const jGeo = new THREE.BufferGeometry();
  jGeo.setAttribute('position', new THREE.BufferAttribute(jPos, 3));
  scene.add(
    new THREE.Points(
      jGeo,
      new THREE.PointsMaterial({
        color: '#7dd3fc',
        size: 0.15,
        map: createGlowSpriteTexture(64),
        transparent: true,
        opacity: 0.85,
        alphaTest: 0.005,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
  );

  const dur = Number(shot.duration_sec || 5.9);
  const epStart = Number(shot._start_sec || 10.6);
  const epTotal = Number(shot._total_sec || 16.5);

  const keyframes = [
    { t: 0.0, pos: [-1.4, 0.95, 7.6], look: [0, -0.05, 0], fov: 42, focus: 7.8, aperture: 0.22, shake: 0.30 },
    { t: dur * 0.45, pos: [0.4, 1.45, 8.8], look: [0, -0.05, 0], fov: 44, focus: 8.9, aperture: 0.25, shake: 0.12 },
    { t: dur, pos: [2.4, 2.2, 10.6], look: [0, -0.05, 0], fov: 46, focus: 10.8, aperture: 0.16, shake: 0.04 },
  ];

  return {
    async renderFrame(_frame, t) {
      const cState = evalCameraTrack(keyframes, t);
      applyCameraState(cam, cState, t);
      lensedArc.lookAt(cam.position);
      discMat.uniforms.uTime.value = t + 6.0;
      lensedMat.uniforms.uTime.value = t * 1.2 + 3.0;
      disc.rotation.z = t * 0.55;
      stars.rotation.y = -t * 0.24;

      const attr = jGeo.attributes.position;
      for (let i = 0; i < jCount; i++) {
        const [ph, dir, x0, z0] = jSeeds[i];
        const prog = (ph + t * 0.85) % 1.0;
        const y = dir * lerp(0.92, 6.2, prog);
        attr.setXYZ(i, x0 * (1 + prog * 1.8), y, z0 * (1 + prog * 1.8));
      }
      attr.needsUpdate = true;

      composer.render(scene, cam, {
        focus: cState.focus,
        aperture: cState.aperture,
        bloom: 0.90,
        ab: Math.max(0, 1 - t / 1.3) * 0.65,
        time: t + 10.0,
      });

      const yrs = Math.round(Math.pow(ramp(t, 0, dur), 1.6) * 900);
      ctxHud.clearRect(0, 0, width, height);
      drawTelemetryHUD(ctxHud, width, height, {
        badge: params.badge,
        title: params.title,
        subtitle: 'GRAVITATIONAL REDSHIFT',
        statLabel: 'OUTSIDE TIME',
        statValue: `+${yrs} YRS`,
        accent: '#38bdf8',
        warn: '#fde047',
        progress: clamp((epStart + t) / epTotal),
        fadeIn: ramp(t, 0.0, 0.30),
        t,
      });
    },
  };
}
