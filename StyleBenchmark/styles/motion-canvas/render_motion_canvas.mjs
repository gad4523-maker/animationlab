import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  BENCH_ROOT, CHROME_PATH, FFMPEG_BIN, LAB_ROOT, SFX_WAV,
  isAlreadyCompleted, verifyAndPreview,
} from '../../shared/node_render_utils.mjs';

const STYLE_ID = 'motion-canvas-procedural-kinetic';
const DIR = resolve(BENCH_ROOT, 'styles', 'motion-canvas');
const MC_DEMO_MODS = resolve(LAB_ROOT, 'sandboxes', 'motion-canvas-demo', 'node_modules');
const require = createRequire(resolve(LAB_ROOT, 'sandboxes', 'pixi-suite', 'package.json'));
const { chromium } = require('playwright-core');

async function main() {
  process.chdir(DIR);
  if (isAlreadyCompleted(STYLE_ID)) {
    console.log(`[SKIP] ${STYLE_ID} already completed`);
    return;
  }

  rmSync(resolve(DIR, 'output'), { recursive: true, force: true });

  // Symlink / junction node_modules to sandboxes/motion-canvas-demo/node_modules if missing
  const nm = resolve(DIR, 'node_modules');
  if (!existsSync(nm)) {
    execFileSync('cmd', ['/c', 'mklink', '/J', nm, MC_DEMO_MODS], { stdio: 'inherit' });
  }

  const server = await createServer({
    root: DIR,
    configFile: resolve(DIR, 'vite.config.ts'),
    server: { port: 0, strictPort: false },
  });
  await server.listen();
  const port = server.httpServer.address().port;
  const url = `http://localhost:${port}`;
  console.log(`Motion Canvas Vite listening at ${url}`);

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#render', { state: 'attached', timeout: 30000 });
    const isVis = await page.locator('#render').isVisible().catch(() => false);
    if (!isVis) {
      await page.click('#rendering-tab').catch(() => {});
      await page.waitForSelector('#render', { state: 'visible', timeout: 15000 });
    }
    await page.click('#render');

    const seqDir = resolve(DIR, 'output', 'project');
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      const cnt = existsSync(seqDir)
        ? readdirSync(seqDir).filter((f) => f.endsWith('.png')).length
        : 0;
      const busy = await page.getAttribute('#render', 'data-rendering').catch(() => null);
      if (cnt >= 150 && busy !== 'true') break;
      await page.waitForTimeout(500);
    }
  } finally {
    await browser.close();
    await server.close();
  }

  const seqDir = resolve(DIR, 'output', 'project');
  const pngs = existsSync(seqDir) ? readdirSync(seqDir).filter((f) => f.endsWith('.png')).sort() : [];
  if (pngs.length === 0) throw new Error('Motion Canvas produced 0 frames');
  console.log(`Motion Canvas produced ${pngs.length} frames`);

  const outMp4 = resolve(BENCH_ROOT, 'videos', `${STYLE_ID}.mp4`);
  execFileSync(FFMPEG_BIN, [
    '-y', '-loglevel', 'error',
    '-framerate', '30', '-i', resolve(seqDir, '%06d.png'),
    '-i', SFX_WAV,
    '-map', '0:v:0', '-map', '1:a:0',
    '-vf', 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=#090e20',
    '-t', '5.0',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart',
    outMp4,
  ], { stdio: 'inherit' });
  verifyAndPreview(STYLE_ID);
}

main().catch((e) => { console.error(e); process.exit(1); });
