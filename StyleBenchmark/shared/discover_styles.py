"""Discover every distinct art style in G:\\AnimationLab and initialize manifest.json."""
import json
import re
from pathlib import Path

LAB_ROOT = Path(r"G:\AnimationLab")
OUT_ROOT = LAB_ROOT / "StyleBenchmark"
MANIFEST_PATH = OUT_ROOT / "manifest.json"


def normalize_category(raw_cat: str, slug: str = "", source: str = "") -> str:
    s = (raw_cat + " " + slug).lower()
    if any(k in s for k in ["cel-anime", "shinkai", "ghibli", "anime", "manga"]):
        return "2D Anime"
    if any(k in s for k in ["hd-2d", "2.5d", "grease-pencil", "isometric-picture", "memphis-diorama", "paper-popup"]):
        return "2.5D & HD-2D"
    if any(k in s for k in ["pixel", "8bit", "8-bit", "gameboy", "microgame", "living-screencast"]):
        return "Pixel Art"
    if any(k in s for k in ["3d", "lowpoly", "low-poly", "low_poly", "clay", "cardboard", "voxel", "brick", "toybrick", "tilt-shift", "glass-product", "crayon-world", "white-model", "data-physical", "raytrace", "pixar"]):
        return "3D & Miniature"
    if any(k in s for k in ["watercolor", "impasto", "ink-wash", "ink", "sumi", "ukiyoe", "woodcut", "shadow-puppet", "shadowpuppet", "papercut", "paper-lantern", "papercraft", "fox", "stained-glass", "gilded", "oil", "paintedoil", "brokencolour", "dreamglaze", "embroidery", "folktale", "ranunculus", "storybook", "wren", "cave", "egypt", "greek", "roman", "gothic", "renaissance", "impressionism", "postimp", "nouveau", "klimt", "munch", "dunhuang", "monet", "seurat", "matisse", "rembrandt", "picasso", "giotto", "piero", "raphael", "michelangelo", "guardi", "lorenzetti", "cortona", "renoir", "pissarro", "sisley", "gauguin", "chagall", "ma_yuan", "persian"]):
        return "Traditional Art"
    if any(k in s for k in ["risograph", "lighthouse", "halftone", "engraving", "mellan", "silkscreen", "printed-long", "pop-art", "pop", "vintage-collage", "scrapbook", "scratchboard", "stipple", "colored-pencil", "colouredpencil", "crayon", "balloon", "urban-sketch", "one-line", "whiteboard", "chalkboard", "moonphases", "sketchnote", "stick-explainer", "ipad-sketch", "marker-paper", "koi", "charcoal", "pocketwatch"]):
        return "Print & Sketch"
    if any(k in s for k in ["rubber-hose", "rubberhose", "scifi-toon", "midcentury", "comic", "kirby", "haring", "south_park", "storytime", "skeletal"]):
        return "Cartoon & Comic"
    if any(k in s for k in ["crt", "silent-film", "backrooms", "scratch-film", "double-exposure", "newsreel", "vaporwave", "old-film", "crosshatch", "film", "archive-lighttable"]):
        return "Film & Retro"
    if any(k in s for k in ["hologram", "circuit", "neon", "oscilloscope", "lidar", "radar", "dark-documentary", "thermal", "security-xray", "dark-keynote", "desktop-flythrough", "spreadsheet", "one-bit", "ascii", "satellite", "bloom", "glitch"]):
        return "Sci-Fi & Interfaces"
    if any(k in s for k in ["blueprint", "iso-infographic", "isometric", "teardown", "hardcore-info", "precise-mechanism", "instruction-manual", "pen-plotter", "assembly-line", "dataviz", "transit-map", "map-explainer", "briefing-board", "microscope", "swiss", "bauhaus", "art-deco", "pictogram", "flat-space", "flatvector", "kurzgesagt", "vox", "manim", "2026"]):
        return "Diagrams & Data"
    return "Experimental"


