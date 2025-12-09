# Check Vercel Configuration
# This script helps verify your Vercel setup

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vercel Configuration Checker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$vercelUrl = "https://gym-zeta-teal.vercel.app"

Write-Host "[1/3] Checking debug endpoint..." -ForegroundColor Yellow
Write-Host "   URL: $vercelUrl/api/debug" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$vercelUrl/api/debug" -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "   SUCCESS: Debug endpoint responded" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Environment Variables Status:" -ForegroundColor Cyan
    Write-Host "   ETIME_SQL_SERVER: $($data.env.ETIME_SQL_SERVER)" -ForegroundColor White
    Write-Host "   ETIME_SQL_DB: $($data.env.ETIME_SQL_DB)" -ForegroundColor White
    Write-Host "   ETIME_SQL_USER: $($data.env.ETIME_SQL_USER)" -ForegroundColor White
    Write-Host "   ETIME_SQL_PASSWORD: $($data.env.ETIME_SQL_PASSWORD)" -ForegroundColor White
    Write-Host "   SQL_DISABLED: $($data.env.SQL_DISABLED)" -ForegroundColor White
    Write-Host "   USE_API_ONLY: $($data.env.USE_API_ONLY)" -ForegroundColor White
    Write-Host ""
    
    if ($data.env.ETIME_SQL_SERVER -eq "not set") {
        Write-Host "   ERROR: ETIME_SQL_SERVER is not set in Vercel!" -ForegroundColor Red
        Write-Host "   TIP: Set it in Vercel Dashboard -> Settings -> Environment Variables" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "   ERROR: Could not reach debug endpoint" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Possible issues:" -ForegroundColor Yellow
    Write-Host "   1. Vercel deployment might be failing" -ForegroundColor White
    Write-Host "   2. API route might not be deployed" -ForegroundColor White
    Write-Host "   3. Check Vercel logs for errors" -ForegroundColor White
}

Write-Host ""
Write-Host "[2/3] Checking health endpoint..." -ForegroundColor Yellow
Write-Host "   URL: $vercelUrl/api/health" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$vercelUrl/api/health" -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "   SUCCESS: Health endpoint responded" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Database Status:" -ForegroundColor Cyan
    Write-Host "   Configured: $($data.database.configured)" -ForegroundColor White
    Write-Host "   Server: $($data.database.server)" -ForegroundColor White
    Write-Host "   Database: $($data.database.database)" -ForegroundColor White
    Write-Host "   Connection Status: $($data.database.connectionStatus)" -ForegroundColor White
    Write-Host ""
    
    if ($data.database.connectionStatus -like "*error*" -or $data.database.connectionStatus -eq "not connected") {
        Write-Host "   WARNING: Database connection failed!" -ForegroundColor Yellow
        Write-Host "   Possible causes:" -ForegroundColor Yellow
        Write-Host "   1. Tunnel is not running locally" -ForegroundColor White
        Write-Host "   2. SQL Server is not running" -ForegroundColor White
        Write-Host "   3. Hostname is incorrect in Vercel" -ForegroundColor White
        Write-Host "   4. Firewall blocking connection" -ForegroundColor White
    }
    
} catch {
    Write-Host "   ERROR: Could not reach health endpoint" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "[3/3] Checking tunnel status..." -ForegroundColor Yellow

$tunnelProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue

if ($tunnelProcess) {
    Write-Host "   SUCCESS: Tunnel process is running" -ForegroundColor Green
    Write-Host "   Process ID: $($tunnelProcess.Id)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   TIP: Make sure the tunnel shows 'Registered tunnel connection' in its output" -ForegroundColor Yellow
} else {
    Write-Host "   ERROR: Tunnel process is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Start the tunnel:" -ForegroundColor Yellow
    Write-Host "   C:\cloudflared\cloudflared.exe tunnel --url tcp://localhost:1433" -ForegroundColor White
    Write-Host ""
    Write-Host "   Or use:" -ForegroundColor Yellow
    Write-Host "   .\start-quick-tunnel.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Check Vercel logs:" -ForegroundColor Yellow
Write-Host "   Vercel Dashboard -> Deployments -> Latest -> Functions -> Logs" -ForegroundColor White
Write-Host ""
Write-Host "2. Verify environment variables in Vercel:" -ForegroundColor Yellow
Write-Host "   Vercel Dashboard -> Settings -> Environment Variables" -ForegroundColor White
Write-Host ""
Write-Host "3. Ensure tunnel is running:" -ForegroundColor Yellow
Write-Host "   .\start-quick-tunnel.ps1" -ForegroundColor White
Write-Host ""
Write-Host "4. Test database connection locally first" -ForegroundColor Yellow
Write-Host ""

