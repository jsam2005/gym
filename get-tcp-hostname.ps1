# Get TCP Hostname - Quick Tunnel Method
# This creates a quick TCP tunnel and shows the hostname

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Get TCP Tunnel Hostname" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Creating quick TCP tunnel..." -ForegroundColor Yellow
Write-Host ""

# Temporarily move config file to avoid conflicts
$configFile = "$env:USERPROFILE\.cloudflared\config.yml"
$configBackup = "$env:USERPROFILE\.cloudflared\config.yml.quick-tunnel-backup"

if (Test-Path $configFile) {
    Write-Host "Temporarily backing up config file..." -ForegroundColor Gray
    Move-Item $configFile $configBackup -Force
}

Write-Host "Starting quick tunnel for TCP (port 1433)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Look for the hostname in the output!" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop after you copy the hostname" -ForegroundColor Yellow
Write-Host ""

try {
    # Run quick tunnel - this will show the hostname
    C:\cloudflared\cloudflared.exe tunnel --url tcp://localhost:1433
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Restore config file
    if (Test-Path $configBackup) {
        Write-Host ""
        Write-Host "Restoring config file..." -ForegroundColor Gray
        Move-Item $configBackup $configFile -Force
    }
}

