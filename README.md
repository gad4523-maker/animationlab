# AnimationLab — Production Animation Environment

**Location:** `G:\AnimationLab\`  
**Hardware Baseline:** Windows 11 Pro, Intel i5-12400F, 15.84 GB RAM (run heavy CUDA/Chromium/Blender jobs sequentially), NVIDIA RTX 4060 8 GB (CUDA 12.8).  
**Cache Isolation:** Sourcing `launchers\env_common.ps1` keeps all caches, temp files, and model stores off `C:\` and under `G:\AnimationLab\.cache\`.

---

## 1. Production Architecture (`1080×1920 @ 30 FPS`)

- **Active Multi-Engine Production Pipeline:** `G:\AnimationLab\pipeline\` (documented in [pipeline/README.md](pipeline/README.md)) — JSON-driven `episode.json` orchestration supporting `web3d` (Three.js 0.170 HDR + HUD), `anime2d` (Canvas2D IK rig), `godot`, and `blender` shots with offline Kokoro ONNX TTS, CUDA WhisperX alignment, monotonic ASS karaoke subtitles, procedural SFX + EBU R128 mastering, and `film_gate.py` QC.
- **Primary Core Engine:** **Three.js (WebGL2) + Canvas2D / SVG / HTML** captured deterministically via headless Chromium + Playwright (`--use-gl=angle --use-angle=default`) and piped straight to FFmpeg H.264. Start new Shorts with `animpipe.ps1 init` (or `templates\threejs-short-starter\`).
- **Style & Motion Libraries (Preserved):**
  - `experimental\lemo-opuscar` (99 curated style definitions)
  - `experimental\huashu-art-motion` (60 art-history eras + `scripts\film_gate.py` anti-slideshow QC gate)
  - `experimental\anidoodle` (36 craft/ink styles + Three-Core)
- **Specialized Visual Spokes:**
  - **2D Skeletal Character Acting:** `character-tools\rigby2d` + PixiJS 8 (`sandboxes\pixi-suite`)
  - **2.5D / Pixel / Game-Engine VFX & 3D Arenas:** Godot `4.7.2` + `character-tools\pixelorama` CLI
  - **Hero 3D Rigging / Complex 3D Shots / Cel / Grease Pencil:** Blender `5.2.2 LTS` (`G:\blender.exe`)
  - **Math / Procedural Diagrams / React Overlays:** `envs\manimgl` (`engines\manim`), `sandboxes\remotion-demo`, `sandboxes\motion-canvas-demo`
- **Unified AI, Audio & QC Utilities (`envs\whisperx`):**
  - **WhisperX `3.8.7rc1`** (CUDA `float16` word timestamps & `.srt` alignment)
  - **Rhubarb Lip Sync `1.14.0`** (`portable\rhubarb\...\rhubarb.exe`)
  - **Depth Anything V2 (`ViT-Small`)** (`ai-and-depth\depth-anything-v2` running in unified `envs\whisperx`)
  - **PySceneDetect `0.7.4` & Huashu `film_gate.py`** (cut & motion density QC in unified `envs\whisperx`)

---

## 2. Optimized Directory Layout

```text
G:\AnimationLab\
├── pipeline\                         # Active multi-engine 1080x1920 pipeline (CLI, core, audio, templates, demos)
├── templates\threejs-short-starter\  # Clean 1080x1920 @ 30fps Three.js + HUD production starter
├── StyleBenchmark\                   # 216 rendered Goku SSJ style demos + interactive gallery
├── experimental\                     # Preserved style libraries: lemo-opuscar, huashu-art-motion, anidoodle
├── character-tools\                  # pixelorama (Godot CLI), rigby2d (2D skeletal CLI + runtime)
├── engines\                          # manim (editable install for envs\manimgl)
├── ai-and-depth\                     # depth-anything-v2, whisperx, pyscenedetect sources
├── sandboxes\                        # Runnable Node/Godot/Python demos (pixi-suite, remotion-demo, etc.)
├── envs\                             # whisperx (unified CUDA AI/CV/QC venv), manimgl (ManimGL OpenGL venv)
├── portable\rhubarb\                 # Portable Windows rhubarb.exe (v1.14.0)
├── models\                           # depth_anything_v2_vits.pth, faster-whisper-small.en
├── launchers\                        # env_common.ps1, verify_lab.ps1, cleanup_caches.ps1, 01..16 scripts
├── reports\                          # CLEANUP_MANIFEST.json, OPTIMIZATION_AND_ARCHITECTURE_REPORT.md, etc.
├── _archive\repos\                   # Recoverable quarantine of 7 unused upstream source clones (~1.67 GB)
├── test-outputs\                     # Verified baseline outputs (01..16)
└── [User Projects]                   # Chakra Short, Gravity Short, Senku - From Stone to Space, Senku - Genius...
```

---

## 3. Common Commands

```powershell
# Load isolated paths & binaries
. "G:\AnimationLab\launchers\env_common.ps1"

# Fast lab health check (no heavy renders)
powershell -ExecutionPolicy Bypass -File "G:\AnimationLab\launchers\verify_lab.ps1"

# Run any individual tool launcher or all sequentially
powershell -ExecutionPolicy Bypass -File "G:\AnimationLab\launchers\run_all_tests.ps1" -Tools 11,14,16

# Safely purge regenerable pip/npm/wheels/tmp caches (preserves AI model weights)
powershell -ExecutionPolicy Bypass -File "G:\AnimationLab\launchers\cleanup_caches.ps1"

# Active multi-engine pipeline CLI (doctor, init, render, qc)
powershell -ExecutionPolicy Bypass -File "G:\AnimationLab\pipeline\bin\animpipe.ps1" doctor
powershell -ExecutionPolicy Bypass -File "G:\AnimationLab\pipeline\bin\animpipe.ps1" init "G:\AnimationLab\projects\my_short" --template hybrid --id my_short
powershell -ExecutionPolicy Bypass -File "G:\AnimationLab\pipeline\bin\animpipe.ps1" render "G:\AnimationLab\projects\my_short"

# Render a new Three.js + HUD Short from the standalone starter template
node "G:\AnimationLab\templates\threejs-short-starter\render.mjs"
```

---

## 4. Animation skills and asset policy

- **Three supplemental skill packs** (motion direction, story-driven shorts, Blender production) are pinned as optional Git submodules. See [animation skill routing and setup](docs/ANIMATION_SKILLS.md). The primary production director remains [anime-shorts-director](.agents/skills/anime-shorts-director/SKILL.md); third-party instructions do not override episode requirements.
- **Actual animation is required.** AI-generated individual sprites, sprite sheets, textures and still assets may be used as licensed building blocks; no fully AI-generated video shots or static slideshows as the finished animation. Honor stricter episode rules.
- **Source checkout is not a complete Windows install:** tool binaries, CUDA model weights, Python environments and private media are intentionally not in Git. See [source layout](SOURCE-LAYOUT.md). For Gemini's CPU-only cloud, use [animationlab-portable](https://github.com/gad4523-maker/animationlab-portable).
