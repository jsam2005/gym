# Setup Gym Backend as a Windows Service (NSSM)
# This script configures a production-safe service using:
#   node dist/server.js

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Windows Service (Backend)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Administrator privileges are required." -ForegroundColor Red
    Write-Host "Right-click PowerShell and choose 'Run as administrator'." -ForegroundColor Yellow
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir "backend"
$logsDir = Join-Path $scriptDir "logs"
$serviceName = "Gym Management Backend"

if (-not (Test-Path $backendDir)) {
    Write-Host "Backend folder not found: $backendDir" -ForegroundColor Red
    exit 1
}

# Find node.exe
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "Node.js not found in PATH. Install Node.js first." -ForegroundColor Red
    exit 1
}
$nodePath = $nodeCmd.Source

# Find NSSM
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
    Write-Host "NSSM not found." -ForegroundColor Red
    Write-Host "Install NSSM and ensure nssm.exe is in PATH or one of these paths:" -ForegroundColor Yellow
    Write-Host "  C:\tools\nssm\win64\nssm.exe" -ForegroundColor Gray
    Write-Host "  C:\nssm\win64\nssm.exe" -ForegroundColor Gray
    Write-Host "  C:\Program Files\nssm\win64\nssm.exe" -ForegroundColor Gray
    exit 1
}

Write-Host "Using node: $nodePath" -ForegroundColor Gray
Write-Host "Using nssm: $nssmPath" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

$stdoutLog = Join-Path $logsDir "backend-out.log"
$stderrLog = Join-Path $logsDir "backend-err.log"

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Push-Location $backendDir
npm install
Write-Host "Building backend..." -ForegroundColor Yellow
npm run build
Pop-Location

$distServer = Join-Path $backendDir "dist\server.js"
if (-not (Test-Path $distServer)) {
    Write-Host "Build output not found: $distServer" -ForegroundColor Red
    exit 1
}

# Remove existing service if present
$existing = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Existing service found. Stopping/removing..." -ForegroundColor Yellow
    & $nssmPath stop $serviceName | Out-Null
    Start-Sleep -Seconds 1
    & $nssmPath remove $serviceName confirm | Out-Null
    Start-Sleep -Seconds 1
}

Write-Host "Creating service..." -ForegroundColor Yellow
& $nssmPath install $serviceName $nodePath "dist/server.js" | Out-Null
& $nssmPath set $serviceName AppDirectory $backendDir | Out-Null
& $nssmPath set $serviceName DisplayName $serviceName | Out-Null
& $nssmPath set $serviceName Description "Gym backend API service (production mode)" | Out-Null
& $nssmPath set $serviceName Start SERVICE_AUTO_START | Out-Null
& $nssmPath set $serviceName ObjectName LocalSystem | Out-Null
& $nssmPath set $serviceName AppStdout $stdoutLog | Out-Null
& $nssmPath set $serviceName AppStderr $stderrLog | Out-Null
& $nssmPath set $serviceName AppRotateFiles 1 | Out-Null
& $nssmPath set $serviceName AppRotateOnline 1 | Out-Null
& $nssmPath set $serviceName AppRotateBytes 10485760 | Out-Null

Write-Host "Starting service..." -ForegroundColor Yellow
& $nssmPath start $serviceName | Out-Null
Start-Sleep -Seconds 2

$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq "Running") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Service setup completed successfully" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Service: $serviceName" -ForegroundColor Cyan
    Write-Host "Status:  Running" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test URLs:" -ForegroundColor Cyan
    Write-Host "  http://localhost:5001/api/health" -ForegroundColor Yellow
    Write-Host "  http://localhost:5001" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Logs:" -ForegroundColor Cyan
    Write-Host "  $stdoutLog" -ForegroundColor Gray
    Write-Host "  $stderrLog" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

Write-Host "Service failed to start." -ForegroundColor Red
Write-Host "Check logs:" -ForegroundColor Yellow
Write-Host "  $stderrLog" -ForegroundColor Gray
exit 1