def discover_lemo() -> list[dict]:
    styles_dir = LAB_ROOT / "experimental" / "lemo-opuscar" / "styles"
    entries = []
    for p in sorted(styles_dir.iterdir()):
        if not p.is_dir() or p.name.startswith("_"):
            continue
        sj = p / "style.json"
        if not sj.exists():
            continue
        data = json.loads(sj.read_text(encoding="utf-8"))
        slug = data.get("slug", p.name)
        name = data.get("en", slug)
        raw_cat = data.get("category_en", "Experimental")
        entries.append({
            "id": f"lemo-{slug}",
            "name": name,
            "category": normalize_category(raw_cat, slug, "Lemo-Opuscar"),
            "sub_category": raw_cat,
            "source_repo": "Lemo-Opuscar",
            "engine": "Lemo-Opuscar (Canvas2D/WebGL2)",
            "medium_summary": data.get("line", f"Lemo-Opuscar {name} style"),
            "slug": slug,
            "source_path": str(OUT_ROOT / "styles" / "lemo" / "render_lemo_batch.mjs"),
        })
    return entries


HUASHU_NAMES = {
    "01_cave": ("Cave Painting (Lascaux Ochre)", "Traditional Art", "Mineral ochre pigment, charcoal contour, rough limestone cave wall"),
    "02_egypt": ("Egyptian Tomb Fresco", "Traditional Art", "Flat profile register, lapis & gold pigment on limestone plaster"),
    "03_greek": ("Attic Black-Figure Pottery", "Traditional Art", "Terracotta clay ground with glossy black slip silhouettes & incised lines"),
    "04_roman": ("Roman Tesserae Mosaic", "Traditional Art", "Hand-laid stone and glass mosaic tiles with lime grout"),
    "05_gothic": ("Gothic Illuminated Manuscript", "Traditional Art", "Vellum parchment, ultramarine, vermilion, gold leaf borders"),
    "06_renaissance": ("High Renaissance Fresco", "Traditional Art", "Chiaroscuro volume, sfumato atmospheric depth, warm lime plaster"),
    "08_impressionism": ("Impressionism (Broken Brush)", "Traditional Art", "Complementary broken dabs, dappled sunlight, plein-air brushwork"),
    "09_postimp": ("Post-Impressionism (Van Gogh Swirl)", "Traditional Art", "Thick rhythmic impasto swirls, cobalt sky, chrome yellow energy"),
    "10_nouveau": ("Art Nouveau Poster (Mucha)", "Traditional Art", "Whiplash organic ink contours, floral halo framing, muted lithograph"),
    "11_cubism": ("Analytical Cubism", "Experimental", "Fractured geometric planes, multiple simultaneous viewpoints, ochre & slate"),
    "12_bauhaus": ("Bauhaus Geometric", "Diagrams & Data", "Primary red/yellow/blue geometric forms, diagonal grid discipline"),
    "13_pop": ("Pop Art Screenprint (Warhol)", "Print & Sketch", "High-contrast silkscreen blocks, bold primary ink & halftone dots"),
    "14_8bit": ("8-Bit Retro Pixel", "Pixel Art", "Crisp low-res pixel grid, limited arcade palette, chunky sprites"),
    "15_raytrace": ("1993 Ray-Traced CGI", "3D & Miniature", "Early 90s reflective chrome spheres, checkerboard horizon, specular highlights"),
    "16_2026": ("2026 Flat Vector Illustration", "Diagrams & Data", "Clean modern editorial vector shapes, soft paper grain, vibrant palette"),
    "17_ink": ("Chinese Freehand Ink (Bada Shanren)", "Traditional Art", "Expressive sumi ink washes, flying-white dry brush on Xuan paper"),
    "18_klimt": ("Klimt Golden Period", "Traditional Art", "Byzantine gold-leaf mosaic robes, spiral ornamentation, rich jewel tones"),
    "19_munch": ("Munch Expressionism (The Scream)", "Traditional Art", "Wavy undulating blood-orange sky, anxious brushstrokes, high contrast"),
    "20_dunhuang": ("Dunhuang Tang Mural", "Traditional Art", "Mineral malachite green & cinnabar on aged clay wall, flowing ribbons"),
    "21_kusama": ("Yayoi Kusama Infinity Dots", "Experimental", "Obsessive repeating polka-dot matrices across figure and void"),
    "22_constructivism": ("Soviet Constructivist Poster", "Print & Sketch", "Aggressive red/black/cream diagonal wedges, stencil typography feel"),
    "23_dali": ("Dalí Surrealism", "Experimental", "Hyper-sharp dreamscape horizon, melting forms, dramatic long shadows"),
    "24_hopper": ("Hopper American Realism", "Traditional Art", "Stark architectural sunlight, deep teal shadows, dramatic isolation"),
    "25_ghibli": ("Ghibli Watercolor Cel", "2D Anime", "Multi-pass pooled watercolor backgrounds with warm-brown lined 2-tone cel"),
    "26_vaporwave": ("Vaporwave Synthwave", "Film & Retro", "Neon magenta/cyan wireframe horizon, VHS scanlines, sunset grid"),
    "27_kirby": ("Jack Kirby Comic Krackle", "Cartoon & Comic", "Heavy spotting blacks, Ben-Day dots, Kirby Krackle energy spheres"),
    "28_monet": ("Monet Water Lilies", "Traditional Art", "Soft shimmering lavender/turquoise reflections, dissolved outlines"),
    "29_seurat": ("Seurat Pointillism", "Traditional Art", "Optical color mixing via dense pure pigment dots"),
    "30_matisse": ("Matisse Paper Cutouts", "Traditional Art", "Bold gouache-painted organic paper shapes cut with crisp scissors"),
    "31_haring": ("Keith Haring Radiant Graffiti", "Cartoon & Comic", "Thick uniform black outlines, radiant action lines, bright pop fills"),
    "32_rembrandt": ("Rembrandt Chiaroscuro", "Traditional Art", "Dramatic directional spotlight emerging from deep umber shadow"),
    "33_rubberhose": ("1930s Rubber Hose Toon", "Cartoon & Comic", "B&W vintage cel, pie-cut eyes, bouncy ink hoses, film flicker"),
    "34_shadowpuppet": ("Northern Song Shadow Puppetry", "Traditional Art", "Backlit translucent carved leather silhouette behind warm rice-paper screen"),
    "35_shinkai": ("Makoto Shinkai Light & Clouds", "2D Anime", "Towering sunlit cumulonimbus clouds, anamorphic lens flare, crisp backlit cel"),
    "36_picasso_blue": ("Picasso Blue Period", "Traditional Art", "Monochromatic Prussian & indigo oil washes, angular solemn silhouette"),
    "38_giotto": ("Giotto Proto-Renaissance Fresco", "Traditional Art", "Lapis lazuli sky, monumental sculpted drapery on plaster"),
    "39_piero": ("Piero della Francesca Geometry", "Traditional Art", "Mathematically poised perspective, pale luminous tempera daylight"),
    "40_raphael": ("Raphael Classical Balance", "Traditional Art", "Pyramidal composition, harmonious warm skin tones, graceful drapery"),
    "41_michelangelo": ("Michelangelo Sistine Fresco", "Traditional Art", "Heroic sculptural musculature, dramatic foreshortening, vivid fresco"),
    "42_guardi": ("Guardi Venetian Veduta", "Traditional Art", "Luminous atmospheric lagoon light, brisk calligraphic highlights"),
    "43_lorenzetti": ("Lorenzetti Sienese Mural", "Traditional Art", "Panoramic terracotta architecture, jewel-toned medieval narrative"),
    "44_cortona": ("Cortona Baroque Ceiling", "Traditional Art", "Swirling dramatic clouds, golden divine light rays, dynamic upward view"),
    "45_renoir": ("Renoir Sunlit Impressionism", "Traditional Art", "Feathery warm rose & gold brushwork, luminous dappled highlights"),
    "46_pissarro": ("Pissarro Rural Impressionism", "Traditional Art", "Earthy structured brushstrokes, crisp atmospheric perspective"),
    "47_sisley": ("Sisley Sky & Light", "Traditional Art", "Expansive luminous skies, silvery-blue atmospheric brushwork"),
    "48_gauguin": ("Gauguin Cloisonnism", "Traditional Art", "Flat saturated tropical color zones bound by dark Prussian contours"),
    "49_chagall": ("Chagall Dream Folk", "Traditional Art", "Floating weightless forms, jewel-toned cobalt & emerald washes"),
    "50_ma_yuan": ("Ma Yuan Song Landscape", "Traditional Art", "Asymmetric 'one-corner' ink composition, vast misty negative space"),
    "51_persian_miniature": ("Persian Illuminated Miniature", "Traditional Art", "Flat jewel-like gouache, intricate floral borders, gold ink detail"),
    "52_south_park": ("Cut-Paper Construction Comedy", "Cartoon & Comic", "Flat layered construction paper cutouts, stepped 12fps motion"),
    "53_pixar": ("Stylized 3D Warm CGI", "3D & Miniature", "Soft subsurface gradients, rim lighting, glossy stylized 3D forms"),
    "y1_kurzgesagt": ("Kurzgesagt Space Vector", "Diagrams & Data", "Glowing cosmic gradients, geometric flat icons, crisp rim highlights"),
    "y2_vox": ("Vox Editorial Documentary", "Diagrams & Data", "Warm newsprint collage, yellow highlight marker accents, clean sans callouts"),
    "y3_whiteboard": ("Whiteboard Marker Explainer", "Print & Sketch", "Clean dry-erase marker lines on bright whiteboard with subtle shadow"),
    "y4_storytime": ("Storytime Expressive Sketch", "Cartoon & Comic", "Bouncy hand-drawn white-canvas character rig, bold expressive faces"),
    "y5_kinetic_type": ("Kinetic Typography Impact", "Experimental", "Oversized bold kinetic type cards, rhythmic screen cuts & speedlines"),
    "t2_keynote_ui": ("Keynote Tech Presentation", "Sci-Fi & Interfaces", "Sleek dark keynote glass cards, crisp metric callouts & glow"),
    "t3_finance_chart": ("Financial Telemetry Chart", "Diagrams & Data", "Live power-level candlestick & area curve over dark telemetry grid"),
    "painted_room": ("Painted Room Brushwork", "Traditional Art", "Atmospheric hand-painted interior light shafts and soft gouache fills"),
    "rick_morty": ("Adult Sci-Fi Portal Toon", "Cartoon & Comic", "Wobbly black ink outlines, neon green sci-fi portal swirls, vibrant cel"),
}


