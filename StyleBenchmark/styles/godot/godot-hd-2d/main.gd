extends Node3D

var cam: Camera3D
var sprite: Sprite3D
var aura_sprite: Sprite3D
var ki_light: OmniLight3D
var particles: GPUParticles3D
var rocks: Array[MeshInstance3D] = []
var rock_bases: Array[Vector3] = []
var tex_base: ImageTexture
var tex_ssj: ImageTexture
var tex_aura: ImageTexture
var frame_idx: int = 0

func _draw_pixel_goku(is_ssj: bool) -> ImageTexture:
	var w: int = 80
	var h: int = 120
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	img.fill(Color(0, 0, 0, 0))

	var hair_main := Color("#ffe44d") if is_ssj else Color("#151824")
	var hair_hi := Color("#fff9c4") if is_ssj else Color("#3c4464")
	var hair_sh := Color("#c48600") if is_ssj else Color("#090b12")
	var skin := Color("#ffd7b0") if is_ssj else Color("#f2bc91")
	var skin_sh := Color("#d89060")
	var gi := Color("#ff7c1c") if is_ssj else Color("#f05e12")
	var gi_sh := Color("#a83408")
	var blue := Color("#1e50c8")
	var red := Color("#de2626")
	var yellow := Color("#f8cc38")
	var eye_c := Color("#1ee6b0") if is_ssj else Color("#121218")
	var ink := Color("#120d10")

	var set_px = func(x: int, y: int, c: Color):
		if x >= 0 and x < w and y >= 0 and y < h:
			img.set_pixel(x, y, c)

	var fill_poly = func(pts: PackedVector2Array, c: Color):
		var minx: int = 999
		var maxx: int = -999
		var miny: int = 999
		var maxy: int = -999
		for p in pts:
			minx = min(minx, int(floor(p.x)))
			maxx = max(maxx, int(ceil(p.x)))
			miny = min(miny, int(floor(p.y)))
			maxy = max(maxy, int(ceil(p.y)))
		for yy in range(max(0, miny), min(h, maxy + 1)):
			for xx in range(max(0, minx), min(w, maxx + 1)):
				if Geometry2D.is_point_in_polygon(Vector2(xx + 0.5, yy + 0.5), pts):
					set_px.call(xx, yy, c)

	# Grounded Wide-Stance Boots (Blue + Red top trim + Yellow ankle tie)
	fill_poly.call(PackedVector2Array([Vector2(19, 97), Vector2(30, 97), Vector2(31, 117), Vector2(16, 117)]), blue)
	fill_poly.call(PackedVector2Array([Vector2(50, 97), Vector2(61, 97), Vector2(64, 117), Vector2(49, 117)]), blue)
	fill_poly.call(PackedVector2Array([Vector2(19, 96), Vector2(30, 96), Vector2(30, 100), Vector2(19, 100)]), red)
	fill_poly.call(PackedVector2Array([Vector2(50, 96), Vector2(61, 96), Vector2(61, 100), Vector2(50, 100)]), red)
	fill_poly.call(PackedVector2Array([Vector2(18, 105), Vector2(30, 105), Vector2(30, 107), Vector2(18, 107)]), yellow)
	fill_poly.call(PackedVector2Array([Vector2(50, 105), Vector2(62, 105), Vector2(62, 107), Vector2(50, 107)]), yellow)

	# Baggy Pleated Orange Gi Pants + Pelvis Bridge
	fill_poly.call(PackedVector2Array([Vector2(28, 72), Vector2(52, 72), Vector2(53, 81), Vector2(40, 83), Vector2(27, 81)]), gi_sh)
	fill_poly.call(PackedVector2Array([Vector2(27, 73), Vector2(39, 75), Vector2(31, 97), Vector2(19, 96), Vector2(21, 82)]), gi)
	fill_poly.call(PackedVector2Array([Vector2(41, 75), Vector2(53, 73), Vector2(59, 82), Vector2(61, 96), Vector2(49, 97)]), gi)

	# Obi Belt & Fluttering Sash Tails
	fill_poly.call(PackedVector2Array([Vector2(28, 67), Vector2(52, 67), Vector2(52, 73), Vector2(28, 73)]), blue)
	fill_poly.call(PackedVector2Array([Vector2(35, 73), Vector2(39, 73), Vector2(31, 90), Vector2(27, 89)]), blue)

	# Muscular Torso + Wide Blue Undershirt + Crossed Gi Lapels + Shoulder Caps
	fill_poly.call(PackedVector2Array([Vector2(24, 43), Vector2(56, 43), Vector2(51, 67), Vector2(29, 67)]), gi)
	fill_poly.call(PackedVector2Array([Vector2(32, 43), Vector2(48, 43), Vector2(40, 58)]), blue)
	fill_poly.call(PackedVector2Array([Vector2(21, 43), Vector2(28, 43), Vector2(28, 50), Vector2(20, 49)]), gi)
	fill_poly.call(PackedVector2Array([Vector2(52, 43), Vector2(59, 43), Vector2(60, 49), Vector2(52, 50)]), gi)

	# Muscular Arms + Wristbands + Fists
	if is_ssj:
		fill_poly.call(PackedVector2Array([Vector2(22, 49), Vector2(27, 49), Vector2(18, 69), Vector2(12, 67)]), skin)
		fill_poly.call(PackedVector2Array([Vector2(53, 49), Vector2(58, 49), Vector2(68, 67), Vector2(62, 69)]), skin)
		fill_poly.call(PackedVector2Array([Vector2(11, 67), Vector2(18, 69), Vector2(17, 74), Vector2(10, 72)]), blue)
		fill_poly.call(PackedVector2Array([Vector2(62, 69), Vector2(69, 67), Vector2(70, 72), Vector2(63, 74)]), blue)
		fill_poly.call(PackedVector2Array([Vector2(9, 72), Vector2(17, 74), Vector2(15, 80), Vector2(8, 78)]), skin_sh)
		fill_poly.call(PackedVector2Array([Vector2(63, 74), Vector2(71, 72), Vector2(72, 78), Vector2(65, 80)]), skin_sh)
	else:
		fill_poly.call(PackedVector2Array([Vector2(21, 49), Vector2(27, 49), Vector2(22, 62), Vector2(15, 60)]), skin)
		fill_poly.call(PackedVector2Array([Vector2(53, 49), Vector2(59, 49), Vector2(65, 60), Vector2(58, 62)]), skin)
		fill_poly.call(PackedVector2Array([Vector2(15, 60), Vector2(22, 60), Vector2(26, 68), Vector2(20, 70)]), skin)
		fill_poly.call(PackedVector2Array([Vector2(58, 60), Vector2(65, 60), Vector2(60, 70), Vector2(54, 68)]), skin)
		fill_poly.call(PackedVector2Array([Vector2(20, 67), Vector2(26, 67), Vector2(27, 72), Vector2(21, 72)]), blue)
		fill_poly.call(PackedVector2Array([Vector2(54, 67), Vector2(60, 67), Vector2(59, 72), Vector2(53, 72)]), blue)
		fill_poly.call(PackedVector2Array([Vector2(21, 72), Vector2(28, 72), Vector2(28, 78), Vector2(21, 78)]), skin_sh)
		fill_poly.call(PackedVector2Array([Vector2(52, 72), Vector2(59, 72), Vector2(59, 78), Vector2(52, 78)]), skin_sh)

	# Compact Muscular Neck & Sculpted DBZ Head
	fill_poly.call(PackedVector2Array([Vector2(34, 38), Vector2(46, 38), Vector2(44, 44), Vector2(36, 44)]), skin_sh)
	fill_poly.call(PackedVector2Array([Vector2(32, 24), Vector2(48, 24), Vector2(47, 36), Vector2(40, 41), Vector2(33, 36)]), skin)
	# Hairline Dome
	fill_poly.call(PackedVector2Array([Vector2(31, 26), Vector2(33, 18), Vector2(40, 17), Vector2(47, 18), Vector2(49, 26), Vector2(40, 23)]), hair_main)
	# Eyes & Furrowed Brows
	fill_poly.call(PackedVector2Array([Vector2(34, 29), Vector2(38, 29), Vector2(38, 31), Vector2(34, 31)]), eye_c)
	fill_poly.call(PackedVector2Array([Vector2(42, 29), Vector2(46, 29), Vector2(46, 31), Vector2(42, 31)]), eye_c)
	fill_poly.call(PackedVector2Array([Vector2(33, 27), Vector2(39, 28), Vector2(39, 29), Vector2(33, 28)]), hair_sh)
	fill_poly.call(PackedVector2Array([Vector2(47, 27), Vector2(41, 28), Vector2(41, 29), Vector2(47, 28)]), hair_sh)
	# Mouth
	fill_poly.call(PackedVector2Array([Vector2(37, 35), Vector2(43, 35), Vector2(42, 38), Vector2(38, 38)]), ink)

	# Iconic Hair Blades + Forehead Bangs
	if is_ssj:
		fill_poly.call(PackedVector2Array([Vector2(32, 23), Vector2(18, 12), Vector2(35, 19)]), hair_main)
		fill_poly.call(PackedVector2Array([Vector2(33, 20), Vector2(24, 5), Vector2(38, 18)]), hair_hi)
		fill_poly.call(PackedVector2Array([Vector2(36, 18), Vector2(34, 1), Vector2(41, 17)]), hair_main)
		fill_poly.call(PackedVector2Array([Vector2(38, 17), Vector2(44, 2), Vector2(44, 18)]), hair_hi)
		fill_poly.call(PackedVector2Array([Vector2(42, 18), Vector2(56, 6), Vector2(47, 21)]), hair_main)
		fill_poly.call(PackedVector2Array([Vector2(45, 20), Vector2(62, 14), Vector2(48, 24)]), hair_main)
	else:
		fill_poly.call(PackedVector2Array([Vector2(32, 24), Vector2(14, 19), Vector2(34, 19)]), hair_main)
		fill_poly.call(PackedVector2Array([Vector2(33, 20), Vector2(18, 9), Vector2(37, 17)]), hair_main)
		fill_poly.call(PackedVector2Array([Vector2(36, 18), Vector2(36, 4), Vector2(42, 17)]), hair_hi)
		fill_poly.call(PackedVector2Array([Vector2(41, 18), Vector2(59, 9), Vector2(46, 20)]), hair_main)
		fill_poly.call(PackedVector2Array([Vector2(45, 20), Vector2(65, 19), Vector2(48, 24)]), hair_main)
		fill_poly.call(PackedVector2Array([Vector2(46, 23), Vector2(61, 27), Vector2(48, 26)]), hair_main)
	# Bangs
	fill_poly.call(PackedVector2Array([Vector2(33, 22), Vector2(32, 29), Vector2(36, 23)]), hair_main)
	fill_poly.call(PackedVector2Array([Vector2(38, 21), Vector2(40, 30), Vector2(42, 22)]), hair_main)
	fill_poly.call(PackedVector2Array([Vector2(44, 22), Vector2(47, 29), Vector2(47, 23)]), hair_main)

	return ImageTexture.create_from_image(img)

