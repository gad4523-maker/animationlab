# AnimationLab — specialist skill packs

These three optional, commit-pinned upstream Git submodules supplement `anime-shorts-director`. They are **references and workflows**, not preinstalled runtime tools. The production engine stack stays intact.

## Which one to load

| Need | Pack | Read first | Don't automatically inherit |
| --- | --- | --- | --- |
| Stiff movement, weak composition/color, camera rhythm, typography | [iart-ai/motion-design-skills](https://github.com/iart-ai/motion-design-skills) (MIT) | `.agents/upstream/motion-design-skills/skills/motion-art-direction/SKILL.md`, then `animation-principles`, `shot-composition`, `color-motion` or `beat-sync-editing` | After Effects/Remotion instructions when the shot uses another renderer |
| Hook, 50–60s narrative, clear payoff, shot progression and 2D-in-3D cinematic storytelling | [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts) (MIT) | `.agents/upstream/claude-animated-shorts/SKILL.md` and `references/STYLE_BIBLE.md` | Fixed 55–70s duration, painted-town look, source story, voice/music, or mandatory Remotion |
| Hero rigs, natural posing, Blender camera paths, lighting, cel shaders/compositing | [arjun988/blender-skills](https://github.com/arjun988/blender-skills) (MIT) | `.agents/upstream/blender-skills/.claude/skills/blender-director/SKILL.md`; choose `camera-cinematography`, `animation`, `anime-style`, `compositing`, or `asset-optimization` as needed | Blender MCP availability, untested add-ons, or a different pipeline render contract |

### Check out the packs on your Windows PC

From the **existing** AnimationLab Git checkout after updating to the new commit:

```powershell
git submodule sync --recursive
git submodule update --init .agents/upstream/motion-design-skills .agents/upstream/claude-animated-shorts .agents/upstream/blender-skills
```

A GitHub source ZIP doesn't contain submodule contents. The three slim routing skills under `.agents/skills/` help compatible coding agents find the upstream guides, once checked out. Avoid copying all 94 Blender specialties into the always-loaded active-skill directory. Read only the needed `SKILL.md` for a shot.

## Non-negotiable production rules

1. **Episode brief is authoritative.** Requested subject, style, engine, runtime (usually 50–60s for Shorts), narration, subtitles, format and pacing override upstream defaults. Never automatically turn a scene into a 67-second cartoon or mandate Remotion.
2. **Animate the scene.** Use real pose changes, camera motion, depth parallax, object dynamics, cuts, effects and sound. No finished AI-generated video shots; no slideshow of still images. AI-generated **individual sprites, sprite sheets, textures, backgrounds and other still components are allowed**, with provenance and usage rights recorded. A stricter episode asset policy wins.
3. **Make characters credible.** The legacy geometric Canvas2D rig is for blocking/prototypes and existing scenes. For recognizable hero characters prioritize licensed/authorized rigged GLB/VRM, fully layered Rigby2D sprites, or Blender rigs. Preserve identity, proportions, eyes, costume, contours, shadows and performance throughout the video.
4. **Use supported shot engines.** The manifest currently accepts `web3d`, `anime2d`, `godot`, and `blender`. Successful standalone PixiJS demos do **not** mean a native `pixi` manifest adapter exists. Integrate Pixi assets through supported shots or engineer a separate adapter later.
5. **Direct the camera intentionally.** Define focal target, lens, camera axis, depth planes, key light, anticipation/contact/recovery, easing and subtitles/UI-safe space. Inspect potential intersections, foot contact and eye direction where they matter.
6. **Handle dependencies responsibly.** The local RTX 4060/16 GB Windows system should run heavy browser/CUDA/Blender jobs sequentially. Download new libraries, sound FX, rigged assets and tools when justified; verify licenses, compatibility, performance, security and the existing alternatives first. Never overwrite local user projects.
7. **Separate working from beautiful.** Decode/QC passes don't guarantee polished acting. Visual review must consider silhouette, motion, rig deformation, VFX overlaps, camera, continuity, audio and subtitle clarity. Never claim to have watched or verified frames without doing so.

## Honest status

- Git submodules are pinned source references, **not** proof that Blender MCP, Remotion templates, external art assets, or every optional plugin is installed and works on your PC.
- Existing `G:\AnimationLab`-specific launchers, local GPU dependencies and model weights remain as originally designed.
- The lab's largest remaining quality bottleneck is actual character art and rigging, not the number of GitHub tools installed.
- Use [animationlab-portable](https://github.com/gad4523-maker/animationlab-portable) for CPU-only Gemini Tasks.
