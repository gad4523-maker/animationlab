import React, { useEffect, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { solveChoreography } from '../../../shared/choreography.js';
import { drawGoku2DMaster } from '../../../shared/goku_2d_master.js';

export const GokuMangaPanels: React.FC = () => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const t = frame / 30;
  const shattered = t >= 2.80;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const ch = solveChoreography(t);

    if (!shattered) {
      // Render offscreen master Goku, convert to high-contrast B&W Manga Screentone across 4 split panels!
      const off = document.createElement('canvas');
      off.width = 720;
      off.height = 1280;
      const octx = off.getContext('2d')!;
      drawGoku2DMaster(octx, ch, 720, 1280);

      ctx.fillStyle = '#f4efe2';
      ctx.fillRect(0, 0, 720, 1280);

      const panels = [
        { x: 24, y: 24, w: 672, h: 390, sx: 140, sy: 140, sw: 440, sh: 260 },
        { x: 24, y: 438, w: 324, h: 390, sx: 250, sy: 185, sw: 220, sh: 265 }, // Eye close-up!
        { x: 372, y: 438, w: 324, h: 390, sx: 185, sy: 420, sw: 350, sh: 420 }, // Clenched fists/torso
        { x: 24, y: 852, w: 672, h: 404, sx: 80, sy: 540, sw: 560, sh: 340 }, // Wide power stance
      ];

      ctx.save();
      ctx.filter = 'grayscale(1) contrast(1.55)';
      for (const pn of panels) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(pn.x, pn.y, pn.w, pn.h);
        ctx.clip();
        ctx.drawImage(off, pn.sx, pn.sy, pn.sw, pn.sh, pn.x, pn.y, pn.w, pn.h);
        // Manga Ben-Day halftone dot overlay
        ctx.fillStyle = 'rgba(20,20,20,0.12)';
        for (let gy = pn.y; gy < pn.y + pn.h; gy += 8) {
          for (let gx = pn.x; gx < pn.x + pn.w; gx += 8) {
            ctx.fillRect(gx, gy, 2, 2);
          }
        }
        ctx.restore();
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 7;
        ctx.strokeRect(pn.x, pn.y, pn.w, pn.h);
      }
      ctx.restore();
    } else {
      // Panels shatter at t=2.80s into full-color golden Super Saiyan climax!
      ctx.clearRect(0, 0, 720, 1280);
      drawGoku2DMaster(ctx, ch, 720, 1280);
    }
  }, [frame, shattered]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#f4efe2' }}>
      <canvas ref={canvasRef} width={720} height={1280} style={{ width: '100%', height: '100%' }} />
    </AbsoluteFill>
  );
};
