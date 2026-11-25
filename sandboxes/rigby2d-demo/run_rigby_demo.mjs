import http from 'node:http';
import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const require = createRequire('G:\\AnimationLab\\sandboxes\\pixi-suite\\package.json');
const { chromium } = require('playwright-core');

const ROOT = 'G:\\AnimationLab';
const SANDBOX = resolve(ROOT, 'sandboxes', 'rigby2d-demo');
const REPO = resolve(ROOT, 'character-tools', 'rigby2d');
const OUT_DIR = resolve(ROOT, 'test-outputs', '05_rigby2d');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG = process.env.FFMPEG_BIN || 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';
const ESBUILD = resolve(ROOT, 'sandboxes', 'pixi-suite', 'node_modules', '.bin', 'esbuild.cmd');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.atlas': 'text/plain; charset=utf-8',
  '.skel': 'application/octet-stream',
};

function startStaticServer() {
  return new Promise(resolvePromise => {
    const srv = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let filePath;
      if (urlPath.startsWith('/assets/')) {
        filePath = resolve(REPO, 'branding', urlPath.slice('/assets/'.length));
      } else {
        filePath = resolve(SANDBOX, urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, ''));
      }
      if (!existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not Found: ' + filePath);
        return;
      }
      const ext = extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(readFileSync(filePath));
    });
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      resolvePromise({ srv, url: `http://127.0.0.1:${addr.port}/` });
    });
  });
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(resolve(SANDBOX, 'dist'), { recursive: true });

  // 1. Check Rigby2D CLI & MCP server
  const cliHelp = spawnSync('node', [resolve(REPO, 'bin', 'rigby.js'), '--help'], { encoding: 'utf8' });
  const cliInspect = spawnSync('node', [resolve(REPO, 'bin', 'rigby.js'), 'inspect', resolve(REPO, 'branding', 'nila', 'nila.rigby')], { encoding: 'utf8' });
  const mcpHelp = spawnSync('node', [resolve(REPO, 'src', 'mcp', 'server.js'), '--help'], { encoding: 'utf8' });
  writeFileSync(resolve(OUT_DIR, 'cli_mcp_check.txt'), [
    '=== rigby.js --help (exit=' + cliHelp.status + ') ===',
    cliHelp.stdout, cliHelp.stderr,
    '=== rigby.js inspect nila.rigby (exit=' + cliInspect.status + ') ===',
    cliInspect.stdout, cliInspect.stderr,
    '=== rigby2d-mcp --help (exit=' + mcpHelp.status + ') ===',
    mcpHelp.stdout, mcpHelp.stderr,
  ].join('\n'), 'utf8');

  // 2. Bundle rigby_scene.js resolving pixi.js from pixi-suite
  execFileSync(ESBUILD, [
    resolve(SANDBOX, 'rigby_scene.js'),
    '--bundle', '--format=iife', '--target=es2020',
    `--outfile=${resolve(SANDBOX, 'dist', 'rigby_scene.bundle.js')}`,
  ], {
    cwd: SANDBOX,
    env: { ...process.env, NODE_PATH: resolve(ROOT, 'sandboxes', 'pixi-suite', 'node_modules') },
    shell: true,
    stdio: 'inherit',
  });

  // 3. Render 72 frames @ 24fps via headless Chrome
  const framesDir = resolve(SANDBOX, 'tmp_frames');
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });

  const { srv, url } = await startStaticServer();
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url, { waitUntil: 'load' });
    const info = await page.evaluate(() => window.initRigbyDemo());
    console.log('Rigby2D initialized:', JSON.stringify(info));
    writeFileSync(resolve(OUT_DIR, 'rig_inspection.json'), JSON.stringify(info, null, 2));

    for (let f = 0; f < 72; f++) {
      await page.evaluate(idx => window.renderRigbyFrame(idx, 24), f);
      const framePath = resolve(framesDir, `frame_${String(f).padStart(4, '0')}.png`);
      await page.screenshot({ path: framePath, type: 'png' });
      if (f === 24) {
        await page.screenshot({ path: resolve(OUT_DIR, 'rigby2d_frame.png'), type: 'png' });
      }
    }
    if (errors.length) throw new Error(`Page errors: ${errors.join(' | ')}`);
  } finally {
    await browser.close();
    srv.close();
  }

  const outMp4 = resolve(OUT_DIR, 'rigby2d_rig_demo.mp4');
  execFileSync(FFMPEG, [
    '-y', '-framerate', '24',
    '-i', resolve(framesDir, 'frame_%04d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18',
    outMp4,
  ], { stdio: 'ignore' });
  rmSync(framesDir, { recursive: true, force: true });
  console.log(`Rendered Rigby2D skeletal rig demo -> ${outMp4}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
