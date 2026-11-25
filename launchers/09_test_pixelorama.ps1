. "G:\AnimationLab\launchers\env_common.ps1"
$pxRepo = "G:\AnimationLab\character-tools\pixelorama"
$gifPath = "G:\AnimationLab\sandboxes\pixelorama-demo\warrior_anim.gif"
$outSheet = "G:\AnimationLab\test-outputs\09_pixelorama\warrior_spritesheet.png"
New-Item -ItemType Directory -Force -Path "G:\AnimationLab\test-outputs\09_pixelorama" | Out-Null
& $Global:GODOT_BIN --headless --path $pxRepo --quit -- --spritesheet --export --json --scale 4 --output $outSheet $gifPath
Write-Host "[09_pixelorama] Exported: $outSheet (Interactive GUI: & '$Global:GODOT_GUI_BIN' --path '$pxRepo')"
