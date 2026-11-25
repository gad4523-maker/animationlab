. "G:\AnimationLab\launchers\env_common.ps1"
$rhubarb = "G:\AnimationLab\portable\rhubarb\Rhubarb-Lip-Sync-1.14.0-Windows\rhubarb.exe"
$wav = "G:\AnimationLab\sandboxes\shared-media\speech_test.wav"
$txt = "G:\AnimationLab\sandboxes\shared-media\speech_transcript.txt"
$outDir = "G:\AnimationLab\test-outputs\13_rhubarb-lip-sync"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

& $rhubarb -f json -d $txt -o (Join-Path $outDir "mouth_cues_dialog.json") $wav
& $rhubarb -f json -o (Join-Path $outDir "mouth_cues.json") $wav
& node "G:\AnimationLab\sandboxes\rhubarb-demo\render_rhubarb_preview.mjs"
Write-Host "[13_rhubarb-lip-sync] Output: $outDir"
