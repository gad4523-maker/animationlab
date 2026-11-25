extends Node3D

var cam: Camera3D
var goku_root: Node3D
var chest: Node3D
var arm_l: Node3D
var arm_r: Node3D
var hair_nodes: Array[Node3D] = []
var hair_mat: StandardMaterial3D
var eye_mat: StandardMaterial3D
var aura_cones: Array[MeshInstance3D] = []
var shock_ring: MeshInstance3D
var rocks: Array[MeshInstance3D] = []
var rock_bases: Array[Vector3] = []
var frame_idx: int = 0

func _mk_part(mesh: Mesh, mat: Material, pos: Vector3, rot: Vector3 = Vector3.ZERO, parent: Node = null) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.material_override = mat
	mi.position = pos
	mi.rotation_degrees = rot
	if parent:
		parent.add_child(mi)
	else:
		add_child(mi)
	return mi

func _toon_mat(col: Color, rough: float = 0.25) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = col
	m.diffuse_mode = BaseMaterial3D.DIFFUSE_TOON
	m.specular_mode = BaseMaterial3D.SPECULAR_TOON
	m.roughness = rough
	return m

func _ready():
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("#0c1428")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("#34446e")
	env.ambient_light_energy = 0.7
	env.glow_enabled = true
	env.glow_intensity = 1.4
	env.glow_bloom = 0.5
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)

	var dl := DirectionalLight3D.new()
	dl.rotation_degrees = Vector3(-42, 30, 0)
	dl.light_energy = 1.8
	add_child(dl)

	var m_ground := _toon_mat(Color("#362f2b"), 0.9)
	var pm := PlaneMesh.new()
	pm.size = Vector2(14, 14)
	_mk_part(pm, m_ground, Vector3.ZERO)

	var m_gi := _toon_mat(Color("#f46c18"))
	var m_blue := _toon_mat(Color("#1f4db8"))
	var m_skin := _toon_mat(Color("#f6c59c"))
	hair_mat = _toon_mat(Color("#12131c"))
	eye_mat = _toon_mat(Color("#12131c"))

	goku_root = Node3D.new()
	add_child(goku_root)

	var cyl := CylinderMesh.new()
	cyl.top_radius = 0.16
	cyl.bottom_radius = 0.14
	cyl.height = 0.55
	_mk_part(cyl, m_gi, Vector3(-0.22, 0.42, 0), Vector3(0, 0, -16), goku_root)
	_mk_part(cyl, m_gi, Vector3(0.22, 0.42, 0), Vector3(0, 0, 16), goku_root)

	var boot := BoxMesh.new()
	boot.size = Vector3(0.18, 0.22, 0.30)
	_mk_part(boot, m_blue, Vector3(-0.30, 0.11, 0.03), Vector3.ZERO, goku_root)
	_mk_part(boot, m_blue, Vector3(0.30, 0.11, 0.03), Vector3.ZERO, goku_root)
	var red_cuff := BoxMesh.new()
	red_cuff.size = Vector3(0.19, 0.04, 0.20)
	_mk_part(red_cuff, _toon_mat(Color("#de2626")), Vector3(-0.30, 0.22, 0.0), Vector3.ZERO, goku_root)
	_mk_part(red_cuff, _toon_mat(Color("#de2626")), Vector3(0.30, 0.22, 0.0), Vector3.ZERO, goku_root)

	chest = Node3D.new()
	chest.position = Vector3(0, 0.72, 0)
	goku_root.add_child(chest)

	var tm := CylinderMesh.new()
	tm.top_radius = 0.27
	tm.bottom_radius = 0.19
	tm.height = 0.52
	_mk_part(tm, m_gi, Vector3(0, 0.25, 0), Vector3.ZERO, chest)

	var bm := CylinderMesh.new()
	bm.top_radius = 0.20
	bm.bottom_radius = 0.20
	bm.height = 0.10
	_mk_part(bm, m_blue, Vector3(0, 0.02, 0), Vector3.ZERO, chest)

	var um := BoxMesh.new()
	um.size = Vector3(0.24, 0.22, 0.22)
	_mk_part(um, m_blue, Vector3(0, 0.38, 0.06), Vector3.ZERO, chest)

	arm_l = Node3D.new()
	arm_l.position = Vector3(-0.24, 0.44, 0)
	chest.add_child(arm_l)
	arm_r = Node3D.new()
	arm_r.position = Vector3(0.24, 0.44, 0)
	chest.add_child(arm_r)

	var am := CylinderMesh.new()
	am.top_radius = 0.095
	am.bottom_radius = 0.08
	am.height = 0.46
	_mk_part(am, m_skin, Vector3(-0.08, -0.20, 0.08), Vector3(-25, 0, -20), arm_l)
	_mk_part(am, m_skin, Vector3(0.08, -0.20, 0.08), Vector3(-25, 0, 20), arm_r)
	var fm := SphereMesh.new()
	fm.radius = 0.095
	_mk_part(fm, m_skin, Vector3(-0.15, -0.40, 0.17), Vector3.ZERO, arm_l)
	_mk_part(fm, m_skin, Vector3(0.15, -0.40, 0.17), Vector3.ZERO, arm_r)

	var hm := SphereMesh.new()
	hm.radius = 0.16
	_mk_part(hm, m_skin, Vector3(0, 0.62, 0), Vector3.ZERO, chest)

	var em := BoxMesh.new()
	em.size = Vector3(0.045, 0.022, 0.02)
	_mk_part(em, eye_mat, Vector3(-0.055, 0.66, 0.135), Vector3(0, 0, -12), chest)
	_mk_part(em, eye_mat, Vector3(0.055, 0.66, 0.135), Vector3(0, 0, 12), chest)

	var sp_mesh := CylinderMesh.new()
	sp_mesh.top_radius = 0.005
	sp_mesh.bottom_radius = 0.075
	sp_mesh.height = 0.42
	var angles := [-65.0, -40.0, -15.0, 15.0, 42.0, 68.0]
	for a in angles:
		var piv := Node3D.new()
		piv.position = Vector3(0, 0.72, -0.02)
		piv.rotation_degrees = Vector3(-8, 0, a)
		chest.add_child(piv)
		_mk_part(sp_mesh, hair_mat, Vector3(0, 0.19, 0), Vector3.ZERO, piv)
		hair_nodes.append(piv)

	var m_aura := StandardMaterial3D.new()
	m_aura.albedo_color = Color(1.0, 0.84, 0.15, 0.5)
	m_aura.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m_aura.emission_enabled = true
	m_aura.emission = Color("#ffcf22")
	m_aura.emission_energy_multiplier = 4.0
	for i in range(6):
		var ac := CylinderMesh.new()
		ac.top_radius = 0.01
		ac.bottom_radius = 0.22
		ac.height = 1.6
		var ang := -1.4 + (float(i) / 5.0) * 2.8
		var mi := _mk_part(ac, m_aura, Vector3(sin(ang) * 0.48, 0.9, -0.25 - cos(ang) * 0.20), Vector3.ZERO, goku_root)
		mi.scale = Vector3(0.01, 0.01, 0.01)
		aura_cones.append(mi)

	var tm_ring := TorusMesh.new()
	tm_ring.inner_radius = 0.82
	tm_ring.outer_radius = 1.0
	shock_ring = _mk_part(tm_ring, m_aura, Vector3(0, 0.35, 0))
	shock_ring.scale = Vector3(0.001, 0.001, 0.001)

	var rng := RandomNumberGenerator.new()
	rng.seed = 33
	for i in range(12):
		var bm_r := BoxMesh.new()
		var s := rng.randf_range(0.16, 0.32)
		bm_r.size = Vector3(s, s * 0.8, s)
		var ang := (float(i) / 12.0) * TAU
		var r := rng.randf_range(1.1, 2.2)
		var pos := Vector3(cos(ang) * r, s * 0.4, sin(ang) * r)
		var rm := _mk_part(bm_r, m_ground, pos)
		rocks.append(rm)
		rock_bases.append(pos)

	cam = Camera3D.new()
	cam.fov = 40.0
	add_child(cam)
	cam.current = true

