"""Render 2 authentic Pixelorama pixel-art styles using perfected 2D Goku downsampled cleanly to crisp pixel grid -> Pixelorama CLI."""
import json
import subprocess
import sys
from pathlib import Path
from PIL import Image, ImageDraw

BENCH_ROOT = Path(r"G:\AnimationLab\StyleBenchmark")
SHARED_DIR = BENCH_ROOT / "shared"
sys.path.insert(0, str(SHARED_DIR))
from choreography import solve_choreography  # noqa: E402
from verify_video import verify_and_record  # noqa: E402

GODOT_BIN = r"G:\SPRITE ANIAIMTION\tools\Godot-4.7.2\Godot_v4.7.2-stable_win64_console.exe"
PIXELORAMA_REPO = r"G:\AnimationLab\character-tools\pixelorama"
FFMPEG = r"C:\Users\User\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ESBUILD = r"G:\AnimationLab\sandboxes\pixi-suite\node_modules\.bin\esbuild.cmd"
SFX_WAV = str(SHARED_DIR / "goku_ssj_sfx.wav")

WORK_DIR = BENCH_ROOT / "styles" / "pixelorama"
SPRITE_W, SPRITE_H = 108, 192
KEY_FRAMES = 30


def capture_crisp_master_frames() -> list[Image.Image]:
    """Use Playwright + drawGoku2DMaster to render 30 exact key frames at 108x192 crisp nearest-neighbor pixel grid."""
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    entry_js = WORK_DIR / "_px_entry.js"
    bundle_js = WORK_DIR / "_px_bundle.js"
    helper_mjs = WORK_DIR / "_px_capture.mjs"

    entry_js.write_text("""
import { solveChoreography } from '../../shared/choreography.js';
import { drawGoku2DMaster } from '../../shared/goku_2d_master.js';
window.renderPxKey = (t) => {
  let c = document.getElementById('c');
  if (!c) { c = document.createElement('canvas'); c.id = 'c'; c.width = 720; c.height = 1280; document.body.appendChild(c); }
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 720, 1280);
  drawGoku2DMaster(ctx, solveChoreography(t), 720, 1280);
  const sm = document.getElementById('sm') || (() => { const s = document.createElement('canvas'); s.id = 'sm'; s.width = 108; s.height = 192; return s; })();
  const sctx = sm.getContext('2d');
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(c, 0, 0, 108, 192);
  return sm.toDataURL('image/png');
};
""", encoding="utf-8")

    subprocess.run([ESBUILD, str(entry_js), "--bundle", "--format=iife", f"--outfile={bundle_js}"], shell=True, check=True)

    helper_mjs.write_text(f"""
import {{ createRequire }} from 'node:module';
import {{ mkdirSync, readFileSync, writeFileSync }} from 'node:fs';
const require = createRequire('G:\\\\AnimationLab\\\\sandboxes\\\\pixi-suite\\\\package.json');
const {{ chromium }} = require('playwright-core');
const dir = {json.dumps(str(WORK_DIR / '_px_keys'))};
mkdirSync(dir, {{ recursive: true }});
const browser = await chromium.launch({{ headless: true, executablePath: {json.dumps(CHROME_PATH)}, args: ['--no-sandbox'] }});
const page = await browser.newPage({{ viewport: {{ width: 720, height: 1280 }} }});
await page.setContent('<html><body style="margin:0"><script>' + readFileSync({json.dumps(str(bundle_js))}, 'utf8') + '</script></body></html>');
for (let k = 0; k < {KEY_FRAMES}; k++) {{
  const t = (k / ({KEY_FRAMES} - 1)) * 4.95;
  const du = await page.evaluate((tt) => window.renderPxKey(tt), t);
  writeFileSync(dir + '/k_' + String(k).padStart(3, '0') + '.png', Buffer.from(du.split(',')[1], 'base64'));
}}
await browser.close();
""", encoding="utf-8")

    subprocess.run(["node", str(helper_mjs)], check=True)
    key_dir = WORK_DIR / "_px_keys"
    return [Image.open(key_dir / f"k_{k:03d}.png").convert("RGBA") for k in range(KEY_FRAMES)]


