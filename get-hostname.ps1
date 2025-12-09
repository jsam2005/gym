# Get Cloudflare Tunnel Hostname
# This script helps you get the hostname for Vercel configuration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Get Cloudflare Tunnel Hostname" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "You have 2 options to get a hostname:" -ForegroundColor Yellow
Write-Host ""

Write-Host "Option 1: Quick Tunnel (Temporary - Changes Each Time)" -ForegroundColor Cyan
Write-Host "  This gives you a hostname immediately for testing" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 2: Named Tunnel with Dashboard Configuration (Permanent)" -ForegroundColor Cyan
Write-Host "  This gives you a permanent hostname" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Choose option (1 or 2)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Quick Tunnel Method" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Starting quick tunnel..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "IMPORTANT: Look for the hostname in the output!" -ForegroundColor Green
    Write-Host "It will look like: https://abc123.trycloudflare.com" -ForegroundColor Green
    Write-Host ""
    Write-Host "Copy the hostname (without https://) for Vercel" -ForegroundColor Yellow
    Write-Host "Example: abc123.trycloudflare.com" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Press Ctrl+C to stop after you copy the hostname" -ForegroundColor Yellow
    Write-Host ""
    
    # Run quick tunnel
    C:\cloudflared\cloudflared.exe tunnel --url tcp://localhost:1433
    
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Named Tunnel Method (Permanent)" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "To get a permanent hostname:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Go to: https://one.dash.cloudflare.com/" -ForegroundColor White
    Write-Host "2. Navigate to: Networks → Connectors → Cloudflare Tunnels" -ForegroundColor White
    Write-Host "3. Click on: gym-sql-tunnel" -ForegroundColor White
    Write-Host "4. Click 'Configure' tab" -ForegroundColor White
    Write-Host "5. Under 'Public Hostname', click 'Add a public hostname'" -ForegroundColor White
    Write-Host "6. Configure:" -ForegroundColor White
    Write-Host "   - Subdomain: sql-tunnel" -ForegroundColor Gray
    Write-Host "   - Domain: (select a domain or use Cloudflare's free option)" -ForegroundColor Gray
    Write-Host "   - Service Type: TCP" -ForegroundColor Gray
    Write-Host "   - Service: localhost:1433" -ForegroundColor Gray
    Write-Host "7. Click 'Save hostname'" -ForegroundColor White
    Write-Host "8. Copy the hostname shown" -ForegroundColor White
    Write-Host ""
    Write-Host "Note: If you don't have a domain, you'll need to add one to Cloudflare first." -ForegroundColor Yellow
    Write-Host ""
    
} else {
    Write-Host "Invalid choice. Please run the script again and choose 1 or 2." -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "After Getting Hostname" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Use the hostname in Vercel:" -ForegroundColor Yellow
Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Select project: gym-zeta-teal" -ForegroundColor White
Write-Host "3. Settings → Environment Variables" -ForegroundColor White
Write-Host "4. Set: ETIME_SQL_SERVER = <your-hostname>" -ForegroundColor White
Write-Host "5. Redeploy" -ForegroundColor White
Write-Host ""

