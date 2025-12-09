# Download Cloudflare Origin Certificate
# This script helps download the origin certificate from Cloudflare

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cloudflare Origin Certificate Download" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$configDir = "$env:USERPROFILE\.cloudflared"
$certFile = "$configDir\cert.pem"

Write-Host "The origin certificate needs to be downloaded from Cloudflare dashboard." -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Download from Dashboard (Recommended)" -ForegroundColor Cyan
Write-Host "1. Go to: https://one.dash.cloudflare.com/" -ForegroundColor White
Write-Host "2. Navigate to: Networks → Connectors → Cloudflare Tunnels" -ForegroundColor White
Write-Host "3. Click on your tunnel: gym-sql-tunnel" -ForegroundColor White
Write-Host "4. Go to 'Configure' tab" -ForegroundColor White
Write-Host "5. Download the origin certificate (cert.pem)" -ForegroundColor White
Write-Host "6. Save it to: $certFile" -ForegroundColor White
Write-Host ""

Write-Host "Option 2: Use Account ID Method" -ForegroundColor Cyan
Write-Host "We can configure the tunnel to use your Account ID instead." -ForegroundColor White
Write-Host ""

$choice = Read-Host "Have you downloaded the certificate? (y/n)"

if ($choice -eq "y") {
    if (Test-Path $certFile) {
        Write-Host "Certificate found: $certFile" -ForegroundColor Green
        Write-Host "Updating config file..." -ForegroundColor Yellow
        
        # Update config file
        $configFile = "$configDir\config.yml"
        if (Test-Path $configFile) {
            $configContent = Get-Content $configFile -Raw
            if ($configContent -notlike "*originCert*") {
                $configContent = $configContent -replace "tunnel:", "originCert: $certFile`ntunnel:"
                $configContent | Set-Content $configFile
                Write-Host "Config file updated with certificate path" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "Certificate not found at: $certFile" -ForegroundColor Red
        Write-Host "Please download it from the dashboard first." -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Alternative: Configure tunnel without certificate (using Account ID)" -ForegroundColor Cyan
    Write-Host "We'll update the config to use your Account ID method." -ForegroundColor White
    Write-Host ""
    Write-Host "To get your Account ID:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://dash.cloudflare.com/" -ForegroundColor White
    Write-Host "2. Select any domain (or create a free one)" -ForegroundColor White
    Write-Host "3. Scroll down to find 'Account ID' in the right sidebar" -ForegroundColor White
    Write-Host ""
}

