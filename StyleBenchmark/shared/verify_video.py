"""Verify rendered MP4 via ffprobe + full decode check, extract 360x640 preview JPG, update manifest.json."""
import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(r"G:\AnimationLab\StyleBenchmark")
MANIFEST_PATH = ROOT / "manifest.json"
FFMPEG = r"C:\Users\User\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
FFPROBE = r"C:\Users\User\AppData\Local\Microsoft\WinGet\Links\ffprobe.exe"


def probe_video(mp4_path: Path) -> dict:
    if not mp4_path.exists() or mp4_path.stat().st_size < 5000:
        raise RuntimeError(f"Missing or empty video: {mp4_path}")
    cmd = [
        FFPROBE, "-v", "error",
        "-show_format", "-show_streams", "-of", "json",
        str(mp4_path),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    info = json.loads(res.stdout)
    streams = info.get("streams", [])
    vstreams = [s for s in streams if s.get("codec_type") == "video"]
    astreams = [s for s in streams if s.get("codec_type") == "audio"]
    if not vstreams:
        raise RuntimeError("No video stream found")
    vs = vstreams[0]
    codec = vs.get("codec_name")
    w = int(vs.get("width", 0))
    h = int(vs.get("height", 0))
    r_fps = vs.get("avg_frame_rate", "0/1")
    num, den = (int(x) for x in r_fps.split("/")) if "/" in r_fps else (float(r_fps), 1)
    fps = round(num / max(1, den), 2)
    dur = float(info.get("format", {}).get("duration", 0.0))

    if codec != "h264":
        raise RuntimeError(f"Expected h264, got {codec}")
    if w != 720 or h != 1280:
        raise RuntimeError(f"Expected 720x1280, got {w}x{h}")
    if not (29.5 <= fps <= 30.5):
        raise RuntimeError(f"Expected 30fps, got {fps}")
    if not (4.90 <= dur <= 5.10):
        raise RuntimeError(f"Expected ~5.0s duration, got {dur:.3f}s")
    if not astreams:
        raise RuntimeError("Missing AAC audio stream")

    dec = subprocess.run([FFMPEG, "-v", "error", "-i", str(mp4_path), "-f", "null", "-"], capture_output=True, text=True)
    if dec.returncode != 0:
        raise RuntimeError(f"Decode failed: {dec.stderr.strip()}")

    return {
        "duration_sec": round(dur, 3),
        "width": w,
        "height": h,
        "fps": fps,
        "file_size_bytes": mp4_path.stat().st_size,
    }


def extract_preview(mp4_path: Path, jpg_path: Path):
    jpg_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [FFMPEG, "-y", "-ss", "3.60", "-i", str(mp4_path), "-vf", "scale=360:640", "-frames:v", "1", "-q:v", "3", str(jpg_path)],
        capture_output=True,
        check=True,
    )


def update_manifest_entry(style_id: str, status: str, meta: dict | None = None, error: str | None = None):
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    found = False
    for s in manifest["styles"]:
        if s["id"] == style_id:
            found = True
            s["status"] = status
            s["error"] = error
            if meta:
                s.update(meta)
            break
    if not found:
        raise KeyError(f"Style ID not in manifest: {style_id}")
    tmp = MANIFEST_PATH.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.replace(MANIFEST_PATH)


def verify_and_record(style_id: str) -> bool:
    mp4 = ROOT / "videos" / f"{style_id}.mp4"
    jpg = ROOT / "previews" / f"{style_id}.jpg"
    try:
        meta = probe_video(mp4)
        extract_preview(mp4, jpg)
        update_manifest_entry(style_id, "completed", meta, None)
        print(f"[OK] {style_id}: {meta['duration_sec']}s {meta['width']}x{meta['height']}@{meta['fps']} ({meta['file_size_bytes']//1024} KB)")
        return True
    except Exception as exc:
        update_manifest_entry(style_id, "failed", None, str(exc))
        print(f"[FAIL] {style_id}: {exc}", file=sys.stderr)
        return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", help="Single style id to verify")
    parser.add_argument("--all", action="store_true", help="Verify all existing MP4s and update manifest")
    args = parser.parse_args()
    if args.id:
        sys.exit(0 if verify_and_record(args.id) else 1)
    elif args.all:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        ok = 0
        fail = 0
        for s in manifest["styles"]:
            mp4 = ROOT / "videos" / f"{s['id']}.mp4"
            if mp4.exists():
                if verify_and_record(s["id"]):
                    ok += 1
                else:
                    fail += 1
        print(f"Verified existing MP4s: ok={ok}, fail={fail}")
        sys.exit(0 if fail == 0 else 1)
