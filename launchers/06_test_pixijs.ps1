. "G:\AnimationLab\launchers\env_common.ps1"
$suite = "G:\AnimationLab\sandboxes\pixi-suite"
Push-Location $suite
try {
  & ".\node_modules\.bin\esbuild.cmd" pixi_demos.js --bundle --format=iife --target=es2020 --outfile=dist/pixi_demos.bundle.js
  & node run_pixi_suite.mjs
  Write-Host "[06/07/08 PixiJS Suite] Rendered pixijs, pixijs-filters, and particle-emitter demos."
} finally {
  Pop-Location
}
