# Expose Local API Server via localhost.run (HTTP)
# Much easier than TCP tunneling!

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Expose Local API via HTTP Tunnel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if local API is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 2 -UseBasicParsing
    Write-Host "✅ Local API server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Local API server is not running!" -ForegroundColor Red
    Write-Host "Start it first: .\start-local-api.ps1" -ForegroundColor Yellow
    exit 1
}

# Check SSH key
$sshKey = "$env:USERPROFILE\.ssh\localhost_run"
if (-not (Test-Path $sshKey)) {
    Write-Host "Generating SSH key..." -ForegroundColor Yellow
    ssh-keygen -t rsa -b 4096 -f $sshKey -N '""'
}

Write-Host ""
Write-Host "Starting HTTP tunnel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Look for the hostname in the output!" -ForegroundColor Cyan
Write-Host "Format: 'connect to http://XXXXX.localhost.run'" -ForegroundColor White
Write-Host ""
Write-Host "Copy the hostname, then update Vercel:" -ForegroundColor Cyan
Write-Host "   LOCAL_API_URL=http://XXXXX.localhost.run" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start tunnel
$systemSsh = "C:\WINDOWS\System32\OpenSSH\ssh.exe"
& $systemSsh -i $sshKey -R 80:localhost:3001 ssh.localhost.run

