# AnimationLab Production Pipeline (`G:\AnimationLab\pipeline\`)

Deterministic, JSON-driven `1080×1920 @ 30 fps` multi-engine YouTube Shorts pipeline designed for Windows 11 + NVIDIA RTX 4060 (8 GB VRAM) / 16 GB RAM.

> **Content Policy:** Finished Shorts must be animated with the pipeline (Three.js/Canvas2D, Godot, Blender or other supported animation tools). AI-generated **individual sprites, sprite sheets, textures, backgrounds and other still assets are allowed** as scene components, subject to license/rights checks. **Do not use fully AI-generated video shots or substitute still-image slideshows for animation.** Honor stricter per-episode requirements.

---

## 1. Quick Start

```powershell
# 1. Verify all tools, weights, and CUDA Python dependencies
powershell -ExecutionPolicy Bypass -File "G:\AnimationLab\pipeline\bin\animpipe.ps1" doctor

# (First-time setup or weight check if needed)
powershell -ExecutionPolicy Bypass -File "G:\AnimationLab\pipeline\setup_pipeline.ps1"

# 2. Initialize a new Short from a reusable template (explainer3d | anime2d | hybrid)
powershell -ExecutionPolicy Bypass -File "G:\AnimationLab\pipeline\bin\animpipe.ps1" init "G:\AnimationLab\projects\my_short" --template hybrid --id my_short --title "My What-If Short"

# 3. Render shots + narration + WhisperX alignment + SFX + ASS subtitles + MP4 + QC
powershell -ExecutionPolicy Bypass -File "G:\AnimationLab\pipeline\bin\animpipe.ps1" render "G:\AnimationLab\projects\my_short"

# 4. Useful flags
#   --force         Bypass shot cache and re-render every shot
#   --draft         Render half-size into out/draft, with a separate work/draft cache
#   --no-whisperx   Use proportional word timing instead of CUDA Wav2Vec2 alignment
#   --allow-red-qc  Keep output even if film_gate.py returns a red verdict

# 5. Re-run FFprobe + decode + contact sheet + film_gate QC on an existing render
powershell -ExecutionPolicy Bypass -File "G:\AnimationLab\pipeline\bin\animpipe.ps1" qc "G:\AnimationLab\projects\my_short"
```

---

## 2. Directory Layout

```text
G:\AnimationLab\pipeline\
├── bin\animpipe.ps1             # CLI wrapper sourcing launchers\env_common.ps1
├── setup_pipeline.ps1           # Idempotent Kokoro weight & Python check + doctor
├── cli.py                       # Main orchestrator: doctor, init, render, qc
├── core\                        # Shared WebGL2 & Canvas2D modules
│   ├── postprocess.js           # HalfFloat HDR render target, DOF, 18-tap bloom, ACES Filmic, vignette
│   ├── assets.js                # 3D-space FBM procedural Earth, Fresnel glow, Doppler accretion disc, dipoles
│   ├── camera.js                # C1 Catmull-Rom splines, damped shake, 9:16 aspect-aware framing helpers
│   ├── overlay_hud.js           # Shorts-safe broadcast HUD (12.5% right rail guard, stat card, callouts)
│   ├── anime_rig.js             # Legacy Canvas2D action blocking and compatible episodes
│   ├── cel_humanoid.js          # Skinned VRM 0.x cel characters, world-space limb IK and expression morphs
│   └── timeline.py              # Canonical frame counts for narration, SFX and assembly
├── renderers\
│   ├── render_web_shot.mjs      # Deterministic frame-stepped Playwright+Chromium capture -> libx264
│   ├── shot_harness.html        # ES-module canvas/WebGL harness driving window.renderFrame(idx)
│   └── adapters.py              # External Godot 4.7.2 Movie Maker & Blender 5.2.2 headless adapters
├── audio\
│   ├── tts_kokoro.py            # Offline Kokoro ONNX TTS + frame-quantized shot duration auto-extension
│   ├── align_whisperx.py        # Per-take CUDA Wav2Vec2 word alignment cached by take SHA-256
│   ├── build_ass_subtitles.py   # Monotonic multi-word karaoke ASS captions (22.5% bottom, 12.5% right margin)
│   ├── synth_sfx.py             # Seeded effects, narration ducking and true-peak-aware EBU R128 mastering
│   └── lipsync_rhubarb.py       # Optional Rhubarb 1.14.0 phoneme mouth cues (X, A-H)
├── vendor\three\                # Offline vendored Three.js 0.170.0 (MIT) + GLTFLoader + BufferGeometryUtils
├── templates\                   # Starting scaffolds: explainer3d, anime2d, hybrid
├── demos\                       # Verified production benchmarks:
│   ├── demo_01_3d_explainer\    # 3D Earth magnetosphere collapse explainer
│   ├── demo_02_anime_action\    # 2D IK anime coil, strike & impact transformation
│   ├── demo_03_integrated_short\# Hybrid Black Hole (web3d -> anime2d -> web3d)
│   └── demo_04_signal_break\    # Rigged cel anime action proof of concept
├── README.md                    # This user guide
├── ARCHITECTURE_REVIEW.md       # Honest multi-engine architectural evaluation & known limits
├── BENCHMARKS.md                # Measured Round 1->2->3 benchmarks & 60s projections
└── LICENSES_AND_DEPS.md         # Exact binary/library versions & licenses
```

