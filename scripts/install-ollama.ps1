# Finish Ollama install into G:\AI using aria2 multi-connection download when needed.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\install-ollama.ps1

param(
    [string]$AiRoot = "G:\AI",
    [string]$Model = "llama3.2:3b",
    [string]$Version = "v0.32.6"
)

$ErrorActionPreference = "Stop"

$downloads = Join-Path $AiRoot "downloads"
$ollamaDir = Join-Path $AiRoot "ollama"
$modelsDir = Join-Path $AiRoot "models"
$setup = Join-Path $downloads "OllamaSetup.exe"
$aria2 = Get-ChildItem (Join-Path $downloads "aria2") -Recurse -Filter aria2c.exe -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName

New-Item -ItemType Directory -Force -Path $downloads, $ollamaDir, $modelsDir | Out-Null
[Environment]::SetEnvironmentVariable("OLLAMA_MODELS", $modelsDir, "User")
$env:OLLAMA_MODELS = $modelsDir

$existing = @(
    (Join-Path $ollamaDir "ollama.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama.exe"),
    "C:\Program Files\Ollama\ollama.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $existing) {
    $fromPath = Get-Command ollama -ErrorAction SilentlyContinue
    if ($fromPath) { $existing = $fromPath.Source }
}

if (-not $existing) {
    $url = "https://github.com/ollama/ollama/releases/download/$Version/OllamaSetup.exe"
    if (-not (Test-Path $setup) -or ((Get-Item $setup).Length -lt 1000000000)) {
        if (-not $aria2) {
            throw "aria2c.exe not found under $downloads\aria2 and Ollama is not installed. Download aria2 first."
        }
        Write-Host "Downloading OllamaSetup.exe with aria2..."
        & $aria2 -x 16 -s 16 -k 1M -c --file-allocation=none --allow-overwrite=true `
            --dir=$downloads --out="OllamaSetup.exe" $url
        if ($LASTEXITCODE -ne 0) { throw "aria2 download failed ($LASTEXITCODE)" }
    }

    Write-Host "Running silent installer to $ollamaDir ..."
    $p = Start-Process -FilePath $setup -ArgumentList "/VERYSILENT","/NORESTART","/DIR=$ollamaDir" -Wait -PassThru
    if ($p.ExitCode -ne 0) {
        Write-Host "Silent DIR install exit $($p.ExitCode); trying default silent install..."
        $p = Start-Process -FilePath $setup -ArgumentList "/VERYSILENT","/NORESTART" -Wait -PassThru
        if ($p.ExitCode -ne 0) { throw "OllamaSetup failed with exit $($p.ExitCode)" }
    }
}

$startScript = Join-Path $PSScriptRoot "start-ollama.ps1"
& $startScript -AiRoot $AiRoot -Model $Model -PullModel
Write-Host "Ollama install complete. Models: $modelsDir"
