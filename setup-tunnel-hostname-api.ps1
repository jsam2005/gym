# Setup Cloudflare Tunnel Hostname via API
# This script configures a public hostname for your TCP tunnel

$apiToken = "D5D-ziNONUzvvRbmTeQuvO51vnIo40zmslRDHpyJ"
$accountId = "7c98cefdfa1c1cca20055525e4652a03"
$tunnelId = "839ccaf6-e877-4810-896c-b8ddb0846eeb"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Tunnel Hostname via API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $apiToken"
    "Content-Type" = "application/json"
}

# For TCP tunnels, Cloudflare requires a domain
# Let's check if user has domains or suggest alternatives

Write-Host "[1/2] Checking account setup..." -ForegroundColor Yellow

try {
    # Get account info
    $accountUrl = "https://api.cloudflare.com/client/v4/accounts/$accountId"
    $accountInfo = Invoke-RestMethod -Uri $accountUrl -Headers $headers -Method Get
    
    Write-Host "   Account: $($accountInfo.result.name)" -ForegroundColor Green
    
    # Check for zones/domains
    $zonesUrl = "https://api.cloudflare.com/client/v4/zones"
    $zonesResponse = Invoke-RestMethod -Uri $zonesUrl -Headers $headers -Method Get
    
    if ($zonesResponse.success -and $zonesResponse.result.Count -gt 0) {
        Write-Host "   Found $($zonesResponse.result.Count) domain(s)" -ForegroundColor Green
        
        # Use first domain
        $domain = $zonesResponse.result[0]
        $subdomain = "sql-tunnel"
        $hostname = "$subdomain.$($domain.name)"
        
        Write-Host ""
        Write-Host "[2/2] Configuring public hostname..." -ForegroundColor Yellow
        Write-Host "   Hostname: $hostname" -ForegroundColor Gray
        Write-Host "   Service: tcp://localhost:1433" -ForegroundColor Gray
        
        # Configure public hostname via API
        $configUrl = "https://api.cloudflare.com/client/v4/accounts/$accountId/cfd_tunnel/$tunnelId/configurations"
        
        # Get current config first
        try {
            $currentConfig = Invoke-RestMethod -Uri $configUrl -Headers $headers -Method Get
            
            # Update config with public hostname
            $configBody = @{
                config = @{
                    ingress = @(
                        @{
                            hostname = $hostname
                            service = "tcp://localhost:1433"
                        },
                        @{
                            service = "http_status:404"
                        }
                    )
                }
            } | ConvertTo-Json -Depth 10
            
            $updateResponse = Invoke-RestMethod -Uri $configUrl -Headers $headers -Method Put -Body $configBody
            
            if ($updateResponse.success) {
                Write-Host "   ✅ Hostname configured successfully!" -ForegroundColor Green
                Write-Host ""
                Write-Host "========================================" -ForegroundColor Green
                Write-Host "Hostname: $hostname" -ForegroundColor Green
                Write-Host "========================================" -ForegroundColor Green
                Write-Host ""
                Write-Host "Use this hostname in Vercel:" -ForegroundColor Cyan
                Write-Host "ETIME_SQL_SERVER=$hostname" -ForegroundColor White
                Write-Host ""
            } else {
                Write-Host "   ⚠️  Configuration may need manual setup" -ForegroundColor Yellow
                Write-Host "   Response: $($updateResponse | ConvertTo-Json)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "   ⚠️  Could not update via API. Manual configuration needed." -ForegroundColor Yellow
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
            Write-Host "   Please configure in dashboard:" -ForegroundColor Cyan
            Write-Host "   1. Go to: https://one.dash.cloudflare.com/" -ForegroundColor White
            Write-Host "   2. Networks → Connectors → gym-sql-tunnel" -ForegroundColor White
            Write-Host "   3. Configure → Add Public Hostname" -ForegroundColor White
            Write-Host "   4. Subdomain: $subdomain" -ForegroundColor White
            Write-Host "   5. Domain: $($domain.name)" -ForegroundColor White
            Write-Host "   6. Service: tcp://localhost:1433" -ForegroundColor White
        }
        
    } else {
        Write-Host "   No domains found in your account" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   For TCP tunnels, you need a domain. Options:" -ForegroundColor Cyan
        Write-Host "   1. Add a domain to Cloudflare (free)" -ForegroundColor White
        Write-Host "   2. Use quick tunnel for testing (temporary)" -ForegroundColor White
        Write-Host ""
        Write-Host "   Quick tunnel command:" -ForegroundColor Cyan
        Write-Host "   cloudflared tunnel --url tcp://localhost:1433" -ForegroundColor White
        Write-Host ""
        Write-Host "   This will give you a temporary hostname like:" -ForegroundColor Gray
        Write-Host "   tcp://abc123.trycloudflare.com:1433" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Falling back to quick tunnel method..." -ForegroundColor Yellow
    Write-Host "   Run: .\quick-tunnel-test.ps1" -ForegroundColor Cyan
}

Write-Host ""

