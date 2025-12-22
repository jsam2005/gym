# Docker Stop Script for Gym Management System
# This script stops and removes Docker containers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stopping Docker Containers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🛑 Stopping containers..." -ForegroundColor Yellow
docker-compose down

Write-Host ""
Write-Host "✅ Containers stopped and removed" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"

