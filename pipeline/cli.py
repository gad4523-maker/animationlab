"""Master orchestrator CLI for G:\AnimationLab\pipeline (init, doctor, render, qc)."""
import argparse
from contextlib import contextmanager
import json
import os
import shutil
import subprocess
import sys
import threading
import time
from tempfile import TemporaryDirectory
from pathlib import Path

PIPELINE_ROOT = Path(__file__).resolve().parent
LAB_ROOT = PIPELINE_ROOT.parent
if str(PIPELINE_ROOT) not in sys.path:
    sys.path.insert(0, str(PIPELINE_ROOT))

from audio.tts_kokoro import generate_narration_takes
from audio.align_whisperx import align_narration
from audio.build_ass_subtitles import build_ass_subtitles
from audio.synth_sfx import build_master_audio
from core.timeline import plan_timeline
from renderers.adapters import render_blender_shot, render_godot_shot
from renderers.cache import RenderInputs, write_json_atomic
from renderers.media import SDR_TAGS, require_exact_video, video_filter

FFMPEG_BIN = os.environ.get("FFMPEG_BIN", r"C:\Users\User\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe")
FFPROBE_BIN = os.environ.get("FFPROBE_BIN", r"C:\Users\User\AppData\Local\Microsoft\WinGet\Links\ffprobe.exe")
CHROME_PATH = os.environ.get("CHROME_PATH", r"C:\Program Files\Google\Chrome\Application\chrome.exe")
GODOT_BIN = os.environ.get("GODOT_BIN", r"G:\SPRITE ANIAIMTION\tools\Godot-4.7.2\Godot_v4.7.2-stable_win64_console.exe")
BLENDER_BIN = os.environ.get("BLENDER_BIN", r"G:\blender.exe")
FILM_GATE_PY = LAB_ROOT / "experimental" / "huashu-art-motion" / "scripts" / "film_gate.py"


class _VramSampler:
    def __init__(self, interval: float = 0.5):
        self.interval = interval
        self.stop_evt = threading.Event()
        self.baseline_mb = self._read()
        self.peak_mb = self.baseline_mb
        self._thread = threading.Thread(target=self._loop, daemon=True)

    @staticmethod
    def _read() -> float:
        try:
            out = subprocess.check_output(
                ["nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader,nounits"],
                text=True, stderr=subprocess.DEVNULL, timeout=2,
            ).strip()
            return float(out.splitlines()[0]) if out else 0.0
        except Exception:
            return 0.0

    def _loop(self):
        while not self.stop_evt.is_set():
            v = self._read()
            if v > self.peak_mb:
                self.peak_mb = v
            self.stop_evt.wait(self.interval)

    def start(self):
        self._thread.start()

    def stop(self):
        self.stop_evt.set()
        self._thread.join(timeout=2)


def _escape_filter_path(path: Path) -> str:
    s = str(path).replace("\\", "/")
    return s.replace(":", "\\:").replace("'", "\\'").replace("[", "\\[").replace("]", "\\]")


def cmd_doctor(_args):
    checks = []
    def add(name, ok, detail=""):
        checks.append((name, ok, detail))
        status = "OK" if ok else "FAIL"
        print(f"[{status:4s}] {name:30s} {detail}")

    add("Chrome", Path(CHROME_PATH).exists(), CHROME_PATH)
    add("FFmpeg", Path(FFMPEG_BIN).exists(), FFMPEG_BIN)
    add("FFprobe", Path(FFPROBE_BIN).exists(), FFPROBE_BIN)
    add("Godot 4.7.2", Path(GODOT_BIN).exists(), GODOT_BIN)
    add("Blender 5.2.2", Path(BLENDER_BIN).exists(), BLENDER_BIN)
    add("Node.js", shutil.which("node") is not None, shutil.which("node") or "")
    add("Three.js 0.170 vendor", (PIPELINE_ROOT / "vendor" / "three" / "three.module.min.js").exists(), "three + GLTFLoader")
    add("Playwright-core (pixi-suite)", (LAB_ROOT / "sandboxes" / "pixi-suite" / "node_modules" / "playwright-core").exists(), "")
    add("Kokoro ONNX model", Path(os.environ.get("KOKORO_MODEL", r"G:\AnimationLab\models\kokoro\kokoro-v1.0.int8.onnx")).exists(), "")
    add("Kokoro voices.bin", Path(os.environ.get("KOKORO_VOICES", r"G:\AnimationLab\models\kokoro\voices.bin")).exists(), "")
    add("Huashu film_gate.py", FILM_GATE_PY.exists(), str(FILM_GATE_PY))

    try:
        import torch, whisperx, kokoro_onnx, soundfile, cv2, scenedetect
        add("Python AI stack", torch.cuda.is_available(), f"torch={torch.__version__} cuda={torch.cuda.is_available()} kokoro=OK")
    except Exception as exc:
        add("Python AI stack", False, str(exc))

    if any(not ok for _, ok, _ in checks):
        sys.exit(1)
    print("Doctor passed: all pipeline dependencies ready.")


