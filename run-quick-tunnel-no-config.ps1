# Run Quick Tunnel Without Config File
# This bypasses the config file to avoid conflicts

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Quick Tunnel - Get Hostname" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting quick tunnel (bypassing config file)..." -ForegroundColor Yellow
Write-Host ""

# Temporarily rename config file to bypass it
$configFile = "$env:USERPROFILE\.cloudflared\config.yml"
$configBackup = "$env:USERPROFILE\.cloudflared\config.yml.backup"

if (Test-Path $configFile) {
    Write-Host "Temporarily backing up config file..." -ForegroundColor Gray
    Copy-Item $configFile $configBackup -Force
    Remove-Item $configFile -Force
    Write-Host "Config file backed up and removed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting quick tunnel..." -ForegroundColor Yellow
Write-Host "IMPORTANT: Look for the hostname in the output!" -ForegroundColor Green
Write-Host "It will look like: https://abc123.trycloudflare.com" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
Write-Host ""

try {
    # Run quick tunnel
    C:\cloudflared\cloudflared.exe tunnel --url tcp://localhost:1433
} finally {
    # Restore config file
    if (Test-Path $configBackup) {
        Write-Host ""
        Write-Host "Restoring config file..." -ForegroundColor Gray
        Copy-Item $configBackup $configFile -Force
        Remove-Item $configBackup -Force
        Write-Host "Config file restored" -ForegroundColor Green
    }
}

