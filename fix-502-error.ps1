# Fix 502 Bad Gateway Error
# Restarts both local API server and Cloudflare tunnel

Write-Host "`n=== Fixing 502 Bad Gateway Error ===`n" -ForegroundColor Yellow

# Step 1: Stop all existing cloudflared processes
Write-Host "1. Stopping existing Cloudflare tunnels..." -ForegroundColor Cyan
$tunnels = Get-Process -Name cloudflared -ErrorAction SilentlyContinue
if ($tunnels) {
    $tunnels | Stop-Process -Force
    Write-Host "   ✅ Stopped $($tunnels.Count) tunnel process(es)" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ℹ️  No existing tunnels found" -ForegroundColor Gray
}

# Step 2: Check if local API server is running
Write-Host "`n2. Checking local API server..." -ForegroundColor Cyan
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "   ✅ Local API server is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Local API server is NOT running" -ForegroundColor Red
    Write-Host "   Starting local API server..." -ForegroundColor Yellow
    
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $apiPath = Join-Path $scriptDir "local-api-server.js"
    
    if (Test-Path $apiPath) {
        Start-Process -FilePath "node" `
            -ArgumentList $apiPath `
            -WindowStyle Minimized
        Write-Host "   ✅ Started local API server" -ForegroundColor Green
        Write-Host "   ⏳ Waiting 5 seconds for server to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    } else {
        Write-Host "   ❌ local-api-server.js not found at: $apiPath" -ForegroundColor Red
        Write-Host "   💡 Start it manually: node local-api-server.js" -ForegroundColor Yellow
        exit 1
    }
}

# Step 3: Verify local API server is accessible
Write-Host "`n3. Verifying local API server..." -ForegroundColor Cyan
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ Local API server is accessible" -ForegroundColor Green
    Write-Host "   Response: $($health.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Local API server is still not accessible" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 Check if port 3001 is available" -ForegroundColor Yellow
    exit 1
}

# Step 4: Start Cloudflare tunnel
Write-Host "`n4. Starting Cloudflare tunnel..." -ForegroundColor Cyan
Write-Host "   ⚠️  This will open a new window showing the tunnel URL" -ForegroundColor Yellow
Write-Host "   Copy the URL from the output (format: https://xxxxx.trycloudflare.com)`n" -ForegroundColor Yellow

Start-Process -FilePath "cloudflared" `
    -ArgumentList "tunnel", "--url", "http://localhost:3001" `
    -WindowStyle Normal

Write-Host "   ✅ Cloudflare tunnel started" -ForegroundColor Green
Write-Host "`n=== Next Steps ===`n" -ForegroundColor Cyan
Write-Host "1. Copy the tunnel URL from the cloudflared window" -ForegroundColor White
Write-Host "2. Test it: https://your-url.trycloudflare.com/health" -ForegroundColor White
Write-Host "3. Update Vercel: LOCAL_API_URL = your tunnel URL" -ForegroundColor White
Write-Host "4. Keep both windows running!`n" -ForegroundColor Yellow

