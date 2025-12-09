# Start Local API Server
# This server connects to your local DB and middleware

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Local API Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install express cors mssql dotenv axios
}

# Check if .env exists
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  WARNING: backend\.env not found" -ForegroundColor Yellow
    Write-Host "Creating sample .env file..." -ForegroundColor Yellow
    
    $envContent = @"
ETIME_SQL_SERVER=JSAM\SQLEXPRESS
ETIME_SQL_DB=etimetracklite1
ETIME_SQL_USER=essl
ETIME_SQL_PASSWORD=essl
ETIME_SQL_INSTANCE=SQLEXPRESS
LOCAL_API_PORT=3001
ESSL_API_URL=http://localhost:8080
"@
    
    New-Item -ItemType Directory -Path "backend" -Force | Out-Null
    $envContent | Out-File -FilePath "backend\.env" -Encoding utf8
    Write-Host "✅ Created backend\.env - please update with your actual values" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting server on port 3001..." -ForegroundColor Yellow
Write-Host ""
Write-Host "After server starts, expose it via HTTP tunnel:" -ForegroundColor Cyan
Write-Host "  - localhost.run: .\expose-local-api.ps1" -ForegroundColor White
Write-Host "  - ngrok: ngrok http 3001" -ForegroundColor White
Write-Host "  - Cloudflare: cloudflared tunnel --url http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
node local-api-server.js

