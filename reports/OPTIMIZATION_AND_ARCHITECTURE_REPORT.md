# AnimationLab — Optimization, Cleanup & Production Architecture Report

**Workspace:** `G:\AnimationLab`  
**Audit Date:** 2026-11-25  
**Target Output:** 50–60s cinematic YouTube Shorts (`1080×1920` / `720×1280` @ 30 fps H.264, no AI-generated images/video)  
**Host Hardware:** Intel Core i5-12400F, 15.84 GB RAM (`~2.2 GB` headroom under desktop load), NVIDIA RTX 4060 8 GB (CUDA 12.8), Windows 11 Pro

---

## 1. Complete Inventory of Original `G:\AnimationLab` (`32.17 GiB`)

| Original Directory | Original Size | Contents / Role |
|---|---:|---|
| `envs\` | `16,289.40 MB` | 4 Python 3.11 venvs: `whisperx` (`8,083.74 MB`), `depth-anything-v2` (`7,506.21 MB`), `manimgl` (`502.46 MB`), `pyscenedetect` (`196.99 MB`) |
| `.cache\` | `4,693.06 MB` | `wheels` (`3,312.72 MB` cu128 wheels), `npm` (`459.69 MB`), `pip` (`305.78 MB`), `torch` (`360.17 MB`), `tmp` (`177.58 MB`), `nltk_data` (`63.28 MB`), `uv` (`10.96 MB`), `huggingface` (`2.57 MB`), `manim` (`0.10 MB`), PNG tests (`0.20 MB`) |
| `Senku - Genius Who Rebuilt Civilization\` | `4,225.85 MB` | User project (`1,800` PNG `frames\` = `3,909.10 MB`, `work\` = `160.17 MB`, `deliverables\` = `66.68 MB`, `stills\`, `audio\`) |
| `StyleBenchmark\` | `1,901.18 MB` | 216 rendered Goku SSJ MP4s (`957.61 MB`), `styles\` (`927.39 MB`, incl. `.cache`/`output`/`.vite` build artifacts), `previews\` (`10.09 MB`), `shared\` (`5.77 MB`), `gallery\` (`0.16 MB`) |
| `sandboxes\` | `1,132.08 MB` | 13 runnable Node/Python/Godot demos + `shared-media` (incl. `remotion-demo` `478.97 MB`, `anidoodle-demo` `304.27 MB`, `pixi-suite` `198.71 MB` w/ `86.00 MB` `official-compat-probe`, `motion-canvas-demo` `121.80 MB`) |
| `Gravity Short\` | `1,004.32 MB` | User project (`work\` `601.76 MB`, `deliverables\` `264.91 MB`, `editing\` `82.03 MB`, `audio\` `47.79 MB`, `vendor\three.module.min.js`) |
| `engines\` | `937.02 MB` | Upstream git clones: `remotion` (`859.81 MB`), `pixijs` (`67.15 MB`), `motion-canvas` (`5.53 MB`), `manim` (`4.52 MB`) |
| `models\` | `558.20 MB` | `whisperx\faster-whisper-small.en` (`463.58 MB`), `depth-anything-v2\depth_anything_v2_vits.pth` (`94.62 MB`) |
| `godot-and-vfx\` | `519.16 MB` | Upstream clones: `godot-demo-projects` (`516.09 MB`), `pixijs-filters` (`2.33 MB`), `pixijs-particle-emitter` (`0.73 MB`) |
| `experimental\` | `514.90 MB` | Style & engine repos: `lemo-opuscar` (`283.28 MB`), `huashu-art-motion` (`142.01 MB`), `anidoodle` (`89.62 MB`) |
| `character-tools\` | `368.90 MB` | `rhubarb-lip-sync` source (`219.62 MB`), `rigby2d` (`132.22 MB`), `pixelorama` (`17.05 MB`) |
| `Chakra Short\` | `360.85 MB` | User project (`Chakra - complete project.zip`, `What If You Woke Up With Chakra.mp4`, `@napi-rs/canvas`) |
| `ai-and-depth\` | `256.06 MB` | `pyscenedetect` (`113.36 MB`), `depth-anything-v2` (`108.68 MB`), `whisperx` (`34.02 MB`) |
| `portable\rhubarb\` | `155.53 MB` | Portable Windows `rhubarb.exe` v1.14.0 |
| `test-outputs\` | `19.27 MB` | Verified launcher baseline outputs (`01`..`16`) |
| `Senku - From Stone to Space\` | `9.75 MB` | User project (`src\`, `audio\`, `review\`, `vendor\three.module.min.js`) |
| `launchers\` / `reports\` / `README.md` | `0.08 MB` | `18` PowerShell launchers, 6 audit/compatibility reports, root README |

---

## 2. Research & Production Fit Evaluation

- **Three.js (WebGL2) + Canvas2D / SVG / HTML via Playwright + FFmpeg:** Best primary backbone for 50–60s "What If" explainers and multi-scene Shorts. Notice user projects (`Gravity Short`, `Senku - From Stone to Space`) already converge on bundled `three.module.min.js` + browser/Canvas compositors. Deterministic frame stepping avoids VSync jitter, hardware ANGLE (`--use-angle=default`) renders 5s @ `720×1280` in `~5.0s` (`~1.0 min` per 60s), overlays sharp HTML/SVG subtitles and HUDs cleanly, and produces exact JS stack traces with minimal AI coding drift.
- **Lemo-Opuscar / Huashu Art Motion / Anidoodle (Preserved):** High-value parametric style grammars (`195` distinct aesthetics + `film_gate.py` anti-slideshow QC detector). Note: Anidoodle `gate.mjs` hits Windows `find.exe` collision outside Git Bash, so use `render.mjs`/`still.mjs` or Playwright pipelines directly.
- **Godot 4.7.2 + Pixelorama (`WORKING`):** Fastest native renderer (`0.11–10.25 ms/frame`, `5–8s` for 150 frames even in 3D), ideal for 2.5D lighting, bloom, `GPUParticles2D/3D`, and retro pixel pipelines via Pixelorama headless CLI. Constraints: requires an active Vulkan surface (avoid `--headless` for Movie Maker), window dimensions can clamp CLI resolution on smaller monitors without stretch config, and GDScript strict Variant typing (`:=`) requires `--check-only` validation.
- **Rigby2D + PixiJS 8 + `@barvynkoa/particle-emitter@0.0.1` (`WORKING`):** Best 2D skeletal puppet + WebGL2 sprite/VFX stack for character acting, smears, and reactive secondary motion. Official `@pixi/particle-emitter@5.0.10` is **broken** on PixiJS 8 and removed from active use.
- **Blender `5.2.2 LTS` (`G:\blender.exe`):** True headless background CLI (`blender -b`) with unmatched raw 3D lighting, Cel shaders, and Grease Pencil, but **~40× slower** (~208–229s per 5s EEVEE render) and higher token/debug cost. Best used selectively for modeling/rigging `.glb` hero assets and dedicated 3D hero shots.
- **Remotion `4.0` & Motion Canvas `3.17.2`:** Strong React/generator motion-graphics tools kept in `sandboxes\` for React templates or visual waveform editing, though slower locally (`~57s` Remotion / `~39s` Motion Canvas for 5s) than pure Three.js + Canvas2D capture.
- **WhisperX `3.8.7rc1`, Rhubarb `1.14.0`, Depth Anything V2 (`ViT-Small`), PySceneDetect `0.7.4`:** Consolidated cleanly into **one unified CUDA 12.8 Python 3.11 venv (`envs\whisperx`)** because `depth-anything-v2` and `whisperx` shared identical `torch==2.8.0+cu128` / `torchvision==0.23.0+cu128` binaries (`0` version diffs), eliminating `~7.7 GB` of duplicate PyTorch installs.

---

## 3. Final Hybrid Production Architecture (Hub & Spoke)

```text
  Narration / SFX Audio (WAV)
     ├─► WhisperX (envs\whisperx, CUDA) ──► word_timestamps.json + .srt
     └─► Rhubarb (portable\rhubarb)     ──► mouth_cues.json (optional 2D characters)

  Visual Asset Prep
     ├─► Pixelorama CLI (Godot 4.7.2)   ──► pixel spritesheets + Aseprite JSON
     ├─► Depth Anything V2 (unified)    ──► 2.5D parallax depth maps (94-129ms)
     ├─► Rigby2D CLI                    ──► 2D skeletal .rigby / bone rigs
     └─► Blender 5.2.2 LTS              ──► hero .glb models / specialized 3D shots

  Core Rendering Hub (1080×1920 @ 30fps -> FFmpeg H.264/AAC)
     ├─► PRIMARY: templates\threejs-short-starter (Three.js WebGL2 + Canvas2D/HTML HUD + Playwright ANGLE)
     ├─► STYLE LIBS: experimental\{lemo-opuscar, huashu-art-motion, anidoodle}
     └─► SPECIALIZED SPOKES: PixiJS 8 + Rigby2D (2D chars) | Godot 4.7.2 (2.5D/3D VFX) | Blender | ManimGL

  Automated QC Gate
     └─► Huashu film_gate.py + PySceneDetect (envs\whisperx) + FFprobe/FFmpeg decode check
