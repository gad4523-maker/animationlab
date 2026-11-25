# AnimationLab Pipeline — Dependencies, Exact Versions & Licenses

Verified from `animpipe.ps1 doctor`, `envs\whisperx` Python package metadata, `sandboxes\pixi-suite\package.json`, vendored files, and installed Windows binaries.

---

## 1. Core Runtimes & System Binaries

| Component | Exact Version | Installed Path | License | Notes |
| --- | --- | --- | --- | --- |
| **Node.js** | `v24.12.0` | `C:\Program Files\nodejs\node.EXE` | MIT | Executes `render_web_shot.mjs` |
| **Google Chrome** | System install | `C:\Program Files\Google\Chrome\Application\chrome.exe` | Proprietary Freeware | Headless WebGL2 via ANGLE (`--use-gl=angle`) |
| **FFmpeg / FFprobe** | `8.0-full_build-www.gyan.dev` | `C:\Users\User\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe` / `ffprobe.exe` | GPL-3.0 (full build) | H.264 (`libx264`), ASS burn-in, EBU R128 `loudnorm`, `xfade`, `ffprobe`, contact sheet |
| **Godot Engine** | `4.7.2-stable` | `G:\SPRITE ANIAIMTION\tools\Godot-4.7.2\Godot_v4.7.2-stable_win64_console.exe` | MIT | Optional `godot` adapter (`--write-movie`) |
| **Blender** | `5.2.2 LTS` | `G:\blender.exe` | GPL-3.0 | Optional `blender` adapter (`--background --python`) |

---

## 2. Vendored & Node.js Packages

| Library | Version | Location | License | Role |
| --- | --- | --- | --- | --- |
| **Three.js** (`three.module.min.js`, `GLTFLoader`, `BufferGeometryUtils`) | `0.170.0` | `G:\AnimationLab\pipeline\vendor\three\` (`LICENSE` included) | MIT | Offline WebGL2 3D rendering, shaders, HDR composer |
| **`playwright-core`** | `^1.56.0` | Resolved via `G:\AnimationLab\sandboxes\pixi-suite\node_modules` | Apache-2.0 | Deterministic headless Chrome automation & frame capture |
| **PixiJS / `pixi-filters`** *(lab sandbox)* | `^8.0.0` / `^6.0.0` | `G:\AnimationLab\sandboxes\pixi-suite\` | MIT | Available for Canvas/WebGL 2D sprite & Rigby2D extensions |

---

## 3. Python Unified CUDA Environment (`G:\AnimationLab\envs\whisperx\`)

| Package | Verified Version | License | Role |
| --- | :---: | --- | --- |
| **`torch`** | `2.8.0+cu128` | BSD-3-Clause | CUDA GPU execution (`cuda=True` on RTX 4060) |
| **`whisperx`** | `3.8.7rc1` | BSD-2-Clause | Per-take forced phoneme/word timestamp alignment (Wav2Vec2) |
| **`faster-whisper`** | `1.2.1` | MIT | ASR model backend used by WhisperX |
| **`kokoro-onnx`** | `0.6.1` | MIT | Offline ONNX neural text-to-speech inference |
| **`soundfile`** | `0.14.0` | BSD-3-Clause | WAV read/write for TTS takes and SFX mixing |
| **`numpy`** | `2.4.6` | BSD-3-Clause | Procedural SFX synthesis, ambient bed, envelope ducking |
| **`opencv-python`** | `5.1.0.95` | Apache-2.0 | Video frame analysis / motion gate support |
| **`scenedetect`** | `0.7.4.dev0` | BSD-3-Clause | Automated shot cut detection in QC |
| **`timm`** | `1.0.31` | Apache-2.0 | Vision backbone dependency in unified CUDA env |

---

## 4. Local Model Weights & Lab Tools

| Asset / Tool | Path | License | Notes |
| --- | --- | --- | --- |
| **Kokoro v1.0 int8 ONNX + Voices** | `G:\AnimationLab\models\kokoro\kokoro-v1.0.int8.onnx`, `voices.bin` | Apache-2.0 | Offline TTS model weights |
| **Huashu `film_gate.py`** | `G:\AnimationLab\experimental\huashu-art-motion\scripts\film_gate.py` | Repo license | Motion density, blank-run, still-ratio, and blue/purple QC gate |
| **Rhubarb Lip Sync** | `G:\AnimationLab\portable\rhubarb\...\rhubarb.exe` (`1.14.0`) | MIT | Optional phoneme mouth-shape JSON extraction |
