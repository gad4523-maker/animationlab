// All 99 Lemo-Opuscar film & design styles driving perfected Goku Super Saiyan
import { solveChoreography } from '../../shared/choreography.js';
import { drawGoku2DMaster } from '../../shared/goku_2d_master.js';
import { makeRng } from '../../shared/goku_rig_2d.js';
import {
  makePaperTexture,
  renderAsciiCrt,
  renderEngravingOrDither,
  renderPainterlyMedium,
  renderPixelGrid,
  renderScientificOrParticles,
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

const PAL_16BIT = [
  [10, 14, 30], [28, 40, 82], [244, 96, 18], [166, 50, 8],
  [255, 224, 58], [255, 250, 198], [26, 78, 198], [14, 40, 112],
  [244, 188, 144], [198, 130, 84], [28, 228, 174], [220, 36, 36],
  [248, 204, 56], [244, 246, 252], [44, 38, 52], [186, 124, 0],
];

function applyCRT(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  const vg = ctx.createRadialGradient(W / 2, H / 2, 220, W / 2, H / 2, 740);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.48)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

window.renderLemoStyle = (slug, name, t) => {
  ensureCanvases();
  // Step 12fps cels for authentic cel-anime-80s, rubber-hose, silent-film
  const tEval = ['cel-anime-80s', 'rubber-hose', 'silent-film', 'newsreel'].includes(slug)
    ? Math.floor(t * 12) / 12
    : t;
  const ch = solveChoreography(tEval);
  const isSSJ = ch.ssj > 0.5;

  const noBgSlugs = [
    'watercolor', 'ink-wash', 'blueprint', 'ascii-crt', 'one-bit-dither', 'chalkboard',
    'whiteboard', 'sketchnote', 'ipad-sketch', 'marker-paper', 'one-line', 'pen-plotter',
    'papercut-red', 'shadow-puppet', 'ukiyoe', 'woodcut', 'engraving', 'risograph',
    'halftone-dossier', 'printed-long-take', 'thermal-camera', 'lidar-survey',
    'firefly-pointillism', 'security-xray', 'vintage-collage', 'gilded-illumination',
  ];
  offCtx.clearRect(0, 0, W, H);
  drawGoku2DMaster(offCtx, ch, W, H, { skipBackground: noBgSlugs.includes(slug) });
  mainCtx.clearRect(0, 0, W, H);

  switch (slug) {
    // --- Games ---
    case 'pixel-rpg':
      renderPixelGrid(mainCtx, offCanvas, W, H, 8, 'pixel', PAL_16BIT);
      mainCtx.fillStyle = '#0e1738'; mainCtx.strokeStyle = '#f8fafc'; mainCtx.lineWidth = 5;
      mainCtx.fillRect(28, H - 150, W - 56, 118); mainCtx.strokeRect(28, H - 150, W - 56, 118);
      mainCtx.fillStyle = '#fde047'; mainCtx.font = 'bold 20px Consolas, monospace';
      mainCtx.fillText(isSSJ ? '► GOKU TRANSFORMED! LV.999' : '► GOKU IS CHARGING KI...', 52, H - 96);
      break;
    case 'hd-2d':
      renderPixelGrid(mainCtx, offCanvas, W, H, 7, 'pixel', PAL_16BIT);
      const hg = mainCtx.createRadialGradient(W / 2, H * 0.48, 80, W / 2, H * 0.48, 480);
      hg.addColorStop(0, `rgba(255, 220, 90, ${0.22 * ch.auraPower})`);
      hg.addColorStop(1, 'rgba(4, 8, 22, 0.52)');
      mainCtx.fillStyle = hg; mainCtx.fillRect(0, 0, W, H);
      break;
    case 'microgame':
      renderPixelGrid(mainCtx, offCanvas, W, H, 10, 'pixel', PAL_16BIT);
      mainCtx.fillStyle = '#ef4444'; mainCtx.fillRect(0, 0, W * (1 - t / 5), 18);
      mainCtx.fillStyle = '#ffffff'; mainCtx.font = '900 40px Impact, sans-serif'; mainCtx.textAlign = 'center';
      mainCtx.fillText(isSSJ ? 'AWAKENED!!' : 'POWER UP!!', W / 2, 86);
      mainCtx.textAlign = 'left';
      break;
    case 'game-show':
      mainCtx.fillStyle = '#1b0b3b'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.fillStyle = '#facc15'; mainCtx.fillRect(28, 24, W - 56, 56);
      mainCtx.fillStyle = '#111827'; mainCtx.font = '900 26px Arial, sans-serif';
      mainCtx.fillText(`POWER METER: ${Math.round(ch.auraPower * 100)}%`, 48, 60);
      break;

    // --- Cartoons & Anime ---
    case 'cel-anime-80s':
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.save();
      mainCtx.globalCompositeOperation = 'screen';
      mainCtx.globalAlpha = 0.25;
      mainCtx.filter = 'blur(8px)';
      mainCtx.drawImage(offCanvas, 3, 0);
      mainCtx.restore();
      applyCRT(mainCtx);
      break;
    case 'rubber-hose':
    case 'silent-film':
    case 'newsreel':
      mainCtx.fillStyle = '#cfc3a8'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.save();
      mainCtx.filter = 'grayscale(1) sepia(0.35) contrast(1.4)';
      mainCtx.drawImage(offCanvas, Math.sin(t * 40) * 2, Math.cos(t * 32) * 2);
      mainCtx.restore();
      if (slug === 'silent-film') {
        mainCtx.strokeStyle = '#ece0c4'; mainCtx.lineWidth = 10; mainCtx.strokeRect(20, 20, W - 40, H - 40);
      }
      applyCRT(mainCtx);
      break;
    case 'manga-panels':
    case 'comic-history':
      mainCtx.drawImage(makePaperTexture('manga', '#f5f0e2', { grain: 14, fibers: 400 }), 0, 0);
      mainCtx.save();
      mainCtx.filter = slug === 'manga-panels' ? 'grayscale(1) contrast(1.65)' : 'saturate(1.25) contrast(1.25)';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      mainCtx.strokeStyle = '#111'; mainCtx.lineWidth = 16; mainCtx.strokeRect(8, 8, W - 16, H - 16);
      break;

    // --- Painting & Illustration ---
    case 'watercolor':
    case 'urban-sketch':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'watercolor', t);
      break;
    case 'impasto':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'impasto', t);
      break;
    case 'crayon-book':
    case 'colored-pencil':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'pencil', t);
      break;

    // --- Sketch & Board ---
    case 'whiteboard':
    case 'sketchnote':
    case 'ipad-sketch':
    case 'marker-paper':
    case 'stick-explainer':
      mainCtx.drawImage(makePaperTexture('board_' + slug, slug === 'ipad-sketch' ? '#f8fafc' : '#f4f0e4', { grain: 10, fibers: 250 }), 0, 0);
      mainCtx.save();
      mainCtx.globalCompositeOperation = 'multiply';
      mainCtx.filter = 'contrast(1.18)';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    case 'chalkboard':
      mainCtx.drawImage(makePaperTexture('chalk', '#1d3127', { grain: 26, fibers: 600, dark: true }), 0, 0);
      mainCtx.save();
      mainCtx.globalCompositeOperation = 'screen';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      break;
    case 'one-line':
    case 'pen-plotter':
      renderEngravingOrDither(mainCtx, offCanvas, W, H, 'mellan', t);
      break;

    // --- Traditional Crafts ---
    case 'ink-wash':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'sumiE', t);
      break;
    case 'ukiyoe':
    case 'woodcut':
      mainCtx.drawImage(makePaperTexture('washi', '#f2e6ca', { grain: 20, fibers: 1200 }), 0, 0);
      mainCtx.save(); mainCtx.filter = 'contrast(1.25) saturate(0.9)'; mainCtx.globalCompositeOperation = 'multiply';
      mainCtx.drawImage(offCanvas, 0, 0); mainCtx.restore();
      mainCtx.strokeStyle = '#1d1914'; mainCtx.lineWidth = 16; mainCtx.strokeRect(8, 8, W - 16, H - 16);
      break;
    case 'papercut-red':
      mainCtx.drawImage(makePaperTexture('papercut', '#fff8ec', { grain: 14, fibers: 500 }), 0, 0);
      mainCtx.save();
      mainCtx.filter = 'grayscale(1) contrast(1.8) sepia(1) hue-rotate(-50deg) saturate(4)';
      mainCtx.globalCompositeOperation = 'multiply';
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.restore();
      mainCtx.strokeStyle = '#b91c1c'; mainCtx.lineWidth = 24; mainCtx.strokeRect(12, 12, W - 24, H - 24);
      break;
    case 'shadow-puppet':
      mainCtx.drawImage(makePaperTexture('shadow', '#e6b858', { grain: 24, fibers: 800 }), 0, 0);
      mainCtx.save(); mainCtx.filter = 'brightness(0.14) contrast(2)'; mainCtx.drawImage(offCanvas, 0, 0); mainCtx.restore();
      break;
    case 'paper-lantern':
      mainCtx.fillStyle = '#1e1008'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.save(); mainCtx.shadowColor = '#ffaa2b'; mainCtx.shadowBlur = 24;
      mainCtx.drawImage(offCanvas, 0, 0); mainCtx.restore();
      break;
    case 'stained-glass':
      renderPixelGrid(mainCtx, offCanvas, W, H, 16, 'mosaic');
      break;
    case 'gilded-illumination':
      mainCtx.drawImage(makePaperTexture('gilded', '#efe2c0', { grain: 18, fibers: 600 }), 0, 0);
      mainCtx.strokeStyle = '#d4af37'; mainCtx.lineWidth = 22; mainCtx.strokeRect(14, 14, W - 28, H - 28);
      mainCtx.drawImage(offCanvas, 20, 20, W - 40, H - 40);
      break;

    // --- Printmaking ---
    case 'risograph':
      renderPainterlyMedium(mainCtx, offCanvas, W, H, 'risograph', t);
      break;
    case 'halftone-dossier':
      renderPixelGrid(mainCtx, offCanvas, W, H, 8, 'halftone');
      break;
    case 'engraving':
    case 'printed-long-take':
      renderEngravingOrDither(mainCtx, offCanvas, W, H, 'scratchboard', t);
      break;
    case 'pop-art':
      mainCtx.fillStyle = '#ffe438'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.save(); mainCtx.filter = 'contrast(1.75) saturate(2.1)'; mainCtx.drawImage(offCanvas, 0, 0); mainCtx.restore();
      break;
    case 'vintage-collage':
    case 'silkscreen-poster':
      mainCtx.drawImage(makePaperTexture('poster_' + slug, '#eadcc0', { grain: 22, fibers: 800 }), 0, 0);
      mainCtx.save(); mainCtx.filter = 'sepia(0.25) contrast(1.25)'; mainCtx.globalCompositeOperation = 'multiply';
      mainCtx.drawImage(offCanvas, 0, 0); mainCtx.restore();
      break;

    // --- Line Diagrams & Screens & Interfaces ---
    case 'blueprint':
      renderEngravingOrDither(mainCtx, offCanvas, W, H, 'blueprint', t);
      break;
    case 'ascii-crt':
      renderAsciiCrt(mainCtx, offCanvas, W, H, t, isSSJ);
      break;
    case 'one-bit-dither':
      renderEngravingOrDither(mainCtx, offCanvas, W, H, 'one-bit', t);
      break;
    case 'security-xray':
      renderEngravingOrDither(mainCtx, offCanvas, W, H, 'xray', t);
      break;
    case 'thermal-camera':
      renderScientificOrParticles(mainCtx, offCanvas, W, H, 'thermal', t, ch);
      break;
    case 'lidar-survey':
      renderScientificOrParticles(mainCtx, offCanvas, W, H, 'lidar', t, ch);
      break;
    case 'firefly-pointillism':
      renderScientificOrParticles(mainCtx, offCanvas, W, H, 'firefly', t, ch);
      break;
    case 'spreadsheet': {
      mainCtx.fillStyle = '#f8fafc'; mainCtx.fillRect(0, 0, W, H);
      const gw = 24, gh = 40;
      const data = sampleGrid(offCanvas, gw, gh);
      const cw = W / gw, chh = H / gh;
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          const i = (y * gw + x) * 4;
          mainCtx.fillStyle = `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`;
          mainCtx.fillRect(x * cw, y * chh, cw - 1, chh - 1);
        }
      }
      break;
    }
    case 'brick-toy':
      renderPixelGrid(mainCtx, offCanvas, W, H, 14, 'brick');
      break;
    case 'countdown': {
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.fillStyle = 'rgba(0,0,0,0.65)'; mainCtx.fillRect(20, 20, 220, 62);
      mainCtx.fillStyle = isSSJ ? '#fde047' : '#38bdf8'; mainCtx.font = 'bold 34px Consolas, monospace';
      mainCtx.fillText(`T-${Math.max(0, 5 - t).toFixed(2)}s`, 36, 62);
      break;
    }
    case 'news-package':
    case 'caption-news': {
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.fillStyle = '#b91c1c'; mainCtx.fillRect(0, H - 86, W, 86);
      mainCtx.fillStyle = '#ffffff'; mainCtx.font = '900 22px Arial, sans-serif';
      mainCtx.fillText(isSSJ ? 'BREAKING: SUPER SAIYAN AWAKENED ON NAMEK' : 'LIVE: SEISMIC ENERGY SPIKE DETECTED', 24, H - 36);
      break;
    }
    case 'hologram-hud':
    case 'satellite-briefing':
    case 'dark-documentary': {
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.save();
      mainCtx.strokeStyle = isSSJ ? 'rgba(255,220,70,0.65)' : 'rgba(56,189,248,0.65)';
      mainCtx.lineWidth = 2;
      mainCtx.beginPath(); mainCtx.arc(W / 2, H * 0.46, 260, t * 2, t * 2 + 4.2); mainCtx.stroke();
      mainCtx.strokeRect(24, 24, W - 48, H - 48);
      mainCtx.restore();
      break;
    }
    case 'tilt-shift':
    case 'microscope':
    case 'glass-product':
    case 'lowpoly-island':
    case 'memphis-diorama':
    case 'paper-popup':
    case 'isometric-picture-book':
    case 'crayon-world':
    case 'white-model':
    case 'data-physical':
      mainCtx.drawImage(offCanvas, 0, 0);
      if (slug === 'white-model') {
        mainCtx.save(); mainCtx.globalCompositeOperation = 'saturation'; mainCtx.fillStyle = '#888'; mainCtx.fillRect(0, 0, W, H); mainCtx.restore();
      } else if (slug === 'microscope') {
        const mg = mainCtx.createRadialGradient(W / 2, H / 2, 260, W / 2, H / 2, 370);
        mg.addColorStop(0, 'rgba(0,0,0,0)'); mg.addColorStop(1, '#020408');
        mainCtx.fillStyle = mg; mainCtx.fillRect(0, 0, W, H);
      }
      break;

    case 'backrooms': {
      mainCtx.fillStyle = '#c8be78'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.save(); mainCtx.filter = 'sepia(0.45) contrast(1.25) saturate(0.75)';
      mainCtx.drawImage(offCanvas, Math.sin(t * 20) * 2, 0); mainCtx.restore();
      mainCtx.fillStyle = 'rgba(255,255,255,0.6)'; mainCtx.font = 'bold 16px Consolas, monospace';
      mainCtx.fillText(`REC ● 00:00:0${t.toFixed(2)}`, 28, H - 36);
      applyCRT(mainCtx);
      break;
    }
    case 'scratch-film': {
      mainCtx.fillStyle = '#070709'; mainCtx.fillRect(0, 0, W, H);
      renderEngravingOrDither(mainCtx, offCanvas, W, H, 'scratchboard', t);
      mainCtx.strokeStyle = 'rgba(255,230,110,0.6)'; mainCtx.lineWidth = 2;
      const rs = makeRng(Math.floor(t * 24));
      for (let i = 0; i < 12; i++) {
        const x = rs() * W; mainCtx.beginPath(); mainCtx.moveTo(x, 0); mainCtx.lineTo(x + (rs() - 0.5) * 40, H); mainCtx.stroke();
      }
      break;
    }
    case 'double-exposure': {
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.save(); mainCtx.globalCompositeOperation = 'screen'; mainCtx.globalAlpha = 0.45;
      mainCtx.drawImage(offCanvas, -28, -18, W + 40, H + 40);
      mainCtx.restore();
      break;
    }
    case 'neon-tubes':
    case 'circuit-board':
    case 'oscilloscope-math': {
      mainCtx.fillStyle = slug === 'circuit-board' ? '#041f14' : '#050810';
      mainCtx.fillRect(0, 0, W, H);
      if (slug === 'oscilloscope-math') {
        mainCtx.strokeStyle = 'rgba(34,197,94,0.20)'; mainCtx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) { mainCtx.beginPath(); mainCtx.moveTo(x, 0); mainCtx.lineTo(x, H); mainCtx.stroke(); }
        for (let y = 0; y < H; y += 40) { mainCtx.beginPath(); mainCtx.moveTo(0, y); mainCtx.lineTo(W, y); mainCtx.stroke(); }
      }
      mainCtx.save();
      mainCtx.shadowColor = slug === 'neon-tubes' ? '#ff2fb4' : '#22c55e';
      mainCtx.shadowBlur = 18;
      renderEngravingOrDither(mainCtx, offCanvas, W, H, 'xray', t);
      mainCtx.restore();
      break;
    }
    case 'flow-field': {
      mainCtx.fillStyle = '#061224'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.strokeStyle = isSSJ ? 'rgba(255,228,80,0.45)' : 'rgba(100,200,255,0.35)';
      mainCtx.lineWidth = 2;
      for (let y = 60; y < H; y += 28) {
        mainCtx.beginPath();
        for (let x = 0; x <= W; x += 24) {
          const dy = Math.sin(x * 0.015 + y * 0.02 + t * 5) * 18;
          if (x === 0) mainCtx.moveTo(x, y + dy); else mainCtx.lineTo(x, y + dy);
        }
        mainCtx.stroke();
      }
      break;
    }
    case 'silhouette-rhythm': {
      mainCtx.fillStyle = isSSJ ? '#ffe44d' : '#f97316';
      mainCtx.fillRect(0, 0, W, H);
      mainCtx.save(); mainCtx.filter = 'brightness(0.05) contrast(2)'; mainCtx.drawImage(offCanvas, 0, 0); mainCtx.restore();
      break;
    }
    case 'art-deco': {
      mainCtx.fillStyle = '#111622'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.strokeStyle = '#d4af37'; mainCtx.lineWidth = 5;
      mainCtx.strokeRect(20, 20, W - 40, H - 40); mainCtx.strokeRect(32, 32, W - 64, H - 64);
      break;
    }
    case 'swiss-motion':
    case 'bauhaus-shapes':
    case 'kino-montage': {
      mainCtx.fillStyle = '#f2ece0'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.fillStyle = '#d42027'; mainCtx.fillRect(0, 0, 90, H);
      mainCtx.drawImage(offCanvas, 0, 0);
      break;
    }
    case 'spy-titles': {
      mainCtx.fillStyle = '#141414'; mainCtx.fillRect(0, 0, W, H);
      mainCtx.fillStyle = '#e11d48';
      mainCtx.beginPath(); mainCtx.moveTo(0, 320); mainCtx.lineTo(W, 180); mainCtx.lineTo(W, 680); mainCtx.lineTo(0, 820); mainCtx.closePath(); mainCtx.fill();
      mainCtx.drawImage(offCanvas, 0, 0);
      break;
    }
    case 'teardown':
    case 'hardcore-info':
    case 'precise-mechanism':
    case 'instruction-manual':
    case 'assembly-line-diagram':
    case 'iso-infographic':
    case 'briefing-board': {
      mainCtx.drawImage(makePaperTexture('manual_' + slug, '#f5f2e9', { grain: 10, fibers: 200 }), 0, 0);
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.strokeStyle = '#ef4444'; mainCtx.lineWidth = 2;
      mainCtx.beginPath(); mainCtx.moveTo(390, 280); mainCtx.lineTo(540, 220); mainCtx.lineTo(660, 220); mainCtx.stroke();
      mainCtx.fillStyle = '#111827'; mainCtx.font = 'bold 14px Consolas, monospace';
      mainCtx.fillText(isSSJ ? 'HAIR: SSJ-01' : 'HAIR: BASE', 545, 212);
      break;
    }
    case 'telestrator': {
      mainCtx.drawImage(offCanvas, 0, 0);
      mainCtx.strokeStyle = '#facc15'; mainCtx.lineWidth = 5;
      mainCtx.beginPath(); mainCtx.ellipse(W / 2, H * 0.72, 160, 42, 0, 0, Math.PI * 2); mainCtx.stroke();
      break;
    }
    case 'dataviz':
    case 'transit-map':
    case 'map-explainer':
    case 'pip-simulation':
    case 'living-screencast':
    case 'desktop-flythrough':
    case 'dark-keynote':
    case 'archive-lighttable':
    case 'city-symphony':
    case 'visual-investigation':
    case 'scifi-toon':
    case 'midcentury-toon':
    case 'pictogram-motion':
    case 'flat-space-explainer':
    case 'text-flash-cuts': {
      mainCtx.drawImage(offCanvas, 0, 0);
      if (slug === 'text-flash-cuts') {
        mainCtx.fillStyle = isSSJ ? '#fde047' : '#ffffff';
        mainCtx.font = '900 44px Impact, sans-serif'; mainCtx.textAlign = 'center';
        mainCtx.fillText(ch.phaseLabel, W / 2, H - 64);
        mainCtx.textAlign = 'left';
      } else if (slug === 'archive-lighttable') {
        mainCtx.strokeStyle = '#111'; mainCtx.lineWidth = 36; mainCtx.strokeRect(18, 18, W - 36, H - 36);
      } else if (slug === 'transit-map') {
        mainCtx.strokeStyle = '#38bdf8'; mainCtx.lineWidth = 6;
        mainCtx.beginPath(); mainCtx.moveTo(40, H - 100); mainCtx.lineTo(260, H - 100); mainCtx.lineTo(360, H - 180); mainCtx.lineTo(680, H - 180); mainCtx.stroke();
      }
      break;
    }
    default:
      mainCtx.drawImage(offCanvas, 0, 0);
      break;
  }

  // Subtle style caption badge for clean comparison
  mainCtx.save();
  mainCtx.fillStyle = 'rgba(10, 12, 20, 0.70)';
  mainCtx.fillRect(16, 16, Math.min(340, name.length * 10 + 40), 32);
  mainCtx.fillStyle = '#f8e6b4';
  mainCtx.font = 'bold 14px Segoe UI, sans-serif';
  mainCtx.fillText(name.toUpperCase(), 28, 37);
  mainCtx.restore();

  return mainCanvas.toDataURL('image/jpeg', 0.90);
};
