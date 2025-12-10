# Quick script to get tunnel URL from log files

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$tunnelLog = Join-Path $scriptDir "tunnel.log"
$tunnelErrorLog = Join-Path $scriptDir "tunnel-error.log"

Write-Host "`n=== Cloudflare Tunnel URL Finder ===`n" -ForegroundColor Cyan

# Check if tunnel is running
$tunnelProcess = Get-Process -Name cloudflared -ErrorAction SilentlyContinue
if (-not $tunnelProcess) {
    Write-Host "❌ Cloudflare Tunnel is not running" -ForegroundColor Red
    Write-Host "💡 Start it with: .\start-production.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Cloudflare Tunnel is running (PID: $($tunnelProcess.Id))`n" -ForegroundColor Green

# Try to extract URL from log files
if (Test-Path $tunnelLog) {
    Write-Host "Checking tunnel.log..." -ForegroundColor Yellow
    $logContent = Get-Content $tunnelLog -Raw -ErrorAction SilentlyContinue
    if ($logContent) {
        # Look for trycloudflare.com URL
        $urlMatch = [regex]::Match($logContent, 'https://[a-z0-9-]+\.trycloudflare\.com')
        if ($urlMatch.Success) {
            Write-Host "`n✅ Found Tunnel URL:" -ForegroundColor Green
            Write-Host "   $($urlMatch.Value)" -ForegroundColor Cyan
            Write-Host "`nCopy this URL and add it to Vercel environment variables:" -ForegroundColor Yellow
            Write-Host "   LOCAL_API_URL=$($urlMatch.Value)" -ForegroundColor White
            exit 0
        }
    }
}

if (Test-Path $tunnelErrorLog) {
    Write-Host "Checking tunnel-error.log..." -ForegroundColor Yellow
    $errorContent = Get-Content $tunnelErrorLog -Raw -ErrorAction SilentlyContinue
    if ($errorContent) {
        $urlMatch = [regex]::Match($errorContent, 'https://[a-z0-9-]+\.trycloudflare\.com')
        if ($urlMatch.Success) {
            Write-Host "`n✅ Found Tunnel URL:" -ForegroundColor Green
            Write-Host "   $($urlMatch.Value)" -ForegroundColor Cyan
            Write-Host "`nCopy this URL and add it to Vercel environment variables:" -ForegroundColor Yellow
            Write-Host "   LOCAL_API_URL=$($urlMatch.Value)" -ForegroundColor White
            exit 0
        }
    }
}

Write-Host "`n⚠️  Could not find tunnel URL in log files" -ForegroundColor Yellow
Write-Host "`nThe URL is displayed in the terminal where you started the tunnel." -ForegroundColor White
Write-Host "Look for output like:" -ForegroundColor White
Write-Host "   +--------------------------------------------------------------------------------------------+" -ForegroundColor Gray
Write-Host "   |  Your quick Tunnel has been created! Visit it at:                                           |" -ForegroundColor Gray
Write-Host "   |  https://xxxxx.trycloudflare.com                                                            |" -ForegroundColor Cyan
Write-Host "   +--------------------------------------------------------------------------------------------+`n" -ForegroundColor Gray

Write-Host "Alternative: Restart tunnel to see URL:" -ForegroundColor Yellow
Write-Host "   1. Stop current tunnel (Ctrl+C)" -ForegroundColor White
Write-Host "   2. Run: cloudflared tunnel --url http://localhost:3001" -ForegroundColor White
Write-Host "   3. Copy the URL from output`n" -ForegroundColor White

