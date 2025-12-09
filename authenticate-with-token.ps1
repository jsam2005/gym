# Cloudflare Tunnel Authentication with API Token
# This script sets up authentication using API token

$apiToken = "JZ8V54UNaHLl52_x5LbdhNJgtj6Qdpvdpq15Viwy"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cloudflare Tunnel API Token Authentication" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Setting API token as environment variable..." -ForegroundColor Yellow
$env:CLOUDFLARE_API_TOKEN = $apiToken
Write-Host "   API token set for current session" -ForegroundColor Green

Write-Host ""
Write-Host "[2/3] Authenticating tunnel..." -ForegroundColor Yellow
Write-Host "   Running: cloudflared tunnel login" -ForegroundColor Gray
Write-Host ""

# Run tunnel login
cloudflared tunnel login

Write-Host ""
Write-Host "[3/3] Verifying authentication..." -ForegroundColor Yellow

$configDir = "$env:USERPROFILE\.cloudflared"

# Check for certificate files
$certFiles = Get-ChildItem -Path $configDir -Filter "*.pem" -ErrorAction SilentlyContinue
$jsonFiles = Get-ChildItem -Path $configDir -Filter "*.json" -ErrorAction SilentlyContinue

if ($certFiles) {
    Write-Host "   Certificate files found:" -ForegroundColor Green
    foreach ($file in $certFiles) {
        Write-Host "     - $($file.Name)" -ForegroundColor Gray
    }
} else {
    Write-Host "   WARNING: No certificate files found" -ForegroundColor Yellow
}

if ($jsonFiles) {
    Write-Host "   JSON files found:" -ForegroundColor Green
    foreach ($file in $jsonFiles) {
        Write-Host "     - $($file.FullName)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Authentication Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run tunnel: cloudflared tunnel run gym-sql-tunnel" -ForegroundColor White
Write-Host "2. If successful, setup config file: .\setup-tunnel-config.ps1" -ForegroundColor White
Write-Host ""

