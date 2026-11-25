. "G:\AnimationLab\launchers\env_common.ps1"
$manimglExe = "G:\AnimationLab\envs\manimgl\Scripts\manimgl.exe"
$sandbox = "G:\AnimationLab\sandboxes\manim-demo"
$outDir = "G:\AnimationLab\test-outputs\04_manim"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
New-Item -ItemType Directory -Force -Path "G:\AnimationLab\.cache\manim" | Out-Null

$mp4 = Join-Path $outDir "manimgl_demo.mp4"
$png = Join-Path $outDir "manimgl_frame.png"

& $manimglExe (Join-Path $sandbox "fourier_epicycle_demo.py") AnimationLabMathDemo -w -q --config_file (Join-Path $sandbox "custom_config.yml") --video_dir $outDir --file_name "manimgl_demo" -r 1280x720 --fps 24
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $Global:FFMPEG_BIN -y -ss 2.8 -i $mp4 -frames:v 1 $png 2>&1 | Out-Null
Write-Host "[04_manim] Output: $mp4 (Note: zero-LaTeX OpenGL mode; Tex/MathTex requires optional external LaTeX)"