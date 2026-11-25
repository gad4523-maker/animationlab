# Common environment configuration for G:\AnimationLab
# Keeps ALL caches, temp directories, and model downloads off C:\

$Global:ANIMATION_LAB_ROOT = "G:\AnimationLab"
$CacheRoot = Join-Path $Global:ANIMATION_LAB_ROOT ".cache"

$env:ANIMATION_LAB_ROOT = $Global:ANIMATION_LAB_ROOT
$env:PIP_CACHE_DIR = Join-Path $CacheRoot "pip"
$env:UV_CACHE_DIR = Join-Path $CacheRoot "uv"
$env:UV_LINK_MODE = "hardlink"
$env:UV_PYTHON_INSTALL_DIR = Join-Path $CacheRoot "uv-python"
$env:HF_HOME = Join-Path $CacheRoot "huggingface"
$env:HUGGINGFACE_HUB_CACHE = Join-Path $CacheRoot "huggingface\hub"
$env:TORCH_HOME = Join-Path $CacheRoot "torch"
$env:NPM_CONFIG_CACHE = Join-Path $CacheRoot "npm"
$env:npm_config_cache = Join-Path $CacheRoot "npm"
$env:PNPM_STORE_DIR = Join-Path $CacheRoot "pnpm"
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $CacheRoot "ms-playwright"
$env:TEMP = Join-Path $CacheRoot "tmp"
$env:TMP = Join-Path $CacheRoot "tmp"
$env:TMPDIR = Join-Path $CacheRoot "tmp"
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null
$env:PYTHONIOENCODING = "utf-8"
$env:HF_HUB_DISABLE_SYMLINKS_WARNING = "1"
$env:HF_HUB_DISABLE_XET = "1"
$env:NLTK_DATA = Join-Path $CacheRoot "nltk_data"

$Global:AI_CUDA_ENV = Join-Path $Global:ANIMATION_LAB_ROOT "envs\whisperx"
$Global:AI_CUDA_PYTHON = Join-Path $Global:AI_CUDA_ENV "Scripts\python.exe"
$Global:SCENEDETECT_BIN = Join-Path $Global:AI_CUDA_ENV "Scripts\scenedetect.exe"
$Global:MANIM_PYTHON = Join-Path $Global:ANIMATION_LAB_ROOT "envs\manimgl\Scripts\python.exe"

$Global:PIPELINE_ROOT = Join-Path $Global:ANIMATION_LAB_ROOT "pipeline"
$Global:KOKORO_MODEL = Join-Path $Global:ANIMATION_LAB_ROOT "models\kokoro\kokoro-v1.0.int8.onnx"
$Global:KOKORO_VOICES = Join-Path $Global:ANIMATION_LAB_ROOT "models\kokoro\voices.bin"
$env:KOKORO_MODEL = $Global:KOKORO_MODEL
$env:KOKORO_VOICES = $Global:KOKORO_VOICES

$Global:BLENDER_BIN = "G:\blender.exe"

$Global:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$env:CHROME_PATH = $Global:CHROME_PATH
$env:PUPPETEER_EXECUTABLE_PATH = $Global:CHROME_PATH

$Global:GODOT_BIN = "G:\SPRITE ANIAIMTION\tools\Godot-4.7.2\Godot_v4.7.2-stable_win64_console.exe"
$Global:GODOT_GUI_BIN = "G:\SPRITE ANIAIMTION\tools\Godot-4.7.2\Godot_v4.7.2-stable_win64.exe"
$env:GODOT_BIN = $Global:GODOT_BIN

$Global:FFMPEG_BIN = "C:\Users\User\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
$Global:FFPROBE_BIN = "C:\Users\User\AppData\Local\Microsoft\WinGet\Links\ffprobe.exe"
