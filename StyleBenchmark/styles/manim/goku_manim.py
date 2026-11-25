"""ManimGL 1.7.2 Zero-LaTeX Luminous Vector Goku Super Saiyan transformation."""
import math
import sys
from pathlib import Path
import numpy as np
from manimlib import *

SHARED_DIR = Path(r"G:\AnimationLab\StyleBenchmark\shared")
sys.path.insert(0, str(SHARED_DIR))
from choreography import solve_choreography  # noqa: E402


class GokuSuperSaiyanManim(Scene):
    def construct(self):
        # Portrait 9:16 coordinate calibration in ManimGL
        self.camera.frame.set_height(8.0)

        t_tracker = ValueTracker(0.0)

        # Subtle math grid / energy vector field backdrop
        grid = NumberPlane(
            x_range=(-4, 4, 1),
            y_range=(-6, 6, 1),
            background_line_style={"stroke_color": BLUE_E, "stroke_width": 1.2, "stroke_opacity": 0.35},
            axis_config={"stroke_color": BLUE_D, "stroke_width": 1.5, "stroke_opacity": 0.4},
        )
        self.add(grid)

        title = Text("GOKU // SUPER SAIYAN VECTOR FIELD", font_size=22, color=GOLD_B)
        title.to_edge(UP, buff=0.35)
        title.fix_in_frame()
        self.add(title)

        def build_dynamic_scene():
            t = t_tracker.get_value()
            ch = solve_choreography(t)
            ssj = ch["ssj"] > 0.5
            hl = ch["hairLift"]
            spread = ch["armSpread"]
            crouch = ch["crouch"]
            yaw_rad = math.radians(ch["camYaw"])
            yaw_f = math.sin(yaw_rad) * 0.35

            grp = VGroup()

            # Camera zoom + pan + shake
            self.camera.frame.set_height(6.4 * ch["camDist"])
            self.camera.frame.move_to(np.array([
                ch["shakeX"] * 2.5,
                0.25 - ch["camY"] * 1.5 + ch["shakeY"] * 2.5,
                0.0,
            ]))

            def pt(x, y, z=0.0):
                px = (x + z * yaw_f) * 2.3
                py = (-y - crouch * 0.14) * 2.3
                return np.array([px, py, 0.0])

            # Radial Ki Vector Arrows & Parametric Waves
            if ch["auraPower"] > 0.05:
                n_rays = 24
                for i in range(n_rays):
                    ang = (i / n_rays) * TAU + t * 0.3
                    r0 = 1.15 + 0.25 * math.sin(t * 10 + i)
                    r1 = r0 + 0.8 + 1.4 * ch["auraPower"]
                    c_ray = GOLD_A if ssj else TEAL_C
                    ray = Line(
                        np.array([math.cos(ang) * r0, math.sin(ang) * r0 + 0.2, 0]),
                        np.array([math.cos(ang) * r1, math.sin(ang) * r1 + 0.2, 0]),
                        stroke_color=c_ray,
                        stroke_width=2.5 if ssj else 1.5,
                        stroke_opacity=0.45 * min(1.0, ch["auraPower"]),
                    )
                    grp.add(ray)

            # Shockwave parametric rings at t >= 2.80
            if 0.01 < ch["shockwaveP"] < 0.98:
                sw = ch["shockwaveP"]
                ring = Circle(
                    radius=0.5 + sw * 4.2,
                    stroke_color=YELLOW_A,
                    stroke_width=8 * (1.0 - sw),
                    stroke_opacity=1.0 - sw,
                ).move_to(np.array([0, 0.2, 0]))
                grp.add(ring)

            # Luminous Aura Flame Contours
            if ch["auraPower"] > 0.03:
                for layer, (col, w, sc) in enumerate([(GOLD_E, 6, 1.15), (YELLOW_B, 3, 0.92)]):
                    pts_a = []
                    for i in range(28):
                        ang = (i / 28) * TAU
                        pulse = 1.0 + 0.25 * math.sin(ang * 7 + t * 14 + layer)
                        rx = math.sin(ang) * (0.95 + 0.55 * ch["auraPower"]) * sc * pulse
                        ry = -math.cos(ang) * (1.45 + 0.85 * ch["auraPower"]) * sc * pulse + 0.35
                        pts_a.append(np.array([rx, ry, 0.0]))
                    flame = Polygon(*pts_a, stroke_color=col, stroke_width=w, stroke_opacity=0.72, fill_color=col, fill_opacity=0.08)
                    grp.add(flame)

            gi_col = "#FF8224" if ssj else "#F06218"
            blue_col = "#2E6BFF"
            skin_col = "#FFD4AD" if ssj else "#F2BC91"
            hair_col = YELLOW_B if ssj else "#4A5680"
            hair_fill = GOLD_C if ssj else "#141828"
            eye_col = "#2EE8B6" if ssj else WHITE

            # Legs & red-trimmed boots
            leg_l = Polygon(pt(-0.17, 0.02), pt(-0.02, 0.04), pt(-0.22, 0.50), pt(-0.34, 0.48), color=gi_col, fill_opacity=0.48, stroke_width=3)
            leg_r = Polygon(pt(0.02, 0.04), pt(0.17, 0.02), pt(0.34, 0.48), pt(0.22, 0.50), color=gi_col, fill_opacity=0.48, stroke_width=3)
            boot_l = Polygon(pt(-0.35, 0.50), pt(-0.22, 0.50), pt(-0.20, 0.72), pt(-0.38, 0.72), color=blue_col, fill_opacity=0.58, stroke_width=3)
            boot_r = Polygon(pt(0.22, 0.50), pt(0.35, 0.50), pt(0.38, 0.72), pt(0.20, 0.72), color=blue_col, fill_opacity=0.58, stroke_width=3)
            cuff_l = Polygon(pt(-0.35, 0.48), pt(-0.22, 0.48), pt(-0.22, 0.52), pt(-0.35, 0.52), color="#de2626", fill_opacity=0.85, stroke_width=2)
            cuff_r = Polygon(pt(0.22, 0.48), pt(0.35, 0.48), pt(0.35, 0.52), pt(0.22, 0.52), color="#de2626", fill_opacity=0.85, stroke_width=2)
            grp.add(leg_l, leg_r, boot_l, boot_r, cuff_l, cuff_r)

            # Torso + Wide Undershirt + Obi
            torso = Polygon(pt(-0.235, -0.43), pt(0.235, -0.43), pt(0.17, -0.05), pt(-0.17, -0.05), color=gi_col, fill_opacity=0.52, stroke_width=3.5)
            under = Polygon(pt(-0.14, -0.43), pt(0.14, -0.43), pt(0.0, -0.20), color=blue_col, fill_opacity=0.68, stroke_width=2.5)
            belt = Polygon(pt(-0.175, -0.07), pt(0.175, -0.07), pt(0.175, 0.01), pt(-0.175, 0.01), color=blue_col, fill_opacity=0.78, stroke_width=2.5)
            sw = math.sin(t * 14) * 0.06
            sash = Polygon(pt(-0.07, 0.01), pt(-0.01, 0.01), pt(-0.14 - sw, 0.24), pt(-0.21 - sw, 0.22), color=blue_col, fill_opacity=0.68, stroke_width=2.5)
            grp.add(torso, under, belt, sash)

            # Arms & Fists
            fx = 0.21 + spread * 0.24
            fy = -0.02 + spread * 0.11
            arm_l = Polygon(pt(-0.23, -0.40), pt(-0.17, -0.32), pt(-fx + 0.04, fy), pt(-fx - 0.05, fy - 0.04), color=skin_col, fill_opacity=0.58, stroke_width=3)
            arm_r = Polygon(pt(0.23, -0.40), pt(0.17, -0.32), pt(fx - 0.04, fy), pt(fx + 0.05, fy - 0.04), color=skin_col, fill_opacity=0.58, stroke_width=3)
            fist_l = Circle(radius=0.11, color=skin_col, fill_opacity=0.68, stroke_width=3).move_to(pt(-fx, fy + 0.02))
            fist_r = Circle(radius=0.11, color=skin_col, fill_opacity=0.68, stroke_width=3).move_to(pt(fx, fy + 0.02))
            grp.add(arm_l, arm_r, fist_l, fist_r)

            # Compact Neck + Head + Hair Dome + Face
            neck = Polygon(pt(-0.09, -0.43), pt(0.09, -0.43), pt(0.06, -0.51), pt(-0.06, -0.51), color=skin_col, fill_opacity=0.6, stroke_width=2.5)
            head = Polygon(pt(-0.095, -0.64), pt(0.095, -0.64), pt(0.088, -0.52), pt(0.0, -0.45), pt(-0.088, -0.52), color=skin_col, fill_opacity=0.68, stroke_width=3)
            dome = Polygon(pt(-0.10, -0.61), pt(-0.08, -0.71), pt(0.0, -0.73), pt(0.08, -0.71), pt(0.10, -0.61), pt(0.0, -0.64), stroke_color=hair_col, fill_color=hair_fill, fill_opacity=0.90, stroke_width=2.5)
            eye_l = Dot(pt(-0.04, -0.58, 0.05), color=eye_col, radius=0.036)
            eye_r = Dot(pt(0.04, -0.58, 0.05), color=eye_col, radius=0.036)
            mouth = Rectangle(width=0.12, height=0.03 + ch["mouthOpen"] * 0.09, color=WHITE, fill_opacity=0.8, stroke_width=1.5).move_to(pt(0.0, -0.50, 0.05))
            grp.add(neck, head, dome, eye_l, eye_r, mouth)

            # Spiky Hair Morphing Black -> SSJ Gold
            b_spikes = [
                ((-0.08, -0.62), (-0.28, -0.72), (-0.09, -0.67)),
                ((-0.09, -0.66), (-0.29, -0.82), (-0.05, -0.70)),
                ((-0.05, -0.69), (-0.16, -0.90), (0.0, -0.71)),
                ((0.0, -0.71), (0.02, -0.92), (0.05, -0.70)),
                ((0.04, -0.70), (0.22, -0.87), (0.09, -0.67)),
                ((0.08, -0.67), (0.30, -0.76), (0.10, -0.62)),
            ]
            s_spikes = [
                ((-0.09, -0.62), (-0.23, -0.84), (-0.08, -0.67)),
                ((-0.08, -0.66), (-0.21, -0.98), (-0.05, -0.70)),
                ((-0.05, -0.69), (-0.10, -1.06), (0.0, -0.71)),
                ((-0.01, -0.71), (0.01, -1.10), (0.04, -0.71)),
                ((0.03, -0.70), (0.14, -1.05), (0.08, -0.68)),
                ((0.07, -0.68), (0.24, -0.92), (0.10, -0.63)),
            ]
            for i in range(len(b_spikes)):
                pts_h = []
                for k in range(3):
                    hx = b_spikes[i][k][0] + (s_spikes[i][k][0] - b_spikes[i][k][0]) * hl
                    hy = b_spikes[i][k][1] + (s_spikes[i][k][1] - b_spikes[i][k][1]) * hl
                    pts_h.append(pt(hx, hy))
                sp = Polygon(*pts_h, stroke_color=hair_col, fill_color=hair_fill, fill_opacity=0.88, stroke_width=3.2)
                grp.add(sp)

            return grp

        dyn = always_redraw(build_dynamic_scene)
        self.add(dyn)
        self.play(t_tracker.animate.set_value(5.0), run_time=5.0, rate_func=linear)
