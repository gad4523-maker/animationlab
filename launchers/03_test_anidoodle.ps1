. "G:\AnimationLab\launchers\env_common.ps1"
$anDir = "G:\AnimationLab\sandboxes\anidoodle-demo"
$outDir = "G:\AnimationLab\test-outputs\03_anidoodle"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Push-Location $anDir
try {
  & node tools/still.mjs sumiE --frame 490 --out "$outDir\anidoodle_sumie_still.png"
  & node tools/still.mjs animeDemo --frame 36 --out "$outDir\anidoodle_demo_still.png"
  & node tools/render.mjs sumiE --from 240 --to 312 --workers 1 --out "$outDir\anidoodle_sumie_seq.mp4"
  & node tools/render.mjs animeDemo --workers 1 --out "$outDir\anidoodle_demo.mp4"
  Write-Host "[03_anidoodle] Outputs in $outDir"
} finally {
  Pop-Location
}
