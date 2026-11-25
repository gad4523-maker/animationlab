import { drawAnimeActionFrame } from '/pipeline/core/anime_rig.js';
import { clamp, lerp, ramp } from '/pipeline/core/camera.js';

export async function initShot({ glCanvas, hudCanvas, width, height }) {
  const ctx = glCanvas.getContext('2d', { alpha: false });
  const ctxHud = hudCanvas.getContext('2d');
  ctxHud.clearRect(0, 0, width, height);

  return {
    async renderFrame(_frame, t) {
      // Dynamic tense martial stance -> coiled wind-up shift (no premature golden hair spoiler!)
      const gather = ramp(t, 0.0, 1.3);
      const coil = ramp(t, 1.3, 2.75);
      const lArmAngle = [lerp(1.4, 2.55, gather), lerp(-1.2, -1.7, coil)];
      const rArmAngle = [lerp(0.5, 0.2, coil), lerp(-1.2, -1.5, coil)];

      drawAnimeActionFrame(ctx, width, height, {
        t,
        crouch: 0.08 + gather * 0.22 + coil * 0.38,
        squashX: lerp(1.0, 1.12, coil),
        squashY: lerp(1.0, 0.89, coil),
        punchExtend: -0.2 * coil,
        lArmAngle,
        rArmAngle,
        dashOffsetX: lerp(0.02, -0.06, coil) + Math.sin(t * 42) * coil * 0.008,
        dashVelX: 0.25 * coil,
        twist: lerp(-0.1, -0.45, coil),
        auraPower: clamp(0.18 + gather * 0.32 + coil * 0.46),
        awakened: false,
        expression: t > 1.3 ? 'roar' : 'tense',
        cam: {
          dist: lerp(1.02, 0.74, gather + coil * 0.5),
          yawDeg: lerp(-14, 16, ramp(t, 0.2, 2.75)),
          pitchDeg: lerp(-12, -4, coil),
          rollDeg: lerp(0, -3, coil),
        },
      });
    },
  };
}
