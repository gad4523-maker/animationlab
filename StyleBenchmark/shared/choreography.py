"""Shared deterministic 5.0s (150-frame @ 30fps) choreography solver for Goku Super Saiyan."""
import math


def clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return lo if v < lo else (hi if v > hi else v)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def smoothstep(t: float) -> float:
    t = clamp(t)
    return t * t * (3.0 - 2.0 * t)


def ease_out(t: float) -> float:
    t = clamp(t)
    return 1.0 - (1.0 - t) ** 3


def ease_in_out(t: float) -> float:
    t = clamp(t)
    return 4 * t * t * t if t < 0.5 else 1 - ((-2 * t + 2) ** 3) / 2


def solve_choreography(t: float) -> dict:
    t = clamp(t, 0.0, 5.0)

    # Camera parameters: camDist (1.28 -> 0.76 -> 1.18), camYaw (deg), camPitch (deg)
    if t < 1.20:
        p = smoothstep(t / 1.20)
        cam_dist = lerp(1.28, 1.06, p)
        cam_yaw = 0.0
        cam_pitch = lerp(-18.0, -12.0, p)
        cam_y = lerp(0.08, 0.02, p)
    elif t < 2.50:
        p = ease_in_out((t - 1.20) / 1.30)
        cam_dist = lerp(1.06, 0.86, p)
        cam_yaw = lerp(0.0, 38.0, p)
        cam_pitch = lerp(-12.0, -3.0, p)
        cam_y = lerp(0.02, -0.04, p)
    elif t < 2.80:
        p = smoothstep((t - 2.50) / 0.30)
        cam_dist = lerp(0.86, 0.76, p)
        cam_yaw = lerp(38.0, 42.0, p)
        cam_pitch = lerp(-3.0, -1.0, p)
        cam_y = -0.05
    elif t < 3.45:
        p = ease_out((t - 2.80) / 0.65)
        cam_dist = lerp(0.76, 0.92, p)
        cam_yaw = lerp(42.0, 32.0, p)
        cam_pitch = lerp(-1.0, -6.0, p)
        cam_y = lerp(-0.05, 0.0, p)
    else:
        p = ease_in_out((t - 3.45) / 1.55)
        cam_dist = lerp(0.92, 1.18, p)
        cam_yaw = lerp(32.0, 14.0, p)
        cam_pitch = lerp(-6.0, -10.0, p)
        cam_y = lerp(0.0, 0.02, p)

    # Camera shake & Dutch roll
    shake_amp = 0.0
    if 1.20 <= t < 2.80:
        shake_amp = 0.008 * ((t - 1.20) / 1.60) ** 1.5
    elif 2.80 <= t < 3.55:
        shake_amp = 0.045 * math.exp(-(t - 2.80) * 4.5)
    shake_x = shake_amp * math.sin(t * 73.0 + 0.4)
    shake_y = shake_amp * math.cos(t * 89.0 + 1.1)
    dutch_roll = 0.0
    if 2.80 <= t < 3.55:
        dutch_roll = 4.2 * math.sin((t - 2.80) * 18.0) * math.exp(-(t - 2.80) * 4.2)

    # Super Saiyan state & hair flicker
    ssj_flicker = 0.0
    for ft in (1.85, 2.15, 2.40):
        d = abs(t - ft)
        if d < 0.075:
            ssj_flicker = max(ssj_flicker, 1.0 - d / 0.075)
    if t >= 2.80:
        ssj = 1.0
    else:
        ssj = ssj_flicker

    hair_lift = ease_out(clamp((t - 2.75) / 0.22)) if t >= 2.75 else ssj_flicker * 0.45

    # Charge & Explosion intensity
    charge = clamp((t - 0.60) / 2.20) if t < 2.80 else 1.0
    explosion_burst = math.exp(-((t - 2.80) / 0.16) ** 2) if t >= 2.78 else 0.0
    shockwave_p = clamp((t - 2.80) / 0.70) if t >= 2.80 else 0.0
    impact_flash = (1.0 if 2.80 <= t < 2.87 else 0.0)

    # Body pose parameters
    if t < 1.20:
        crouch = lerp(0.55, 0.72, smoothstep(t / 1.20))
        arm_spread = lerp(0.25, 0.15, smoothstep(t / 1.20))
        chest_arch = lerp(-0.08, -0.18, smoothstep(t / 1.20))
        mouth_open = lerp(0.05, 0.20, smoothstep(t / 1.20))
    elif t < 2.80:
        p = smoothstep((t - 1.20) / 1.60)
        crouch = lerp(0.72, 0.85, p)
        arm_spread = lerp(0.15, 0.05, p)
        chest_arch = lerp(-0.18, -0.25, p)
        mouth_open = lerp(0.20, 0.85, p)
    elif t < 3.45:
        p = ease_out((t - 2.80) / 0.65)
        crouch = lerp(0.85, 0.30, p)
        arm_spread = lerp(0.05, 0.92, p)
        chest_arch = lerp(-0.25, 0.22, p)
        mouth_open = lerp(1.0, 0.70, p)
    else:
        p = ease_in_out((t - 3.45) / 1.55)
        crouch = lerp(0.30, 0.36, p)
        arm_spread = lerp(0.92, 0.74, p)
        chest_arch = lerp(0.22, 0.12, p)
        mouth_open = lerp(0.70, 0.15, p)

    aura_power = 0.0
    if t >= 0.90 and t < 2.80:
        aura_power = 0.15 + 0.55 * ((t - 0.90) / 1.90) ** 1.3
    elif t >= 2.80:
        aura_power = 1.0 + 0.5 * explosion_burst

    return {
        "t": t,
        "camDist": cam_dist,
        "camYaw": cam_yaw,
        "camPitch": cam_pitch,
        "camY": cam_y,
        "shakeX": shake_x,
        "shakeY": shake_y,
        "dutchRoll": dutch_roll,
        "ssj": ssj,
        "hairLift": hair_lift,
        "charge": charge,
        "explosionBurst": explosion_burst,
        "shockwaveP": shockwave_p,
        "impactFlash": impact_flash,
        "crouch": crouch,
        "armSpread": arm_spread,
        "chestArch": chest_arch,
        "mouthOpen": mouth_open,
        "auraPower": aura_power,
        "eyeColor": "#2ee8b6" if ssj > 0.5 else "#141418",
        "hairMain": "#ffe44d" if ssj > 0.5 else "#151722",
        "hairHi": "#fff8b8" if ssj > 0.5 else "#3a425e",
        "hairShade": "#d49b00" if ssj > 0.5 else "#090a0f",
    }
