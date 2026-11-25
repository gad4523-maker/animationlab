# Fast non-rendering health check for retained tools, binaries, envs, style libraries, and starter template
. "G:\AnimationLab\launchers\env_common.ps1"

$failed = 0
function Check-Item([string]$Label, [scriptblock]$Test) {
  Write-Host -NoNewline ("Checking {0,-42} ... " -f $Label)
  $global:LASTEXITCODE = 0
  try {
    $res = & $Test
    $ec = $LASTEXITCODE
    if ($ec -and $ec -ne 0) {
      Write-Host "FAIL (exit $ec)" -ForegroundColor Red
      $script:failed++
    } elseif ($res -eq $false) {
      Write-Host "FAIL" -ForegroundColor Red
      $script:failed++
    } else {
      Write-Host ("OK {0}" -f $res) -ForegroundColor Green
    }
  } catch {
    Write-Host ("FAIL: {0}" -f $_.Exception.Message) -ForegroundColor Red
    $script:failed++
  }
}

Check-Item "Chrome binary"        { if (Test-Path $Global:CHROME_PATH) { $Global:CHROME_PATH } else { $false } }
Check-Item "FFmpeg binary"        { if (Test-Path $Global:FFMPEG_BIN) { $o = & $Global:FFMPEG_BIN -version; ($o | Select-Object -First 1) } else { $false } }
Check-Item "FFprobe binary"       { if (Test-Path $Global:FFPROBE_BIN) { "ready" } else { $false } }
Check-Item "Godot 4.7.2 binary"   { if (Test-Path $Global:GODOT_BIN) { (& $Global:GODOT_BIN --version) } else { $false } }
Check-Item "Blender 5.2.2 binary" { if (Test-Path $Global:BLENDER_BIN) { $o = & $Global:BLENDER_BIN --version; ($o | Select-Object -First 1) } else { $false } }
Check-Item "Rhubarb Lip Sync CLI" { $r="G:\AnimationLab\portable\rhubarb\Rhubarb-Lip-Sync-1.14.0-Windows\rhubarb.exe"; if (Test-Path $r) { (& $r --version) } else { $false } }

Check-Item "Unified CUDA AI Python" {
  & $Global:AI_CUDA_PYTHON -c "import torch, whisperx, timm, cv2, scenedetect; assert torch.cuda.is_available(); print(f'torch={torch.__version__} cuda=True cv2={cv2.__version__} timm={timm.__version__}')"
}

Check-Item "PySceneDetect CLI" {
  $o = & $Global:SCENEDETECT_BIN version
  ($o | Select-Object -First 1)
}

Check-Item "ManimGL env" {
  & $Global:MANIM_PYTHON -c "import manimlib, av; print('manimgl + av OK')"
}

Check-Item "Rigby2D CLI" {
  $o = & node "G:\AnimationLab\character-tools\rigby2d\bin\rigby.js" --help
  ($o | Select-Object -First 1)
}

Check-Item "Pixelorama source + assets" {
  Test-Path "G:\AnimationLab\character-tools\pixelorama\project.godot"
}

Check-Item "Node sandboxes" {
  (Test-Path "G:\AnimationLab\sandboxes\pixi-suite\node_modules\pixi.js") -and
  (Test-Path "G:\AnimationLab\sandboxes\anidoodle-demo\node_modules\three") -and
  (Test-Path "G:\AnimationLab\sandboxes\remotion-demo\node_modules\@remotion") -and
  (Test-Path "G:\AnimationLab\sandboxes\motion-canvas-demo\node_modules\@motion-canvas")
}

Check-Item "Style libraries (Lemo/Huashu/Ani)" {
  (Test-Path "G:\AnimationLab\experimental\lemo-opuscar\styles\README.md") -and
  (Test-Path "G:\AnimationLab\experimental\huashu-art-motion\scripts\film_gate.py") -and
  (Test-Path "G:\AnimationLab\experimental\anidoodle\skills\anidoodle\references\styles\INDEX.md")
}

Check-Item "Three.js starter template" {
  (Test-Path "G:\AnimationLab\templates\threejs-short-starter\render.mjs") -and
  (Test-Path "G:\AnimationLab\templates\threejs-short-starter\vendor\three.module.min.js")
}

Check-Item "StyleBenchmark gallery & junctions" {
  (Test-Path "G:\AnimationLab\StyleBenchmark\gallery\index.html") -and
  (Test-Path "G:\AnimationLab\StyleBenchmark\manifest.json") -and
  (Test-Path "G:\AnimationLab\StyleBenchmark\styles\remotion\node_modules") -and
  (Test-Path "G:\AnimationLab\StyleBenchmark\styles\motion-canvas\node_modules")
}

Write-Host ""
if ($failed -gt 0) {
  Write-Host "verify_lab FAILED ($failed checks failed)." -ForegroundColor Red
  exit 1
}
Write-Host "verify_lab PASSED (all checks OK)." -ForegroundColor Green
exit 0
