# Quick ngrok Setup Script
# Much simpler than Cloudflare Tunnel!

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ngrok Setup - Simple Database Tunnel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is installed
$ngrokPath = "C:\ngrok\ngrok.exe"
if (-not (Test-Path $ngrokPath)) {
    Write-Host "ngrok not found. Installing..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Download manually:" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://ngrok.com/download" -ForegroundColor White
    Write-Host "   2. Download Windows version" -ForegroundColor White
    Write-Host "   3. Extract to C:\ngrok" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Use Chocolatey:" -ForegroundColor Cyan
    Write-Host "   choco install ngrok" -ForegroundColor White
    Write-Host ""
    Write-Host "After installing, run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "SUCCESS: ngrok found!" -ForegroundColor Green
Write-Host ""

# Check if authenticated
Write-Host "Checking ngrok authentication..." -ForegroundColor Yellow
$configPath = "$env:USERPROFILE\.ngrok2\ngrok.yml"
if (-not (Test-Path $configPath)) {
    Write-Host ""
    Write-Host "ngrok needs authentication:" -ForegroundColor Yellow
    Write-Host "   1. Sign up at: https://ngrok.com/signup (free)" -ForegroundColor White
    Write-Host "   2. Get your authtoken from dashboard" -ForegroundColor White
    Write-Host "   3. Run: ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor White
    Write-Host ""
    $token = Read-Host "Enter your ngrok authtoken (or press Enter to skip)"
    if ($token) {
        & $ngrokPath config add-authtoken $token
        Write-Host "Authentication successful!" -ForegroundColor Green
    } else {
        Write-Host "Skipping authentication. You'll need to do this manually." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting ngrok tunnel..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will create a tunnel to your SQL Server (port 1433)" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Look for the forwarding URL in the output!" -ForegroundColor Cyan
Write-Host "Format: tcp://0.tcp.ngrok.io:12345" -ForegroundColor White
Write-Host ""
Write-Host "Copy the hostname and port, then use in Vercel:" -ForegroundColor Cyan
Write-Host "   ETIME_SQL_SERVER=0.tcp.ngrok.io" -ForegroundColor White
Write-Host "   ETIME_SQL_PORT=12345" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start ngrok tunnel
& $ngrokPath tcp 1433

