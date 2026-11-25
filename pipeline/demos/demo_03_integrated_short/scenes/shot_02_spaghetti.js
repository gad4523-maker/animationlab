import { drawAnimeActionFrame } from '/pipeline/core/anime_rig.js';
import { clamp, lerp, ramp } from '/pipeline/core/camera.js';
import { drawTelemetryHUD } from '/pipeline/core/overlay_hud.js';

export async function initShot({ glCanvas, hudCanvas, width, height, shot }) {
  const ctx = glCanvas.getContext('2d', { alpha: false });
  const ctxHud = hudCanvas.getContext('2d');
  const dur = Number(shot.duration_sec || 5.27);
  const epStart = Number(shot._start_sec || 5.7);
  const epTotal = Number(shot._total_sec || 16.5);

  return {
    async renderFrame(_frame, t) {
      const surge = ramp(t, 0.08, dur * 0.48);
      const peak = ramp(t, dur * 0.48, dur * 0.85);
      const impact = (t >= dur * 0.50 && t <= dur * 0.54) ? 1.0 : 0.0;

      // Dedicated floating feet-first tidal elongation pose (NO floor shadows, NO martial punch!)
      drawAnimeActionFrame(ctx, width, height, {
        t: t + 1.0,
        backdropMode: 'cosmic',
        poseMode: 'tidal',
        crouch: -0.08 * peak,
        squashX: lerp(0.95, 0.68, peak),
        squashY: lerp(1.02, 1.48, peak),
        punchExtend: 0.0,
        dashOffsetX: Math.sin(t * 20) * surge * 0.015,
        dashVelX: Math.cos(t * 20) * 0.2,
        twist: Math.sin(t * 2.5) * 0.22,
        auraPower: clamp(0.28 + surge * 0.60),
        awakened: t >= dur * 0.50,
        impactFlash: impact,
        shockwave: t >= dur * 0.52 ? clamp((t - dur * 0.52) / 1.1) : 0.0,
        smearArc: 0,
        expression: 'roar',
        cam: {
          dist: lerp(1.10, 0.92, surge) + peak * 0.08,
          yawDeg: lerp(-12, 16, ramp(t, 0.0, dur * 0.8)),
          pitchDeg: lerp(-10, -2, surge),
          rollDeg: lerp(0, 6, peak),
        },
        palette: {
          skyTop: '#0b0816',
          skyBot: '#291533',
          skyAwakenedTop: '#160912',
          skyAwakenedBot: '#7c2d12',
          ground: '#120c1c',
          gi: '#f8fafc',
          giShade: '#cbd5e1',
          belt: '#f97316',
          auraBase: '#fb923c',
          auraAwakened: '#fde047',
        },
      });

      const gForce = lerp(1.0, 4.8e9, Math.pow(surge, 2));
      ctxHud.clearRect(0, 0, width, height);
      drawTelemetryHUD(ctxHud, width, height, {
        badge: 'TIDAL GRADIENT // CRIT',
        title: 'SPAGHETTIFICATION',
        subtitle: 'GRAVITATIONAL SHEAR WAVE',
        statLabel: 'TIDAL SHEAR',
        statValue: gForce < 1e4 ? `${gForce.toFixed(0)} g/m` : `${(gForce / 1e9).toFixed(2)}B g/m`,
        accent: '#fb923c',
        warn: '#ef4444',
        progress: clamp((epStart + t) / epTotal),
        fadeIn: ramp(t, 0.0, 0.28),
        fadeOut: 1.0 - ramp(t, dur - 0.28, dur),
        t,
      });
    },
  };
}
