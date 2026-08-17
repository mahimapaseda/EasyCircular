# Register a fine-tuned EasyCircular GGUF as Ollama tag easycircular:3b
#
# Usage (from repo root, after QLoRA + merge):
#   powershell -ExecutionPolicy Bypass -File .\scripts\publish-finetuned-ollama.ps1
#   powershell -ExecutionPolicy Bypass -File .\scripts\publish-finetuned-ollama.ps1 -AiRoot G:\AI

param(
    [string]$AiRoot = "G:\AI",
    [string]$Tag = "easycircular:3b",
    [string]$GgufName = "easycircular-3b-q4_k_m.gguf"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$aiService = Join-Path $root "ai-service"
$python = Join-Path $aiService ".venv-train\Scripts\python.exe"
if (-not (Test-Path $python)) {
    $python = Join-Path $aiService ".venv\Scripts\python.exe"
}
if (-not (Test-Path $python)) {
    $python = "python"
}

$modelsDir = Join-Path $AiRoot "models"
New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null
$env:OLLAMA_MODELS = $modelsDir

$ggufOut = Join-Path $modelsDir $GgufName
Write-Host "Exporting GGUF to $ggufOut"
& $python (Join-Path $aiService "training\export_gguf.py") --out $ggufOut
if ($LASTEXITCODE -ne 0) {
    throw "GGUF export failed with exit $LASTEXITCODE"
}
if (-not (Test-Path $ggufOut)) {
    throw "Expected GGUF missing: $ggufOut"
}

$ollamaDir = Join-Path $AiRoot "ollama"
$candidates = @(
    (Join-Path $ollamaDir "ollama.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama.exe"),
    "C:\Program Files\Ollama\ollama.exe"
)
$ollamaExe = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $ollamaExe) {
    $fromPath = Get-Command ollama -ErrorAction SilentlyContinue
    if ($fromPath) { $ollamaExe = $fromPath.Source }
}
if (-not $ollamaExe) {
    throw "ollama.exe not found. Start Ollama from scripts\start-ollama.ps1 first."
}

$modelfileSrc = Join-Path $aiService "training\Modelfile"
$modelfileTmp = Join-Path $env:TEMP "easycircular-Modelfile"
$system = (Get-Content -LiteralPath $modelfileSrc | Select-Object -Skip 1) -join "`n"
@"
FROM $ggufOut
$system
"@ | Set-Content -LiteralPath $modelfileTmp -Encoding utf8

Write-Host "ollama create $Tag"
& $ollamaExe create $Tag -f $modelfileTmp
if ($LASTEXITCODE -ne 0) {
    throw "ollama create failed with exit $LASTEXITCODE"
}

Write-Host ""
Write-Host "Created $Tag"
Write-Host "Set in ai-service/.env :"
Write-Host "  OLLAMA_MODEL=$Tag"
Write-Host "Then restart the AI service."
