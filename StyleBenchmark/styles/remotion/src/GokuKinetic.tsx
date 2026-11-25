import React, { useEffect, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { solveChoreography } from '../../../shared/choreography.js';
import { drawGoku2DMaster } from '../../../shared/goku_2d_master.js';

export const GokuKinetic: React.FC = () => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const t = frame / 30;
  const ch = solveChoreography(t);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 720, 1280);
    drawGoku2DMaster(ctx, ch, 720, 1280);

    // 2-frame B&W high-contrast anime impact flash at awakening (t = 2.80s)
    if (ch.impactFlash > 0.5) {
      ctx.save();
      ctx.globalCompositeOperation = 'difference';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 720, 1280);
      ctx.restore();
    }
  }, [frame]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#070d1e' }}>
      <canvas ref={canvasRef} width={720} height={1280} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          bottom: 42,
          left: 36,
          right: 36,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontWeight: 900,
          letterSpacing: 3,
          fontSize: 22,
          color: ch.ssj > 0.5 ? '#ffe44d' : '#7dd3fc',
          textShadow: '0 2px 10px rgba(0,0,0,0.9)',
        }}
      >
        <span>{ch.phaseLabel}</span>
        <span>{ch.ssj > 0.5 ? 'SUPER SAIYAN' : 'BASE FORM'}</span>
      </div>
    </AbsoluteFill>
  );
};
