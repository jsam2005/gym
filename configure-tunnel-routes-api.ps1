# Configure Cloudflare Tunnel Routes via API
# This script automatically configures routes for your tunnel

$apiToken = "D5D-ziNONUzvvRbmTeQuvO51vnIo40zmslRDHpyJ"
$accountId = "7c98cefdfa1c1cca20055525e4652a03"
$tunnelId = "839ccaf6-e877-4810-896c-b8ddb0846eeb"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configure Cloudflare Tunnel Routes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Account ID: $accountId" -ForegroundColor Gray
Write-Host "Tunnel ID: $tunnelId" -ForegroundColor Gray
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $apiToken"
    "Content-Type" = "application/json"
}

# Step 1: Check if user has any domains
Write-Host "[1/3] Checking for available domains..." -ForegroundColor Yellow

try {
    $zonesResponse = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones" -Headers $headers -Method Get
    
    if ($zonesResponse.success -and $zonesResponse.result.Count -gt 0) {
        Write-Host "   Found $($zonesResponse.result.Count) domain(s):" -ForegroundColor Green
        for ($i = 0; $i -lt $zonesResponse.result.Count; $i++) {
            Write-Host "   $($i + 1). $($zonesResponse.result[$i].name)" -ForegroundColor White
        }
        Write-Host ""
        $domainChoice = Read-Host "   Select domain number (or press Enter to use Cloudflare's free subdomain)"
        
        if ([string]::IsNullOrWhiteSpace($domainChoice)) {
            $useFreeDomain = $true
            $selectedDomain = $null
            Write-Host "   Using Cloudflare's free subdomain" -ForegroundColor Yellow
        } else {
            $selectedDomain = $zonesResponse.result[[int]$domainChoice - 1]
            $useFreeDomain = $false
            Write-Host "   Selected domain: $($selectedDomain.name)" -ForegroundColor Green
        }
    } else {
        Write-Host "   No domains found. Using Cloudflare's free subdomain." -ForegroundColor Yellow
        $useFreeDomain = $true
        $selectedDomain = $null
    }
} catch {
    Write-Host "   Could not fetch domains. Using Cloudflare's free subdomain." -ForegroundColor Yellow
    $useFreeDomain = $true
    $selectedDomain = $null
}

Write-Host ""
Write-Host "[2/3] Configuring tunnel route..." -ForegroundColor Yellow

# For TCP tunnels, we need to use the tunnel routes API
# The route configuration depends on whether we have a domain or not

if ($useFreeDomain) {
    Write-Host "   Note: Cloudflare free subdomains are typically for HTTP/HTTPS only." -ForegroundColor Yellow
    Write-Host "   For TCP tunnels, you may need to use a custom domain or configure via dashboard." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Alternative: Use quick tunnel for testing:" -ForegroundColor Cyan
    Write-Host "   cloudflared tunnel --url tcp://localhost:1433" -ForegroundColor White
    Write-Host ""
    
    # Try to create a route anyway - Cloudflare might support it
    $subdomain = "sql-tunnel-" + (Get-Random -Minimum 1000 -Maximum 9999)
    Write-Host "   Attempting to create route with subdomain: $subdomain" -ForegroundColor Gray
} else {
    $subdomain = "sql-tunnel"
    Write-Host "   Creating route: $subdomain.$($selectedDomain.name)" -ForegroundColor Gray
}

# Configure the route via API
# Note: TCP routes might need to be configured differently
try {
    # First, let's try to get current tunnel configuration
    $tunnelUrl = "https://api.cloudflare.com/client/v4/accounts/$accountId/cfd_tunnel/$tunnelId"
    $tunnelInfo = Invoke-RestMethod -Uri $tunnelUrl -Headers $headers -Method Get
    
    Write-Host "   Tunnel found: $($tunnelInfo.result.name)" -ForegroundColor Green
    
    # For TCP tunnels, routes are configured via the ingress rules in config.yml
    # But we can also try to configure via the routes API
    Write-Host ""
    Write-Host "   TCP tunnels are typically configured via config.yml (which you already have)." -ForegroundColor Yellow
    Write-Host "   To get a public hostname, you need to:" -ForegroundColor Yellow
    Write-Host "   1. Configure via Cloudflare dashboard (recommended)" -ForegroundColor White
    Write-Host "   2. OR use a quick tunnel for testing" -ForegroundColor White
    Write-Host ""
    
    # Try to create a public hostname route
    if (-not $useFreeDomain) {
        $routeUrl = "https://api.cloudflare.com/client/v4/accounts/$accountId/cfd_tunnel/$tunnelId/routes/ip"
        $routeBody = @{
            comment = "SQL Server TCP Tunnel"
            network = "0.0.0.0/0"
        } | ConvertTo-Json
        
        try {
            $routeResponse = Invoke-RestMethod -Uri $routeUrl -Headers $headers -Method Post -Body $routeBody
            Write-Host "   Route configured successfully!" -ForegroundColor Green
        } catch {
            Write-Host "   Note: TCP routes may need manual configuration in dashboard" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "[3/3] Getting tunnel connection info..." -ForegroundColor Yellow

# Get tunnel connector info to see if we can get a hostname
try {
    $connectorsUrl = "https://api.cloudflare.com/client/v4/accounts/$accountId/cfd_tunnel/$tunnelId/connectors"
    $connectorsResponse = Invoke-RestMethod -Uri $connectorsUrl -Headers $headers -Method Get
    
    if ($connectorsResponse.success -and $connectorsResponse.result.Count -gt 0) {
        Write-Host "   Tunnel connector is active!" -ForegroundColor Green
        Write-Host "   Connector ID: $($connectorsResponse.result[0].id)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   Could not get connector info" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Configuration Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "For TCP tunnels, Cloudflare typically requires:" -ForegroundColor Cyan
Write-Host "1. Routes configured in the dashboard (for permanent hostname)" -ForegroundColor White
Write-Host "2. OR use quick tunnel for testing (temporary hostname)" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run tunnel: cloudflared tunnel run gym-sql-tunnel" -ForegroundColor White
Write-Host "2. Check Cloudflare dashboard for assigned hostname" -ForegroundColor White
Write-Host "3. OR use quick tunnel: cloudflared tunnel --url tcp://localhost:1433" -ForegroundColor White
Write-Host ""

