# AnimationLab Pipeline — Measured Benchmarks (`1080×1920 @ 30 fps`)

**Test Machine:** Windows 11 Pro (`C:\` 12.54 GB free, `G:\` 58.58 GB free), Intel i5-12400F, 15.84 GB RAM, NVIDIA RTX 4060 8 GB (CUDA 12.8). All renders executed **sequentially**.

---

## 1. Final Round 3 Benchmarks (Direct `out/benchmark.json` Observations)

| Demo | Engines | Duration | Total Wall Time | Capture Speed (per shot) | Audio Time & Method | Final MP4 Size / Bitrate | Peak VRAM (Baseline -> Peak / Δ) |
| --- | --- | :---: | :---: | --- | --- | :---: | :---: |
| **`demo_01_3d_explainer`** | `web3d` × 2 | `11.767s` | **`52.94s`** | `17.35 fps` (204f in `11.756s`)<br>`15.51 fps` (155f in `9.993s`) | `9.23s` (`whisperx_wav2vec2_cuda_pertake`, 27 words) | **`5,084,989 B`** (`4.85 MiB`, ~3.46 Mbps) | `2946 -> 3619 MB` (**`+673 MB`**) |
| **`demo_02_anime_action`** | `anime2d` × 2 | `6.000s` | **`15.38s`** | `22.08 fps` (84f in `3.804s`)<br>`22.69 fps` (96f in `4.230s`) | `0.48s` (`none`, SFX+music only, 0 words) | **`2,780,700 B`** (`2.65 MiB`, ~3.71 Mbps) | `2747 -> 2954 MB` (**`+207 MB`**) |
| **`demo_03_integrated_short`** | `web3d` -> `anime2d` -> `web3d` | `16.480s` | **`52.04s`** | `23.23 fps` (174f in `7.489s`)<br>`20.75 fps` (156f in `7.519s`)<br>`21.62 fps` (177f in `8.185s`) | `9.11s` (`whisperx_wav2vec2_cuda_pertake`, 42 words) | **`6,115,816 B`** (`5.83 MiB`, ~2.97 Mbps) | `2749 -> 3362 MB` (**`+613 MB`**) |

*(Node host RSS stayed `116.2–124.7 MB` across all captured shots; browser renderer/GPU and FFmpeg child processes add transient memory within the 8 GB VRAM / 15.84 GB RAM envelope.)*

---

## 2. Audio Mastering & QC Metrics (Round 3)

| Demo | R128 Input Integrated / True Peak | R128 Output Integrated / True Peak / LRA | Mode Reported | `film_gate.py` Verdict & Key Telemetry |
| --- | :---: | :---: | :---: | --- |
| **`demo_01_3d_explainer`** | `-19.28 LUFS` / `-0.72 dBTP` | **`-14.20 LUFS`** / `-1.50 dBTP` / `4.30 LU` | `dynamic` *(see Note 1)* | `pass` (`yellow`) — `blank=0.0s`, `still=0.0`, `fast=0.058`, `drift=0.08`, `blue_purple=0.0` (2 shots) |
| **`demo_02_anime_action`** | `-19.01 LUFS` / `-0.72 dBTP` | **`-14.22 LUFS`** / `-1.50 dBTP` / `2.10 LU` | `dynamic` *(see Note 1)* | `pass` (`yellow`) — `blank=0.0s`, `still=0.0`, `fast=0.1324`, `drift=0.162`, `blue_purple=0.167` (3 cuts) |
| **`demo_03_integrated_short`** | `-19.31 LUFS` / `-0.75 dBTP` | **`-14.25 LUFS`** / `-1.50 dBTP` / `4.30 LU` | `dynamic` *(see Note 1)* | `pass` (`yellow`) — `blank=0.0s`, `still=0.0`, `fast=0.100`, `drift=0.395`, `blue_purple=0.152` (5 cuts, `--allow-blue-purple`) |

> **Note 1 (`loudnorm` Mode):** Pre-mastering currently normalizes `pre_master_mix.wav` peak to `0.92` (`-0.72 dBTP`), leaving insufficient headroom for linear `+5.0 dB` boost to `-14 LUFS` at `-1.5 dBTP`, so FFmpeg automatically switches `linear=true` -> `"dynamic"`.

---

## 3. Iteration Progress Across Optimization Rounds

| Demo | Round 1 Baseline | Round 2 Overhaul | Round 3 Final | Key Optimization Impact |
| --- | --- | --- | --- | --- |
| **`demo_01_3d_explainer`** | `8.05s`, `76.2 MiB` (`79.44 Mbps`), heavy grain + slow capture | `11.70s`, `16.33 MiB`, `50.52s` wall (`17.48 / 17.18 fps`), `-14.49 LUFS` | **`11.767s`, `4.85 MiB` (`3.46 Mbps`), `52.94s` wall (`17.35 / 15.51 fps`), `-14.20 LUFS`** | HDR `samples:0` + JPEG q96 cut capture time ~10× vs PNG/MSAA; `-crf 22 -maxrate 7M` + `uGrain=0.001` cut bitrate >20× |
| **`demo_02_anime_action`** | `6.20s`, `6.6 MiB` (`8.89 Mbps`) | `6.20s`, `3.33 MiB`, `17.91s` wall (`21.10 / 20.32 fps`), `film_gate: green` | **`6.000s`, `2.65 MiB` (`3.71 Mbps`), `15.38s` wall (`22.08 / 22.69 fps`)** | Outward knee IK, seamless limbs, frame-quantized timing (`6.000s`), true-PTS contact sheet |
| **`demo_03_integrated_short`** | `12.0s`, `102.3 MiB` (`71.50 Mbps`), `film_gate: red` | `16.40s`, `20.40 MiB`, `58.91s` wall (`18.22 / 19.53 / 18.95 fps`), `-14.98 LUFS` | **`16.480s`, `5.83 MiB` (`2.97 Mbps`), `52.04s` wall (`23.23 / 20.75 / 21.62 fps`), `-14.25 LUFS`** | Fixed HUD fade ghosting, pulled BH framing inside 9:16 margins, added cosmic `tidal` float pose, enabled `--allow-blue-purple` |

---

## 4. 60-Second Production Short Projection (`1,800 frames @ 30 fps`)

Extrapolating linearly from observed Round 3 per-frame render rates plus fixed audio/assembly overheads (uncached cold render):

- **Pure 3D Explainer (`web3d` at observed `~15.5–23.2 fps`):**
  - Frame capture (`1,800` frames): `~78–116s`
  - Audio + WhisperX CUDA (`~9–12s` scaling modestly with word count) + FFmpeg assembly & QC (`~18–25s`): `~27–37s`
  - **Estimated total wall time for a 60s `web3d` Short:** **`~105–155 seconds` (~1.8–2.6 minutes)**, producing a `~22–28 MiB` H.264 MP4 at `-crf 22 -maxrate 7M`.
- **Hybrid 3D + 2D Short (`web3d` + `anime2d` at `~20.8–23.2 fps`):**
  - **Estimated total wall time for a 60s hybrid Short:** **`~105–130 seconds` (~1.7–2.2 minutes)**.
- **Cached Re-Render (only 1 of 8 shots edited):** Unedited shots skip capture via SHA-256 dirty checking (`[SKIP]`), cutting iteration to **~15–25 seconds**.
