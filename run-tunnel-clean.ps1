# Run Cloudflare Tunnel Cleanly
# This script runs the tunnel and suppresses harmless warnings

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cloudflare Tunnel - Clean Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$cloudflaredPath = "C:\cloudflared\cloudflared.exe"

# Check if cloudflared exists
if (-not (Test-Path $cloudflaredPath)) {
    Write-Host "ERROR: cloudflared not found at $cloudflaredPath" -ForegroundColor Red
    Write-Host "TIP: Please run install-cloudflared.ps1 first" -ForegroundColor Yellow
    exit 1
}

Write-Host "Choose tunnel type:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Quick Tunnel (Temporary hostname - for testing)" -ForegroundColor White
Write-Host "2. Named Tunnel (Permanent - gym-sql-tunnel)" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Enter choice (1 or 2)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "Starting Quick Tunnel..." -ForegroundColor Green
    Write-Host ""
    Write-Host "NOTE: Quick tunnels show certificate warnings - these are harmless!" -ForegroundColor Yellow
    Write-Host "NOTE: DNS resolver errors are also harmless - tunnel will still work." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Look for the hostname in the output below:" -ForegroundColor Cyan
    Write-Host "   Format: https://xxxxx.trycloudflare.com" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Run quick tunnel - errors are harmless for quick tunnels
    & $cloudflaredPath tunnel --url tcp://localhost:1433 2>&1 | ForEach-Object {
        $line = $_
        # Filter out harmless errors
        if ($line -match "Cannot determine default origin certificate") {
            # Skip this warning - it's harmless for quick tunnels
            return
        }
        if ($line -match "Failed to.*DNS.*resolver") {
            # Skip DNS resolver errors - tunnel still works
            return
        }
        # Show everything else
        Write-Host $line
    }
}
elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "Checking named tunnel configuration..." -ForegroundColor Yellow
    
    $configPath = "$env:USERPROFILE\.cloudflared\config.yml"
    $credPath = "$env:USERPROFILE\.cloudflared\839ccaf6-e877-4810-896c-b8ddb0846eeb.json"
    
    if (-not (Test-Path $configPath)) {
        Write-Host "ERROR: Config file not found: $configPath" -ForegroundColor Red
        Write-Host "TIP: Run setup-tunnel-config.ps1 first" -ForegroundColor Yellow
        exit 1
    }
    
    if (-not (Test-Path $credPath)) {
        Write-Host "ERROR: Credentials file not found: $credPath" -ForegroundColor Red
        Write-Host "TIP: Run get-credentials-with-account.ps1 first" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "SUCCESS: Configuration files found" -ForegroundColor Green
    Write-Host ""
    Write-Host "Starting Named Tunnel (gym-sql-tunnel)..." -ForegroundColor Green
    Write-Host ""
    Write-Host "NOTE: If you see certificate errors, they're usually harmless for TCP tunnels." -ForegroundColor Yellow
    Write-Host "NOTE: DNS resolver errors are network-related but won't block the tunnel." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Run named tunnel
    & $cloudflaredPath tunnel run gym-sql-tunnel 2>&1 | ForEach-Object {
        $line = $_
        # Show all output for named tunnels (user might need to see errors)
        Write-Host $line
    }
}
else {
    Write-Host "ERROR: Invalid choice" -ForegroundColor Red
    exit 1
}
