. "G:\AnimationLab\launchers\env_common.ps1"
$env:PLAYWRIGHT_CHROME = $Global:CHROME_PATH
$env:LEMO_ANGLE = "default"
$lemoDir = "G:\AnimationLab\experimental\lemo-opuscar"
$demoDir = "G:\AnimationLab\sandboxes\lemo-opuscar-demo"
$outDir = "G:\AnimationLab\test-outputs\01_lemo-opuscar"
$stillsOut = Join-Path $outDir "stills"
New-Item -ItemType Directory -Force -Path $stillsOut | Out-Null

Push-Location $lemoDir
try {
  & node core/render/events.mjs $demoDir --out (Join-Path $outDir "events.json")
  & node core/render/still.mjs $demoDir 0.9 2.2 3.1 --size 1280x720 --out $stillsOut
  $mp4 = Join-Path $outDir "lemo_cel_anime_demo.mp4"
  Remove-Item $mp4, "$mp4.lock" -Force -ErrorAction SilentlyContinue
  & node core/render/video.mjs $demoDir --fps 24 --workers 1 --size 1280x720 --out $mp4
  Write-Host "[01_lemo-opuscar] Output: $mp4"
} finally {
  Pop-Location
}
