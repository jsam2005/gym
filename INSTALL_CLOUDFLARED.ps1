# Install Cloudflare Tunnel (cloudflared)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Install Cloudflare Tunnel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if already installed
$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($cloudflared) {
    Write-Host "✅ Cloudflare Tunnel is already installed!" -ForegroundColor Green
    Write-Host "   Version: " -NoNewline
    cloudflared --version
    Write-Host ""
    Write-Host "You can now run:" -ForegroundColor Cyan
    Write-Host "   cloudflared tunnel --url http://localhost:5000" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 0
}

Write-Host "📥 Installing Cloudflare Tunnel...`n" -ForegroundColor Yellow

# Try winget first
$winget = Get-Command winget -ErrorAction SilentlyContinue
if ($winget) {
    Write-Host "Using winget to install..." -ForegroundColor Cyan
    winget install --id Cloudflare.cloudflared --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Installation successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Refreshing PATH..." -ForegroundColor Yellow
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Start-Sleep -Seconds 2
        
        $cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
        if ($cloudflared) {
            Write-Host "✅ Cloudflare Tunnel is ready!" -ForegroundColor Green
            Write-Host ""
            Write-Host "You can now run:" -ForegroundColor Cyan
            Write-Host "   cloudflared tunnel --url http://localhost:5000" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Or use the script:" -ForegroundColor Cyan
            Write-Host "   .\START_TUNNEL_ONLY.ps1" -ForegroundColor Yellow
            Write-Host ""
            Read-Host "Press Enter to exit"
            exit 0
        }
    }
}

# Manual download option
Write-Host ""
Write-Host "⚠️  Winget installation failed or not available" -ForegroundColor Yellow
Write-Host ""
Write-Host "Manual Installation:" -ForegroundColor Cyan
Write-Host "   1. Download from:" -ForegroundColor White
Write-Host "      https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Rename to: cloudflared.exe" -ForegroundColor White
Write-Host ""
Write-Host "   3. Place in one of these locations:" -ForegroundColor White
Write-Host "      - C:\Windows\cloudflared.exe" -ForegroundColor Gray
Write-Host "      - C:\cloudflared\cloudflared.exe (then add to PATH)" -ForegroundColor Gray
Write-Host "      - Or any folder in your PATH" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Test installation:" -ForegroundColor White
Write-Host "      cloudflared --version" -ForegroundColor Gray
Write-Host ""
Write-Host "Alternative: Use ngrok (simpler, no installation needed)" -ForegroundColor Cyan
Write-Host "   Download: https://ngrok.com/download" -ForegroundColor Gray
Write-Host "   Extract and run: ngrok http 5000" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to exit"