def cmd_init(args):
    tpl = args.template
    src_tpl = PIPELINE_ROOT / "templates" / tpl
    if not src_tpl.is_dir():
        raise SystemExit(f"Unknown template '{tpl}'. Available: {[d.name for d in (PIPELINE_ROOT / 'templates').iterdir() if d.is_dir()]}")
    dst = Path(args.dir).resolve()
    if dst.exists() and any(dst.iterdir()):
        raise SystemExit(f"Target directory already exists and is non-empty: {dst}")
    shutil.copytree(src_tpl, dst)
    ep_file = dst / "episode.json"
    if ep_file.exists() and args.id:
        ep = json.loads(ep_file.read_text(encoding="utf-8"))
        ep["episode_id"] = args.id
        if args.title:
            ep["title"] = args.title
        ep_file.write_text(json.dumps(ep, indent=2), encoding="utf-8")
    print(f"[INIT OK] Created episode project at {dst} (template={tpl})")


@contextmanager
def _render_lock(path):
    import msvcrt

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a+b") as lock:
        lock.seek(0)
        try:
            msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError as exc:
            raise RuntimeError(f"Another render is already using {path.parent}") from exc
        try:
            yield
        finally:
            lock.seek(0)
            msvcrt.locking(lock.fileno(), msvcrt.LK_UNLCK, 1)


def render_shots_and_audio(ep_dir: Path, force: bool = False, draft: bool = False, no_whisperx: bool = False, allow_red_qc: bool = False):
    work_dir = ep_dir / "work"
    if draft:
        work_dir /= "draft"
    with _render_lock(work_dir / "render.lock"):
        return _render_episode(ep_dir, force, draft, no_whisperx, allow_red_qc)


