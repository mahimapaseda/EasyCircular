# Open Google Cloud Console on the OAuth client used by EasyCircular,
# and print the exact Authorized JavaScript origins to add.
#
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File .\scripts\fix-google-oauth-origins.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root "backend\.env"

if (-not (Test-Path -LiteralPath $envPath)) {
    throw "Missing backend/.env - run enable-google-signin.ps1 first."
}

$line = Get-Content -LiteralPath $envPath | Where-Object { $_ -match '^GOOGLE_CLIENT_ID=' } | Select-Object -First 1
if (-not $line) {
    throw "GOOGLE_CLIENT_ID is not set in backend/.env"
}

$clientId = ($line -replace '^GOOGLE_CLIENT_ID=', '').Trim().Trim('"').Trim("'")
if ($clientId -notmatch '\.apps\.googleusercontent\.com$') {
    throw "GOOGLE_CLIENT_ID does not look valid: $clientId"
}

$editUrl = "https://console.cloud.google.com/auth/clients/$([uri]::EscapeDataString($clientId))"
$legacyUrl = "https://console.cloud.google.com/apis/credentials/oauthclient/$([uri]::EscapeDataString($clientId))"

Write-Host ""
Write-Host "EasyCircular Google OAuth - fix 401" -ForegroundColor Cyan
Write-Host "Client ID: $clientId"
Write-Host ""
Write-Host "In Google Cloud Console, open this OAuth Web client and set:"
Write-Host ""
Write-Host "  Authorized JavaScript origins (no trailing slash):" -ForegroundColor Yellow
Write-Host "    http://localhost:3002"
Write-Host "    http://127.0.0.1:3002"
Write-Host ""
Write-Host "  Authorized redirect URIs: leave empty for GIS button sign-in"
Write-Host "  OAuth consent screen: External + add your Gmail as a Test user"
Write-Host ""
Write-Host "Save, wait 1-2 minutes, then hard-refresh http://localhost:3002/sign-in"
Write-Host ""

Start-Process $editUrl
Start-Sleep -Milliseconds 800
Start-Process $legacyUrl

Write-Host "Opened Google Cloud Console for this client."
