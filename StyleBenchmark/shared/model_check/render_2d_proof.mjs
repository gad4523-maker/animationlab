import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BENCH_ROOT, CHROME_PATH, LAB_ROOT } from '../node_render_utils.mjs';

const require = createRequire(resolve(LAB_ROOT, 'sandboxes', 'pixi-suite', 'package.json'));
const { chromium } = require('playwright-core');
const ESBUILD = resolve(LAB_ROOT, 'sandboxes', 'pixi-suite', 'node_modules', '.bin', 'esbuild.cmd');
const CHECK_DIR = resolve(BENCH_ROOT, 'shared', 'model_check');

async function main() {
  mkdirSync(CHECK_DIR, { recursive: true });
  const entryJs = resolve(CHECK_DIR, '_proof2d_entry.js');
  writeFileSync(entryJs, `
    import { solveChoreography } from '../choreography.js';
    import { drawGoku2DMaster } from '../goku_2d_master.js';
    window.render2DPanel = (t, overrideSSJ, zoomBoost) => {
      let c = document.getElementById('c');
      if (!c) {
        c = document.createElement('canvas');
        c.id = 'c';
        c.width = 720;
        c.height = 640;
        document.body.appendChild(c);
      }
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, 720, 640);
      const ch = solveChoreography(t);
      if (overrideSSJ !== null) ch.ssj = overrideSSJ;
      ctx.save();
      if (zoomBoost) {
        ch.camDist *= 0.45;
        ch.camY += 0.36;
        ctx.translate(0, -290);
        drawGoku2DMaster(ctx, ch, 720, 1280);
      } else {
        // Render full 720x1280 portrait scaled cleanly into 720x640 (centered) so full boots->hair silhouette is visible!
        ctx.fillStyle = '#091020';
        ctx.fillRect(0, 0, 720, 640);
        ctx.translate(180, 0);
        ctx.scale(0.5, 0.5);
        drawGoku2DMaster(ctx, ch, 720, 1280);
      }
      ctx.restore();
      return c.toDataURL('image/png');
    };
  `, 'utf8');

  const bundleJs = resolve(CHECK_DIR, '_proof2d.bundle.js');
  execFileSync(ESBUILD, [entryJs, '--bundle', '--format=iife', `--outfile=${bundleJs}`], { shell: true, stdio: 'inherit' });

  const browser = await chromium.launch({ headless: true, executablePath: CHROME_PATH, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 720, height: 640 } });
    await page.setContent(`<html><body style="margin:0"><script>${readFileSync(bundleJs, 'utf8')}</script></body></html>`);

    const panels = [
      ['_2d_1_base.png', 0.30, 0.0, false],
      ['_2d_2_charge.png', 2.20, 0.0, false],
      ['_2d_3_ssj_full.png', 3.10, null, false],
      ['_2d_4_ssj_closeup.png', 4.20, 1.0, true],
    ];
    for (const [fn, t, ssj, zb] of panels) {
      const dataUrl = await page.evaluate(([tt, ss, zz]) => window.render2DPanel(tt, ss, zz), [t, ssj, zb]);
      const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
      writeFileSync(resolve(CHECK_DIR, fn), buf);
    }
  } finally {
    await browser.close();
  }

  // Stitch 1440x1280 4-panel sheet using Python PIL
  execFileSync('G:\\AnimationLab\\envs\\manimgl\\Scripts\\python.exe', ['-c', `
from pathlib import Path
from PIL import Image, ImageDraw
d = Path(r'${CHECK_DIR.replace(/\\/g, '\\\\')}')
items = [
    ('_2d_1_base.png', '1. Base Goku 2D (t=0.3s)'),
    ('_2d_2_charge.png', '2. Charge Roar 2D (t=2.2s)'),
    ('_2d_3_ssj_full.png', '3. Super Saiyan 2D Full (t=3.1s)'),
    ('_2d_4_ssj_closeup.png', '4. SSJ 2D Close-Up Face & Hair'),
]
sheet = Image.new('RGB', (1440, 1280))
for idx, (fn, lbl) in enumerate(items):
    im = Image.open(d / fn).convert('RGB')
    dr = ImageDraw.Draw(im)
    dr.rectangle([8, 8, 340, 38], fill=(10, 12, 22))
    dr.text((16, 16), lbl, fill=(255, 228, 80))
    sheet.paste(im, ((idx % 2) * 720, (idx // 2) * 640))
sheet.save(d / 'goku_2d_sheet.png')
print('Stitched goku_2d_sheet.png')
  `], { stdio: 'inherit' });
}

main().catch((e) => { console.error(e); process.exit(1); });
