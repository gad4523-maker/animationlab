import {
  Application,
  Container,
  Graphics,
  Sprite,
  Texture,
  Rectangle,
  AnimatedSprite,
  Text,
  TextStyle,
  RenderTexture,
} from 'pixi.js';
import { GlowFilter, ShockwaveFilter, TwistFilter, MotionBlurFilter } from 'pixi-filters';
import { Emitter, upgradeConfig } from '@barvynkoa/particle-emitter';

const state = {
  app: null,
  mode: 'sprite',
  width: 1280,
  height: 720,
  fps: 24,
  bgLayer: null,
  worldLayer: null,
  heroSprite: null,
  heroShadow: null,
  slashGfx: null,
  particleLayer: null,
  emitter: null,
  particleTex: null,
  glowFilter: null,
  shockFilter: null,
  twistFilter: null,
  motionFilter: null,
  hudText: null,
  lastTime: 0,
};

function createHeroFrames(app) {
  const frameW = 64;
  const frameH = 64;
  const frames = [];
  for (let f = 0; f < 4; f++) {
    const g = new Graphics();
    const bob = [0, -2, 0, 2][f];
    const stride = [0, 3, 0, -3][f];
    const capeDx = [0, -3, -6, -2][f];

    // Cape
    g.poly([18 + capeDx, 24 + bob, 28, 22 + bob, 26, 48 + bob, 12 + capeDx, 46 + bob])
      .fill({ color: 0xd62839 });
    // Legs
    g.rect(24 + stride, 43, 6, 14).fill({ color: 0x2b2438 });
    g.rect(34 - stride, 43, 6, 14).fill({ color: 0x2b2438 });
    // Torso
    g.rect(22, 22 + bob, 20, 22).fill({ color: 0x3a86ff });
    g.rect(24, 24 + bob, 7, 10).fill({ color: 0x72b6ff });
    // Head + spiky anime hair
    g.rect(24, 9 + bob, 16, 13).fill({ color: 0xf4c7a1 });
    g.poly([22, 12 + bob, 20, 6 + bob, 28, 8 + bob, 32, 3 + bob, 37, 8 + bob, 44, 6 + bob, 41, 13 + bob])
      .fill({ color: 0x1b2247 });
    // Glowing cyan eye
    g.rect(34, 14 + bob, 5, 2).fill({ color: 0x00f5ff });

    // Katana arm & blade pose per frame
    if (f === 0 || f === 3) {
      g.rect(39, 26 + bob, 8, 5).fill({ color: 0x72b6ff });
      g.moveTo(45, 28 + bob).lineTo(61, 12 + bob).stroke({ width: 3, color: 0xe0fcff });
    } else if (f === 1) {
      g.rect(36, 21 + bob, 7, 5).fill({ color: 0x72b6ff });
      g.moveTo(41, 21 + bob).lineTo(52, 3 + bob).stroke({ width: 3, color: 0xe0fcff });
    } else {
      g.rect(40, 27 + bob, 10, 5).fill({ color: 0x72b6ff });
      g.moveTo(48, 29 + bob).lineTo(63, 29 + bob).stroke({ width: 4, color: 0xffffff });
      g.moveTo(47, 26 + bob).lineTo(63, 26 + bob).stroke({ width: 1.5, color: 0x00f5ff });
    }

    const rt = app.renderer.generateTexture({
      target: g,
      frame: new Rectangle(0, 0, frameW, frameH),
      resolution: 1,
    });
    rt.source.scaleMode = 'nearest';
    g.destroy();
    frames.push(rt);
  }
  return frames;
}

function createSparkTexture(app) {
  const g = new Graphics();
  g.circle(8, 8, 7.5).fill({ color: 0xffffff, alpha: 0.25 });
  g.circle(8, 8, 4.5).fill({ color: 0xffffff, alpha: 0.7 });
  g.circle(8, 8, 2.0).fill({ color: 0xffffff, alpha: 1.0 });
  const tex = app.renderer.generateTexture({
    target: g,
    frame: new Rectangle(0, 0, 16, 16),
    resolution: 1,
  });
  g.destroy();
  return tex;
}