def discover_huashu() -> tuple[list[dict], list[dict]]:
    scenes_dir = LAB_ROOT / "experimental" / "huashu-art-motion" / "scripts" / "engine" / "scenes"
    deduped = []
    entries = []
    duplicates_map = {
        "54_ghibli_lab": "huashu-25_ghibli",
        "55_dunhuang": "huashu-20_dunhuang",
    }
    for p in sorted(scenes_dir.glob("*.js")):
        if p.name == "index.js":
            continue
        stem = p.stem
        if stem in duplicates_map:
            deduped.append({
                "skipped_id": f"huashu-{stem}",
                "kept_id": duplicates_map[stem],
                "reason": "Internal Huashu research duplicate of existing mature scene style",
            })
            continue
        name, cat, medium = HUASHU_NAMES.get(stem, (stem, "Traditional Art", f"Huashu {stem}"))
        entries.append({
            "id": f"huashu-{stem}",
            "name": name,
            "category": cat,
            "sub_category": "Art History & Motion Grammar",
            "source_repo": "Huashu Art Motion",
            "engine": "Huashu Engine (Canvas2D)",
            "medium_summary": medium,
            "slug": stem,
            "source_path": str(OUT_ROOT / "styles" / "huashu" / "render_huashu_batch.mjs"),
        })
    for gid in ["y1_kurzgesagt", "y2_vox", "y3_whiteboard", "y4_storytime", "y5_kinetic_type", "t2_keynote_ui", "t3_finance_chart", "painted_room", "rick_morty"]:
        name, cat, medium = HUASHU_NAMES[gid]
        entries.append({
            "id": f"huashu-{gid}",
            "name": name,
            "category": cat,
            "sub_category": "YouTube Motion Grammar & Reference Films",
            "source_repo": "Huashu Art Motion",
            "engine": "Huashu Engine (Canvas2D)",
            "medium_summary": medium,
            "slug": gid,
            "source_path": str(OUT_ROOT / "styles" / "huashu" / "render_huashu_batch.mjs"),
        })
    return entries, deduped


