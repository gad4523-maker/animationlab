"""Offline Kokoro ONNX (Apache-2.0) narration generator with SHA-256 caching and frame-exact duration fit."""
import hashlib
import json
import math
import os
from math import gcd
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

from core.timeline import overlap_frames, plan_timeline

DEFAULT_MODEL = os.environ.get("KOKORO_MODEL", r"G:\AnimationLab\models\kokoro\kokoro-v1.0.int8.onnx")
DEFAULT_VOICES = os.environ.get("KOKORO_VOICES", r"G:\AnimationLab\models\kokoro\voices.bin")


def _trim_silence(buf: np.ndarray, sr: int, thresh: float = 0.004) -> np.ndarray:
    active = np.flatnonzero(np.abs(buf) > thresh)
    if len(active) == 0:
        return buf
    pad_pre = min(active[0], int(0.015 * sr))
    pad_post = int(0.040 * sr)
    return buf[max(0, active[0] - pad_pre) : min(len(buf), active[-1] + pad_post)]


def _resample_clean(buf: np.ndarray, src_sr: int, dst_sr: int) -> np.ndarray:
    if src_sr == dst_sr:
        return buf.astype(np.float32)
    g = gcd(src_sr, dst_sr)
    return resample_poly(buf, dst_sr // g, src_sr // g).astype(np.float32)


def generate_narration_takes(
    shots: list,
    out_dir: Path,
    voice: str = "am_michael",
    speed: float = 1.08,
    target_sr: int = 48000,
    fps: int = 30,
    model_path: str = DEFAULT_MODEL,
    voices_path: str = DEFAULT_VOICES,
) -> dict:
    """
    Generate per-shot WAV narration clips cached by SHA-256, frame-quantizing eff_dur
    to exact multiples of (1/fps) so audio, subtitles, and FFmpeg frames stay frame-locked.
    """
    out_dir = Path(out_dir)
    takes_dir = out_dir / "takes"
    takes_dir.mkdir(parents=True, exist_ok=True)
    cache_index_path = takes_dir / "cache_index.json"
    cache_index = json.loads(cache_index_path.read_text(encoding="utf-8")) if cache_index_path.exists() else {}

    kokoro = None
    takes_info = []
    lead_in = 0.16
    model_signature = None

    for idx, shot in enumerate(shots):
        sid = shot["id"]
        text = (shot.get("narration") or "").strip()
        authored_dur = float(shot["duration_sec"])
        shot_voice = shot.get("voice", voice)
        shot_speed = float(shot.get("voice_speed", speed))
        overlap = overlap_frames(shot, fps) if idx < len(shots) - 1 else 0
        xfade_dur = overlap / fps

        wav_path = takes_dir / f"{sid}.wav"
        if text:
            if model_signature is None:
                inputs = []
                for model_file in (model_path, voices_path):
                    with Path(model_file).open("rb") as stream:
                        inputs.append(hashlib.file_digest(stream, "sha256").hexdigest())
                model_signature = inputs
            key_data = ["kokoro-trim-v1", model_signature, text, shot_voice, shot_speed, target_sr]
            key = hashlib.sha256(json.dumps(key_data).encode("utf-8")).hexdigest()
            if cache_index.get(sid) == key and wav_path.exists():
                audio, _ = sf.read(wav_path, dtype="float32")
            else:
                if kokoro is None:
                    from kokoro_onnx import Kokoro
                    kokoro = Kokoro(model_path, voices_path)
                raw_buf, raw_sr = kokoro.create(text, voice=shot_voice, speed=shot_speed, lang="en-us")
                trimmed = _trim_silence(np.asarray(raw_buf, dtype=np.float32), raw_sr)
                audio = _resample_clean(trimmed, raw_sr, target_sr)
                sf.write(str(wav_path), audio, target_sr, subtype="PCM_16")
                cache_index[sid] = key
            speech_dur = len(audio) / float(target_sr)
            tail_pad = 0.35 + xfade_dur
            raw_needed = max(authored_dur, lead_in + speech_dur + tail_pad)
            frames = max(1, math.ceil(raw_needed * fps))
            eff_dur = frames / float(fps)
            shot["duration_sec"] = eff_dur
            shot["_frames"] = frames

            takes_info.append({
                "shot_id": sid,
                "shot_index": idx,
                "text": text,
                "wav_path": str(wav_path),
                "take_sha": key,
                "shot_dur_sec": round(eff_dur, 4),
                "authored_dur_sec": round(authored_dur, 4),
                "speech_dur_sec": round(speech_dur, 4),
                "fits_shot": True,
            })
        else:
            frames = max(1, int(round(authored_dur * fps)))
            eff_dur = frames / float(fps)
            shot["duration_sec"] = eff_dur
            shot["_frames"] = frames
            takes_info.append({
                "shot_id": sid,
                "shot_index": idx,
                "text": "",
                "wav_path": None,
                "take_sha": "",
                "shot_dur_sec": round(eff_dur, 4),
                "authored_dur_sec": round(authored_dur, 4),
                "speech_dur_sec": 0.0,
                "fits_shot": True,
            })

    timeline, total_frames = plan_timeline(shots, fps)
    for timing, take in zip(timeline, takes_info):
        start = timing["start"] / fps
        take["shot_start_sec"] = start
        take["speech_start_sec"] = start + (lead_in if take["text"] else 0.0)

    cache_index_path.write_text(json.dumps(cache_index, indent=2), encoding="utf-8")

    total_dur = total_frames / fps
    total_samples = int(round(total_dur * target_sr))
    timeline = np.zeros(total_samples, dtype=np.float32)

    for info in takes_info:
        if not info["wav_path"]:
            continue
        buf, _ = sf.read(info["wav_path"], dtype="float32")
        if buf.ndim > 1:
            buf = buf.mean(axis=1)
        start_idx = int(round(info["speech_start_sec"] * target_sr))
        end_idx = min(total_samples, start_idx + len(buf))
        if end_idx > start_idx:
            timeline[start_idx:end_idx] += buf[: end_idx - start_idx]

    peak = float(np.max(np.abs(timeline))) if len(timeline) else 0.0
    if peak > 0.95:
        timeline = timeline * (0.95 / peak)

    full_wav = out_dir / "narration_full.wav"
    sf.write(str(full_wav), timeline, target_sr, subtype="PCM_16")
    manifest = {"total_sec": total_dur, "sample_rate": target_sr, "fps": fps, "narration_full": str(full_wav), "takes": takes_info}
    (out_dir / "narration_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest
