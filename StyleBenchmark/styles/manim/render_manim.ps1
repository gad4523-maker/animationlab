. "G:\AnimationLab\launchers\env_common.ps1"
$id = "manim-luminous-vector"
$mp4 = "G:\AnimationLab\StyleBenchmark\videos\$id.mp4"
$jpg = "G:\AnimationLab\StyleBenchmark\previews\$id.jpg"
if ((Test-Path $mp4) -and (Test-Path $jpg)) {
  Write-Host "[SKIP] $id exists"
  exit 0
}
$manimgl = "G:\AnimationLab\envs\manimgl\Scripts\manimgl.exe"
$py = "G:\AnimationLab\envs\manimgl\Scripts\python.exe"
$script = "G:\AnimationLab\StyleBenchmark\styles\manim\goku_manim.py"
$outDir = "G:\AnimationLab\StyleBenchmark\styles\manim\out"
$cfg = "G:\AnimationLab\sandboxes\manim-demo\custom_config.yml"
$sfx = "G:\AnimationLab\StyleBenchmark\shared\goku_ssj_sfx.wav"

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
& $manimgl $script GokuSuperSaiyanManim -w -q --config_file $cfg --video_dir $outDir --file_name "raw_manim" -r 720x1280 --fps 30
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$rawMp4 = Join-Path $outDir "raw_manim.mp4"
& $Global:FFMPEG_BIN -y -loglevel error -i $rawMp4 -i $sfx -map 0:v:0 -map 1:a:0 -t 5.0 -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart $mp4
& $py "G:\AnimationLab\StyleBenchmark\shared\verify_video.py" --id $id