func _draw_aura_tex() -> ImageTexture:
	var w: int = 80
	var h: int = 120
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	for y in range(h):
		for x in range(w):
			var nx: float = (x - 40.0) / 34.0
			var ny: float = (y - 68.0) / 52.0
			var d: float = sqrt(nx * nx + ny * ny)
			if d < 1.0:
				var a: float = pow(1.0 - d, 2.0) * (0.55 + 0.45 * sin(x * 0.45 + y * 0.25))
				img.set_pixel(x, y, Color(1.0, 0.85, 0.2, clamp(a, 0.0, 0.75)))
			else:
				img.set_pixel(x, y, Color(0, 0, 0, 0))
	return ImageTexture.create_from_image(img)

func _ready():
	tex_base = _draw_pixel_goku(false)
	tex_ssj = _draw_pixel_goku(true)
	tex_aura = _draw_aura_tex()

	# Controlled HD-2D Environment (crisp bloom without over-exposure!)
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("#070d1e")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("#2e3f68")
	env.ambient_light_energy = 1.05
	env.glow_enabled = true
	env.glow_intensity = 0.50
	env.glow_bloom = 0.14
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)

	var floor_mesh := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(14, 14)
	floor_mesh.mesh = pm
	var fmat := StandardMaterial3D.new()
	fmat.albedo_color = Color("#2a2426")
	fmat.roughness = 0.88
	floor_mesh.material_override = fmat
	add_child(floor_mesh)

	var dl := DirectionalLight3D.new()
	dl.rotation_degrees = Vector3(-48, 25, 0)
	dl.light_energy = 1.4
	dl.shadow_enabled = true
	add_child(dl)

	ki_light = OmniLight3D.new()
	ki_light.position = Vector3(0, 1.1, 0.35)
	ki_light.light_color = Color("#ffd538")
	ki_light.light_energy = 0.2
	ki_light.omni_range = 6.0
	add_child(ki_light)

	aura_sprite = Sprite3D.new()
	aura_sprite.texture = tex_aura
	aura_sprite.pixel_size = 0.026
	aura_sprite.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	aura_sprite.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	aura_sprite.modulate = Color(1, 1, 1, 0)
	aura_sprite.position = Vector3(0, 1.12, -0.18)
	add_child(aura_sprite)

	sprite = Sprite3D.new()
	sprite.texture = tex_base
	sprite.pixel_size = 0.017
	sprite.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	sprite.billboard = BaseMaterial3D.BILLBOARD_FIXED_Y
	sprite.shaded = true
	sprite.alpha_cut = SpriteBase3D.ALPHA_CUT_DISCARD
	sprite.position = Vector3(0, 1.02, 0)
	add_child(sprite)

	var rng := RandomNumberGenerator.new()
	rng.seed = 900
	for i in range(14):
		var mi := MeshInstance3D.new()
		var bm := BoxMesh.new()
		var sc: float = rng.randf_range(0.14, 0.30)
		bm.size = Vector3(sc, sc * 0.75, sc)
		mi.mesh = bm
		var rmat := StandardMaterial3D.new()
		rmat.albedo_color = Color("#463c35")
		mi.material_override = rmat
		var ang: float = (float(i) / 14.0) * TAU
		var r: float = rng.randf_range(1.15, 2.35)
		var pos := Vector3(cos(ang) * r, sc * 0.35, sin(ang) * r)
		mi.position = pos
		add_child(mi)
		rocks.append(mi)
		rock_bases.append(pos)

	particles = GPUParticles3D.new()
	particles.amount = 56
	particles.lifetime = 1.4
	var pmat := ParticleProcessMaterial.new()
	pmat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX
	pmat.emission_box_extents = Vector3(0.85, 0.2, 0.4)
	pmat.direction = Vector3(0, 1, 0)
	pmat.initial_velocity_min = 1.8
	pmat.initial_velocity_max = 3.6
	pmat.gravity = Vector3(0, 0.5, 0)
	particles.process_material = pmat
	var qm := QuadMesh.new()
	qm.size = Vector2(0.05, 0.11)
	var p_vis := StandardMaterial3D.new()
	p_vis.albedo_color = Color("#ffe55c")
	p_vis.emission_enabled = true
	p_vis.emission = Color("#ffcc22")
	p_vis.emission_energy_multiplier = 2.2
	p_vis.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	qm.material = p_vis
	particles.draw_pass_1 = qm
	particles.position = Vector3(0, 0.1, 0)
	add_child(particles)

	cam = Camera3D.new()
	cam.fov = 40.0
	add_child(cam)
	cam.current = true

