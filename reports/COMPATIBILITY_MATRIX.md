# Compatibility Matrix & Verification Report — AnimationLab (All 16 Repositories)

**Verification Policy:** Installation success and functional verification are strictly separated. Every `WORKING` / `PARTIALLY WORKING` verdict below reflects end-to-end execution producing real rendered videos, spritesheets, depth maps, mouth cues, word timestamps, or scene cut CSVs inspected on disk.

---

## 1. Master 16-Tool Matrix

| # | Repository | Branch / Commit | Verified License | Actual Architecture | Install Status | Functional Status | Launcher | Primary Verified Output |
|---:|---|---|---|---|---|---|---|---|
| 1 | **Lemo-Opuscar** | `main` / `f9e2042` | Multi-license (`MIT` code, `CC BY 4.0` demos, `CC BY-NC 4.0` docs) | Agent Skill + WebGL/JS Style Workbench | Installed (npm) | **`WORKING`** | `launchers\01_test_lemo_opuscar.ps1` | `01_lemo-opuscar\lemo_cel_anime_demo.mp4` (`1280×720`, `24fps`, `84f`) |
| 2 | **Huashu Art Motion** | `main` / `a97c450` | `MIT` | Agent Skill + Canvas Engine + `film_gate.py` | Installed (sandbox copy + `pyscenedetect` env) | **`WORKING`** | `launchers\02_test_huashu_art_motion.ps1` | `02_huashu-art-motion\huashu_demo.mp4` (`1280×720`, `24fps`, `96f`) + `film_gate.json` |
| 3 | **Anidoodle** | `main` / `4ae27d2` | `Apache-2.0` | Agent Skill + Deterministic TS/Canvas Engine | Installed (255 npm pkgs) | **`PARTIALLY WORKING`** | `launchers\03_test_anidoodle.ps1` | `03_anidoodle\anidoodle_demo.mp4` (`1080p24`, `72f`) + `anidoodle_sumie_seq.mp4` |
| 4 | **Manim (3Blue1Brown)** | `master` / `fafa083` | `MIT` | Python OpenGL Animation Engine (`ManimGL`) | Installed (`envs\manimgl`) | **`PARTIALLY WORKING`** | `launchers\04_test_manim.ps1` | `04_manim\manimgl_demo.mp4` (`1280×720`, `24fps`, `102f`) |
| 5 | **Rigby2D** | `develop` / `1971cf5` | `MIT OR Apache-2.0` | 2D Skeletal CLI (`v0.6.0`) + MCP + PixiJS Runtime | Installed (npm + PixiJS 8 bundle) | **`WORKING`** | `launchers\05_test_rigby2d.ps1` | `05_rigby2d\rigby2d_rig_demo.mp4` (`1280×720`, `24fps`, `72f`) |
| 6 | **PixiJS** | `dev` / `16011d7` | `MIT` | TypeScript WebGL2/WebGPU 2D Engine (`8.23.0`) | Installed (`sandboxes\pixi-suite`) | **`WORKING`** | `launchers\06_test_pixijs.ps1` | `06_pixijs\pixijs_sprite_demo.mp4` (`1280×720`, `24fps`, `48f`) |
| 7 | **PixiJS Filters** | `main` / `e9d1ca9` | `MIT` | Shader Filter Library (`6.1.5`) for PixiJS | Installed (`sandboxes\pixi-suite`) | **`WORKING`** | `launchers\07_test_pixijs_filters.ps1` | `07_pixijs-filters\pixijs_filters_demo.mp4` (`1280×720`, `24fps`, `48f`) |
| 8 | **PixiJS Particle Emitter** | `master` / `0fffdd9` | `MIT` | Particle Library (`5.0.10` official / `@barvynkoa` v6 port) | Installed (both tested) | **`PARTIALLY WORKING`** | `launchers\08_test_pixijs_particle_emitter.ps1` | `08_pixijs-particle-emitter\particle_emitter_demo.mp4` + `official_v8_compat_test.log` |
| 9 | **Pixelorama** | `master` / `5609dba` | `MIT` | Godot 4 Pixel Editor (`v1.2.5-dev`) | Source + Godot `4.7.2` | **`WORKING`** | `launchers\09_test_pixelorama.ps1` | `09_pixelorama\warrior_spritesheet.png` + `warrior_anim.json` |
| 10 | **Godot Demo Projects** | `master` / `b761b4c` | `MIT` | Official Godot 4 Demos (`4.7.2` engine) | Copied demo + Godot `4.7.2` | **`WORKING`** | `launchers\10_test_godot_demo_projects.ps1` | `10_godot-demo-projects\godot_demo.mp4` (`1152×648`, `24fps`, `96f`) |
| 11 | **Depth Anything V2** | `main` / `a561b84` | `Apache-2.0` | PyTorch Depth Model (`ViT-Small`) & CLI | Installed (`envs\depth-anything-v2`) | **`WORKING`** | `launchers\11_test_depth_anything_v2.ps1` | `11_depth-anything-v2\depth_side_by_side.png` (`94.8ms` CUDA) |
| 12 | **Remotion** | `main` / `970849f` | Dual (`Free` individual/`<=3` org, else `Company`) | React/TS Programmatic Video Engine (`4.0.x`) | Installed (`sandboxes\remotion-demo`) | **`WORKING`** | `launchers\12_test_remotion.ps1` | `12_remotion\remotion_demo.mp4` (`1280×720`, `30fps`, `90f`) |
| 13 | **Rhubarb Lip Sync** | `master` / `9b9573c` | `MIT` (+ BSD/Boost deps) | C++ Mouth-Shape CLI (`v1.14.0` portable) | Portable Windows EXE | **`WORKING`** | `launchers\13_test_rhubarb_lip_sync.ps1` | `13_rhubarb-lip-sync\mouth_cues_dialog.json` + `rhubarb_preview.mp4` |
| 14 | **WhisperX** | `main` / `8d8e43b` | `BSD-2-Clause` | CUDA ASR + Forced Alignment (`3.8.7rc1`) | Installed (`envs\whisperx`) | **`WORKING`** | `launchers\14_test_whisperx.ps1` | `14_whisperx\speech_test.json` + `.srt`/`.vtt`/`.tsv` |
| 15 | **Motion Canvas** | `main` / `7b91435` | `MIT` | TS Generator Motion Graphics (`3.17.2`) | Installed (`sandboxes\motion-canvas-demo`) | **`WORKING`** | `launchers\15_test_motion_canvas.ps1` | `15_motion-canvas\motion_canvas_demo.mp4` (`1280×720`, `30fps`, `92f`) |
| 16 | **PySceneDetect** | `main` / `10f0abf` | `BSD-3-Clause` | Python/OpenCV Shot Boundary CLI (`0.7.4.dev0`) | Installed (`envs\pyscenedetect`) | **`WORKING`** | `launchers\16_test_pyscenedetect.ps1` | `16_pyscenedetect\test_scene_cuts-Scenes.csv` + `thumbs\*.jpg` |

