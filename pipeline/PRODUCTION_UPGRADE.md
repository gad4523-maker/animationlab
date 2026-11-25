# AnimationLab production upgrade

## Signal Break

A 10-second original sequence in a transit relay tunnel. A courier tracks an amber drone, gathers a charge, disables it with a cyan discharge, and holds her stance as it drops. The edit uses a threat reveal, a face close-up, a two-body action frame, and a reverse recovery shot. The contact lands on frame 174 (5.800 s). The character holds that pose through frame 178 while sparks, light and camera motion continue.

| Deliverable | Path |
| --- | --- |
| Playable H.264/AAC master | [signal_break.mp4](demos/demo_04_signal_break/out/signal_break.mp4) |
| Four before/after beat comparisons | [before-after.jpg](demos/demo_04_signal_break/out/before-after.jpg) |
| Ten exact action frames | [action-frames.jpg](demos/demo_04_signal_break/out/action-frames.jpg) |
| Editable episode, scene and stage | [episode.json](demos/demo_04_signal_break/episode.json), [scene.js](demos/demo_04_signal_break/scene.js), [stage.js](demos/demo_04_signal_break/stage.js) |
| Technical measurements | [benchmark.json](demos/demo_04_signal_break/out/benchmark.json) |
| Codex skill | [anime-shorts-director](../.agents/skills/anime-shorts-director/SKILL.md) |
| Model provenance | [CREDITS.md](demos/demo_04_signal_break/assets/CREDITS.md) |

## Decisions and changes

