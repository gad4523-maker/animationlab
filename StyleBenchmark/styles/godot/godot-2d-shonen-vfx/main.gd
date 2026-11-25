extends Node2D

var frame_idx: int = 0
var cam: Camera2D
var shader_rect: ColorRect
var shader_mat: ShaderMaterial
var particles: GPUParticles2D

func _ready():
	cam = Camera2D.new()
	cam.position = Vector2(360, 640)
	add_child(cam)
	cam.make_current()

	particles = GPUParticles2D.new()
	particles.position = Vector2(360, 740)
	particles.amount = 72
	particles.lifetime = 1.2
	var pm := ParticleProcessMaterial.new()
	pm.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX
	pm.emission_box_extents = Vector3(160, 40, 0)
	pm.direction = Vector3(0, -1, 0)
	pm.initial_velocity_min = 240.0
	pm.initial_velocity_max = 620.0
	pm.gravity = Vector3(0, -120, 0)
	pm.scale_min = 3.0
	pm.scale_max = 8.0
	pm.color = Color("#ffe44d")
	particles.process_material = pm
	add_child(particles)

	var cl := CanvasLayer.new()
	add_child(cl)
	shader_rect = ColorRect.new()
	shader_rect.size = Vector2(720, 1280)
	shader_mat = ShaderMaterial.new()
	shader_mat.shader = load("res://shockwave.gdshader")
	shader_rect.material = shader_mat
	cl.add_child(shader_rect)

func _process(_delta: float):
	frame_idx += 1
	queue_redraw()