def _render_episode(ep_dir, force, draft, no_whisperx, allow_red_qc):
    ep_path = ep_dir / "episode.json"
    ep = json.loads(ep_path.read_text(encoding="utf-8"))
    ep_id = ep["episode_id"]
    w = int(ep.get("width", 1080))
    h = int(ep.get("height", 1920))
    if draft:
        w, h = max(2, w // 4 * 2), max(2, h // 4 * 2)
    if w <= 0 or h <= 0 or w % 2 or h % 2:
        raise ValueError("Video dimensions must be positive and even for yuv420p")
    ids = [shot["id"] for shot in ep["shots"]]
    if not ids or len(ids) != len(set(ids)):
        raise ValueError("An episode requires nonempty, unique shot IDs")
    for stem in [ep_id, *ids]:
        if not stem or stem in (".", "..") or Path(stem).name != stem or Path(stem).is_reserved():
            raise ValueError(f"Invalid episode or shot filename {stem!r}")
    fps = int(ep.get("fps", 30))

    work_dir = ep_dir / "work"
    out_dir = ep_dir / "out"
    if draft:
        work_dir /= "draft"
        out_dir /= "draft"
    shots_out = work_dir / "shots"
    audio_dir = work_dir / "audio"
    shots_out.mkdir(parents=True, exist_ok=True)
    audio_dir.mkdir(parents=True, exist_ok=True)
    out_dir.mkdir(parents=True, exist_ok=True)

    state_file = work_dir / "episode_state.json"
    try:
        state = json.loads(state_file.read_text(encoding="utf-8"))
        if not isinstance(state.get("shots"), dict):
            raise ValueError("Missing shot index")
    except (OSError, ValueError, AttributeError):
        state = {"shots": {}}

    vram_sampler = _VramSampler(0.5)
    vram_sampler.start()
    t_total_start = time.perf_counter()

    try:
        # 1. Narration takes first with frame-quantized shot extension
        has_narration = any((s.get("narration") or "").strip() for s in ep["shots"])
        t_audio0 = time.perf_counter()
        narr_manifest = generate_narration_takes(
            ep["shots"], audio_dir,
            voice=ep.get("voice", "am_michael"),
            speed=float(ep.get("voice_speed", 1.08)),
            fps=fps,
        )
        words = align_narration(narr_manifest, audio_dir, use_whisperx=not no_whisperx) if has_narration else {"method": "none", "words": []}
        audio_prep_sec = round(time.perf_counter() - t_audio0, 2)

        timeline, total_frames = plan_timeline(ep["shots"], fps)
        exact_total_dur = total_frames / fps
        for sh, timing in zip(ep["shots"], timeline):
            sh["_start_sec"] = timing["start"] / fps
            sh["_total_sec"] = exact_total_dur

        inputs = RenderInputs(ep_dir, PIPELINE_ROOT)
        shot_results = []
        cached_count = 0
        for sh, timing in zip(ep["shots"], timeline):
            sid = sh["id"]
            frames = timing["frames"]
            eng = sh["engine"]
            sh_hash = inputs.shot_hash(sh, w, h, fps)
            mp4_path = shots_out / f"{sid}.mp4"
            metrics_path = shots_out / f"{sid}.metrics.json"
            cached = state["shots"].get(sid, {})
            metrics = None

            if not force and cached.get("hash") == sh_hash and mp4_path.is_file():
                try:
                    require_exact_video(mp4_path, w, h, fps, frames)
                    metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
                    if not isinstance(metrics, dict):
                        metrics = None
                        raise ValueError("Invalid shot metrics")
                except (OSError, ValueError, subprocess.CalledProcessError):
                    pass
                else:
                    metrics["cached"] = True
                    cached_count += 1
                    print(f"[SKIP] Shot {sid} unchanged ({frames} frames)")

            if metrics is None:
                print(f"=== Rendering shot {sid} [{eng}] {frames}f @ {w}x{h} ===")
                with TemporaryDirectory(prefix="render-", dir=shots_out) as stage:
                    staged = Path(stage) / mp4_path.name
                    staged_metrics = Path(stage) / metrics_path.name
                    if eng in ("web3d", "anime2d"):
                        subprocess.run([
                            "node", str(PIPELINE_ROOT / "renderers" / "render_web_shot.mjs"),
                            "--episode-dir", str(ep_dir),
                            "--module", str((ep_dir / sh["scene_module"]).resolve()),
                            "--out", str(staged), "--metrics", str(staged_metrics),
                            "--w", str(w), "--h", str(h), "--fps", str(fps), "--frames", str(frames),
                            "--shot", json.dumps(sh), "--params", json.dumps(sh.get("params", {})),
                        ], check=True)
                        metrics = json.loads(staged_metrics.read_text(encoding="utf-8"))
                    elif eng == "godot":
                        project = (ep_dir / sh["godot_project"]).resolve()
                        metrics = render_godot_shot(
                            project, staged, w, h, fps, frames / fps,
                            scene_path=sh.get("scene_path"), params=sh.get("params"),
                        )
                    elif eng == "blender":
                        script = (ep_dir / sh["blender_script"]).resolve()
                        blend = (ep_dir / sh["blend_file"]).resolve() if sh.get("blend_file") else None
                        metrics = render_blender_shot(script, staged, w, h, fps, frames, sh.get("params", {}), blend_file=blend)
                    else:
                        raise ValueError(f"Unsupported engine '{eng}' on shot {sid}")
                    require_exact_video(staged, w, h, fps, frames)
                    # Invalidate before replacing the pair so interruption never blesses new media with an old key.
                    state["shots"].pop(sid, None)
                    write_json_atomic(state_file, state)
                    staged.replace(mp4_path)
                    write_json_atomic(metrics_path, metrics)
                state["shots"][sid] = {"hash": sh_hash, "mp4": str(mp4_path)}
                write_json_atomic(state_file, state)

            shot_results.append({
                "id": sid, "engine": eng, "mp4": str(mp4_path),
                "start_frame": timing["start"], "frames": frames, "overlap_frames": timing["overlap"],
                "actual_dur": frames / fps, "metrics": metrics,
            })

        shot_timings = {
            item["id"]: {"start": item["start_frame"] / fps, "dur": item["actual_dur"]}
            for item in shot_results
        }

        ass_path = (
            build_ass_subtitles(words, audio_dir / "captions.ass", width=w, height=h, group_size=int(ep.get("subtitle_words", 3)), total_dur_sec=exact_total_dur)
            if has_narration else None
        )
        t_mix0 = time.perf_counter()
        audio_master = build_master_audio(ep, narr_manifest, audio_dir, exact_total_sec=exact_total_dur, shot_timings=shot_timings)
        audio_sec = round(audio_prep_sec + (time.perf_counter() - t_mix0), 2)

        t_asm0 = time.perf_counter()
        final_mp4 = out_dir / f"{ep_id}.mp4"
        contact_png = out_dir / "contact_sheet.png"
        with TemporaryDirectory(prefix="assemble-", dir=out_dir) as stage:
            staged_mp4 = Path(stage) / final_mp4.name
            staged_sheet = Path(stage) / contact_png.name
            assemble_episode(ep, shot_results, Path(audio_master["master_audio"]), ass_path, staged_mp4, w, h, fps)
            require_exact_video(staged_mp4, w, h, fps, total_frames)
            asm_sec = round(time.perf_counter() - t_asm0, 2)
            qc_res = run_qc(ep, staged_mp4, staged_sheet, w, h, allow_red_qc=allow_red_qc)
            staged_mp4.replace(final_mp4)
            staged_sheet.replace(contact_png)
    finally:
        vram_sampler.stop()

    total_sec = round(time.perf_counter() - t_total_start, 2)
    benchmark = {
        "episode_id": ep_id,
        "resolution": f"{w}x{h}",
        "fps": fps,
        "total_duration_sec": qc_res["ffprobe"].get("duration_sec", 0.0),
        "cached_shots_count": cached_count,
        "audio_pipeline_sec": audio_sec,
        "assembly_sec": asm_sec,
        "total_wall_sec": total_sec,
        "gpu_vram_baseline_mb": vram_sampler.baseline_mb,
        "gpu_vram_peak_mb": vram_sampler.peak_mb,
        "gpu_vram_delta_mb": round(max(0.0, vram_sampler.peak_mb - vram_sampler.baseline_mb), 1),
        "audio_stats": audio_master.get("loudnorm", {}),
        "whisperx_method": words.get("method"),
        "word_count": len(words.get("words", [])),
        "shots": shot_results,
        "qc": qc_res,
        "final_mp4": str(final_mp4),
        "contact_sheet": str(contact_png),
    }
    (out_dir / "benchmark.json").write_text(json.dumps(benchmark, indent=2), encoding="utf-8")
    print(f"[PIPELINE DONE] {ep_id} -> {final_mp4} ({final_mp4.stat().st_size // 1024} KB) in {total_sec}s")


def assemble_episode(ep: dict, shot_results: list, master_wav: Path, ass_path: Path | None, out_mp4: Path, w: int, h: int, fps: int):
    shots_cfg = ep["shots"]
    n = len(shot_results)
    cmd = [FFMPEG_BIN, "-y", "-loglevel", "error", "-filter_complex_threads", "2"]
    for sr in shot_results:
        cmd.extend(["-i", sr["mp4"]])
    cmd.extend(["-i", str(master_wav)])

    exact_pts = f"settb=expr=1/{fps},setpts=N"
    pixel_format = "yuv444p" if any(s["overlap_frames"] for s in shot_results) else "yuv420p"
    transport = video_filter(w, h, pix_fmt=pixel_format)
    filters = [
        f"[{i}:v]{transport},fps={fps},{exact_pts}[v{i}]"
        for i in range(n)
    ]
    cur_label = "v0"
    for i, shot in enumerate(shot_results[:-1]):
        next_idx = i + 1
        next_label = f"v{next_idx}"
        out_label = f"vx{i}"
        overlap = shot["overlap_frames"]
        if overlap:
            transition = (shots_cfg[i].get("transition") or {})["type"]
            if not transition.replace("_", "").isalnum():
                raise ValueError(f"Invalid xfade transition {transition!r}")
            offset = shot_results[next_idx]["start_frame"] / fps
            filters.append(
                f"[{cur_label}][{next_label}]xfade=transition={transition}:"
                f"duration={overlap / fps:.9f}:offset={offset:.9f},{exact_pts}[{out_label}]"
            )
        else:
            filters.append(f"[{cur_label}][{next_label}]concat=n=2:v=1:a=0,{exact_pts}[{out_label}]")
        cur_label = out_label

    if ass_path and ass_path.exists():
        esc_ass = _escape_filter_path(ass_path)
        esc_fonts = _escape_filter_path(Path(r"C:\Windows\Fonts"))
        filters.append(f"[{cur_label}]ass='{esc_ass}':fontsdir='{esc_fonts}'[v_final]")
    else:
        filters.append(f"[{cur_label}]null[v_final]")

    cmd.extend([
        "-filter_complex", ";".join(filters),
        "-map", "[v_final]",
        "-map", f"{n}:a:0",
        "-r", str(fps),
        "-c:v", "libx264", "-preset", "medium", "-crf", "22",
        "-maxrate", "7M", "-bufsize", "14M",
        "-pix_fmt", "yuv420p", *SDR_TAGS,
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
        str(out_mp4),
    ])
    subprocess.run(cmd, check=True)


def run_qc(ep: dict, mp4_path: Path, contact_png: Path, w: int = 1080, h: int = 1920, allow_red_qc: bool = False) -> dict:
    if not mp4_path.exists():
        raise FileNotFoundError(f"Output MP4 missing: {mp4_path}")
    pr = subprocess.check_output(
        [FFPROBE_BIN, "-v", "error", "-show_entries", "format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate,nb_frames,color_space,color_range,color_transfer,color_primaries,channels", "-of", "json", str(mp4_path)],
        text=True,
    )
    info = json.loads(pr)
    v_st = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), {})
    a_st = next((s for s in info.get("streams", []) if s.get("codec_type") == "audio"), {})
    dur = float(info.get("format", {}).get("duration", 0.0))

    subprocess.run([FFMPEG_BIN, "-v", "error", "-xerror", "-i", str(mp4_path), "-f", "null", "-"], check=True)

    # Sample 6 evenly spread true-PTS frames across [4% .. 92%] of video duration (no fps filter PTS reset!)
    tw = 360
    th = max(200, int(round(360 * (h / max(1, w)))))
    step = max(0.15, (dur * 0.88) / 5.0)
    t0 = dur * 0.04
    esc_font = _escape_filter_path(Path(r"C:\Windows\Fonts\segoeui.ttf"))
    subprocess.run(
        [
            FFMPEG_BIN, "-y", "-loglevel", "error", "-i", str(mp4_path),
            "-vf", (
                f"select='gte(t,{t0:.3f})*(isnan(prev_selected_t)+gte(t-prev_selected_t,{step:.4f}))',"
                f"scale={tw}:{th},"
                f"drawtext=fontfile='{esc_font}':text='%{{pts\\:hms}}':x=12:y=12:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.65,"
                f"tile=3x2"
            ),
            "-frames:v", "1", str(contact_png),
        ],
        check=True,
    )

    fg_json = {}
    if FILM_GATE_PY.exists():
        env = os.environ.copy()
        env["PATH"] = f"{Path(FFMPEG_BIN).parent};{env.get('PATH', '')}"
        env["PYTHONUTF8"] = "1"
        cmd_fg = [sys.executable, str(FILM_GATE_PY), str(mp4_path), "--json"]
        if ep.get("allow_blue_purple", False):
            cmd_fg.extend(["--allow-blue-purple", "Space/sci-fi night scene palette"])
        fg_out = subprocess.run(cmd_fg, capture_output=True, text=True, encoding="utf-8", env=env)
        if fg_out.returncode not in (0, 2):
            raise RuntimeError(f"film_gate.py crashed (exit {fg_out.returncode}): {fg_out.stderr}")
        fg_parsed = json.loads(fg_out.stdout)
        fg_json = {
            "verdict": fg_parsed.get("verdict"),
            "gate_light": fg_parsed.get("gate_light"),
            "blank_run_s": fg_parsed.get("blank_run_s"),
            "still_ratio": fg_parsed.get("still_ratio"),
            "fast_ratio": fg_parsed.get("fast_ratio"),
            "drift_ratio": fg_parsed.get("drift_ratio"),
            "blue_purple_share": fg_parsed.get("blue_purple_share"),
            "shots_detected": fg_parsed.get("shots"),
            "explain": (fg_parsed.get("explain") or {}).get("summary"),
        }
        if fg_json.get("verdict") == "red" and not allow_red_qc:
            raise RuntimeError(f"film_gate RED verdict: {fg_json}")

    return {
        "ffprobe": {
            "duration_sec": round(dur, 3),
            "size_bytes": int(info.get("format", {}).get("size", 0)),
            "video_codec": v_st.get("codec_name"),
            "width": v_st.get("width"),
            "height": v_st.get("height"),
            "r_frame_rate": v_st.get("r_frame_rate"),
            "frames": int(v_st["nb_frames"]) if v_st.get("nb_frames", "").isdigit() else None,
            "color_space": v_st.get("color_space"),
            "color_range": v_st.get("color_range"),
            "audio_codec": a_st.get("codec_name"),
            "audio_channels": a_st.get("channels"),
        },
        "decode_ok": True,
        "film_gate": fg_json,
    }


