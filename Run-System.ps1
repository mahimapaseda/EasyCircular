# EasyCircular - run the full local system
#
# Double-click Run-System.cmd, or from the repo root:
#   powershell -ExecutionPolicy Bypass -File .\Run-System.ps1
#
# Options:
#   .\Run-System.ps1 -PullModel
#   .\Run-System.ps1 -SkipOllama
#   .\Run-System.ps1 -Model "llama3.2:3b"

param(
    [string]$AiRoot = "G:\AI",
    [string]$Model = "llama3.2:3b",
    [switch]$PullModel,
    [switch]$SkipOllama
)

$ErrorActionPreference = "Stop"
$root = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }
$startScript = Join-Path $root "scripts\start-local.ps1"

if (-not (Test-Path -LiteralPath $startScript)) {
    Write-Host "Missing start script: $startScript" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "  EasyCircular" -ForegroundColor Cyan
Write-Host "  Starting Ollama, MongoDB, AI (:5000), Backend (:4000), Frontend (:3002)"
Write-Host ""

$startArgs = @{
    AiRoot = $AiRoot
    Model  = $Model
}
if ($PullModel) { $startArgs.PullModel = $true }
if ($SkipOllama) { $startArgs.SkipOllama = $true }

try {
    & $startScript @startArgs
    Write-Host ""
    Write-Host "Open the app: http://localhost:3002" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "Failed to start: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor DarkRed
}

if ($Host.Name -eq "ConsoleHost") {
    Write-Host ""
    Write-Host "Press Enter to close this window..."
    try { [void](Read-Host) } catch {}
}
