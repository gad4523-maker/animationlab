import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const probeDir = 'G:\\AnimationLab\\sandboxes\\pixi-suite\\official-compat-probe';
const outLog = 'G:\\AnimationLab\\test-outputs\\08_pixijs-particle-emitter\\official_v8_compat_test.log';
mkdirSync(probeDir, { recursive: true });
mkdirSync('G:\\AnimationLab\\test-outputs\\08_pixijs-particle-emitter', { recursive: true });

writeFileSync(resolve(probeDir, 'package.json'), JSON.stringify({
  name: 'official-pixi8-compat-probe',
  private: true,
  type: 'module',
  dependencies: {
    'pixi.js': '8.23.0',
    '@pixi/particle-emitter': '5.0.10',
  },
}, null, 2));

const logLines = [];
logLines.push('=== 1. NPM INSTALL STRICT PEER-DEP TEST (pixi.js@8.23.0 + @pixi/particle-emitter@5.0.10) ===');
const npmStrict = spawnSync('npm.cmd', ['install', '--no-audit', '--no-fund'], {
  cwd: probeDir,
  encoding: 'utf8',
  shell: true,
});
logLines.push(`exitCode: ${npmStrict.status}`);
logLines.push(npmStrict.stdout || '');
logLines.push(npmStrict.stderr || '');

logLines.push('\n=== 2. FORCE-INSTALL + RUNTIME/BUNDLE INSTANTIATION TEST ===');
const npmForce = spawnSync('npm.cmd', ['install', '--legacy-peer-deps', '--no-audit', '--no-fund'], {
  cwd: probeDir,
  encoding: 'utf8',
  shell: true,
});
logLines.push(`legacy-peer-deps exitCode: ${npmForce.status}`);

writeFileSync(resolve(probeDir, 'test_official.mjs'), `
import * as PIXI from 'pixi.js';
import { Emitter, upgradeConfig } from '@pixi/particle-emitter';

console.log('Loaded PIXI keys sample:', Object.keys(PIXI).slice(0, 10).join(','));
console.log('PIXI.ParticleContainer exists?', typeof PIXI.ParticleContainer);
const c = new PIXI.Container();
try {
  const cfg = upgradeConfig({
    alpha: { start: 1, end: 0 },
    scale: { start: 1, end: 0.2 },
    speed: { start: 100, end: 20 },
    lifetime: { min: 0.3, max: 0.8 },
    frequency: 0.05,
    maxParticles: 50,
    pos: { x: 0, y: 0 },
  }, [PIXI.Texture.WHITE]);
  const emitter = new Emitter(c, cfg);
  emitter.emit = true;
  emitter.update(0.016);
  console.log('UNEXPECTED_SUCCESS particleCount=', emitter.particleCount);
} catch (err) {
  console.error('RUNTIME_FAILURE:', err.stack || err.message);
  process.exit(2);
}
`);

const esbuildBin = 'G:\\AnimationLab\\sandboxes\\pixi-suite\\node_modules\\.bin\\esbuild.cmd';
const bundleRes = spawnSync(esbuildBin, [
  resolve(probeDir, 'test_official.mjs'),
  '--bundle', '--platform=browser', '--format=esm',
  `--outfile=${resolve(probeDir, 'bundle.mjs')}`,
], { cwd: probeDir, encoding: 'utf8', shell: true });
logLines.push(`esbuild bundle exitCode: ${bundleRes.status}`);
logLines.push(bundleRes.stdout || '');
logLines.push(bundleRes.stderr || '');

// Also check direct Node execution (import resolution of @pixi/core / @pixi/sprite)
const nodeRes = spawnSync('node', [resolve(probeDir, 'test_official.mjs')], {
  cwd: probeDir,
  encoding: 'utf8',
});
logLines.push(`node direct execution exitCode: ${nodeRes.status}`);
logLines.push(nodeRes.stdout || '');
logLines.push(nodeRes.stderr || '');

writeFileSync(outLog, logLines.join('\n'), 'utf8');
console.log(`Wrote compatibility test log -> ${outLog}`);
