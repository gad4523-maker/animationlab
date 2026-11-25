. "G:\AnimationLab\launchers\env_common.ps1"
$py = $Global:AI_CUDA_PYTHON
& $py "G:\AnimationLab\sandboxes\depth-anything-v2-demo\run_depth.py"
Write-Host "[11_depth-anything-v2] Output: G:\AnimationLab\test-outputs\11_depth-anything-v2"
