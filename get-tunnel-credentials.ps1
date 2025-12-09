# Get Cloudflare Tunnel Credentials via API
# This script retrieves the tunnel credentials from Cloudflare

$apiToken = "JZ8V54UNaHLl52_x5LbdhNJgtj6Qdpvdpq15Viwy"
$tunnelId = "839ccaf6-e877-4810-896c-b8ddb0846eeb"
$configDir = "$env:USERPROFILE\.cloudflared"
$credentialsFile = "$configDir\$tunnelId.json"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Get Cloudflare Tunnel Credentials" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Getting Account ID..." -ForegroundColor Yellow

# First, we need to get the account ID
# Try to get it from any zone or use the API
$headers = @{
    "Authorization" = "Bearer $apiToken"
    "Content-Type" = "application/json"
}

try {
    # Get account ID from zones (if you have any zones)
    $zonesResponse = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones" -Headers $headers -Method Get -ErrorAction SilentlyContinue
    
    if ($zonesResponse.result -and $zonesResponse.result.Count -gt 0) {
        $accountId = $zonesResponse.result[0].account.id
        Write-Host "   Found Account ID: $accountId" -ForegroundColor Green
    } else {
        Write-Host "   No zones found. Trying alternative method..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Please get your Account ID manually:" -ForegroundColor Yellow
        Write-Host "   1. Go to: https://dash.cloudflare.com/" -ForegroundColor White
        Write-Host "   2. Select any domain (or create a free one)" -ForegroundColor White
        Write-Host "   3. Scroll down to find 'Account ID' in the right sidebar" -ForegroundColor White
        Write-Host ""
        $accountId = Read-Host "   Enter your Account ID"
    }
} catch {
    Write-Host "   Could not get Account ID automatically" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Please get your Account ID manually:" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://dash.cloudflare.com/" -ForegroundColor White
    Write-Host "   2. Select any domain (or create a free one)" -ForegroundColor White
    Write-Host "   3. Scroll down to find 'Account ID' in the right sidebar" -ForegroundColor White
    Write-Host ""
    $accountId = Read-Host "   Enter your Account ID"
}

Write-Host ""
Write-Host "[2/3] Getting tunnel credentials..." -ForegroundColor Yellow

try {
    $tunnelUrl = "https://api.cloudflare.com/client/v4/accounts/$accountId/cfd_tunnel/$tunnelId"
    $tunnelResponse = Invoke-RestMethod -Uri $tunnelUrl -Headers $headers -Method Get
    
    Write-Host "   Tunnel found: $($tunnelResponse.result.name)" -ForegroundColor Green
    
    # Get tunnel token
    $tokenUrl = "https://api.cloudflare.com/client/v4/accounts/$accountId/cfd_tunnel/$tunnelId/token"
    $tokenResponse = Invoke-RestMethod -Uri $tokenUrl -Headers $headers -Method Get
    
    if ($tokenResponse.result) {
        # Create credentials JSON
        $credentials = @{
            AccountTag = $accountId
            TunnelID = $tunnelId
            TunnelSecret = $tokenResponse.result
        } | ConvertTo-Json
        
        # Ensure directory exists
        if (-not (Test-Path $configDir)) {
            New-Item -ItemType Directory -Force -Path $configDir | Out-Null
        }
        
        # Save credentials file
        $credentials | Out-File -FilePath $credentialsFile -Encoding UTF8 -Force
        Write-Host "   Credentials saved to: $credentialsFile" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: Could not get tunnel token" -ForegroundColor Red
        Write-Host "   Response: $($tokenResponse | ConvertTo-Json)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ERROR: Failed to get credentials" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Alternative: The credentials might be created when you run:" -ForegroundColor Yellow
    Write-Host "   cloudflared tunnel login" -ForegroundColor White
    Write-Host "   Then: cloudflared tunnel create gym-sql-tunnel" -ForegroundColor White
}

Write-Host ""
Write-Host "[3/3] Verifying credentials file..." -ForegroundColor Yellow

if (Test-Path $credentialsFile) {
    Write-Host "   Credentials file exists: $credentialsFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Credentials Retrieved!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Try running the tunnel:" -ForegroundColor Cyan
    Write-Host "cloudflared tunnel run gym-sql-tunnel" -ForegroundColor White
} else {
    Write-Host "   Credentials file not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "   You may need to:" -ForegroundColor Yellow
    Write-Host "   1. Delete the tunnel and recreate it" -ForegroundColor White
    Write-Host "   2. Or use the service token method from Cloudflare dashboard" -ForegroundColor White
}

Write-Host ""