func _draw():
	var t: float = float(frame_idx - 1) / 30.0
	var flicker: bool = (abs(t - 1.85) < 0.075) or (abs(t - 2.15) < 0.075) or (abs(t - 2.40) < 0.075)
	var ssj: float = 1.0 if (t >= 2.80 or flicker) else 0.0
	var hair_lift: float = smoothstep(2.75, 2.97, t) if t >= 2.75 else (0.45 if flicker else 0.0)
	var charge: float = clamp((t - 0.60) / 2.20, 0.0, 1.0) if t < 2.80 else 1.0
	var aura_p: float = (0.2 + 0.55 * ((t - 0.90) / 1.90)) if (t >= 0.90 and t < 2.80) else (1.0 + 0.5 * exp(-pow((t - 2.80) / 0.16, 2.0)) if t >= 2.80 else 0.0)
	var shock_p: float = clamp((t - 2.80) / 0.70, 0.0, 1.0) if t >= 2.80 else 0.0

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

	var shake: float = 24.0 * exp(-(t - 2.80) * 4.5) if (t >= 2.80 and t < 3.55) else 0.0
	cam.position = Vector2(360 + sin(t * 73.0) * shake, 640 + cos(t * 89.0) * shake)
	cam.zoom = Vector2.ONE * (1.0 / cam_dist)

	shader_mat.set_shader_parameter("shock_progress", shock_p)
	shader_mat.set_shader_parameter("aura_power", aura_p)
	shader_mat.set_shader_parameter("time_sec", t)

	var sky_col := Color("#1c190a") if ssj > 0.5 else Color("#071326")
	draw_rect(Rect2(-400, -400, 1600, 2200), sky_col)
	var hy: float = 740.0 - (cam_pitch / 45.0) * 180.0
	draw_rect(Rect2(-400, hy, 1600, 1200), Color("#1e1a24"))

	if aura_p > 0.2:
		for i in range(36):
			var ang: float = (float(i) / 36.0) * TAU + t * 0.4
			var r0: float = 210.0 + sin(t * 25.0 + i) * 35.0
			var c_line := Color(1.0, 0.92, 0.45, 0.25 * aura_p) if ssj > 0.5 else Color(0.55, 0.85, 1.0, 0.18 * aura_p)
			draw_line(Vector2(360, 620) + Vector2(cos(ang), sin(ang)) * r0, Vector2(360, 620) + Vector2(cos(ang), sin(ang)) * 760.0, c_line, 2.5)

	if aura_p > 0.02:
		for i in range(14):
			var ang: float = (float(i) / 14.0) * TAU
			var bx: float = 360.0 + sin(ang) * 135.0 * (0.7 + 0.4 * aura_p)
			var by: float = 745.0 - cos(ang) * 55.0
			var tx: float = bx + sin(t * 14.0 + i) * 35.0
			var ty: float = by - (230.0 + 210.0 * aura_p) * (0.7 + 0.3 * abs(sin(t * 11.0 + i)))
			draw_colored_polygon(PackedVector2Array([Vector2(bx - 38, by), Vector2(tx, ty), Vector2(bx + 38, by)]), Color(1.0, 0.82, 0.16, 0.34 * clamp(aura_p, 0.0, 1.0)))

	var yaw_f: float = sin(deg_to_rad(cam_yaw)) * 0.28
	var crouch: float = 0.65 if t < 2.80 else 0.30
	var spread: float = 0.12 if t < 2.80 else 0.82
	var sc: float = 390.0
	var cx: float = 360.0
	var cy: float = 695.0 + crouch * 32.0

	var p_map = func(x: float, y: float, z: float = 0.0) -> Vector2:
		return Vector2(cx + (x + z * yaw_f) * sc, cy + y * sc)

	var gi_c := Color("#ff7c1c") if ssj > 0.5 else Color("#f25e12")
	var gi_sh := Color("#b83606")
	var blue_c := Color("#1e50c8")
	var skin_c := Color("#ffd6b0") if ssj > 0.5 else Color("#f5be92")
	var hair_c := Color("#ffe240") if ssj > 0.5 else Color("#141724")
	var hair_hi := Color("#fff8b8") if ssj > 0.5 else Color("#3c4666")
	var eye_c := Color("#1ee6b0") if ssj > 0.5 else Color("#121218")
	var ink_c := Color("#140e16")

	# Baggy Pleated Pants + Pelvis Bridge + Red-Trimmed Blue Boots with Yellow Ties
	draw_colored_polygon(PackedVector2Array([p_map.call(-0.17, -0.05), p_map.call(0.17, -0.05), p_map.call(0.16, 0.12), p_map.call(0.0, 0.15), p_map.call(-0.16, 0.12)]), gi_sh)
	draw_colored_polygon(PackedVector2Array([p_map.call(-0.17, -0.03), p_map.call(-0.01, -0.01), p_map.call(-0.18, 0.30), p_map.call(-0.22, 0.49), p_map.call(-0.33, 0.49), p_map.call(-0.34, 0.25)]), gi_c)
	draw_colored_polygon(PackedVector2Array([p_map.call(0.01, -0.01), p_map.call(0.17, -0.03), p_map.call(0.34, 0.25), p_map.call(0.33, 0.49), p_map.call(0.22, 0.49), p_map.call(0.18, 0.30)]), gi_c)
	# Boots + Red trim + Yellow ties
	for sgn in [-1.0, 1.0]:
		var bx: float = sgn * 0.275
		draw_colored_polygon(PackedVector2Array([p_map.call(bx - 0.06, 0.49), p_map.call(bx + 0.06, 0.49), p_map.call(bx + 0.075, 0.72), p_map.call(bx - 0.075, 0.72)]), blue_c)
		draw_colored_polygon(PackedVector2Array([p_map.call(bx - 0.062, 0.485), p_map.call(bx + 0.062, 0.485), p_map.call(bx + 0.062, 0.525), p_map.call(bx - 0.062, 0.525)]), Color("#de2626"))
		draw_line(p_map.call(bx - 0.065, 0.58), p_map.call(bx + 0.065, 0.58), Color("#f8cc38"), 4.0)

	# Torso + Wide Undershirt + Obi + Sash
	draw_colored_polygon(PackedVector2Array([p_map.call(-0.23, -0.43), p_map.call(0.23, -0.43), p_map.call(0.17, -0.05), p_map.call(-0.17, -0.05)]), gi_c)
	draw_colored_polygon(PackedVector2Array([p_map.call(-0.14, -0.43), p_map.call(0.14, -0.43), p_map.call(0.0, -0.22)]), blue_c)
	draw_colored_polygon(PackedVector2Array([p_map.call(-0.175, -0.07), p_map.call(0.175, -0.07), p_map.call(0.175, 0.01), p_map.call(-0.175, 0.01)]), blue_c)
	var sw_wave: float = sin(t * 14.0) * 0.06
	draw_colored_polygon(PackedVector2Array([p_map.call(-0.07, 0.01), p_map.call(-0.01, 0.01), p_map.call(-0.14 - sw_wave, 0.25), p_map.call(-0.21 - sw_wave, 0.23)]), blue_c)

	# Muscular Arms, Gi Shoulder Caps, Wristbands & Fists
	var fx: float = lerp(0.21, 0.45, spread)
	var fy: float = lerp(-0.02, 0.09, spread)
	for sgn in [-1.0, 1.0]:
		draw_colored_polygon(PackedVector2Array([p_map.call(sgn * 0.22, -0.43), p_map.call(sgn * 0.28, -0.40), p_map.call(sgn * 0.28, -0.32), p_map.call(sgn * 0.20, -0.34)]), gi_c)
		draw_colored_polygon(PackedVector2Array([p_map.call(sgn * 0.22, -0.40), p_map.call(sgn * 0.17, -0.32), p_map.call(sgn * fx - sgn * 0.04, fy), p_map.call(sgn * fx + sgn * 0.05, fy - 0.04)]), skin_c)
		draw_colored_polygon(PackedVector2Array([p_map.call(sgn * fx - 0.045, fy - 0.045), p_map.call(sgn * fx + 0.045, fy - 0.045), p_map.call(sgn * fx + 0.045, fy + 0.005), p_map.call(sgn * fx - 0.045, fy + 0.005)]), blue_c)
		draw_circle(p_map.call(sgn * fx, fy + 0.03), 18.0, skin_c)

	# Compact Muscular Neck, Head, Hair Dome, Face & Broad Hair Blades
	draw_colored_polygon(PackedVector2Array([p_map.call(-0.09, -0.43), p_map.call(0.09, -0.43), p_map.call(0.06, -0.52), p_map.call(-0.06, -0.52)]), skin_c)
	draw_colored_polygon(PackedVector2Array([p_map.call(-0.095, -0.64), p_map.call(0.095, -0.64), p_map.call(0.088, -0.52), p_map.call(0.0, -0.46), p_map.call(-0.088, -0.52)]), skin_c)
	# Hair dome covering top of forehead cleanly
	draw_colored_polygon(PackedVector2Array([p_map.call(-0.10, -0.61), p_map.call(-0.08, -0.71), p_map.call(0.0, -0.73), p_map.call(0.08, -0.71), p_map.call(0.10, -0.61), p_map.call(0.0, -0.64)]), hair_c)

	# Eyes, Brows, Mouth
	for sgn in [-1.0, 1.0]:
		draw_colored_polygon(PackedVector2Array([p_map.call(sgn * 0.015, -0.59, 0.06), p_map.call(sgn * 0.065, -0.598, 0.06), p_map.call(sgn * 0.060, -0.570, 0.06), p_map.call(sgn * 0.018, -0.570, 0.06)]), Color.WHITE)
		draw_circle(p_map.call(sgn * 0.040, -0.584, 0.06), 4.5, eye_c)
		draw_line(p_map.call(sgn * 0.012, -0.598, 0.06), p_map.call(sgn * 0.075, -0.615, 0.06), ink_c if ssj < 0.5 else Color("#c98a00"), 3.5)
	draw_rect(Rect2(p_map.call(-0.026, -0.525, 0.06), Vector2(20, 6 + (12 if t > 2.0 else 0))), Color("#4d0f18"))

	var b_spikes := [
		[Vector2(-0.06, -0.60), Vector2(-0.30, -0.68), Vector2(-0.09, -0.68)],
		[Vector2(-0.08, -0.64), Vector2(-0.34, -0.81), Vector2(-0.04, -0.72)],
		[Vector2(-0.05, -0.67), Vector2(-0.22, -0.91), Vector2(0.02, -0.73)],
		[Vector2(-0.01, -0.69), Vector2(0.03, -0.94), Vector2(0.07, -0.71)],
		[Vector2(0.03, -0.69), Vector2(0.25, -0.87), Vector2(0.10, -0.66)],
		[Vector2(0.07, -0.66), Vector2(0.33, -0.74), Vector2(0.10, -0.60)],
	]
	var s_spikes := [
		[Vector2(-0.07, -0.60), Vector2(-0.25, -0.80), Vector2(-0.08, -0.68)],
		[Vector2(-0.08, -0.64), Vector2(-0.23, -0.96), Vector2(-0.04, -0.72)],
		[Vector2(-0.05, -0.67), Vector2(-0.11, -1.05), Vector2(0.01, -0.73)],
		[Vector2(-0.02, -0.69), Vector2(0.01, -1.10), Vector2(0.05, -0.72)],
		[Vector2(0.02, -0.69), Vector2(0.15, -1.03), Vector2(0.09, -0.68)],
		[Vector2(0.06, -0.67), Vector2(0.25, -0.92), Vector2(0.10, -0.62)],
	]
	for i in range(b_spikes.size()):
		var p0: Vector2 = b_spikes[i][0].lerp(s_spikes[i][0], hair_lift)
		var p1: Vector2 = b_spikes[i][1].lerp(s_spikes[i][1], hair_lift)
		var p2: Vector2 = b_spikes[i][2].lerp(s_spikes[i][2], hair_lift)
		draw_colored_polygon(PackedVector2Array([p_map.call(p0.x, p0.y), p_map.call(p1.x, p1.y), p_map.call(p2.x, p2.y)]), hair_hi if (i in [2, 3]) else hair_c)

	# Forehead bangs
	draw_colored_polygon(PackedVector2Array([p_map.call(-0.07, -0.67), p_map.call(-0.085, -0.58, 0.08), p_map.call(-0.03, -0.66)]), hair_c)
	draw_colored_polygon(PackedVector2Array([p_map.call(-0.02, -0.68), p_map.call(-0.004, -0.57, 0.08), p_map.call(0.02, -0.68)]), hair_c)
	draw_colored_polygon(PackedVector2Array([p_map.call(0.03, -0.66), p_map.call(0.084, -0.58, 0.08), p_map.call(0.07, -0.67)]), hair_c)

	if charge > 0.35 or ssj > 0.5:
		var bucket: int = int(t * 18.0)
		var rng := RandomNumberGenerator.new()
		rng.seed = bucket * 97 + 11
		for b in range(4):
			var pts := PackedVector2Array()
			var lx: float = rng.randf_range(220, 500)
			var ly: float = rng.randf_range(350, 820)
			pts.append(Vector2(lx, ly))
			for _s in range(4):
				lx += rng.randf_range(-65, 65)
				ly += rng.randf_range(-55, 55)
				pts.append(Vector2(lx, ly))
			draw_polyline(pts, Color(0.55, 0.92, 1.0, 0.92), 3.0)