**Totals:** `13 WORKING`, `3 PARTIALLY WORKING`, `0 BLOCKED` (at tool level; official `@pixi/particle-emitter@5.0.10` npm package alone is `BLOCKED` on PixiJS 8), `0 NOT TESTED`.

---

## 2. Detailed Compatibility & Workaround Notes

### Tools Classified `PARTIALLY WORKING`
1. **#3 Anidoodle (`PARTIALLY WORKING`)**
   - **What works:** `scaffold.mjs` (`animeDemo`), `still.mjs`, `render.mjs`, and built-in `sumiE` film render deterministically (`min PSNR 59.92 dB` in gate Step 1) to `1080p` / `1080×1080` MP4s.
   - **Gap 1 (fixed in sandbox):** `tools/detect.mjs` `findBrowser()` neither checks `$env:CHROME_PATH` / `$env:PLAYWRIGHT_CHROME` nor matches `.exe` on Windows filenames (`chrome.exe`). Patched in `G:\AnimationLab\sandboxes\anidoodle-demo\tools\detect.mjs` while keeping the upstream repo clone clean.
   - **Gap 2 (remaining Windows blocker):** `tools/gate.mjs` Step 2 (`CONTRACT`) invokes Unix `find <dir> -name "*.ts" -type f`, which hits Windows `C:\Windows\System32\find.exe` outside Git Bash/WSL and crashes `gate.mjs`.
