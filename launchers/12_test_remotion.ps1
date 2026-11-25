. "G:\AnimationLab\launchers\env_common.ps1"
$remDir = "G:\AnimationLab\sandboxes\remotion-demo"
$outDir = "G:\AnimationLab\test-outputs\12_remotion"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outMp4 = Join-Path $outDir "remotion_demo.mp4"
$outPng = Join-Path $outDir "remotion_frame.png"
Push-Location $remDir
try {
  & .\node_modules\.bin\remotion.cmd render src/index.ts AnimeTitleDemo $outMp4 --browser-executable="$Global:CHROME_PATH" --concurrency=2
  & $Global:FFMPEG_BIN -y -ss 1.5 -i $outMp4 -frames:v 1 $outPng 2>&1 | Out-Null
  Write-Host "[12_remotion] Output: $outMp4"
} finally {
  Pop-Location
}
