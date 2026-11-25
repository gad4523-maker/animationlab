"""Master procedural Dragon Ball Z Goku 3D character rig, cel materials, curved hair locks, and jagged anime ki aura for Blender 5.2."""
import math
import bpy
import bmesh
from mathutils import Euler, Vector


def _ensure_nodes(mat):
    if mat.node_tree is None:
        mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    return nt


def get_ink_outline_mat(color=(0.035, 0.025, 0.045, 1.0)):
    name = "Mat_Goku_InkOutline"
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name)
    nt = _ensure_nodes(mat)
    mat.use_backface_culling = True
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = color
    em.inputs["Strength"].default_value = 1.0
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return mat


def add_ink_outline(obj, thickness=0.0030):
    ink = get_ink_outline_mat()
    if ink.name not in [m.name for m in obj.data.materials if m]:
        obj.data.materials.append(ink)
    mat_idx = [m.name for m in obj.data.materials if m].index(ink.name)
    mod = obj.modifiers.new("InkOutline", "SOLIDIFY")
    mod.thickness = thickness
    mod.offset = 1.0
    mod.use_flip_normals = True
    mod.material_offset = mat_idx
    mod.use_rim = False
    return mod


def make_cel_material(name, shadow_col, mid_col, hi_col=None, rim_col=(1.0, 0.85, 0.35, 1.0),
                      rim_strength=0.18, roughness=0.55, emission_strength=0.0, emission_col=None,
                      style_mode="cel", bump_scale=18.0, bump_strength=0.0):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name)
    nt = _ensure_nodes(mat)
    if hi_col is None:
        hi_col = tuple(min(1.0, c * 1.18 + 0.05) for c in mid_col[:3]) + (1.0,)

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (650, 0)

    if style_mode in ("pbr", "clay", "cardboard", "paper"):
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        bsdf.inputs["Base Color"].default_value = mid_col
        bsdf.inputs["Roughness"].default_value = roughness
        if "Subsurface Weight" in bsdf.inputs and style_mode in ("pbr", "clay"):
            bsdf.inputs["Subsurface Weight"].default_value = 0.22
        if emission_strength > 0.001 and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emission_col or mid_col
            bsdf.inputs["Emission Strength"].default_value = emission_strength
        if bump_strength > 0.001:
            tc = nt.nodes.new("ShaderNodeTexCoord")
            bump = nt.nodes.new("ShaderNodeBump")
            bump.inputs["Strength"].default_value = bump_strength
            if style_mode == "cardboard":
                wave = nt.nodes.new("ShaderNodeTexWave")
                wave.wave_type = "BANDS"
                wave.inputs["Scale"].default_value = bump_scale
                nt.links.new(tc.outputs["Object"], wave.inputs["Vector"])
                nt.links.new(wave.outputs["Fac"], bump.inputs["Height"])
            else:
                noise = nt.nodes.new("ShaderNodeTexNoise")
                noise.inputs["Scale"].default_value = bump_scale
                noise.inputs["Detail"].default_value = 6.0
                nt.links.new(tc.outputs["Object"], noise.inputs["Vector"])
                nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
            nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
        nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
        return mat

    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.25

    s2r = nt.nodes.new("ShaderNodeShaderToRGB")
    bw = nt.nodes.new("ShaderNodeRGBToBW")
    nt.links.new(bsdf.outputs["BSDF"], s2r.inputs["Shader"])
    nt.links.new(s2r.outputs["Color"], bw.inputs["Color"])

    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "LINEAR"
    elts = ramp.color_ramp.elements
    elts[0].position = 0.24
    elts[0].color = shadow_col
    e_mid_lo = elts.new(0.27)
    e_mid_lo.color = mid_col
    e_mid_hi = elts.new(0.76)
    e_mid_hi.color = mid_col
    elts[1].position = 0.80
    elts[1].color = hi_col
    nt.links.new(bw.outputs["Val"], ramp.inputs["Fac"])

    lw = nt.nodes.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.25
    rim_ramp = nt.nodes.new("ShaderNodeValToRGB")
    rim_ramp.color_ramp.elements[0].position = 0.62
    rim_ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    rim_ramp.color_ramp.elements[1].position = 0.72
    rim_ramp.color_ramp.elements[1].color = (rim_strength, rim_strength, rim_strength, 1)
    nt.links.new(lw.outputs["Facing"], rim_ramp.inputs["Fac"])

    mix_col = nt.nodes.new("ShaderNodeMix")
    mix_col.data_type = "RGBA"
    mix_col.blend_type = "ADD"
    mix_col.inputs["A"].default_value = mid_col
    mix_col.inputs["B"].default_value = rim_col
    nt.links.new(rim_ramp.outputs["Color"], mix_col.inputs["Factor"])
    nt.links.new(ramp.outputs["Color"], mix_col.inputs["A"])

    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = 1.0 + emission_strength
    nt.links.new(mix_col.outputs["Result"], em.inputs["Color"])
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return mat


