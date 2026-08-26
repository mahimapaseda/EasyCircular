# Pack a clean lecturer submission folder: EasyCircular_2540881
# Does not modify the Git working tree; copies out only.

[CmdletBinding()]
param(
    [string]$StudentId = "2540881",
    [string]$DestRoot = (Join-Path $env:USERPROFILE "Documents"),
    [switch]$SkipZip
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$FolderName = "EasyCircular_$StudentId"
$Dest = Join-Path $DestRoot $FolderName
$ZipPath = Join-Path $DestRoot "$FolderName.zip"

Write-Host "Source: $RepoRoot"
Write-Host "Dest:   $Dest"

if (Test-Path $Dest) {
    Write-Host "Removing existing $Dest ..."
    Remove-Item -LiteralPath $Dest -Recurse -Force
}
New-Item -ItemType Directory -Path $Dest | Out-Null

# Directory names to skip anywhere in the tree
$ExcludeDirs = @(
    ".git",
    ".cursor",
    "node_modules",
    ".next",
    "out",
    "dist",
    "build",
    ".venv",
    ".venv-train",
    "venv",
    "__pycache__",
    ".pytest_cache",
    ".idea",
    ".vscode",
    ".docker",
    "uploads",
    "corpus",
    "annotations",
    "output",
    "sft"
)

# Top-level paths to skip entirely
$ExcludeTopLevel = @(
    "sample circulars",
    "Contextual report.docx",
    "debug-633f17.log",
    "desktop.ini"
)

function ShouldSkipDir([string]$Name) {
    return $ExcludeDirs -contains $Name
}

function Copy-TreeFiltered {
    param(
        [string]$From,
        [string]$To
    )
    New-Item -ItemType Directory -Path $To -Force | Out-Null
    Get-ChildItem -LiteralPath $From -Force | ForEach-Object {
        $name = $_.Name
        if ($_.PSIsContainer) {
            if (ShouldSkipDir $name) { return }
            # Skip large training derived trees under ai-service/training
            if ($From -match '[\\/]ai-service[\\/]training$' -and ($name -in @("corpus", "annotations", "output", "sft"))) {
                return
            }
            Copy-TreeFiltered -From $_.FullName -To (Join-Path $To $name)
            return
        }

        # Skip Word docs and lock files
        if ($name -like "*.docx" -or $name -like "~`$*") { return }
        # Skip secrets (keep .env.example)
        if ($name -eq ".env" -or $name -eq ".env.local") { return }
        if ($name -like ".env.*.local") { return }
        # Skip logs and OS junk
        if ($name -like "*.log" -or $name -eq "Thumbs.db" -or $name -eq ".DS_Store" -or $name -eq "desktop.ini") {
            return
        }
        # Skip large OCR/model dumps
        if ($name -like "*.traineddata" -or $name -like "*.spacy" -or $name -like "*.gguf") { return }
        # Skip sample PDFs under docs/sample-circulars
        if ($From -match '[\\/]sample-circulars$' -and $name -like "*.pdf") { return }

        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $To $name) -Force
    }
}

# Copy allowed top-level items
Get-ChildItem -LiteralPath $RepoRoot -Force | ForEach-Object {
    $name = $_.Name
    if ($ExcludeTopLevel -contains $name) { return }
    if ($_.PSIsContainer) {
        if (ShouldSkipDir $name) { return }
        Write-Host "  + $name/"
        Copy-TreeFiltered -From $_.FullName -To (Join-Path $Dest $name)
    }
    else {
        if ($name -like "*.docx" -or $name -like "*.log") { return }
        if ($name -eq ".env" -or $name -eq ".env.local") { return }
        Write-Host "  + $name"
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $Dest $name) -Force
    }
}

# Extra cleanup: any docx that slipped through
Get-ChildItem -LiteralPath $Dest -Recurse -Filter "*.docx" -Force -ErrorAction SilentlyContinue |
    Remove-Item -Force

# Extra cleanup: secrets
@(
    (Join-Path $Dest "backend\.env"),
    (Join-Path $Dest "ai-service\.env"),
    (Join-Path $Dest "frontend\.env.local")
) | ForEach-Object {
    if (Test-Path $_) { Remove-Item -LiteralPath $_ -Force }
}

$readme = @"
EasyCircular — lecturer submission package
Student ID: $StudentId
Folder: $FolderName

This package contains the runnable software artefact (source code + docs).
Generated thesis Word files (.docx) are NOT included; submit those separately if required.

Quick start
-----------
1. Copy environment templates (first time):
   - backend/.env.example  -> backend/.env
   - ai-service/.env.example -> ai-service/.env
   - frontend/.env.example -> frontend/.env.local

2. Prefer Docker:
   docker compose up --build

   Frontend: http://localhost:3002
   Backend:  http://localhost:4000/health
   AI:       http://localhost:5000/health

3. Or on Windows without Docker:
   .\Run-System.ps1

4. Phase checks (services must be running):
   npm run verify:phase1
   npm run verify:phase4

See README.md and IMPLEMENTATION_PLAN.md for full details.
"@
Set-Content -LiteralPath (Join-Path $Dest "SUBMISSION_README.txt") -Value $readme -Encoding UTF8

# Size summary
$bytes = (Get-ChildItem -LiteralPath $Dest -Recurse -File -Force -ErrorAction SilentlyContinue |
    Measure-Object -Property Length -Sum).Sum
$sizeMb = [math]::Round(($bytes / 1MB), 2)
Write-Host "Folder size: $sizeMb MB"

if (-not $SkipZip) {
    if (Test-Path $ZipPath) { Remove-Item -LiteralPath $ZipPath -Force }
    Write-Host "Creating ZIP: $ZipPath"
    Compress-Archive -Path $Dest -DestinationPath $ZipPath -CompressionLevel Optimal
    $zipMb = [math]::Round(((Get-Item $ZipPath).Length / 1MB), 2)
    Write-Host "ZIP size: $zipMb MB"
}

Write-Host ""
Write-Host "Top-level contents:"
Get-ChildItem -LiteralPath $Dest -Force | Select-Object Name, Mode | Format-Table -AutoSize
Write-Host "Done."
