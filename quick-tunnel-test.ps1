# Quick Tunnel Test - Get Temporary Hostname
# This creates a quick tunnel for testing purposes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Quick Tunnel Test - Get Hostname" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will create a temporary tunnel and show you the hostname." -ForegroundColor Yellow
Write-Host "Note: This is a QUICK tunnel (temporary) - hostname changes each time." -ForegroundColor Yellow
Write-Host ""
Write-Host "For permanent hostname, configure routes in Cloudflare dashboard." -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Continue? (y/n)"

if ($choice -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Host "Starting quick tunnel..." -ForegroundColor Yellow
Write-Host "This will expose SQL Server on port 1433" -ForegroundColor Gray
Write-Host ""
Write-Host "IMPORTANT: Copy the hostname shown below!" -ForegroundColor Green
Write-Host "You'll need it for Vercel environment variables." -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
Write-Host ""

# Run quick tunnel
cloudflared tunnel --url tcp://localhost:1433