func _process(_delta: float):
	var t := float(frame_idx) / 30.0
	frame_idx += 1

	var cam_dist := 1.28
	var cam_yaw := 0.0
	var cam_pitch := -18.0
	if t < 1.20:
		var p := smoothstep(0.0, 1.20, t)
		cam_dist = lerp(1.28, 1.06, p)
		cam_pitch = lerp(-18.0, -12.0, p)
	elif t < 2.50:
		var p := smoothstep(1.20, 2.50, t)
		cam_dist = lerp(1.06, 0.86, p)
		cam_yaw = lerp(0.0, 38.0, p)
		cam_pitch = lerp(-12.0, -3.0, p)
	elif t < 2.80:
		var p := smoothstep(2.50, 2.80, t)
		cam_dist = lerp(0.86, 0.76, p)
		cam_yaw = lerp(38.0, 42.0, p)
	elif t < 3.45:
		var p := smoothstep(2.80, 3.45, t)
		cam_dist = lerp(0.76, 0.92, p)
		cam_yaw = lerp(42.0, 32.0, p)
		cam_pitch = lerp(-1.0, -6.0, p)
	else:
		var p := smoothstep(3.45, 5.00, t)
		cam_dist = lerp(0.92, 1.18, p)
		cam_yaw = lerp(32.0, 14.0, p)
		cam_pitch = lerp(-6.0, -10.0, p)

	var shake := 0.08 * exp(-(t - 2.80) * 4.5) if (t >= 2.80 and t < 3.55) else 0.0
	var dist := cam_dist * 3.0
	var yr := deg_to_rad(cam_yaw)
	var pr := deg_to_rad(cam_pitch)
	cam.position = Vector3(sin(yr) * cos(pr) * dist + sin(t * 73.0) * shake, 1.05 + sin(pr) * dist + cos(t * 89.0) * shake, cos(yr) * cos(pr) * dist)
	cam.look_at(Vector3(0, 1.0, 0), Vector3.UP)

	var flicker: bool = (abs(t - 1.85) < 0.075) or (abs(t - 2.15) < 0.075) or (abs(t - 2.40) < 0.075)
	var is_ssj: bool = (t >= 2.80) or flicker
	hair_mat.albedo_color = Color("#ffe44d") if is_ssj else Color("#12131c")
	hair_mat.emission_enabled = is_ssj
	hair_mat.emission = Color("#ffcc22")
	hair_mat.emission_energy_multiplier = 1.6 if is_ssj else 0.0
	eye_mat.albedo_color = Color("#2ee8b6") if is_ssj else Color("#12131c")
	eye_mat.emission_enabled = is_ssj
	eye_mat.emission = Color("#2ee8b6")

	var spread := 0.1 if t < 2.80 else 0.85
	arm_l.rotation_degrees = Vector3(0, 0, -spread * 38.0)
	arm_r.rotation_degrees = Vector3(0, 0, spread * 38.0)
	chest.rotation_degrees = Vector3(-12.0 if t < 2.80 else 10.0, 0, 0)

	var hl := smoothstep(2.75, 2.97, t) if t >= 2.75 else (0.45 if flicker else 0.0)
	var base_a := [-65.0, -40.0, -15.0, 15.0, 42.0, 68.0]
	var ssj_a := [-38.0, -22.0, -8.0, 8.0, 22.0, 38.0]
	for i in range(hair_nodes.size()):
		hair_nodes[i].rotation_degrees = Vector3(-8, 0, lerp(base_a[i], ssj_a[i], hl))

	var aura_p: float = (0.25 + 0.55 * ((t - 0.90) / 1.90)) if (t >= 0.90 and t < 2.80) else (1.0 + 0.5 * exp(-pow((t - 2.80) / 0.16, 2.0)) if t >= 2.80 else 0.0)
	for i in range(aura_cones.size()):
		var sc_y: float = max(0.001, aura_p * (0.9 + 0.3 * sin(t * 16.0 + i)))
		aura_cones[i].scale = Vector3(max(0.001, aura_p), sc_y, max(0.001, aura_p))

	var sw: float = clamp((t - 2.80) / 0.70, 0.0, 1.0) if t >= 2.80 else 0.0
	if sw > 0.001 and sw < 0.98:
		shock_ring.scale = Vector3(0.3 + sw * 4.5, max(0.05, 1.0 - sw), 0.3 + sw * 4.5)
	else:
		shock_ring.scale = Vector3(0.001, 0.001, 0.001)

	var charge: float = clamp((t - 0.6) / 2.2, 0.0, 1.0) if t < 2.80 else 1.0
	for i in range(rocks.size()):
		var lift := pow(max(0.0, (charge - 0.25) / 0.75), 1.4) * (0.35 + 0.15 * (i % 4))
		rocks[i].position = rock_bases[i] + Vector3(0, lift + sin(t * 3.5 + i) * 0.05, 0)
