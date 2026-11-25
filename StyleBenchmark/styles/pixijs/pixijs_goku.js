import { Application, Container, Sprite, Texture } from 'pixi.js';
import {
  AdvancedBloomFilter,
  CRTFilter,
  CrossHatchFilter,
  EmbossFilter,
  GlitchFilter,
  GodrayFilter,
  OldFilmFilter,
  OutlineFilter,
  PixelateFilter,
  RGBSplitFilter,
  ShockwaveFilter,
} from 'pixi-filters';
import { Emitter, upgradeConfig } from '@barvynkoa/particle-emitter';
import { solveChoreography } from '../../shared/choreography.js';
import { drawGoku2DMaster } from '../../shared/goku_2d_master.js';

let app, stageLayer, offscreen, offCtx, heroTex, heroSprite, particleLayer, emitter;
let shockFilter, bloomFilter, godrayFilter, rgbFilter, glitchFilter, crtFilter, oldFilmFilter;
let currentMode = 'pixijs-neon-bloom-vfx';

function createSparkTexture() {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
  g.addColorStop(0, 'rgba(255,255,220,1)');
  g.addColorStop(0.5, 'rgba(255,210,50,0.85)');
  g.addColorStop(1, 'rgba(255,140,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 16);
  return Texture.from(c);
}

window.initPixiGoku = async (mode) => {
  currentMode = mode;
  if (app) {
    app.destroy(true, { children: true });
    document.body.innerHTML = '';
  }
  app = new Application();
  await app.init({
    width: 720,
    height: 1280,
    background: mode === 'pixijs-crosshatch-film' ? '#ece2cc' : '#070b18',
    antialias: true,
    preference: 'webgl',
    preserveDrawingBuffer: true,
  });
  document.body.appendChild(app.canvas);
  app.ticker.stop();

  offscreen = document.createElement('canvas');
  offscreen.width = 720;
  offscreen.height = 1280;
  offCtx = offscreen.getContext('2d');

  stageLayer = new Container();
  heroTex = Texture.from(offscreen);
  heroSprite = new Sprite(heroTex);
  particleLayer = new Container();
  stageLayer.addChild(heroSprite, particleLayer);
  app.stage.addChild(stageLayer);

  const sparkTex = createSparkTexture();
  emitter = new Emitter(particleLayer, upgradeConfig({
    lifetime: { min: 0.4, max: 1.1 },
    frequency: 0.015,
    emitterLifetime: -1,
    maxParticles: 140,
    addAtBack: false,
    pos: { x: 360, y: 780 },
    behaviors: [
      { type: 'alpha', config: { alpha: { list: [{ time: 0, value: 0.9 }, { time: 1, value: 0 }] } } },
      { type: 'scale', config: { scale: { list: [{ time: 0, value: 0.8 }, { time: 1, value: 0.1 }] } } },
      { type: 'color', config: { color: { list: [{ time: 0, value: 'fff7a0' }, { time: 1, value: 'ff9e1b' }] } } },
      { type: 'moveSpeed', config: { speed: { list: [{ time: 0, value: 420 }, { time: 1, value: 180 }] } } },
      { type: 'rotationStatic', config: { min: 250, max: 290 } },
      { type: 'spawnShape', config: { type: 'rect', data: { x: -160, y: -30, w: 320, h: 60 } } },
      { type: 'textureSingle', config: { texture: sparkTex } },
    ],
  }, [sparkTex]));

  if (mode === 'pixijs-neon-bloom-vfx') {
    bloomFilter = new AdvancedBloomFilter({ threshold: 0.55, bloomScale: 0.95, brightness: 1.08, blur: 5 });
    shockFilter = new ShockwaveFilter({ center: { x: 360, y: 690 }, speed: 950, amplitude: 34, wavelength: 140, brightness: 1.18, radius: 580 });
    shockFilter.time = -1;
    godrayFilter = new GodrayFilter({ angle: 32, gain: 0.42, lacunarity: 2.4, parallel: true });
    rgbFilter = new RGBSplitFilter({ red: [0, 0], green: [0, 0], blue: [0, 0] });
    stageLayer.filters = [godrayFilter, bloomFilter, shockFilter, rgbFilter];
  } else if (mode === 'pixijs-crt-glitch-arcade') {
    const pix = new PixelateFilter(4);
    crtFilter = new CRTFilter({ curvature: 1.4, lineWidth: 1.1, lineContrast: 0.32, noise: 0.12, vignetting: 0.30 });
    glitchFilter = new GlitchFilter({ slices: 8, offset: 0, direction: 0, fillMode: 0 });
    stageLayer.filters = [pix, crtFilter, glitchFilter];
  } else {
    const ch = new CrossHatchFilter();
    const emb = new EmbossFilter(1.6);
    oldFilmFilter = new OldFilmFilter({ sepia: 0.44, noise: 0.20, noiseSize: 1.2, scratch: 0.40, scratchDensity: 0.3, vignetting: 0.32 });
    stageLayer.filters = [ch, emb, oldFilmFilter];
  }
  return true;
};

window.renderPixiFrame = (t) => {
  const ch = solveChoreography(t);
  offCtx.clearRect(0, 0, 720, 1280);
  drawGoku2DMaster(offCtx, ch, 720, 1280);
  heroTex.source.update();

  emitter.emit = ch.auraPower > 0.1;
  emitter.update(1 / 30);

  if (currentMode === 'pixijs-neon-bloom-vfx') {
    godrayFilter.time = t * 1.4;
    shockFilter.time = ch.shockwaveP > 0.005 && ch.shockwaveP < 0.99 ? ch.shockwaveP * 0.8 : -1;
    const split = ch.explosionBurst * 12;
    rgbFilter.red = [-split, 0];
    rgbFilter.blue = [split, 0];
    bloomFilter.bloomScale = 0.75 + ch.auraPower * 0.75;
  } else if (currentMode === 'pixijs-crt-glitch-arcade') {
    crtFilter.time = t * 5.0;
    crtFilter.seed = t * 10.0;
    glitchFilter.offset = ch.explosionBurst > 0.1 || (ch.ssj > 0.3 && t < 2.8) ? 26 * Math.sin(t * 90) : 0;
    glitchFilter.seed = Math.floor(t * 24);
  } else if (oldFilmFilter) {
    oldFilmFilter.seed = Math.floor(t * 24) * 0.13;
  }

  app.render();
  return app.canvas.toDataURL('image/jpeg', 0.92);
};
