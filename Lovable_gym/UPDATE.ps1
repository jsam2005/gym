# Update and Restart Script
# Pulls latest code, installs dependencies, and restarts the application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Gym Management - Update & Restart" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptDir "backend"
$frontendPath = Join-Path $scriptDir "frontend"

# Check if Git is available
$gitPath = Get-Command git -ErrorAction SilentlyContinue
if ($gitPath) {
    Write-Host "📥 Pulling latest code from Git..." -ForegroundColor Yellow
    Set-Location $scriptDir
    git pull
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Git pull failed or no changes" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Code updated" -ForegroundColor Green
    }
} else {
    Write-Host "ℹ️  Git not found - skipping code pull" -ForegroundColor Gray
    Write-Host "   Manually update your code files" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📦 Updating dependencies..." -ForegroundColor Yellow

# Update root dependencies
Write-Host "   Root dependencies..." -ForegroundColor Gray
Set-Location $scriptDir
if (Test-Path "package.json") {
    npm install
}

# Update backend dependencies
Write-Host "   Backend dependencies..." -ForegroundColor Gray
Set-Location $backendPath
if (Test-Path "package.json") {
    npm install
}

# Update frontend dependencies
Write-Host "   Frontend dependencies..." -ForegroundColor Gray
Set-Location $frontendPath
if (Test-Path "package.json") {
    npm install
}

Write-Host ""
Write-Host "🔨 Rebuilding..." -ForegroundColor Yellow

# Rebuild backend
Write-Host "   Backend..." -ForegroundColor Gray
Set-Location $backendPath
npm run build

# Rebuild frontend
Write-Host "   Frontend..." -ForegroundColor Gray
Set-Location $frontendPath
npm run build

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Update Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Stop running servers (if any)" -ForegroundColor White
Write-Host "   2. Run: .\START_LOCAL.ps1" -ForegroundColor Yellow
Write-Host "   3. Or run: .\RESTART.ps1" -ForegroundColor Yellow
Write-Host ""











