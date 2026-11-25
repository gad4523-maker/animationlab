import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const require = createRequire('G:\\AnimationLab\\sandboxes\\pixi-suite\\package.json');
const { chromium } = require('playwright-core');

const DEMO_DIR = 'G:\\AnimationLab\\sandboxes\\motion-canvas-demo';
const OUT_DIR = 'G:\\AnimationLab\\test-outputs\\15_motion-canvas';
const RENDER_SEQ_DIR = resolve(DEMO_DIR, 'output', 'project');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG = process.env.FFMPEG_BIN || 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';

async function main() {
  rmSync(resolve(DEMO_DIR, 'output'), { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const server = await createServer({
    root: DEMO_DIR,
    configFile: resolve(DEMO_DIR, 'vite.config.ts'),
    server: { port: 0, strictPort: false },
  });
  await server.listen();
  const address = server.httpServer.address();
  const url = `http://localhost:${address.port}`;
  console.log(`Motion Canvas Vite server listening at ${url}`);

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('#render', { timeout: 30000 });
    await page.click('#render');
    await page.waitForSelector('#render[data-rendering="true"]', { timeout: 10000 }).catch(() => {});
    await page.waitForSelector('#render:not([data-rendering="true"])', { timeout: 90000 });
    if (errors.length) throw new Error(`Page errors: ${errors.join(' | ')}`);
  } finally {
    await browser.close();
    await server.close();
  }

  const pngs = readdirSync(RENDER_SEQ_DIR).filter(f => f.endsWith('.png')).sort();
  console.log(`Motion Canvas exported ${pngs.length} PNG frames in ${RENDER_SEQ_DIR}`);
  if (pngs.length === 0) throw new Error('No PNG frames exported by Motion Canvas');

  const midFrame = pngs[Math.floor(pngs.length * 0.65)];
  copyFileSync(resolve(RENDER_SEQ_DIR, midFrame), resolve(OUT_DIR, 'motion_canvas_frame.png'));

  const outMp4 = resolve(OUT_DIR, 'motion_canvas_demo.mp4');
  execFileSync(FFMPEG, [
    '-y', '-framerate', '30',
    '-i', resolve(RENDER_SEQ_DIR, '%06d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18',
    outMp4,
  ], { stdio: 'ignore' });
  console.log(`Encoded ${outMp4}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
