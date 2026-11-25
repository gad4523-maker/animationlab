// Authentic procedural craft-medium engines for Anidoodle, Huashu Art Motion, and Lemo-Opuscar styles
import { makeRng } from './goku_rig_2d.js';

const texCache = new Map();

export function getCachedSubstrate(key, w, h, builder) {
  const k = `${key}:${w}x${h}`;
  if (texCache.has(k)) return texCache.get(k);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  builder(c.getContext('2d'), w, h);
  texCache.set(k, c);
  return c;
}

export function makePaperTexture(key, baseHex, { grain = 18, fibers = 900, speck = 0, dark = false } = {}) {
  return getCachedSubstrate(`paper_${key}`, 720, 1280, (g, w, h) => {
    g.fillStyle = baseHex;
    g.fillRect(0, 0, w, h);
    const r = makeRng(key.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
    const im = g.getImageData(0, 0, w, h);
    const d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (r() - 0.5) * grain;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    g.putImageData(im, 0, 0);
    g.strokeStyle = dark ? 'rgba(255,255,255,0.04)' : 'rgba(90,70,45,0.05)';
    g.lineWidth = 1;
    for (let i = 0; i < fibers; i++) {
      const x = r() * w;
      const y = r() * h;
      const ang = r() * Math.PI * 2;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(ang) * (6 + r() * 14), y + Math.sin(ang) * (6 + r() * 14));
      g.stroke();
    }
    if (speck > 0) {
      for (let i = 0; i < speck; i++) {
        g.fillStyle = r() < 0.5 ? 'rgba(70,45,20,0.12)' : 'rgba(255,245,220,0.12)';
        g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
      }
    }
  });
}

// Downsample offscreen 720x1280 source into a smaller grid (e.g. 120x213) for fast authentic pixel/stipple/dither/brush passes
const scratchSmall = document.createElement('canvas');
const scratchSmallCtx = scratchSmall.getContext('2d', { willReadFrequently: true });

export function sampleGrid(srcCanvas, gw, gh) {
  if (scratchSmall.width !== gw || scratchSmall.height !== gh) {
    scratchSmall.width = gw;
    scratchSmall.height = gh;
  }
  scratchSmallCtx.clearRect(0, 0, gw, gh);
  scratchSmallCtx.drawImage(srcCanvas, 0, 0, gw, gh);
  return scratchSmallCtx.getImageData(0, 0, gw, gh).data;
}

// 1. Pixel Grid / Game Boy / 16-bit / 8-bit / ABS Toy Brick / Embroidery Stitch / Pointillism / Mosaic
export function renderPixelGrid(ctx, src, W, H, cell, mode = 'pixel', palette = null) {
  const gw = Math.floor(W / cell);
  const gh = Math.floor(H / cell);
  const data = sampleGrid(src, gw, gh);

  if (mode === 'mosaic') {
    ctx.fillStyle = '#c8bca6';
    ctx.fillRect(0, 0, W, H);
  } else if (mode === 'embroidery') {
    ctx.drawImage(makePaperTexture('linen', '#d8cdb8', { grain: 22, fibers: 1600 }), 0, 0);
  } else if (mode === 'dot' || mode === 'pointill' || mode === 'halftone' || mode === 'stipple') {
    ctx.drawImage(makePaperTexture('bristol', mode === 'halftone' ? '#ebe2cc' : '#f7f3e8', { grain: 12, fibers: 400 }), 0, 0);
  } else {
    ctx.fillStyle = '#080b14';
    ctx.fillRect(0, 0, W, H);
  }

  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const idx = (y * gw + x) * 4;
      let r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (palette) {
        let best = palette[0], bestD = 1e9;
        for (const p of palette) {
          const dr = r - p[0], dg = g - p[1], db = b - p[2];
          const d = dr * dr + dg * dg + db * db;
          if (d < bestD) { bestD = d; best = p; }
        }
        [r, g, b] = best;
      }
      const px = x * cell, py = y * cell;

      if (mode === 'brick') {
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px, py, cell - 1, cell - 1);
        ctx.fillStyle = `rgba(255,255,255,0.28)`;
        ctx.beginPath(); ctx.arc(px + cell * 0.5, py + cell * 0.48, cell * 0.28, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1; ctx.stroke();
      } else if (mode === 'mosaic') {
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
      } else if (mode === 'embroidery') {
        if (lum < 0.92) {
          ctx.strokeStyle = `rgb(${r},${g},${b})`;
          ctx.lineWidth = Math.max(1.8, cell * 0.42);
          ctx.lineCap = 'round';
          ctx.beginPath();
          if ((x + y) % 2 === 0) { ctx.moveTo(px + 1, py + 1); ctx.lineTo(px + cell - 1, py + cell - 1); }
          else { ctx.moveTo(px + cell - 1, py + 1); ctx.lineTo(px + 1, py + cell - 1); }
          ctx.stroke();
        }
      } else if (mode === 'stipple') {
        const rad = (1 - lum) * cell * 0.46;
        if (rad > 0.6) {
          ctx.fillStyle = '#141218';
          ctx.beginPath(); ctx.arc(px + cell * 0.5, py + cell * 0.5, rad, 0, Math.PI * 2); ctx.fill();
        }
      } else if (mode === 'halftone') {
        const rad = (1 - lum) * cell * 0.52;
        if (rad > 0.5) {
          ctx.fillStyle = (r > 180 && g > 90 && b < 100) ? '#e6581a' : '#18161a';
          ctx.beginPath(); ctx.arc(px + cell * 0.5, py + cell * 0.5, rad, 0, Math.PI * 2); ctx.fill();
        }
      } else if (mode === 'pointill') {
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath(); ctx.arc(px + cell * 0.5, py + cell * 0.5, cell * 0.44, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px, py, cell, cell);
      }
    }
  }

  if (mode === 'embroidery') {
    // Wooden beech embroidery hoop framing the canvas
    ctx.strokeStyle = '#9c6e3b'; ctx.lineWidth = 26;
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 336, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#5c3c18'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 324, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 348, 0, Math.PI * 2); ctx.stroke();
  }
}

