import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const require = createRequire('G:\\AnimationLab\\sandboxes\\pixi-suite\\package.json');
const { chromium } = require('playwright-core');

const CUES_JSON = 'G:\\AnimationLab\\test-outputs\\13_rhubarb-lip-sync\\mouth_cues_dialog.json';
const WAV_PATH = 'G:\\AnimationLab\\sandboxes\\shared-media\\speech_test.wav';
const OUT_DIR = 'G:\\AnimationLab\\test-outputs\\13_rhubarb-lip-sync';
const SANDBOX = 'G:\\AnimationLab\\sandboxes\\rhubarb-demo';
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG = process.env.FFMPEG_BIN || 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';

const cues = JSON.parse(readFileSync(CUES_JSON, 'utf8'));
const duration = cues.metadata.duration;
const fps = 24;
const totalFrames = Math.ceil(duration * fps);

const HTML = `<!doctype html><html><body style="margin:0;background:#0a0f1f">
<canvas id="c" width="1280" height="720"></canvas>
<script>
const cues = ${JSON.stringify(cues.mouthCues)};
const dur = ${duration};
const desc = {
  A: 'Closed lips (M/B/P)',
  B: 'Slightly open / teeth (K/S/T)',
  C: 'Open vowel (EH/AE)',
  D: 'Wide open (AA/AI)',
  E: 'Rounded mid (AO/ER)',
  F: 'Puckered (UW/W/OO)',
  G: 'Upper teeth on lower lip (F/V)',
  H: 'Tongue behind teeth (L)',
  X: 'Idle / rest'
};
const c = document.getElementById('c');
const ctx = c.getContext('2d');
window.drawFrame = (t) => {
  const cue = cues.find(q => t >= q.start && t < q.end) || cues[cues.length - 1];
  const v = cue.value;
  ctx.fillStyle = '#0a0f1f';
  ctx.fillRect(0, 0, 1280, 720);

  // Title
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 28px Segoe UI, sans-serif';
  ctx.fillText('Rhubarb Lip Sync v1.14.0 · Preston Blair Viseme Verification', 48, 56);

  // Stylized anime character head
  const cx = 420, cy = 340;
  ctx.fillStyle = '#f7d5b5';
  ctx.beginPath(); ctx.ellipse(cx, cy, 130, 155, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#33221a'; ctx.lineWidth = 5; ctx.stroke();

  // Hair bangs
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(cx - 135, cy - 30);
  ctx.quadraticCurveTo(cx, cy - 210, cx + 135, cy - 30);
  ctx.lineTo(cx + 85, cy - 75); ctx.lineTo(cx + 25, cy - 45);
  ctx.lineTo(cx - 25, cy - 78); ctx.lineTo(cx - 90, cy - 42);
  ctx.closePath(); ctx.fill();

  // Anime eyes
  for (const sx of [-52, 52]) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(cx + sx, cy - 24, 24, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath(); ctx.arc(cx + sx, cy - 22, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(cx + sx, cy - 22, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx + sx - 4, cy - 27, 3.5, 0, Math.PI * 2); ctx.fill();
  }

  // Viseme mouth shape
  const mx = cx, my = cy + 68;
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#3b1d14';
  if (v === 'A' || v === 'X') {
    ctx.beginPath(); ctx.moveTo(mx - 32, my); ctx.quadraticCurveTo(mx, my + (v === 'A' ? 0 : 4), mx + 32, my); ctx.stroke();
  } else if (v === 'B') {
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath(); ctx.roundRect(mx - 32, my - 8, 64, 16, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(mx - 24, my - 6, 48, 5);
  } else if (v === 'C' || v === 'E') {
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath(); ctx.ellipse(mx, my, v === 'E' ? 24 : 34, v === 'E' ? 18 : 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(mx - 20, my - 13, 40, 6);
  } else if (v === 'D') {
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath(); ctx.ellipse(mx, my + 4, 34, 28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fb7185';
    ctx.beginPath(); ctx.ellipse(mx, my + 18, 20, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(mx - 22, my - 20, 44, 7);
  } else if (v === 'F') {
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath(); ctx.ellipse(mx, my, 15, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (v === 'G') {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(mx - 26, my - 8, 52, 8);
    ctx.beginPath(); ctx.moveTo(mx - 30, my); ctx.lineTo(mx + 30, my); ctx.stroke();
  } else if (v === 'H') {
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath(); ctx.ellipse(mx, my, 30, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fb7185';
    ctx.beginPath(); ctx.ellipse(mx, my - 2, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Right side telemetry card
  ctx.fillStyle = '#111827';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(670, 150, 540, 340, 16); ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 24px Segoe UI, sans-serif';
  ctx.fillText('ACTIVE VISEME SHAPE', 705, 205);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 124px Segoe UI, sans-serif';
  ctx.fillText(v, 705, 345);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 24px Segoe UI, sans-serif';
  ctx.fillText(desc[v] || '', 705, 405);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 20px Consolas, monospace';
  ctx.fillText('time=' + t.toFixed(2) + 's / ' + dur.toFixed(2) + 's  [' + cue.start.toFixed(2) + ' - ' + cue.end.toFixed(2) + ']', 705, 455);

  // Timeline bar at bottom
  const bx = 60, by = 600, bw = 1160, bh = 54;
  ctx.fillStyle = '#1e293b'; ctx.fillRect(bx, by, bw, bh);
  const colors = { A:'#f43f5e', B:'#3b82f6', C:'#10b981', D:'#f59e0b', E:'#8b5cf6', F:'#ec4899', G:'#14b8a6', H:'#eab308', X:'#334155' };
  for (const q of cues) {
    const x0 = bx + (q.start / dur) * bw;
    const w = Math.max(2, ((q.end - q.start) / dur) * bw);
    ctx.fillStyle = colors[q.value] || '#475569';
    ctx.fillRect(x0, by + 6, w, bh - 12);
  }
  const px = bx + (t / dur) * bw;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(px - 2, by - 8, 4, bh + 16);
};
</script></body></html>`;

async function main() {
  const framesDir = resolve(SANDBOX, 'tmp_frames');
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    await page.setContent(HTML);
    for (let f = 0; f < totalFrames; f++) {
      await page.evaluate(t => window.drawFrame(t), f / fps);
      await page.screenshot({ path: resolve(framesDir, `frame_${String(f).padStart(4, '0')}.png`), type: 'png' });
      if (f === Math.floor(totalFrames * 0.4)) {
        await page.screenshot({ path: resolve(OUT_DIR, 'rhubarb_frame.png'), type: 'png' });
      }
    }
  } finally {
    await browser.close();
  }

  const outMp4 = resolve(OUT_DIR, 'rhubarb_preview.mp4');
  execFileSync(FFMPEG, [
    '-y', '-framerate', String(fps),
    '-i', resolve(framesDir, 'frame_%04d.png'),
    '-i', WAV_PATH,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18',
    '-c:a', 'aac', '-b:a', '128k', '-shortest',
    outMp4,
  ], { stdio: 'ignore' });
  rmSync(framesDir, { recursive: true, force: true });
  console.log(`Rendered Rhubarb preview with audio -> ${outMp4}`);
}

main().catch(e => { console.error(e); process.exit(1); });
