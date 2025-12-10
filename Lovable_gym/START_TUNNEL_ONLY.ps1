# Start Tunnel Only (Backend Already Running)
# Use this if your backend is already running on port 5000

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Start Tunnel for Vercel Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running on port 5001
$port5001 = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
if (-not $port5001) {
    Write-Host "⚠️  No service found on port 5001" -ForegroundColor Yellow
    Write-Host "   Make sure your backend is running first!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Start backend with:" -ForegroundColor Cyan
    Write-Host "   cd backend" -ForegroundColor Gray
    Write-Host "   npm run dev" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Backend detected on port 5001" -ForegroundColor Green
Write-Host ""

# Check if cloudflared is installed
$cloudflaredPath = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflaredPath) {
    Write-Host "⚠️  Cloudflare Tunnel not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Install options:" -ForegroundColor Cyan
    Write-Host "   1. Download: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Gray
    Write-Host "   2. Or: winget install --id Cloudflare.cloudflared" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Alternative: Use ngrok" -ForegroundColor Cyan
    Write-Host "   ngrok http 5000" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "🌐 Starting Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT - Copy this URL:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   When tunnel starts, copy the URL (e.g., https://xxxxx.trycloudflare.com)" -ForegroundColor White
Write-Host ""
Write-Host "   Then in Vercel:" -ForegroundColor Cyan
Write-Host "   1. Go to vercel.com → Your Project" -ForegroundColor Gray
Write-Host "   2. Settings → Environment Variables" -ForegroundColor Gray
Write-Host "   3. Set VITE_API_URL = https://xxxxx.trycloudflare.com/api" -ForegroundColor Gray
Write-Host "   4. Redeploy frontend" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop tunnel" -ForegroundColor Gray
Write-Host ""

    # Start tunnel
    cloudflared tunnel --url http://localhost:5001

