// All 36 Anidoodle craft medium renderers + Three.js 3D stage driving perfected Goku Super Saiyan
import * as THREE from 'three';
import { solveChoreography } from '../../shared/choreography.js';
import { drawGoku2DMaster } from '../../shared/goku_2d_master.js';
import {
  makePaperTexture,
  renderEngravingOrDither,
  renderPainterlyMedium,
  renderPixelGrid,
  sampleGrid,
} from '../../shared/medium_filters.js';

const W = 720, H = 1280;
let mainCanvas, mainCtx, offCanvas, offCtx;
let threeRenderer, threeScene, threeCam, gokuPlaneTex, gokuPlaneMesh, crystalGroup;

const PAL_16 = [
  [10, 12, 24], [28, 34, 62], [242, 94, 18], [168, 52, 8],
  [255, 168, 60], [20, 59, 148], [12, 32, 92], [245, 190, 146],
  [200, 132, 86], [255, 226, 64], [255, 249, 196], [201, 136, 0],
  [30, 230, 176], [222, 38, 38], [248, 204, 56], [240, 242, 250],
];

function ensureCanvases() {
  if (!mainCanvas) {
    mainCanvas = document.createElement('canvas');
    mainCanvas.width = W;
    mainCanvas.height = H;
    mainCtx = mainCanvas.getContext('2d');
    document.body.appendChild(mainCanvas);
  }
  if (!offCanvas) {
    offCanvas = document.createElement('canvas');
    offCanvas.width = W;
    offCanvas.height = H;
    offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
  }
}

function initThreeStage() {
  if (threeRenderer) return;
  threeRenderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  threeRenderer.setSize(W, H);
  threeRenderer.setClearColor(0x070c1c);

  threeScene = new THREE.Scene();
  threeCam = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);

  const amb = new THREE.AmbientLight(0xffffff, 1.1);
  const pt = new THREE.PointLight(0xffd838, 4.0, 20);
  pt.position.set(0, 1.5, 2.0);
  threeScene.add(amb, pt);

  // Arena Floor Grid
  const floorGeo = new THREE.CircleGeometry(6, 32);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x262130, roughness: 0.85 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.6;
  threeScene.add(floor);

  gokuPlaneTex = new THREE.CanvasTexture(offCanvas);
  const planeGeo = new THREE.PlaneGeometry(2.4, 4.26);
  const planeMat = new THREE.MeshBasicMaterial({ map: gokuPlaneTex, transparent: true });
  gokuPlaneMesh = new THREE.Mesh(planeGeo, planeMat);
  threeScene.add(gokuPlaneMesh);

  crystalGroup = new THREE.Group();
  const cGeo = new THREE.OctahedronGeometry(0.18, 0);
  const cMat = new THREE.MeshStandardMaterial({ color: 0xffe44d, emissive: 0xffaa10, emissiveIntensity: 0.7, flatShading: true });
  for (let i = 0; i < 12; i++) {
    const m = new THREE.Mesh(cGeo, cMat);
    const ang = (i / 12) * Math.PI * 2;
    m.position.set(Math.cos(ang) * 1.4, -1.3 + (i % 4) * 0.5, Math.sin(ang) * 1.1);
    crystalGroup.add(m);
  }
  threeScene.add(crystalGroup);
}