- **Character pipeline.** Three.js and the installed Chromium/ANGLE renderer gave the shot a working camera, depth-tested VFX, and controlled cel lighting without a second render path. The reusable [cel humanoid module](core/cel_humanoid.js) loads a skinned VRM 0.x model with an embedded bone map and textures. It provides two-bone IK, pose offsets, finger curls, VRM facial morphs and authored motion on secondary bones. Signal Break uses the CC0 Darkness Shibu model with a revised palette. The transit tunnel, drone, action, effects and soundtrack were authored in the project. The active pipeline’s no-generated-images/no-generated-video policy governed production. An earlier ranking report describes a more permissive research policy.
- **Engine selection.** The lab has working Rigby2D 0.6.0 and a PixiJS 8 sandbox. Their weighted 2D workflow fits layered art and shallow moves. This episode needed steep camera changes, a moving target at another depth, and a rig already licensed for reuse. Blender remains useful for deforming 3D assets and offline rendering, and Godot remains useful for game-engine scenes. The Canvas2D entry point still renders existing episodes and can block poses for new work.
- **Cache.** Shot keys include resolved frame count, shot start, episode duration, local files, shared renderer inputs, and declared external render dependencies. Draft output and state live under their own subdirectories. Staging, validation and the Windows render lock protect prior output if a render fails. Existing cache entries rebuild when their keys change. Replaced source files have a rollback copy in `.cache/production-upgrade-rollback`.
- **Clock and compositing.** One integer frame plan drives narration, cues, subtitles, and transitions. The assembly graph normalizes input size, frame rate, timebase, aspect, pixel format and SDR transport before `xfade` or a cut. The browser path explicitly converts full-range JPEG to limited-range BT.709. The adapter transport matches equivalent swatches. Creative palette and lighting still need scene-level matching. [FFmpeg filter documentation](https://ffmpeg.org/ffmpeg-filters.html#xfade)
- **Engine adapters.** Godot imports a temporary project copy, receives the chosen scene and optional JSON parameters, and records through the graphics renderer. This keeps generated UID files out of the source project. Blender can load an optional `.blend`, passes a render config to the script, propagates Python errors and checks that the numbered PNG sequence is complete. Both adapters check output geometry, cadence and frame count. [Godot Movie Maker documentation](https://docs.godotengine.org/en/stable/tutorials/animation/creating_movies.html)
- **Audio and captions.** WhisperX caches successful takes by audio content, text and timing. A failed or partial alignment can provide proportional captions and will retry on the next forced-alignment run. Explicit proportional mode has its own cache semantics. The mix uses float PCM before applying metered linear gain with a −2.3 dBTP ceiling before AAC. Cue gain and ambience were adjusted for Signal Break. Captions split wide groups, respect the project margins and stop at the episode boundary.
- **Directing skill.** The attached audit served as research, and the upstream documents were reviewed for specific techniques and licensing. The local skill integrates shot staging and rhythm from iart-ai, look development from mromidev, frame-derived loops from AnastasiyaW, and pose review from RobLe3. It adds project-specific guidance for 9:16 framing, anticipation, hitstop, smear, sound sync, and loop verification. No external skill installers or workflow hooks were run. Open Codex at the AnimationLab root and invoke `$anime-shorts-director`. [Pinned research and licenses](../.agents/skills/anime-shorts-director/references/quality-pass.md)

## Verification

| Check | Observed result |
| --- | --- |
| Environment | Doctor passed on Windows with RTX 4060, Blender 5.2.2, Godot 4.7.2, FFmpeg 8.0 and CUDA-enabled PyTorch 2.8. |
| Signal Break | 1080×1920, 30 FPS, 300 frames, 10.000 s video and audio, 6,231,636 bytes, limited-range BT.709 H.264 and stereo 48 kHz AAC. Full decode with errors treated as failures. |
| Render performance | 41.65 s wall time for the final full render. Sampled GPU memory rose by 765 MiB from its baseline during the run. |
| Sound | PCM master measured −16.74 LUFS and −2.30 dBTP. Final decoded AAC measured −16.80 LUFS and −2.81 dBTP. |
| Motion and visual review | Film gate passed green with four detected shots, 0.0 s blank runs and 0.0 still ratio. Reviewed comparison frames and exact frames through the prep, discharge, and fall. |
| Mixed engines | Blender → Godot → Chromium WebGL entry point → legacy Canvas entry point assembled as cut / fade / cut, 22 frames. The 0.055 s fade rounded to two frames. Frame samples confirmed the half blend and subsequent cut. A repeat reused all four shots. |
| Color swatches | Input RGB (61, 140, 196). Decoded patches measured Blender (59, 137, 195), Godot (59, 138, 191) and Chromium (58, 137, 192). |
| Legacy real project | An isolated copy of demo 03 rendered 494 frames, with 6- and 7-frame crossfades. Kokoro and CUDA WhisperX produced 42 timed words. Caption pixels sampled across the 540×960 draft fit within x=152–360, y=715–739, inside the project’s rail and bottom guides. Film gate passed yellow, with no blank or still runs. |
| Regression suite | Five tests passed for imported-asset and clock cache invalidation, WhisperX recovery, exact transition planning, caption bounds and audio true peak. JavaScript and Python parsed successfully. Skill frontmatter validation passed. |

Run from `G:\AnimationLab`.

```powershell
. .\launchers\env_common.ps1
& $Global:AI_CUDA_PYTHON pipeline/tests/test_production.py
& $Global:AI_CUDA_PYTHON pipeline/tests/smoke_engines.py
& $Global:AI_CUDA_PYTHON pipeline/cli.py render pipeline/demos/demo_04_signal_break
```

## Remaining production limits

The comparison pairs related beats from different scenes. The new rig shows stronger depth, individual fingers, facial changes and articulated cloth. It still reads as stylized 3D. Its sample outfit creases sharply in the deepest lunge and the fringe has small edge artifacts in the close-up. The final recovery has a relatively long settling beat. Signal Break ends on a hold with a cut back to the opening on replay.

For the next character short, prioritize a bespoke turn sheet, corrective skirt and shoulder weights, palm and finger poses for the extremes, and one additional reaction beat before recovery. A higher-fidelity capture option would let the lab test whether JPEG contributes to fine hair edges. The demonstrated renderer handles a local VRM 0.x subset. A production Rigby2D shot, reusable VRM 1.0 importer, contact-aware secondary motion and creative matching across more complex Godot and Blender scenes remain future work.