def main():
    p = argparse.ArgumentParser(prog="animpipe", description="AnimationLab Production Pipeline CLI")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("doctor", help="Check all pipeline binaries, Python CUDA libs, and models")

    p_init = sub.add_parser("init", help="Initialize a new episode from a template")
    p_init.add_argument("dir", help="Target directory for new episode")
    p_init.add_argument("--template", default="explainer3d", choices=["explainer3d", "anime2d", "hybrid"])
    p_init.add_argument("--id", default="", help="Episode ID")
    p_init.add_argument("--title", default="", help="Episode title")

    p_ren = sub.add_parser("render", help="Render shots, narration, SFX, subtitles, assemble & QC")
    p_ren.add_argument("dir", help="Episode directory containing episode.json")
    p_ren.add_argument("--force", action="store_true", help="Ignore shot cache and re-render all shots")
    p_ren.add_argument("--draft", action="store_true", help="Render a half-size preview in out/draft")
    p_ren.add_argument("--no-whisperx", action="store_true", help="Use fast proportional word timing")
    p_ren.add_argument("--allow-red-qc", action="store_true", help="Do not abort on film_gate red verdict")

    p_qc = sub.add_parser("qc", help="Run QC and regenerate contact sheet for an existing output MP4")
    p_qc.add_argument("dir", help="Episode directory")
    p_qc.add_argument("--allow-red-qc", action="store_true")

    args = p.parse_args()
    if args.cmd == "doctor":
        cmd_doctor(args)
    elif args.cmd == "init":
        cmd_init(args)
    elif args.cmd == "render":
        render_shots_and_audio(Path(args.dir).resolve(), force=args.force, draft=args.draft, no_whisperx=args.no_whisperx, allow_red_qc=args.allow_red_qc)
    elif args.cmd == "qc":
        ep_dir = Path(args.dir).resolve()
        ep = json.loads((ep_dir / "episode.json").read_text(encoding="utf-8"))
        mp4 = ep_dir / "out" / f"{ep['episode_id']}.mp4"
        res = run_qc(ep, mp4, ep_dir / "out" / "contact_sheet.png", int(ep.get("width", 1080)), int(ep.get("height", 1920)), allow_red_qc=args.allow_red_qc)
        print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()