func _process(_delta: float):
	var t: float = float(frame_idx) / 30.0
	frame_idx += 1

	var cam_dist: float = 1.28
	var cam_yaw: float = 0.0
	var cam_pitch: float = -18.0
	if t < 1.20:
		var p: float = smoothstep(0.0, 1.20, t)
		cam_dist = lerp(1.28, 1.06, p)
		cam_pitch = lerp(-18.0, -12.0, p)
	elif t < 2.50:
		var p: float = smoothstep(1.20, 2.50, t)
		cam_dist = lerp(1.06, 0.86, p)
		cam_yaw = lerp(0.0, 38.0, p)
		cam_pitch = lerp(-12.0, -3.0, p)
	elif t < 2.80:
		var p: float = smoothstep(2.50, 2.80, t)
		cam_dist = lerp(0.86, 0.76, p)
		cam_yaw = lerp(38.0, 42.0, p)
		cam_pitch = lerp(-3.0, -1.0, p)
	elif t < 3.45:
		var p: float = smoothstep(2.80, 3.45, t)
		cam_dist = lerp(0.76, 0.92, p)
		cam_yaw = lerp(42.0, 32.0, p)
		cam_pitch = lerp(-1.0, -6.0, p)
	else:
		var p: float = smoothstep(3.45, 5.00, t)
		cam_dist = lerp(0.92, 1.18, p)
		cam_yaw = lerp(32.0, 14.0, p)
		cam_pitch = lerp(-6.0, -10.0, p)

	var shake: float = 0.09 * exp(-(t - 2.80) * 4.5) if (t >= 2.80 and t < 3.55) else 0.0
	var dist: float = cam_dist * 3.1
	var yr: float = deg_to_rad(cam_yaw)
	var pr: float = deg_to_rad(cam_pitch)
	cam.position = Vector3(sin(yr) * cos(pr) * dist + sin(t * 73.0) * shake, 1.0 + sin(pr) * dist + cos(t * 89.0) * shake, cos(yr) * cos(pr) * dist)
	cam.look_at(Vector3(0, 0.98, 0), Vector3.UP)

	var flicker: bool = (abs(t - 1.85) < 0.075) or (abs(t - 2.15) < 0.075) or (abs(t - 2.40) < 0.075)
	var is_ssj: bool = (t >= 2.80) or flicker
	sprite.texture = tex_ssj if is_ssj else tex_base
	sprite.position.x = sin(t * 58.0) * (0.025 if t < 2.80 and t > 1.0 else 0.0)

	var aura_p: float = 0.0
	if t >= 0.90 and t < 2.80:
		aura_p = 0.25 + 0.55 * ((t - 0.90) / 1.90)
	elif t >= 2.80:
		aura_p = 1.0 + 0.45 * exp(-pow((t - 2.80) / 0.18, 2.0))

	aura_sprite.modulate = Color(1.0, 0.9, 0.35, clamp(aura_p * 0.72, 0.0, 0.85))
	var aura_scale: float = 0.85 + 0.30 * aura_p + 0.08 * sin(t * 16.0)
	aura_sprite.scale = Vector3(aura_scale, aura_scale * 1.12, 1.0)
	ki_light.light_energy = aura_p * 2.6

	var charge: float = clamp((t - 0.6) / 2.2, 0.0, 1.0) if t < 2.80 else 1.0
	for i in range(rocks.size()):
		var lift: float = pow(max(0.0, (charge - 0.25) / 0.75), 1.4) * (0.35 + 0.15 * (i % 4))
		rocks[i].position = rock_bases[i] + Vector3(0, lift + sin(t * 3.5 + i) * 0.05, 0)
		rocks[i].rotation = Vector3(t * charge, t * 0.7 * charge, i)
