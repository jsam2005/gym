# Cloudflare Tunnel Configuration Setup Script
# This script creates the config.yml file for your tunnel

$tunnelId = "839ccaf6-e877-4810-896c-b8ddb0846eeb"
$username = $env:USERNAME
$configDir = "$env:USERPROFILE\.cloudflared"
$configFile = "$configDir\config.yml"
$credentialsFile = "$configDir\$tunnelId.json"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cloudflare Tunnel Configuration Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create .cloudflared directory if it doesn't exist
Write-Host "[1/3] Creating config directory..." -ForegroundColor Yellow
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Force -Path $configDir | Out-Null
    Write-Host "   Created: $configDir" -ForegroundColor Green
} else {
    Write-Host "   Directory exists: $configDir" -ForegroundColor Gray
}

# Check if credentials file exists
Write-Host "[2/3] Checking credentials file..." -ForegroundColor Yellow

# Check for credentials file (could be named with tunnel ID or account ID)
$possibleCredFiles = @(
    $credentialsFile,
    "$configDir\$tunnelId.json",
    "$configDir\*.json"
)

$foundCredFile = $null
foreach ($file in $possibleCredFiles) {
    if (Test-Path $file) {
        $foundCredFile = $file
        break
    }
}

# Also check for any JSON files in the directory
if (-not $foundCredFile) {
    $jsonFiles = Get-ChildItem -Path $configDir -Filter "*.json" -ErrorAction SilentlyContinue
    if ($jsonFiles) {
        $foundCredFile = $jsonFiles[0].FullName
        Write-Host "   Found credentials file: $foundCredFile" -ForegroundColor Green
        $credentialsFile = $foundCredFile
    }
}

if ($foundCredFile) {
    Write-Host "   Credentials file found: $foundCredFile" -ForegroundColor Green
} else {
    Write-Host "   WARNING: Credentials file not found!" -ForegroundColor Yellow
    Write-Host "   Expected location: $credentialsFile" -ForegroundColor Gray
    Write-Host "   The credentials file will be created when you run the tunnel for the first time" -ForegroundColor Gray
    Write-Host "   Continuing with config creation..." -ForegroundColor Yellow
}

# Create config.yml
Write-Host "[3/3] Creating config.yml..." -ForegroundColor Yellow

$configContent = @"
tunnel: $tunnelId
credentials-file: $credentialsFile

ingress:
  # Expose SQL Server (port 1433) via TCP
  - hostname: sql-tunnel.yourdomain.com
    service: tcp://localhost:1433
  
  # Catch-all rule (must be last)
  - service: http_status:404
"@

# Check if config file already exists
if (Test-Path $configFile) {
    Write-Host "   Config file already exists: $configFile" -ForegroundColor Yellow
    $overwrite = Read-Host "   Overwrite? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "   Skipping config file creation" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Current config file location: $configFile" -ForegroundColor Cyan
        exit 0
    }
}

# Write config file
try {
    $configContent | Out-File -FilePath $configFile -Encoding UTF8 -NoNewline
    Write-Host "   Config file created: $configFile" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Failed to create config file" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Config file location: $configFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Update the hostname in config.yml:" -ForegroundColor Yellow
Write-Host "  - If you have a domain: Change 'sql-tunnel.yourdomain.com' to your domain" -ForegroundColor White
Write-Host "  - If you don't have a domain: Remove the hostname line (Cloudflare will assign one)" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit config file: notepad $configFile" -ForegroundColor White
Write-Host "2. Update hostname (or remove it if no domain)" -ForegroundColor White
Write-Host "3. Test tunnel: cloudflared tunnel run gym-sql-tunnel" -ForegroundColor White
Write-Host "4. Setup as Windows Service (optional): See VERCEL_DEPLOYMENT.md" -ForegroundColor White
Write-Host ""

