. "G:\AnimationLab\launchers\env_common.ps1"
$scenedetect = $Global:SCENEDETECT_BIN
$outDir = "G:\AnimationLab\test-outputs\16_pyscenedetect"
$thumbsDir = Join-Path $outDir "thumbs"
New-Item -ItemType Directory -Force -Path $thumbsDir | Out-Null

& $scenedetect -i "G:\AnimationLab\sandboxes\shared-media\test_scene_cuts.mp4" detect-content list-scenes -o $outDir save-images -n 1 -o $thumbsDir
Write-Host "[16_pyscenedetect] Output: $outDir"
