# Generate Vercel Environment Variables Configuration
# Based on your local .env file

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vercel Environment Variables Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Read local .env file if it exists
$envFile = "backend\.env"
if (-not (Test-Path $envFile)) {
    $envFile = "backend\env.sample"
    Write-Host "Using env.sample as reference" -ForegroundColor Yellow
}

Write-Host "Reading database configuration from: $envFile" -ForegroundColor Yellow
Write-Host ""

# Get tunnel hostname (ask user)
$tunnelHostname = Read-Host "Enter your Cloudflare Tunnel hostname (e.g., eds-welcome-floating-prizes.trycloudflare.com)"

if ([string]::IsNullOrWhiteSpace($tunnelHostname)) {
    Write-Host "Using default from earlier: eds-welcome-floating-prizes.trycloudflare.com" -ForegroundColor Yellow
    $tunnelHostname = "eds-welcome-floating-prizes.trycloudflare.com"
}

# Generate JWT secret
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Vercel Environment Variables" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Copy these to Vercel Dashboard → Settings → Environment Variables:" -ForegroundColor Cyan
Write-Host ""

$envVars = @"
ETIME_SQL_SERVER=$tunnelHostname
ETIME_SQL_DB=etimetracklite1
ETIME_SQL_USER=essl
ETIME_SQL_PASSWORD=essl
ETIME_SQL_INSTANCE=SQLEXPRESS
SQL_DISABLED=false
USE_API_ONLY=false
ETIMETRACK_ENABLED=true
VITE_API_URL=https://gym-zeta-teal.vercel.app
FRONTEND_URL=https://gym-zeta-teal.vercel.app
NODE_ENV=production
JWT_SECRET=$jwtSecret
PORT=5000
"@

Write-Host $envVars -ForegroundColor White
Write-Host ""

# Save to file
$outputFile = "vercel-env-variables.txt"
$envVars | Out-File -FilePath $outputFile -Encoding UTF8
Write-Host "Saved to: $outputFile" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Select project: gym-zeta-teal" -ForegroundColor White
Write-Host "3. Settings → Environment Variables" -ForegroundColor White
Write-Host "4. Add each variable from above" -ForegroundColor White
Write-Host "5. Redeploy (or wait for auto-deploy)" -ForegroundColor White
Write-Host ""
Write-Host "After setting variables, test:" -ForegroundColor Yellow
Write-Host "  https://gym-zeta-teal.vercel.app/api/debug" -ForegroundColor Cyan
Write-Host "  https://gym-zeta-teal.vercel.app/api/health" -ForegroundColor Cyan
Write-Host ""

