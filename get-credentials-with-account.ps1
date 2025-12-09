# Get Cloudflare Tunnel Credentials using Account ID
# Account ID: 7c98cefdfa1c1cca20055525e4652a03
# Tunnel ID: 839ccaf6-e877-4810-896c-b8ddb0846eeb

$apiToken = "D5D-ziNONUzvvRbmTeQuvO51vnIo40zmslRDHpyJ"
$accountId = "7c98cefdfa1c1cca20055525e4652a03"
$tunnelId = "839ccaf6-e877-4810-896c-b8ddb0846eeb"
$configDir = "$env:USERPROFILE\.cloudflared"
$credentialsFile = "$configDir\$tunnelId.json"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Get Cloudflare Tunnel Credentials" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Account ID: $accountId" -ForegroundColor Gray
Write-Host "Tunnel ID: $tunnelId" -ForegroundColor Gray
Write-Host ""

# Ensure directory exists
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Force -Path $configDir | Out-Null
    Write-Host "Created directory: $configDir" -ForegroundColor Green
}

Write-Host "[1/2] Getting tunnel token from Cloudflare API..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $apiToken"
    "Content-Type" = "application/json"
}

try {
    # Get tunnel token
    $tokenUrl = "https://api.cloudflare.com/client/v4/accounts/$accountId/cfd_tunnel/$tunnelId/token"
    Write-Host "   Requesting: $tokenUrl" -ForegroundColor Gray
    
    $tokenResponse = Invoke-RestMethod -Uri $tokenUrl -Headers $headers -Method Get
    
    if ($tokenResponse.success -and $tokenResponse.result) {
        $tunnelSecret = $tokenResponse.result
        
        Write-Host "   Token retrieved successfully!" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "[2/2] Creating credentials file..." -ForegroundColor Yellow
        
        # Create credentials JSON
        $credentials = @{
            AccountTag = $accountId
            TunnelID = $tunnelId
            TunnelSecret = $tunnelSecret
        } | ConvertTo-Json -Depth 10
        
        # Save credentials file
        $credentials | Out-File -FilePath $credentialsFile -Encoding UTF8 -Force
        Write-Host "   Credentials saved to: $credentialsFile" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "Credentials Retrieved Successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Credentials file location:" -ForegroundColor Cyan
        Write-Host "  $credentialsFile" -ForegroundColor White
        Write-Host ""
        Write-Host "Next step: Test the tunnel" -ForegroundColor Cyan
        Write-Host "  cloudflared tunnel run gym-sql-tunnel" -ForegroundColor White
        Write-Host ""
        
    } else {
        Write-Host "   ERROR: Could not get tunnel token" -ForegroundColor Red
        Write-Host "   Response: $($tokenResponse | ConvertTo-Json -Depth 5)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   You may need to:" -ForegroundColor Yellow
        Write-Host "   1. Check if the API token has correct permissions" -ForegroundColor White
        Write-Host "   2. Or download credentials manually from Cloudflare dashboard" -ForegroundColor White
    }
} catch {
    Write-Host "   ERROR: Failed to get credentials" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "   Alternative: Download credentials from dashboard:" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://one.dash.cloudflare.com/" -ForegroundColor White
    Write-Host "   2. Networks → Connectors → Cloudflare Tunnels" -ForegroundColor White
    Write-Host "   3. Click on: gym-sql-tunnel" -ForegroundColor White
    Write-Host "   4. Look for 'Download credentials' or similar" -ForegroundColor White
    Write-Host "   5. Save as: $credentialsFile" -ForegroundColor White
}

Write-Host ""

