# Downloads Sinhala (sin) and Tamil (tam) traineddata for Tesseract OCR.
# English (eng) is copied from the system install when available.

$ErrorActionPreference = "Stop"

$systemTessdata = "C:\Program Files\Tesseract-OCR\tessdata"
$projectTessdata = Join-Path $PSScriptRoot "..\ai-service\tessdata"
$baseUrl = "https://github.com/tesseract-ocr/tessdata_fast/raw/main"

function Install-Language($lang, $dir) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $dest = Join-Path $dir "$lang.traineddata"
    if (Test-Path $dest) {
        Write-Host "Already present: $dest"
        return
    }

    $systemFile = Join-Path $systemTessdata "$lang.traineddata"
    if (Test-Path $systemFile) {
        Copy-Item $systemFile $dest
        Write-Host "Copied from system: $dest"
        return
    }

    $url = "$baseUrl/$lang.traineddata"
    Write-Host "Downloading $lang.traineddata to $dest ..."
    Invoke-WebRequest -Uri $url -OutFile $dest
    Write-Host "Installed: $dest"
}

$targetDir = $projectTessdata
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}

foreach ($lang in @("eng", "sin", "tam")) {
    try {
        Install-Language $lang $targetDir
    } catch {
        if ($lang -eq "eng" -and (Test-Path $systemTessdata)) {
            Install-Language $lang (Resolve-Path $systemTessdata).Path
        } else {
            Write-Host "Failed to install ${lang}: $_"
        }
    }
}

Write-Host ""
Write-Host "OCR languages ready (sin+eng+tam). Restart the AI service, then re-extract your PDF."
