import * as THREE from '/pipeline/vendor/three/three.module.min.js';
import { evalCameraTrack, applyCameraState, clamp, lerp, ramp } from '/pipeline/core/camera.js';
import { createCinemaComposer } from '/pipeline/core/postprocess.js';
import {
  createStarfield, createProceduralEarthMesh, createFresnelGlowMaterial,
  createDipoleFieldLines, createGlowSpriteTexture, createSeededRng,
} from '/pipeline/core/assets.js';
import { drawTelemetryHUD } from '/pipeline/core/overlay_hud.js';

export async function initShot({ glCanvas, hudCanvas, width, height, shot, params }) {
  const ctxHud = hudCanvas.getContext('2d');
  const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: false, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05070e');
  const cam = new THREE.PerspectiveCamera(42, width / height, 0.05, 220);
  const composer = createCinemaComposer(renderer, width, height);

  scene.add(createStarfield(1000));

  const earth = createProceduralEarthMesh(1.0, { sunDir: [0.80, 0.35, 0.55] });
  scene.add(earth);

  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.18, 48, 36), createFresnelGlowMaterial('#38bdf8', 2.4, 2.2)));

  const { group: fieldGroup, mats: fieldMats } = createDipoleFieldLines(10, 1.85, '#38bdf8');
  scene.add(fieldGroup);

  const pCount = 240;
  const pPos = new Float32Array(pCount * 3);
  const pSeeds = [];
  const rand = createSeededRng(17);
  for (let i = 0; i < pCount; i++) pSeeds.push([rand(), (rand() - 0.5) * 2.8, (rand() - 0.5) * 2.2]);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const solarPts = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      color: '#fbbf24',
      size: 0.13,
      map: createGlowSpriteTexture(64),
      transparent: true,
      opacity: 0.90,
      alphaTest: 0.005,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  scene.add(solarPts);

  const dur = Number(shot.duration_sec || 6.87);
  const epStart = Number(shot._start_sec || 0.0);
  const epTotal = Number(shot._total_sec || dur * 1.9);

  // Framed cleanly for 9:16 portrait center band (y in 28%..68% H, zero edge clipping!)
  const keyframes = [
    { t: 0.0, pos: [2.4, -0.55, 7.6], look: [0, -0.05, 0], fov: 44, focus: 7.9, aperture: 0.18 },
    { t: dur * 0.5, pos: [0.3, 0.20, 6.4], look: [0, -0.05, 0], fov: 41, focus: 6.5, aperture: 0.30 },
    { t: dur, pos: [-1.8, 0.65, 6.0], look: [0, -0.05, 0], fov: 40, focus: 6.2, aperture: 0.22 },
  ];

  const probeVec = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);

  return {
    async renderFrame(_frame, t) {
      const cState = evalCameraTrack(keyframes, t);
      applyCameraState(cam, cState, t);

      earth.rotation.y = t * 0.18;
      earth.material.uniforms.uTime.value = t;
      fieldGroup.rotation.y = t * 0.14;
      for (let i = 0; i < fieldMats.length; i++) {
        fieldMats[i].opacity = 0.32 + 0.16 * Math.sin(t * 4.5 + i);
      }

      const attr = pGeo.attributes.position;
      for (let i = 0; i < pCount; i++) {
        const [ph, y0, z0] = pSeeds[i];
        const prog = (ph + t * 0.36) % 1.0;
        const x = lerp(-5.5, 2.8, prog);
        const rRad = Math.hypot(y0, z0);
        const push = x > -2.2 ? Math.exp(-((x + 0.3) ** 2) * 0.45) * (1.65 / Math.max(0.4, rRad)) : 0;
        attr.setXYZ(i, x, y0 + (y0 >= 0 ? 1 : -1) * push, z0);
      }
      attr.needsUpdate = true;

      composer.render(scene, cam, { focus: cState.focus, aperture: cState.aperture, bloom: 0.72, time: t });

      probeVec.set(1.70, 0.35, 0.0).applyAxisAngle(yAxis, fieldGroup.rotation.y).project(cam);
      const tx = clamp((probeVec.x * 0.5 + 0.5) * width, 160, width - 160);
      const ty = clamp((-probeVec.y * 0.5 + 0.5) * height, height * 0.31, height * 0.68);

      ctxHud.clearRect(0, 0, width, height);
      drawTelemetryHUD(ctxHud, width, height, {
        badge: params.badge,
        title: params.title,
        subtitle: 'SOLAR WIND DEFLECTION // 400 KM/S',
        statLabel: 'CORE DYNAMO',
        statValue: '50.0 uT',
        callout: { x: width * 0.56, y: height * 0.30, tx, ty, label: 'MAGNETOPAUSE', value: 'DEFLECTING PLASMA' },
        progress: clamp((epStart + t) / epTotal),
        fadeIn: ramp(t, 0.0, 0.35),
        fadeOut: 1.0 - ramp(t, dur - 0.25, dur),
        t,
      });
    },
  };
}