def make_translucent_aura_material(name="Mat_Goku_Aura", color=(1.0, 0.84, 0.16, 1.0)):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name)
    nt = _ensure_nodes(mat)
    if hasattr(mat, "surface_render_method"):
        mat.surface_render_method = "BLENDED"
    if hasattr(mat, "use_backface_culling"):
        mat.use_backface_culling = False

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    trans = nt.nodes.new("ShaderNodeBsdfTransparent")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = color
    em.inputs["Strength"].default_value = 4.2

    # Vertical gradient fading from bright base flames to wispy tips + noise breakup
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sep.inputs["Vector"])

    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 5.5
    noise.inputs["Detail"].default_value = 4.0
    nt.links.new(tc.outputs["Object"], noise.inputs["Vector"])

    ramp_v = nt.nodes.new("ShaderNodeValToRGB")
    ramp_v.color_ramp.elements[0].position = 0.0
    ramp_v.color_ramp.elements[0].color = (0.55, 0.55, 0.55, 1)
    ramp_v.color_ramp.elements[1].position = 0.92
    ramp_v.color_ramp.elements[1].color = (0.05, 0.05, 0.05, 1)
    nt.links.new(sep.outputs["Z"], ramp_v.inputs["Fac"])

    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    nt.links.new(ramp_v.outputs["Color"], mul.inputs[0])
    nt.links.new(noise.outputs["Fac"], mul.inputs[1])

    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(mul.outputs["Value"], mix.inputs["Fac"])
    nt.links.new(trans.outputs["BSDF"], mix.inputs[1])
    nt.links.new(em.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return mat


def _tag_verts_deform(verts, deform_layer, group_weights):
    for v in verts:
        dw = v[deform_layer]
        for g_idx, w in group_weights:
            if w > 0.0:
                dw[g_idx] = w


def _add_lofted_chain(bm, sections, sides=12, cap_start=True, cap_end=True, mat_indices=None, deform_layer=None, ring_weights=None):
    rings = []
    for r_i, item in enumerate(sections):
        center = Vector(item[0])
        rx, ry = item[1], item[2]
        rot_x = math.radians(item[3]) if len(item) > 3 else 0.0
        rot_y = math.radians(item[4]) if len(item) > 4 else 0.0
        ca_rx, sa_rx = math.cos(rot_x), math.sin(rot_x)
        ca_ry, sa_ry = math.cos(rot_y), math.sin(rot_y)
        ring = []
        for i in range(sides):
            a = 2.0 * math.pi * i / sides
            p = Vector((rx * math.cos(a), ry * math.sin(a), 0.0))
            p1 = Vector((p.x * ca_ry + p.z * sa_ry, p.y, -p.x * sa_ry + p.z * ca_ry))
            p2 = Vector((p1.x, p1.y * ca_rx - p1.z * sa_rx, p1.y * sa_rx + p1.z * ca_rx))
            ring.append(bm.verts.new(center + p2))
        if deform_layer is not None and ring_weights is not None:
            _tag_verts_deform(ring, deform_layer, ring_weights[r_i])
        rings.append(ring)

    faces = []
    for k in range(len(rings) - 1):
        rA, rB = rings[k], rings[k + 1]
        m_idx = mat_indices[k] if mat_indices else 0
        for i in range(sides):
            ni = (i + 1) % sides
            f = bm.faces.new((rA[i], rA[ni], rB[ni], rB[i]))
            f.material_index = m_idx
            faces.append(f)
    if cap_start:
        f = bm.faces.new(tuple(reversed(rings[0])))
        f.material_index = mat_indices[0] if mat_indices else 0
        faces.append(f)
    if cap_end:
        f = bm.faces.new(tuple(rings[-1]))
        f.material_index = mat_indices[-1] if mat_indices else 0
        faces.append(f)
    return faces


def _add_tapered_limb(bm, p0, p1, r0, r1, sides=8, cap=True, mat_idx=0, deform_layer=None, weights=None):
    v0, v1 = Vector(p0), Vector(p1)
    axis = v1 - v0
    if axis.length < 1e-5:
        return []
    z_dir = axis.normalized()
    up = Vector((0, 1, 0)) if abs(z_dir.y) < 0.9 else Vector((1, 0, 0))
    x_dir = up.cross(z_dir).normalized()
    y_dir = z_dir.cross(x_dir).normalized()

    ring0, ring1 = [], []
    rx0, ry0 = (r0 if isinstance(r0, tuple) else (r0, r0))
    rx1, ry1 = (r1 if isinstance(r1, tuple) else (r1, r1))
    for i in range(sides):
        a = 2.0 * math.pi * i / sides
        ca, sa = math.cos(a), math.sin(a)
        ring0.append(bm.verts.new(v0 + x_dir * (rx0 * ca) + y_dir * (ry0 * sa)))
        ring1.append(bm.verts.new(v1 + x_dir * (rx1 * ca) + y_dir * (ry1 * sa)))
    if deform_layer is not None and weights is not None:
        _tag_verts_deform(ring0 + ring1, deform_layer, weights)

    faces = []
    for i in range(sides):
        ni = (i + 1) % sides
        f = bm.faces.new((ring0[i], ring0[ni], ring1[ni], ring1[i]))
        f.material_index = mat_idx
        faces.append(f)
    if cap:
        f0 = bm.faces.new(tuple(reversed(ring0)))
        f0.material_index = mat_idx
        f1 = bm.faces.new(tuple(ring1))
        f1.material_index = mat_idx
        faces.extend([f0, f1])
    return faces


def _build_curved_spike(bm, points, radii, sides=6, mat_idx=0):
    rings = []
    n_pts = len(points)
    for k, (pt, (rx, ry)) in enumerate(zip(points, radii)):
        p = Vector(pt)
        tangent = (Vector(points[k + 1]) - p).normalized() if k < n_pts - 1 else (p - Vector(points[k - 1])).normalized()
        ref = Vector((0, 1, 0)) if abs(tangent.y) < 0.88 else Vector((1, 0, 0))
        bx = ref.cross(tangent).normalized()
        by = tangent.cross(bx).normalized()
        ring = []
        for i in range(sides):
            a = 2.0 * math.pi * i / sides
            ring.append(bm.verts.new(p + bx * (rx * math.cos(a)) + by * (ry * math.sin(a))))
        rings.append(ring)

    for k in range(len(rings) - 1):
        rA, rB = rings[k], rings[k + 1]
        for i in range(sides):
            ni = (i + 1) % sides
            f = bm.faces.new((rA[i], rA[ni], rB[ni], rB[i]))
            f.material_index = mat_idx

    last_ring = rings[-1]
    tip_dir = (Vector(points[-1]) - Vector(points[-2])).normalized()
    tip_v = bm.verts.new(Vector(points[-1]) + tip_dir * 0.042)
    for i in range(sides):
        ni = (i + 1) % sides
        f = bm.faces.new((last_ring[i], last_ring[ni], tip_v))
        f.material_index = mat_idx
    f_base = bm.faces.new(tuple(reversed(rings[0])))
    f_base.material_index = mat_idx


def _create_mesh_obj(name, bm, materials, location=(0, 0, 0), smooth=True, group_names=None):
    mesh = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    for m in materials:
        mesh.materials.append(m)
    if smooth:
        for p in mesh.polygons:
            p.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    if group_names:
        for gn in group_names:
            obj.vertex_groups.new(name=gn)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _assign_vertex_group_box(obj, group_name, z_min, z_max, x_min=-9, x_max=9, y_min=-9, y_max=9, weight=1.0):
    vg = obj.vertex_groups.get(group_name) or obj.vertex_groups.new(name=group_name)
    verts = [
        v.index for v in obj.data.vertices
        if z_min <= v.co.z <= z_max and x_min <= v.co.x <= x_max and y_min <= v.co.y <= y_max
    ]
    if verts:
        vg.add(verts, weight, "REPLACE")


def build_goku_palette(style_mode="cel", bump_scale=18.0, bump_strength=0.0):
    return {
        "gi": make_cel_material(
            "Mat_Goku_Gi", (0.68, 0.18, 0.01, 1), (1.0, 0.38, 0.04, 1), (1.0, 0.54, 0.14, 1),
            style_mode=style_mode, bump_scale=bump_scale, bump_strength=bump_strength,
        ),
        "blue": make_cel_material(
            "Mat_Goku_Blue", (0.04, 0.12, 0.42, 1), (0.09, 0.28, 0.78, 1), (0.24, 0.48, 0.96, 1),
            style_mode=style_mode, bump_scale=bump_scale, bump_strength=bump_strength,
        ),
        "skin": make_cel_material(
            "Mat_Goku_Skin", (0.82, 0.54, 0.36, 1), (0.98, 0.76, 0.58, 1), (1.0, 0.89, 0.78, 1),
            style_mode=style_mode, bump_scale=bump_scale, bump_strength=bump_strength * 0.6,
        ),
        "red_trim": make_cel_material(
            "Mat_Goku_RedTrim", (0.52, 0.06, 0.06, 1), (0.88, 0.15, 0.15, 1), (1.0, 0.38, 0.32, 1),
            style_mode=style_mode,
        ),
        "yellow_tie": make_cel_material(
            "Mat_Goku_YellowTie", (0.65, 0.48, 0.06, 1), (0.96, 0.78, 0.18, 1), (1.0, 0.94, 0.55, 1),
            style_mode=style_mode,
        ),
        "sole": make_cel_material(
            "Mat_Goku_Sole", (0.08, 0.08, 0.10, 1), (0.18, 0.17, 0.20, 1), (0.30, 0.30, 0.34, 1),
            style_mode=style_mode,
        ),
        "hair_base": make_cel_material(
            "Mat_Goku_HairBase", (0.025, 0.028, 0.045, 1), (0.065, 0.072, 0.11, 1), (0.22, 0.26, 0.40, 1),
            rim_strength=0.12, roughness=0.40, style_mode=style_mode,
        ),
        "hair_ssj": make_cel_material(
            "Mat_Goku_HairSSJ", (0.82, 0.56, 0.02, 1), (1.0, 0.88, 0.18, 1), (1.0, 0.98, 0.78, 1),
            rim_strength=0.45, roughness=0.35, emission_strength=0.28, emission_col=(1.0, 0.86, 0.20, 1),
            style_mode=style_mode,
        ),
        "eye_white": make_cel_material("Mat_Goku_EyeWhite", (0.82, 0.84, 0.90, 1), (1.0, 1.0, 1.0, 1), (1.0, 1.0, 1.0, 1), rim_strength=0, style_mode="cel"),
        "eye_iris_base": make_cel_material("Mat_Goku_IrisBase", (0.02, 0.02, 0.03, 1), (0.06, 0.06, 0.09, 1), (0.14, 0.14, 0.20, 1), rim_strength=0, style_mode="cel"),
        "eye_iris_ssj": make_cel_material("Mat_Goku_IrisSSJ", (0.05, 0.58, 0.46, 1), (0.12, 0.88, 0.68, 1), (0.55, 1.0, 0.88, 1), rim_strength=0, emission_strength=0.65, emission_col=(0.15, 0.92, 0.70, 1), style_mode="cel"),
        "eye_spec": make_cel_material("Mat_Goku_EyeSpec", (1, 1, 1, 1), (1, 1, 1, 1), (1, 1, 1, 1), rim_strength=0, emission_strength=0.5, style_mode="cel"),
        "brow_base": make_cel_material("Mat_Goku_BrowBase", (0.02, 0.02, 0.03, 1), (0.05, 0.05, 0.08, 1), (0.12, 0.12, 0.18, 1), rim_strength=0, style_mode="cel"),
        "brow_ssj": make_cel_material("Mat_Goku_BrowSSJ", (0.72, 0.48, 0.02, 1), (0.98, 0.82, 0.12, 1), (1.0, 0.95, 0.55, 1), rim_strength=0, style_mode="cel"),
        "mouth_dark": make_cel_material("Mat_Goku_Mouth", (0.28, 0.05, 0.07, 1), (0.45, 0.09, 0.12, 1), (0.6, 0.15, 0.18, 1), rim_strength=0, style_mode="cel"),
        "teeth": make_cel_material("Mat_Goku_Teeth", (0.85, 0.85, 0.88, 1), (1.0, 1.0, 1.0, 1), (1.0, 1.0, 1.0, 1), rim_strength=0, style_mode="cel"),
        "aura": make_translucent_aura_material("Mat_Goku_Aura", (1.0, 0.84, 0.16, 1.0)),
    }


def build_goku_3d(name="Goku", style_mode="cel", outline_thickness=0.0030, bump_scale=18.0, bump_strength=0.0):
    pal = build_goku_palette(style_mode=style_mode, bump_scale=bump_scale, bump_strength=bump_strength)
    use_outline = outline_thickness > 0.0

    # 1. Connected Armature Rig
    arm_data = bpy.data.armatures.new(f"{name}_Armature")
    arm_data.display_type = "STICK"
    arm_obj = bpy.data.objects.new(f"{name}_Rig", arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)

    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm_data.edit_bones

    def add_bone(bname, head, tail, parent=None, connected=False, deform=True):
        b = eb.new(bname)
        b.head = Vector(head)
        b.tail = Vector(tail)
        if parent:
            b.parent = eb[parent]
        b.use_connect = connected
        b.use_deform = deform
        return b

    add_bone("Root", (0, 0, 0.0), (0, 0, 0.25), deform=False)
    add_bone("Pelvis", (0, 0, 0.88), (0, 0, 1.00), "Root")
    add_bone("Spine", (0, 0, 1.00), (0, 0, 1.19), "Pelvis", connected=True)
    add_bone("Chest", (0, 0, 1.19), (0, 0, 1.42), "Spine", connected=True)
    add_bone("Neck", (0, 0, 1.42), (0, 0, 1.50), "Chest", connected=True)
    add_bone("Head", (0, 0, 1.50), (0, 0, 1.74), "Neck", connected=True)
    add_bone("Jaw", (0, -0.04, 1.525), (0, -0.10, 1.505), "Head")

    add_bone("Sash_L1", (-0.06, -0.11, 0.94), (-0.09, -0.15, 0.78), "Pelvis")
    add_bone("Sash_L2", (-0.09, -0.15, 0.78), (-0.12, -0.18, 0.62), "Sash_L1", connected=True)
    add_bone("Sash_R1", (0.01, -0.11, 0.94), (0.04, -0.15, 0.76), "Pelvis")
    add_bone("Sash_R2", (0.04, -0.15, 0.76), (0.07, -0.18, 0.58), "Sash_R1", connected=True)

    for side, sgn in (("L", 1.0), ("R", -1.0)):
        add_bone(f"Shoulder_{side}", (0.06 * sgn, 0, 1.37), (0.20 * sgn, 0, 1.37), "Chest")
        add_bone(f"UpperArm_{side}", (0.20 * sgn, 0, 1.37), (0.31 * sgn, 0.01, 1.15), f"Shoulder_{side}", connected=True)
        add_bone(f"ForeArm_{side}", (0.31 * sgn, 0.01, 1.15), (0.37 * sgn, -0.04, 0.94), f"UpperArm_{side}", connected=True)
        add_bone(f"Hand_{side}", (0.37 * sgn, -0.04, 0.94), (0.39 * sgn, -0.06, 0.84), f"ForeArm_{side}", connected=True)

        add_bone(f"Thigh_{side}", (0.095 * sgn, 0, 0.88), (0.165 * sgn, -0.02, 0.49), "Pelvis")
        add_bone(f"Shin_{side}", (0.165 * sgn, -0.02, 0.49), (0.185 * sgn, 0.01, 0.14), f"Thigh_{side}", connected=True)
        add_bone(f"Foot_{side}", (0.185 * sgn, 0.01, 0.14), (0.185 * sgn, -0.15, 0.03), f"Shin_{side}", connected=True)

    bpy.ops.object.mode_set(mode="OBJECT")

    # 2. Continuous Muscular Body Mesh with Explicit Vertex Weights
    body_groups = [
        "Pelvis", "Spine", "Chest", "Neck",
        "Sash_L1", "Sash_L2", "Sash_R1", "Sash_R2",
        "UpperArm_L", "ForeArm_L", "Hand_L",
        "UpperArm_R", "ForeArm_R", "Hand_R",
        "Thigh_L", "Shin_L", "Foot_L",
        "Thigh_R", "Shin_R", "Foot_R",
    ]
    g_idx = {gn: i for i, gn in enumerate(body_groups)}

    bm = bmesh.new()
    dl = bm.verts.layers.deform.verify()
    body_mats = [pal["gi"], pal["blue"], pal["skin"], pal["red_trim"], pal["yellow_tie"], pal["sole"]]

    # Continuous Muscular Torso & Pelvis Skirt
    _add_lofted_chain(
        bm,
        [
            ((0, 0, 0.78), 0.175, 0.118),  # Seamless gi hip drape covering top of thighs!
            ((0, 0, 0.88), 0.160, 0.110),
            ((0, 0, 0.95), 0.135, 0.094),
            ((0, 0, 1.07), 0.150, 0.102),
            ((0, 0, 1.24), 0.198, 0.122),
            ((0, 0, 1.37), 0.222, 0.120),
            ((0, 0, 1.43), 0.138, 0.090),
        ],
        sides=16,
        mat_indices=[0, 0, 0, 0, 0, 0],
        deform_layer=dl,
        ring_weights=[
            [(g_idx["Pelvis"], 1.0)],
            [(g_idx["Pelvis"], 1.0)],
            [(g_idx["Pelvis"], 0.6), (g_idx["Spine"], 0.4)],
            [(g_idx["Spine"], 0.7), (g_idx["Chest"], 0.3)],
            [(g_idx["Chest"], 1.0)],
            [(g_idx["Chest"], 1.0)],
            [(g_idx["Chest"], 0.8), (g_idx["Neck"], 0.2)],
        ],
    )

    # Wide High-Crew Blue Undershirt across chest/collar (protruding clearly inside open V-neck!)
    _add_lofted_chain(
        bm,
        [
            ((0, -0.020, 1.19), 0.095, 0.118),
            ((0, -0.018, 1.29), 0.145, 0.124),
            ((0, -0.012, 1.38), 0.155, 0.115),
            ((0, 0.0, 1.44), 0.095, 0.088),
        ],
        sides=14,
        mat_indices=[1, 1, 1],
        deform_layer=dl,
        ring_weights=[[(g_idx["Chest"], 1.0)]] * 4,
    )

    # Wide Open Crossed Orange Gi V-Neck Lapels framing the Blue Undershirt
    for sgn, y_off in ((1.0, -0.005), (-1.0, 0.002)):
        _add_tapered_limb(
            bm, (0.145 * sgn, -0.105 + y_off, 1.41), (-0.015 * sgn, -0.126 + y_off, 1.16),
            (0.036, 0.018), (0.028, 0.016), sides=6, mat_idx=0,
            deform_layer=dl, weights=[(g_idx["Chest"], 1.0)],
        )

    # Sleeveless Gi Shoulder Caps (covering the deltoid socket cleanly!)
    for sgn in (1.0, -1.0):
        _add_tapered_limb(
            bm, (0.165 * sgn, 0.0, 1.41), (0.215 * sgn, 0.0, 1.34),
            (0.085, 0.095), (0.092, 0.100), sides=10, mat_idx=0,
            deform_layer=dl, weights=[(g_idx["Chest"], 1.0)],
        )

    # Knotted Blue Obi Belt around waist
    _add_lofted_chain(
        bm,
        [
            ((0, 0, 0.915), 0.148, 0.106),
            ((0, 0, 0.955), 0.155, 0.110),
            ((0, 0, 0.995), 0.148, 0.106),
        ],
        sides=16, mat_indices=[1, 1], deform_layer=dl,
        ring_weights=[[(g_idx["Pelvis"], 1.0)]] * 3,
    )
    _add_tapered_limb(bm, (-0.038, -0.118, 0.955), (0.008, -0.118, 0.955), 0.032, 0.032, sides=8, mat_idx=1, deform_layer=dl, weights=[(g_idx["Pelvis"], 1.0)])

    # Articulated Flowing Obi Sash Tails
    _add_lofted_chain(
        bm,
        [
            ((-0.055, -0.118, 0.94), 0.028, 0.011),
            ((-0.085, -0.148, 0.78), 0.034, 0.010),
            ((-0.115, -0.178, 0.62), 0.040, 0.008),
        ],
        sides=6, mat_indices=[1, 1], deform_layer=dl,
        ring_weights=[[(g_idx["Pelvis"], 0.6), (g_idx["Sash_L1"], 0.4)], [(g_idx["Sash_L1"], 1.0)], [(g_idx["Sash_L2"], 1.0)]],
    )
    _add_lofted_chain(
        bm,
        [
            ((0.005, -0.118, 0.94), 0.026, 0.011),
            ((0.035, -0.148, 0.76), 0.032, 0.010),
            ((0.065, -0.178, 0.58), 0.037, 0.008),
        ],
        sides=6, mat_indices=[1, 1], deform_layer=dl,
        ring_weights=[[(g_idx["Pelvis"], 0.6), (g_idx["Sash_R1"], 0.4)], [(g_idx["Sash_R1"], 1.0)], [(g_idx["Sash_R2"], 1.0)]],
    )

    # Muscular Neck
    _add_tapered_limb(bm, (0, 0, 1.40), (0, -0.005, 1.52), (0.072, 0.064), (0.060, 0.056), sides=12, mat_idx=2, deform_layer=dl, weights=[(g_idx["Neck"], 1.0)])

    # Continuous Muscular Arms (Large spherical deltoid seated INSIDE gi cap -> Heroic Bicep -> Forearm -> Blue Wristband -> Fist!)
    for side, sgn in (("L", 1.0), ("R", -1.0)):
        ua, fa, ha = g_idx[f"UpperArm_{side}"], g_idx[f"ForeArm_{side}"], g_idx[f"Hand_{side}"]
        _add_lofted_chain(
            bm,
            [
                ((0.180 * sgn, 0.0, 1.37), 0.082, 0.080, 0, 22 * sgn),    # Seated cleanly inside gi shoulder cap!
                ((0.228 * sgn, 0.002, 1.33), 0.085, 0.082, 0, 22 * sgn),   # Full deltoid bulge
                ((0.275 * sgn, 0.006, 1.24), 0.074, 0.070, 0, 22 * sgn),   # Bicep peak
                ((0.310 * sgn, 0.010, 1.15), 0.058, 0.056, 0, 18 * sgn),   # Elbow
                ((0.342 * sgn, -0.018, 1.04), 0.064, 0.060, -18, 16 * sgn),# Forearm bulge
                ((0.368 * sgn, -0.040, 0.94), 0.050, 0.046, -18, 14 * sgn),# Wristband start
                ((0.378 * sgn, -0.052, 0.89), 0.052, 0.048, -18, 14 * sgn),# Wristband end
                ((0.386 * sgn, -0.058, 0.835), 0.060, 0.052, -18, 12 * sgn),# Heroic clenched fist
            ],
            sides=12,
            mat_indices=[2, 2, 2, 2, 2, 1, 2],
            deform_layer=dl,
            ring_weights=[
                [(ua, 1.0)],
                [(ua, 1.0)],
                [(ua, 0.9), (fa, 0.1)],
                [(ua, 0.45), (fa, 0.55)],
                [(fa, 1.0)],
                [(fa, 0.4), (ha, 0.6)],
                [(ha, 1.0)],
                [(ha, 1.0)],
            ],
        )
        _add_tapered_limb(
            bm, (0.358 * sgn, -0.084, 0.88), (0.382 * sgn, -0.105, 0.835), 0.022, 0.018,
            sides=6, mat_idx=2, deform_layer=dl, weights=[(ha, 1.0)],
        )

    # Continuous Baggy Pleated Gi Pants + Boots (Tucked inside pelvis with ZERO boxy hip shelf!)
    for side, sgn in (("L", 1.0), ("R", -1.0)):
        ti, si, fi = g_idx[f"Thigh_{side}"], g_idx[f"Shin_{side}"], g_idx[f"Foot_{side}"]
        _add_lofted_chain(
            bm,
            [
                ((0.082 * sgn, 0.0, 0.88), 0.082, 0.082),   # Narrowly seated INSIDE pelvis!
                ((0.125 * sgn, -0.01, 0.68), 0.115, 0.108), # Baggy thigh flare below belt
                ((0.165 * sgn, -0.02, 0.49), 0.095, 0.090), # Knee gather
                ((0.180 * sgn, 0.0, 0.29), 0.102, 0.096),   # Baggy calf fold
                ((0.185 * sgn, 0.008, 0.21), 0.072, 0.070), # Tucked into boot cuff
                ((0.185 * sgn, 0.010, 0.19), 0.080, 0.078), # Red boot top trim
                ((0.185 * sgn, 0.010, 0.14), 0.078, 0.076), # Blue boot shaft
                ((0.185 * sgn, 0.005, 0.06), 0.074, 0.084), # Ankle
            ],
            sides=12,
            mat_indices=[0, 0, 0, 0, 3, 1, 1],
            deform_layer=dl,
            ring_weights=[
                [(g_idx["Pelvis"], 0.45), (ti, 0.55)],
                [(ti, 1.0)],
                [(ti, 0.5), (si, 0.5)],
                [(si, 1.0)],
                [(si, 0.7), (fi, 0.3)],
                [(si, 0.3), (fi, 0.7)],
                [(fi, 1.0)],
                [(fi, 1.0)],
            ],
        )
        _add_tapered_limb(bm, (0.185 * sgn, 0.010, 0.115), (0.185 * sgn, 0.010, 0.132), 0.081, 0.081, sides=10, mat_idx=4, deform_layer=dl, weights=[(fi, 1.0)])
        _add_lofted_chain(
            bm,
            [
                ((0.185 * sgn, 0.05, 0.045), 0.074, 0.046, 90, 0),
                ((0.185 * sgn, -0.05, 0.042), 0.072, 0.043, 90, 0),
                ((0.185 * sgn, -0.15, 0.032), 0.058, 0.032, 90, 0),
            ],
            sides=10, mat_indices=[1, 1], deform_layer=dl, ring_weights=[[(fi, 1.0)]] * 3,
        )
        _add_lofted_chain(
            bm,
            [
                ((0.185 * sgn, 0.05, 0.012), 0.076, 0.014, 90, 0),
                ((0.185 * sgn, -0.155, 0.012), 0.060, 0.014, 90, 0),
            ],
            sides=10, mat_indices=[5], deform_layer=dl, ring_weights=[[(fi, 1.0)]] * 2,
        )

    body_obj = _create_mesh_obj(f"{name}_Body", bm, body_mats, smooth=True, group_names=body_groups)
    if use_outline:
        add_ink_outline(body_obj, thickness=outline_thickness)
    mod_b = body_obj.modifiers.new("Armature", "ARMATURE")
    mod_b.object = arm_obj
    body_obj.parent = arm_obj

    # 3. Sculpted Dragon Ball Z Head & Expressive Face
    head_groups = ["Head", "Jaw"]
    hg_idx = {"Head": 0, "Jaw": 1}
    bm_h = bmesh.new()
    dl_h = bm_h.verts.layers.deform.verify()
    head_mats = [
        pal["skin"],          # 0
        pal["eye_white"],     # 1
        pal["eye_iris_base"], # 2
        pal["eye_spec"],      # 3
        pal["brow_base"],     # 4
        pal["mouth_dark"],    # 5
        pal["teeth"],         # 6
    ]

    _add_lofted_chain(
        bm_h,
        [
            ((0, -0.022, 1.495), 0.034, 0.044),
            ((0, -0.015, 1.525), 0.068, 0.074),
            ((0, -0.008, 1.568), 0.095, 0.096),
            ((0, -0.002, 1.622), 0.104, 0.106),
            ((0, 0.004, 1.675), 0.098, 0.100),
            ((0, 0.008, 1.715), 0.064, 0.066),
        ],
        sides=16, mat_indices=[0, 0, 0, 0, 0], deform_layer=dl_h,
        ring_weights=[
            [(hg_idx["Head"], 0.35), (hg_idx["Jaw"], 0.65)],
            [(hg_idx["Head"], 0.55), (hg_idx["Jaw"], 0.45)],
            [(hg_idx["Head"], 1.0)],
            [(hg_idx["Head"], 1.0)],
            [(hg_idx["Head"], 1.0)],
            [(hg_idx["Head"], 1.0)],
        ],
    )

    _add_tapered_limb(bm_h, (0, -0.098, 1.580), (0, -0.125, 1.548), (0.013, 0.008), (0.004, 0.004), sides=4, mat_idx=0, deform_layer=dl_h, weights=[(hg_idx["Head"], 1.0)])
    for sgn in (1.0, -1.0):
        _add_tapered_limb(bm_h, (0.096 * sgn, 0.002, 1.565), (0.118 * sgn, 0.012, 1.610), (0.013, 0.024), (0.010, 0.020), sides=6, mat_idx=0, deform_layer=dl_h, weights=[(hg_idx["Head"], 1.0)])

    for sgn in (1.0, -1.0):
        ex = 0.042 * sgn
        _add_tapered_limb(bm_h, (ex - 0.024 * sgn, -0.092, 1.582), (ex + 0.024 * sgn, -0.086, 1.590), (0.006, 0.015), (0.006, 0.017), sides=6, mat_idx=1, deform_layer=dl_h, weights=[(hg_idx["Head"], 1.0)])
        _add_tapered_limb(bm_h, (ex - 0.002 * sgn, -0.095, 1.577), (ex - 0.002 * sgn, -0.095, 1.596), (0.012, 0.005), (0.012, 0.005), sides=8, mat_idx=2, deform_layer=dl_h, weights=[(hg_idx["Head"], 1.0)])
        _add_tapered_limb(bm_h, (ex + 0.006 * sgn, -0.099, 1.590), (ex + 0.006 * sgn, -0.099, 1.596), (0.004, 0.003), (0.004, 0.003), sides=4, mat_idx=3, deform_layer=dl_h, weights=[(hg_idx["Head"], 1.0)])
        _add_tapered_limb(bm_h, (ex - 0.026 * sgn, -0.096, 1.595), (ex + 0.026 * sgn, -0.090, 1.604), 0.0048, 0.0040, sides=4, mat_idx=4, deform_layer=dl_h, weights=[(hg_idx["Head"], 1.0)])
        _add_tapered_limb(bm_h, (0.012 * sgn, -0.102, 1.602), (0.074 * sgn, -0.090, 1.624), 0.0065, 0.0048, sides=4, mat_idx=4, deform_layer=dl_h, weights=[(hg_idx["Head"], 1.0)])

    _add_tapered_limb(bm_h, (-0.026, -0.088, 1.522), (0.026, -0.088, 1.522), (0.006, 0.012), (0.006, 0.012), sides=4, mat_idx=5, deform_layer=dl_h, weights=[(hg_idx["Jaw"], 0.75), (hg_idx["Head"], 0.25)])
    _add_tapered_limb(bm_h, (-0.022, -0.092, 1.528), (0.022, -0.092, 1.528), (0.003, 0.004), (0.003, 0.004), sides=4, mat_idx=6, deform_layer=dl_h, weights=[(hg_idx["Head"], 1.0)])
    _add_tapered_limb(bm_h, (-0.022, -0.091, 1.516), (0.022, -0.091, 1.516), (0.003, 0.004), (0.003, 0.004), sides=4, mat_idx=6, deform_layer=dl_h, weights=[(hg_idx["Jaw"], 1.0)])

    head_obj = _create_mesh_obj(f"{name}_Head", bm_h, head_mats, smooth=True, group_names=head_groups)
    if use_outline:
        add_ink_outline(head_obj, thickness=outline_thickness * 0.75)
    mod_h = head_obj.modifiers.new("Armature", "ARMATURE")
    mod_h.object = arm_obj
    head_obj.parent = arm_obj

    # 4A. Iconic Base Goku Hair (Broad Curved Toriyama Asymmetrical Blades + Forehead Bangs + Sideburns)
    bm_hb = bmesh.new()
    _add_lofted_chain(bm_hb, [
        ((0, 0.012, 1.60), 0.106, 0.108),
        ((0, 0.010, 1.65), 0.108, 0.110),
        ((0, 0.012, 1.69), 0.098, 0.102),
        ((0, 0.015, 1.72), 0.070, 0.074),
    ], sides=14, mat_indices=[0, 0, 0])

    base_spikes = [
        # Right (-X): 3 broad curved blades
        ([(-0.07, 0.01, 1.68), (-0.18, 0.02, 1.72), (-0.29, 0.04, 1.70)], [(0.052, 0.032), (0.035, 0.022), (0.009, 0.006)]),
        ([(-0.08, 0.02, 1.64), (-0.21, 0.03, 1.63), (-0.33, 0.05, 1.58)], [(0.054, 0.032), (0.036, 0.022), (0.009, 0.006)]),
        ([(-0.08, 0.03, 1.59), (-0.18, 0.04, 1.55), (-0.27, 0.06, 1.49)], [(0.046, 0.028), (0.028, 0.018), (0.008, 0.005)]),
        # Left (+X): 4 larger asymmetric curved blades
        ([(0.05, 0.01, 1.70), (0.14, 0.02, 1.80), (0.24, 0.04, 1.85)], [(0.054, 0.032), (0.036, 0.022), (0.009, 0.006)]),
        ([(0.08, 0.02, 1.67), (0.21, 0.03, 1.71), (0.33, 0.05, 1.70)], [(0.056, 0.034), (0.038, 0.024), (0.010, 0.006)]),
        ([(0.08, 0.03, 1.62), (0.21, 0.04, 1.60), (0.32, 0.06, 1.54)], [(0.050, 0.030), (0.034, 0.020), (0.009, 0.006)]),
        ([(0.07, 0.04, 1.57), (0.17, 0.06, 1.52), (0.24, 0.07, 1.46)], [(0.042, 0.025), (0.026, 0.016), (0.007, 0.005)]),
        # Top & Rear Crown
        ([(0.00, 0.02, 1.70), (-0.02, 0.05, 1.82), (-0.04, 0.09, 1.89)], [(0.058, 0.036), (0.038, 0.024), (0.010, 0.006)]),
        ([(0.00, 0.06, 1.66), (0.01, 0.14, 1.72), (0.01, 0.22, 1.74)], [(0.058, 0.036), (0.038, 0.024), (0.010, 0.007)]),
        # 3 Broader Curved Forehead Bangs + 2 Temple Sideburns
        ([(-0.045, -0.078, 1.678), (-0.065, -0.105, 1.635), (-0.070, -0.106, 1.592)], [(0.030, 0.015), (0.020, 0.011), (0.004, 0.003)]),
        ([(0.004, -0.082, 1.682), (0.014, -0.110, 1.636), (0.005, -0.110, 1.588)], [(0.028, 0.014), (0.018, 0.010), (0.004, 0.003)]),
        ([(0.052, -0.076, 1.675), (0.075, -0.102, 1.630), (0.080, -0.098, 1.588)], [(0.028, 0.014), (0.019, 0.010), (0.004, 0.003)]),
        ([(-0.092, -0.045, 1.635), (-0.102, -0.055, 1.585), (-0.098, -0.058, 1.540)], [(0.018, 0.012), (0.012, 0.008), (0.003, 0.003)]),
        ([(0.092, -0.045, 1.635), (0.102, -0.055, 1.585), (0.098, -0.058, 1.540)], [(0.018, 0.012), (0.012, 0.008), (0.003, 0.003)]),
    ]
    for pts, rads in base_spikes:
        _build_curved_spike(bm_hb, pts, rads, sides=6, mat_idx=0)

    hair_base_obj = _create_mesh_obj(f"{name}_Hair_Base", bm_hb, [pal["hair_base"]], smooth=True)
    if use_outline:
        add_ink_outline(hair_base_obj, thickness=outline_thickness * 0.85)
    _assign_vertex_group_box(hair_base_obj, "Head", 1.30, 2.20, -0.5, 0.5)
    mod_hb = hair_base_obj.modifiers.new("Armature", "ARMATURE")
    mod_hb.object = arm_obj
    hair_base_obj.parent = arm_obj

    # 4B. Iconic Super Saiyan Hair (Broad Overlapping Flame-Shaped Golden Locks + Sweeping Bangs!)
    bm_hs = bmesh.new()
    _add_lofted_chain(bm_hs, [
        ((0, 0.012, 1.60), 0.106, 0.108),
        ((0, 0.010, 1.65), 0.108, 0.110),
        ((0, 0.012, 1.69), 0.098, 0.102),
        ((0, 0.015, 1.72), 0.070, 0.074),
    ], sides=14, mat_indices=[0, 0, 0])

    ssj_spikes = [
        # Broad overlapping golden flame blades surging upward & swept slightly back
        ([(0.00, -0.01, 1.70), (0.01, 0.03, 1.87), (-0.01, 0.07, 2.04)], [(0.072, 0.044), (0.048, 0.030), (0.010, 0.007)]),
        ([(-0.055, -0.01, 1.69), (-0.11, 0.02, 1.84), (-0.15, 0.06, 1.98)], [(0.068, 0.040), (0.044, 0.028), (0.010, 0.006)]),
        ([(0.055, -0.01, 1.69), (0.11, 0.02, 1.84), (0.15, 0.06, 1.98)], [(0.068, 0.040), (0.044, 0.028), (0.010, 0.006)]),
        ([(-0.085, 0.00, 1.67), (-0.18, 0.03, 1.78), (-0.25, 0.07, 1.86)], [(0.060, 0.036), (0.038, 0.024), (0.009, 0.006)]),
        ([(0.085, 0.00, 1.67), (0.18, 0.03, 1.78), (0.25, 0.07, 1.86)], [(0.060, 0.036), (0.038, 0.024), (0.009, 0.006)]),
        ([(-0.09, 0.02, 1.63), (-0.19, 0.05, 1.68), (-0.27, 0.08, 1.72)], [(0.052, 0.032), (0.032, 0.020), (0.008, 0.005)]),
        ([(0.09, 0.02, 1.63), (0.19, 0.05, 1.68), (0.27, 0.08, 1.72)], [(0.052, 0.032), (0.032, 0.020), (0.008, 0.005)]),
        ([(0.00, 0.05, 1.68), (0.00, 0.13, 1.82), (0.00, 0.20, 1.94)], [(0.068, 0.042), (0.044, 0.028), (0.010, 0.007)]),
        ([(-0.06, 0.05, 1.65), (-0.11, 0.13, 1.76), (-0.16, 0.19, 1.84)], [(0.058, 0.036), (0.036, 0.024), (0.009, 0.006)]),
        ([(0.06, 0.05, 1.65), (0.11, 0.13, 1.76), (0.16, 0.19, 1.84)], [(0.058, 0.036), (0.036, 0.024), (0.009, 0.006)]),
        # 3 Iconic Curved Forehead Bangs + 2 Sharp Temple Sideburns
        ([(-0.052, -0.076, 1.678), (-0.075, -0.104, 1.634), (-0.080, -0.100, 1.584)], [(0.030, 0.015), (0.020, 0.010), (0.004, 0.003)]),
        ([(0.002, -0.082, 1.682), (-0.010, -0.110, 1.635), (-0.006, -0.110, 1.582)], [(0.028, 0.014), (0.018, 0.010), (0.004, 0.003)]),
        ([(0.052, -0.076, 1.678), (0.076, -0.102, 1.632), (0.082, -0.098, 1.584)], [(0.030, 0.015), (0.020, 0.010), (0.004, 0.003)]),
        ([(-0.092, -0.045, 1.635), (-0.105, -0.055, 1.585), (-0.102, -0.058, 1.535)], [(0.020, 0.012), (0.013, 0.008), (0.004, 0.003)]),
        ([(0.092, -0.045, 1.635), (0.105, -0.055, 1.585), (0.102, -0.058, 1.535)], [(0.020, 0.012), (0.013, 0.008), (0.004, 0.003)]),
    ]
    for pts, rads in ssj_spikes:
        _build_curved_spike(bm_hs, pts, rads, sides=6, mat_idx=0)

    hair_ssj_obj = _create_mesh_obj(f"{name}_Hair_SSJ", bm_hs, [pal["hair_ssj"]], smooth=True)
    if use_outline:
        add_ink_outline(hair_ssj_obj, thickness=outline_thickness * 0.85)
    _assign_vertex_group_box(hair_ssj_obj, "Head", 1.30, 2.25, -0.5, 0.5)
    mod_hs = hair_ssj_obj.modifiers.new("Armature", "ARMATURE")
    mod_hs.object = arm_obj
    hair_ssj_obj.parent = arm_obj

    # 5. Jagged Layered Anime Flame-Tongue Ki Aura (pointed flame tips framing Goku from boots to crown!)
    bm_a = bmesh.new()
    n_flames = 15
    for i in range(n_flames):
        ang = -math.radians(105.0) + (i / (n_flames - 1)) * math.radians(210.0)
        rad_base = 0.40 if (i % 2 == 0) else 0.54
        bx = math.sin(ang) * rad_base
        by = 0.20 + math.cos(ang) * 0.24
        h_tip = 1.62 + (i % 3) * 0.22 - abs(math.sin(ang)) * 0.25
        mid_x = bx * 1.18 + math.sin(i * 1.7) * 0.08
        tip_x = bx * 0.85 + math.sin(ang) * 0.16
        _build_curved_spike(
            bm_a,
            [(bx, by, 0.0), (mid_x, by + 0.05, h_tip * 0.55), (tip_x, by + 0.10, h_tip)],
            [(0.16, 0.05), (0.11, 0.03), (0.008, 0.006)],
            sides=5, mat_idx=0,
        )
    aura_obj = _create_mesh_obj(f"{name}_Aura", bm_a, [pal["aura"]], smooth=True)
    aura_obj.parent = arm_obj

    return {
        "rig": arm_obj,
        "body": body_obj,
        "head": head_obj,
        "hair_base": hair_base_obj,
        "hair_ssj": hair_ssj_obj,
        "aura": aura_obj,
        "pal": pal,
    }


def pose_goku_3d(rig_dict, ch: dict):
    arm = rig_dict["rig"]
    t = ch["t"]
    is_ssj = ch["ssj"] > 0.5

    rig_dict["hair_base"].hide_render = is_ssj
    rig_dict["hair_base"].hide_viewport = is_ssj
    rig_dict["hair_ssj"].hide_render = not is_ssj
    rig_dict["hair_ssj"].hide_viewport = not is_ssj

    head_mats = rig_dict["head"].data.materials
    head_mats[2] = rig_dict["pal"]["eye_iris_ssj"] if is_ssj else rig_dict["pal"]["eye_iris_base"]
    head_mats[4] = rig_dict["pal"]["brow_ssj"] if is_ssj else rig_dict["pal"]["brow_base"]

    def set_rot(bname, deg_xyz):
        pb = arm.pose.bones.get(bname)
        if pb:
            pb.rotation_mode = "XYZ"
            pb.rotation_euler = Euler([math.radians(a) for a in deg_xyz], "XYZ")

    def set_loc(bname, loc_xyz):
        pb = arm.pose.bones.get(bname)
        if pb:
            pb.location = Vector(loc_xyz)

    crouch = ch["crouch"]
    spread = ch["armSpread"]
    arch = ch["chestArch"]

    # Wide grounded martial-arts stance!
    set_loc("Pelvis", (0, 0, -crouch * 0.14))
    set_rot("Spine", (arch * 22.0, 0, 0))
    set_rot("Chest", (arch * 18.0, 0, 0))
    set_rot("Head", (-arch * 20.0 - (6.0 if ch["mouthOpen"] > 0.6 else 0.0), 0, 0))
    set_loc("Jaw", (0, 0, -ch["mouthOpen"] * 0.028))

    # Wide planted martial-arts stance! (Y-axis spreads legs wide, X-axis bends knees forward/back)
    leg_pitch = 16.0 + crouch * 14.0
    set_rot("Thigh_L", (-leg_pitch, -16.0, 0.0))
    set_rot("Thigh_R", (-leg_pitch, 16.0, 0.0))
    set_rot("Shin_L", (leg_pitch * 1.15, 12.0, 0.0))
    set_rot("Shin_R", (leg_pitch * 1.15, -12.0, 0.0))
    set_rot("Foot_L", (-leg_pitch * 0.15, 4.0, 0.0))
    set_rot("Foot_R", (-leg_pitch * 0.15, -4.0, 0.0))

    # Arms: tense clenched fists forward during charge -> wide heroic power spread on burst!
    arm_out = 10.0 + spread * 26.0
    arm_fwd = -18.0 + spread * 26.0
    elbow_bend = -68.0 + spread * 34.0
    set_rot("UpperArm_L", (arm_fwd, -arm_out, 0.0))
    set_rot("UpperArm_R", (arm_fwd, arm_out, 0.0))
    set_rot("ForeArm_L", (elbow_bend, 8.0, 0.0))
    set_rot("ForeArm_R", (elbow_bend, -8.0, 0.0))

    w1 = math.sin(t * 14.0) * (10.0 + 18.0 * ch["auraPower"])
    w2 = math.cos(t * 17.0) * (10.0 + 20.0 * ch["auraPower"])
    set_rot("Sash_L1", (-8.0 - ch["auraPower"] * 28.0, w1, 10.0))
    set_rot("Sash_L2", (-10.0, w2, 8.0))
    set_rot("Sash_R1", (-10.0 - ch["auraPower"] * 24.0, -w2, -8.0))
    set_rot("Sash_R2", (-8.0, w1, -6.0))

    ap = ch["auraPower"]
    au = rig_dict["aura"]
    if ap < 0.03:
        au.hide_render = True
        au.scale = (0.01, 0.01, 0.01)
    else:
        au.hide_render = False
        sx = 0.85 + 0.35 * ap + 0.06 * math.sin(t * 18.0)
        sz = 0.88 + 0.28 * ap + 0.08 * math.cos(t * 14.0)
        au.scale = (sx, sx, sz)
        au.rotation_euler = Euler((0, 0, math.sin(t * 8.0) * 0.12), "XYZ")
