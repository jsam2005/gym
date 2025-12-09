# Download Cloudflare Tunnel Credentials
# Tunnel ID: 839ccaf6-e877-4810-896c-b8ddb0846eeb

$tunnelId = "839ccaf6-e877-4810-896c-b8ddb0846eeb"
$configDir = "$env:USERPROFILE\.cloudflared"
$credentialsFile = "$configDir\$tunnelId.json"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Download Cloudflare Tunnel Credentials" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tunnel ID: $tunnelId" -ForegroundColor Gray
Write-Host ""

Write-Host "To get your Account ID:" -ForegroundColor Yellow
Write-Host "1. Go to: https://dash.cloudflare.com/" -ForegroundColor White
Write-Host "2. If you have a domain, click on it" -ForegroundColor White
Write-Host "3. Scroll down on the right sidebar" -ForegroundColor White
Write-Host "4. Find 'Account ID' (it's a long string)" -ForegroundColor White
Write-Host ""
Write-Host "OR" -ForegroundColor Cyan
Write-Host "Go to: https://one.dash.cloudflare.com/" -ForegroundColor White
Write-Host "Click on your account name → The Account ID is shown there" -ForegroundColor White
Write-Host ""

$accountId = Read-Host "Enter your Account ID"

if ([string]::IsNullOrWhiteSpace($accountId)) {
    Write-Host "Account ID is required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Downloading credentials..." -ForegroundColor Yellow

# The credentials file format for Cloudflare Tunnel
# It should contain: AccountTag, TunnelID, TunnelSecret
# We'll create it based on the tunnel info

$credentials = @{
    AccountTag = $accountId
    TunnelID = $tunnelId
    TunnelSecret = ""  # This will be filled from the download link
} | ConvertTo-Json

Write-Host ""
Write-Host "IMPORTANT: You need to download the credentials file from Cloudflare:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Click the link that opens in a new tab" -ForegroundColor White
Write-Host "2. It should download a JSON file" -ForegroundColor White
Write-Host "3. Save it as: $credentialsFile" -ForegroundColor White
Write-Host ""
Write-Host "OR manually create the file with this content:" -ForegroundColor Cyan
Write-Host ""
Write-Host "{"
Write-Host "  `"AccountTag`": `"$accountId`","
Write-Host "  `"TunnelID`": `"$tunnelId`","
Write-Host "  `"TunnelSecret`": `"<get-from-cloudflare-dashboard>`""
Write-Host "}"
Write-Host ""

# Ensure directory exists
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Force -Path $configDir | Out-Null
    Write-Host "Created directory: $configDir" -ForegroundColor Green
}

# Check if file was downloaded
if (Test-Path $credentialsFile) {
    Write-Host "Credentials file found: $credentialsFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "Try running the tunnel:" -ForegroundColor Cyan
    Write-Host "cloudflared tunnel run gym-sql-tunnel" -ForegroundColor White
} else {
    Write-Host "Waiting for credentials file..." -ForegroundColor Yellow
    Write-Host "Please download it from the Cloudflare dashboard link" -ForegroundColor Yellow
}

Write-Host ""

