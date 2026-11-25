"""Synthesize procedural 5.000s 48kHz stereo SFX for Goku Super Saiyan transformation."""
import wave
from pathlib import Path
import numpy as np

OUT_WAV = Path(r"G:\AnimationLab\StyleBenchmark\shared\goku_ssj_sfx.wav")
SR = 48000
DUR = 5.0
N = int(SR * DUR)


def bandpass_fft(sig: np.ndarray, lo: float, hi: float) -> np.ndarray:
    freqs = np.fft.rfftfreq(len(sig), 1.0 / SR)
    spec = np.fft.rfft(sig)
    mask = (freqs >= lo) & (freqs <= hi)
    return np.fft.irfft(spec * mask, n=len(sig))


def lowpass_fft(sig: np.ndarray, cutoff: float) -> np.ndarray:
    return bandpass_fft(sig, 0.0, cutoff)


def main():
    rng = np.random.default_rng(9001)
    t = np.linspace(0.0, DUR, N, endpoint=False)

    # 1. Sub-bass earthquake rumble (0.00 - 2.72s) + post explosion tail
    rumble_noise = lowpass_fft(rng.normal(0.0, 1.0, N), 130.0)
    sub_osc = np.sin(2 * np.pi * (38.0 + 18.0 * np.clip(t / 2.7, 0, 1)) * t)
    env_rumble = np.where(t < 2.70, np.clip(t / 0.5, 0, 1) * (0.35 + 0.65 * (t / 2.70) ** 1.4), 0.0)
    env_rumble *= np.where((t >= 2.70) & (t < 2.80), np.exp(-(t - 2.70) * 35.0), 1.0)
    rumble = (0.65 * rumble_noise + 0.35 * sub_osc) * env_rumble * 0.45

    # 2. Rising Ki turbine hum (0.60 - 2.72s)
    ki_freq = 75.0 + 210.0 * np.clip((t - 0.5) / 2.25, 0.0, 1.0) ** 1.7
    ki_phase = 2 * np.pi * np.cumsum(ki_freq) / SR
    ki_hum = (
        0.55 * np.sin(ki_phase)
        + 0.28 * np.sin(ki_phase * 2.01)
        + 0.17 * np.sin(ki_phase * 3.03)
    )
    ki_env = np.clip((t - 0.50) / 0.6, 0, 1) * np.where(t < 2.70, 1.0, np.exp(-(t - 2.70) * 40.0))
    ki_layer = ki_hum * ki_env * 0.24

    # 3. Wind sweep (0.0 - 5.0s)
    wind_raw = bandpass_fft(rng.normal(0.0, 1.0, N), 220.0, 1800.0)
    wind_mod = 0.5 + 0.5 * np.sin(2 * np.pi * 1.8 * t)
    wind_env = np.where(t < 2.70, 0.18 + 0.45 * (t / 2.70), np.where(t < 2.80, 0.05, 0.72 * np.exp(-(t - 2.80) * 0.22)))
    wind_layer = wind_raw * wind_mod * wind_env * 0.30

    # 4. Electrical ki crackles at flickers (1.85, 2.15, 2.40) and post-explosion arcs
    crackle_L = np.zeros(N)
    crackle_R = np.zeros(N)
    zap_times = [1.35, 1.85, 2.15, 2.40, 2.55, 3.05, 3.45, 3.90, 4.35, 4.70]
    for idx, zt in enumerate(zap_times):
        s0 = int(zt * SR)
        dur_z = int(0.14 * SR)
        s1 = min(N, s0 + dur_z)
        if s1 <= s0:
            continue
        tz = np.arange(s1 - s0) / SR
        fm = np.sin(2 * np.pi * (420.0 * np.exp(-tz * 18.0) + 180.0) * tz + 6.0 * np.sin(2 * np.pi * 110.0 * tz))
        burst = bandpass_fft(rng.normal(0.0, 1.0, s1 - s0), 1400.0, 7500.0)
        zsig = (0.5 * fm + 0.5 * burst) * np.exp(-tz * 28.0) * (0.42 if zt < 2.8 else 0.30)
        pan = 0.35 if idx % 2 == 0 else 0.65
        crackle_L[s0:s1] += zsig * (1.0 - pan) * 1.4
        crackle_R[s0:s1] += zsig * pan * 1.4

    # 5. Explosion shockwave at t = 2.80s
    exp_L = np.zeros(N)
    exp_R = np.zeros(N)
    s_exp = int(2.80 * SR)
    te = np.arange(N - s_exp) / SR
    boom = np.sin(2 * np.pi * (150.0 * np.exp(-te * 14.0) + 34.0) * te) * np.exp(-te * 3.8)
    blast = lowpass_fft(rng.normal(0.0, 1.0, N - s_exp), 3200.0) * np.exp(-te * 5.2)
    chime = (
        0.45 * np.sin(2 * np.pi * 523.25 * te)
        + 0.35 * np.sin(2 * np.pi * 783.99 * te)
        + 0.25 * np.sin(2 * np.pi * 1046.50 * te)
        + 0.20 * np.sin(2 * np.pi * 1318.51 * te)
    ) * np.exp(-te * 1.35) * np.clip(te / 0.04, 0, 1)
    exp_core = 0.72 * boom + 0.55 * blast + 0.26 * chime
    exp_L[s_exp:] = exp_core
    exp_R[s_exp:] = exp_core * 0.96 + 0.04 * np.roll(exp_core, 120)

    # 6. Golden SSJ Flame Aura bed (2.80 - 5.00s) + triumphant harmonic pad
    aura_noise = bandpass_fft(rng.normal(0.0, 1.0, N), 160.0, 2400.0)
    aura_flutter = 0.65 + 0.35 * np.sin(2 * np.pi * 9.5 * t) * np.sin(2 * np.pi * 2.3 * t)
    aura_env = np.where(t >= 2.80, np.clip((t - 2.80) / 0.08, 0, 1) * np.clip((5.0 - t) / 0.25, 0, 1), 0.0)
    chord = (
        0.40 * np.sin(2 * np.pi * 130.81 * t)
        + 0.30 * np.sin(2 * np.pi * 196.00 * t)
        + 0.22 * np.sin(2 * np.pi * 261.63 * t)
        + 0.14 * np.sin(2 * np.pi * 329.63 * t)
    ) * aura_env * 0.22
    aura_L = (aura_noise * aura_flutter * aura_env * 0.42) + chord
    aura_R = (np.roll(aura_noise, 340) * aura_flutter * aura_env * 0.42) + chord

    mix_L = rumble + ki_layer + wind_layer + crackle_L + exp_L + aura_L
    mix_R = rumble + ki_layer + np.roll(wind_layer, 220) + crackle_R + exp_R + aura_R

    # Soft-clip limiter & normalize to -1.5 dBFS
    mix = np.stack([mix_L, mix_R], axis=1)
    mix = np.tanh(mix * 1.15)
    peak = np.max(np.abs(mix))
    if peak > 0:
        mix = mix * (0.84 / peak)

    # Fade 10ms in/out
    fade = int(0.01 * SR)
    mix[:fade] *= np.linspace(0, 1, fade)[:, None]
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]

    pcm = np.clip(mix * 32767.0, -32768, 32767).astype(np.int16)
    OUT_WAV.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT_WAV), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())
    print(f"Wrote {OUT_WAV} ({N} samples, {DUR:.3f}s)")


if __name__ == "__main__":
    main()
