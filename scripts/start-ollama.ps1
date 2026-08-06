# Start local Ollama with models stored under G:\AI\models
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-ollama.ps1
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-ollama.ps1 -PullModel

param(
    [string]$AiRoot = "G:\AI",
    [string]$Model = "llama3.2:3b",
    [switch]$PullModel
)

$ErrorActionPreference = "Stop"

$ollamaDir = Join-Path $AiRoot "ollama"
$modelsDir = Join-Path $AiRoot "models"
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
    Write-Error @"
Ollama executable not found.
Expected zip extract at: $ollamaDir\ollama.exe
Download is large (~1.4 GB). If still downloading, wait for:
  G:\AI\downloads\ollama-windows-amd64.zip
Then extract into G:\AI\ollama
"@
}

New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null

$env:OLLAMA_MODELS = $modelsDir
$env:OLLAMA_HOST = "127.0.0.1:11434"

Write-Host "Using: $ollamaExe"
Write-Host "OLLAMA_MODELS=$env:OLLAMA_MODELS"

try {
    Invoke-WebRequest -Uri "http://127.0.0.1:11434/api/tags" -UseBasicParsing -TimeoutSec 2 | Out-Null
    Write-Host "Ollama already running."
} catch {
    Write-Host "Starting Ollama serve..."
    Start-Process -FilePath $ollamaExe -ArgumentList "serve" -WorkingDirectory (Split-Path $ollamaExe -Parent) -WindowStyle Minimized
    Start-Sleep -Seconds 4
}

if ($PullModel) {
    Write-Host "Pulling model $Model into $modelsDir ..."
    & $ollamaExe pull $Model
    if ($LASTEXITCODE -ne 0) { throw "ollama pull failed with exit $LASTEXITCODE" }
}

Write-Host "Ready. Base URL: http://127.0.0.1:11434  Model: $Model"
& $ollamaExe list
