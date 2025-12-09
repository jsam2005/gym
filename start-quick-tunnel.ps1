# Start Quick Tunnel for SQL Server
# This is the simplest and most reliable method

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Quick Tunnel for SQL Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$cloudflaredPath = "C:\cloudflared\cloudflared.exe"

# Check if cloudflared exists
if (-not (Test-Path $cloudflaredPath)) {
    Write-Host "ERROR: cloudflared not found at $cloudflaredPath" -ForegroundColor Red
    Write-Host "TIP: Please run install-cloudflared.ps1 first" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting quick tunnel..." -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Look for the hostname in the output below!" -ForegroundColor Yellow
Write-Host "Format: https://xxxxx.trycloudflare.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy the hostname and use it in Vercel:" -ForegroundColor Cyan
Write-Host "  ETIME_SQL_SERVER=<hostname>" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start quick tunnel
& $cloudflaredPath tunnel --url tcp://localhost:1433

