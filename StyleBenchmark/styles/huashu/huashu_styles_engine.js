// All 60 Huashu Art Motion styles driving perfected Goku Super Saiyan
import { solveChoreography } from '../../shared/choreography.js';
import { drawGoku2DMaster } from '../../shared/goku_2d_master.js';
import { makeRng } from '../../shared/goku_rig_2d.js';
import {
  makePaperTexture,
  renderPainterlyMedium,
  renderPixelGrid,
  sampleGrid,
} from '../../shared/medium_filters.js';

const W = 720, H = 1280;
let mainCanvas, mainCtx, offCanvas, offCtx;

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

const PAL_8BIT = [
  [12, 16, 32], [32, 48, 96], [240, 88, 16], [160, 44, 8],
  [255, 224, 56], [248, 248, 240], [28, 84, 212], [244, 188, 140],
  [20, 224, 176], [216, 32, 32], [68, 72, 92], [180, 128, 0],
];

function drawEraTag(ctx, slug, label) {
  ctx.save();
  ctx.fillStyle = 'rgba(14, 16, 22, 0.72)';
  ctx.fillRect(20, 22, 260, 34);
  ctx.fillStyle = '#f8e6b4';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.toUpperCase(), 32, 39);
  ctx.restore();
}

window.renderHuashuStyle = (slug, name, t) => {
  ensureCanvases();
  const ch = solveChoreography(t);
  const isSSJ = ch.ssj > 0.5;

  offCtx.clearRect(0, 0, W, H);
  drawGoku2DMaster(offCtx, ch, W, H, {
    skipBackground: ['01_cave', '02_egypt', '03_greek', '04_roman', '05_gothic', '17_ink', '20_dunhuang', '22_constructivism', '31_haring', '34_shadowpuppet', '50_ma_yuan', 'y3_whiteboard'].includes(slug),
  });
  mainCtx.clearRect(0, 0, W, H);

  switch (slug) {
    case '01_cave': {
      mainCtx.drawImage(makePaperTexture('cave', '#b48a5c', { grain: 36, fibers: 800, speck: 600 }), 0, 0);
      mainCtx.save();
      mainCtx.filter = 'sepia(0.8) saturate(1.4) contrast(1.3)';
      mainCtx.globalCompositeOperation = 'multiply';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    }
    case '02_egypt': {
      mainCtx.drawImage(makePaperTexture('limestone', '#dfd0a8', { grain: 24, fibers: 500, speck: 300 }), 0, 0);
      mainCtx.fillStyle = '#c89b3c'; mainCtx.fillRect(0, 0, W, 56); mainCtx.fillRect(0, H - 56, W, 56);
      mainCtx.strokeStyle = '#6b2318'; mainCtx.lineWidth = 4;
      for (let x = 0; x < W; x += 36) { mainCtx.strokeRect(x, 12, 30, 32); mainCtx.strokeRect(x, H - 44, 30, 32); }
      mainCtx.save();
      mainCtx.globalCompositeOperation = 'multiply';
      mainCtx.filter = 'saturate(0.9) contrast(1.15)';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    }
    case '03_greek': {
      mainCtx.fillStyle = '#c86e38'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.fillStyle = '#1b1310'; mainCtx.fillRect(0, 0, W, 64); mainCtx.fillRect(0, H - 64, W, 64);
      mainCtx.save();
      mainCtx.filter = 'brightness(0.22) contrast(2.2)';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    }
    case '04_roman':
      renderPixelGrid(mainCtx, offCanvas, W, H, 11, 'mosaic');
      mainCtx.strokeStyle = '#3c2a1e'; mainCtx.lineWidth = 18; mainCtx.strokeRect(9, 9, W - 18, H - 18);
      break;
    case '05_gothic':
    case '51_persian_miniature': {
      mainCtx.drawImage(makePaperTexture('vellum_gold', '#efe2c0', { grain: 18, fibers: 600 }), 0, 0);
      mainCtx.strokeStyle = '#c89b2a'; mainCtx.lineWidth = 22; mainCtx.strokeRect(16, 16, W - 32, H - 32);
      mainCtx.strokeStyle = '#8b1e24'; mainCtx.lineWidth = 4; mainCtx.strokeRect(32, 32, W - 64, H - 64);
      mainCtx.save();
      mainCtx.filter = 'saturate(1.25)';
      mainCtx.drawImage(offCanvas, 24, 24, W - 48, H - 48);
      mainCtx.restore();
      break;
    }
    case '06_renaissance':
    case '38_giotto':
    case '39_piero':
    case '40_raphael':
    case '41_michelangelo':
    case '42_guardi':
    case '43_lorenzetti':
    case '44_cortona': {
      mainCtx.drawImage(makePaperTexture('plaster_' + slug, '#dfd2b8', { grain: 26, fibers: 400, speck: 500 }), 0, 0);
      mainCtx.save();
      mainCtx.globalAlpha = 0.85;
      mainCtx.filter = slug === '38_giotto' ? 'saturate(0.85) contrast(1.05)' : 'sepia(0.18) saturate(1.08)';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.globalCompositeOperation = 'multiply';
      mainCtx.globalAlpha = 0.30;
      mainCtx.drawImage(makePaperTexture('plaster_' + slug, '#dfd2b8', { grain: 26, fibers: 400, speck: 500 }), 0, 0);
      mainCtx.restore();
      break;
    }
    case '08_impressionism':
    case '28_monet':
    case '45_renoir':
    case '46_pissarro':
    case '47_sisley':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'brokenColour', t);
      break;
    case '09_postimp':
    case '19_munch':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'postimp', t);
      if (slug === '19_munch') {
        mainCtx.fillStyle = 'rgba(210, 65, 20, 0.22)';
        mainCtx.fillRect(0, 0, W, H * 0.45);
      }
      break;
    case '29_seurat':
      renderPixelGrid(mainCtx, offCanvas, W, H, 7, 'pointill');
      break;
    case '17_ink':
    case '50_ma_yuan':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'sumiE', t);
      break;
    case '25_ghibli':
    case '49_chagall':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'watercolor', t);
      break;
    case '18_klimt': {
      mainCtx.fillStyle = '#2e220e'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.drawImage(offCanvas, 0, 0);
      const r = makeRng(1818);
      for (let i = 0; i < 160; i++) {
        mainCtx.fillStyle = i % 3 === 0 ? 'rgba(248,210,68,0.45)' : 'rgba(218,165,32,0.35)';
        mainCtx.fillRect(r() * W, r() * H, 10 + r() * 14, 10 + r() * 14);
      }
      break;
    }
    case '20_dunhuang': {
      mainCtx.drawImage(makePaperTexture('dunhuang', '#8e3828', { grain: 28, fibers: 700, speck: 500, dark: true }), 0, 0);
      mainCtx.save();
      mainCtx.globalAlpha = 0.85;
      mainCtx.filter = 'sepia(0.28) saturate(1.1)';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    }
    case '21_kusama': {
      mainCtx.fillStyle = isSSJ ? '#e6b800' : '#c81e28';
      mainCtx.fillRect(0, 0, W, H);
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.fillStyle = 'rgba(255,255,255,0.28)';
      for (let y = 16; y < H; y += 34) {
        for (let x = 16; x < W; x += 34) {
          mainCtx.beginPath(); mainCtx.arc(x + ((y / 34) % 2) * 17, y, 6 + ((x + y) % 5), 0, Math.PI * 2); mainCtx.fill();
        }
      }
      break;
    }
    case '22_constructivism': {
      mainCtx.fillStyle = '#efe5cf'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.fillStyle = '#c8231c';
      mainCtx.beginPath(); mainCtx.moveTo(0, 0); mainCtx.lineTo(W, 240); mainCtx.lineTo(W, 560); mainCtx.lineTo(0, 120); mainCtx.closePath(); mainCtx.fill();
      mainCtx.save();
      mainCtx.filter = 'contrast(1.65) saturate(1.2)';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    }
    case '11_cubism': {
      const gw = 18, gh = 32;
      const data = sampleGrid(offCanvas, gw, gh);
      const cw = W / gw, chh = H / gh;
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          const i = (y * gw + x) * 4;
          mainCtx.fillStyle = `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`;
          mainCtx.fillRect(x * cw, y * chh, cw + 1, chh + 1);
          mainCtx.strokeStyle = 'rgba(20,18,16,0.35)'; mainCtx.lineWidth = 1.5;
          mainCtx.strokeRect(x * cw, y * chh, cw, chh);
        }
      }
      break;
    }
    case '12_bauhaus': {
      mainCtx.fillStyle = '#f2ece0'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.fillStyle = '#d42027'; mainCtx.beginPath(); mainCtx.arc(140, 260, 120, 0, Math.PI * 2); mainCtx.fill();
      mainCtx.fillStyle = '#1f4ea8'; mainCtx.fillRect(520, 180, 160, 160);
      mainCtx.drawImage(offCanvas, 0, 0);
      break;
    }
    case '13_pop': {
      mainCtx.fillStyle = '#ffe438'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.save();
      mainCtx.filter = 'contrast(1.75) saturate(2.1)';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    }
    case '14_8bit':
      renderPixelGrid(mainCtx, offCanvas, W, H, 8, 'pixel', PAL_8BIT);
      break;
    case '26_vaporwave': {
      const vg = mainCtx.createLinearGradient(0, 0, 0, H);
      vg.addColorStop(0, '#14062b'); vg.addColorStop(0.55, '#5b136e'); vg.addColorStop(1, '#09142b');
      mainCtx.fillStyle = vg; mainCtx.fillRect(0, 0, W, H);
      // Perspective synthwave grid
      mainCtx.strokeStyle = 'rgba(255, 47, 180, 0.45)'; mainCtx.lineWidth = 2;
      for (let i = -8; i <= 8; i++) {
        mainCtx.beginPath(); mainCtx.moveTo(W / 2 + i * 35, H * 0.60); mainCtx.lineTo(W / 2 + i * 160, H); mainCtx.stroke();
      }
      for (let y = H * 0.62; y < H; y += 26) {
        mainCtx.beginPath(); mainCtx.moveTo(0, y); mainCtx.lineTo(W, y); mainCtx.stroke();
      }
      mainCtx.save();
      mainCtx.globalCompositeOperation = 'screen';
      mainCtx.drawImage(offCanvas, -4, 0);
      mainCtx.restore();
      mainCtx.fillStyle = 'rgba(0,0,0,0.22)';
      for (let y = 0; y < H; y += 4) mainCtx.fillRect(0, y, W, 1);
      break;
    }
    case '27_kirby': {
      mainCtx.drawImage(offCanvas, 0, 0);
      // Classic Jack Kirby Black Energy Krackle Spheres!
      const rk = makeRng(Math.floor(t * 16) + 27);
      mainCtx.fillStyle = '#0c0c10';
      for (let i = 0; i < 42; i++) {
        const ang = rk() * Math.PI * 2;
        const rad = 140 + rk() * 190;
        const bx = W / 2 + Math.cos(ang) * rad;
        const by = H * 0.52 + Math.sin(ang) * rad * 1.3;
        mainCtx.beginPath(); mainCtx.arc(bx, by, 5 + rk() * 12, 0, Math.PI * 2); mainCtx.fill();
      }
      break;
    }
    case '31_haring': {
      mainCtx.fillStyle = isSSJ ? '#ffde38' : '#32c8ff';
      mainCtx.fillRect(0, 0, W, H);
      mainCtx.save();
      mainCtx.filter = 'saturate(1.7) contrast(1.5)';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    }
    case '32_rembrandt': {
      mainCtx.drawImage(offCanvas, 0, 0);
      const rg = mainCtx.createRadialGradient(W * 0.48, H * 0.38, 90, W * 0.48, H * 0.44, 540);
      rg.addColorStop(0, 'rgba(255,215,130,0.08)');
      rg.addColorStop(0.5, 'rgba(15,10,5,0.45)');
      rg.addColorStop(1, 'rgba(8,5,2,0.92)');
      mainCtx.fillStyle = rg; mainCtx.fillRect(0, 0, W, H);
      break;
    }
    case '33_rubberhose': {
      mainCtx.fillStyle = '#cfc4ab'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.save();
      mainCtx.filter = 'grayscale(1) sepia(0.32) contrast(1.45)';
      mainCtx.drawImage(offCanvas, Math.sin(t * 45) * 1.5, 0);
      mainCtx.restore();
      break;
    }
    case '34_shadowpuppet': {
      mainCtx.drawImage(makePaperTexture('puppet_screen', '#e6b85c', { grain: 22, fibers: 900 }), 0, 0);
      mainCtx.save();
      mainCtx.filter = 'brightness(0.12) sepia(1) hue-rotate(-35deg) saturate(3)';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    }
    case '35_shinkai': {
      mainCtx.drawImage(offCanvas, 0, 0);
      // Anamorphic Shinkai golden/cyan lens flare streak + blooming sky glow
      const lg = mainCtx.createRadialGradient(W * 0.5, H * 0.28, 10, W * 0.5, H * 0.28, 360);
      lg.addColorStop(0, 'rgba(255, 250, 220, 0.48)');
      lg.addColorStop(0.5, 'rgba(140, 215, 255, 0.16)');
      lg.addColorStop(1, 'rgba(0,0,0,0)');
      mainCtx.fillStyle = lg; mainCtx.fillRect(0, 0, W, H);
      mainCtx.fillStyle = 'rgba(220, 245, 255, 0.28)';
      mainCtx.fillRect(0, H * 0.27, W, 6);
      break;
    }
    case '36_picasso_blue': {
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.save();
      mainCtx.globalCompositeOperation = 'color';
      mainCtx.fillStyle = '#204a87'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.restore();
      break;
    }
    case 'y3_whiteboard': {
      mainCtx.drawImage(makePaperTexture('wb', '#f8fafc', { grain: 6, fibers: 120 }), 0, 0);
      mainCtx.save();
      mainCtx.filter = 'saturate(1.2) contrast(1.15)';
      mainCtx.globalCompositeOperation = 'multiply';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    }
    case 't3_finance_chart': {
      mainCtx.fillStyle = '#070b14'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.drawImage(offCanvas, 0, 0);
      // Live Power-Level Telemetry Chart Overlay
      mainCtx.strokeStyle = '#22c55e'; mainCtx.lineWidth = 3;
      mainCtx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const px = (i / 40) * W;
        const tt = (i / 40) * t;
        const py = H - 80 - (tt > 2.8 ? 160 : tt * 32) - Math.sin(i * 1.9) * 14;
        if (i === 0) mainCtx.moveTo(px, py); else mainCtx.lineTo(px, py);
      }
      mainCtx.stroke();
      mainCtx.fillStyle = '#4ade80'; mainCtx.font = 'bold 18px Consolas, monospace';
      mainCtx.fillText(`POWER INDEX: ${Math.round(9000 + ch.auraPower * 150000000).toLocaleString()}`, 24, H - 36);
      break;
    }
    case '10_nouveau': {
      mainCtx.drawImage(makePaperTexture('nouveau', '#efe3c6', { grain: 16, fibers: 500 }), 0, 0);
      mainCtx.strokeStyle = '#6e4e2a'; mainCtx.lineWidth = 6;
      mainCtx.beginPath(); mainCtx.arc(W / 2, H * 0.42, 290, Math.PI, 0); mainCtx.stroke();
      mainCtx.strokeStyle = '#c89b3c'; mainCtx.lineWidth = 3;
      mainCtx.strokeRect(20, 20, W - 40, H - 40);
      mainCtx.save(); mainCtx.filter = 'saturate(0.85) sepia(0.15)';
      mainCtx.globalCompositeOperation = 'multiply';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    }
    case '15_raytrace': {
      const g = mainCtx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#090a24'); g.addColorStop(0.58, '#2b125a'); g.addColorStop(1, '#080814');
      mainCtx.fillStyle = g; mainCtx.fillRect(0, 0, W, H);
      // 1993 checkered perspective floor
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 12; c++) {
          mainCtx.fillStyle = (r + c) % 2 === 0 ? '#e5e7eb' : '#1f2937';
          mainCtx.fillRect(c * 60, H * 0.62 + r * 48, 60, 48);
        }
      }
      mainCtx.save(); mainCtx.filter = 'contrast(1.25) saturate(1.25)';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    }
    case '23_dali': {
      const dg = mainCtx.createLinearGradient(0, 0, 0, H);
      dg.addColorStop(0, '#1e3c72'); dg.addColorStop(0.55, '#e8a85c'); dg.addColorStop(1, '#6b3e18');
      mainCtx.fillStyle = dg; mainCtx.fillRect(0, 0, W, H);
      mainCtx.save();
      mainCtx.transform(1, 0, Math.sin(t * 2) * 0.08, 1, 0, 0);
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    }
    case '24_hopper': {
      mainCtx.fillStyle = '#0d1e24'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.drawImage(offCanvas, 0, 0);
      // Stark diagonal sunlight shaft
      mainCtx.fillStyle = 'rgba(255, 224, 140, 0.22)';
      mainCtx.beginPath(); mainCtx.moveTo(0, 0); mainCtx.lineTo(420, 0); mainCtx.lineTo(W, H); mainCtx.lineTo(140, H); mainCtx.closePath(); mainCtx.fill();
      break;
    }
    case '30_matisse': {
      mainCtx.drawImage(makePaperTexture('matisse', '#f4ede0', { grain: 14, fibers: 350 }), 0, 0);
      mainCtx.fillStyle = '#1b50a8'; mainCtx.fillRect(40, 120, 260, 420);
      mainCtx.fillStyle = '#d92828'; mainCtx.fillRect(420, 620, 240, 480);
      mainCtx.drawImage(offCanvas, 0, 0);
      break;
    }
    case '48_gauguin': {
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.save(); mainCtx.globalCompositeOperation = 'saturate'; mainCtx.fillStyle = '#ff6622'; mainCtx.fillRect(0, 0, W, H); mainCtx.restore();
      break;
    }
    case '52_south_park': {
      mainCtx.drawImage(makePaperTexture('construction', '#35486b', { grain: 26, fibers: 800, dark: true }), 0, 0);
      mainCtx.save();
      mainCtx.shadowColor = 'rgba(0,0,0,0.55)'; mainCtx.shadowOffsetX = 6; mainCtx.shadowOffsetY = 6; mainCtx.shadowBlur = 4;
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    }
    case '53_pixar': {
      mainCtx.drawImage(offCanvas, 0, 0);
      const pg = mainCtx.createRadialGradient(W * 0.5, H * 0.45, 60, W * 0.5, H * 0.45, 520);
      pg.addColorStop(0, 'rgba(255, 235, 190, 0.14)');
      pg.addColorStop(1, 'rgba(10, 14, 30, 0.35)');
      mainCtx.fillStyle = pg; mainCtx.fillRect(0, 0, W, H);
      break;
    }
    case 'rick_morty': {
      mainCtx.drawImage(offCanvas, 0, 0);
      // Swirling Neon Green Sci-Fi Portal Ring!
      mainCtx.save();
      mainCtx.strokeStyle = '#39ff14'; mainCtx.lineWidth = 10;
      mainCtx.beginPath(); mainCtx.ellipse(W * 0.5, H * 0.52, 260 + Math.sin(t * 14) * 14, 410 + Math.cos(t * 14) * 14, 0, 0, Math.PI * 2); mainCtx.stroke();
      mainCtx.strokeStyle = '#b4ff4d'; mainCtx.lineWidth = 4; mainCtx.stroke();
      mainCtx.restore();
      break;
    }
    case 'y1_kurzgesagt': {
      const kg = mainCtx.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H * 0.45, 620);
      kg.addColorStop(0, isSSJ ? '#4c1d95' : '#1e1b4b'); kg.addColorStop(1, '#09071a');
      mainCtx.fillStyle = kg; mainCtx.fillRect(0, 0, W, H);
      mainCtx.drawImage(offCanvas, 0, 0);
      break;
    }
    case 'y2_vox': {
      mainCtx.drawImage(makePaperTexture('vox', '#f2ebdc', { grain: 20, fibers: 600 }), 0, 0);
      mainCtx.save(); mainCtx.filter = 'saturate(0.9)'; mainCtx.drawImage(offCanvas, 0, 0); mainCtx.restore();
      mainCtx.fillStyle = '#fde047'; mainCtx.fillRect(24, H - 96, 360, 46);
      mainCtx.fillStyle = '#111827'; mainCtx.font = 'bold 20px Arial, sans-serif';
      mainCtx.fillText('TRANSFORMATION BREAKDOWN', 36, H - 66);
      break;
    }
    case 'y5_kinetic_type': {
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.save();
      mainCtx.fillStyle = isSSJ ? 'rgba(255,228,77,0.88)' : 'rgba(255,255,255,0.75)';
      mainCtx.font = '900 58px Impact, Arial Black, sans-serif';
      mainCtx.textAlign = 'center';
      mainCtx.fillText(isSSJ ? 'SUPER SAIYAN!' : 'POWER RISING', W / 2, H - 54);
      mainCtx.restore();
      break;
    }
    case 't2_keynote_ui': {
      mainCtx.fillStyle = '#090b10'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.fillStyle = 'rgba(255,255,255,0.08)';
      mainCtx.strokeStyle = 'rgba(255,255,255,0.22)'; mainCtx.lineWidth = 2;
      mainCtx.fillRect(28, H - 118, W - 56, 86);
      mainCtx.strokeRect(28, H - 118, W - 56, 86);
      mainCtx.fillStyle = '#f8fafc'; mainCtx.font = 'bold 18px Segoe UI, sans-serif';
      mainCtx.fillText(`KI OUTPUT // ${Math.round(ch.auraPower * 100)}%`, 48, H - 72);
      break;
    }
    default:
      mainCtx.drawImage(offCanvas, 0, 0);
      break;
  }

  drawEraTag(mainCtx, slug, name);
  return mainCanvas.toDataURL('image/jpeg', 0.90);
};
