# minhmice-cyberpad/scripts/flash-pad.ps1
[CmdletBinding()]
param(
    [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"

Write-Host "Checking USB HID Device (VID 1189, PID 8842)..."
$device = Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -like "*VID_1189&PID_8842*" }
if (-not $device) {
    Write-Error "Hardware macropad not detected! Please connect keyboard via USB-A to USB-C cable."
}
Write-Host "[OK] Detected: $($device[0].FriendlyName)"

$yamlPath = Join-Path $PSScriptRoot "..\firmware\layout.yaml"
if (-not (Test-Path $yamlPath)) {
    Write-Error "Configuration layout.yaml missing at $yamlPath"
}

if ($CheckOnly) {
    Write-Host "[OK] Configuration layout check passed."
    exit 0
}

# Check if ch57x-keyboard-tool exists
$tool = Get-Command ch57x-keyboard-tool -ErrorAction SilentlyContinue
if ($tool) {
    Write-Host "Flashing with ch57x-keyboard-tool..."
    & ch57x-keyboard-tool upload $yamlPath
    Write-Host "[SUCCESS] Flashed configuration to chip onboard memory!"
} else {
    Write-Host "[NOTE] ch57x-keyboard-tool CLI not found in PATH."
    Write-Host "To flash via CLI:"
    Write-Host "  cargo install ch57x-keyboard-tool"
    Write-Host "To flash via browser (WebHID):"
    Write-Host "  Open https://jvspier.github.io/macropad-rebind/ in Chrome/Edge and import firmware/webhid-profile.json"
}
