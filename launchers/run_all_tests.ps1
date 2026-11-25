param(
  [string[]]$Tools = @()
)

. "G:\AnimationLab\launchers\env_common.ps1"

$tests = @(
  @{ Id = "01"; Name = "Lemo-Opuscar";            Script = "01_test_lemo_opuscar.ps1" },
  @{ Id = "02"; Name = "Huashu Art Motion";       Script = "02_test_huashu_art_motion.ps1" },
  @{ Id = "03"; Name = "Anidoodle";               Script = "03_test_anidoodle.ps1" },
  @{ Id = "04"; Name = "Manim (3Blue1Brown)";     Script = "04_test_manim.ps1" },
  @{ Id = "05"; Name = "Rigby2D";                 Script = "05_test_rigby2d.ps1" },
  @{ Id = "06"; Name = "PixiJS";                  Script = "06_test_pixijs.ps1" },
  @{ Id = "07"; Name = "PixiJS Filters";          Script = "07_test_pixijs_filters.ps1" },
  @{ Id = "08"; Name = "PixiJS Particle Emitter"; Script = "08_test_pixijs_particle_emitter.ps1" },
  @{ Id = "09"; Name = "Pixelorama";              Script = "09_test_pixelorama.ps1" },
  @{ Id = "10"; Name = "Godot Demo Projects";     Script = "10_test_godot_demo_projects.ps1" },
  @{ Id = "11"; Name = "Depth Anything V2";       Script = "11_test_depth_anything_v2.ps1" },
  @{ Id = "12"; Name = "Remotion";                Script = "12_test_remotion.ps1" },
  @{ Id = "13"; Name = "Rhubarb Lip Sync";        Script = "13_test_rhubarb_lip_sync.ps1" },
  @{ Id = "14"; Name = "WhisperX";                Script = "14_test_whisperx.ps1" },
  @{ Id = "15"; Name = "Motion Canvas";           Script = "15_test_motion_canvas.ps1" },
  @{ Id = "16"; Name = "PySceneDetect";           Script = "16_test_pyscenedetect.ps1" }
)

if ($Tools.Count -gt 0) {
  $norm = $Tools | ForEach-Object { $_.PadLeft(2, '0') }
  $tests = $tests | Where-Object { $norm -contains $_.Id }
}

$results = @()
$totalSw = [System.Diagnostics.Stopwatch]::StartNew()

foreach ($t in $tests) {
  $scriptPath = Join-Path $PSScriptRoot $t.Script
  Write-Host "`n==========================================" -ForegroundColor Cyan
  Write-Host "Running [$($t.Id)] $($t.Name) ($($t.Script))" -ForegroundColor Cyan
  Write-Host "==========================================" -ForegroundColor Cyan
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  & $scriptPath
  $ec = $LASTEXITCODE
  $sw.Stop()
  $status = if ($ec -eq 0) { "PASS" } else { "FAIL ($ec)" }
  $results += [PSCustomObject]@{
    Id      = $t.Id
    Tool    = $t.Name
    Status  = $status
    Seconds = [math]::Round($sw.Elapsed.TotalSeconds, 2)
  }
}

$totalSw.Stop()
Write-Host "`n=== AnimationLab Sequential Test Summary (Total: $([math]::Round($totalSw.Elapsed.TotalSeconds,2))s) ===" -ForegroundColor Green
$results | Format-Table -AutoSize

if ($results | Where-Object { $_.Status -ne "PASS" }) {
  exit 1
}
exit 0