// 2. Live Luminance-Mapped ASCII CRT Terminal
export function renderAsciiCrt(ctx, src, W, H, t, isSSJ) {
  ctx.fillStyle = '#040806';
  ctx.fillRect(0, 0, W, H);
  const cw = 10, ch = 14;
  const gw = Math.floor(W / cw), gh = Math.floor(H / ch);
  const data = sampleGrid(src, gw, gh);
  const chars = ' .:-=+*#%@';
  ctx.font = 'bold 13px Consolas, monospace';
  ctx.textBaseline = 'top';
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const i = (y * gw + x) * 4;
      const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      const ci = Math.min(chars.length - 1, Math.floor(lum * chars.length));
      if (ci === 0) continue;
      ctx.fillStyle = isSSJ && lum > 0.55
        ? `rgb(255,${Math.round(215 + lum * 40)},${Math.round(60 + lum * 80)})`
        : `rgb(${Math.round(data[i] * 0.35)},${Math.round(140 + lum * 115)},${Math.round(65 + lum * 60)})`;
      ctx.fillText(chars[ci], x * cw, y * ch);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
}

// 3. Single-Line Mellan Engraving / Woodcut / Scratchboard / Blueprint / 1-Bit Atkinson Dither
export function renderEngravingOrDither(ctx, src, W, H, mode, t) {
  if (mode === 'mellan') {
    ctx.drawImage(makePaperTexture('vellum', '#f3ead4', { grain: 14, fibers: 500 }), 0, 0);
    const gw = 120, gh = 160;
    const data = sampleGrid(src, gw, gh);
    ctx.strokeStyle = '#181410';
    for (let y = 0; y < gh; y++) {
      const py = (y / gh) * H;
      for (let x = 0; x < gw - 1; x++) {
        const i = (y * gw + x) * 4;
        const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        const w = Math.max(0.4, (1 - lum) * 6.5);
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo((x / gw) * W, py + Math.sin(x * 0.4 + y * 0.2) * 1.2);
        ctx.lineTo(((x + 1) / gw) * W, py + Math.sin((x + 1) * 0.4 + y * 0.2) * 1.2);
        ctx.stroke();
      }
    }
  } else if (mode === 'one-bit') {
    const gw = 180, gh = 320;
    const data = sampleGrid(src, gw, gh);
    const gray = new Float32Array(gw * gh);
    for (let i = 0; i < gw * gh; i++) {
      gray[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255;
    }
    ctx.fillStyle = '#0c0d10';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#eef0e6';
    const cw = W / gw, chh = H / gh;
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const idx = y * gw + x;
        const old = gray[idx];
        const nv = old > 0.42 ? 1 : 0;
        const err = (old - nv) / 8;
        if (nv === 1) ctx.fillRect(x * cw, y * chh, Math.ceil(cw), Math.ceil(chh));
        if (x + 1 < gw) gray[idx + 1] += err;
        if (x + 2 < gw) gray[idx + 2] += err;
        if (y + 1 < gh) {
          if (x > 0) gray[idx + gw - 1] += err;
          gray[idx + gw] += err;
          if (x + 1 < gw) gray[idx + gw + 1] += err;
        }
        if (y + 2 < gh) gray[idx + gw * 2] += err;
      }
    }
  } else if (mode === 'blueprint' || mode === 'scratchboard' || mode === 'xray') {
    const isBP = mode === 'blueprint';
    const isXR = mode === 'xray';
    ctx.fillStyle = isBP ? '#113a72' : (isXR ? '#040a14' : '#08080a');
    ctx.fillRect(0, 0, W, H);
    if (isBP) {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 36) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 36) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }
    const gw = 180, gh = 320;
    const data = sampleGrid(src, gw, gh);
    const cw = W / gw, chh = H / gh;
    for (let y = 1; y < gh - 1; y++) {
      for (let x = 1; x < gw - 1; x++) {
        const i = (y * gw + x) * 4;
        const iR = (y * gw + x + 1) * 4;
        const iD = ((y + 1) * gw + x) * 4;
        const edge = Math.abs(data[i] - data[iR]) + Math.abs(data[i] - data[iD])
          + Math.abs(data[i + 1] - data[iR + 1]) + Math.abs(data[i + 1] - data[iD + 1]);
        const lum = (data[i] + data[i + 1] + data[i + 2]) / 765;
        if (edge > 52) {
          ctx.fillStyle = isXR ? '#4cf2ff' : '#f6f8ff';
          ctx.fillRect(x * cw, y * chh, cw * 1.1, chh * 1.1);
        } else if (lum > 0.55 && !isBP) {
          ctx.fillStyle = isXR ? 'rgba(40,200,255,0.22)' : 'rgba(245,242,232,0.35)';
          ctx.fillRect(x * cw, y * chh, cw, chh);
        }
      }
    }
  }
}

