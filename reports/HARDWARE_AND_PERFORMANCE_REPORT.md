# Hardware & Performance Report — AnimationLab

**Audit Date:** 2026-11-23  
**Lab Location:** `G:\AnimationLab\`  

---

## 1. Verified Host Hardware & Software Baseline

| Component | Observed Specification |
|---|---|
| **OS** | Microsoft Windows 11 Pro `10.0.26300` (Build `26300`) |
| **CPU** | 12th Gen Intel(R) Core(TM) i5-12400F (`6` physical cores / `12` logical processors, `2500 MHz` base clock) |
| **System Memory (RAM)** | `15.84 GB` total physical RAM (`2.20 GB` free observed under simultaneous browser/IDE + Python install load) |
| **GPU** | NVIDIA GeForce RTX 4060 (`8188 MiB` total VRAM, Compute Capability `8.9`, Driver `617.42`) |
| **CUDA Toolkit** | CUDA `12.8` (`V12.8.61` / `cuda_12.8.r12.8/compiler.35404655_0`) |
| **Python / Package Manager** | Python `3.11.9` (`C:\Program Files\Python311\python.exe`), `uv 0.11.19` |
| **Node.js / npm** | Node `v24.12.0`, `npm 11.4.2` |
| **Media / Engine Binaries** | `ffmpeg 8.0-full_build` (WinGet), Godot `4.7.2.stable`, system Google Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`) |

---

## 2. Storage Impact & C:\ Drive Protection

`C:\` started with **`11.96 GB` free** (`G:\` started with **`72.13 GB` free**). All caches, temporary files, virtual environments, models, and npm stores were redirected to `G:\AnimationLab\.cache\` via `G:\AnimationLab\launchers\env_common.ps1`.

### Final Disk Free Space (Post-Install & All 16 Tests)
| Drive | Used | Free | Net Outcome |
|---|---:|---:|---|
| **`C:`** | `297.30 GB` | **`17.46 GB`** | Protected (`0 GB` AnimationLab cache bloat on `C:`) |
| **`G:`** | `274.78 GB` | **`47.48 GB`** | `24.71 GB` allocated cleanly to `G:\AnimationLab` |

### `G:\AnimationLab` Breakdown by Directory (`24.71 GB` Total)
| Directory | Size (MB) | Size (GB) | Contents |
|---|---:|---:|---|
| `envs\` | `16,289.3` | `15.91` | Isolated Python venvs (`whisperx` `8,083.7 MB`, `depth-anything-v2` `7,506.2 MB`, `manimgl` `502.4 MB`, `pyscenedetect` `197.0 MB`) |
| `.cache\` | `4,554.7` | `4.45` | `wheels` (`3,312.7 MB` `cu128` wheels), `npm` (`441.1 MB`), `torch` (`360.2 MB` Wav2Vec2 checkpoint), `pip` (`295.4 MB`), `tmp` (`68.4 MB`), `nltk_data` (`63.3 MB`), `uv` (`11.0 MB`), `huggingface` (`2.6 MB`), `manim` (`0.1 MB`) |
| `sandboxes\` | `1,132.1` | `1.11` | Isolated Node/Godot/Python test demos (`pixi-suite`, `anidoodle-demo`, `remotion-demo`, `motion-canvas-demo`, `shared-media`, etc.) |
| `engines\` | `937.0` | `0.92` | `manim`, `pixijs`, `remotion`, `motion-canvas` |
| `models\` | `558.2` | `0.55` | `depth_anything_v2_vits.pth` (`94.62 MB`), `faster-whisper-small.en` (`461.14 MB` `model.bin` + tokenizer/vocab) |
| `godot-and-vfx\` | `519.2` | `0.51` | `godot-demo-projects`, `pixijs-filters`, `pixijs-particle-emitter` |
| `experimental\` | `514.9` | `0.50` | `lemo-opuscar`, `huashu-art-motion`, `anidoodle` |
| `character-tools\` | `368.9` | `0.36` | `rigby2d`, `pixelorama`, `rhubarb-lip-sync` |
| `ai-and-depth\` | `256.1` | `0.25` | `depth-anything-v2`, `whisperx`, `pyscenedetect` |
| `portable\` | `155.5` | `0.15` | `rhubarb\Rhubarb-Lip-Sync-1.14.0-Windows` |
| `test-outputs\` | `19.3` | `0.02` | Sample MP4s, stills, sprite sheets, JSON/SRT/CSV outputs (`01`–`16`) |
| `launchers\` / `reports\` | `< 1.0` | `0.00` | `18` PowerShell scripts + audit/comparison Markdown/JSON reports |

> **Note:** `envs\depth-anything-v2` and `envs\whisperx` each contain full isolated `torch==2.8.0+cu128` installations (`~7.5–8.1 GB` each). Removing `.cache\wheels` (`3.31 GB`) after setup is optional if `G:` disk space needs reclamation later, though keeping it enables fast rebuilds.

---

## 3. Observed Install & Execution Benchmarks

### GPU / AI Benchmarks (RTX 4060 8 GB)
- **Depth Anything V2 (`ViT-Small`, CUDA 12.8):**
  - Model load: `0.513s`
  - Inference (`1024×576` input resized @ `518`): **`94.8 ms`** initial / **`113.7 ms`** re-run (~8.8–10.5 frames/s per single unbatched image)
  - Peak VRAM: **`413.9 MB`** (leaving >`7.5 GB` headroom out of `8188 MiB`)
- **WhisperX (`3.8.7rc1`, `small.en`, `float16` CUDA + `pyannote` VAD + `Wav2Vec2` forced alignment on `10.64s` WAV):**
  - Cold first run: `34.4s`
  - Warm launcher re-run (`14_test_whisperx.ps1`): **`16.79s`** total wall-clock (including Python startup, VAD load, transcription, and forced word alignment)
- **Godot `4.7.2` Vulkan 1.4 (`2d/particles` Movie Maker, `96` frames @ `1152×648` `24fps`):**
  - Total render + AVI write: **`9.74s`**

### Headless Browser / Native / CPU Benchmarks
| Tool | Task Measured | Elapsed Time | Throughput / Notes |
|---|---|---:|---|
| **PySceneDetect** | `detect-content` on `216` frames (`1280×720`) | `1.08s` | **`531.58 FPS`** |
| **Rhubarb Lip Sync** | `10.64s` WAV (`dialog` and acoustic passes) | `3.41s` each | `~3.1×` real-time on i5-12400F CPU |
| **Rigby2D** | Dual skeletal rigs (39 + 11 bones) `72` frames @ `720p` | `7.59s` | Hardware WebGL Chrome + FFmpeg |
| **Motion Canvas** | Automated Vite `#render` `92` frames @ `720p30` | `8.91s` | Canvas2D + Playwright |
| **Lemo-Opuscar** | `80s Cel Anime` `84` frames @ `720p24` | `7.0s` video (`12.0s` total) | Hardware ANGLE (`LEMO_ANGLE=default`) vs `>60s/frame` SwiftShader |
| **ManimGL `1.7.2`** | `AnimationLabMathDemo` `102` frames @ `720p24` | `15.09s` / `13.43s` | Zero-LaTeX OpenGL (`wgpu`/Pango) |
| **Huashu Art Motion** | 3-scene showcase (`96` frames @ `720p24`) | `18.73s` | Canvas2D headless capture |
| **Remotion `4.0`** | `AnimeTitleDemo` `90` frames @ `720p30` | `24.42s` | `--concurrency=2` (RAM-safe) |