def discover_anidoodle() -> list[dict]:
    index_md = LAB_ROOT / "experimental" / "anidoodle" / "skills" / "anidoodle" / "references" / "styles" / "INDEX.md"
    txt = index_md.read_text(encoding="utf-8")
    entries = []
    # Match rows: | 1 | Crayon (`balloon`) | description | ...
    pat = re.compile(r"^\|\s*\d+\s*\|\s*([^|`]+?)\s*\(`([^`]+)`\)\s*\|\s*([^|]+?)\s*\|", re.MULTILINE)
    for m in pat.finditer(txt):
        label, slug, medium = m.group(1).strip(), m.group(2).strip(), m.group(3).strip()
        entries.append({
            "id": f"anidoodle-{slug}",
            "name": label,
            "category": normalize_category(label + " " + medium, slug, "Anidoodle"),
            "sub_category": "Craft Medium",
            "source_repo": "Anidoodle",
            "engine": "Anidoodle Canvas-Core",
            "medium_summary": medium,
            "slug": slug,
            "source_path": str(OUT_ROOT / "styles" / "anidoodle" / "render_anidoodle_batch.mjs"),
        })
    extras = [
        ("almond-blossom", "Almond Blossom Impasto", "Traditional Art", "House style: Van Gogh turquoise sky with blossoming branches & thick impasto"),
        ("pastel-blotch", "Pastel Blotch Gouache", "Traditional Art", "House style: Soft dusty pastel blotches and delicate cream paper wash"),
        ("quiet-scrapbook", "Quiet Archival Scrapbook", "Print & Sketch", "House style: Muted rag paper, pinned botanical cards and subtle sepia stamp"),
        ("three-3d", "Anidoodle Three.js 3D Stage", "3D & Miniature", "Anidoodle three-core WebGL 3D stage with dynamic 3D camera orbit and crystal shards"),
    ]
    for slug, label, cat, medium in extras:
        entries.append({
            "id": f"anidoodle-{slug}",
            "name": label,
            "category": cat,
            "sub_category": "House & Three-Core",
            "source_repo": "Anidoodle",
            "engine": "Anidoodle Three-Core (WebGL)" if slug == "three-3d" else "Anidoodle Canvas-Core",
            "medium_summary": medium,
            "slug": slug,
            "source_path": str(OUT_ROOT / "styles" / "anidoodle" / "render_anidoodle_batch.mjs"),
        })
    return entries


