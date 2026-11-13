# minhmice-cyberpad/scripts/install-extension.ps1
$ErrorActionPreference = "Stop"

$ompExtDir = "$env:USERPROFILE\.omp\agent\extensions"
if (-not (Test-Path $ompExtDir)) {
    New-Item -ItemType Directory -Path $ompExtDir -Force | Out-Null
}

$sourceFile = Join-Path $PSScriptRoot "..\omp-extension\minhmice-cyberpad.ts"
$targetFile = Join-Path $ompExtDir "minhmice-cyberpad.ts"

Copy-Item -Path $sourceFile -Destination $targetFile -Force
Write-Host "[OK] Successfully deployed minhmice-cyberpad.ts to $targetFile"
