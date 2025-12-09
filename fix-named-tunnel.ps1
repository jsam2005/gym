# Fix Named Tunnel - Add Origin Certificate
# This script fixes the named tunnel configuration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Named Tunnel Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$configDir = "$env:USERPROFILE\.cloudflared"
$configFile = "$configDir\config.yml"
$certFile = "$configDir\cert.pem"

# Check if config exists
if (-not (Test-Path $configFile)) {
    Write-Host "ERROR: Config file not found: $configFile" -ForegroundColor Red
    Write-Host "TIP: Run setup-tunnel-config.ps1 first" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/3] Checking for origin certificate..." -ForegroundColor Yellow

# Check if cert.pem exists
if (Test-Path $certFile) {
    Write-Host "   SUCCESS: Origin certificate found: $certFile" -ForegroundColor Green
    $hasCert = $true
} else {
    Write-Host "   WARNING: Origin certificate not found: $certFile" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   You need to authenticate to generate the certificate." -ForegroundColor Cyan
    Write-Host ""
    $authenticate = Read-Host "   Run 'cloudflared tunnel login' now? (y/n)"
    
    if ($authenticate -eq "y") {
        Write-Host ""
        Write-Host "   Opening browser for authentication..." -ForegroundColor Cyan
        Write-Host "   Follow the prompts in your browser." -ForegroundColor Gray
        Write-Host ""
        
        C:\cloudflared\cloudflared.exe tunnel login
        
        # Check again after login
        if (Test-Path $certFile) {
            Write-Host ""
            Write-Host "   SUCCESS: Certificate created!" -ForegroundColor Green
            $hasCert = $true
        } else {
            Write-Host ""
            Write-Host "   WARNING: Certificate still not found after login" -ForegroundColor Yellow
            $hasCert = $false
        }
    } else {
        Write-Host ""
        Write-Host "   Skipping authentication. Named tunnel may not work." -ForegroundColor Yellow
        $hasCert = $false
    }
}

Write-Host ""
Write-Host "[2/3] Reading current config..." -ForegroundColor Yellow

# Read current config
$configContent = Get-Content $configFile -Raw

# Check if originCert is already in config
if ($configContent -match "originCert") {
    Write-Host "   Config already has originCert specified" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current config:" -ForegroundColor Cyan
    Write-Host $configContent -ForegroundColor Gray
    Write-Host ""
    Write-Host "If tunnel still fails, try running: cloudflared tunnel login" -ForegroundColor Yellow
    exit 0
}

Write-Host "[3/3] Updating config.yml..." -ForegroundColor Yellow

# Add originCert if certificate exists
if ($hasCert) {
    # Add originCert line after tunnel line
    $updatedConfig = $configContent -replace "(tunnel:.*)", "`$1`noriginCert: $certFile"
    
    # Backup original config
    $backupFile = "$configFile.backup"
    Copy-Item $configFile $backupFile -Force
    Write-Host "   Backup created: $backupFile" -ForegroundColor Gray
    
    # Write updated config
    $updatedConfig | Out-File -FilePath $configFile -Encoding UTF8 -NoNewline
    Write-Host "   SUCCESS: Config updated with originCert path" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "   WARNING: Cannot update config without certificate" -ForegroundColor Yellow
    Write-Host "   Recommendation: Use quick tunnel for now:" -ForegroundColor Cyan
    Write-Host "   C:\cloudflared\cloudflared.exe tunnel --url tcp://localhost:1433" -ForegroundColor White
    Write-Host ""
    Write-Host "   Or authenticate first, then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Configuration Updated!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Try running the tunnel again:" -ForegroundColor Cyan
Write-Host "   cloudflared tunnel run gym-sql-tunnel" -ForegroundColor White
Write-Host ""
Write-Host "Or use the clean runner:" -ForegroundColor Cyan
Write-Host "   .\run-tunnel-clean.ps1" -ForegroundColor White
Write-Host ""

