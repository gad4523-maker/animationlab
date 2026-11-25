"""Render a 4-panel proof sheet (1440x1280) of the Master 3D Goku model for visual inspection."""
import math
import sys
from pathlib import Path
import bpy
from mathutils import Euler

BENCH_ROOT = Path(r"G:\AnimationLab\StyleBenchmark")
SHARED_DIR = BENCH_ROOT / "shared"
OUT_DIR = SHARED_DIR / "model_check"
sys.path.insert(0, str(SHARED_DIR))

from choreography import solve_choreography  # noqa: E402
from goku_3d_master import build_goku_3d, pose_goku_3d  # noqa: E402


def render_proof():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 720
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    if hasattr(scene.eevee, "taa_render_samples"):
        scene.eevee.taa_render_samples = 16

    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.06, 0.10, 0.22, 1.0)
    bg.inputs["Strength"].default_value = 1.1

    # Ground arena
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=4.0, depth=0.1, location=(0, 0, -0.05))
    fl = bpy.context.active_object
    m_fl = bpy.data.materials.new("Arena")
    m_fl.use_nodes = True
    m_fl.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.28, 0.24, 0.22, 1)
    fl.data.materials.append(m_fl)

    # Lights
    bpy.ops.object.light_add(type="SUN", location=(3, -4, 5))
    sun = bpy.context.active_object
    sun.data.energy = 2.6
    sun.rotation_euler = Euler((0.75, 0.2, -0.55), "XYZ")

    bpy.ops.object.light_add(type="AREA", location=(-2.0, 2.5, 2.5))
    rim = bpy.context.active_object
    rim.data.energy = 140.0
    rim.data.color = (0.55, 0.80, 1.0)
    rim.rotation_euler = Euler((-1.1, 0, 2.6), "XYZ")

    rig = build_goku_3d("Goku", style_mode="cel", outline_thickness=0.0032)

    cam_target = bpy.data.objects.new("CamTarget", None)
    bpy.context.scene.collection.objects.link(cam_target)
    bpy.ops.object.camera_add(location=(0, -3.2, 1.0))
    cam = bpy.context.active_object
    cam.data.lens = 42.0
    scene.camera = cam
    con = cam.constraints.new("TRACK_TO")
    con.target = cam_target
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"

    panels = [
        ("1_base_stance", 0.30, (0.45, -2.85, 0.95), (0, 0, 0.95), "1. Base Goku (t=0.3s)"),
        ("2_charge_roar", 2.20, (1.15, -2.35, 1.05), (0, 0, 1.02), "2. Charge Roar (t=2.2s)"),
        ("3_ssj_full", 3.10, (0.75, -2.65, 1.02), (0, 0, 0.98), "3. Super Saiyan Full (t=3.1s)"),
        ("4_ssj_closeup", 4.20, (0.38, -1.05, 1.62), (0, 0, 1.56), "4. SSJ Close-Up Face & Hair"),
    ]

    for pid, t, cam_pos, tgt_pos, label in panels:
        ch = solve_choreography(t)
        if pid == "2_charge_roar":
            ch["ssj"] = 0.0  # Keep base hair on charge check
        pose_goku_3d(rig, ch)
        cam.location = cam_pos
        cam_target.location = tgt_pos
        out_png = OUT_DIR / f"_3d_{pid}.png"
        scene.render.image_settings.file_format = "PNG"
        scene.render.filepath = str(out_png)
        bpy.ops.render.render(write_still=True)
    print("Saved 4 panel PNGs in", OUT_DIR)


if __name__ == "__main__":
    render_proof()
