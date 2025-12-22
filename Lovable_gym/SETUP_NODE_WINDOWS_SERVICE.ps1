param(
    [switch]$SkipBuild
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Node-Windows Service Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend"
$frontendPath = Join-Path $scriptPath "frontend"

Write-Host "Backend path:  $backendPath" -ForegroundColor Gray
Write-Host "Frontend path: $frontendPath" -ForegroundColor Gray
Write-Host ""

# Ensure running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] This script must be run as Administrator." -ForegroundColor Red
    Write-Host "Right-click PowerShell and choose 'Run as Administrator'." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not $SkipBuild) {
    Write-Host "[STEP] Installing dependencies and building frontend..." -ForegroundColor Yellow
    Set-Location $frontendPath
    npm install
    npm run build

    Write-Host "[STEP] Installing dependencies and building backend..." -ForegroundColor Yellow
    Set-Location $backendPath
    npm install
    npm run build
}

Write-Host "[STEP] Installing Node-Windows service..." -ForegroundColor Yellow
Set-Location $backendPath
npm run install-service

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Service setup complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "The backend will now run as a Windows service:" -ForegroundColor Cyan
Write-Host "  Name: Gym Management Backend" -ForegroundColor Gray
Write-Host "  Auto-start: Yes (with Windows)" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop/remove the service later:" -ForegroundColor Yellow
Write-Host "  1) Open PowerShell as Administrator" -ForegroundColor Gray
Write-Host "  2) cd $backendPath" -ForegroundColor Gray
Write-Host "  3) npm run uninstall-service" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to exit"


