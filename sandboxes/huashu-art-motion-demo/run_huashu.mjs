import http from 'node:http';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const require = createRequire('G:\\AnimationLab\\sandboxes\\pixi-suite\\package.json');
const { chromium } = require('playwright-core');

const SANDBOX = 'G:\\AnimationLab\\sandboxes\\huashu-art-motion-demo';
const ENGINE = resolve(SANDBOX, 'engine');
const OUT_DIR = 'G:\\AnimationLab\\test-outputs\\02_huashu-art-motion';
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG = process.env.FFMPEG_BIN || 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

function startServer() {
  return new Promise(resPromise => {
    const srv = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
      const full = resolve(ENGINE, rel);
      if (!full.startsWith(ENGINE) || !existsSync(full)) {
        res.writeHead(404);
        res.end('404');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[extname(full).toLowerCase()] || 'application/octet-stream' });
      res.end(readFileSync(full));
    });
    srv.listen(0, '127.0.0.1', () => resPromise({ srv, port: srv.address().port }));
  });
}

async function main() {
  const framesDir = resolve(SANDBOX, 'tmp_frames');
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const { srv, port } = await startServer();
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-gpu', '--ignore-gpu-blocklist'],
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${port}/index.html?film=anime_test&w=1280&h=720`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__ready === true || window.__bootFailed, { timeout: 30000 });
    const bootFail = await page.evaluate(() => window.__bootFailed || null);
    if (bootFail) throw new Error('Huashu boot failed: ' + bootFail);

    const totalSec = await page.evaluate(() => window.__total);
    const fps = 24;
    const totalFrames = Math.round(totalSec * fps);
    console.log(`Huashu engine ready: total=${totalSec}s (${totalFrames} frames @ ${fps}fps)`);

    await page.evaluate(() => document.body.classList.add('render'));
    const snapMap = {
      16: resolve(OUT_DIR, 'huashu_ghibli.png'),
      50: resolve(OUT_DIR, 'huashu_shinkai.png'),
      84: resolve(OUT_DIR, 'huashu_8bit.png'),
    };

    for (let f = 0; f < totalFrames; f++) {
      const t = f / fps;
      await page.evaluate(async time => {
        await window.prepare(time);
        window.renderFrame(time);
      }, t);
      const outFrame = resolve(framesDir, `frame_${String(f).padStart(4, '0')}.png`);
      await page.screenshot({ path: outFrame, type: 'png' });
      if (snapMap[f]) {
        await page.screenshot({ path: snapMap[f], type: 'png' });
      }
    }
    if (errors.length) throw new Error('Page errors: ' + errors.join(' | '));
  } finally {
    await browser.close();
    srv.close();
  }

  const outMp4 = resolve(OUT_DIR, 'huashu_demo.mp4');
  execFileSync(FFMPEG, [
    '-y', '-framerate', '24',
    '-i', resolve(framesDir, 'frame_%04d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18',
    outMp4,
  ], { stdio: 'ignore' });
  rmSync(framesDir, { recursive: true, force: true });
  console.log(`Rendered Huashu Art Motion demo -> ${outMp4}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