def discover_native_engines() -> list[dict]:
    blender_styles = [
        ("blender-cel-anime-3d", "3D Cel-Shaded Anime", "2D Anime", "EEVEE Shader-to-RGB stepped toon shading + inverted-hull ink outlines"),
        ("blender-low-poly-3d", "Low-Poly 3D Faceted", "3D & Miniature", "Flat-shaded faceted 3D geometry with crisp planar energy facets"),
        ("blender-claymation", "Claymation Stop-Motion", "3D & Miniature", "Rounded clay forms, procedural fingerprint bump, SSS, 12fps stepped motion"),
        ("blender-cardboard-diorama", "Cardboard Diorama", "3D & Miniature", "Layered corrugated kraft-cardboard cutouts with raw edges & tabletop shadows"),
        ("blender-paper-cutout-3d", "3D Paper Cut-Out Theatre", "2.5D & HD-2D", "Multi-plane colored cardstock silhouettes with Z-parallax & shallow DoF"),
        ("blender-voxel-3d", "3D Voxel Blocks", "3D & Miniature", "Remeshed block-voxel Goku & crater with emissive voxel aura"),
        ("blender-stylized-pbr", "Stylized Hero PBR 3D", "3D & Miniature", "Subsurface skin, cloth gi weave, emissive bloom aura & compositor glare"),
        ("blender-grease-pencil-25d", "2.5D Grease Pencil Sketch", "2.5D & HD-2D", "Blender LineArt ink strokes over warm animation paper in 3D space"),
    ]
    godot_styles = [
        ("godot-hd-2d", "Godot HD-2D Tilted Arena", "2.5D & HD-2D", "Nearest-neighbor pixel Goku Sprite3D in lit 3D arena with bloom & GPUParticles3D"),
        ("godot-2d-shonen-vfx", "Godot 2D Shonen Shader VFX", "2D Anime", "Articulated 2D Goku with custom GLSL shockwave/aura shaders & GPUParticles2D"),
        ("godot-3d-toon-arena", "Godot 3D Spatial Toon", "3D & Miniature", "Procedural 3D Goku with spatial cel shader, outline pass & Vulkan glow"),
    ]
    pixelorama_styles = [
        ("pixelorama-hd-pixel-art", "Pixelorama HD Pixel Art", "Pixel Art", "Pixelorama CLI-exported animated pixel sprites with 16-color shading & parallax"),
        ("pixelorama-gameboy-dmg", "Pixelorama Game Boy DMG", "Pixel Art", "Strict 4-tone olive Game Boy palette, Bayer dithering & LCD pixel matrix"),
    ]
    other_styles = [
        ("rigby2d-skeletal-anime", "Rigby2D Skeletal Anime", "Cartoon & Comic", "Hierarchical Rigby2D bone chain rig rendered via PixiJS 8", "Rigby2D", "Rigby2D + PixiJS 8", str(OUT_ROOT / "styles" / "rigby2d" / "render_rigby2d.mjs")),
        ("pixijs-neon-bloom-vfx", "PixiJS Neon Bloom & Shockwave", "Sci-Fi & Interfaces", "PixiJS 8 AdvancedBloom, ShockwaveFilter, GodrayFilter & particle-emitter", "PixiJS", "PixiJS 8 + pixi-filters", str(OUT_ROOT / "styles" / "pixijs" / "render_pixijs_batch.mjs")),
        ("pixijs-crt-glitch-arcade", "PixiJS CRT Glitch Arcade", "Film & Retro", "PixiJS 8 PixelateFilter, CRTFilter, GlitchFilter & OutlineFilter", "PixiJS", "PixiJS 8 + pixi-filters", str(OUT_ROOT / "styles" / "pixijs" / "render_pixijs_batch.mjs")),
        ("pixijs-crosshatch-film", "PixiJS Crosshatch Vintage Film", "Film & Retro", "PixiJS 8 CrossHatchFilter, OldFilmFilter & EmbossFilter", "PixiJS", "PixiJS 8 + pixi-filters", str(OUT_ROOT / "styles" / "pixijs" / "render_pixijs_batch.mjs")),
        ("manim-luminous-vector", "ManimGL Luminous Vector Math", "Diagrams & Data", "ManimGL OpenGL glowing vector contours, radial ki field arrows & parametric waves", "Manim", "ManimGL 1.7.2 (OpenGL)", str(OUT_ROOT / "styles" / "manim" / "goku_manim.py")),
        ("remotion-bold-anime-kinetic", "Remotion Bold Anime Kinetic", "2D Anime", "React/SVG spring-physics Goku, radial speedlines & B&W impact flash", "Remotion", "Remotion 4.0", str(OUT_ROOT / "styles" / "remotion" / "render_remotion.ps1")),
        ("remotion-manga-split-panel", "Remotion Manga Split-Panel", "Cartoon & Comic", "Multi-panel B&W manga grid that shatters into full-bleed golden climax", "Remotion", "Remotion 4.0", str(OUT_ROOT / "styles" / "remotion" / "render_remotion.ps1")),
        ("motion-canvas-procedural-kinetic", "Motion Canvas Procedural Kinetic", "Diagrams & Data", "Generator-driven TypeScript 2D morphing curves & golden aura pulses", "Motion Canvas", "Motion Canvas 3.17.2", str(OUT_ROOT / "styles" / "motion-canvas" / "render_motion_canvas.mjs")),
    ]

    entries = []
    for sid, name, cat, med in blender_styles:
        entries.append({
            "id": sid, "name": name, "category": cat, "sub_category": "Blender 3D",
            "source_repo": "Blender", "engine": "Blender 5.2.2 LTS (EEVEE)",
            "medium_summary": med, "slug": sid,
            "source_path": str(OUT_ROOT / "styles" / "blender" / "render_blender_styles.py"),
        })
    for sid, name, cat, med in godot_styles:
        entries.append({
            "id": sid, "name": name, "category": cat, "sub_category": "Godot Engine",
            "source_repo": "Godot", "engine": "Godot 4.7.2 (Movie Maker)",
            "medium_summary": med, "slug": sid,
            "source_path": str(OUT_ROOT / "styles" / "godot" / sid),
        })
    for sid, name, cat, med in pixelorama_styles:
        entries.append({
            "id": sid, "name": name, "category": cat, "sub_category": "Pixel Art",
            "source_repo": "Pixelorama", "engine": "Pixelorama CLI (Godot 4.7.2)",
            "medium_summary": med, "slug": sid,
            "source_path": str(OUT_ROOT / "styles" / "pixelorama" / "render_pixelorama.py"),
        })
    for sid, name, cat, med, repo, eng, src in other_styles:
        entries.append({
            "id": sid, "name": name, "category": cat, "sub_category": repo,
            "source_repo": repo, "engine": eng,
            "medium_summary": med, "slug": sid, "source_path": src,
        })
    return entries


