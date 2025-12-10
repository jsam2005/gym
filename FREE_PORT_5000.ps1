# Free Port 5001 Script
# Finds and stops any process using port 5001

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Free Port 5001" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$port5001 = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue

if (-not $port5001) {
    Write-Host "✅ Port 5001 is already free" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can start your backend now:" -ForegroundColor Cyan
    Write-Host "   cd backend" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 0
}

$processId = ($port5001 | Select-Object -First 1).OwningProcess
$process = Get-Process -Id $processId -ErrorAction SilentlyContinue

if ($process) {
    Write-Host "Found process using port 5001:" -ForegroundColor Yellow
    Write-Host "   PID: $processId" -ForegroundColor White
    Write-Host "   Name: $($process.ProcessName)" -ForegroundColor White
    Write-Host "   Path: $($process.Path)" -ForegroundColor Gray
    Write-Host ""
    
    $confirm = Read-Host "Stop this process? (y/n)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Write-Host ""
        Write-Host "Stopping process..." -ForegroundColor Yellow
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        
        # Verify it's stopped
        $check = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
        if (-not $check) {
            Write-Host "✅ Port 5001 is now free" -ForegroundColor Green
            Write-Host ""
            Write-Host "You can start your backend now:" -ForegroundColor Cyan
            Write-Host "   cd backend" -ForegroundColor Yellow
            Write-Host "   npm run dev" -ForegroundColor Yellow
        } else {
            Write-Host "⚠️  Process may still be running" -ForegroundColor Yellow
            Write-Host "   Try closing it manually" -ForegroundColor Gray
        }
    } else {
        Write-Host "Process not stopped" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Process not found (may have already stopped)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Try starting your backend:" -ForegroundColor Cyan
    Write-Host "   cd backend" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"