---

## 3. `episode.json` Schema

Top-level episode configuration:

```json
{
  "episode_id": "demo_03_integrated_short",
  "title": "What If You Fell Into a Black Hole?",
  "width": 1080,
  "height": 1920,
  "fps": 30,
  "voice": "am_michael",
  "voice_speed": 1.08,
  "subtitle_words": 3,
  "audio_mood": "cosmic",
  "allow_blue_purple": true,
  "sfx_cues": [],
  "shots": [ ... ]
}
```

### Top-Level Fields
- `episode_id` *(string)*: Output filename stem (`out/<episode_id>.mp4`).
- `width`, `height`, `fps` *(int)*: Target dimensions and framerate (defaults `1080×1920 @ 30`).
- `voice` *(string)* / `voice_speed` *(float)*: Kokoro voice preset (e.g. `am_michael`, `af_bella`) and playback speed (`1.08`).
- `subtitle_words` *(int)*: Words grouped per karaoke ASS event (default `3`).
- `audio_mood` *(string)*: Procedural background ambient bed mood (`cosmic`, `tense`, etc.).
- `allow_blue_purple` *(bool)*: When `true`, passes `--allow-blue-purple "Space/sci-fi night scene palette"` to `film_gate.py` so legitimate outer-space/night scenes are graded purely on motion and blank-frame defects rather than blue/purple heuristics.
- `sfx_cues` *(array)*: Optional episode-level cues anchored in absolute seconds (`at_sec`).

### Per-Shot Fields
```json
{
  "id": "shot_01_horizon",
  "engine": "web3d",
  "scene_module": "scenes/shot_01_horizon.js",
  "duration_sec": 4.2,
  "narration": "Cross the event horizon, and glowing plasma orbits faster than the eye can track.",
  "transition": { "type": "fadeblack", "duration_sec": 0.20 },
  "sfx_cues": [
    { "at_norm": 0.04, "type": "whoosh", "duration_sec": 1.1, "gain": 0.50 },
    { "at_sec": 1.25, "type": "ui", "duration_sec": 0.4, "gain": 0.40 }
  ],
  "params": { "badge": "SINGULARITY // 10 SOLAR MASS", "title": "EVENT HORIZON" }
}
```