window.renderAnidoodleStyle = (slug, t) => {
  ensureCanvases();
  const ch = solveChoreography(t);
  const isSSJ = ch.ssj > 0.5;

  if (slug === 'three-3d') {
    initThreeStage();
    offCtx.clearRect(0, 0, W, H);
    drawGoku2DMaster(offCtx, ch, W, H, { skipBackground: true });
    gokuPlaneTex.needsUpdate = true;

    const yaw = (ch.camYaw * Math.PI) / 180;
    const dist = 4.3 * ch.camDist;
    threeCam.position.set(Math.sin(yaw) * dist + ch.shakeX * 1.2, 0.2 - ch.camY * 1.5 + ch.shakeY * 1.2, Math.cos(yaw) * dist);
    threeCam.lookAt(0, -0.1, 0);
    gokuPlaneMesh.lookAt(threeCam.position.x, gokuPlaneMesh.position.y, threeCam.position.z);

    crystalGroup.children.forEach((c, idx) => {
      c.position.y = -1.2 + ch.charge * (0.4 + (idx % 4) * 0.45) + Math.sin(t * 4 + idx) * 0.12;
      c.rotation.y = t * (1.2 + ch.auraPower);
      c.rotation.x = t * 0.8 + idx;
    });
    threeRenderer.render(threeScene, threeCam);
    return threeRenderer.domElement.toDataURL('image/jpeg', 0.90);
  }

  // Render clean master Goku to offscreen canvas
  offCtx.clearRect(0, 0, W, H);
  drawGoku2DMaster(offCtx, ch, W, H, {
    skipBackground: ['embroidery', 'moonPhases', 'blueprint', 'sumiE', 'stipple', 'mellan', 'scratchboard', 'pocketWatch', 'scrapbook', 'quiet-scrapbook'].includes(slug),
  });

  mainCtx.clearRect(0, 0, W, H);

  switch (slug) {
    case 'embroidery':
      renderPixelGrid(mainCtx, offCanvas, W, H, 10, 'embroidery');
      break;
    case 'toyBrick':
      renderPixelGrid(mainCtx, offCanvas, W, H, 14, 'brick');
      break;
    case 'pixelArt':
      renderPixelGrid(mainCtx, offCanvas, W, H, 8, 'pixel', PAL_16);
      break;
    case 'stipple':
      renderPixelGrid(mainCtx, offCanvas, W, H, 7, 'stipple');
      break;
    case 'halftone':
      renderPixelGrid(mainCtx, offCanvas, W, H, 8, 'halftone');
      break;
    case 'brokenColour':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'brokenColour', t);
      break;
    case 'paintedOil':
    case 'almond-blossom':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'impasto', t);
      if (slug === 'almond-blossom') {
        mainCtx.fillStyle = 'rgba(70,175,185,0.18)';
        mainCtx.fillRect(0, 0, W, H);
      }
      break;
    case 'pastel-blotch':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'watercolor', t);
      mainCtx.fillStyle = 'rgba(245,210,220,0.18)';
      mainCtx.fillRect(0, 0, W, H);
      break;
    case 'ranunculus':
    case 'storybook':
    case 'wren':
    case 'folkTale':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'watercolor', t);
      break;
    case 'sumiE':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'sumiE', t);
      break;
    case 'lighthouse':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'risograph', t);
      break;
    case 'balloon':
    case 'colouredPencil':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'pencil', t);
      break;
    case 'charcoalErasure':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'charcoal', t);
      break;
    case 'blueprint':
      renderEngravingOrDither(mainCtx, offCanvas, W, H, 'blueprint', t);
      break;
    case 'scratchboard':
      renderEngravingOrDither(mainCtx, offCanvas, W, H, 'scratchboard', t);
      break;
    case 'mellan':
      renderEngravingOrDither(mainCtx, offCanvas, W, H, 'mellan', t);
      break;
    case 'moonPhases': {
      // Green-slate Chalkboard + dusty chalk strokes + wooden chalk rail
      mainCtx.drawImage(makePaperTexture('slate', '#1f3329', { grain: 26, fibers: 600, dark: true }), 0, 0);
      mainCtx.save();
      mainCtx.filter = 'grayscale(0.25) contrast(1.25)';
      mainCtx.globalCompositeOperation = 'screen';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      mainCtx.fillStyle = '#5c3c20'; mainCtx.fillRect(0, H - 28, W, 28);
      mainCtx.fillStyle = '#f2efe6'; mainCtx.fillRect(60, H - 36, 48, 8);
      break;
    }
    case 'pocketWatch': {
      // Blue ballpoint ink on cream cartridge paper
      mainCtx.drawImage(makePaperTexture('cream_pen', '#f6efe2', { grain: 16, fibers: 700 }), 0, 0);
      mainCtx.save();
      mainCtx.filter = 'sepia(1) hue-rotate(185deg) saturate(2.5) contrast(1.3)';
      mainCtx.globalCompositeOperation = 'multiply';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    }
    case 'rubberHose': {
      // 1930s B&W vintage film grain + sepia tone + iris vignette
      mainCtx.fillStyle = '#cfc4ab';
      mainCtx.fillRect(0, 0, W, H);
      mainCtx.save();
      mainCtx.filter = 'grayscale(1) sepia(0.35) contrast(1.4)';
      mainCtx.drawImage(offCanvas, Math.sin(t * 45) * 1.5, Math.cos(t * 37) * 1.5);
      mainCtx.restore();
      const vg = mainCtx.createRadialGradient(W / 2, H / 2, 180, W / 2, H / 2, 680);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(15,10,5,0.65)');
      mainCtx.fillStyle = vg;
      mainCtx.fillRect(0, 0, W, H);
      break;
    }
    case 'paperCraft': {
      // Cardboard Toy Theatre with red curtains & drop shadow layers
      mainCtx.drawImage(makePaperTexture('theatre', '#1b263b', { grain: 18, fibers: 500, dark: true }), 0, 0);
      mainCtx.save();
      mainCtx.shadowColor = 'rgba(0,0,0,0.65)';
      mainCtx.shadowBlur = 14;
      mainCtx.shadowOffsetX = 10;
      mainCtx.shadowOffsetY = 12;
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      mainCtx.fillStyle = '#8b1a1a';
      mainCtx.fillRect(0, 0, 44, H);
      mainCtx.fillRect(W - 44, 0, 44, H);
      mainCtx.fillStyle = '#a82222';
      mainCtx.beginPath(); mainCtx.arc(W / 2, -60, 420, 0.25, Math.PI - 0.25); mainCtx.fill();
      break;
    }
    case 'fox': {
      // Cut-paper collage: soft drop shadow + crisp unlined paper cut look
      mainCtx.drawImage(makePaperTexture('cutpaper', '#1c2938', { grain: 22, fibers: 900, dark: true }), 0, 0);
      mainCtx.save();
      mainCtx.shadowColor = 'rgba(0,0,0,0.55)';
      mainCtx.shadowBlur = 10;
      mainCtx.shadowOffsetX = 8;
      mainCtx.shadowOffsetY = 8;
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    }
    case 'scrapbook':
    case 'quiet-scrapbook': {
      mainCtx.drawImage(makePaperTexture('rag_album', '#e8dcc2', { grain: 24, fibers: 1100, speck: 450 }), 0, 0);
      mainCtx.save();
      mainCtx.translate(W / 2, H / 2);
      mainCtx.rotate(-0.025);
      mainCtx.fillStyle = '#fdfaf2';
      mainCtx.shadowColor = 'rgba(0,0,0,0.35)'; mainCtx.shadowBlur = 16;
      mainCtx.fillRect(-310, -560, 620, 1120);
      mainCtx.shadowBlur = 0;
      mainCtx.filter = slug === 'quiet-scrapbook' ? 'sepia(0.35) contrast(1.05)' : 'saturate(0.88)';
      mainCtx.drawImage(offCanvas, -295, -545, 590, 1050);
      // Tape strips
      mainCtx.fillStyle = 'rgba(235,215,155,0.68)';
      mainCtx.fillRect(-260, -575, 110, 34);
      mainCtx.fillRect(150, -575, 110, 34);
      mainCtx.restore();
      break;
    }
    case 'woodcut': {
      // Edo Ukiyo-e Woodblock on kozo washi with bokashi tone & warm ink borders
      mainCtx.drawImage(makePaperTexture('kozo', '#f2e6ca', { grain: 20, fibers: 1400, speck: 250 }), 0, 0);
      mainCtx.save();
      mainCtx.filter = 'saturate(0.82) contrast(1.22)';
      mainCtx.globalCompositeOperation = 'multiply';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      mainCtx.strokeStyle = '#1d1914'; mainCtx.lineWidth = 18;
      mainCtx.strokeRect(9, 9, W - 18, H - 18);
      break;
    }
    case 'lowPoly': {
      // Faceted low-poly triangle mosaic render
      const gw = 36, gh = 64;
      const data = sampleGrid(offCanvas, gw, gh);
      const cw = W / gw, chh = H / gh;
      for (let y = 0; y < gh - 1; y++) {
        for (let x = 0; x < gw - 1; x++) {
          const i1 = (y * gw + x) * 4;
          const i2 = ((y + 1) * gw + x + 1) * 4;
          const x0 = x * cw, y0 = y * chh;
          mainCtx.fillStyle = `rgb(${data[i1]},${data[i1 + 1]},${data[i1 + 2]})`;
          mainCtx.beginPath(); mainCtx.moveTo(x0, y0); mainCtx.lineTo(x0 + cw, y0); mainCtx.lineTo(x0, y0 + chh); mainCtx.closePath(); mainCtx.fill();
          mainCtx.fillStyle = `rgb(${data[i2]},${data[i2 + 1]},${data[i2 + 2]})`;
          mainCtx.beginPath(); mainCtx.moveTo(x0 + cw, y0); mainCtx.lineTo(x0 + cw, y0 + chh); mainCtx.lineTo(x0, y0 + chh); mainCtx.closePath(); mainCtx.fill();
        }
      }
      break;
    }
    default: {
      // flatVector, isometric, koi, midCentury, dreamGlaze — crisp styled vector + craft surface finish
      mainCtx.drawImage(offCanvas, 0, 0);
      if (slug === 'midCentury') {
        mainCtx.fillStyle = 'rgba(245,220,175,0.16)';
        mainCtx.fillRect(0, 0, W, H);
      } else if (slug === 'dreamGlaze') {
        const g = mainCtx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, 'rgba(255,215,150,0.14)');
        g.addColorStop(1, 'rgba(70,40,120,0.16)');
        mainCtx.fillStyle = g;
        mainCtx.fillRect(0, 0, W, H);
      } else if (slug === 'isometric') {
        mainCtx.strokeStyle = 'rgba(255,255,255,0.08)';
        mainCtx.lineWidth = 1;
        for (let k = -H; k < W + H; k += 48) {
          mainCtx.beginPath(); mainCtx.moveTo(k, 0); mainCtx.lineTo(k + H * 1.732, H); mainCtx.stroke();
          mainCtx.beginPath(); mainCtx.moveTo(k, 0); mainCtx.lineTo(k - H * 1.732, H); mainCtx.stroke();
        }
      }
      break;
    }
  }

  return mainCanvas.toDataURL('image/jpeg', 0.90);
};
