. "G:\AnimationLab\launchers\env_common.ps1"
$py = "G:\AnimationLab\envs\manimgl\Scripts\python.exe"
$script = "G:\AnimationLab\StyleBenchmark\styles\blender\render_blender_styles.py"
$verify = "G:\AnimationLab\StyleBenchmark\shared\verify_video.py"
$manifest = Get-Content "G:\AnimationLab\StyleBenchmark\manifest.json" -Raw | ConvertFrom-Json

$blenderStyles = $manifest.styles | Where-Object { $_.source_repo -eq "Blender" }
foreach ($s in $blenderStyles) {
  $id = $s.id
  $mp4 = "G:\AnimationLab\StyleBenchmark\videos\$id.mp4"
  $jpg = "G:\AnimationLab\StyleBenchmark\previews\$id.jpg"
  if ($s.status -eq "completed" -and (Test-Path $mp4) -and (Test-Path $jpg)) {
    Write-Host "[SKIP] $id already completed"
    continue
  }
  Write-Host "=== Rendering Blender style: $id ==="
  & "G:\blender.exe" --background --python $script -- --style $id
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Blender exited $LASTEXITCODE for $id"
  }
  & $py $verify --id $id
  # Clean temporary PNG frames after verified encode to keep G: clean
  $tmp = "G:\AnimationLab\StyleBenchmark\styles\blender\_tmp_$id"
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
}