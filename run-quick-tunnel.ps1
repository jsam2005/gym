# Run Quick Tunnel with Full Path
# This ensures cloudflared is found even if PATH isn't updated

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Quick Tunnel - Get Hostname" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Try to find cloudflared
$cloudflaredPaths = @(
    "C:\cloudflared\cloudflared.exe",
    "$env:ProgramFiles\cloudflared\cloudflared.exe",
    "$env:LOCALAPPDATA\cloudflared\cloudflared.exe",
    "cloudflared.exe"  # Try PATH
)

$cloudflaredExe = $null
foreach ($path in $cloudflaredPaths) {
    if (Test-Path $path) {
        $cloudflaredExe = $path
        Write-Host "Found cloudflared at: $path" -ForegroundColor Green
        break
    }
}

# Also try to find it in PATH
if (-not $cloudflaredExe) {
    try {
        $pathResult = Get-Command cloudflared -ErrorAction Stop
        $cloudflaredExe = $pathResult.Source
        Write-Host "Found cloudflared in PATH: $cloudflaredExe" -ForegroundColor Green
    } catch {
        Write-Host "cloudflared not found in PATH" -ForegroundColor Yellow
    }
}

if (-not $cloudflaredExe) {
    Write-Host "ERROR: cloudflared not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. Is cloudflared installed at C:\cloudflared\cloudflared.exe?" -ForegroundColor White
    Write-Host "2. Or run the installation script again: .\install-cloudflared.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Trying to reload PATH..." -ForegroundColor Yellow
    
    # Reload PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Try again
    try {
        $pathResult = Get-Command cloudflared -ErrorAction Stop
        $cloudflaredExe = $pathResult.Source
        Write-Host "Found cloudflared after PATH reload: $cloudflaredExe" -ForegroundColor Green
    } catch {
        Write-Host "Still not found. Please check installation." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Starting quick tunnel..." -ForegroundColor Yellow
Write-Host "This will expose SQL Server on port 1433" -ForegroundColor Gray
Write-Host ""
Write-Host "IMPORTANT: Look for the hostname in the output!" -ForegroundColor Green
Write-Host "It will look like: tcp://abc123.trycloudflare.com:1433" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
Write-Host ""

# Run quick tunnel
& $cloudflaredExe tunnel --url tcp://localhost:1433

