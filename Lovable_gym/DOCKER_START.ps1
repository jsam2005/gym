# Docker Startup Script for Gym Management System
# This script builds and starts the Docker containers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Gym Management - Docker Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed and running
Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not found"
    }
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found or not running" -ForegroundColor Red
    Write-Host "💡 Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host "💡 Make sure Docker Desktop is running before proceeding" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Docker daemon is running
Write-Host "🔍 Checking Docker daemon..." -ForegroundColor Yellow
try {
    docker ps 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker daemon not running"
    }
    Write-Host "✅ Docker daemon is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker daemon is not running" -ForegroundColor Red
    Write-Host "💡 Please start Docker Desktop and wait for it to fully start" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if .env file exists
Write-Host "🔍 Checking backend configuration..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  backend\.env file not found" -ForegroundColor Yellow
    Write-Host "💡 Creating sample .env file..." -ForegroundColor Gray
    
    $envContent = @"
# SQL Server Configuration
ETIME_SQL_SERVER=JSAM\SQLEXPRESS
ETIME_SQL_DB=etimetracklite1
ETIME_SQL_USER=essl
ETIME_SQL_PASSWORD=essl

# Server Settings
SQL_DISABLED=false
USE_API_ONLY=false
PORT=5001
FRONTEND_URL=http://localhost:5173
"@
    
    $envContent | Out-File -FilePath "backend\.env" -Encoding UTF8
    Write-Host "✅ Created backend\.env file" -ForegroundColor Green
    Write-Host "⚠️  Please update backend\.env with your actual database settings!" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "✅ backend\.env file found" -ForegroundColor Green
}

Write-Host ""
Write-Host "🐳 Building and starting Docker containers..." -ForegroundColor Yellow
Write-Host ""

# Build and start containers
docker-compose up --build

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Docker containers started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Access your website at:" -ForegroundColor Cyan
Write-Host "   http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Backend API at:" -ForegroundColor Cyan
Write-Host "   http://localhost:5001/api" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 To stop containers, press Ctrl+C or run:" -ForegroundColor Gray
Write-Host "   docker-compose down" -ForegroundColor Gray
Write-Host ""

