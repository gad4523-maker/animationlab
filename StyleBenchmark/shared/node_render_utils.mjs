// Shared Node/Playwright render, FFmpeg pipe, ffprobe verify, thumbnail, & manifest updater
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const LAB_ROOT = 'G:\\AnimationLab';
export const BENCH_ROOT = 'G:\\AnimationLab\\StyleBenchmark';
export const MANIFEST_PATH = resolve(BENCH_ROOT, 'manifest.json');
export const SFX_WAV = resolve(BENCH_ROOT, 'shared', 'goku_ssj_sfx.wav');
export const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
export const FFMPEG_BIN = process.env.FFMPEG_BIN || 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';
export const FFPROBE_BIN = process.env.FFPROBE_BIN || 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffprobe.exe';

export const W = 720;
export const H = 1280;
export const FPS = 30;
export const TOTAL_FRAMES = 150;

export function readManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

export function updateManifestEntry(styleId, status, meta = null, error = null) {
  const manifest = readManifest();
  const entry = manifest.styles.find((s) => s.id === styleId);
  if (!entry) throw new Error(`Style not found in manifest: ${styleId}`);
  entry.status = status;
  entry.error = error;
  if (meta) Object.assign(entry, meta);
  const tmp = MANIFEST_PATH + '.tmp';
  writeFileSync(tmp, JSON.stringify(manifest, null, 2), 'utf8');
  renameSync(tmp, MANIFEST_PATH);
}

export function isAlreadyCompleted(styleId) {
  const manifest = readManifest();
  const entry = manifest.styles.find((s) => s.id === styleId);
  if (!entry || entry.status !== 'completed') return false;
  const mp4 = resolve(BENCH_ROOT, 'videos', `${styleId}.mp4`);
  const jpg = resolve(BENCH_ROOT, 'previews', `${styleId}.jpg`);
  return existsSync(mp4) && existsSync(jpg);
}

export function verifyAndPreview(styleId) {
  const mp4 = resolve(BENCH_ROOT, 'videos', `${styleId}.mp4`);
  const jpg = resolve(BENCH_ROOT, 'previews', `${styleId}.jpg`);
  mkdirSync(dirname(jpg), { recursive: true });

  try {
    const raw = execFileSync(FFPROBE_BIN, [
      '-v', 'error', '-show_format', '-show_streams', '-of', 'json', mp4,
    ], { encoding: 'utf8' });
    const info = JSON.parse(raw);
    const vs = (info.streams || []).find((s) => s.codec_type === 'video');
    const as = (info.streams || []).find((s) => s.codec_type === 'audio');
    if (!vs) throw new Error('No video stream');
    if (vs.codec_name !== 'h264') throw new Error(`Expected h264, got ${vs.codec_name}`);
    if (Number(vs.width) !== W || Number(vs.height) !== H) throw new Error(`Wrong size ${vs.width}x${vs.height}`);
    const [num, den] = String(vs.avg_frame_rate || '0/1').split('/').map(Number);
    const fps = Math.round((num / Math.max(1, den)) * 100) / 100;
    const dur = Number(info.format?.duration || 0);
    if (fps < 29.5 || fps > 30.5) throw new Error(`Wrong fps ${fps}`);
    if (dur < 4.90 || dur > 5.10) throw new Error(`Wrong duration ${dur}`);
    if (!as) throw new Error('Missing AAC audio stream');

    execFileSync(FFMPEG_BIN, ['-v', 'error', '-i', mp4, '-f', 'null', '-'], { stdio: 'pipe' });
    execFileSync(FFMPEG_BIN, [
      '-y', '-ss', '3.60', '-i', mp4, '-vf', 'scale=360:640', '-frames:v', '1', '-q:v', '3', jpg,
    ], { stdio: 'pipe' });

    const sizeBytes = existsSync(mp4) ? readFileSync(mp4).length : 0;
    const meta = {
      duration_sec: Math.round(dur * 1000) / 1000,
      width: Number(vs.width),
      height: Number(vs.height),
      fps,
      file_size_bytes: sizeBytes,
    };
    updateManifestEntry(styleId, 'completed', meta, null);
    console.log(`[OK] ${styleId}: ${meta.duration_sec}s ${W}x${H}@${fps} (${Math.round(sizeBytes / 1024)} KB)`);
    return true;
  } catch (err) {
    updateManifestEntry(styleId, 'failed', null, String(err.message || err));
    console.error(`[FAIL] ${styleId}: ${err.message || err}`);
    return false;
  }
}

// Spawn FFmpeg image2pipe -> H.264 MP4 muxed with goku_ssj_sfx.wav
export function createFfmpegPipe(outMp4, codec = 'mjpeg') {
  mkdirSync(dirname(outMp4), { recursive: true });
  const args = [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', codec, '-i', '-',
    '-i', SFX_WAV,
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-shortest',
    '-movflags', '+faststart',
    outMp4,
  ];
  const proc = spawn(FFMPEG_BIN, args, { stdio: ['pipe', 'inherit', 'pipe'] });
  let errOut = '';
  proc.stderr.on('data', (d) => { errOut += d.toString(); });
  const closed = new Promise((res, rej) => {
    proc.on('close', (code) => {
      if (code === 0) res();
      else rej(new Error(`ffmpeg exited ${code}: ${errOut}`));
    });
    proc.on('error', rej);
  });
  return {
    async writeFrame(buf) {
      if (!proc.stdin.write(buf)) {
        await new Promise((r) => proc.stdin.once('drain', r));
      }
    },
    async finish() {
      proc.stdin.end();
      await closed;
    },
  };
}
