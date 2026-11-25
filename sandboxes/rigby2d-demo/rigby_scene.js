import * as PIXI from 'pixi.js';
import { rigbyPixi } from '../../character-tools/rigby2d/runtimes/pixi/rigby-pixi.ts';

const { loadRigby, RigbySkeleton } = rigbyPixi(PIXI);

const state = {
  app: null,
  nila: null,
  robot: null,
  star: null,
  label: null,
};

window.initRigbyDemo = async () => {
  const app = new PIXI.Application();
  await app.init({
    width: 1280,
    height: 720,
    background: '#0d1326',
    antialias: true,
    preference: 'webgl',
    preserveDrawingBuffer: true,
  });
  document.body.appendChild(app.canvas);
  app.ticker.stop();
  state.app = app;

  // Stage backdrop
  const bg = new PIXI.Graphics();
  bg.rect(0, 0, 1280, 720).fill(0x0d1326);
  bg.circle(980, 150, 95).fill({ color: 0x38bdf8, alpha: 0.14 });
  bg.circle(980, 150, 56).fill(0xfef3c7);
  bg.rect(0, 610, 1280, 110).fill(0x162244);
  bg.moveTo(0, 610).lineTo(1280, 610).stroke({ width: 3, color: 0x38bdf8, alpha: 0.75 });
  app.stage.addChild(bg);

  const [nilaData, robotData] = await Promise.all([
    loadRigby('/assets/nila/export/nila.skel', '/assets/nila/export/nila.atlas'),
    loadRigby('/assets/rigbytron/export/rigbytron.json', '/assets/rigbytron/export/rigbytron.atlas'),
  ]);

  const fit = (sk, targetH) => {
    const h = sk.getLocalBounds().height || 400;
    sk.scale.set(targetH / h);
  };

  const nila = new RigbySkeleton(nilaData, {
    animation: nilaData.animationNames.includes('wave') ? 'wave' : nilaData.animationNames[0],
    loop: true,
    autoUpdate: false,
  });
  fit(nila, 460);
  nila.position.set(420, 625);
  state.nila = nila;

  const robot = new RigbySkeleton(robotData, {
    animation: robotData.animationNames.includes('hold') ? 'hold' : robotData.animationNames[0],
    loop: true,
    autoUpdate: false,
  });
  fit(robot, 430);
  robot.scale.x *= -1;
  robot.position.set(880, 625);
  if (robotData.animationNames.includes('release')) {
    robot.queue('release', true, 0.25, 0, 1.2);
  }
  state.robot = robot;

  // Attach glowing anime energy core to Rigbytron's hand bone
  const handBone =
    robotData.skeleton.bones.find(b => /hand|fist|claw/i.test(b.name))?.name ||
    robotData.skeleton.bones[robotData.skeleton.bones.length - 1].name;
  const star = new PIXI.Graphics()
    .star(0, 0, 6, 44, 18)
    .fill(0x00f5ff)
    .stroke({ width: 4, color: 0xffffff });
  robot.attachToBone(handBone, star, { scale: false });
  state.star = star;

  app.stage.addChild(nila, robot);

  const hud = new PIXI.Text({
    text: `Rigby2D v0.6 Runtime on PixiJS 8 | NILA (${nilaData.animationNames.length} anims) & Rigbytron (${robotData.animationNames.length} anims)`,
    style: {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: 22,
      fontWeight: '700',
      fill: '#f1f5f9',
      stroke: { color: '#050814', width: 4 },
    },
  });
  hud.position.set(28, 22);
  app.stage.addChild(hud);

  return {
    ok: true,
    nilaAnims: nilaData.animationNames,
    robotAnims: robotData.animationNames,
    nilaBones: nilaData.skeleton.bones.length,
    robotBones: robotData.skeleton.bones.length,
    handBone,
  };
};

window.renderRigbyFrame = (frameIndex, fps = 24) => {
  const dt = frameIndex === 0 ? 0 : 1 / fps;
  state.nila.update(dt);
  state.robot.update(dt);
  state.star.rotation = frameIndex * 0.14;
  state.app.render();
  return {
    frameIndex,
    nilaMeshes: state.nila.meshCount,
    robotMeshes: state.robot.meshCount,
  };
};
