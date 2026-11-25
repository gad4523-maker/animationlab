import * as PIXI from 'pixi.js';
import { rigbyPixi } from '../../../character-tools/rigby2d/runtimes/pixi/rigby-pixi.ts';
import { solveChoreography } from '../../shared/choreography.js';

const { loadRigby, RigbySkeleton } = rigbyPixi(PIXI);

let app, world, goku, auraGfx, fxGfx;

window.initRigbyGoku = async () => {
  app = new PIXI.Application();
  await app.init({
    width: 720,
    height: 1280,
    background: '#090e1f',
    antialias: true,
    preference: 'webgl',
    preserveDrawingBuffer: true,
  });
  document.body.appendChild(app.canvas);
  app.ticker.stop();

  const bg = new PIXI.Graphics();
  bg.rect(0, 0, 720, 1280).fill(0x090e1f);
  bg.rect(0, 790, 720, 490).fill(0x211b28);
  app.stage.addChild(bg);

  world = new PIXI.Container();
  world.position.set(360, 680);
  app.stage.addChild(world);

  auraGfx = new PIXI.Graphics();
  world.addChild(auraGfx);

  const gokuData = await loadRigby('/assets/goku.json', '/assets/goku.atlas');
  goku = new RigbySkeleton(gokuData, {
    animation: 'transform',
    loop: false,
    autoUpdate: false,
  });
  goku.position.set(0, 290);
  world.addChild(goku);

  fxGfx = new PIXI.Graphics();
  world.addChild(fxGfx);
  return true;
};

window.renderFrame = (t) => {
  const ch = solveChoreography(t);
  goku.state.setTime?.(t);
  if (!goku.state.setTime) {
    goku.state.tracks[0].trackTime = t;
  }
  goku.update(0);

  // Camera zoom, 3/4 yaw skew, shake & dutch roll
  const zoom = 1.08 / ch.camDist;
  const yawSkew = Math.sin((ch.camYaw * Math.PI) / 180) * 0.14;
  world.scale.set(zoom * (1 - Math.abs(yawSkew) * 0.2), zoom);
  world.skew.set(yawSkew * 0.15, 0);
  world.rotation = (ch.dutchRoll * Math.PI) / 180;
  world.position.set(360 + ch.shakeX * 720, 680 + ch.camY * 600 + ch.shakeY * 1280);

  // Draw glowing golden aura & lightning
  auraGfx.clear();
  fxGfx.clear();
  if (ch.auraPower > 0.02) {
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      const bx = Math.sin(ang) * 115 * (0.7 + 0.4 * ch.auraPower);
      const by = 180 - Math.cos(ang) * 45;
      const tx = bx + Math.sin(t * 14 + i) * 35;
      const ty = by - (260 + 250 * ch.auraPower) * (0.7 + 0.3 * Math.abs(Math.sin(t * 11 + i)));
      auraGfx.poly([bx - 34, by, tx, ty, bx + 34, by])
        .fill({ color: 0xffda3a, alpha: 0.34 * Math.min(1, ch.auraPower) });
    }
  }
  if (ch.shockwaveP > 0.01 && ch.shockwaveP < 0.98) {
    const rad = 60 + ch.shockwaveP * 580;
    fxGfx.circle(0, 0, rad).stroke({ width: 12 * (1 - ch.shockwaveP), color: 0xfff080, alpha: 1 - ch.shockwaveP });
  }
  if (ch.charge > 0.35 || ch.ssj > 0.5) {
    const b = Math.floor(t * 18);
    for (let k = 0; k < 4; k++) {
      let x = ((b * 97 + k * 53) % 340) - 170;
      let y = ((b * 131 + k * 79) % 420) - 240;
      fxGfx.moveTo(x, y);
      for (let s = 0; s < 4; s++) {
        x += (((b + s) * 67 + k * 31) % 90) - 45;
        y += (((b + s) * 43 + k * 19) % 80) - 40;
        fxGfx.lineTo(x, y);
      }
      fxGfx.stroke({ width: 3, color: 0x8be9ff, alpha: 0.9 });
    }
  }

  app.render();
};
