. "G:\AnimationLab\launchers\env_common.ps1"
$py = "G:\AnimationLab\envs\manimgl\Scripts\python.exe"
$verify = "G:\AnimationLab\StyleBenchmark\shared\verify_video.py"
$sfx = "G:\AnimationLab\StyleBenchmark\shared\goku_ssj_sfx.wav"

foreach ($id in @("godot-hd-2d", "godot-2d-shonen-vfx", "godot-3d-toon-arena")) {
  $mp4 = "G:\AnimationLab\StyleBenchmark\videos\$id.mp4"
  $jpg = "G:\AnimationLab\StyleBenchmark\previews\$id.jpg"
  if ((Test-Path $mp4) -and (Test-Path $jpg)) {
    Write-Host "[SKIP] $id exists"
    continue
  }
  $proj = "G:\AnimationLab\StyleBenchmark\styles\godot\$id"
  $rawAvi = Join-Path $proj "raw_movie.avi"
  Remove-Item $rawAvi -Force -ErrorAction SilentlyContinue
  Write-Host "=== Rendering Godot style: $id ==="
  & $Global:GODOT_BIN --path $proj --write-movie $rawAvi --fixed-fps 30 --quit-after 150
  if (Test-Path $rawAvi) {
    & $Global:FFMPEG_BIN -y -loglevel error -i $rawAvi -i $sfx -map 0:v:0 -map 1:a:0 -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart $mp4
    Remove-Item $rawAvi -Force -ErrorAction SilentlyContinue
  }
  & $py $verify --id $id
}