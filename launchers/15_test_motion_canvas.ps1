. "G:\AnimationLab\launchers\env_common.ps1"
Push-Location "G:\AnimationLab\sandboxes\motion-canvas-demo"
try {
  & node render_headless.mjs
  Write-Host "[15_motion-canvas] Output: G:\AnimationLab\test-outputs\15_motion-canvas\motion_canvas_demo.mp4"
} finally {
  Pop-Location
}
