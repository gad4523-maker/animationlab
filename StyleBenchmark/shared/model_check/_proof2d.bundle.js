(() => {
  // ../AnimationLab/StyleBenchmark/shared/choreography.js
  var clamp = (v, lo = 0, hi = 1) => v < lo ? lo : v > hi ? hi : v;
  var lerp = (a, b, t) => a + (b - a) * t;
  var smoothstep = (t) => {
    const x = clamp(t);
    return x * x * (3 - 2 * x);
  };
  var easeOut = (t) => {
    const x = clamp(t);
    return 1 - Math.pow(1 - x, 3);
  };
  var easeInOut = (t) => {
    const x = clamp(t);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  };
  function solveChoreography(tRaw) {
    const t = clamp(tRaw, 0, 5);
    let camDist, camYaw, camPitch, camY;
    if (t < 1.2) {
      const p = smoothstep(t / 1.2);
      camDist = lerp(1.28, 1.06, p);
      camYaw = 0;
      camPitch = lerp(-18, -12, p);
      camY = lerp(0.08, 0.02, p);
    } else if (t < 2.5) {
      const p = easeInOut((t - 1.2) / 1.3);
      camDist = lerp(1.06, 0.86, p);
      camYaw = lerp(0, 38, p);
      camPitch = lerp(-12, -3, p);
      camY = lerp(0.02, -0.04, p);
    } else if (t < 2.8) {
      const p = smoothstep((t - 2.5) / 0.3);
      camDist = lerp(0.86, 0.76, p);
      camYaw = lerp(38, 42, p);
      camPitch = lerp(-3, -1, p);
      camY = -0.05;
    } else if (t < 3.45) {
      const p = easeOut((t - 2.8) / 0.65);
      camDist = lerp(0.76, 0.92, p);
      camYaw = lerp(42, 32, p);
      camPitch = lerp(-1, -6, p);
      camY = lerp(-0.05, 0, p);
    } else {
      const p = easeInOut((t - 3.45) / 1.55);
      camDist = lerp(0.92, 1.18, p);
      camYaw = lerp(32, 14, p);
      camPitch = lerp(-6, -10, p);
      camY = lerp(0, 0.02, p);
    }
    let shakeAmp = 0;
    if (t >= 1.2 && t < 2.8) shakeAmp = 8e-3 * Math.pow((t - 1.2) / 1.6, 1.5);
    else if (t >= 2.8 && t < 3.55) shakeAmp = 0.045 * Math.exp(-(t - 2.8) * 4.5);
    const shakeX = shakeAmp * Math.sin(t * 73 + 0.4);
    const shakeY = shakeAmp * Math.cos(t * 89 + 1.1);
    const dutchRoll = t >= 2.8 && t < 3.55 ? 4.2 * Math.sin((t - 2.8) * 18) * Math.exp(-(t - 2.8) * 4.2) : 0;
    let ssjFlicker = 0;
    for (const ft of [1.85, 2.15, 2.4]) {
      const d = Math.abs(t - ft);
      if (d < 0.075) ssjFlicker = Math.max(ssjFlicker, 1 - d / 0.075);
    }
    const ssj = t >= 2.8 ? 1 : ssjFlicker;
    const hairLift = t >= 2.75 ? easeOut(clamp((t - 2.75) / 0.22)) : ssjFlicker * 0.45;
    const charge = t < 2.8 ? clamp((t - 0.6) / 2.2) : 1;
    const explosionBurst = t >= 2.78 ? Math.exp(-Math.pow((t - 2.8) / 0.16, 2)) : 0;
    const shockwaveP = t >= 2.8 ? clamp((t - 2.8) / 0.7) : 0;
    const impactFlash = t >= 2.8 && t < 2.87 ? 1 : 0;
    let crouch, armSpread, chestArch, mouthOpen;
    if (t < 1.2) {
      const p = smoothstep(t / 1.2);
      crouch = lerp(0.55, 0.72, p);
      armSpread = lerp(0.25, 0.15, p);
      chestArch = lerp(-0.08, -0.18, p);
      mouthOpen = lerp(0.05, 0.2, p);
    } else if (t < 2.8) {
      const p = smoothstep((t - 1.2) / 1.6);
      crouch = lerp(0.72, 0.85, p);
      armSpread = lerp(0.15, 0.05, p);
      chestArch = lerp(-0.18, -0.25, p);
      mouthOpen = lerp(0.2, 0.85, p);
    } else if (t < 3.45) {
      const p = easeOut((t - 2.8) / 0.65);
      crouch = lerp(0.85, 0.3, p);
      armSpread = lerp(0.05, 0.92, p);
      chestArch = lerp(-0.25, 0.22, p);
      mouthOpen = lerp(1, 0.7, p);
    } else {
      const p = easeInOut((t - 3.45) / 1.55);
      crouch = lerp(0.3, 0.36, p);
      armSpread = lerp(0.92, 0.74, p);
      chestArch = lerp(0.22, 0.12, p);
      mouthOpen = lerp(0.7, 0.15, p);
    }
    let auraPower = 0;
    if (t >= 0.9 && t < 2.8) auraPower = 0.15 + 0.55 * Math.pow((t - 0.9) / 1.9, 1.3);
    else if (t >= 2.8) auraPower = 1 + 0.5 * explosionBurst;
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
      eyeColor: isSSJ ? "#2ee8b6" : "#141418",
      hairMain: isSSJ ? "#ffe44d" : "#151722",
      hairHi: isSSJ ? "#fff8b8" : "#3a425e",
      hairShade: isSSJ ? "#d49b00" : "#090a0f",
      browColor: isSSJ ? "#e6b800" : "#111218",
      skinBase: isSSJ ? "#ffd4ad" : "#f2bc91",
      skinShade: isSSJ ? "#e09a68" : "#c98558",
      skinHi: isSSJ ? "#fff0db" : "#ffd9b8",
      giMain: isSSJ ? "#ff8224" : "#f06218",
      giShade: isSSJ ? "#b83c07" : "#a83408",
      giHi: isSSJ ? "#ffb85c" : "#ff8c3a",
      blueMain: isSSJ ? "#2356c7" : "#183c8c",
      blueShade: isSSJ ? "#112a68" : "#0d2254",
      phaseLabel: t < 1.2 ? "REVEAL" : t < 2.5 ? "CHARGE" : t < 3.45 ? "AWAKEN" : "SUPER SAIYAN"
    };
  }

  // ../AnimationLab/StyleBenchmark/shared/goku_rig_2d.js
  function makeRng(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s = s * 1664525 + 1013904223 >>> 0;
      return s / 4294967296;
    };
  }
  function createProjector(ch, W = 720, H = 1280) {
    const yawRad = ch.camYaw * Math.PI / 180;
    const pitchRad = ch.camPitch * Math.PI / 180;
    const cosY = Math.cos(yawRad);
    const sinY = Math.sin(yawRad);
    const cosP = Math.cos(pitchRad);
    const sinP = Math.sin(pitchRad);
    const scaleBase = H * 0.4 / ch.camDist;
    const cx = W * 0.5 + ch.shakeX * W;
    const cy = H * 0.56 + ch.camY * H + ch.shakeY * H;
    const rollRad = ch.dutchRoll * Math.PI / 180;
    const cosR = Math.cos(rollRad);
    const sinR = Math.sin(rollRad);
    return function proj(x, y, z = 0) {
      const rx = x * cosY + z * sinY;
      const rz = -x * sinY + z * cosY;
      const ry = y * cosP - rz * sinP;
      const fz = y * sinP + rz * cosP;
      const persp = 1 / (1 - fz * 0.22);
      const sx0 = rx * scaleBase * persp;
      const sy0 = ry * scaleBase * persp;
      const sx = cx + sx0 * cosR - sy0 * sinR;
      const sy = cy + sx0 * sinR + sy0 * cosR;
      return [sx, sy, persp * scaleBase];
    };
  }

  // ../AnimationLab/StyleBenchmark/shared/goku_2d_master.js
  function traceCurve(ctx, pts, close = true) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      if (p.length === 4) {
        ctx.quadraticCurveTo(p[0], p[1], p[2], p[3]);
      } else if (p.length === 6) {
        ctx.bezierCurveTo(p[0], p[1], p[2], p[3], p[4], p[5]);
      } else {
        ctx.lineTo(p[0], p[1]);
      }
    }
    if (close) ctx.closePath();
  }
  function celFill(ctx, pts, fill, shade, lineCol, lineW, { rim = null, rimAlpha = 0, shadeDx = -6, shadeDy = 5 } = {}) {
    traceCurve(ctx, pts, true);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.save();
    traceCurve(ctx, pts, true);
    ctx.clip();
    if (shade) {
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.rect(-300, -300, 1600, 2e3);
      ctx.moveTo(pts[0][0] + shadeDx, pts[0][1] + shadeDy);
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        if (p.length === 4) ctx.quadraticCurveTo(p[0] + shadeDx, p[1] + shadeDy, p[2] + shadeDx, p[3] + shadeDy);
        else ctx.lineTo(p[0] + shadeDx, p[1] + shadeDy);
      }
      ctx.closePath();
      ctx.fill("evenodd");
    }
    if (rim && rimAlpha > 0.02) {
      ctx.strokeStyle = rim;
      ctx.globalAlpha = rimAlpha;
      ctx.lineWidth = lineW * 2.4;
      traceCurve(ctx, pts, true);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (lineCol && lineW > 0) {
      traceCurve(ctx, pts, true);
      ctx.strokeStyle = lineCol;
      ctx.lineWidth = lineW;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }
  function drawCurvedSpike(ctx, bL, tip, bR, fill, shade, hi, lineCol, lineW, bend = 0) {
    const mxL = lerp(bL[0], tip[0], 0.5) - bend;
    const myL = lerp(bL[1], tip[1], 0.5) - Math.abs(bend) * 0.25;
    const mxR = lerp(tip[0], bR[0], 0.5) - bend * 0.55;
    const myR = lerp(tip[1], bR[1], 0.5) + Math.abs(bend) * 0.15;
    const pts = [bL, [mxL, myL, tip[0], tip[1]], [mxR, myR, bR[0], bR[1]]];
    traceCurve(ctx, pts, true);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.save();
    traceCurve(ctx, pts, true);
    ctx.clip();
    const baseMid = [(bL[0] + bR[0]) * 0.5, (bL[1] + bR[1]) * 0.5];
    ctx.beginPath();
    ctx.moveTo(baseMid[0], baseMid[1]);
    ctx.quadraticCurveTo((mxL + mxR) * 0.5, (myL + myR) * 0.5, tip[0], tip[1]);
    ctx.quadraticCurveTo(mxR, myR, bR[0], bR[1]);
    ctx.closePath();
    ctx.fillStyle = shade;
    ctx.fill();
    if (hi) {
      ctx.beginPath();
      ctx.moveTo(lerp(bL[0], baseMid[0], 0.3), lerp(bL[1], baseMid[1], 0.3));
      ctx.quadraticCurveTo(mxL * 0.96 + baseMid[0] * 0.04, myL, lerp(baseMid[0], tip[0], 0.65), lerp(baseMid[1], tip[1], 0.65));
      ctx.lineTo(lerp(bL[0], baseMid[0], 0.68), lerp(bL[1], baseMid[1], 0.68));
      ctx.closePath();
      ctx.fillStyle = hi;
      ctx.globalAlpha = 0.72;
      ctx.fill();
    }
    ctx.restore();
    traceCurve(ctx, pts, true);
    ctx.strokeStyle = lineCol;
    ctx.lineWidth = lineW;
    ctx.lineJoin = "round";
    ctx.stroke();
  }
  function drawGoku2DMaster(ctx, ch, W = 720, H = 1280, opts = {}) {
    const proj = createProjector(ch, W, H);
    const t = ch.t;
    const isSSJ = ch.ssj > 0.5;
    const hl = ch.hairLift;
    const crouch = ch.crouch;
    const spread = ch.armSpread;
    const arch = ch.chestArch;
    const ap = ch.auraPower;
    const breathe = Math.sin(t * (isSSJ ? 16 : 6)) * 8e-3;
    const tremble = ch.charge * (1 - ch.ssj * 0.5) * 6e-3 * Math.sin(t * 58);
    const P = (x, y, z = 0) => {
      const [sx, sy] = proj(x, y, z);
      return [sx, sy];
    };
    const P3 = (x, y, z = 0) => proj(x, y, z);
    const horizonY = H * (0.62 - ch.camPitch / 45 * 0.16);
    if (!opts.skipBackground) {
      const sky = ctx.createLinearGradient(0, 0, 0, horizonY + 80);
      if (ch.impactFlash > 0.5) {
        sky.addColorStop(0, "#ffffff");
        sky.addColorStop(1, "#fff5b0");
      } else if (isSSJ) {
        sky.addColorStop(0, "#091224");
        sky.addColorStop(0.55, "#1d2b38");
        sky.addColorStop(1, "#4d3f14");
      } else {
        sky.addColorStop(0, "#061026");
        sky.addColorStop(0.6, "#12294a");
        sky.addColorStop(1, "#26496e");
      }
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      const cragShift = -ch.camYaw * 2.6;
      ctx.fillStyle = isSSJ ? "#1b1d28" : "#152339";
      ctx.beginPath();
      ctx.moveTo(-200, horizonY);
      const crags = [[-120, 0], [-40, -140], [50, -55], [140, -195], [240, -70], [360, -155], [470, -60], [590, -210], [700, -85], [840, -140], [980, 0]];
      for (const [cx0, cy0] of crags) ctx.lineTo(cx0 + cragShift, horizonY + cy0);
      ctx.closePath();
      ctx.fill();
      const gnd = ctx.createLinearGradient(0, horizonY, 0, H);
      gnd.addColorStop(0, isSSJ ? "#302820" : "#262936");
      gnd.addColorStop(1, "#121018");
      ctx.fillStyle = gnd;
      ctx.fillRect(0, horizonY, W, H - horizonY);
      const footAnchor = P(0, 0.72, 0);
      ctx.strokeStyle = isSSJ ? "rgba(255,215,70,0.42)" : "rgba(15,15,24,0.65)";
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI + 0.15;
        ctx.beginPath();
        ctx.moveTo(footAnchor[0], footAnchor[1]);
        ctx.lineTo(footAnchor[0] + Math.cos(a) * 160, footAnchor[1] + Math.sin(a) * 52);
        ctx.lineTo(footAnchor[0] + Math.cos(a + 0.1) * 340, footAnchor[1] + Math.sin(a) * 125);
        ctx.stroke();
      }
    }
    const centerPt = P(0, -0.05, 0);
    if (ap > 0.15) {
      ctx.save();
      ctx.strokeStyle = isSSJ ? `rgba(255, 236, 110, ${0.26 * clamp(ap)})` : `rgba(110, 195, 255, ${0.2 * clamp(ap)})`;
      for (let i = 0; i < 34; i++) {
        const ang = i / 34 * Math.PI * 2 + t * 0.45;
        const r0 = 200 + Math.sin(t * 24 + i * 2) * 35;
        ctx.lineWidth = i % 3 === 0 ? 3.2 : 1.5;
        ctx.beginPath();
        ctx.moveTo(centerPt[0] + Math.cos(ang) * r0, centerPt[1] + Math.sin(ang) * r0);
        ctx.lineTo(centerPt[0] + Math.cos(ang) * 900, centerPt[1] + Math.sin(ang) * 900);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (ap > 0.03) {
      ctx.save();
      const aR = 200 * (0.7 + 0.45 * clamp(ap)) / ch.camDist;
      const radG = ctx.createRadialGradient(centerPt[0], centerPt[1], 10, centerPt[0], centerPt[1], aR * 1.45);
      radG.addColorStop(0, `rgba(255, 250, 185, ${0.48 * clamp(ap)})`);
      radG.addColorStop(0.5, `rgba(255, 200, 35, ${0.28 * clamp(ap)})`);
      radG.addColorStop(1, "rgba(255, 130, 0, 0)");
      ctx.fillStyle = radG;
      ctx.beginPath();
      ctx.ellipse(centerPt[0], centerPt[1], aR * 0.95, aR * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      const flameLayers = [
        { n: 14, col: `rgba(255, 175, 22, ${0.4 * clamp(ap)})`, w: 0.13, h: 1.02 },
        { n: 12, col: `rgba(255, 240, 120, ${0.48 * clamp(ap)})`, w: 0.09, h: 0.86 }
      ];
      for (const fl of flameLayers) {
        ctx.fillStyle = fl.col;
        for (let i = 0; i < fl.n; i++) {
          const ang = i / fl.n * Math.PI * 2;
          const bx = Math.sin(ang) * (0.28 + 0.18 * clamp(ap));
          const by = 0.25 - Math.cos(ang) * 0.14;
          const sway = Math.sin(t * 16 + i * 1.9) * 0.09;
          const tx = bx * 1.25 + sway;
          const ty = by - (0.58 + 0.56 * clamp(ap)) * fl.h * (0.75 + 0.3 * Math.abs(Math.sin(t * 13 + i)));
          const pL = P(bx - fl.w, by, -0.08);
          const pT = P(tx, ty, -0.06);
          const pR = P(bx + fl.w, by, -0.08);
          const mL = P(lerp(bx - fl.w, tx, 0.55) - 0.04, lerp(by, ty, 0.55), -0.07);
          const mR = P(lerp(bx + fl.w, tx, 0.55) + 0.04, lerp(by, ty, 0.55), -0.07);
          traceCurve(ctx, [pL, [mL[0], mL[1], pT[0], pT[1]], [mR[0], mR[1], pR[0], pR[1]]], true);
          ctx.fill();
        }
      }
      ctx.restore();
    }
    const hipY = 0.04 + crouch * 0.09;
    const waistY = hipY - 0.1;
    const chestY = waistY - 0.26 + breathe;
    const shoulderY = chestY - 0.04;
    const neckY = shoulderY - 0.04;
    const headY = neckY - 0.115 + arch * 0.02;
    const headX = tremble * 0.4;
    const headZ = -arch * 0.04 + 0.02;
    const rimCol = "#fff08a";
    const rimAlpha = ap > 0.2 ? clamp((ap - 0.2) * 0.85) : 0;
    const giCol = isSSJ ? "#ff7c1c" : "#f25e12";
    const giShade = isSSJ ? "#b83606" : "#9e2c04";
    const blueCol = isSSJ ? "#1e50c8" : "#143b94";
    const blueShade = isSSJ ? "#0d266e" : "#091d52";
    const skinCol = isSSJ ? "#ffd6b0" : "#f5be92";
    const skinShade = isSSJ ? "#db9464" : "#c88456";
    const hairCol = isSSJ ? "#ffe240" : "#141724";
    const hairShade = isSSJ ? "#c98800" : "#080a10";
    const hairHi = isSSJ ? "#fff9c4" : "#3d4766";
    const lineBody = "#1c1014";
    const lineSkin = "#4a2318";
    const lineHair = isSSJ ? "#8c5a00" : "#06070c";
    const lw = 2.7 / ch.camDist;
    const shC = P(0, 0.73, 0);
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.beginPath();
    ctx.ellipse(shC[0], shC[1], 130 / ch.camDist, 24 / ch.camDist, 0, 0, Math.PI * 2);
    ctx.fill();
    const stanceW = lerp(0.24, 0.3, 1 - crouch * 0.25);
    const kneeX = stanceW * 0.78;
    const kneeY = hipY + 0.27;
    const kneeZ = 0.05 + crouch * 0.1;
    for (const sgn of [-1, 1]) {
      const bx = sgn * stanceW;
      const bootPts = [
        P(bx - sgn * 0.056, 0.5, 0.02),
        P(bx + sgn * 0.056, 0.5, 0.04),
        [...P(bx + sgn * 0.068, 0.63, 0.06), ...P(bx + sgn * 0.085, 0.7, 0.13)],
        P(bx + sgn * 0.05, 0.73, 0.14),
        P(bx - sgn * 0.08, 0.73, 0.05),
        P(bx - sgn * 0.065, 0.62, 0.02)
      ];
      celFill(ctx, bootPts, blueCol, blueShade, lineBody, lw, { rim: rimCol, rimAlpha });
      const cuffPts = [
        P(bx - sgn * 0.058, 0.495, 0.02),
        P(bx + sgn * 0.058, 0.495, 0.04),
        P(bx + sgn * 0.06, 0.532, 0.042),
        P(bx - sgn * 0.06, 0.532, 0.022)
      ];
      celFill(ctx, cuffPts, "#de2626", "#8a1010", lineBody, lw * 0.85);
      ctx.strokeStyle = "#f8cc38";
      ctx.lineWidth = lw * 1.25;
      const tL = P(bx - sgn * 0.058, 0.58, 0.03);
      const tR = P(bx + sgn * 0.06, 0.58, 0.05);
      ctx.beginPath();
      ctx.moveTo(tL[0], tL[1]);
      ctx.lineTo(tR[0], tR[1]);
      ctx.stroke();
      const pantPts = [
        P(sgn * 5e-3, waistY + 0.02, 0.05),
        P(sgn * 0.175, waistY + 0.01, 0.03),
        [...P(sgn * (kneeX + 0.105), kneeY - 0.06, kneeZ), ...P(sgn * (kneeX + 0.088), kneeY + 0.02, kneeZ)],
        [...P(bx + sgn * 0.105, 0.4, 0.04), ...P(bx + sgn * 0.054, 0.505, 0.03)],
        P(bx - sgn * 0.052, 0.505, 0.02),
        [...P(sgn * (kneeX - 0.072), kneeY + 0.01, kneeZ), ...P(sgn * (kneeX - 0.052), kneeY - 0.07, kneeZ)],
        P(0, hipY + 0.09, 0.05)
      ];
      celFill(ctx, pantPts, giCol, giShade, lineBody, lw, { rim: rimCol, rimAlpha });
      ctx.strokeStyle = giShade;
      ctx.lineWidth = lw * 0.85;
      const f1 = P(sgn * (kneeX - 0.01), kneeY - 0.06, kneeZ + 0.02);
      const f2 = P(sgn * (kneeX + 0.03), kneeY + 0.03, kneeZ + 0.02);
      ctx.beginPath();
      ctx.moveTo(f1[0], f1[1]);
      ctx.lineTo(f2[0], f2[1]);
      ctx.stroke();
    }
    const pelvisBridge = [
      P(-0.17, waistY + 0.01, 0.04),
      P(0.17, waistY + 0.01, 0.04),
      P(0.16, hipY + 0.09, 0.04),
      P(0, hipY + 0.12, 0.05),
      P(-0.16, hipY + 0.09, 0.04)
    ];
    celFill(ctx, pelvisBridge, giCol, giShade, lineBody, lw * 0.9);
    const sw1 = Math.sin(t * 14) * (0.04 + 0.06 * clamp(ap));
    const sw2 = Math.cos(t * 17 + 0.8) * (0.04 + 0.07 * clamp(ap));
    for (const [dx, wv, len] of [[-0.07, sw1, 0.25], [-0.01, sw2, 0.28]]) {
      const sPts = [
        P(dx - 0.02, waistY + 0.04, 0.06),
        P(dx + 0.025, waistY + 0.04, 0.06),
        [...P(dx - 0.04 - wv * 0.5, waistY + len * 0.55, 0.04), ...P(dx - 0.09 - wv, waistY + len, 0.01)],
        [...P(dx - 0.14 - wv, waistY + len - 0.02, 0.01), ...P(dx - 0.09 - wv * 0.5, waistY + len * 0.5, 0.04)]
      ];
      celFill(ctx, sPts, blueCol, blueShade, lineBody, lw * 0.9, { rim: rimCol, rimAlpha });
    }
    const underPts = [
      P(-0.145, shoulderY - 0.01, 0.06),
      P(0.145, shoulderY - 0.01, 0.06),
      P(0.1, chestY + 0.11, 0.09),
      P(0, chestY + 0.16, 0.095),
      P(-0.1, chestY + 0.11, 0.09)
    ];
    celFill(ctx, underPts, blueCol, blueShade, lineBody, lw * 0.9);
    const torsoPts = [
      P(-0.235, shoulderY - 0.02, -0.01),
      P(-0.125, shoulderY - 0.03, 0.06),
      P(0, chestY + 0.15, 0.095),
      P(0.125, shoulderY - 0.03, 0.06),
      P(0.235, shoulderY - 0.02, -0.01),
      [...P(0.215, chestY + 0.14, 0.03), ...P(0.168, waistY + 0.01, 0.045)],
      P(-0.168, waistY + 0.01, 0.045),
      [...P(-0.215, chestY + 0.14, 0.03), ...P(-0.235, shoulderY - 0.02, -0.01)]
    ];
    celFill(ctx, torsoPts, giCol, giShade, lineBody, lw, { rim: rimCol, rimAlpha });
    ctx.strokeStyle = lineBody;
    ctx.lineWidth = lw * 0.95;
    const lapL1 = P(-0.115, shoulderY - 0.02, 0.065);
    const lapL2 = P(0.028, chestY + 0.18, 0.095);
    const lapR1 = P(0.115, shoulderY - 0.02, 0.065);
    const lapR2 = P(-0.016, chestY + 0.15, 0.095);
    ctx.beginPath();
    ctx.moveTo(lapL1[0], lapL1[1]);
    ctx.lineTo(lapL2[0], lapL2[1]);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lapR1[0], lapR1[1]);
    ctx.lineTo(lapR2[0], lapR2[1]);
    ctx.stroke();
    const beltPts = [
      P(-0.175, waistY - 0.02, 0.05),
      P(0.175, waistY - 0.02, 0.05),
      P(0.18, waistY + 0.055, 0.05),
      P(-0.18, waistY + 0.055, 0.05)
    ];
    celFill(ctx, beltPts, blueCol, blueShade, lineBody, lw, { rim: rimCol, rimAlpha });
    const knotC = P(-0.03, waistY + 0.02, 0.07);
    ctx.fillStyle = blueCol;
    ctx.strokeStyle = lineBody;
    ctx.lineWidth = lw * 0.85;
    ctx.beginPath();
    ctx.ellipse(knotC[0], knotC[1], 14 / ch.camDist, 10 / ch.camDist, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (const sgn of [-1, 1]) {
      const shX = sgn * 0.22;
      const elbX = sgn * lerp(0.31, 0.4, spread);
      const elbY = lerp(chestY + 0.15, chestY + 0.1, spread);
      const elbZ = lerp(0.06, 0.03, spread);
      const fstX = sgn * lerp(0.21, 0.45, spread);
      const fstY = lerp(waistY + 0.05, waistY + 0.12, spread);
      const fstZ = lerp(0.2, 0.08, spread);
      const armPts = [
        P(shX - sgn * 0.02, shoulderY - 0.02, 0.02),
        [...P(shX + sgn * 0.085, shoulderY + 0.02, 0.01), ...P(elbX + sgn * 0.075, elbY - 0.03, elbZ)],
        [...P(elbX + sgn * 0.07, elbY + 0.04, elbZ), ...P(fstX + sgn * 0.05, fstY - 0.02, fstZ)],
        P(fstX - sgn * 0.046, fstY + 5e-3, fstZ),
        [...P(elbX - sgn * 0.045, elbY + 0.03, elbZ + 0.02), ...P(shX - sgn * 0.055, shoulderY + 0.09, 0.04)]
      ];
      celFill(ctx, armPts, skinCol, skinShade, lineSkin, lw, { rim: rimCol, rimAlpha });
      const c1 = P(elbX - sgn * 0.03, elbY + 0.01, elbZ + 0.03);
      const c2 = P(elbX + sgn * 0.03, elbY - 0.01, elbZ + 0.03);
      ctx.strokeStyle = lineSkin;
      ctx.lineWidth = lw * 0.7;
      ctx.beginPath();
      ctx.moveTo(c1[0], c1[1]);
      ctx.lineTo(c2[0], c2[1]);
      ctx.stroke();
      const capPts = [
        P(shX - sgn * 0.05, shoulderY - 0.03, 0.01),
        P(shX + sgn * 0.045, shoulderY - 0.01, 0.01),
        P(shX + sgn * 0.055, shoulderY + 0.08, 0.02),
        P(shX - sgn * 0.035, shoulderY + 0.07, 0.03)
      ];
      celFill(ctx, capPts, giCol, giShade, lineBody, lw * 0.9, { rim: rimCol, rimAlpha });
      const wrPts = [
        P(fstX - sgn * 0.048, fstY - 0.048, fstZ),
        P(fstX + sgn * 0.05, fstY - 0.056, fstZ),
        P(fstX + sgn * 0.048, fstY + 4e-3, fstZ),
        P(fstX - sgn * 0.046, fstY + 0.012, fstZ)
      ];
      celFill(ctx, wrPts, blueCol, blueShade, lineBody, lw * 0.85, { rim: rimCol, rimAlpha });
      const fistPts = [
        P(fstX - sgn * 0.045, fstY + 8e-3, fstZ + 0.01),
        P(fstX + sgn * 0.048, fstY + 2e-3, fstZ + 0.01),
        P(fstX + sgn * 0.054, fstY + 0.048, fstZ + 0.03),
        P(fstX + sgn * 0.024, fstY + 0.088, fstZ + 0.035),
        P(fstX - sgn * 0.036, fstY + 0.082, fstZ + 0.03),
        P(fstX - sgn * 0.05, fstY + 0.042, fstZ + 0.02)
      ];
      celFill(ctx, fistPts, skinCol, skinShade, lineSkin, lw * 0.9, { rim: rimCol, rimAlpha });
      ctx.strokeStyle = lineSkin;
      ctx.lineWidth = lw * 0.65;
      for (const df of [-0.016, 4e-3, 0.024]) {
        const k1 = P(fstX + sgn * df, fstY + 0.045, fstZ + 0.035);
        const k2 = P(fstX + sgn * df, fstY + 0.08, fstZ + 0.035);
        ctx.beginPath();
        ctx.moveTo(k1[0], k1[1]);
        ctx.lineTo(k2[0], k2[1]);
        ctx.stroke();
      }
    }
    const neckPts = [
      P(-0.105, shoulderY - 5e-3, 0.015),
      P(0.105, shoulderY - 5e-3, 0.015),
      P(0.06, headY + 0.052, headZ + 0.018),
      P(-0.06, headY + 0.052, headZ + 0.018)
    ];
    celFill(ctx, neckPts, skinShade, skinShade, lineSkin, lw * 0.9);
    const hScale = P3(headX, headY, headZ)[2];
    const skullDome = [
      P(headX - 0.102, headY - 0.03, headZ),
      [...P(headX - 0.112, headY - 0.118, headZ - 0.01), ...P(headX, headY - 0.136, headZ - 0.01)],
      [...P(headX + 0.112, headY - 0.118, headZ - 0.01), ...P(headX + 0.102, headY - 0.03, headZ)],
      P(headX + 0.09, headY + 0.02, headZ + 0.01),
      P(headX - 0.09, headY + 0.02, headZ + 0.01)
    ];
    celFill(ctx, skullDome, hairCol, null, null, 0);
    const spikeData = [
      // Broad overlapping crescent locks (Base Goku 4-left / 3-right iconic silhouette!)
      [[-0.06, -0.02], [-0.3, -0.09], [-0.09, -0.1], 0.045, false],
      [[-0.08, -0.06], [-0.34, -0.22], [-0.04, -0.14], 0.055, false],
      [[-0.05, -0.09], [-0.22, -0.32], [0.02, -0.15], 0.04, true],
      [[-0.01, -0.11], [0.03, -0.35], [0.07, -0.13], 0.025, true],
      [[0.03, -0.11], [0.25, -0.28], [0.1, -0.08], -0.045, true],
      [[0.07, -0.08], [0.33, -0.15], [0.1, -0.02], -0.055, false],
      [[0.08, -0.03], [0.27, 0], [0.08, 0.04], -0.04, false],
      [[-0.08, -0.01], [-0.24, 0.03], [-0.07, 0.04], 0.035, false]
    ];
    const ssjSpikeData = [
      [[-0.07, -0.02], [-0.25, -0.21], [-0.08, -0.1], 0.04, false],
      [[-0.08, -0.06], [-0.23, -0.37], [-0.04, -0.14], 0.04, true],
      [[-0.05, -0.09], [-0.11, -0.46], [0.01, -0.15], 0.025, true],
      [[-0.02, -0.11], [0.01, -0.51], [0.05, -0.14], 0.015, true],
      [[0.02, -0.11], [0.15, -0.44], [0.09, -0.1], -0.025, true],
      [[0.06, -0.09], [0.25, -0.33], [0.1, -0.04], -0.04, true],
      [[0.08, -0.04], [0.24, -0.14], [0.08, 0.03], -0.035, false],
      [[-0.08, -0.01], [-0.22, -0.1], [-0.07, 0.04], 0.03, false]
    ];
    for (const sgn of [-1, 1]) {
      if (sgn === 1 && ch.camYaw > 22) continue;
      const ePts = [
        P(headX + sgn * 0.09, headY - 0.02, headZ + 0.02),
        P(headX + sgn * 0.114, headY - 0.03, headZ + 0.01),
        P(headX + sgn * 0.104, headY + 0.04, headZ + 0.02),
        P(headX + sgn * 0.085, headY + 0.04, headZ + 0.03)
      ];
      celFill(ctx, ePts, skinShade, skinShade, lineSkin, lw * 0.8);
    }
    for (let i = 0; i < spikeData.length; i++) {
      const b = spikeData[i];
      const s = ssjSpikeData[i];
      const j = Math.sin(t * 24 + i * 1.9) * (6e-3 + 0.014 * clamp(ap));
      const bL = P(headX + lerp(b[0][0], s[0][0], hl), headY + lerp(b[0][1], s[0][1], hl), headZ - 0.01);
      const tip = P(headX + lerp(b[1][0], s[1][0], hl) + j, headY + lerp(b[1][1], s[1][1], hl) - Math.abs(j) * 0.4, headZ - 0.02);
      const bR = P(headX + lerp(b[2][0], s[2][0], hl), headY + lerp(b[2][1], s[2][1], hl), headZ - 0.01);
      drawCurvedSpike(ctx, bL, tip, bR, hairCol, hairShade, b[4] ? hairHi : null, lineHair, lw * 0.9, lerp(b[3], s[3], hl) * hScale);
    }
    const headPts = [
      P(headX - 0.095, headY - 0.068, headZ + 0.035),
      P(headX + 0.095, headY - 0.068, headZ + 0.035),
      [...P(headX + 0.093, headY + 0.028, headZ + 0.05), ...P(headX + 0.052, headY + 0.092, headZ + 0.07)],
      P(headX, headY + 0.118, headZ + 0.082),
      [...P(headX - 0.052, headY + 0.092, headZ + 0.07), ...P(headX - 0.093, headY + 0.028, headZ + 0.05)]
    ];
    celFill(ctx, headPts, skinCol, skinShade, lineSkin, lw, { rim: rimCol, rimAlpha });
    const hairlinePts = [
      P(headX - 0.1, headY - 0.052, headZ + 0.04),
      [...P(headX - 0.095, headY - 0.13, headZ + 0.02), ...P(headX, headY - 0.138, headZ + 0.02)],
      [...P(headX + 0.095, headY - 0.13, headZ + 0.02), ...P(headX + 0.1, headY - 0.052, headZ + 0.04)],
      P(headX + 0.06, headY - 0.075, headZ + 0.06),
      P(headX, headY - 0.082, headZ + 0.065),
      P(headX - 0.06, headY - 0.075, headZ + 0.06)
    ];
    celFill(ctx, hairlinePts, hairCol, null, null, 0);
    const eyeY = headY - 0.012;
    for (const sgn of [-1, 1]) {
      const ex = headX + sgn * 0.043;
      const eyePts = [
        P(ex - sgn * 0.028, eyeY - 0.014, headZ + 0.084),
        P(ex + sgn * 0.026, eyeY - 0.02, headZ + 0.082),
        P(ex + sgn * 0.02, eyeY + 8e-3, headZ + 0.082),
        P(ex - sgn * 0.022, eyeY + 8e-3, headZ + 0.084)
      ];
      traceCurve(ctx, eyePts, true);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#111116";
      ctx.lineWidth = lw * 0.65;
      ctx.stroke();
      const ic = P(ex - sgn * 2e-3, eyeY - 4e-3, headZ + 0.086);
      const ir = 0.0105 * hScale;
      ctx.fillStyle = isSSJ ? "#1ee6b0" : "#151620";
      ctx.beginPath();
      ctx.ellipse(ic[0], ic[1], ir * 0.9, ir * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#07080c";
      ctx.beginPath();
      ctx.arc(ic[0], ic[1], ir * 0.48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ic[0] - ir * 0.35, ic[1] - ir * 0.35, ir * 0.28, 0, Math.PI * 2);
      ctx.fill();
      const lash1 = P(ex - sgn * 0.03, eyeY - 0.015, headZ + 0.086);
      const lash2 = P(ex + sgn * 0.029, eyeY - 0.022, headZ + 0.084);
      ctx.strokeStyle = "#101016";
      ctx.lineWidth = lw * 1.35;
      ctx.beginPath();
      ctx.moveTo(lash1[0], lash1[1]);
      ctx.lineTo(lash2[0], lash2[1]);
      ctx.stroke();
      const br1 = P(headX + sgn * 0.012, eyeY - 0.016, headZ + 0.09);
      const br2 = P(headX + sgn * 0.078, eyeY - 0.036, headZ + 0.085);
      ctx.strokeStyle = isSSJ ? "#d49800" : "#101016";
      ctx.lineWidth = lw * 1.55;
      ctx.beginPath();
      ctx.moveTo(br1[0], br1[1]);
      ctx.lineTo(br2[0], br2[1]);
      ctx.stroke();
    }
    const nTop = P(headX, headY + 6e-3, headZ + 0.092);
    const nTip = P(headX + 5e-3, headY + 0.028, headZ + 0.098);
    const nBot = P(headX - 6e-3, headY + 0.032, headZ + 0.092);
    ctx.fillStyle = skinShade;
    ctx.beginPath();
    ctx.moveTo(nTop[0], nTop[1]);
    ctx.lineTo(nTip[0], nTip[1]);
    ctx.lineTo(nBot[0], nBot[1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = lineSkin;
    ctx.lineWidth = lw * 0.75;
    ctx.beginPath();
    ctx.moveTo(nTop[0], nTop[1]);
    ctx.lineTo(nTip[0], nTip[1]);
    ctx.lineTo(nBot[0], nBot[1]);
    ctx.stroke();
    const mh = lerp(0.012, 0.044, ch.mouthOpen);
    const mPts = [
      P(headX - 0.035, headY + 0.056, headZ + 0.088),
      P(headX + 0.035, headY + 0.056, headZ + 0.088),
      P(headX + 0.028, headY + 0.056 + mh, headZ + 0.086),
      P(headX - 0.028, headY + 0.056 + mh, headZ + 0.086)
    ];
    traceCurve(ctx, mPts, true);
    ctx.fillStyle = ch.mouthOpen > 0.3 ? "#4d0f18" : "#ffffff";
    ctx.fill();
    if (ch.mouthOpen > 0.3) {
      ctx.save();
      traceCurve(ctx, mPts, true);
      ctx.clip();
      const tY = P(headX, headY + 0.062, headZ + 0.088)[1];
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(mPts[0][0] - 5, mPts[0][1] - 2, mPts[1][0] - mPts[0][0] + 10, Math.max(4, tY - mPts[0][1] + 2));
      ctx.restore();
    }
    ctx.strokeStyle = lineSkin;
    ctx.lineWidth = lw * 0.75;
    traceCurve(ctx, mPts, true);
    ctx.stroke();
    const bangL = [
      P(headX - 0.072, headY - 0.095, headZ + 0.065),
      P(headX - 0.086, headY - 2e-3, headZ + 0.09),
      P(headX - 0.028, headY - 0.085, headZ + 0.075)
    ];
    const bangC = [
      P(headX - 0.024, headY - 0.105, headZ + 0.072),
      P(headX - 4e-3 + Math.sin(t * 22) * 4e-3 * clamp(ap), headY + 4e-3, headZ + 0.095),
      P(headX + 0.024, headY - 0.102, headZ + 0.072)
    ];
    const bangR = [
      P(headX + 0.028, headY - 0.088, headZ + 0.075),
      P(headX + 0.084, headY - 5e-3, headZ + 0.09),
      P(headX + 0.072, headY - 0.092, headZ + 0.065)
    ];
    drawCurvedSpike(ctx, bangL[0], bangL[1], bangL[2], hairCol, hairShade, hairHi, lineHair, lw * 0.8, 0.012 * hScale);
    drawCurvedSpike(ctx, bangC[0], bangC[1], bangC[2], hairCol, hairShade, hairHi, lineHair, lw * 0.8, 8e-3 * hScale);
    drawCurvedSpike(ctx, bangR[0], bangR[1], bangR[2], hairCol, hairShade, hairHi, lineHair, lw * 0.8, -0.012 * hScale);
    const rRock = makeRng(777);
    for (let i = 0; i < 14; i++) {
      const rx0 = (rRock() - 0.5) * 1.45;
      const rz0 = (rRock() - 0.5) * 0.65;
      const baseRY = 0.72 + rRock() * 0.08;
      const lift = ch.charge > 0.25 ? Math.pow(clamp((ch.charge - 0.25) / 0.75), 1.4) * (0.18 + rRock() * 0.55) : 0;
      const rp = P3(rx0, baseRY - lift, rz0);
      const sz = (0.022 + rRock() * 0.026) * rp[2];
      ctx.fillStyle = "#483e4a";
      ctx.strokeStyle = "#14101a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rp[0] - sz, rp[1]);
      ctx.lineTo(rp[0] - sz * 0.3, rp[1] - sz * 0.8);
      ctx.lineTo(rp[0] + sz * 0.9, rp[1] - sz * 0.2);
      ctx.lineTo(rp[0] + sz * 0.4, rp[1] + sz * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (ch.charge > 0.3 || isSSJ) {
      const rBolt = makeRng(Math.floor(t * 18) * 997 + 17);
      ctx.save();
      for (let b = 0; b < (isSSJ ? 5 : 3); b++) {
        let bx = (rBolt() - 0.5) * 0.95;
        let by = -0.65 + rBolt() * 1.25;
        ctx.beginPath();
        const sp = P(bx, by, 0.14);
        ctx.moveTo(sp[0], sp[1]);
        for (let s = 0; s < 5; s++) {
          bx += (rBolt() - 0.5) * 0.26;
          by += (rBolt() - 0.45) * 0.24;
          const np = P(bx, by, 0.14);
          ctx.lineTo(np[0], np[1]);
        }
        ctx.strokeStyle = "rgba(130, 235, 255, 0.95)";
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.restore();
    }
    if (ch.shockwaveP > 0.01 && ch.shockwaveP < 0.98) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 245, 145, ${1 - ch.shockwaveP})`;
      ctx.lineWidth = 14 * (1 - ch.shockwaveP);
      ctx.beginPath();
      ctx.arc(centerPt[0], centerPt[1], 60 + ch.shockwaveP * 560, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ../AnimationLab/StyleBenchmark/shared/model_check/_proof2d_entry.js
  window.render2DPanel = (t, overrideSSJ, zoomBoost) => {
    let c = document.getElementById("c");
    if (!c) {
      c = document.createElement("canvas");
      c.id = "c";
      c.width = 720;
      c.height = 640;
      document.body.appendChild(c);
    }
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 720, 640);
    const ch = solveChoreography(t);
    if (overrideSSJ !== null) ch.ssj = overrideSSJ;
    ctx.save();
    if (zoomBoost) {
      ch.camDist *= 0.45;
      ch.camY += 0.36;
      ctx.translate(0, -290);
      drawGoku2DMaster(ctx, ch, 720, 1280);
    } else {
      ctx.fillStyle = "#091020";
      ctx.fillRect(0, 0, 720, 640);
      ctx.translate(180, 0);
      ctx.scale(0.5, 0.5);
      drawGoku2DMaster(ctx, ch, 720, 1280);
    }
    ctx.restore();
    return c.toDataURL("image/png");
  };
})();
