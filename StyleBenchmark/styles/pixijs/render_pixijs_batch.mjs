import http from 'node:http';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import {
  BENCH_ROOT, CHROME_PATH, FPS, H, LAB_ROOT, TOTAL_FRAMES, W,
  createFfmpegPipe, isAlreadyCompleted, verifyAndPreview,
} from '../../shared/node_render_utils.mjs';

const require = createRequire(resolve(LAB_ROOT, 'sandboxes', 'pixi-suite', 'package.json'));
const { chromium } = require('playwright-core');
const ESBUILD = resolve(LAB_ROOT, 'sandboxes', 'pixi-suite', 'node_modules', '.bin', 'esbuild.cmd');
const DIR = resolve(BENCH_ROOT, 'styles', 'pixijs');
const STYLES = ['pixijs-neon-bloom-vfx', 'pixijs-crt-glitch-arcade', 'pixijs-crosshatch-film'];

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8' };

function startServer() {
  return new Promise((resPromise) => {
    const srv = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const full = resolve(DIR, urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, ''));
      if (!existsSync(full)) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'Content-Type': MIME[extname(full).toLowerCase()] || 'application/octet-stream' });
      res.end(readFileSync(full));
    });
    srv.listen(0, '127.0.0.1', () => resPromise({ srv, port: srv.address().port }));
  });
}

async function main() {
  const todo = STYLES.filter((s) => !isAlreadyCompleted(s));
  if (todo.length === 0) {
    console.log('[SKIP] All PixiJS styles already completed');
    return;
  }
  mkdirSync(resolve(DIR, 'dist'), { recursive: true });
  execFileSync(ESBUILD, [
    resolve(DIR, 'pixijs_goku.js'),
    '--bundle', '--format=iife', '--target=es2020',
    `--outfile=${resolve(DIR, 'dist', 'pixijs_goku.bundle.js')}`,
  ], {
    cwd: DIR,
    env: { ...process.env, NODE_PATH: resolve(LAB_ROOT, 'sandboxes', 'pixi-suite', 'node_modules') },
    shell: true,
    stdio: 'inherit',
  });

  const { srv, port } = await startServer();
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-gpu', '--ignore-gpu-blocklist'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
    for (const styleId of todo) {
      console.log(`=== Rendering PixiJS style: ${styleId} ===`);
      await page.evaluate((m) => window.initPixiGoku(m), styleId);
      const outMp4 = resolve(BENCH_ROOT, 'videos', `${styleId}.mp4`);
      const pipe = createFfmpegPipe(outMp4, 'mjpeg');
      for (let f = 0; f < TOTAL_FRAMES; f++) {
        const du = await page.evaluate((t) => window.renderPixiFrame(t), f / FPS);
        const buf = Buffer.from(du.split(',')[1], 'base64');
        await pipe.writeFrame(buf);
      }
      await pipe.finish();
      verifyAndPreview(styleId);
    }
  } finally {
    await browser.close();
    srv.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
