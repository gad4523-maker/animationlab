. "G:\AnimationLab\launchers\env_common.ps1"
$envPath = "G:\AnimationLab\envs\whisperx"
$whisperxExe = Join-Path $envPath "Scripts\whisperx.exe"
$fwDir = "G:\AnimationLab\models\whisperx\faster-whisper-small.en"
$modelArg = if (Test-Path (Join-Path $fwDir "model.bin")) { $fwDir } else { "small.en" }
$wav = "G:\AnimationLab\sandboxes\shared-media\speech_test.wav"
$outDir = "G:\AnimationLab\test-outputs\14_whisperx"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$dllDirs = @((Join-Path $envPath "Lib\site-packages\torch\lib"), (Split-Path $Global:FFMPEG_BIN -Parent))
$nvBins = Get-ChildItem (Join-Path $envPath "Lib\site-packages\nvidia") -Directory -ErrorAction SilentlyContinue | ForEach-Object { Join-Path $_.FullName "bin" } | Where-Object { Test-Path $_ }
if ($nvBins) { $dllDirs += $nvBins }
$env:PATH = (($dllDirs + $env:PATH) -join ";")

& $whisperxExe $wav --model $modelArg --language en --device cuda --compute_type float16 --output_dir $outDir --output_format all
if ($LASTEXITCODE -ne 0) {
  Write-Warning "CUDA float16 failed; falling back to CPU int8..."
  & $whisperxExe $wav --model $modelArg --language en --device cpu --compute_type int8 --output_dir $outDir --output_format all
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
Write-Host "[14_whisperx] Output: $outDir"