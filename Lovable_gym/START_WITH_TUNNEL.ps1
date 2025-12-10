# Start Backend + Tunnel for Vercel Frontend
# This exposes your local backend so Vercel frontend can connect

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Start Backend + Tunnel for Vercel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    Write-Host "💡 Install Node.js: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if cloudflared is installed
$cloudflaredPath = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflaredPath) {
    Write-Host "⚠️  Cloudflare Tunnel not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  1. Install Cloudflare Tunnel:" -ForegroundColor White
    Write-Host "     Download: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Gray
    Write-Host "     Or: winget install --id Cloudflare.cloudflared" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Use ngrok instead:" -ForegroundColor White
    Write-Host "     Download: https://ngrok.com/download" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Use localhost.run:" -ForegroundColor White
    Write-Host "     ssh -R 80:localhost:5000 ssh.localhost.run" -ForegroundColor Gray
    Write-Host ""
    $choice = Read-Host "Continue without tunnel? (y/n)"
    if ($choice -ne "y") {
        exit 1
    }
}

Write-Host "✅ Starting backend server..." -ForegroundColor Green
Write-Host ""

# Start backend server
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev"

Start-Sleep -Seconds 5

Write-Host "✅ Backend starting on http://localhost:5001" -ForegroundColor Green
Write-Host ""

if ($cloudflaredPath) {
    Write-Host "🌐 Starting Cloudflare Tunnel..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚠️  IMPORTANT:" -ForegroundColor Yellow
    Write-Host "   1. Copy the tunnel URL (e.g., https://xxxxx.trycloudflare.com)" -ForegroundColor White
    Write-Host "   2. Go to Vercel Dashboard → Settings → Environment Variables" -ForegroundColor White
    Write-Host "   3. Set VITE_API_URL = https://xxxxx.trycloudflare.com/api" -ForegroundColor White
    Write-Host "   4. Redeploy your Vercel frontend" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Ctrl+C to stop tunnel and backend" -ForegroundColor Gray
    Write-Host ""
    
    # Start tunnel
    cloudflared tunnel --url http://localhost:5001
} else {
    Write-Host "ℹ️  Tunnel not started. Use one of these options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Cloudflare Tunnel:" -ForegroundColor Cyan
    Write-Host "   cloudflared tunnel --url http://localhost:5001" -ForegroundColor Gray
    Write-Host ""
    Write-Host "ngrok:" -ForegroundColor Cyan
    Write-Host "   ngrok http 5001" -ForegroundColor Gray
    Write-Host ""
    Write-Host "localhost.run:" -ForegroundColor Cyan
    Write-Host "   ssh -R 80:localhost:5001 ssh.localhost.run" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Backend is running. Start tunnel in another terminal." -ForegroundColor Green
    Write-Host ""
    Write-Host "Press Enter to exit" -ForegroundColor Gray
    Read-Host
}

