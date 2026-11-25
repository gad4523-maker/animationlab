# Idempotent setup & dependency verification for G:\AnimationLab\pipeline
. "G:\AnimationLab\launchers\env_common.ps1"

Write-Host "=== Setting up AnimationLab Production Pipeline ===" -ForegroundColor Cyan

# Ensure Kokoro weights exist in G:\AnimationLab\models\kokoro
New-Item -ItemType Directory -Force -Path "G:\AnimationLab\models\kokoro" | Out-Null
if (-not (Test-Path $Global:KOKORO_MODEL) -and (Test-Path "G:\AnimationLab\Gravity Short\work\kokoro-v1.0.int8.onnx")) {
  Copy-Item "G:\AnimationLab\Gravity Short\work\kokoro-v1.0.int8.onnx" $Global:KOKORO_MODEL -Force
}
if (-not (Test-Path $Global:KOKORO_VOICES) -and (Test-Path "G:\AnimationLab\Chakra Short\work\voices.bin")) {
  Copy-Item "G:\AnimationLab\Chakra Short\work\voices.bin" $Global:KOKORO_VOICES -Force
}

# Verify Python packages in unified CUDA AI env (installs missing TTS libs only if absent)
& $Global:AI_CUDA_PYTHON -c "import kokoro_onnx, soundfile" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Installing kokoro-onnx + soundfile into unified env..."
  & $Global:AI_CUDA_PYTHON -m pip install kokoro-onnx soundfile
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

# Run doctor
& $Global:AI_CUDA_PYTHON "G:\AnimationLab\pipeline\cli.py" doctor
exit $LASTEXITCODE
