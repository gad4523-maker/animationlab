# Safe cache cleanup for G:\AnimationLab
# Clears regenerable pip/npm/wheels/tmp caches while preserving AI model weights (.cache\torch, nltk_data, huggingface, manim).

. "G:\AnimationLab\launchers\env_common.ps1"

$targets = @(
  "G:\AnimationLab\.cache\wheels",
  "G:\AnimationLab\.cache\pip",
  "G:\AnimationLab\.cache\npm",
  "G:\AnimationLab\.cache\tmp",
  "G:\AnimationLab\StyleBenchmark\styles\remotion\.cache",
  "G:\AnimationLab\StyleBenchmark\styles\motion-canvas\.vite",
  "G:\AnimationLab\StyleBenchmark\styles\motion-canvas\output"
)

$freedBytes = 0L
foreach ($t in $targets) {
  if (Test-Path $t) {
    $bytes = (Get-ChildItem -Path $t -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    if (-not $bytes) { $bytes = 0L }
    Remove-Item -Path $t -Recurse -Force -ErrorAction SilentlyContinue
    $freedBytes += $bytes
    Write-Host ("Cleaned: {0} ({1:N2} MB)" -f $t, ($bytes / 1MB))
  }
}

New-Item -ItemType Directory -Force -Path "G:\AnimationLab\.cache\tmp" | Out-Null
Write-Host ("Total cache cleared: {0:N2} MB" -f ($freedBytes / 1MB))
