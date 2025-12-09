# Fix Cloudflare Tunnel Authentication
# This script helps resolve certificate issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cloudflare Tunnel Authentication Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$configDir = "$env:USERPROFILE\.cloudflared"

Write-Host "[1/3] Checking current authentication status..." -ForegroundColor Yellow

# Check for certificate files
$certFiles = Get-ChildItem -Path $configDir -Filter "*.pem" -ErrorAction SilentlyContinue
$jsonFiles = Get-ChildItem -Path $configDir -Filter "*.json" -ErrorAction SilentlyContinue

if ($certFiles) {
    Write-Host "   Found certificate files:" -ForegroundColor Green
    foreach ($file in $certFiles) {
        Write-Host "     - $($file.Name)" -ForegroundColor Gray
    }
} else {
    Write-Host "   No certificate files found" -ForegroundColor Yellow
}

if ($jsonFiles) {
    Write-Host "   Found JSON files:" -ForegroundColor Green
    foreach ($file in $jsonFiles) {
        Write-Host "     - $($file.Name)" -ForegroundColor Gray
    }
} else {
    Write-Host "   No JSON files found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[2/3] Re-authenticating with Cloudflare..." -ForegroundColor Yellow
Write-Host "   This will open your browser to authorize the tunnel" -ForegroundColor Gray
Write-Host ""

# Run tunnel login
Write-Host "Running: cloudflared tunnel login" -ForegroundColor Cyan
cloudflared tunnel login

Write-Host ""
Write-Host "[3/3] Verifying authentication..." -ForegroundColor Yellow

# Check again after login
$certFilesAfter = Get-ChildItem -Path $configDir -Filter "*.pem" -ErrorAction SilentlyContinue
$jsonFilesAfter = Get-ChildItem -Path $configDir -Filter "*.json" -ErrorAction SilentlyContinue

if ($certFilesAfter) {
    Write-Host "   Certificate files found:" -ForegroundColor Green
    foreach ($file in $certFilesAfter) {
        Write-Host "     - $($file.FullName)" -ForegroundColor Gray
    }
} else {
    Write-Host "   WARNING: Still no certificate files found" -ForegroundColor Red
    Write-Host "   You may need to manually download the certificate" -ForegroundColor Yellow
}

if ($jsonFilesAfter) {
    Write-Host "   JSON files found:" -ForegroundColor Green
    foreach ($file in $jsonFilesAfter) {
        Write-Host "     - $($file.FullName)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. If authentication succeeded, try running the tunnel again:" -ForegroundColor Cyan
Write-Host "   cloudflared tunnel run gym-sql-tunnel" -ForegroundColor White
Write-Host ""
Write-Host "2. If you still get errors, check the config file:" -ForegroundColor Cyan
Write-Host "   notepad $env:USERPROFILE\.cloudflared\config.yml" -ForegroundColor White
Write-Host ""

