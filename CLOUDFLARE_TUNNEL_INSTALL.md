# Cloudflare Tunnel Installation Guide (Windows)

## Quick Installation Methods

### Method 1: Manual Download (Works on All Windows Versions)

1. **Download Cloudflare Tunnel:**
   - Visit: https://github.com/cloudflare/cloudflared/releases/latest
   - Download: `cloudflared-windows-amd64.exe` (for 64-bit Windows)
   - Or: `cloudflared-windows-386.exe` (for 32-bit Windows)

2. **Create Installation Directory:**
   ```powershell
   # Run PowerShell as Administrator
   New-Item -ItemType Directory -Force -Path "C:\cloudflared"
   ```

3. **Move and Rename:**
   - Move downloaded `cloudflared-windows-amd64.exe` to `C:\cloudflared\`
   - Rename to `cloudflared.exe`

4. **Add to PATH:**
   ```powershell
   # Run PowerShell as Administrator
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\cloudflared", [EnvironmentVariableTarget]::Machine)
   ```

5. **Restart PowerShell** or reload PATH:
   ```powershell
   $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
   ```

6. **Verify Installation:**
   ```powershell
   cloudflared --version
   ```

### Method 2: Using Chocolatey (If Installed)

1. **Install Chocolatey** (if not installed):
   - Visit: https://chocolatey.org/install
   - Run PowerShell as Administrator:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. **Install Cloudflare Tunnel:**
   ```powershell
   choco install cloudflared -y
   ```

### Method 3: Using Scoop (If Installed)

1. **Install Scoop** (if not installed):
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex
   ```

2. **Install Cloudflare Tunnel:**
   ```powershell
   scoop install cloudflared
   ```

### Method 4: Using winget (Windows 10/11 with App Installer)

1. **Check if winget is available:**
   ```powershell
   winget --version
   ```

2. **If available, install:**
   ```powershell
   winget install Cloudflare.cloudflared
   ```

## Verify Installation

After installation, verify it works:

```powershell
cloudflared --version
```

You should see something like:
```
cloudflared version 2024.x.x (built YYYY-MM-DD)
```

## Next Steps

After installation, continue with the tunnel setup:

1. Authenticate: `cloudflared tunnel login`
2. Create tunnel: `cloudflared tunnel create gym-sql-tunnel`
3. Configure tunnel: Create `config.yml` file
4. Run tunnel: `cloudflared tunnel run gym-sql-tunnel`

See `VERCEL_DEPLOYMENT.md` for complete setup instructions.

## Troubleshooting

### "cloudflared is not recognized"

**Solution**: Add to PATH manually:
```powershell
# Run PowerShell as Administrator
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\cloudflared", [EnvironmentVariableTarget]::Machine)
```

Then restart PowerShell.

### "Access Denied" errors

**Solution**: Run PowerShell as Administrator

### Can't download from GitHub

**Solution**: 
- Use a browser to download manually
- Or use alternative download mirrors
- Check firewall/proxy settings

## Quick Setup Script

Save this as `install-cloudflared.ps1` and run as Administrator:

```powershell
# Cloudflare Tunnel Installation Script
# Run as Administrator

Write-Host "Installing Cloudflare Tunnel..." -ForegroundColor Green

# Create directory
$installDir = "C:\cloudflared"
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Force -Path $installDir
}

# Download cloudflared
$downloadUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
$outputPath = "$installDir\cloudflared.exe"

Write-Host "Downloading cloudflared..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $downloadUrl -OutFile $outputPath

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)
if ($currentPath -notlike "*$installDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installDir", [EnvironmentVariableTarget]::Machine)
    Write-Host "Added to PATH" -ForegroundColor Green
}

# Verify installation
Write-Host "Verifying installation..." -ForegroundColor Yellow
& "$outputPath" --version

Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "Restart PowerShell or run: `$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')" -ForegroundColor Cyan
```

