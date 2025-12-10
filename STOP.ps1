# Stop Script
# Stops all running servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Gym Management - Stop Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🛑 Stopping servers..." -ForegroundColor Yellow

# Kill Node processes on ports 5001 and 5173
$port5001 = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

$stopped = $false

if ($port5001) {
    $pid5001 = ($port5001 | Select-Object -First 1).OwningProcess
    if ($pid5001) {
        Stop-Process -Id $pid5001 -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Stopped backend server (port 5001)" -ForegroundColor Green
        $stopped = $true
    }
} else {
    Write-Host "   ℹ️  No server running on port 5001" -ForegroundColor Gray
}

if ($port5173) {
    $pid5173 = ($port5173 | Select-Object -First 1).OwningProcess
    if ($pid5173) {
        Stop-Process -Id $pid5173 -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Stopped frontend server (port 5173)" -ForegroundColor Green
        $stopped = $true
    }
} else {
    Write-Host "   ℹ️  No server running on port 5173" -ForegroundColor Gray
}

if (-not $stopped) {
    Write-Host ""
    Write-Host "ℹ️  No servers were running" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "✅ All servers stopped" -ForegroundColor Green
}

Write-Host ""