### Environment Installation Timings
- Anidoodle npm (`255` packages): `21.84s`
- ManimGL Python venv (`55+` packages incl. cached deps): `243.74s`
- Depth Anything V2 venv (`pip install` after R2 wheel cache): `313.12s`
- WhisperX venv (`pip install` from cached `cu128` wheels + PyPI extras): `558.48s`

---

## 4. Platform Bottlenecks & Tuning Findings

1. **15.84 GB RAM Headroom (`~2.2 GB` free under active desktop + browser):**
   - Never run multiple PyTorch/Node Chromium renderers concurrently on this machine.
   - Sequential execution in `run_all_tests.ps1`, `--workers 1` (`Lemo-Opuscar`, `Anidoodle`), and `--concurrency=2` (`Remotion`) prevented swapping/OOMs cleanly.
2. **Headless WebGL Angle (`LEMO_ANGLE=default` vs `swiftshader`):**
   - Shader-heavy scenes like `Lemo-Opuscar` CRT WebGL2 hit `>60s/frame` under CPU SwiftShader, whereas hardware RTX 4060 ANGLE rendered `84` frames in `7.0s`. Always keep hardware ANGLE for Lemo-Opuscar on this GPU.
3. **Windows Network & HuggingFace `hf_xet` Throttling:**
   - `uv pip` and default `pip` stalled silently on multi-GB CDN sockets, and HuggingFace `hf_xet` dropped concurrency `24 -> 1` (~`49 KB/s`).
   - Adding `$env:HF_HUB_DISABLE_XET = "1"` in `env_common.ps1` and using IPv4 resumable `curl.exe -4 -C -` against PyTorch R2 and local model directories eliminated hangs cleanly.
