"""WhisperX CUDA per-take forced alignment with hash caching and fallback for unaligned numeric tokens."""
import hashlib
import json
import os
import re
from pathlib import Path

from renderers.cache import write_json_atomic

DEFAULT_CUDA_VENV = os.environ.get("AI_CUDA_ENV", r"G:\AnimationLab\envs\whisperx")


def _add_cuda_dll_paths():
    venv = Path(DEFAULT_CUDA_VENV)
    extra = [str(venv / "Lib" / "site-packages" / "torch" / "lib")]
    nv_dir = venv / "Lib" / "site-packages" / "nvidia"
    if nv_dir.is_dir():
        for d in nv_dir.iterdir():
            b = d / "bin"
            if b.is_dir():
                extra.append(str(b))
    os.environ["PATH"] = ";".join(extra + [os.environ.get("PATH", "")])


def _proportional_words_for_take(take: dict) -> list:
    words = re.findall(r"[^\s]+", take.get("text") or "")
    if not words or take.get("speech_dur_sec", 0) <= 0:
        return []
    t0 = float(take["speech_start_sec"])
    dur = float(take["speech_dur_sec"])
    weights = [max(1, len(re.sub(r"\W", "", w))) for w in words]
    tot_w = sum(weights)
    out = []
    cur = t0
    for w, wt in zip(words, weights):
        wd = dur * (wt / tot_w)
        out.append({"word": w, "start": round(cur, 3), "end": round(cur + wd, 3), "shot_id": take["shot_id"]})
        cur += wd
    return out


def align_narration(narration_manifest: dict, out_dir: Path, use_whisperx: bool = True) -> dict:
    """
    Aligns per-take WAVs via WhisperX Wav2Vec2 with SHA-256 caching so repeated renders
    skip CUDA reload when takes and timing haven't changed. Interpolates unaligned tokens cleanly.
    """
    out_dir = Path(out_dir)
    takes = [t for t in narration_manifest.get("takes", []) if t.get("text") and t.get("wav_path")]
    if not takes:
        data = {"method": "none", "words": []}
        write_json_atomic(out_dir / "word_timestamps.json", data)
        return data

    sig_payload = []
    for take in takes:
        with Path(take["wav_path"]).open("rb") as stream:
            digest = hashlib.file_digest(stream, "sha256").hexdigest()
        sig_payload.append({
            "id": take["shot_id"], "wav": digest, "text": take["text"],
            "start": take["speech_start_sec"], "duration": take["speech_dur_sec"],
        })
    cache_key = hashlib.sha256(json.dumps({"schema": 2, "wx": use_whisperx, "takes": sig_payload}, sort_keys=True).encode("utf-8")).hexdigest()[:16]
    out_json = out_dir / "word_timestamps.json"
    if out_json.exists():
        try:
            prev = json.loads(out_json.read_text(encoding="utf-8"))
            method = prev.get("method", "")
            usable = method.startswith("whisperx_") if use_whisperx else method == "proportional"
            if usable and prev.get("cache_key") == cache_key and prev.get("words"):
                return prev
        except Exception:
            pass

    words_out = []
    method = "proportional"

    if use_whisperx:
        try:
            _add_cuda_dll_paths()
            import torch
            import whisperx

            device = "cuda" if torch.cuda.is_available() else "cpu"
            model_a, metadata = whisperx.load_align_model(language_code="en", device=device)

            all_takes_aligned = True
            for tk in takes:
                audio = whisperx.load_audio(tk["wav_path"])
                seg = [{"text": tk["text"], "start": 0.0, "end": float(tk["speech_dur_sec"])}]
                aligned = whisperx.align(seg, model_a, metadata, audio, device, return_char_alignments=False)
                offset = float(tk["speech_start_sec"])
                take_words = []
                raw_words = [w for s in aligned.get("segments", []) for w in s.get("words", [])]
                for wi, w in enumerate(raw_words):
                    txt = (w.get("word") or "").strip()
                    if not txt:
                        continue
                    if "start" in w and "end" in w:
                        take_words.append({
                            "word": txt,
                            "start": round(offset + float(w["start"]), 3),
                            "end": round(offset + float(w["end"]), 3),
                            "shot_id": tk["shot_id"],
                        })
                    else:
                        # Interpolate numeric/unaligned tokens cleanly between neighbor words
                        prev_t = take_words[-1]["end"] if take_words else offset
                        nxt_t = next((offset + float(nw["start"]) for nw in raw_words[wi + 1 :] if "start" in nw), offset + float(tk["speech_dur_sec"]))
                        mid_t = max(prev_t + 0.08, 0.5 * (prev_t + nxt_t))
                        take_words.append({
                            "word": txt,
                            "start": round(prev_t, 3),
                            "end": round(mid_t, 3),
                            "shot_id": tk["shot_id"],
                        })
                if take_words and any("start" in w and "end" in w for w in raw_words):
                    words_out.extend(take_words)
                else:
                    all_takes_aligned = False
                    words_out.extend(_proportional_words_for_take(tk))

            method = f"whisperx_wav2vec2_{device}_pertake" if all_takes_aligned else "partial_fallback"
            del model_a
            if device == "cuda":
                torch.cuda.empty_cache()
        except Exception as exc:
            print(f"[align_whisperx] Warning: forced alignment failed ({exc}); using proportional timing.")
            words_out = []

    if not words_out:
        for tk in takes:
            words_out.extend(_proportional_words_for_take(tk))
        method = "proportional_fallback" if use_whisperx else "proportional"

    # Enforce strict monotonic non-overlapping timestamps
    for i in range(1, len(words_out)):
        if words_out[i]["start"] < words_out[i - 1]["end"]:
            mid = round(0.5 * (words_out[i]["start"] + words_out[i - 1]["end"]), 3)
            words_out[i - 1]["end"] = max(words_out[i - 1]["start"] + 0.04, mid)
            words_out[i]["start"] = words_out[i - 1]["end"]
            words_out[i]["end"] = max(words_out[i]["start"] + 0.05, words_out[i]["end"])

    payload = {"method": method, "words": words_out}
    if method.startswith("whisperx_") or method == "proportional":
        payload["cache_key"] = cache_key
    write_json_atomic(out_json, payload)
    return payload
