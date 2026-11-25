"""Generate procedural Dragon Ball Z Goku Rigby2D skeleton JSON, atlas, and sprite sheet PNG."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(r"G:\AnimationLab\StyleBenchmark\styles\rigby2d\assets")
OUT.mkdir(parents=True, exist_ok=True)


def make_assets():
    atlas_w, atlas_h = 1024, 1024
    img = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))
    regions = {}

    def add_part(name, x, y, w, h, fn):
        sub = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        fn(ImageDraw.Draw(sub), w, h)
        img.paste(sub, (x, y))
        regions[name] = (x, y, w, h)

    def draw_torso(d, w, h):
        # Wide muscular V-taper orange gi + royal blue undershirt + crossed lapels + knotted obi
        d.polygon([(14, 10), (w - 14, 10), (w - 32, h - 12), (32, h - 12)], fill="#f25e12", outline="#181016", width=4)
        d.polygon([(w // 2 - 58, 10), (w // 2 + 58, 10), (w // 2, 125)], fill="#1e50c8", outline="#181016", width=3)
        d.line([(w // 2 - 54, 14), (w // 2 + 12, 132)], fill="#181016", width=4)
        d.line([(w // 2 + 54, 14), (w // 2 - 8, 120)], fill="#181016", width=4)
        d.rectangle([28, h - 44, w - 28, h - 10], fill="#1e50c8", outline="#181016", width=4)

    def draw_leg(d, w, h):
        # Baggy pleated gi pant + red-trimmed blue boot + yellow ankle tie
        d.polygon([(16, 4), (w - 12, 4), (w - 6, 130), (w - 20, h - 82), (16, h - 82), (4, 125)], fill="#f25e12", outline="#181016", width=4)
        d.polygon([(14, h - 82), (w - 18, h - 82), (w - 6, h - 8), (6, h - 8)], fill="#1e50c8", outline="#181016", width=4)
        d.rectangle([14, h - 84, w - 18, h - 68], fill="#de2626", outline="#181016", width=3)
        d.line([(10, h - 48), (w - 14, h - 48)], fill="#f8cc38", width=6)

    def draw_arm(d, w, h):
        d.polygon([(14, 6), (w - 14, 6), (w - 20, h - 56), (20, h - 56)], fill="#f5be92", outline="#4a2318", width=4)
        d.rectangle([16, h - 60, w - 16, h - 34], fill="#1e50c8", outline="#181016", width=3)
        d.polygon([(14, h - 34), (w - 14, h - 34), (w - 10, h - 8), (22, h - 4), (10, h - 14)], fill="#f5be92", outline="#4a2318", width=4)

    def draw_sash(d, w, h):
        d.polygon([(16, 4), (w - 16, 4), (w - 4, h - 8), (4, h - 8)], fill="#1e50c8", outline="#10183a", width=3)

    def draw_head(d, w, h):
        d.polygon([(18, 22), (w - 18, 22), (w - 22, h - 42), (w // 2, h - 8), (22, h - 42)], fill="#f5be92", outline="#4a2318", width=4)
        d.polygon([(34, 64), (68, 72), (62, 84), (36, 80)], fill="#ffffff", outline="#18121a", width=2)
        d.polygon([(w - 34, 64), (w - 68, 72), (w - 62, 84), (w - 36, 80)], fill="#ffffff", outline="#18121a", width=2)
        d.ellipse([48, 69, 62, 82], fill="#14141c")
        d.ellipse([w - 62, 69, w - 48, 82], fill="#14141c")
        d.line([(30, 58), (70, 68)], fill="#14141c", width=5)
        d.line([(w - 30, 58), (w - 70, 68)], fill="#14141c", width=5)
        d.polygon([(w // 2 - 18, 106), (w // 2 + 18, 106), (w // 2 + 14, 128), (w // 2 - 14, 128)], fill="#4d0f18", outline="#4a2318", width=2)
        d.rectangle([w // 2 - 15, 107, w // 2 + 15, 113], fill="#ffffff")

    def draw_hair_base(d, w, h):
        pts = [
            (w // 2 - 64, h - 25), (16, h - 38), (68, h - 90),
            (8, h - 125), (84, h - 135), (46, 36),
            (w // 2 - 16, h - 145), (w // 2 + 10, 10), (w // 2 + 38, h - 140),
            (w - 38, 44), (w - 74, h - 120), (w - 8, h - 102),
            (w - 56, h - 62), (w - 14, h - 34), (w // 2 + 64, h - 25),
        ]
        d.polygon(pts, fill="#141724", outline="#07080d", width=4)

    def draw_hair_ssj(d, w, h):
        pts = [
            (w // 2 - 62, h - 22), (28, h - 62), (70, h - 110),
            (22, 62), (88, h - 155), (68, 20),
            (w // 2 - 20, h - 165), (w // 2, 4), (w // 2 + 22, h - 165),
            (w - 66, 20), (w - 84, h - 150), (w - 20, 64),
            (w - 66, h - 105), (w - 26, h - 60), (w // 2 + 62, h - 22),
        ]
        d.polygon(pts, fill="#ffe240", outline="#b87e00", width=4)
        d.polygon([(w // 2 - 22, h - 90), (w // 2, 18), (w // 2 + 22, h - 90)], fill="#fff8be")

    add_part("torso", 4, 4, 220, 260, draw_torso)
    add_part("leg_l", 230, 4, 114, 280, draw_leg)
    add_part("leg_r", 350, 4, 114, 280, draw_leg)
    add_part("arm_l", 470, 4, 96, 230, draw_arm)
    add_part("arm_r", 572, 4, 96, 230, draw_arm)
    add_part("sash", 674, 4, 60, 160, draw_sash)
    add_part("head", 4, 290, 160, 155, draw_head)
    add_part("hair_base", 170, 290, 320, 230, draw_hair_base)
    add_part("hair_ssj", 496, 290, 320, 250, draw_hair_ssj)

    img.save(OUT / "goku.png")

    atlas_lines = ["goku.png", f"size: {atlas_w}, {atlas_h}", "filter: Linear, Linear"]
    for name, (x, y, w, h) in regions.items():
        atlas_lines.append(name)
        atlas_lines.append(f"bounds: {x}, {y}, {w}, {h}")
    (OUT / "goku.atlas").write_text("\n".join(atlas_lines) + "\n", encoding="utf-8")

    bones = [
        {"name": "root"},
        {"name": "hip", "parent": "root", "y": 290, "rotation": 90},
        {"name": "chest", "parent": "hip", "length": 220, "x": 20},
        {"name": "head", "parent": "chest", "length": 140, "x": 210},
        {"name": "hair", "parent": "head", "x": 92},
        {"name": "leg_l", "parent": "root", "x": -52, "y": 290, "rotation": -104},
        {"name": "leg_r", "parent": "root", "x": 52, "y": 290, "rotation": -76},
        {"name": "arm_l", "parent": "chest", "x": 195, "y": 82, "rotation": 152},
        {"name": "arm_r", "parent": "chest", "x": 195, "y": -82, "rotation": -152},
        {"name": "sash", "parent": "hip", "x": -10, "y": 15, "rotation": 175},
    ]
    slots = [
        {"name": "leg_l", "bone": "leg_l", "attachment": "leg_l"},
        {"name": "leg_r", "bone": "leg_r", "attachment": "leg_r"},
        {"name": "sash", "bone": "sash", "attachment": "sash"},
        {"name": "torso", "bone": "chest", "attachment": "torso"},
        {"name": "arm_l", "bone": "arm_l", "attachment": "arm_l"},
        {"name": "arm_r", "bone": "arm_r", "attachment": "arm_r"},
        {"name": "hair", "bone": "hair", "attachment": "hair_base"},
        {"name": "head", "bone": "head", "attachment": "head"},
    ]
    skins = [{
        "name": "default",
        "attachments": {
            "torso": {"torso": {"x": 115, "y": 0, "rotation": -90, "width": 220, "height": 260}},
            "leg_l": {"leg_l": {"x": 135, "y": 0, "rotation": 90, "width": 114, "height": 280}},
            "leg_r": {"leg_r": {"x": 135, "y": 0, "rotation": 90, "width": 114, "height": 280}},
            "arm_l": {"arm_l": {"x": 105, "y": 0, "rotation": 90, "width": 96, "height": 230}},
            "arm_r": {"arm_r": {"x": 105, "y": 0, "rotation": 90, "width": 96, "height": 230}},
            "sash": {"sash": {"x": 70, "y": 0, "rotation": 90, "width": 60, "height": 160}},
            "head": {"head": {"x": 65, "y": 0, "rotation": -90, "width": 160, "height": 155}},
            "hair": {
                "hair_base": {"x": 55, "y": 0, "rotation": -90, "width": 320, "height": 230},
                "hair_ssj": {"x": 70, "y": 0, "rotation": -90, "width": 320, "height": 250},
            },
        },
    }]

    animations = {
        "transform": {
            "slots": {
                "hair": {
                    "attachment": [
                        {"time": 0.0, "name": "hair_base"},
                        {"time": 1.80, "name": "hair_ssj"},
                        {"time": 1.92, "name": "hair_base"},
                        {"time": 2.10, "name": "hair_ssj"},
                        {"time": 2.22, "name": "hair_base"},
                        {"time": 2.35, "name": "hair_ssj"},
                        {"time": 2.46, "name": "hair_base"},
                        {"time": 2.80, "name": "hair_ssj"},
                    ]
                }
            },
            "bones": {
                "hip": {
                    "translate": [
                        {"time": 0.0, "y": 0},
                        {"time": 1.2, "y": -25},
                        {"time": 2.75, "y": -45},
                        {"time": 2.95, "y": 15},
                        {"time": 5.0, "y": 0},
                    ],
                    "rotate": [
                        {"time": 0.0, "value": 0},
                        {"time": 2.75, "value": -12},
                        {"time": 2.95, "value": 10},
                        {"time": 5.0, "value": 4},
                    ],
                },
                "arm_l": {
                    "rotate": [
                        {"time": 0.0, "value": 0},
                        {"time": 1.5, "value": -22},
                        {"time": 2.75, "value": -35},
                        {"time": 2.95, "value": 48},
                        {"time": 5.0, "value": 36},
                    ]
                },
                "arm_r": {
                    "rotate": [
                        {"time": 0.0, "value": 0},
                        {"time": 1.5, "value": 22},
                        {"time": 2.75, "value": 35},
                        {"time": 2.95, "value": -48},
                        {"time": 5.0, "value": -36},
                    ]
                },
                "sash": {
                    "rotate": [
                        {"time": 0.0, "value": 0},
                        {"time": 1.4, "value": 18},
                        {"time": 2.8, "value": 42},
                        {"time": 3.5, "value": 28},
                        {"time": 4.2, "value": 46},
                        {"time": 5.0, "value": 32},
                    ]
                },
            },
        }
    }

    skel = {
        "skeleton": {"hash": "goku", "spine": "4.3.0", "x": -240, "y": 0, "width": 480, "height": 680},
        "bones": bones,
        "slots": slots,
        "skins": skins,
        "animations": animations,
    }
    (OUT / "goku.json").write_text(json.dumps(skel, indent=2), encoding="utf-8")
    print("Generated Rigby2D Goku assets in", OUT)


if __name__ == "__main__":
    make_assets()
