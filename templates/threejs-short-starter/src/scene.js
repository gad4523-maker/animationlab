import * as THREE from '../vendor/three.module.min.js';

const W = 1080;
const H = 1920;

const resp = await fetch('./storyboard.example.json');
const storyboard = await resp.json();

const canvas = document.getElementById('gl-canvas');
const gl = canvas.getContext('webgl2', {
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: true,
});

const renderer = new THREE.WebGLRenderer({ canvas, context: gl });
renderer.setPixelRatio(1.0);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(storyboard.theme?.bg || '#060b18');
scene.fog = new THREE.FogExp2('#060b18', 0.045);

const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);

scene.add(new THREE.AmbientLight('#3b5998', 0.65));
const sunLight = new THREE.DirectionalLight('#fff4d6', 2.8);
sunLight.position.set(5, 3.5, 4);
scene.add(sunLight);
const rimLight = new THREE.DirectionalLight('#38bdf8', 1.4);
rimLight.position.set(-4, -1.5, -3);
scene.add(rimLight);

// Procedural planet + wireframe grid + atmospheric shell + orbital ring + stars
const planetGroup = new THREE.Group();
scene.add(planetGroup);

const coreGeo = new THREE.SphereGeometry(1.0, 48, 36);
const coreMat = new THREE.MeshStandardMaterial({
  color: '#1d4ed8',
  roughness: 0.45,
  metalness: 0.12,
});
const planet = new THREE.Mesh(coreGeo, coreMat);
planetGroup.add(planet);

const wireGeo = new THREE.SphereGeometry(1.015, 24, 16);
const wireMat = new THREE.MeshBasicMaterial({
  color: '#38bdf8',
  wireframe: true,
  transparent: true,
  opacity: 0.28,
});
planetGroup.add(new THREE.Mesh(wireGeo, wireMat));

const atmoGeo = new THREE.SphereGeometry(1.08, 48, 36);
const atmoMat = new THREE.MeshBasicMaterial({
  color: '#60a5fa',
  transparent: true,
  opacity: 0.14,
  side: THREE.BackSide,
});
planetGroup.add(new THREE.Mesh(atmoGeo, atmoMat));

const ringGeo = new THREE.TorusGeometry(1.48, 0.014, 12, 96);
const ringMat = new THREE.MeshBasicMaterial({
  color: '#f97316',
  transparent: true,
  opacity: 0.78,
});
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI * 0.44;
planetGroup.add(ring);

// Starfield (seeded deterministic points)
const starCount = 700;
const starPos = new Float32Array(starCount * 3);
let seed = 1337;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
for (let i = 0; i < starCount; i++) {
  const r = 8 + rand() * 14;
  const theta = rand() * Math.PI * 2;
  const phi = Math.acos(2 * rand() - 1);
  starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  starPos[i * 3 + 1] = r * Math.cos(phi);
  starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const stars = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({ color: '#cbd5e1', size: 0.045, transparent: true, opacity: 0.85 })
);
scene.add(stars);

const elBadge = document.getElementById('badge');
const elHeadline = document.getElementById('headline');
const elCaption = document.getElementById('caption');
const elTimecode = document.getElementById('timecode');
const elBeatName = document.getElementById('beat-name');
const elProgress = document.getElementById('progress');

const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
};

window.renderFrame = function renderFrame(frame, fps = 30) {
  const t = frame / fps;
  const scenes = storyboard.scenes;
  let active = scenes[0];
  let next = scenes[0];
  for (let i = 0; i < scenes.length; i++) {
    if (t >= scenes[i].start_sec) {
      active = scenes[i];
      next = scenes[Math.min(scenes.length - 1, i + 1)];
    }
  }
  const span = Math.max(0.01, active.end_sec - active.start_sec);
  const u = smooth((t - active.start_sec) / span);

  const dist = lerp(active.camera.dist, next.camera.dist, u * 0.6);
  const yaw = THREE.MathUtils.degToRad(lerp(active.camera.yaw_deg, next.camera.yaw_deg, u * 0.6) + t * 8);
  const pitch = THREE.MathUtils.degToRad(lerp(active.camera.pitch_deg, next.camera.pitch_deg, u * 0.6));

  camera.position.set(
    dist * Math.cos(pitch) * Math.sin(yaw),
    dist * Math.sin(pitch) - 0.12,
    dist * Math.cos(pitch) * Math.cos(yaw)
  );
  camera.lookAt(0, -0.08, 0);

  planetGroup.rotation.y = t * 0.42;
  ring.rotation.z = t * 0.65;
  stars.rotation.y = -t * 0.03;

  elBadge.textContent = active.badge;
  elHeadline.textContent = active.headline;
  elCaption.textContent = active.caption;
  elTimecode.textContent = `T+${t.toFixed(2).padStart(5, '0')}s`;
  elBeatName.textContent = active.id.toUpperCase();
  elProgress.style.width = `${Math.min(100, (t / storyboard.duration_sec) * 100).toFixed(1)}%`;

  renderer.render(scene, camera);
};

// Initial preview frame
window.renderFrame(0, 30);
