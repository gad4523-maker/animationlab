. "G:\AnimationLab\launchers\env_common.ps1"
$sandbox = "G:\AnimationLab\sandboxes\godot-demo"
$outDir = "G:\AnimationLab\test-outputs\10_godot-demo-projects"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$rawAvi = Join-Path $outDir "godot_particles_raw.avi"
Remove-Item $rawAvi -Force -ErrorAction SilentlyContinue
& $Global:GODOT_BIN --path $sandbox --write-movie $rawAvi --fixed-fps 24 --quit-after 96
$mp4 = Join-Path $outDir "godot_demo.mp4"
$sheet = Join-Path $outDir "godot_contact_sheet.png"
& $Global:FFMPEG_BIN -y -i $rawAvi -c:v libx264 -pix_fmt yuv420p -crf 18 $mp4 2>&1 | Out-Null
& $Global:FFMPEG_BIN -y -i $mp4 -vf "select='not(mod(n,12))',scale=426:240,tile=4x2" -frames:v 1 $sheet 2>&1 | Out-Null
Remove-Item $rawAvi -Force -ErrorAction SilentlyContinue
Write-Host "[10_godot-demo-projects] Output: $mp4"
