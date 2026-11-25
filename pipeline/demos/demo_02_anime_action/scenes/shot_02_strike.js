import { drawAnimeActionFrame } from '/pipeline/core/anime_rig.js';
import { clamp, lerp, ramp, easeOut } from '/pipeline/core/camera.js';

export async function initShot({ glCanvas, hudCanvas, width, height }) {
  const ctx = glCanvas.getContext('2d', { alpha: false });
  const ctxHud = hudCanvas.getContext('2d');
  ctxHud.clearRect(0, 0, width, height);

  return {
    async renderFrame(_frame, t) {
      // Wind-up (0..0.34) -> Snap Strike (0.34..0.52) -> Hitstop + B&W flash (0.52..0.72) ->
      // Dynamic recoil recovery & ready guard (0.72..3.20, no 2s frozen arm hold!)
      const windup = ramp(t, 0.0, 0.34);
      const snap = easeOut(clamp((t - 0.34) / 0.18));
      const inHitstop = t >= 0.52 && t <= 0.72;
      const recover = ramp(t, 1.05, 2.25);

      const punchExtend = inHitstop
        ? 1.02
        : clamp(-0.22 * windup * (1 - snap) + snap * 1.02 - recover * 0.68);

      const tEval = inHitstop ? 0.52 : (t < 0.52 ? t : t - 0.20);
      const lAng = recover > 0.1
        ? [lerp(0.15, 1.65, recover), lerp(0.06, -1.35, recover)]
        : null;
      const rAng = recover > 0.1
        ? [lerp(0.85, 0.45, recover), lerp(-1.65, -1.25, recover)]
        : null;

      drawAnimeActionFrame(ctx, width, height, {
        t: tEval + 3.0,
        crouch: inHitstop ? 0.26 : lerp(0.52, 0.14, snap) + recover * 0.10,
        squashX: inHitstop ? 0.90 : lerp(1.08, 1.0, recover),
        squashY: inHitstop ? 1.12 : lerp(0.92, 1.0, recover),
        punchExtend,
        lArmAngle: lAng,
        rArmAngle: rAng,
        dashOffsetX: inHitstop ? 0.05 : lerp(-0.10, 0.05, snap) - recover * 0.04,
        dashVelX: (t >= 0.34 && t <= 0.52) ? 1.6 : 0.35,
        twist: lerp(-0.35, 0.38, snap) - recover * 0.28,
        auraPower: clamp(0.88 - recover * 0.12),
        awakened: t >= 0.50,
        impactFlash: (t >= 0.52 && t <= 0.59) ? 1.0 : 0.0,
        shockwave: t >= 0.56 ? clamp((t - 0.56) / 0.85) : 0.0,
        smearArc: (t >= 0.36 && t <= 0.55) ? Math.sin(((t - 0.36) / 0.19) * Math.PI) : 0.0,
        expression: t < 1.9 ? 'roar' : 'intense',
        // Reverse angle cleanly keeping feet/boots comfortably inside 9:16 frame
        cam: {
          dist: inHitstop ? 0.72 : lerp(0.82, 0.72, snap) + ramp(t, 2.0, 3.1) * 0.08,
          yawDeg: lerp(-22, 14, recover),
          pitchDeg: lerp(-6, -12, recover),
          rollDeg: lerp(-4, 1.5, recover),
          offsetX: inHitstop ? Math.sin(t * 90) * 0.020 : 0,
          offsetY: inHitstop ? Math.cos(t * 80) * 0.018 : 0,
        },
      });
    },
  };
}
