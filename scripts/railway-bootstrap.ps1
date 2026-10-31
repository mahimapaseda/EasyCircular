# Bootstrap EasyCircular on Railway (run after `railway login`).
# Creates project + MongoDB + AI + backend services when possible via CLI.
param(
    [string]$ProjectName = "easycircular",
    [string]$NvidiaKey = $env:OPENAI_API_KEY,
    [string]$LlmModel = "meta/llama-3.1-8b-instruct"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Require-Cmd($name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "Missing command: $name"
    }
}

Require-Cmd railway

Write-Host "Whoami:" -ForegroundColor Cyan
railway whoami

$aiToken = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })

if (-not $NvidiaKey) {
    $NvidiaKey = (Select-String -Path "ai-service\.env" -Pattern '^OPENAI_API_KEY=(.+)$').Matches.Groups[1].Value
}
if (-not $NvidiaKey) { throw "Set OPENAI_API_KEY (NVIDIA nvapi key) before bootstrap" }

Write-Host "Creating / linking project $ProjectName ..."
# Non-interactive project create when supported
railway init -n $ProjectName 2>$null
railway link 2>$null

Write-Host "Add MongoDB plugin from Railway dashboard if not present, then set env vars below."
Write-Host ""
Write-Host "=== AI service env ===" -ForegroundColor Yellow
Write-Host "LLM_PROVIDER=openai"
Write-Host "OPENAI_API_KEY=<nvapi>"
Write-Host "OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1"
Write-Host "LLM_MODEL=$LlmModel"
Write-Host "AI_SERVICE_TOKEN=$aiToken"
Write-Host ""
Write-Host "=== Backend env ===" -ForegroundColor Yellow
Write-Host "NODE_ENV=production"
Write-Host "JWT_SECRET=$jwtSecret"
Write-Host "AI_SERVICE_TOKEN=$aiToken"
Write-Host "AI_SERVICE_URL=http://ai-service.railway.internal:5000"
Write-Host "CORS_ORIGINS=http://localhost:3002"
Write-Host "UPLOAD_DIR=/app/backend/uploads"
Write-Host ""
Write-Host "Generated secrets written to scripts/.deploy-secrets.local (gitignored pattern)."

$secretsPath = Join-Path $PSScriptRoot ".deploy-secrets.local"
@"
AI_SERVICE_TOKEN=$aiToken
JWT_SECRET=$jwtSecret
OPENAI_API_KEY=$NvidiaKey
OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_MODEL=$LlmModel
LLM_PROVIDER=openai
"@ | Set-Content -Path $secretsPath -Encoding utf8

Write-Host "Saved $secretsPath"
