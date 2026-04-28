# Remove Gym backend Windows service created by SETUP_WINDOWS_SERVICE.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Remove Windows Service (Backend)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Administrator privileges are required." -ForegroundColor Red
    exit 1
}

$serviceName = "Gym Management Backend"

$nssmCmd = Get-Command nssm -ErrorAction SilentlyContinue
if ($nssmCmd) {
    $nssmPath = $nssmCmd.Source
} else {
    $candidatePaths = @(
        "C:\tools\nssm\win64\nssm.exe",
        "C:\nssm\win64\nssm.exe",
        "C:\Program Files\nssm\win64\nssm.exe"
    )
    $nssmPath = $candidatePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
}

if (-not $nssmPath) {
    Write-Host "NSSM not found. Remove the service manually from Services." -ForegroundColor Red
    exit 1
}

$existing = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if (-not $existing) {
    Write-Host "Service not found: $serviceName" -ForegroundColor Yellow
    exit 0
}

Write-Host "Stopping service..." -ForegroundColor Yellow
& $nssmPath stop $serviceName | Out-Null
Start-Sleep -Seconds 1

Write-Host "Removing service..." -ForegroundColor Yellow
& $nssmPath remove $serviceName confirm | Out-Null

Write-Host "Service removed: $serviceName" -ForegroundColor Green