function drawParallaxScene(t) {
  const { bgLayer: g, width: w, height: h } = state;
  g.clear();
  // Night gradient sky bands
  for (let i = 0; i < 24; i++) {
    const u = i / 23;
    const r = Math.round(6 + 20 * u);
    const gr = Math.round(10 + 18 * u);
    const b = Math.round(32 + 48 * u);
    g.rect(0, (h * i) / 24, w, Math.ceil(h / 24) + 1).fill({ color: (r << 16) | (gr << 8) | b });
  }
  // Moon
  const moonX = w * 0.78 - t * 8;
  g.circle(moonX, h * 0.22, 110).fill({ color: 0xcbe8ff, alpha: 0.14 });
  g.circle(moonX, h * 0.22, 62).fill({ color: 0xfff8dc });

  // Distant mountain parallax
  const mShift = (t * 26) % w;
  g.poly([
    -w, h * 0.75, -w * 0.7, h * 0.44, -w * 0.4, h * 0.62, -w * 0.1, h * 0.38,
    w * 0.2, h * 0.60, w * 0.52, h * 0.36, w * 0.82, h * 0.58, w * 1.1, h * 0.40,
    w * 1.4, h * 0.75,
  ]).fill({ color: 0x161b40 });
  g.x = -mShift * 0.12;

  // Midground rooftops
  for (let i = 0; i < 16; i++) {
    const bw = 95 + (i % 3) * 28;
    const bh = 90 + ((i * 5) % 6) * 22;
    const bx = ((i * 110 - t * 90) % (w + 220) + (w + 220)) % (w + 220) - 110;
    g.rect(bx, h * 0.76 - bh, bw, bh).fill({ color: 0x0b122b });
    for (let k = 0; k < 4; k++) {
      if ((i + k) % 2 === 0) {
        g.rect(bx + 14 + k * 18, h * 0.76 - bh + 18, 8, 12).fill({ color: 0x38e8ff, alpha: 0.45 });
      }
    }
  }

  // Ground deck & perspective lines
  g.rect(0, h * 0.76, w, h * 0.24).fill({ color: 0x070a18 });
  g.moveTo(0, h * 0.76).lineTo(w, h * 0.76).stroke({ width: 3, color: 0x00e5ff, alpha: 0.85 });
  for (let i = -6; i <= 12; i++) {
    const xBottom = ((i * 180 - t * 240) % (w + 360) + (w + 360)) % (w + 360) - 180;
    g.moveTo(w * 0.5, h * 0.76).lineTo(xBottom, h).stroke({ width: 1.5, color: 0x146c94, alpha: 0.7 });
  }
}

window.initPixiSuite = async ({ mode = 'sprite', width = 1280, height = 720, fps = 24 } = {}) => {
  state.mode = mode;
  state.width = width;
  state.height = height;
  state.fps = fps;

  const app = new Application();
  await app.init({
    width,
    height,
    background: '#050814',
    antialias: true,
    preference: 'webgl',
    preserveDrawingBuffer: true,
  });
  document.body.appendChild(app.canvas);
  app.ticker.stop();
  state.app = app;

  state.bgLayer = new Graphics();
  state.worldLayer = new Container();
  state.particleLayer = new Container();
  app.stage.addChild(state.bgLayer, state.worldLayer, state.particleLayer);

  const heroFrames = createHeroFrames(app);
  const hero = new AnimatedSprite(heroFrames);
  hero.anchor.set(0.5, 0.9);
  hero.scale.set(4.5);
  hero.position.set(width * 0.42, height * 0.78);
  state.heroSprite = hero;

  state.heroShadow = new Graphics();
  state.slashGfx = new Graphics();
  state.worldLayer.addChild(state.heroShadow, state.heroSprite, state.slashGfx);

  if (mode === 'filters') {
    state.glowFilter = new GlowFilter({
      distance: 22,
      outerStrength: 3.2,
      innerStrength: 0.8,
      color: 0x00f5ff,
      quality: 0.35,
    });
    state.shockFilter = new ShockwaveFilter({
      center: { x: width * 0.46, y: height * 0.56 },
      speed: 520,
      amplitude: 34,
      wavelength: 130,
      brightness: 1.35,
      radius: -1,
      time: 0,
    });
    state.twistFilter = new TwistFilter({
      offset: { x: width * 0.46, y: height * 0.56 },
      radius: 170,
      angle: 0,
    });
    state.motionFilter = new MotionBlurFilter({
      velocity: { x: 0, y: 0 },
      kernelSize: 9,
    });
    state.heroSprite.filters = [state.glowFilter, state.motionFilter];
    app.stage.filters = [state.shockFilter, state.twistFilter];
  }

  if (mode === 'particles') {
    state.particleTex = createSparkTexture(app);
    const oldConfig = {
      alpha: { start: 0.95, end: 0.0 },
      scale: { start: 1.5, end: 0.15, minimumScaleMultiplier: 0.5 },
      color: { start: '#00f5ff', end: '#ffbe0b' },
      speed: { start: 210, end: 35, minimumSpeedMultiplier: 0.6 },
      acceleration: { x: 0, y: -140 },
      startRotation: { min: 0, max: 360 },
      rotationSpeed: { min: -120, max: 120 },
      lifetime: { min: 0.35, max: 0.9 },
      blendMode: 'add',
      frequency: 0.008,
      emitterLifetime: -1,
      maxParticles: 650,
      pos: { x: 0, y: 0 },
      addAtBack: false,
      spawnType: 'ring',
      spawnCircle: { x: 0, y: 0, r: 90, minR: 35 },
    };
    const v3Config = upgradeConfig(oldConfig, [state.particleTex]);
    state.emitter = new Emitter(state.particleLayer, v3Config);
    state.emitter.emit = true;
    state.emitter.updateOwnerPos(width * 0.44, height * 0.58);
  }

  const labelMap = {
    sprite: 'PixiJS 8 | AnimatedSprite (Nearest) + Parallax Stage',
    filters: 'PixiJS Filters v6 | Glow + Shockwave + Twist + MotionBlur',
    particles: '@barvynkoa/particle-emitter on PixiJS 8 | Energy Aura Burst',
  };
  state.hudText = new Text({
    text: labelMap[mode] || mode,
    style: new TextStyle({
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: 22,
      fontWeight: '700',
      fill: '#e6f7ff',
      stroke: { color: '#040812', width: 4 },
    }),
  });
  state.hudText.position.set(28, 22);
  app.stage.addChild(state.hudText);

  return {
    ok: true,
    rendererType: app.renderer.type,
    rendererName: app.renderer.name,
    mode,
  };
};

