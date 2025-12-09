# Run Tunnel and Extract Hostname
# This script runs the tunnel and captures the hostname

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Run Cloudflare Tunnel - Get Hostname" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will run your named tunnel and show connection info." -ForegroundColor Yellow
Write-Host ""

# Check if tunnel is already running
$existingProcess = Get-Process cloudflared -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "⚠️  Cloudflare tunnel is already running (PID: $($existingProcess.Id))" -ForegroundColor Yellow
    Write-Host ""
    $stop = Read-Host "Stop existing tunnel and start new one? (y/n)"
    if ($stop -eq "y") {
        Stop-Process -Id $existingProcess.Id -Force
        Write-Host "Stopped existing tunnel" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } else {
        Write-Host "Using existing tunnel. Check its output for hostname." -ForegroundColor Gray
        exit 0
    }
}

Write-Host "Starting tunnel: gym-sql-tunnel" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Look for hostname/connection info in the output below!" -ForegroundColor Green
Write-Host "The tunnel will show connection details." -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
Write-Host ""

# Run the tunnel
cloudflared tunnel run gym-sql-tunnel