// 4. FLIR Ironbow Thermal Camera / LiDAR Point Cloud / Firefly Pointillism / Flow Field
export function renderScientificOrParticles(ctx, src, W, H, mode, t, ch) {
  if (mode === 'thermal') {
    const gw = 144, gh = 256;
    const data = sampleGrid(src, gw, gh);
    const cw = W / gw, chh = H / gh;
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const i = (y * gw + x) * 4;
        const lum = Math.min(1, ((0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255) * (0.85 + 0.45 * ch.auraPower));
        let r, g, b;
        if (lum < 0.25) { r = lum * 4 * 90; g = 10; b = 40 + lum * 4 * 120; }
        else if (lum < 0.55) { const k = (lum - 0.25) / 0.3; r = 90 + k * 145; g = 10 + k * 50; b = 160 - k * 100; }
        else if (lum < 0.85) { const k = (lum - 0.55) / 0.3; r = 235 + k * 20; g = 60 + k * 165; b = 60 - k * 50; }
        else { const k = (lum - 0.85) / 0.15; r = 255; g = 225 + k * 30; b = 60 + k * 195; }
        ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
        ctx.fillRect(x * cw, y * chh, Math.ceil(cw), Math.ceil(chh));
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(16, 18, 195, 34);
    ctx.fillStyle = '#ffdf4d'; ctx.font = 'bold 16px Consolas, monospace';
    ctx.fillText(`FLIR ${Math.round(36 + ch.auraPower * 9200)}°C`, 26, 40);
  } else if (mode === 'lidar' || mode === 'firefly') {
    ctx.fillStyle = mode === 'lidar' ? '#040914' : '#030810';
    ctx.fillRect(0, 0, W, H);
    const step = mode === 'lidar' ? 7 : 9;
    const gw = Math.floor(W / step), gh = Math.floor(H / step);
    const data = sampleGrid(src, gw, gh);
    const r = makeRng(Math.floor(t * 12) + 7);
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const i = (y * gw + x) * 4;
        const lum = (data[i] + data[i + 1] + data[i + 2]) / 765;
        if (lum < 0.12) continue;
        if (mode === 'lidar') {
          const wave = Math.abs(((y / gh) - ((t * 0.7) % 1))) < 0.04 ? 1 : 0;
          ctx.fillStyle = wave ? '#ffffff' : (ch.ssj > 0.5 ? `rgb(255,${180 + lum * 75 | 0},60)` : `rgb(40,${140 + lum * 115 | 0},255)`);
          ctx.fillRect(x * step + (r() - 0.5) * 2, y * step, 2.8, 2.8);
        } else if (r() < lum * 0.85) {
          const px = x * step + (r() - 0.5) * 6;
          const py = y * step + (r() - 0.5) * 6;
          ctx.fillStyle = ch.ssj > 0.5 ? 'rgba(255,235,90,0.85)' : `rgba(${data[i]},${data[i + 1]},${data[i + 2]},0.85)`;
          ctx.beginPath(); ctx.arc(px, py, 1.5 + lum * 2.8, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }
}

// 5. Oil Impasto / Watercolor Wash / Crayon / Colored Pencil / Sumi-e / Risograph Overprint
export function renderPainterlyMedium(ctx, src, W, H, mode, t) {
  if (mode === 'watercolor' || mode === 'ghibli' || mode === 'ranunculus' || mode === 'wren') {
    ctx.drawImage(makePaperTexture('coldpress', '#f7f1e1', { grain: 16, fibers: 900 }), 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.84;
    ctx.filter = 'saturate(1.12) blur(0.6px)';
    ctx.drawImage(src, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.25;
    ctx.drawImage(makePaperTexture('coldpress', '#f7f1e1', { grain: 16, fibers: 900 }), 0, 0);
    ctx.restore();
  } else if (mode === 'impasto' || mode === 'brokenColour' || mode === 'postimp' || mode === 'oil') {
    ctx.drawImage(makePaperTexture('linen_oil', '#231f1b', { grain: 22, fibers: 1000, dark: true }), 0, 0);
    const gw = 72, gh = 128;
    const data = sampleGrid(src, gw, gh);
    const cw = W / gw, chh = H / gh;
    const r = makeRng(99);
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const i = (y * gw + x) * 4;
        const ang = mode === 'postimp' ? Math.sin(x * 0.12 + y * 0.08 + t) * 1.4 : ((r() - 0.5) * 0.7 - 0.4);
        ctx.save();
        ctx.translate(x * cw + cw * 0.5, y * chh + chh * 0.5);
        ctx.rotate(ang);
        ctx.fillStyle = `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`;
        ctx.fillRect(-cw * 0.85, -chh * 0.42, cw * 1.7, chh * 0.84);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(-cw * 0.75, -chh * 0.35, cw * 1.5, 2);
        ctx.restore();
      }
    }
  } else if (mode === 'risograph') {
    ctx.drawImage(makePaperTexture('riso', '#f5eedc', { grain: 20, fibers: 600 }), 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.88;
    ctx.drawImage(src, -4, 3);
    ctx.globalAlpha = 0.35;
    ctx.filter = 'hue-rotate(15deg) saturate(1.4)';
    ctx.drawImage(src, 4, -3);
    ctx.restore();
  } else if (mode === 'sumiE' || mode === 'ink-wash') {
    ctx.drawImage(makePaperTexture('xuan', '#f4ebd6', { grain: 16, fibers: 1200, speck: 300 }), 0, 0);
    ctx.save();
    ctx.filter = 'grayscale(1) contrast(1.45)';
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(src, 0, 0);
    ctx.restore();
    // Vermilion Cinnabar Seal Stamp
    ctx.fillStyle = '#c4241a';
    ctx.fillRect(W - 74, H - 94, 42, 42);
    ctx.strokeStyle = '#f4ebd6';
    ctx.lineWidth = 2;
    ctx.strokeRect(W - 69, H - 89, 32, 32);
  } else if (mode === 'pencil' || mode === 'crayon' || mode === 'charcoal') {
    ctx.drawImage(makePaperTexture('tooth', '#f6efe0', { grain: 26, fibers: 900 }), 0, 0);
    ctx.save();
    if (mode === 'charcoal') ctx.filter = 'grayscale(1) contrast(1.35)';
    ctx.globalAlpha = 0.88;
    ctx.drawImage(src, 0, 0);
    ctx.strokeStyle = mode === 'charcoal' ? 'rgba(20,20,20,0.16)' : 'rgba(60,50,40,0.10)';
    ctx.lineWidth = 1.5;
    for (let k = -H; k < W + H; k += 9) {
      ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k - H * 0.4, H); ctx.stroke();
    }
    ctx.restore();
  }
}
