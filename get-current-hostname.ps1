# Get Current Tunnel Hostname
# This helps verify what hostname Vercel should use

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Current Tunnel Hostname Checker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if tunnel is running
$tunnelProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue

if (-not $tunnelProcess) {
    Write-Host "ERROR: Tunnel is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Start the tunnel first:" -ForegroundColor Yellow
    Write-Host "   .\start-quick-tunnel.ps1" -ForegroundColor White
    exit 1
}

Write-Host "SUCCESS: Tunnel is running (Process ID: $($tunnelProcess.Id))" -ForegroundColor Green
Write-Host ""

Write-Host "IMPORTANT: Quick tunnels generate NEW hostnames each time!" -ForegroundColor Yellow
Write-Host ""
Write-Host "To get your CURRENT hostname:" -ForegroundColor Cyan
Write-Host "1. Look at the tunnel output window" -ForegroundColor White
Write-Host "2. Find the line: 'Your quick Tunnel has been created! Visit it at:'" -ForegroundColor White
Write-Host "3. Copy the hostname (e.g., xxxxx.trycloudflare.com)" -ForegroundColor White
Write-Host ""
Write-Host "OR restart the tunnel to see the hostname:" -ForegroundColor Cyan
Write-Host "   .\start-quick-tunnel.ps1" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vercel Configuration:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Make sure Vercel has:" -ForegroundColor Yellow
Write-Host "   ETIME_SQL_SERVER=<your-current-hostname>" -ForegroundColor White
Write-Host ""
Write-Host "If the hostname changed, update Vercel!" -ForegroundColor Yellow
Write-Host ""

