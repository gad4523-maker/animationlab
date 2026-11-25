import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const AnimeTitleDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slashProgress = spring({
    frame: frame - 8,
    fps,
    config: { damping: 14, stiffness: 180 },
  });

  const titlePop = spring({
    frame: frame - 18,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const subtitleOpacity = interpolate(frame, [30, 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const flashAlpha = interpolate(frame, [10, 14, 24], [0, 0.7, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const moonScale = interpolate(frame, [0, 90], [0.95, 1.08]);

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 75% 24%, #1f2b5c 0%, #0a0d1f 55%, #05060f 100%)',
        overflow: 'hidden',
        fontFamily: 'Segoe UI, Arial, sans-serif',
      }}
    >
      {/* Moon */}
      <div
        style={{
          position: 'absolute',
          right: 170,
          top: 90,
          width: 190,
          height: 190,
          borderRadius: '50%',
          background: '#fff8de',
          boxShadow: '0 0 90px 25px rgba(130, 200, 255, 0.35)',
          transform: `scale(${moonScale})`,
        }}
      />

      {/* Animated anime speed lines */}
      {Array.from({ length: 14 }).map((_, i) => {
        const y = 45 + i * 48;
        const offset = ((frame * (16 + (i % 4) * 7) + i * 190) % 1600) - 320;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: offset,
              top: y,
              width: 240 + (i % 3) * 110,
              height: 2,
              background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.45), transparent)',
            }}
          />
        );
      })}

      {/* Diagonal katana energy slash SVG */}
      <svg
        width="1280"
        height="720"
        viewBox="0 0 1280 720"
        style={{ position: 'absolute', inset: 0 }}
      >
        <line
          x1="120"
          y1="590"
          x2={120 + 1040 * slashProgress}
          y2={590 - 440 * slashProgress}
          stroke="#00f5ff"
          strokeWidth={14}
          strokeLinecap="round"
          opacity={0.85}
        />
        <line
          x1="120"
          y1="590"
          x2={120 + 1040 * slashProgress}
          y2={590 - 440 * slashProgress}
          stroke="#ffffff"
          strokeWidth={4}
          strokeLinecap="round"
        />
      </svg>

      {/* Center title card */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${0.7 + 0.3 * titlePop})`,
          opacity: titlePop,
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 10,
            color: '#00f5ff',
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          ANIMATION LAB // REMOTION
        </div>
        <div
          style={{
            fontSize: 78,
            fontWeight: 900,
            color: '#ffffff',
            textShadow: '0 0 30px rgba(0, 245, 255, 0.65), 0 6px 24px rgba(0,0,0,0.8)',
          }}
        >
          EPISODE 01: ECLIPSE
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 24,
            color: '#cbd5e1',
            opacity: subtitleOpacity,
            letterSpacing: 3,
          }}
        >
          PROGRAMMATIC REACT COMPOSITOR · 1280×720 · 30 FPS
        </div>
      </div>

      {/* Impact flash */}
      <AbsoluteFill
        style={{
          background: '#e0fcff',
          opacity: flashAlpha,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
