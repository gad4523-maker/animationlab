// Shared deterministic 5.0s (150-frame @ 30fps) choreography solver for Goku Super Saiyan
export const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (t) => { const x = clamp(t); return x * x * (3 - 2 * x); };
export const easeOut = (t) => { const x = clamp(t); return 1 - Math.pow(1 - x, 3); };
export const easeInOut = (t) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export function solveChoreography(tRaw) {
  const t = clamp(tRaw, 0, 5.0);

  let camDist, camYaw, camPitch, camY;
  if (t < 1.20) {
    const p = smoothstep(t / 1.20);
    camDist = lerp(1.28, 1.06, p);
    camYaw = 0.0;
    camPitch = lerp(-18.0, -12.0, p);
    camY = lerp(0.08, 0.02, p);
  } else if (t < 2.50) {
    const p = easeInOut((t - 1.20) / 1.30);
    camDist = lerp(1.06, 0.86, p);
    camYaw = lerp(0.0, 38.0, p);
    camPitch = lerp(-12.0, -3.0, p);
    camY = lerp(0.02, -0.04, p);
  } else if (t < 2.80) {
    const p = smoothstep((t - 2.50) / 0.30);
    camDist = lerp(0.86, 0.76, p);
    camYaw = lerp(38.0, 42.0, p);
    camPitch = lerp(-3.0, -1.0, p);
    camY = -0.05;
  } else if (t < 3.45) {
    const p = easeOut((t - 2.80) / 0.65);
    camDist = lerp(0.76, 0.92, p);
    camYaw = lerp(42.0, 32.0, p);
    camPitch = lerp(-1.0, -6.0, p);
    camY = lerp(-0.05, 0.0, p);
  } else {
    const p = easeInOut((t - 3.45) / 1.55);
    camDist = lerp(0.92, 1.18, p);
    camYaw = lerp(32.0, 14.0, p);
    camPitch = lerp(-6.0, -10.0, p);
    camY = lerp(0.0, 0.02, p);
  }

  let shakeAmp = 0;
  if (t >= 1.20 && t < 2.80) shakeAmp = 0.008 * Math.pow((t - 1.20) / 1.60, 1.5);
  else if (t >= 2.80 && t < 3.55) shakeAmp = 0.045 * Math.exp(-(t - 2.80) * 4.5);
  const shakeX = shakeAmp * Math.sin(t * 73.0 + 0.4);
  const shakeY = shakeAmp * Math.cos(t * 89.0 + 1.1);
  const dutchRoll = (t >= 2.80 && t < 3.55)
    ? 4.2 * Math.sin((t - 2.80) * 18.0) * Math.exp(-(t - 2.80) * 4.2)
    : 0;

  let ssjFlicker = 0;
  for (const ft of [1.85, 2.15, 2.40]) {
    const d = Math.abs(t - ft);
    if (d < 0.075) ssjFlicker = Math.max(ssjFlicker, 1 - d / 0.075);
  }
  const ssj = t >= 2.80 ? 1.0 : ssjFlicker;
  const hairLift = t >= 2.75 ? easeOut(clamp((t - 2.75) / 0.22)) : ssjFlicker * 0.45;
  const charge = t < 2.80 ? clamp((t - 0.60) / 2.20) : 1.0;
  const explosionBurst = t >= 2.78 ? Math.exp(-Math.pow((t - 2.80) / 0.16, 2)) : 0;
  const shockwaveP = t >= 2.80 ? clamp((t - 2.80) / 0.70) : 0;
  const impactFlash = (t >= 2.80 && t < 2.87) ? 1.0 : 0.0;

  let crouch, armSpread, chestArch, mouthOpen;
  if (t < 1.20) {
    const p = smoothstep(t / 1.20);
    crouch = lerp(0.55, 0.72, p);
    armSpread = lerp(0.25, 0.15, p);
    chestArch = lerp(-0.08, -0.18, p);
    mouthOpen = lerp(0.05, 0.20, p);
  } else if (t < 2.80) {
    const p = smoothstep((t - 1.20) / 1.60);
    crouch = lerp(0.72, 0.85, p);
    armSpread = lerp(0.15, 0.05, p);
    chestArch = lerp(-0.18, -0.25, p);
    mouthOpen = lerp(0.20, 0.85, p);
  } else if (t < 3.45) {
    const p = easeOut((t - 2.80) / 0.65);
    crouch = lerp(0.85, 0.30, p);
    armSpread = lerp(0.05, 0.92, p);
    chestArch = lerp(-0.25, 0.22, p);
    mouthOpen = lerp(1.0, 0.70, p);
  } else {
    const p = easeInOut((t - 3.45) / 1.55);
    crouch = lerp(0.30, 0.36, p);
    armSpread = lerp(0.92, 0.74, p);
    chestArch = lerp(0.22, 0.12, p);
    mouthOpen = lerp(0.70, 0.15, p);
  }

  let auraPower = 0;
  if (t >= 0.90 && t < 2.80) auraPower = 0.15 + 0.55 * Math.pow((t - 0.90) / 1.90, 1.3);
  else if (t >= 2.80) auraPower = 1.0 + 0.5 * explosionBurst;

  const isSSJ = ssj > 0.5;
  return {
    t,
    camDist,
    camYaw,
    camPitch,
    camY,
    shakeX,
    shakeY,
    dutchRoll,
    ssj,
    hairLift,
    charge,
    explosionBurst,
    shockwaveP,
    impactFlash,
    crouch,
    armSpread,
    chestArch,
    mouthOpen,
    auraPower,
    eyeColor: isSSJ ? '#2ee8b6' : '#141418',
    hairMain: isSSJ ? '#ffe44d' : '#151722',
    hairHi: isSSJ ? '#fff8b8' : '#3a425e',
    hairShade: isSSJ ? '#d49b00' : '#090a0f',
    browColor: isSSJ ? '#e6b800' : '#111218',
    skinBase: isSSJ ? '#ffd4ad' : '#f2bc91',
    skinShade: isSSJ ? '#e09a68' : '#c98558',
    skinHi: isSSJ ? '#fff0db' : '#ffd9b8',
    giMain: isSSJ ? '#ff8224' : '#f06218',
    giShade: isSSJ ? '#b83c07' : '#a83408',
    giHi: isSSJ ? '#ffb85c' : '#ff8c3a',
    blueMain: isSSJ ? '#2356c7' : '#183c8c',
    blueShade: isSSJ ? '#112a68' : '#0d2254',
    phaseLabel: t < 1.20 ? 'REVEAL' : t < 2.50 ? 'CHARGE' : t < 3.45 ? 'AWAKEN' : 'SUPER SAIYAN',
  };
}