def main():
    lemo = discover_lemo()
    huashu, deduped = discover_huashu()
    anidoodle = discover_anidoodle()
    native = discover_native_engines()

    all_styles = native + anidoodle + huashu + lemo
    # Preserve completion status if manifest already exists
    existing = {}
    if MANIFEST_PATH.exists():
        old = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        for item in old.get("styles", []):
            existing[item["id"]] = item

    merged = []
    for s in all_styles:
        prev = existing.get(s["id"], {})
        entry = {
            **s,
            "status": prev.get("status", "pending"),
            "video_path": prev.get("video_path", f"videos/{s['id']}.mp4"),
            "preview_path": prev.get("preview_path", f"previews/{s['id']}.jpg"),
            "duration_sec": prev.get("duration_sec", None),
            "width": prev.get("width", None),
            "height": prev.get("height", None),
            "fps": prev.get("fps", None),
            "file_size_bytes": prev.get("file_size_bytes", None),
            "error": prev.get("error", None),
        }
        merged.append(entry)

    counts_by_repo = {}
    for s in merged:
        counts_by_repo[s["source_repo"]] = counts_by_repo.get(s["source_repo"], 0) + 1

    manifest = {
        "project": "Animation Art Style Showdown — Goku Super Saiyan",
        "specs": {
            "duration_sec": 5.0,
            "width": 720,
            "height": 1280,
            "fps": 30,
            "total_frames": 150,
            "codec": "h264",
            "audio": "aac",
        },
        "total_discovered": len(merged),
        "counts_by_repo": counts_by_repo,
        "deduplicated": deduped,
        "styles": merged,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Discovered {len(merged)} distinct styles (deduplicated {len(deduped)} internal duplicates).")
    for k, v in counts_by_repo.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
