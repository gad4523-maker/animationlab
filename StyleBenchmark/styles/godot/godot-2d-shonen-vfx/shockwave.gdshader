shader_type canvas_item;
uniform float shock_progress = 0.0;
uniform float aura_power = 0.0;
uniform float time_sec = 0.0;
uniform sampler2D SCREEN_TEXTURE : hint_screen_texture, filter_linear_mipmap;

void fragment() {
	vec2 uv = SCREEN_UV;
	vec2 center = vec2(0.5, 0.54);
	vec2 delta = uv - center;
	delta.y *= 1.777;
	float dist = length(delta);

	// Expanding radial shockwave ring distortion at t >= 2.80
	if (shock_progress > 0.001 && shock_progress < 0.99) {
		float radius = shock_progress * 1.15;
		float ring = exp(-pow((dist - radius) * 18.0, 2.0));
		uv -= normalize(delta + vec2(0.0001)) * ring * 0.045 * (1.0 - shock_progress);
	}
	vec4 col = texture(SCREEN_TEXTURE, uv);
	// Golden aura screen rim tint
	float rim = smoothstep(0.55, 0.12, dist) * aura_power * 0.16;
	col.rgb += vec3(1.0, 0.78, 0.18) * rim;
	COLOR = col;
}