def to_dmg_gameboy(img: Image.Image) -> Image.Image:
    dmg_pal = [(15, 56, 15), (48, 98, 48), (139, 172, 15), (155, 188, 15)]
    bayer = [[0, 2], [3, 1]]
    rgb = img.convert("RGB")
    out = Image.new("RGBA", rgb.size)
    px = rgb.load()
    opx = out.load()
    for y in range(rgb.height):
        for x in range(rgb.width):
            r, g, b = px[x, y]
            lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
            d = (bayer[y % 2][x % 2] - 1.5) * 0.12
            idx = int(max(0.0, min(0.999, lum + d)) * 4.0)
            c = dmg_pal[idx]
            opx[x, y] = (c[0], c[1], c[2], 255)
    return out


def render_pixelorama_style(style_id: str, raw_keys: list[Image.Image], dmg_mode: bool):
    gif_path = WORK_DIR / f"{style_id}_source.gif"
    sheet_path = WORK_DIR / f"{style_id}_sheet.png"
    out_mp4 = BENCH_ROOT / "videos" / f"{style_id}.mp4"

    frames = []
    for im in raw_keys:
        if dmg_mode:
            im2 = to_dmg_gameboy(im).resize((72, 128), Image.Resampling.NEAREST)
            frames.append(im2.convert("P", palette=Image.Palette.ADAPTIVE, colors=4))
        else:
            frames.append(im.convert("RGB").quantize(colors=24, method=Image.Quantize.MEDIANCUT))

    # Full-frame disposal=2, optimize=False so Pixelorama's GIF importer reads every frame cleanly!
    frames[0].save(gif_path, save_all=True, append_images=frames[1:], duration=167, loop=0, disposal=2, optimize=False)

    cmd = [
        GODOT_BIN, "--headless", "--path", PIXELORAMA_REPO, "--quit", "--",
        "--spritesheet", "--export", "--json", "--scale", "4",
        "--output", str(sheet_path), str(gif_path),
    ]
    subprocess.run(cmd, check=True)
    if not sheet_path.exists():
        raise RuntimeError(f"Pixelorama CLI failed to export {sheet_path}")

    meta_json = sheet_path.with_suffix(".json")
    sheet_img = Image.open(sheet_path).convert("RGBA")
    if meta_json.exists():
        meta = json.loads(meta_json.read_text(encoding="utf-8"))
        raw_frames = meta.get("frames", {})
        items = raw_frames.values() if isinstance(raw_frames, dict) else raw_frames
        frame_rects = [(fr["frame"]["x"], fr["frame"]["y"], fr["frame"]["w"], fr["frame"]["h"]) for fr in items]
    else:
        fw, fh = (72 if dmg_mode else SPRITE_W) * 4, (128 if dmg_mode else SPRITE_H) * 4
        cols = max(1, sheet_img.width // fw)
        frame_rects = [((i % cols) * fw, (i // cols) * fh, fw, fh) for i in range(KEY_FRAMES)]

    ff = subprocess.Popen([
        FFMPEG, "-y", "-loglevel", "error",
        "-f", "image2pipe", "-framerate", "30", "-c:v", "png", "-i", "-",
        "-i", SFX_WAV,
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart",
        str(out_mp4),
    ], stdin=subprocess.PIPE)

    for f in range(150):
        t = f / 30.0
        ch = solve_choreography(t)
        k_idx = min(len(frame_rects) - 1, int((t / 5.0) * len(frame_rects)))
        rx, ry, rw, rh = frame_rects[k_idx]
        crop = sheet_img.crop((rx, ry, rx + rw, ry + rh))
        view = crop.resize((720, 1280), Image.Resampling.NEAREST)
        if dmg_mode:
            dr = ImageDraw.Draw(view, "RGBA")
            for gx in range(0, 720, 10):
                dr.line([(gx, 0), (gx, 1280)], fill=(15, 56, 15, 34), width=1)
            for gy in range(0, 1280, 10):
                dr.line([(0, gy), (720, gy)], fill=(15, 56, 15, 34), width=1)
        view.convert("RGB").save(ff.stdin, format="PNG")

    ff.stdin.close()
    rc = ff.wait()
    if rc != 0:
        raise RuntimeError(f"ffmpeg failed with exit {rc}")
    verify_and_record(style_id)


if __name__ == "__main__":
    keys = capture_crisp_master_frames()
    render_pixelorama_style("pixelorama-hd-pixel-art", keys, dmg_mode=False)
    render_pixelorama_style("pixelorama-gameboy-dmg", keys, dmg_mode=True)
