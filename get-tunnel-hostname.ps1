# Get Tunnel Hostname - Quick Tunnel Method
# This creates a quick tunnel and extracts the hostname

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Get Cloudflare Tunnel Hostname" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will create a QUICK tunnel (temporary) to get a hostname." -ForegroundColor Yellow
Write-Host "The hostname will be saved for use in Vercel." -ForegroundColor Yellow
Write-Host ""
Write-Host "Note: Quick tunnels are temporary - hostname changes each restart." -ForegroundColor Gray
Write-Host "For permanent hostname, configure routes in Cloudflare dashboard." -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Start quick tunnel? (y/n)"

if ($choice -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Host "Starting quick tunnel..." -ForegroundColor Yellow
Write-Host "This will expose SQL Server on port 1433" -ForegroundColor Gray
Write-Host ""
Write-Host "IMPORTANT: Look for the hostname in the output below!" -ForegroundColor Green
Write-Host "It will look like: tcp://abc123.trycloudflare.com:1433" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop when you have the hostname" -ForegroundColor Yellow
Write-Host ""

# Start quick tunnel and capture output
$process = Start-Process -FilePath "cloudflared" -ArgumentList "tunnel", "--url", "tcp://localhost:1433" -NoNewWindow -PassThru -RedirectStandardOutput "tunnel-output.txt" -RedirectStandardError "tunnel-error.txt"

Write-Host "Tunnel process started (PID: $($process.Id))" -ForegroundColor Green
Write-Host ""
Write-Host "Waiting for hostname..." -ForegroundColor Yellow

# Wait a bit for output
Start-Sleep -Seconds 5

# Try to read output
if (Test-Path "tunnel-output.txt") {
    $output = Get-Content "tunnel-output.txt" -ErrorAction SilentlyContinue
    if ($output) {
        Write-Host "Tunnel output:" -ForegroundColor Cyan
        Write-Host $output -ForegroundColor White
        
        # Try to extract hostname
        $hostnameMatch = $output | Select-String -Pattern "tcp://([\w-]+\.trycloudflare\.com)" | Select-Object -First 1
        if ($hostnameMatch) {
            $hostname = $hostnameMatch.Matches[0].Groups[1].Value
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "Hostname Found: $hostname" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Use this in Vercel environment variables:" -ForegroundColor Cyan
            Write-Host "ETIME_SQL_SERVER=$hostname" -ForegroundColor White
            Write-Host ""
            
            # Save to file
            $hostname | Out-File -FilePath "tunnel-hostname.txt" -Encoding UTF8
            Write-Host "Hostname saved to: tunnel-hostname.txt" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "The tunnel is running. Check the console output above for the hostname." -ForegroundColor Yellow
Write-Host "Or run this command in a new window to see live output:" -ForegroundColor Cyan
Write-Host "cloudflared tunnel --url tcp://localhost:1433" -ForegroundColor White
Write-Host ""

# Keep process info
Write-Host "To stop the tunnel, run:" -ForegroundColor Cyan
Write-Host "Stop-Process -Id $($process.Id)" -ForegroundColor White
Write-Host ""

