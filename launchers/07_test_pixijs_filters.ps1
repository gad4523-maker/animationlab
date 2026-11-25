. "G:\AnimationLab\launchers\env_common.ps1"
# Shares bundle and runner with 06_test_pixijs.ps1; runs PixiJS Filters v6 + before/after comparison
& "G:\AnimationLab\launchers\06_test_pixijs.ps1"
& $Global:FFMPEG_BIN -y -i "G:\AnimationLab\test-outputs\06_pixijs\pixijs_sprite_frame.png" -i "G:\AnimationLab\test-outputs\07_pixijs-filters\pixijs_filters_frame.png" -filter_complex "[0:v]scale=640:360[a];[1:v]scale=640:360[b];[a][b]hstack=inputs=2" "G:\AnimationLab\test-outputs\07_pixijs-filters\pixijs_filters_before_after.png" 2>&1 | Out-Null
Write-Host "[07_pixijs-filters] Output: G:\AnimationLab\test-outputs\07_pixijs-filters\pixijs_filters_demo.mp4"