window.renderPixiFrame = (frameIndex) => {
  const { app, mode, width, height, fps, heroSprite, heroShadow, slashGfx } = state;
  const t = frameIndex / fps;
  const dt = 1 / fps;

  drawParallaxScene(t);

  // Dash + slash arc cycle every 1.0s
  const cycle = (t % 1.0);
  const dashX = Math.sin(t * Math.PI * 2) * 140;
  const jumpY = cycle > 0.35 && cycle < 0.7 ? -Math.sin(((cycle - 0.35) / 0.35) * Math.PI) * 55 : 0;
  const hx = width * 0.46 + dashX;
  const hy = height * 0.78 + jumpY;

  const spriteFrame = Math.floor(frameIndex / 3) % 4;
  heroSprite.gotoAndStop(spriteFrame);
  heroSprite.position.set(hx, hy);

  heroShadow.clear();
  heroShadow.ellipse(hx, height * 0.78 + 4, 70, 14).fill({ color: 0x000000, alpha: 0.45 });

  slashGfx.clear();
  if (spriteFrame === 2 || mode === 'filters') {
    const slashAlpha = spriteFrame === 2 ? 0.9 : 0.35 + 0.35 * Math.sin(t * 8);
    slashGfx.arc(hx + 45, hy - 125, 110, -0.7, 0.85)
      .stroke({ width: 10, color: 0x00f5ff, alpha: slashAlpha });
    slashGfx.arc(hx + 45, hy - 125, 96, -0.5, 0.65)
      .stroke({ width: 4, color: 0xffffff, alpha: slashAlpha });
  }

  if (mode === 'filters') {
    const pulse = 0.5 + 0.5 * Math.sin(t * 6.0);
    state.glowFilter.outerStrength = 2.5 + pulse * 3.5;
    state.shockFilter.center = { x: hx + 25, y: hy - 120 };
    state.shockFilter.time = (t % 1.2);
    state.twistFilter.offset = { x: hx + 25, y: hy - 120 };
    state.twistFilter.angle = Math.sin(t * 4.0) * 1.4;
    state.motionFilter.velocity = { x: Math.cos(t * Math.PI * 2) * 32, y: 0 };
  }

  let particleCount = 0;
  if (mode === 'particles' && state.emitter) {
    state.emitter.updateOwnerPos(hx, hy - 120);
    state.emitter.update(dt);
    particleCount = state.emitter.particleCount;
  }

  app.render();
  return { frameIndex, t, spriteFrame, particleCount };
};
