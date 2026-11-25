
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const require = createRequire('G:\\AnimationLab\\sandboxes\\pixi-suite\\package.json');
const { chromium } = require('playwright-core');
const dir = "G:\\AnimationLab\\StyleBenchmark\\styles\\pixelorama\\_px_keys";
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
await page.setContent('<html><body style="margin:0"><script>' + readFileSync("G:\\AnimationLab\\StyleBenchmark\\styles\\pixelorama\\_px_bundle.js", 'utf8') + '</script></body></html>');
for (let k = 0; k < 30; k++) {
  const t = (k / (30 - 1)) * 4.95;
  const du = await page.evaluate((tt) => window.renderPxKey(tt), t);
  writeFileSync(dir + '/k_' + String(k).padStart(3, '0') + '.png', Buffer.from(du.split(',')[1], 'base64'));
}
await browser.close();
