import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = 'G:\\AnimationLab';
const SUITE = resolve(ROOT, 'sandboxes', 'pixi-suite');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG = process.env.FFMPEG_BIN || 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';

const modes = [
  { mode: 'sprite', outDir: resolve(ROOT, 'test-outputs', '06_pixijs'), mp4: 'pixijs_sprite_demo.mp4', png: 'pixijs_sprite_frame.png' },
  { mode: 'filters', outDir: resolve(ROOT, 'test-outputs', '07_pixijs-filters'), mp4: 'pixijs_filters_demo.mp4', png: 'pixijs_filters_frame.png' },
  { mode: 'particles', outDir: resolve(ROOT, 'test-outputs', '08_pixijs-particle-emitter'), mp4: 'particle_emitter_demo.mp4', png: 'particle_emitter_frame.png' },
];

async function runMode(browser, spec) {
  const framesDir = resolve(SUITE, 'tmp_frames', spec.mode);
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });
  mkdirSync(spec.outDir, { recursive: true });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  const url = pathToFileURL(resolve(SUITE, 'index.html')).href;
  await page.goto(url, { waitUntil: 'load' });
  const initInfo = await page.evaluate(m => window.initPixiSuite({ mode: m, width: 1280, height: 720, fps: 24 }), spec.mode);
  console.log(`[${spec.mode}] renderer=${initInfo.rendererName} type=${initInfo.rendererType}`);

  const totalFrames = 48;
  let maxParticles = 0;
  for (let f = 0; f < totalFrames; f++) {
    const info = await page.evaluate(idx => window.renderPixiFrame(idx), f);
    if (info.particleCount > maxParticles) maxParticles = info.particleCount;
    const framePath = resolve(framesDir, `frame_${String(f).padStart(4, '0')}.png`);
    await page.screenshot({ path: framePath, type: 'png' });
    if (f === 24) {
      await page.screenshot({ path: resolve(spec.outDir, spec.png), type: 'png' });
    }
  }
  await page.close();
  if (errors.length) {
    throw new Error(`Page errors in ${spec.mode}: ${errors.join(' | ')}`);
  }

  const outMp4 = resolve(spec.outDir, spec.mp4);
  execFileSync(FFMPEG, [
    '-y', '-framerate', '24',
    '-i', resolve(framesDir, 'frame_%04d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18',
    outMp4,
  ], { stdio: 'ignore' });
  rmSync(framesDir, { recursive: true, force: true });
  console.log(`[${spec.mode}] rendered ${totalFrames} frames -> ${outMp4} (maxParticles=${maxParticles})`);
}

async function main() {
  const t0 = Date.now();
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--enable-unsafe-swiftshader',
      '--use-gl=angle',
      '--use-angle=swiftshader',
    ],
  });
  try {
    for (const spec of modes) {
      await runMode(browser, spec);
    }
  } finally {
    await browser.close();
  }
  console.log(`All 3 PixiJS suite renders complete in ${((Date.now() - t0) / 1000).toFixed(2)}s`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
