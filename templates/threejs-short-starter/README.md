# Three.js + Canvas2D/HTML Short Starter (`1080×1920 @ 30 FPS`)

Zero-duplicate-dependency production starter using:
- Local `vendor/three.module.min.js` (WebGL2)
- Crisp HTML/CSS/Canvas2D HUD + WhisperX-ready caption beat overlay (`storyboard.example.json`)
- Deterministic Playwright (`sandboxes/pixi-suite`) hardware ANGLE GPU capture piped directly into FFmpeg (no temp PNG bloat on disk)

## Render
```powershell
. "G:\AnimationLab\launchers\env_common.ps1"
node "G:\AnimationLab\templates\threejs-short-starter\render.mjs"
```

Optional flags:
- `--frames 150` — render first N frames
- `--fps 30` — target frame rate
- `--audio "path\to\narration.wav"` — mux voiceover/SFX track
- `--out "path\to\output.mp4"` — output path
