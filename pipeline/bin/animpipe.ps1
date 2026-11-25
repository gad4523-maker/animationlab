param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ArgsList
)

. "G:\AnimationLab\launchers\env_common.ps1"
& $Global:AI_CUDA_PYTHON "G:\AnimationLab\pipeline\cli.py" @ArgsList
exit $LASTEXITCODE
