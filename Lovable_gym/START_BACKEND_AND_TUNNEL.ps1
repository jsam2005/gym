# Auto-start Backend + Tunnel Script
# This script starts both backend and tunnel automatically

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Gym Management System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptDir "backend"

# Check if Node.js is installed
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    Write-Host "💡 Install Node.js: https://nodejs.org/" -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    exit 1
}

# Check if cloudflared is installed
$cloudflaredPath = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflaredPath) {
    Write-Host "⚠️  Cloudflare Tunnel not found" -ForegroundColor Yellow
    Write-Host "   Tunnel will not start. Install Cloudflare Tunnel first." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "✅ Starting Backend Server..." -ForegroundColor Green
Write-Host ""

# Start backend server in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🚀 Backend Server (Port 5001)' -ForegroundColor Cyan; Write-Host ''; npm run dev"

# Wait for backend to start
Start-Sleep -Seconds 8

# Check if backend is running
$port5001 = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
if (-not $port5001) {
    Write-Host "⚠️  Backend may not have started yet. Waiting..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

if ($cloudflaredPath) {
    Write-Host "✅ Starting Cloudflare Tunnel..." -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Copy the tunnel URL when it appears!" -ForegroundColor Yellow
    Write-Host "   Update VITE_API_URL in Vercel if URL changes.`n" -ForegroundColor Yellow
    
    # Start tunnel in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; Write-Host '🌐 Cloudflare Tunnel' -ForegroundColor Cyan; Write-Host ''; cloudflared tunnel --url http://localhost:5001"
} else {
    Write-Host "⚠️  Tunnel not started (cloudflared not found)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Startup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend: http://localhost:5001" -ForegroundColor Cyan
Write-Host "Tunnel: Check the tunnel window for URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "Both services are running in separate windows." -ForegroundColor Gray
Write-Host "Close those windows to stop the services.`n" -ForegroundColor Gray

# Keep this window open briefly, then minimize
Start-Sleep -Seconds 3



