import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LAB_ROOT = 'G:\\AnimationLab';
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
  '.svg': 'image/svg+xml',
};

function parseArgs(argv) {
  const args = { frames: null, fps: 30, width: 1080, height: 1920, out: resolve(__dirname, 'out_short.mp4'), audio: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--frames') args.frames = parseInt(argv[++i], 10);
    else if (argv[i] === '--fps') args.fps = parseInt(argv[++i], 10);
    else if (argv[i] === '--out') args.out = resolve(argv[++i]);
    else if (argv[i] === '--audio') args.audio = resolve(argv[++i]);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const storyboard = JSON.parse(readFileSync(resolve(__dirname, 'storyboard.example.json'), 'utf-8'));
const totalFrames = args.frames ?? Math.round((storyboard.duration_sec || 5) * args.fps);

mkdirSync(dirname(args.out), { recursive: true });

const server = createServer((reqHttp, res) => {
  const urlPath = (reqHttp.url || '/').split('?')[0];
  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const full = resolve(__dirname, rel);
  if (!full.startsWith(resolve(__dirname)) || !existsSync(full)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(full)] || 'application/octet-stream' });
  res.end(readFileSync(full));
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const ffArgs = [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(args.fps), '-i', 'pipe:0',
];
if (args.audio && existsSync(args.audio)) {
  ffArgs.push('-i', args.audio, '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '192k', '-shortest');
} else {
  ffArgs.push('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '128k', '-shortest');
}
ffArgs.push(
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  args.out
);

const ff = spawn(FFMPEG_BIN, ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
const ffExit = new Promise((res, rej) => {
  ff.on('exit', (code) => (code === 0 ? res() : rej(new Error(`ffmpeg exited ${code}`))));
});

const browser = await chromium.launch({
  headless: true,
  executablePath: CHROME_PATH,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--use-gl=angle',
    '--use-angle=default',
    '--enable-gpu',
    '--disable-background-timer-throttling',
  ],
});

try {
  const page = await browser.newPage({ viewport: { width: args.width, height: args.height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.renderFrame === 'function');

  for (let f = 0; f < totalFrames; f++) {
    await page.evaluate(([fr, fps]) => window.renderFrame(fr, fps), [f, args.fps]);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) {
      await new Promise((r) => ff.stdin.once('drain', r));
    }
  }
  if (errors.length > 0) throw new Error(`Page errors: ${errors.join('; ')}`);
} finally {
  ff.stdin.end();
  await ffExit;
  await browser.close();
  server.close();
}

console.log(`[OK] Rendered ${totalFrames} frames @ ${args.fps}fps -> ${args.out}`);