- `engine`: `"web3d"` (Three.js HDR composer + optional 2D HUD overlay), `"anime2d"` (Canvas2D rig + HUD), `"godot"` (`godot_project` + optional `scene_path`), or `"blender"` (`blender_script`).
- `duration_sec`: Base visual duration; automatically extended to `ceil((lead_in + speech_dur + tail_pad) * fps) / fps` whenever `narration` requires more time.
- `transition`: `{ "type": "cut" | "fade" | "fadeblack" | "smoothleft" | ..., "duration_sec": float }`. The overlap starts at the end of the outgoing shot minus the transition frames. Duration rounds to the nearest frame, e.g. 0.22 s becomes 7 frames at 30 fps. Each shot must retain at least one frame outside its incoming/outgoing overlaps.
- `sfx_cues`: Supports `"at_norm"` (0..1 fraction of actual probed shot duration) OR `"at_sec"` (seconds relative to shot start), `"type"` (`whoosh`, `impact`, `charge`, `electric`, `ui`, etc.), `"duration_sec"`, and `"gain"`.
- `params`: Arbitrary JSON passed into `initShot(ctx)` alongside `shot` runtime timeline fields (`_start_sec`, `_total_sec`, `_frames`).

---

- `render_dependencies`: Optional extra files or directories outside the episode whose contents affect a shot. Local episode assets and the shared renderer sources are tracked automatically.

## 4. Writing Scene Modules (`web3d` / `anime2d`)

Each JS module exports an async or sync `initShot(ctx)` factory. The capture loop supplies an exact frame index and the corresponding time in seconds.

```js
export async function initShot({ glCanvas, hudCanvas, width, height, fps, shot, params }) {
  const totalFrames = shot._frames;
  return {
    renderFrame(frameIdx, seconds) {
      const progress = frameIdx / Math.max(1, totalFrames - 1);
      // Drive character poses and camera from frameIdx / seconds.
    }
  };
}
```

- Always use deterministic PRNG (`createSeededRng`) instead of `Math.random()`.
- Do **not** rely on `requestAnimationFrame` or wall-clock `Date.now()`; Playwright steps every frame sequentially via `window.renderFrame(idx)`.
- Keep interactive subject framing and text out of the bottom `22.5%` caption zone and right `12.5%` Shorts rail.
- Always run heavy renders sequentially (one episode at a time) on 16 GB RAM systems.


## 5. Character production and external engines

Use the [Signal Break source](demos/demo_04_signal_break/episode.json) for a complete Three.js shot example. The rig accepts an unscaled VRM 0.x humanoid with embedded textures and standard limbs. Bind poses drive the cel mesh, world-space hand and foot targets drive IK, and VRM expression groups drive the face. The demo authors poses and spring-bone offsets on the frame clock. Read the [project-local director skill](../.agents/skills/anime-shorts-director/SKILL.md) and [specialist pack guide](../docs/ANIMATION_SKILLS.md) for shot and renderer selection.

Godot requires `project.godot` at the root of `godot_project`. Set `scene_path` to a project-relative path or a `res://` URI when the shot needs a different scene. The adapter imports a temporary project copy headlessly and captures with the project's graphics renderer. A shot script can find `--animpipe-config` and its path via `OS.get_cmdline_user_args()`, then read a JSON object with width, height, fps, frames, and params.

Blender receives the shot configuration filename after `--`. The JSON has width, height, fps, frames, frames_dir, and params. Write `f_0001.png` and subsequent numbered frames into frames_dir. If the shot specifies `blend_file`, it loads before the shot script. The adapter rejects missing frames and reports Python failures.

The adapters publish limited-range SDR BT.709 shots. Use SDR display-referred frames and a reference swatch when moving a look across engines. Match key light, palette and contrast in the scenes themselves. FFmpeg normalizes dimensions, frame rate, timebase, square pixels and pixel format before stitching. For crossfades it resets shot PTS and applies FPS before timebase normalization, so `xfade` receives constant-frame-rate input.

Audio mastering measures loudness and true peak, then applies one linear gain stage with a −2.3 dBTP ceiling before AAC. A transient-heavy mix can land below −14 LUFS. Adjust cue or bed levels to change that balance.

See [production upgrade notes](PRODUCTION_UPGRADE.md) for the technical verification and limitations.
