. "G:\AnimationLab\launchers\env_common.ps1"
$py = "G:\AnimationLab\envs\manimgl\Scripts\python.exe"
$verify = "G:\AnimationLab\StyleBenchmark\shared\verify_video.py"
$sfx = "G:\AnimationLab\StyleBenchmark\shared\goku_ssj_sfx.wav"
$remotionCmd = "G:\AnimationLab\sandboxes\remotion-demo\node_modules\.bin\remotion.cmd"
$remDir = "G:\AnimationLab\StyleBenchmark\styles\remotion"

$jobs = @(
  @{ id = "remotion-bold-anime-kinetic"; comp = "GokuKinetic" },
  @{ id = "remotion-manga-split-panel"; comp = "GokuMangaPanels" }
)

Push-Location $remDir
try {
  foreach ($j in $jobs) {
    $id = $j.id
    $mp4 = "G:\AnimationLab\StyleBenchmark\videos\$id.mp4"
    $jpg = "G:\AnimationLab\StyleBenchmark\previews\$id.jpg"
    if ((Test-Path $mp4) -and (Test-Path $jpg)) {
      Write-Host "[SKIP] $id exists"
      continue
    }
    $rawMp4 = Join-Path $remDir "$id.raw.mp4"
    Remove-Item $rawMp4 -Force -ErrorAction SilentlyContinue
    Write-Host "=== Rendering Remotion style: $id ==="
    & $remotionCmd render src/index.ts $j.comp $rawMp4 --browser-executable="$Global:CHROME_PATH" --concurrency=2
    if ($LASTEXITCODE -eq 0 -and (Test-Path $rawMp4)) {
      & $Global:FFMPEG_BIN -y -loglevel error -i $rawMp4 -i $sfx -map 0:v:0 -map 1:a:0 -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart $mp4
      Remove-Item $rawMp4 -Force -ErrorAction SilentlyContinue
    }
    & $py $verify --id $id
  }
} finally {
  Pop-Location
}