"""Render real Chromium, Blender and Godot smoke frames through the normal CLI."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from cli import FFMPEG_BIN, render_shots_and_audio
from renderers.media import require_exact_video


BLENDER = """
import bpy
import json
from pathlib import Path
import sys

c = json.loads(Path(sys.argv[sys.argv.index('--')+1]).read_text())
scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.view_settings.view_transform = 'Standard'
scene.render.resolution_x, scene.render.resolution_y = c['width'], c['height']
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.display.shading.light = 'FLAT'
scene.display.shading.color_type = 'MATERIAL'
scene.display.shading.show_shadows = False
scene.display.shading.show_cavity = False
camera = scene.camera
camera.location = (0,0,8)
camera.rotation_euler = (0,0,0)
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 5
obj = bpy.data.objects.get('Cube')
obj.scale = (4,4,.01)
mat = bpy.data.materials.new('Test patch')
def linear(x):
    return ((x+.055)/1.055)**2.4 if x > .04045 else x/12.92
mat.diffuse_color = (*[linear(x/255) for x in c['params']['rgb']],1)
obj.data.materials.clear()
obj.data.materials.append(mat)
for i in range(1,c['frames']+1):
    scene.frame_set(i)
    scene.render.filepath = str(Path(c['frames_dir']) / f'f_{i:04}.png')
    bpy.ops.render.render(write_still=True)
"""

GODOT = """
extends Node2D
var swatch = Color.BLACK
func _ready():
    var args = OS.get_cmdline_user_args()
    var i = args.find("--animpipe-config")
    assert(i >= 0)
    var data = JSON.parse_string(FileAccess.get_file_as_string(args[i + 1]))
    assert(data.fps == 30 and data.frames == 6)
    var rgb = data.params.rgb
    swatch = Color8(rgb[0], rgb[1], rgb[2])
func _draw():
    draw_rect(Rect2(Vector2.ZERO, get_viewport_rect().size), swatch)
"""

WEB = """
export function initShot({glCanvas,width,height,params}) {
  const ctx = glCanvas.getContext('2d');
  return { renderFrame(i) {
    ctx.fillStyle = 'rgb(' + params.rgb.join(',') + ')';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = '#eee';
    ctx.fillRect(3+i*6,4,9,9);
  }};
}
"""


def pixel(path, frame=0):
    raw = subprocess.check_output([
        FFMPEG_BIN, "-v", "error", "-i", str(path), "-vf",
        f"select=eq(n\\,{frame}),crop=8:8:60:92,format=rgb24",
        "-frames:v", "1", "-f", "rawvideo", "-",
    ])
    return tuple(round(sum(raw[c::3])/64) for c in range(3))


def main():
    with tempfile.TemporaryDirectory(prefix="animpipe-engines-") as temp:
        folder = Path(temp)
        godot = folder / "godot"
        godot.mkdir()
        (godot / "project.godot").write_text("""
config_version=5
[application]
run/main_scene="res://default.tscn"
[display]
window/size/viewport_width=128
window/size/viewport_height=192
[rendering]
renderer/rendering_method="gl_compatibility"
""", encoding="utf-8")
        (godot / "default.tscn").write_text('[gd_scene format=3]\n[node name="Unused" type="Node2D"]\n', encoding="utf-8")
        (godot / "capture.tscn").write_text(
            '[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://capture.gd" id="1"]\n'
            '[node name="Capture" type="Node2D"]\nscript = ExtResource("1")\n', encoding="utf-8")
        (godot / "capture.gd").write_text(GODOT, encoding="utf-8")
        (folder / "shot.py").write_text(BLENDER, encoding="utf-8")
        (folder / "web.js").write_text(WEB, encoding="utf-8")
        rgb = [61, 140, 196]
        common = {"duration_sec": .20, "params": {"rgb": rgb}}
        episode = {
            "episode_id": "engines", "width": 128, "height": 192, "fps": 30,
            "allow_blue_purple": True, "shots": [
                {**common, "id": "a", "engine": "blender", "blender_script": "shot.py"},
                {**common, "id": "b", "engine": "godot", "godot_project": "godot", "scene_path": "res://capture.tscn",
                 "transition": {"type": "fade", "duration_sec": .055}},
                {**common, "id": "c", "engine": "web3d", "scene_module": "web.js", "params": {"rgb": [172, 64, 88]}},
                {**common, "id": "d", "engine": "anime2d", "scene_module": "web.js"},
            ],
        }
        (folder / "episode.json").write_text(json.dumps(episode), encoding="utf-8")
        render_shots_and_audio(folder, allow_red_qc=True)
        out = folder / "out" / "engines.mp4"
        require_exact_video(out, 128, 192, 30, 22)
        shot_path = folder / "work" / "shots"
        swatches = {name: pixel(shot_path / f"{name}.mp4") for name in "abd"}
        for name, observed in swatches.items():
            if max(abs(x-y) for x,y in zip(observed,rgb)) > 9:
                raise AssertionError((name, observed, rgb))
        fade_pixels = [pixel(out, i) for i in (9, 10, 11, 12, 15, 16, 21)]
        assert fade_pixels[0][0] < 70 and fade_pixels[2][0] in range(90, 147), fade_pixels
        assert fade_pixels[3][0] > 156 and fade_pixels[4][0] > 156 and fade_pixels[5][0] < 70, fade_pixels
        render_shots_and_audio(folder, allow_red_qc=True)
        cached = json.loads((folder / "out" / "benchmark.json").read_text())
        assert cached["cached_shots_count"] == 4, cached["cached_shots_count"]
        print(f"Mixed engines cut/fade/cut: 22 frames. Swatches {swatches}, fade pixels {fade_pixels}, cache hits 4/4.")


if __name__ == "__main__":
    main()


