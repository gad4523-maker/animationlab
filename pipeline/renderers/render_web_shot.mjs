// Deterministic Playwright hardware-ANGLE renderer for web3d & anime2d pipeline shots.
// Pipes high-quality JPEG q96 frames (mjpeg) into FFmpeg x264 CRF 12 intermediate encode (~17-21 fps @ 1080x1920),
// attaches stdin EPIPE error handlers, and fails fast immediately on any pageerror or __SHOT_ERR.

import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PIPELINE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LAB_ROOT = resolve(PIPELINE_ROOT, '..');
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG_BIN = process.env.FFMPEG_BIN || 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';

const req = createRequire(resolve(LAB_ROOT, 'sandboxes', 'pixi-suite', 'package.json'));
const { chromium } = req('playwright-core');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.vrm': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
};

function safeResolveUnder(baseDir, relPath) {
  const full = resolve(baseDir, relPath);
  const normBase = normalize(baseDir).toLowerCase() + sep;
  const normFull = normalize(full).toLowerCase();
  if (!normFull.startsWith(normBase)) return null;
  return full;
}

function parseArgs(argv) {
  const o = { episodeDir: '', modulePath: '', out: '', metrics: '', w: 1080, h: 1920, fps: 30, frames: 90, shot: '{}', params: '{}' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--episode-dir') o.episodeDir = resolve(argv[++i]);
    else if (k === '--module') o.modulePath = resolve(argv[++i]);
    else if (k === '--out') o.out = resolve(argv[++i]);
    else if (k === '--metrics') o.metrics = resolve(argv[++i]);
    else if (k === '--w') o.w = parseInt(argv[++i], 10);
    else if (k === '--h') o.h = parseInt(argv[++i], 10);
    else if (k === '--fps') o.fps = parseInt(argv[++i], 10);
    else if (k === '--frames') o.frames = parseInt(argv[++i], 10);
    else if (k === '--shot') o.shot = argv[++i];
    else if (k === '--params') o.params = argv[++i];
  }
  return o;
}

const args = parseArgs(process.argv.slice(2));
mkdirSync(dirname(args.out), { recursive: true });

const server = createServer((reqHttp, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent((reqHttp.url || '/').split('?')[0]);
  } catch {
    res.writeHead(400);
    res.end('Invalid request path');
    return;
  }
  if (urlPath === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }
  let full = null;
  if (urlPath.startsWith('/pipeline/')) {
    full = safeResolveUnder(PIPELINE_ROOT, urlPath.slice('/pipeline/'.length));
  } else if (urlPath.startsWith('/episode/')) {
    full = safeResolveUnder(args.episodeDir, urlPath.slice('/episode/'.length));
  }
  if (!full || !existsSync(full) || statSync(full).isDirectory()) {
    console.error(`[HTTP 404] ${urlPath} -> ${full}`);
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(full).toLowerCase()] || 'application/octet-stream' });
  res.end(readFileSync(full));
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const normMod = normalize(args.modulePath);
const modUrl = normMod.toLowerCase().startsWith(PIPELINE_ROOT.toLowerCase() + sep)
  ? '/pipeline/' + relative(PIPELINE_ROOT, normMod).replace(/\\/g, '/')
  : '/episode/' + relative(args.episodeDir, normMod).replace(/\\/g, '/');

const ff = spawn(FFMPEG_BIN, [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(args.fps), '-i', 'pipe:0',
  '-vf', 'scale=in_color_matrix=bt601:out_color_matrix=bt709:in_range=full:out_range=tv,format=yuv420p,setsar=1,setparams=range=limited:color_primaries=bt709:color_trc=bt709:colorspace=bt709',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-pix_fmt', 'yuv420p',
  '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  args.out,
], { stdio: ['pipe', 'inherit', 'inherit'] });

let ffPipeErr = null;
ff.stdin.on('error', (err) => { ffPipeErr = err; });
const ffExit = new Promise((res, rej) => {
  ff.once('error', rej);
  ff.on('exit', (c) => (c === 0 ? res() : rej(new Error(`FFmpeg exited ${c}`))));
});

ffExit.catch(() => {});

const angleMode = process.env.PIPE_ANGLE || 'default';
let browser;
const launchOptions = {
  headless: true,
  executablePath: CHROME_PATH,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--use-gl=angle',
    `--use-angle=${angleMode}`,
    '--enable-gpu',
    '--ignore-gpu-blocklist',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
  ],
};

const t0 = performance.now();
let peakRssMb = 0;
let renderErr = null;

try {
  browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: args.w, height: args.h }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`CONSOLE_ERR: ${m.text()}`);
  });

  const url = `http://127.0.0.1:${port}/pipeline/renderers/shot_harness.html` +
    `?module=${encodeURIComponent(modUrl)}&w=${args.w}&h=${args.h}&fps=${args.fps}` +
    `&shot=${encodeURIComponent(args.shot)}&params=${encodeURIComponent(args.params)}`;

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__SHOT_READY === true || Boolean(window.__SHOT_ERR), { timeout: 20000 });
  const initErr = await page.evaluate(() => window.__SHOT_ERR || null);
  if (initErr) throw new Error(`SHOT_INIT_ERR: ${initErr}`);

  for (let f = 0; f < args.frames; f++) {
    if (ffPipeErr) throw ffPipeErr;
    await page.evaluate((idx) => window.renderFrame(idx), f);
    if (errors.length > 0) throw new Error(errors.join(' | '));
    const buf = await page.screenshot({ type: 'jpeg', quality: 96 });
    if (!ff.stdin.write(buf)) {
      await Promise.race([
        new Promise((r) => ff.stdin.once('drain', r)),
        ffExit.then(() => { throw new Error('FFmpeg closed input before the final frame'); }),
      ]);
    }
    if (f % 30 === 0) {
      const rss = process.memoryUsage().rss / 1048576;
      if (rss > peakRssMb) peakRssMb = rss;
    }
  }
} catch (err) {
  renderErr = err;
} finally {
  try { ff.stdin.end(); } catch {}
  try { await ffExit; } catch (e) { if (!renderErr) renderErr = e; }
  await browser?.close();
  server.close();
}

if (renderErr) throw renderErr;

const elapsedSec = (performance.now() - t0) / 1000;
const metrics = {
  frames: args.frames,
  fps: args.fps,
  resolution: `${args.w}x${args.h}`,
  render_sec: Number(elapsedSec.toFixed(3)),
  render_fps: Number((args.frames / Math.max(0.001, elapsedSec)).toFixed(2)),
  node_peak_rss_mb: Number(peakRssMb.toFixed(1)),
  file_bytes: statSync(args.out).size,
};
if (args.metrics) {
  writeFileSync(args.metrics, JSON.stringify(metrics, null, 2), 'utf-8');
}
console.log(`[WEB_SHOT OK] ${args.frames}f ${args.w}x${args.h} in ${metrics.render_sec}s (${metrics.render_fps} fps) -> ${args.out}`);

