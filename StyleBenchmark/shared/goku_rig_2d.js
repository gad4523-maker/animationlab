// High-detail 2.5D-projected Dragon Ball Goku character & VFX rig builder
import { clamp, lerp } from './choreography.js';

export function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Project 2.5D character-space coordinates (x, y, z) into 720x1280 screen space
// Character origin (0,0,0) is pelvis/center; y+ is DOWN, x+ is RIGHT, z+ is TOWARD camera
export function createProjector(ch, W = 720, H = 1280) {
  const yawRad = (ch.camYaw * Math.PI) / 180;
  const pitchRad = (ch.camPitch * Math.PI) / 180;
  const cosY = Math.cos(yawRad);
  const sinY = Math.sin(yawRad);
  const cosP = Math.cos(pitchRad);
  const sinP = Math.sin(pitchRad);

  const scaleBase = (H * 0.40) / ch.camDist;
  const cx = W * 0.5 + ch.shakeX * W;
  const cy = H * 0.56 + ch.camY * H + ch.shakeY * H;
  const rollRad = (ch.dutchRoll * Math.PI) / 180;
  const cosR = Math.cos(rollRad);
  const sinR = Math.sin(rollRad);

  return function proj(x, y, z = 0) {
    // Rotate around Y (3/4 orbit)
    const rx = x * cosY + z * sinY;
    const rz = -x * sinY + z * cosY;
    // Rotate around X (low-angle camera pitch)
    const ry = y * cosP - rz * sinP;
    const fz = y * sinP + rz * cosP;
    const persp = 1 / (1 - fz * 0.22);
    const sx0 = rx * scaleBase * persp;
    const sy0 = ry * scaleBase * persp;
    // Apply Dutch roll
    const sx = cx + sx0 * cosR - sy0 * sinR;
    const sy = cy + sx0 * sinR + sy0 * cosR;
    return [sx, sy, persp * scaleBase];
  };
}

