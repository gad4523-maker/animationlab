"""Render all 8 distinct Blender 5.2.2 3D Goku Super Saiyan styles using the perfected goku_3d_master rig."""
import argparse
import math
import random
import subprocess
import sys
from pathlib import Path

import bpy
from mathutils import Euler

BENCH_ROOT = Path(r"G:\AnimationLab\StyleBenchmark")
SHARED_DIR = BENCH_ROOT / "shared"
sys.path.insert(0, str(SHARED_DIR))
from choreography import solve_choreography  # noqa: E402
from goku_3d_master import build_goku_3d, make_cel_material, make_translucent_aura_material, pose_goku_3d  # noqa: E402

FFMPEG = r"C:\Users\User\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
SFX_WAV = str(SHARED_DIR / "goku_ssj_sfx.wav")
TOTAL_FRAMES = 150
FPS = 30


def render_style(style_id: str):
    out_mp4 = BENCH_ROOT / "videos" / f"{style_id}.mp4"
    tmp_dir = BENCH_ROOT / "styles" / "blender" / f"_tmp_{style_id}"
    frames_dir = tmp_dir / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 720
    scene.render.resolution_y = 1280
    scene.render.resolution_percentage = 100
    scene.render.fps = FPS
    scene.frame_start = 1
    scene.frame_end = TOTAL_FRAMES
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    if hasattr(scene.eevee, "taa_render_samples"):
        scene.eevee.taa_render_samples = 16

    # World Sky
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if style_id == "blender-grease-pencil-25d":
        bg.inputs["Color"].default_value = (0.95, 0.91, 0.82, 1.0)
        bg.inputs["Strength"].default_value = 1.15
    elif style_id == "blender-cardboard-diorama":
        bg.inputs["Color"].default_value = (0.20, 0.15, 0.10, 1.0)
        bg.inputs["Strength"].default_value = 0.85
    elif style_id == "blender-paper-cutout-3d":
        bg.inputs["Color"].default_value = (0.06, 0.09, 0.20, 1.0)
        bg.inputs["Strength"].default_value = 0.90
    elif style_id == "blender-claymation":
        bg.inputs["Color"].default_value = (0.11, 0.14, 0.22, 1.0)
        bg.inputs["Strength"].default_value = 0.95
    else:
        bg.inputs["Color"].default_value = (0.04, 0.08, 0.20, 1.0)
        bg.inputs["Strength"].default_value = 1.05

    # Lighting
    bpy.ops.object.light_add(type="SUN", location=(3.0, -4.0, 5.5))
    sun = bpy.context.active_object
    sun.data.energy = 2.6 if style_id != "blender-cardboard-diorama" else 3.4
    sun.rotation_euler = Euler((0.75, 0.2, -0.55), "XYZ")

    bpy.ops.object.light_add(type="AREA", location=(-2.0, 2.5, 2.5))
    rim = bpy.context.active_object
    rim.data.energy = 150.0
    rim.data.color = (0.45, 0.78, 1.0)
    rim.rotation_euler = Euler((-1.1, 0, 2.6), "XYZ")

    bpy.ops.object.light_add(type="POINT", location=(0, -0.2, 1.1))
    ki_light = bpy.context.active_object
    ki_light.data.color = (1.0, 0.84, 0.20)
    ki_light.data.energy = 0.0

    # Style mode parameters for perfected Master 3D Goku
    style_cfg = {
        "blender-cel-anime-3d": dict(mode="cel", outline=0.0032, bsc=18.0, bst=0.0),
        "blender-low-poly-3d": dict(mode="cel", outline=0.0, bsc=18.0, bst=0.0),
        "blender-claymation": dict(mode="clay", outline=0.0, bsc=24.0, bst=0.22),
        "blender-cardboard-diorama": dict(mode="cardboard", outline=0.0018, bsc=26.0, bst=0.30),
        "blender-paper-cutout-3d": dict(mode="paper", outline=0.0016, bsc=16.0, bst=0.14),
        "blender-voxel-3d": dict(mode="cel", outline=0.0, bsc=18.0, bst=0.0),
        "blender-stylized-pbr": dict(mode="pbr", outline=0.0, bsc=18.0, bst=0.04),
        "blender-grease-pencil-25d": dict(mode="cel", outline=0.0052, bsc=18.0, bst=0.0),
    }[style_id]

    rig = build_goku_3d(
        "Goku",
        style_mode=style_cfg["mode"],
        outline_thickness=style_cfg["outline"],
        bump_scale=style_cfg["bsc"],
        bump_strength=style_cfg["bst"],
    )

    # Apply style-specific geometric modifiers cleanly onto the perfected rig
    char_objs = [rig["body"], rig["head"], rig["hair_base"], rig["hair_ssj"]]
    if style_id == "blender-low-poly-3d":
        for o in char_objs:
            for p in o.data.polygons:
                p.use_smooth = False
            dec = o.modifiers.new("LowPoly", "DECIMATE")
            dec.ratio = 0.55
    elif style_id == "blender-claymation":
        for o in char_objs:
            sub = o.modifiers.new("ClaySub", "SUBSURF")
            sub.levels = 1
            sub.render_levels = 1
    elif style_id == "blender-cardboard-diorama":
        rig["rig"].scale = (1.0, 0.45, 1.0)
        for o in char_objs:
            for p in o.data.polygons:
                p.use_smooth = False
    elif style_id == "blender-paper-cutout-3d":
        rig["rig"].scale = (1.0, 0.22, 1.0)
        for o in char_objs:
            for p in o.data.polygons:
                p.use_smooth = False
    elif style_id == "blender-voxel-3d":
        for o in char_objs:
            rem = o.modifiers.new("Voxel", "REMESH")
            rem.mode = "BLOCKS"
            rem.octree_depth = 5
            for p in o.data.polygons:
                p.use_smooth = False

    # Namek Crater Arena Floor + Levitating Boulders
    bpy.ops.mesh.primitive_cylinder_add(vertices=36, radius=6.5, depth=0.12, location=(0, 0, -0.06))
    floor = bpy.context.active_object
    m_floor = make_cel_material(
        "Mat_ArenaFloor",
        (0.18, 0.14, 0.13, 1),
        (0.34, 0.28, 0.25, 1) if style_id != "blender-cardboard-diorama" else (0.58, 0.44, 0.28, 1),
        (0.45, 0.38, 0.34, 1),
        rim_strength=0.0,
        style_mode=style_cfg["mode"],
        bump_scale=20.0,
        bump_strength=0.25 if style_id in ("blender-claymation", "blender-cardboard-diorama") else 0.0,
    )
    floor.data.materials.append(m_floor)

    m_rock = make_cel_material("Mat_CraterRock", (0.20, 0.16, 0.16, 1), (0.40, 0.34, 0.32, 1), (0.55, 0.48, 0.44, 1), rim_strength=0.1, style_mode=style_cfg["mode"])
    rng = random.Random(42)
    rocks = []
    for i in range(14):
        ang = (i / 14.0) * math.tau
        rad = 1.25 + rng.uniform(0.0, 0.8)
        bx, by = math.cos(ang) * rad, math.sin(ang) * rad
        bz = 0.05 + rng.uniform(0.0, 0.05)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=rng.uniform(0.09, 0.17), location=(bx, by, bz))
        rk = bpy.context.active_object
        rk.scale = (1.1, 0.9, 0.7)
        rk.data.materials.append(m_rock)
        if style_id == "blender-voxel-3d":
            rm = rk.modifiers.new("VoxR", "REMESH")
            rm.mode = "BLOCKS"
            rm.octree_depth = 3
        rocks.append((rk, bx, by, bz, rng.uniform(0.3, 1.0), rng.uniform(0, 6.28)))

    # Expanding Shockwave Torus + Jagged 3D Lightning
    m_sw = make_translucent_aura_material("Mat_Shockwave", (1.0, 0.92, 0.35, 1.0))
    bpy.ops.mesh.primitive_torus_add(major_segments=32, minor_segments=10, major_radius=1.0, minor_radius=0.05, location=(0, 0, 0.45))
    shock_ring = bpy.context.active_object
    shock_ring.data.materials.append(m_sw)
    shock_ring.scale = (0.001, 0.001, 0.001)

    m_bolt = make_cel_material("Mat_Bolt", (0.5, 0.9, 1, 1), (0.7, 0.96, 1, 1), (1, 1, 1, 1), rim_strength=0, emission_strength=6.0, emission_col=(0.55, 0.92, 1, 1), style_mode="cel")
    bolts = []
    for b in range(4):
        bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=0.025, radius2=0.004, depth=0.65, location=(0, 0, 1.0))
        bo = bpy.context.active_object
        bo.data.materials.append(m_bolt)
        bo.scale = (0.001, 0.001, 0.001)
        bolts.append(bo)

    # Camera + Target
    cam_target = bpy.data.objects.new("CamTarget", None)
    cam_target.location = (0, 0, 1.0)
    scene.collection.objects.link(cam_target)
    bpy.ops.object.camera_add(location=(0, -3.5, 0.8))
    cam = bpy.context.active_object
    cam.data.lens = 40.0
    if style_id == "blender-paper-cutout-3d":
        cam.data.dof.use_dof = True
        cam.data.dof.focus_object = cam_target
        cam.data.dof.aperture_fstop = 2.8
    scene.camera = cam
    con = cam.constraints.new("TRACK_TO")
    con.target = cam_target
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"

    # Render 150 frames directly via per-frame pose_goku_3d evaluation (guaranteed clean visibility & zero stale keys!)
    step_quant = 3 if style_id == "blender-claymation" else 1
    scene.render.image_settings.file_format = "PNG"

    for f in range(1, TOTAL_FRAMES + 1):
        qf = ((f - 1) // step_quant) * step_quant + 1
        t = (qf - 1) / FPS
        ch = solve_choreography(t)
        pose_goku_3d(rig, ch)

        # Camera orbit, pitch, pullback & explosion shake
        dist = ch["camDist"] * 2.55
        yaw = math.radians(ch["camYaw"])
        pitch = math.radians(ch["camPitch"])
        cam.location = (
            math.sin(yaw) * math.cos(pitch) * dist + ch["shakeX"] * 1.3,
            -math.cos(yaw) * math.cos(pitch) * dist,
            1.02 + math.sin(pitch) * dist + ch["camY"] * 1.1 + ch["shakeY"] * 1.1,
        )
        cam_target.location = (ch["shakeX"] * 0.3, 0.0, 0.98 - ch["crouch"] * 0.10 + ch["shakeY"] * 0.3)

        # Dynamic Sky tint & Ki light
        ssj = ch["ssj"]
        if style_id not in ("blender-grease-pencil-25d", "blender-cardboard-diorama"):
            bg.inputs["Color"].default_value = (
                0.04 + 0.10 * ssj,
                0.08 + 0.06 * ssj,
                0.20 - 0.14 * ssj,
                1.0,
            )
        ki_light.data.energy = ch["auraPower"] * (180.0 + 380.0 * ch["explosionBurst"])

        # Shockwave & Levitating Rocks & Lightning
        sw = ch["shockwaveP"]
        if 0.005 < sw < 0.98:
            sr = 0.2 + sw * 3.8
            shock_ring.scale = (sr, sr, max(0.05, (1.0 - sw) * 0.8))
        else:
            shock_ring.scale = (0.001, 0.001, 0.001)

        for rk, bx, by, bz, spd, ph in rocks:
            lift = max(0.0, (ch["charge"] - 0.25) / 0.75) ** 1.4 * (0.22 + 0.50 * spd)
            rk.location = (bx * (1.0 + sw * 0.5), by * (1.0 + sw * 0.5), bz + lift + math.sin(t * 3.5 + ph) * 0.04)
            rk.rotation_euler = Euler((ph + t * ch["charge"] * 1.4, ph * 0.7 + t * ch["charge"], 0), "XYZ")

        active_bolts = ch["charge"] > 0.35 or ssj > 0.5
        for bi, bo in enumerate(bolts):
            if active_bolts and ((qf + bi * 3) % 4 != 0):
                ang = qf * 1.7 + bi * 1.57
                bo.location = (math.cos(ang) * 0.48, math.sin(ang) * 0.30, 0.55 + ((qf + bi) % 3) * 0.45)
                bo.rotation_euler = Euler((math.sin(qf + bi) * 0.9, math.cos(qf * 1.3 + bi) * 0.9, ang), "XYZ")
                bo.scale = (1.0, 1.0, 1.0)
            else:
                bo.scale = (0.001, 0.001, 0.001)

        scene.render.filepath = str(frames_dir / f"f_{f:04d}.png")
        bpy.ops.render.render(write_still=True)

    blend_out = BENCH_ROOT / "styles" / "blender" / f"{style_id}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_out))

    out_mp4.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        FFMPEG, "-y", "-loglevel", "error",
        "-framerate", str(FPS), "-i", str(frames_dir / "f_%04d.png"),
        "-i", SFX_WAV,
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart",
        str(out_mp4),
    ], check=True)
    print(f"Blender rendered {style_id} -> {out_mp4}")


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--style", required=True)
    args = parser.parse_args(argv)
    render_style(args.style)
