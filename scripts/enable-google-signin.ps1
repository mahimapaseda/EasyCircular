# Write a Google Identity Services client ID into backend + frontend env files.
#
# 1. https://console.cloud.google.com/apis/credentials
# 2. Create OAuth client ID → Application type: Web application
# 3. Authorized JavaScript origins:
#      http://localhost:3002
#      http://127.0.0.1:3002
# 4. Copy the Client ID (ends with .apps.googleusercontent.com)
#
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File .\scripts\enable-google-signin.ps1 -ClientId "123.apps.googleusercontent.com"

param(
    [Parameter(Mandatory = $true)]
    [string]$ClientId
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$id = $ClientId.Trim().Trim('"')

if ($id -notmatch '\.apps\.googleusercontent\.com$') {
    throw "That does not look like a Google Web client ID (expected *.apps.googleusercontent.com)"
}

function Set-EnvKey([string]$Path, [string]$Key, [string]$Value) {
    if (-not (Test-Path $Path)) {
        New-Item -ItemType File -Path $Path -Force | Out-Null
    }
    $lines = @(Get-Content -LiteralPath $Path)
    $found = $false
    $next = foreach ($line in $lines) {
        if ($line -match "^$Key=") {
            $found = $true
            "$Key=$Value"
        } else {
            $line
        }
    }
    if (-not $found) {
        $next += "$Key=$Value"
    }
    Set-Content -LiteralPath $Path -Value $next -Encoding utf8
}

Set-EnvKey (Join-Path $root "backend\.env") "GOOGLE_CLIENT_ID" $id
Set-EnvKey (Join-Path $root "frontend\.env.local") "NEXT_PUBLIC_GOOGLE_CLIENT_ID" $id

Write-Host "Wrote GOOGLE_CLIENT_ID to backend/.env and frontend/.env.local"
Write-Host "Restart the backend (and frontend if it was already running) then refresh Sign in."
Write-Host "Google Cloud origins must include http://localhost:3002"
