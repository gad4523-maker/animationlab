import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  BENCH_ROOT, CHROME_PATH, FPS, H, LAB_ROOT, TOTAL_FRAMES, W,
  createFfmpegPipe, isAlreadyCompleted, readManifest, verifyAndPreview,
} from '../../shared/node_render_utils.mjs';

const require = createRequire(resolve(LAB_ROOT, 'sandboxes', 'pixi-suite', 'package.json'));
const { chromium } = require('playwright-core');
const ESBUILD = resolve(LAB_ROOT, 'sandboxes', 'pixi-suite', 'node_modules', '.bin', 'esbuild.cmd');
const DIR = resolve(BENCH_ROOT, 'styles', 'huashu');

async function main() {
  const manifest = readManifest();
  const styles = manifest.styles.filter((s) => s.source_repo === 'Huashu Art Motion');
  const todo = styles.filter((s) => !isAlreadyCompleted(s.id));
  console.log(`Huashu Art Motion: ${todo.length}/${styles.length} styles pending.`);
  if (todo.length === 0) return;

  mkdirSync(resolve(DIR, 'dist'), { recursive: true });
  const bundlePath = resolve(DIR, 'dist', 'huashu_batch.bundle.js');
  execFileSync(ESBUILD, [
    resolve(DIR, 'huashu_styles_engine.js'),
    '--bundle', '--format=iife', '--target=es2020',
    `--outfile=${bundlePath}`,
  ], { shell: true, stdio: 'inherit' });

  const bundleCode = readFileSync(bundlePath, 'utf8');
  const BATCH_SIZE = 20;
  for (let start = 0; start < todo.length; start += BATCH_SIZE) {
    const chunk = todo.slice(start, start + BATCH_SIZE);
    const browser = await chromium.launch({
      headless: true,
      executablePath: CHROME_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-gpu', '--ignore-gpu-blocklist'],
    });
    try {
      const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
      await page.setContent(`<html><body style="margin:0;background:#000"><script>${bundleCode}</script></body></html>`);
      for (const s of chunk) {
        console.log(`=== Rendering Huashu: ${s.id} ===`);
        const outMp4 = resolve(BENCH_ROOT, 'videos', `${s.id}.mp4`);
        const pipe = createFfmpegPipe(outMp4, 'mjpeg');
        for (let f = 0; f < TOTAL_FRAMES; f++) {
          const du = await page.evaluate(([slug, name, t]) => window.renderHuashuStyle(slug, name, t), [s.slug, s.name, f / FPS]);
          await pipe.writeFrame(Buffer.from(du.split(',')[1], 'base64'));
        }
        await pipe.finish();
        verifyAndPreview(s.id);
      }
    } finally {
      await browser.close();
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
