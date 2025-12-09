# Create Cloudflare Tunnel Config File Manually
# Username: HP

$username = "HP"
$tunnelId = "839ccaf6-e877-4810-896c-b8ddb0846eeb"
$configDir = "$env:USERPROFILE\.cloudflared"
$configFile = "$configDir\config.yml"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating Cloudflare Tunnel Config" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ensure directory exists
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Force -Path $configDir | Out-Null
    Write-Host "Created directory: $configDir" -ForegroundColor Green
}

# Check for credentials file
Write-Host "Checking for credentials file..." -ForegroundColor Yellow
$jsonFiles = Get-ChildItem -Path $configDir -Filter "*.json" -ErrorAction SilentlyContinue

$credentialsFile = "C:\Users\$username\.cloudflared\$tunnelId.json"

if ($jsonFiles) {
    $credentialsFile = $jsonFiles[0].FullName
    Write-Host "Found credentials file: $($jsonFiles[0].Name)" -ForegroundColor Green
} else {
    Write-Host "No JSON file found, using default path: $credentialsFile" -ForegroundColor Yellow
    Write-Host "If tunnel fails, update the credentials-file path in config.yml" -ForegroundColor Yellow
}

# Create config content
$configContent = @"
tunnel: $tunnelId
credentials-file: $credentialsFile

ingress:
  # Expose SQL Server (port 1433) via TCP
  - service: tcp://localhost:1433
  # Catch-all rule (must be last)
  - service: http_status:404
"@

# Write config file
Write-Host ""
Write-Host "Creating config file..." -ForegroundColor Yellow
try {
    $configContent | Out-File -FilePath $configFile -Encoding UTF8 -Force
    Write-Host "Config file created: $configFile" -ForegroundColor Green
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
Write-Host "Config File Created!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Try running the tunnel" -ForegroundColor Cyan
Write-Host "cloudflared tunnel run gym-sql-tunnel" -ForegroundColor White
Write-Host ""

