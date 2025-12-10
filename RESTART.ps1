# Restart Script
# Stops existing servers and starts fresh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Gym Management - Restart" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "🛑 Stopping existing servers..." -ForegroundColor Yellow

# Kill Node processes on ports 5001 and 5173
$port5001 = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($port5001) {
    $pid5001 = ($port5001 | Select-Object -First 1).OwningProcess
    if ($pid5001) {
        Stop-Process -Id $pid5001 -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Stopped process on port 5001" -ForegroundColor Green
    }
}

if ($port5173) {
    $pid5173 = ($port5173 | Select-Object -First 1).OwningProcess
    if ($pid5173) {
        Stop-Process -Id $pid5173 -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Stopped process on port 5173" -ForegroundColor Green
    }
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "🚀 Starting servers..." -ForegroundColor Yellow
Write-Host ""

# Start fresh servers
& "$scriptDir\START_LOCAL.ps1"

