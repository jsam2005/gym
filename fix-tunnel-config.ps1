# Fix Cloudflare Tunnel Configuration
# This script updates the config to work without certificate file

$tunnelId = "839ccaf6-e877-4810-896c-b8ddb0846eeb"
$configDir = "$env:USERPROFILE\.cloudflared"
$configFile = "$configDir\config.yml"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Cloudflare Tunnel Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ensure config directory exists
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Force -Path $configDir | Out-Null
    Write-Host "Created config directory: $configDir" -ForegroundColor Green
}

# Check for credentials file
$jsonFiles = Get-ChildItem -Path $configDir -Filter "*.json" -ErrorAction SilentlyContinue
$credentialsFile = $null

if ($jsonFiles) {
    $credentialsFile = $jsonFiles[0].FullName
    Write-Host "Found credentials file: $($jsonFiles[0].Name)" -ForegroundColor Green
} else {
    # Try to find it by tunnel ID
    $possibleCredFile = "$configDir\$tunnelId.json"
    if (Test-Path $possibleCredFile) {
        $credentialsFile = $possibleCredFile
        Write-Host "Found credentials file: $tunnelId.json" -ForegroundColor Green
    } else {
        Write-Host "WARNING: No credentials file found!" -ForegroundColor Red
        Write-Host "Expected: $possibleCredFile" -ForegroundColor Yellow
        Write-Host "You may need to run: cloudflared tunnel login" -ForegroundColor Yellow
    }
}

# Create/update config file
Write-Host ""
Write-Host "Creating/updating config file..." -ForegroundColor Yellow

# For TCP tunnels without domain, we don't need hostname
$configContent = @"
tunnel: $tunnelId
credentials-file: $credentialsFile

ingress:
  # Expose SQL Server (port 1433) via TCP
  - service: tcp://localhost:1433
  # Catch-all rule (must be last)
  - service: http_status:404
"@

try {
    $configContent | Out-File -FilePath $configFile -Encoding UTF8 -Force
    Write-Host "Config file created/updated: $configFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "Config content:" -ForegroundColor Cyan
    Write-Host $configContent -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Failed to create config file" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Configuration Updated!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Note: For named tunnels, the credentials file should contain" -ForegroundColor Yellow
Write-Host "all necessary authentication. The origin certificate is usually" -ForegroundColor Yellow
Write-Host "not required for named tunnels." -ForegroundColor Yellow
Write-Host ""
Write-Host "Try running the tunnel again:" -ForegroundColor Cyan
Write-Host "cloudflared tunnel run gym-sql-tunnel" -ForegroundColor White
Write-Host ""