```

---

## 4. Component Classification

- **KEEP — ESSENTIAL (Core Pipeline & Preserved Projects/Styles):**
  - `templates\threejs-short-starter\` (new clean 1080×1920 starter)
  - `envs\whisperx\` (unified CUDA 12.8 env: WhisperX + Depth Anything V2 + PySceneDetect + OpenCV/film_gate)
  - `experimental\lemo-opuscar\`, `experimental\huashu-art-motion\`, `experimental\anidoodle\`
  - `models\` (`depth_anything_v2_vits.pth`, `faster-whisper-small.en`), `.cache\torch\` & `.cache\nltk_data\` & `.cache\huggingface\`
  - `ai-and-depth\` (`depth-anything-v2`, `whisperx`, `pyscenedetect`), `launchers\`, `reports\`
  - `StyleBenchmark\`, `Chakra Short\`, `Gravity Short\`, `Senku - From Stone to Space\`, `Senku - Genius Who Rebuilt Civilization\`
- **KEEP — OPTIONAL (Specialized Visual Spokes & Sandboxes):**
  - `character-tools\rigby2d\`, `character-tools\pixelorama\`, `portable\rhubarb\`
  - `engines\manim\` + `envs\manimgl\`
  - `sandboxes\pixi-suite\`, `sandboxes\anidoodle-demo\`, `sandboxes\remotion-demo\`, `sandboxes\motion-canvas-demo\`, `sandboxes\godot-demo\`, `sandboxes\shared-media\` (and active junctions in `StyleBenchmark\styles\{remotion,motion-canvas}\node_modules`)
  - `test-outputs\` (19.27 MB baseline test reference)
- **ARCHIVE (`G:\AnimationLab\_archive\repos\`, `1,671.27 MB` — Recoverable Quarantine):**
  - `remotion` (`859.81 MB`), `godot-demo-projects` (`516.09 MB`), `rhubarb-lip-sync` (`219.62 MB`), `pixijs` (`67.15 MB`), `motion-canvas` (`5.53 MB`), `pixijs-filters` (`2.33 MB`), `pixijs-particle-emitter` (`0.73 MB` legacy incompatible source)
- **REMOVE (`12,362.32 MB` / `12.07 GiB` Permanently Reclaimed Safely):**
  - Duplicate Python venvs superseded by unified `envs\whisperx`: `envs\depth-anything-v2` (`7,506.23 MB`), `envs\pyscenedetect` (`197.01 MB`)
  - Regenerable download/build/temp caches: `.cache\wheels` (`3,312.72 MB`), `.cache\npm` (`459.69 MB`), `.cache\pip` (`305.78 MB`), `.cache\tmp` (`177.58 MB`), `.cache\eevee_*.png` (`0.20 MB`), `StyleBenchmark\styles\remotion\.cache` (`245.18 MB`), `StyleBenchmark\styles\motion-canvas\{output,.vite}` (`71.94 MB`), `sandboxes\pixi-suite\official-compat-probe` (`86.00 MB` broken probe), empty dirs.

---

## 5. Disk Space Recovered & Archive Summary

- **Original `G:\AnimationLab` size:** `32.17 GiB` (`50.18 GB` free on `G:\`)
- **Final `G:\AnimationLab` size:** `20.24 GiB` / `21.73 GB` (`63.20 GB` free on `G:\`, including `1.67 GB` still inside `_archive\repos\`)
- **Net space immediately freed:** **`12,362.32 MB` (`12.07 GiB` / `+13.02 GB` free on `G:\`)**
- **Optional additional space available with your confirmation:** Deleting `G:\AnimationLab\_archive\repos\` recovers another **`1.67 GB`**. Separately, user project `Senku - Genius Who Rebuilt Civilization\frames\` contains `3,909.10 MB` of intermediate PNG frames (left completely untouched).

Full itemized log: [CLEANUP_MANIFEST.json](file:///G:/AnimationLab/reports/CLEANUP_MANIFEST.json).

---

## 6. Verification Results Post-Cleanup

- **Unified AI / QC checks on `envs\whisperx` (run before & after cleanup):**
  - `11_test_depth_anything_v2.ps1`: CUDA `129.4 ms`, `413.9 MB` peak VRAM, exit `0`.
  - `14_test_whisperx.ps1`: CUDA `float16` transcription + alignment, exit `0`.
  - `16_test_pyscenedetect.ps1`: `583.56 FPS`, 3 scenes + thumbs, exit `0`.
  - `huashu-art-motion/scripts/film_gate.py`: `"verdict": "pass"`, exit `0`.
- **Lab-wide health suite (`launchers\verify_lab.ps1`):** All 15 checks (`Chrome`, `FFmpeg`, `FFprobe`, `Godot 4.7.2`, `Blender 5.2.2`, `Rhubarb`, `Unified CUDA AI Python`, `PySceneDetect CLI`, `ManimGL`, `Rigby2D CLI`, `Pixelorama`, `Node sandboxes`, `Lemo/Huashu/Anidoodle`, `Three.js starter template`, `StyleBenchmark gallery & junctions`) exited `0` (`verify_lab PASSED`).
- **Starter template smoke render (`templates\threejs-short-starter\render.mjs --frames 15`):** Exported `1080×1920 @ 30fps H.264` (`nb_frames=15`) cleanly verified by `ffprobe` (temp test MP4 deleted afterward).

---

## 7. Remaining Technical Limitations

1. **System RAM ceiling (`15.84 GB`, `~2.2 GB` free headroom):** Never launch concurrent Chromium, Blender, or PyTorch processes; keep batch scripts sequential (`--workers 1`).
2. **ManimGL LaTeX:** `Tex`/`MathTex` remain disabled intentionally (no MiKTeX/TeX Live installed to protect `C:\` free space); use Pango `Text` and geometric VMobjects.
3. **Anidoodle `gate.mjs` Step 2:** Upstream `gate.mjs` collides with `C:\Windows\System32\find.exe`; use `render.mjs`/`still.mjs` or run inside Git Bash if `gate.mjs` is needed.
4. **PixiJS 8 Particles:** Never install `@pixi/particle-emitter@5.0.10`; use `@barvynkoa/particle-emitter@0.0.1` (`sandboxes\pixi-suite`) with a >=16×16 spark texture.
5. **Headless WebGL:** Keep hardware ANGLE (`--use-gl=angle --use-angle=default`) enabled for Three.js / Lemo-Opuscar on the RTX 4060; SwiftShader stalls >60s/frame on shader effects.
6. **Godot Movie Maker Resolution:** Avoid pure `--headless` when recording Movie Maker frames; use windowed Vulkan + explicit stretch sizing for vertical `1080×1920` exports.
