# PixiJS 8 Particle Emitter Compatibility Investigation

**Date:** 2026-11-22  
**Tested Environment:** Windows 11 Pro (x64), Node.js v24.12.0, npm 11.4.2, `pixi.js@8.23.0`  
**Official Repo Cloned:** `https://github.com/pixijs-userland/particle-emitter` (`G:\AnimationLab\godot-and-vfx\pixijs-particle-emitter`, commit `0fffdd9`, npm `@pixi/particle-emitter@5.0.10`)  
**Previous Pipeline Package (`independent_animation_pipeline_v0.2.1_verified.zip`):** `@barvynkoa/particle-emitter@0.0.1` (`https://github.com/andriibarvynko/particle-emitter`, compiled header `v6.0.0`)

---

## 1. Executive Verdict

- **Official `@pixi/particle-emitter@5.0.10` (`pixijs-userland/particle-emitter`)**: **BLOCKED / INCOMPATIBLE** with PixiJS 8 (`pixi.js@8.23.0`).
- **Community Port `@barvynkoa/particle-emitter@0.0.1` (from previous pipeline)**: **WORKING** cleanly on PixiJS 8 (`pixi.js@8.23.0`) with zero bundling or runtime errors.

---

## 2. Root-Cause Comparison

| Dimension | Official `@pixi/particle-emitter` (`5.0.10`) | Community Port `@barvynkoa/particle-emitter` (`0.0.1` / v6.0.0) |
|---|---|---|
| **npm `peerDependencies`** | `@pixi/constants`, `@pixi/core`, `@pixi/display`, `@pixi/math`, `@pixi/sprite`, `@pixi/ticker` all constrained to `>=6.0.4 <8.0.0` | `"pixi.js": ">=6.0.4 <9.0.0"` (supports v6, v7, and v8) |
| **Module Import Architecture** | Imports split PixiJS v6/v7 packages (`import { Texture } from '@pixi/core'`, `import { Sprite } from '@pixi/sprite'`, `import { Container, DisplayObject } from '@pixi/display'`, etc.) | Imports unified PixiJS v8 package (`import { Texture, Point, Sprite, Ticker } from 'pixi.js'`) |
| **PixiJS 8 Compatibility** | **Broken.** PixiJS 8 eliminated the split `@pixi/*` packages and removed `DisplayObject`, `BaseTexture`, and legacy `ParticleContainer` signatures. | **Compatible.** Works directly with `pixi.js@8.23.0` `Container` and WebGL/WebGPU renderers. |
| **Bundling (`esbuild`)** | Fails with 6 unresolved module errors (`@pixi/core`, `@pixi/constants`, `@pixi/sprite`, `@pixi/math`, `@pixi/ticker`, `@pixi/display`). | Bundles cleanly (`dist/pixi_demos.bundle.js` in 1.09s). |
| **Node Direct Import** | Throws `Error: Cannot find module '@pixi/core'`. | Resolves cleanly against `pixi.js@8.23.0`. |
| **Live Render Test on PixiJS 8.23.0** | Cannot instantiate `Emitter`. | Rendered 48 frames @ 1280×720, 24fps (`particle_emitter_demo.mp4`), peak active particles = 85. |

---

## 3. Observed Failure Evidence (Official Package Probe)

Test harness: `G:\AnimationLab\sandboxes\pixi-suite\test_official_v8_compat.mjs`  
Full captured log: `G:\AnimationLab\test-outputs\08_pixijs-particle-emitter\official_v8_compat_test.log`

1. Installing `@pixi/particle-emitter@5.0.10` alongside `pixi.js@8.23.0` leaves `node_modules/@pixi/` with only `particle-emitter` (none of `@pixi/core`, `@pixi/sprite`, `@pixi/display`, `@pixi/math`, `@pixi/ticker`, `@pixi/constants` exist in PixiJS 8).
2. `esbuild` fails with 6 errors:
   - `Could not resolve "@pixi/core"` (`lib/particle-emitter.es.js:8`)
   - `Could not resolve "@pixi/constants"` (`lib/particle-emitter.es.js:9`)
   - `Could not resolve "@pixi/sprite"` (`lib/particle-emitter.es.js:10`)
   - `Could not resolve "@pixi/math"` (`lib/particle-emitter.es.js:11`)
   - `Could not resolve "@pixi/ticker"` (`lib/particle-emitter.es.js:12`)
   - `Could not resolve "@pixi/display"` (`lib/particle-emitter.es.js:13`)
3. Direct Node.js execution fails with `Error: Cannot find module '@pixi/core'`.

---

## 4. Observed Working Evidence (`@barvynkoa/particle-emitter@0.0.1`)

- Tested in `G:\AnimationLab\sandboxes\pixi-suite\pixi_demos.js` (`mode: 'particles'`) with `pixi.js@8.23.0`.
- Uses `upgradeConfig(oldConfig, [sparkTex])` and `new Emitter(state.particleLayer, v3Config)` with `emitter.updateOwnerPos(...)` and deterministic `emitter.update(1 / fps)`.
- **Important PixiJS 8 Texture Caveat**: In PixiJS 8, `Texture.WHITE` changed from `16×16` (v7) to `1×1` px, which makes default `Texture.WHITE` particles nearly invisible sub-pixel dots unless scaled up or replaced. Generating a custom `16×16` soft radial spark texture via `app.renderer.generateTexture(...)` produces crisp glowing anime aura particles.
- Verified output: `G:\AnimationLab\test-outputs\08_pixijs-particle-emitter\particle_emitter_demo.mp4` (1280×720, H.264, 24fps, 48 frames, 398,502 bytes) and `particle_emitter_frame.png`.

---

## 5. Production Recommendation

Retain **`@barvynkoa/particle-emitter@0.0.1`** (or vendor/fork it internally under MIT license) for any PixiJS 8 pipeline, or use **Godot 4.7.2 `GPUParticles2D`** / **PixiJS 8 native `ParticleContainer`** if zero third-party emitter maintenance risk is desired. Do **not** upgrade or switch back to upstream `@pixi/particle-emitter@5.0.10` while targeting PixiJS 8.
