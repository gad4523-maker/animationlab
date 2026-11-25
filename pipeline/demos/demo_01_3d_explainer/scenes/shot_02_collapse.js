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
  scene.background = new THREE.Color('#09060b');
  const cam = new THREE.PerspectiveCamera(42, width / height, 0.05, 220);
  const composer = createCinemaComposer(renderer, width, height);

  scene.add(createStarfield(1000));

  const earth = createProceduralEarthMesh(1.0, { sunDir: [-0.80, 0.30, 0.55] });
  scene.add(earth);

  const atmoMat = createFresnelGlowMaterial('#f97316', 2.4, 2.2);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.22, 48, 36), atmoMat);
  scene.add(atmo);

  const { group: fieldGroup, mats: fieldMats } = createDipoleFieldLines(10, 1.85, '#38bdf8');
  scene.add(fieldGroup);

  const pCount = 360;
  const pPos = new Float32Array(pCount * 3);
  const pSeeds = [];
  const rand = createSeededRng(99);
  for (let i = 0; i < pCount; i++) pSeeds.push([rand(), (rand() - 0.5) * 1.3, (rand() - 0.5) * 1.3]);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  scene.add(
    new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: '#60a5fa',
        size: 0.14,
        map: createGlowSpriteTexture(64),
        transparent: true,
        opacity: 0.85,
        alphaTest: 0.005,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
  );

  const dur = Number(shot.duration_sec || 5.13);
  const epStart = Number(shot._start_sec || 6.67);
  const epTotal = Number(shot._total_sec || 11.8);

  // Keep Earth cleanly centered & inside 9:16 safe bounds (look.x near 0 so left hemisphere never crops!)
  const keyframes = [
    { t: 0.0, pos: [-1.8, 0.65, 6.0], look: [0.05, -0.05, 0], fov: 40, focus: 6.2, aperture: 0.22, shake: 0.0 },
    { t: dur * 0.40, pos: [-0.2, 0.20, 5.5], look: [0.22, -0.05, 0], fov: 44, focus: 5.5, aperture: 0.18, shake: 0.72 },
    { t: dur, pos: [2.0, 0.55, 7.2], look: [0.35, -0.05, 0], fov: 44, focus: 7.4, aperture: 0.26, shake: 0.15 },
  ];

  return {
    async renderFrame(_frame, t) {
      const collapse = ramp(t, 0.10, dur * 0.48);
      const cState = evalCameraTrack(keyframes, t);
      applyCameraState(cam, cState, t);

      earth.rotation.y = 1.1 + t * 0.22;
      earth.material.uniforms.uTime.value = t + 7.0;
      earth.material.uniforms.uCollapse.value = collapse;
      earth.material.uniforms.uCloudOpacity.value = lerp(0.82, 0.14, collapse);

      fieldGroup.rotation.y = 0.8 + t * 0.20;
      fieldGroup.scale.setScalar(1.0 + collapse * 1.5);
      for (const m of fieldMats) m.opacity = Math.max(0, 0.42 * (1 - collapse * 1.18));

      atmoMat.uniforms.uColor.value.set(collapse > 0.35 ? '#fb923c' : '#38bdf8');
      atmo.scale.setScalar(1.0 + collapse * 0.12);

      // Stream escaping atmosphere behind Earth (+X away from planet limb, zero dark-side snow overlap)
      const attr = pGeo.attributes.position;
      for (let i = 0; i < pCount; i++) {
        const [ph, y0, z0] = pSeeds[i];
        const prog = (ph + t * (0.35 + collapse * 0.65)) % 1.0;
        const x = lerp(0.35, 5.2, prog);
        const spread = 1 + Math.max(0, x - 0.35) * 0.38 * collapse;
        attr.setXYZ(i, x, y0 * spread, z0 * spread);
      }
      attr.needsUpdate = true;

      const flashAb = t >= dur * 0.28 && t <= dur * 0.46 ? Math.sin(((t - dur * 0.28) / (dur * 0.18)) * Math.PI) : 0;
      composer.render(scene, cam, {
        focus: cState.focus,
        aperture: cState.aperture,
        bloom: 0.78 + collapse * 0.32,
        ab: flashAb * 1.0,
        stress: collapse * 0.62,
        time: t + 7.0,
      });

      const utVal = Math.max(0, lerp(50.0, 0.0, clamp(t / (dur * 0.42))));
      ctxHud.clearRect(0, 0, width, height);
      drawTelemetryHUD(ctxHud, width, height, {
        badge: utVal > 1 ? 'DYNAMO COLLAPSING' : 'MAGNETIC FIELD LOST',
        title: params.title,
        subtitle: utVal > 1 ? 'SHIELD LINES FRACTURING' : 'ATMOSPHERE EROSION ACTIVE',
        statLabel: 'CORE DYNAMO',
        statValue: `${utVal.toFixed(1)} uT`,
        accent: collapse > 0.35 ? '#f97316' : '#38bdf8',
        warn: '#ef4444',
        progress: clamp((epStart + t) / epTotal),
        fadeIn: ramp(t, 0.0, 0.25),
        t,
      });
    },
  };
}
