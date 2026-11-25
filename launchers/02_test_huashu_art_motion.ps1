. "G:\AnimationLab\launchers\env_common.ps1"
& node "G:\AnimationLab\sandboxes\huashu-art-motion-demo\run_huashu.mjs"
$py = $Global:AI_CUDA_PYTHON
if (Test-Path $py) {
  & $py "G:\AnimationLab\experimental\huashu-art-motion\scripts\film_gate.py" "G:\AnimationLab\test-outputs\02_huashu-art-motion\huashu_demo.mp4" --json | Out-File -Encoding UTF8 "G:\AnimationLab\test-outputs\02_huashu-art-motion\film_gate.json"
}
Write-Host "[02_huashu-art-motion] Output: G:\AnimationLab\test-outputs\02_huashu-art-motion\huashu_demo.mp4"
