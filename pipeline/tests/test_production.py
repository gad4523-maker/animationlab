"""Focused regressions. Run from the pipeline directory with the lab Python."""
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from audio.align_whisperx import align_narration
from audio.build_ass_subtitles import build_ass_subtitles
from audio.synth_sfx import build_master_audio
from core.timeline import plan_timeline
from renderers.cache import RenderInputs


class ProductionTests(unittest.TestCase):
    def test_timeline_rounds_fractional_overlap_and_rejects_crossed_fades(self):
        shots = [
            {"id": "a", "_frames": 19, "transition": {"type": "fade", "duration_sec": .22}},
            {"id": "b", "_frames": 12},
            {"id": "c", "_frames": 9},
        ]
        plan, total = plan_timeline(shots, 30)
        self.assertEqual([row["start"] for row in plan], [0, 12, 24])
        self.assertEqual([row["overlap"] for row in plan], [7, 0, 0])
        self.assertEqual(total, 33)
        shots[1]["transition"] = {"type": "fade", "duration_sec": .20}
        with self.assertRaisesRegex(ValueError, "overlap"):
            plan_timeline(shots, 30)

    def test_cache_tracks_clock_and_imported_assets_but_ignores_outputs(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            ep = root / "episode"
            pipe = root / "pipeline"
            for directory in [pipe / x for x in ("core", "renderers", "vendor")] + [ep / "out"]:
                directory.mkdir(parents=True, exist_ok=True)
            asset = ep / "character.glb"
            asset.write_bytes(b"first")
            shot = {"id": "a", "_frames": 30, "_start_sec": 2.5, "_total_sec": 8.0}
            signature = lambda: RenderInputs(ep, pipe).shot_hash(shot, 1080, 1920, 30)
            orig = signature()
            (ep / "out" / "movie.mp4").write_bytes(b"generated")
            self.assertEqual(signature(), orig)
            shot["_total_sec"] += .2
            self.assertNotEqual(signature(), orig)
            shot["_total_sec"] = 8.0
            shot["_start_sec"] += .2
            self.assertNotEqual(signature(), orig)
            shot["_start_sec"] = 2.5
            asset.write_bytes(b"second")
            self.assertNotEqual(signature(), orig)

    def test_whisperx_fallback_retries_and_success_is_reusable(self):
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            wav = folder / "fake.wav"
            wav.write_bytes(b"fake audio")
            take = {"shot_id": "a", "text": "One", "wav_path": str(wav), "speech_start_sec": .1, "speech_dur_sec": .4}
            manifest = {"takes": [take]}
            accelerator = SimpleNamespace(cuda=SimpleNamespace(is_available=lambda: False))
            calls = []

            def model(**kwargs):
                calls.append(kwargs)
                if len(calls) == 1:
                    raise RuntimeError("simulated transient failure")
                return None, None

            wx = SimpleNamespace(
                load_align_model=model, load_audio=lambda path: None,
                align=lambda *args, **kwargs: {"segments": [{"words": [{"word": "One", "start": 0, "end": .31}]}]},
            )
            with patch.dict(sys.modules, {"torch": accelerator, "whisperx": wx}), patch(
                "audio.align_whisperx._add_cuda_dll_paths"
            ):
                fallback = align_narration(manifest, folder)
                self.assertEqual(fallback["method"], "proportional_fallback")
                self.assertNotIn("cache_key", fallback)
                aligned = align_narration(manifest, folder)
                self.assertEqual(aligned["method"], "whisperx_wav2vec2_cpu_pertake")
                self.assertEqual(aligned, align_narration(manifest, folder))
                self.assertEqual(len(calls), 2)
                explicit = align_narration(manifest, folder, use_whisperx=False)
                self.assertEqual(explicit["method"], "proportional")
                self.assertEqual(explicit, align_narration(manifest, folder, use_whisperx=False))

    def test_captions_fit_time_and_split_wide_text(self):
        words = [
            {"word": "MMMMMMMMMMMMMMMMMM", "start": .00, "end": .09},
            {"word": "test", "start": .10, "end": .14},
            {"word": "out", "start": .23, "end": .28},
        ]
        with tempfile.TemporaryDirectory() as folder:
            text = build_ass_subtitles({"words": words}, Path(folder) / "out.ass", 540, 960, 3, .20).read_text()
        events = [line for line in text.splitlines() if line.startswith("Dialogue:")]
        self.assertEqual(len(events), 2)
        self.assertIn(",0:00:00.00,0:00:00.10,", events[0])
        self.assertRegex(events[0], r"\\fscx[1-9][0-9]\}")
        self.assertIn(r"{\k10}", events[0])
        self.assertIn(",0:00:00.10,0:00:00.20,", events[1])
        self.assertNotIn("out", events[1])

    def test_transient_keeps_true_peak_headroom_and_linear_gain(self):
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            wav = folder / "narr.wav"
            sf.write(wav, np.zeros(96000, dtype=np.float32), 48000)
            episode = {"sfx_cues": [{"type": "impact", "at_sec": .2, "gain": 6, "duration_sec": .18}]}
            result = build_master_audio(episode, {"narration_full": str(wav), "total_sec": 2}, folder)
            stats = result["loudnorm"]
            self.assertEqual(stats["normalization_type"], "linear_peak_limited")
            self.assertLessEqual(float(stats["output_tp"]), -2.25)
            track, rate = sf.read(result["master_audio"])
            self.assertEqual((track.shape, rate), ((96000, 2), 48000))


if __name__ == "__main__":
    unittest.main(verbosity=2)

