# Simple Local Startup Script
# Just runs everything locally - no cloud, no tunnels

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Gym Management - Local Setup" -ForegroundColor Cyan
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

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green
Write-Host ""

# Check and install dependencies
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow

# Root dependencies
if (Test-Path "package.json") {
    if (-not (Test-Path "node_modules")) {
        Write-Host "   Installing root dependencies..." -ForegroundColor Gray
        npm install
    }
}

# Backend dependencies
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "   Installing backend dependencies..." -ForegroundColor Gray
    Set-Location backend
    npm install
    Set-Location ..
}

# Frontend dependencies
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "   Installing frontend dependencies..." -ForegroundColor Gray
    Set-Location frontend
    npm install
    Set-Location ..
}

Write-Host ""
Write-Host "🚀 Starting servers..." -ForegroundColor Yellow
Write-Host ""

# Start backend server
Write-Host "   Backend Server (port 5001)..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"

Start-Sleep -Seconds 3

# Start frontend server
Write-Host "   Frontend Server (port 5173)..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Servers Starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Access your website at:" -ForegroundColor Cyan
Write-Host "   http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Backend API at:" -ForegroundColor Cyan
Write-Host "   http://localhost:5001/api" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Keep both terminal windows open" -ForegroundColor Yellow
Write-Host "   Press Ctrl+C in each window to stop" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter to exit this window..." -ForegroundColor Gray
Read-Host

