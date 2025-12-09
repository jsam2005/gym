# Cloudflare Tunnel Installation Script for Windows
# Run this script as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cloudflare Tunnel Installation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

# Create installation directory
$installDir = "C:\cloudflared"
Write-Host "[1/4] Creating installation directory..." -ForegroundColor Yellow
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
    Write-Host "   Created: $installDir" -ForegroundColor Green
} else {
    Write-Host "   Directory already exists: $installDir" -ForegroundColor Gray
}

# Download cloudflared
$downloadUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
$outputPath = "$installDir\cloudflared.exe"

Write-Host "[2/4] Downloading Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host "   From: $downloadUrl" -ForegroundColor Gray
Write-Host "   To: $outputPath" -ForegroundColor Gray

try {
    # Check if file already exists
    if (Test-Path $outputPath) {
        Write-Host "   File already exists. Skipping download." -ForegroundColor Gray
        Write-Host "   To re-download, delete: $outputPath" -ForegroundColor Gray
    } else {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $outputPath -UseBasicParsing
        Write-Host "   Download complete!" -ForegroundColor Green
    }
} catch {
    Write-Host "   ERROR: Failed to download cloudflared" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Manual download:" -ForegroundColor Yellow
    Write-Host "   1. Visit: https://github.com/cloudflare/cloudflared/releases/latest" -ForegroundColor Cyan
    Write-Host "   2. Download: cloudflared-windows-amd64.exe" -ForegroundColor Cyan
    Write-Host "   3. Save to: $outputPath" -ForegroundColor Cyan
    pause
    exit 1
}

# Add to PATH
Write-Host "[3/4] Adding to system PATH..." -ForegroundColor Yellow
$currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)
if ($currentPath -notlike "*$installDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installDir", [EnvironmentVariableTarget]::Machine)
    Write-Host "   Added to PATH: $installDir" -ForegroundColor Green
} else {
    Write-Host "   Already in PATH" -ForegroundColor Gray
}

# Update current session PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify installation
Write-Host "[4/4] Verifying installation..." -ForegroundColor Yellow
try {
    $version = & "$outputPath" --version 2>&1
    Write-Host "   Version: $version" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Installation Successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Authenticate: cloudflared tunnel login" -ForegroundColor White
    Write-Host "2. Create tunnel: cloudflared tunnel create gym-sql-tunnel" -ForegroundColor White
    Write-Host "3. Configure tunnel: See VERCEL_DEPLOYMENT.md" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "   WARNING: Could not verify installation" -ForegroundColor Yellow
    Write-Host "   But file was downloaded to: $outputPath" -ForegroundColor Gray
    Write-Host "   You may need to restart PowerShell" -ForegroundColor Yellow
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

