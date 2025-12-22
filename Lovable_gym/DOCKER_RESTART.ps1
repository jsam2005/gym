# Docker Restart Script for Gym Management System
# This script stops, rebuilds, and starts Docker containers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Restarting Docker Containers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

Write-Host ""
Write-Host "🔨 Rebuilding and starting containers..." -ForegroundColor Yellow
Write-Host ""

docker-compose up --build

Write-Host ""
Write-Host "✅ Containers restarted!" -ForegroundColor Green
Write-Host ""