// Build complete Goku anatomy, hair, aura, lightning, debris, shockwave
export function buildGokuScene(ch, W = 720, H = 1280) {
  const proj = createProjector(ch, W, H);
  const t = ch.t;
  const crouch = ch.crouch;
  const spread = ch.armSpread;
  const arch = ch.chestArch;
  const hairLift = ch.hairLift;
  const breathe = Math.sin(t * (ch.ssj > 0.5 ? 16 : 6)) * 0.012;
  const tremble = ch.charge * (1 - ch.ssj * 0.5) * 0.009 * Math.sin(t * 58);

  const hipY = 0.04 + crouch * 0.14;
  const waistY = hipY - 0.12;
  const chestY = waistY - 0.26 + breathe;
  const shoulderY = chestY - 0.04;
  const neckY = shoulderY - 0.08;
  const headY = neckY - 0.14 + arch * 0.06;
  const headX = tremble * 0.5;
  const headZ = -arch * 0.08 + 0.03;

  const pArr = (pts) => pts.map(([x, y, z = 0]) => {
    const [sx, sy] = proj(x, y, z);
    return [sx, sy];
  });

  // Ground crater & parallax horizon
  const horizonY = H * (0.58 - (ch.camPitch / 45) * 0.18);
  const groundAnchor = proj(0, 0.78, 0);

  // Legs (wide martial arts power stance)
  const stanceW = lerp(0.30, 0.40, 1 - crouch * 0.35);
  const kneeBend = crouch * 0.16;

  const leftThigh = pArr([
    [-0.17, hipY, 0.03], [-0.03, hipY + 0.04, 0.06],
    [-0.12, hipY + 0.26, 0.09 + kneeBend], [-0.30, hipY + 0.24, 0.05 + kneeBend]
  ]);
  const rightThigh = pArr([
    [0.03, hipY + 0.04, 0.06], [0.17, hipY, 0.02],
    [0.31, hipY + 0.23, 0.04 + kneeBend], [0.13, hipY + 0.26, 0.08 + kneeBend]
  ]);
  const leftShin = pArr([
    [-0.29, hipY + 0.22, 0.05 + kneeBend], [-0.13, hipY + 0.24, 0.08 + kneeBend],
    [-stanceW + 0.06, 0.54, 0.03], [-stanceW - 0.05, 0.54, 0.01]
  ]);
  const rightShin = pArr([
    [0.14, hipY + 0.24, 0.08 + kneeBend], [0.30, hipY + 0.22, 0.04 + kneeBend],
    [stanceW + 0.05, 0.54, 0.00], [stanceW - 0.06, 0.54, 0.02]
  ]);
  const leftBoot = pArr([
    [-stanceW - 0.06, 0.52, 0.02], [-stanceW + 0.06, 0.52, 0.04],
    [-stanceW + 0.09, 0.74, 0.12], [-stanceW - 0.11, 0.74, 0.06]
  ]);
  const rightBoot = pArr([
    [stanceW - 0.06, 0.52, 0.02], [stanceW + 0.06, 0.52, 0.00],
    [stanceW + 0.12, 0.74, 0.06], [stanceW - 0.08, 0.74, 0.11]
  ]);

  // Torso (muscular V-taper + Orange Gi + Blue Undershirt)
  const torsoGi = pArr([
    [-0.24, shoulderY, -0.02], [-0.11, shoulderY - 0.02, 0.06],
    [0.0, chestY + 0.10, 0.09], [0.11, shoulderY - 0.02, 0.06],
    [0.24, shoulderY, -0.02], [0.17, waistY, 0.04],
    [-0.17, waistY, 0.04]
  ]);
  const undershirt = pArr([
    [-0.11, shoulderY - 0.02, 0.065], [0.11, shoulderY - 0.02, 0.065],
    [0.07, chestY + 0.04, 0.092], [0.0, chestY + 0.11, 0.095],
    [-0.07, chestY + 0.04, 0.092]
  ]);
  const obiBelt = pArr([
    [-0.18, waistY - 0.02, 0.05], [0.18, waistY - 0.02, 0.05],
    [0.19, waistY + 0.06, 0.05], [-0.19, waistY + 0.06, 0.05]
  ]);
  const sashWave1 = Math.sin(t * 14.0) * 0.06 * (0.3 + ch.auraPower);
  const sashWave2 = Math.cos(t * 17.5 + 1.0) * 0.07 * (0.3 + ch.auraPower);
  const obiTailL = pArr([
    [-0.08, waistY + 0.04, 0.06], [-0.03, waistY + 0.05, 0.06],
    [-0.14 - sashWave1, waistY + 0.24, 0.02], [-0.22 - sashWave2, waistY + 0.22, 0.01]
  ]);
  const obiTailR = pArr([
    [-0.02, waistY + 0.04, 0.06], [0.04, waistY + 0.04, 0.06],
    [-0.05 - sashWave2 * 0.8, waistY + 0.27, 0.00], [-0.12 - sashWave1 * 0.9, waistY + 0.25, 0.00]
  ]);

  // Arms: tense clenched forward -> thrust wide & down on SSJ burst
  const elbowX = lerp(0.29, 0.42, spread);
  const elbowY = lerp(chestY + 0.16, chestY + 0.09, spread);
  const fistX = lerp(0.22, 0.48, spread);
  const fistY = lerp(waistY + 0.08, waistY + 0.14, spread);
  const fistZ = lerp(0.22, 0.08, spread);

  const leftArm = pArr([
    [-0.23, shoulderY, 0.00], [-0.17, shoulderY + 0.08, 0.04],
    [-elbowX + 0.06, elbowY + 0.04, 0.10], [-fistX + 0.05, fistY + 0.03, fistZ],
    [-fistX - 0.05, fistY - 0.03, fistZ - 0.02], [-elbowX - 0.07, elbowY - 0.04, 0.05]
  ]);
  const rightArm = pArr([
    [0.23, shoulderY, 0.00], [0.17, shoulderY + 0.08, 0.04],
    [elbowX - 0.06, elbowY + 0.04, 0.10], [fistX - 0.05, fistY + 0.03, fistZ],
    [fistX + 0.05, fistY - 0.03, fistZ - 0.02], [elbowX + 0.07, elbowY - 0.04, 0.05]
  ]);
  const leftWrist = pArr([
    [-fistX + 0.055, fistY - 0.02, fistZ], [-fistX - 0.055, fistY - 0.04, fistZ - 0.02],
    [-fistX - 0.05, fistY + 0.03, fistZ - 0.01], [-fistX + 0.05, fistY + 0.04, fistZ + 0.01]
  ]);
  const rightWrist = pArr([
    [fistX - 0.055, fistY - 0.02, fistZ], [fistX + 0.055, fistY - 0.04, fistZ - 0.02],
    [fistX + 0.05, fistY + 0.03, fistZ - 0.01], [fistX - 0.05, fistY + 0.04, fistZ + 0.01]
  ]);
  const leftFist = proj(-fistX, fistY + 0.055, fistZ + 0.02);
  const rightFist = proj(fistX, fistY + 0.055, fistZ + 0.02);

  // Neck & Head
  const neck = pArr([
    [-0.08, shoulderY - 0.01, 0.02], [0.08, shoulderY - 0.01, 0.02],
    [0.065, headY + 0.06, headZ + 0.02], [-0.065, headY + 0.06, headZ + 0.02]
  ]);
  const headShape = pArr([
    [headX - 0.105, headY - 0.05, headZ + 0.03],
    [headX - 0.095, headY + 0.04, headZ + 0.05],
    [headX - 0.045, headY + 0.10, headZ + 0.07],
    [headX, headY + 0.12, headZ + 0.08],
    [headX + 0.045, headY + 0.10, headZ + 0.07],
    [headX + 0.095, headY + 0.04, headZ + 0.05],
    [headX + 0.105, headY - 0.05, headZ + 0.03],
    [headX + 0.075, headY - 0.11, headZ + 0.02],
    [headX - 0.075, headY - 0.11, headZ + 0.02],
  ]);

  // Iconic Goku Hair: transitions smoothly from Base Dragon Ball asymmetrical spikes -> upright jagged SSJ spikes!
  const hairJitter = (i) => Math.sin(t * 28 + i * 1.9) * (0.008 + 0.015 * ch.auraPower);
  const baseSpikes = [
    // [baseL, tip, baseR, z]
    [[-0.08, -0.04], [-0.28, -0.14], [-0.09, -0.09], -0.02],
    [[-0.09, -0.08], [-0.31, -0.24], [-0.06, -0.12], -0.03],
    [[-0.06, -0.11], [-0.19, -0.32], [-0.01, -0.13], -0.02],
    [[0.00, -0.13], [0.02, -0.34], [0.05, -0.12], -0.01],
    [[0.04, -0.12], [0.22, -0.29], [0.09, -0.09], -0.02],
    [[0.08, -0.09], [0.30, -0.18], [0.10, -0.04], -0.02],
    [[0.09, -0.04], [0.25, -0.05], [0.08, 0.01], -0.01],
    [[-0.09, -0.03], [-0.22, -0.02], [-0.08, 0.01], -0.01],
  ];
  const ssjSpikes = [
    [[-0.09, -0.04], [-0.23, -0.24], [-0.08, -0.09], -0.02],
    [[-0.08, -0.08], [-0.22, -0.38], [-0.05, -0.12], -0.03],
    [[-0.05, -0.11], [-0.11, -0.46], [-0.01, -0.13], -0.02],
    [[-0.01, -0.13], [0.01, -0.50], [0.04, -0.13], -0.01],
    [[0.03, -0.12], [0.14, -0.45], [0.08, -0.10], -0.02],
    [[0.07, -0.10], [0.24, -0.34], [0.10, -0.05], -0.02],
    [[0.09, -0.05], [0.22, -0.19], [0.08, 0.00], -0.01],
    [[-0.09, -0.03], [-0.20, -0.15], [-0.08, 0.01], -0.01],
  ];

  const hairSpikes = baseSpikes.map((b, i) => {
    const s = ssjSpikes[i];
    const j = hairJitter(i);
    const bL = [headX + lerp(b[0][0], s[0][0], hairLift), headY + lerp(b[0][1], s[0][1], hairLift), headZ + b[3]];
    const tip = [headX + lerp(b[1][0], s[1][0], hairLift) + j, headY + lerp(b[1][1], s[1][1], hairLift) - Math.abs(j) * 0.5, headZ + b[3] - 0.02];
    const bR = [headX + lerp(b[2][0], s[2][0], hairLift), headY + lerp(b[2][1], s[2][1], hairLift), headZ + b[3]];
    return pArr([bL, tip, bR]);
  });

  // Front bangs (3 spiky Dragon Ball bangs framing forehead)
  const bangL = pArr([
    [headX - 0.07, headY - 0.11, headZ + 0.06],
    [headX - 0.085, headY - 0.02, headZ + 0.085],
    [headX - 0.035, headY - 0.08, headZ + 0.07],
  ]);
  const bangC = pArr([
    [headX - 0.025, headY - 0.115, headZ + 0.07],
    [headX - 0.005 + hairJitter(9) * 0.3, headY - 0.01, headZ + 0.095],
    [headX + 0.025, headY - 0.11, headZ + 0.07],
  ]);
  const bangR = pArr([
    [headX + 0.035, headY - 0.085, headZ + 0.07],
    [headX + 0.082, headY - 0.025, headZ + 0.085],
    [headX + 0.07, headY - 0.105, headZ + 0.06],
  ]);

  // Facial features (eyes, angry brows, nose, roaring mouth)
  const eyeY = headY - 0.015;
  const eyeL = proj(headX - 0.042, eyeY, headZ + 0.085);
  const eyeR = proj(headX + 0.042, eyeY, headZ + 0.085);
  const browL = pArr([
    [headX - 0.078, eyeY - 0.026, headZ + 0.086],
    [headX - 0.014, eyeY - 0.008, headZ + 0.092],
  ]);
  const browR = pArr([
    [headX + 0.078, eyeY - 0.026, headZ + 0.086],
    [headX + 0.014, eyeY - 0.008, headZ + 0.092],
  ]);
  const nose = proj(headX, headY + 0.022, headZ + 0.095);
  const mouthC = proj(headX, headY + 0.065, headZ + 0.088);
  const mouthH = lerp(0.008, 0.038, ch.mouthOpen);
  const mouthPoly = pArr([
    [headX - 0.036, headY + 0.056, headZ + 0.088],
    [headX + 0.036, headY + 0.056, headZ + 0.088],
    [headX + 0.028, headY + 0.056 + mouthH, headZ + 0.086],
    [headX - 0.028, headY + 0.056 + mouthH, headZ + 0.086],
  ]);

  // Aura flame tongues around body
  const center = proj(0, chestY + 0.06, 0);
  const auraRadius = (center[2] * 0.48) * (0.65 + 0.55 * ch.auraPower);
  const auraFlames = [];
  if (ch.auraPower > 0.02) {
    const count = 16;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const sway = Math.sin(t * 14 + i * 2.1) * 0.08;
      const hScale = 0.75 + 0.55 * Math.abs(Math.sin(t * 11 + i * 1.7));
      const baseX = Math.sin(ang) * 0.34 * (0.7 + 0.4 * ch.auraPower);
      const baseY = waistY + 0.16 - Math.cos(ang) * 0.16;
      const tipX = baseX * (1.25 + sway) + Math.sin(ang) * 0.12 * ch.auraPower;
      const tipY = baseY - (0.55 + 0.55 * ch.auraPower) * hScale;
      const b1 = proj(baseX - 0.08, baseY, -0.06);
      const tp = proj(tipX, tipY, -0.04);
      const b2 = proj(baseX + 0.08, baseY, -0.06);
      auraFlames.push([b1.slice(0, 2), tp.slice(0, 2), b2.slice(0, 2)]);
    }
  }

  // Lightning arcs (seeded per ~0.06s frame bucket so they crackle dynamically)
  const lightning = [];
  if (ch.charge > 0.35 || ch.ssj > 0.5) {
    const bucket = Math.floor(t * 18);
    const r = makeRng(bucket * 997 + 13);
    const nBolts = ch.ssj > 0.5 ? 5 : 3;
    for (let b = 0; b < nBolts; b++) {
      const pts = [];
      let bx = (r() - 0.5) * 0.85;
      let by = -0.65 + r() * 1.25;
      pts.push(proj(bx, by, 0.12).slice(0, 2));
      for (let s = 0; s < 5; s++) {
        bx += (r() - 0.5) * 0.28;
        by += (r() - 0.45) * 0.26;
        pts.push(proj(bx, by, 0.12).slice(0, 2));
      }
      lightning.push(pts);
    }
  }

  // Levitating crater pebbles (parallax depth)
  const rocks = [];
  const rRock = makeRng(777);
  for (let i = 0; i < 18; i++) {
    const rx0 = (rRock() - 0.5) * 1.65;
    const rz0 = (rRock() - 0.5) * 0.85;
    const baseRY = 0.72 + rRock() * 0.12;
    const lift = ch.charge > 0.25
      ? Math.pow(clamp((ch.charge - 0.25) / 0.75), 1.4) * (0.20 + rRock() * 0.65)
        + Math.sin(t * 3.5 + i) * 0.04
      : 0;
    const blastOut = ch.shockwaveP > 0 ? ch.shockwaveP * Math.sign(rx0 || 1) * 0.45 : 0;
    const rp = proj(rx0 + blastOut, baseRY - lift, rz0);
    rocks.push({
      x: rp[0],
      y: rp[1],
      size: (0.018 + rRock() * 0.032) * rp[2],
      z: rz0,
      rot: rRock() * Math.PI + t * (1 + rRock() * 2) * ch.charge,
    });
  }

  // Rising glowing ki particles
  const particles = [];
  const rPart = makeRng(313);
  const pCount = ch.ssj > 0.5 ? 42 : Math.floor(ch.charge * 28);
  for (let i = 0; i < pCount; i++) {
    const px = (rPart() - 0.5) * 1.15;
    const pz = (rPart() - 0.5) * 0.5;
    const speed = 0.6 + rPart() * 1.1;
    const phase = (rPart() + t * speed) % 1;
    const py = 0.76 - phase * 1.65;
    const pp = proj(px, py, pz);
    particles.push({
      x: pp[0],
      y: pp[1],
      r: (2.2 + rPart() * 4.5) * (1 - phase * 0.4),
      alpha: Math.sin(phase * Math.PI) * (ch.ssj > 0.5 ? 0.95 : 0.75),
    });
  }

  return {
    proj,
    horizonY,
    groundAnchor: groundAnchor.slice(0, 2),
    center: center.slice(0, 2),
    scale: center[2],
    auraRadius,
    parts: {
      leftThigh, rightThigh, leftShin, rightShin, leftBoot, rightBoot,
      torsoGi, undershirt, obiBelt, obiTailL, obiTailR,
      leftArm, rightArm, leftWrist, rightWrist,
      leftFist: leftFist.slice(0, 2),
      rightFist: rightFist.slice(0, 2),
      fistR: 0.055 * leftFist[2],
      neck, headShape,
      hairSpikes, bangL, bangC, bangR,
      eyeL: eyeL.slice(0, 2),
      eyeR: eyeR.slice(0, 2),
      eyeScale: eyeL[2],
      browL, browR,
      nose: nose.slice(0, 2),
      mouthC: mouthC.slice(0, 2),
      mouthPoly,
    },
    auraFlames,
    lightning,
    rocks,
    particles,
  };
}