2. **#4 ManimGL (`PARTIALLY WORKING`)**
   - **What works:** OpenGL + `wgpu` + `ManimPango` vector/text/axes/traced-path animations (`fourier_epicycle_demo.py`) render smoothly (`1280×720`, `24fps`, `102f`, `13.43s`) with caches isolated to `G:\AnimationLab\.cache\manim` via `custom_config.yml`.
   - **Gap 1 (fixed in env):** Upstream `setup.cfg` omits `av` from `install_requires` even though `manimlib/mobject/types/video_mobject.py` imports `av` unconditionally. Installing `-r requirements.txt` fixes this (`av==18.1.1`).
   - **Gap 2 (intentional omission):** `Tex` / `MathTex` mobjects require an external TeX distribution (MiKTeX or TeX Live), which was not installed to avoid admin changes and keep `C:` above `17 GB` free.
3. **#8 PixiJS Particle Emitter (`PARTIALLY WORKING`)**
   - **Official `pixijs-userland/particle-emitter` (`@pixi/particle-emitter@5.0.10`):** **`BLOCKED`** against `pixi.js@8.23.0`. Fails bundling and runtime import with 6 missing split PixiJS v6/v7 packages (`@pixi/core`, `@pixi/constants`, `@pixi/sprite`, `@pixi/math`, `@pixi/ticker`, `@pixi/display`). See `reports\PIXI8_PARTICLE_EMITTER_COMPARISON.md` and `test-outputs\08_pixijs-particle-emitter\official_v8_compat_test.log`.
   - **Previous-Pipeline Community Port (`@barvynkoa/particle-emitter@0.0.1` / compiled `v6.0.0`):** **`WORKING`** cleanly on `pixi.js@8.23.0` (`48` frames @ `1280×720`, peak `85` particles). Requires a custom generated `16×16` texture because PixiJS 8 shrank `Texture.WHITE` to `1×1` px.

### Notable Windows Findings Across `WORKING` Tools
- **#1 Lemo-Opuscar:** Force hardware ANGLE (`LEMO_ANGLE=default`) on RTX 4060; SwiftShader stalls >60s/frame on CRT shaders. Style demo fonts are gitignored; sandbox links bundled `core/fonts/fonts.css`.
- **#2 Huashu Art Motion:** Both procedural Canvas2D scenes (`25_ghibli`, `35_shinkai`, `14_8bit`) and Python CV quality gate (`film_gate.py --json`) run cleanly offline (`verdict: "pass"`).
- **#9 Pixelorama:** Cloned `master` (`v1.2.5-dev`) runs headless CLI spritesheet + Aseprite-style JSON export directly under existing Godot `4.7.2` (2 minor non-blocking GDScript type warnings appear in `--import` without affecting export).
- **#14 WhisperX:** Setting `$env:HF_HUB_DISABLE_XET = "1"` avoids `hf_xet` throttling (~49 KB/s), and prepending `torch\lib` enables CUDA `float16` transcription + `Wav2Vec2` alignment; `pyannote` logs a non-fatal `libtorchcodec` FFmpeg 4–7 warning against WinGet FFmpeg `8.0`.
- **#15 Motion Canvas:** Needs `vite@^5.4.11` (`4.x || 5.x` peerDep), ESM/CJS `.default` unwrap in `vite.config.ts`, and Playwright clicking `#render` in the Vite UI for non-interactive headless rendering.
