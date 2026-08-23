# Start EasyCircular local stack (Ollama + MongoDB + AI + backend + frontend)
#
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
#   npm run start:local

param(
    [string]$AiRoot = "G:\AI",
    [string]$Model = "llama3.2:3b",
    [switch]$PullModel,
    [switch]$SkipOllama
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "== EasyCircular local start ==" -ForegroundColor Cyan
Write-Host "Repo: $root"

# 1) Ollama (optional - AI falls back to extractive summaries if unavailable)
if (-not $SkipOllama) {
    $ollamaScript = Join-Path $PSScriptRoot "start-ollama.ps1"
    try {
        if ($PullModel) {
            & $ollamaScript -AiRoot $AiRoot -Model $Model -PullModel
        } else {
            & $ollamaScript -AiRoot $AiRoot -Model $Model
        }
    } catch {
        Write-Host "Ollama start skipped: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "AI will use extractive summaries until Ollama is available." -ForegroundColor Yellow
    }
}

# 2) MongoDB Windows service (if present)
$mongo = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongo) {
    if ($mongo.Status -ne "Running") {
        Write-Host "Starting MongoDB service..."
        try {
            Start-Service MongoDB
            Start-Sleep -Seconds 2
        } catch {
            Write-Host "Could not start MongoDB service: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "Ensure MongoDB is reachable at localhost:27017" -ForegroundColor Yellow
        }
    } else {
        Write-Host "MongoDB service already running."
    }
} else {
    Write-Host "MongoDB Windows service not found - ensure MongoDB is reachable at localhost:27017"
}

function Start-DevWindow {
    param(
        [Parameter(Mandatory = $true)][string]$Title,
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [Parameter(Mandatory = $true)][string]$Command
    )

    if (-not (Test-Path -LiteralPath $WorkingDirectory)) {
        throw "Working directory not found: $WorkingDirectory"
    }

    # Build a script and pass it as Base64 to avoid nested-quote parse bugs
    $safeTitle = $Title.Replace("'", "''")
    $safeDir = $WorkingDirectory.Replace("'", "''")
    $script = @"
`$ErrorActionPreference = 'Continue'
try { `$Host.UI.RawUI.WindowTitle = '$safeTitle' } catch {}
Set-Location -LiteralPath '$safeDir'
Write-Host '[$safeTitle]' -ForegroundColor Green
$Command
"@
    $encoded = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($script))
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoExit",
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-EncodedCommand", $encoded
    ) | Out-Null
}

# 3) AI service
$aiDir = Join-Path $root "ai-service"
$uvicorn = Join-Path $aiDir ".venv\Scripts\uvicorn.exe"
if (-not (Test-Path -LiteralPath $uvicorn)) {
    throw "AI venv missing at $uvicorn - create it and pip install -r requirements.txt first"
}
$uvicornCmd = '& "{0}" app.main:app --reload --host 127.0.0.1 --port 5000' -f $uvicorn
Start-DevWindow -Title "AI :5000" -WorkingDirectory $aiDir -Command $uvicornCmd

# 4) Backend
$backendDir = Join-Path $root "backend"
Start-DevWindow -Title "Backend :4000" -WorkingDirectory $backendDir -Command "npm run dev"

# 5) Frontend
$frontendDir = Join-Path $root "frontend"
Start-DevWindow -Title "Frontend :3002" -WorkingDirectory $frontendDir -Command "npm run dev"

Write-Host ""
Write-Host "Started:" -ForegroundColor Cyan
Write-Host "  Frontend  http://localhost:3002"
Write-Host "  Backend   http://localhost:4000/health"
Write-Host "  AI        http://localhost:5000/health"
Write-Host "  Ollama    http://127.0.0.1:11434"
Write-Host ""
Write-Host "Tip: for scanned CamScanner PDFs, wait for OCR on Extract before Process."
