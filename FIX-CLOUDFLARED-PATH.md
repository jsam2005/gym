# Fix Cloudflared PATH Issue

## Problem
`cloudflared` command not recognized - PATH not updated properly.

## Quick Fix

### Option 1: Use Full Path (Easiest)

Run this command directly:

```powershell
C:\cloudflared\cloudflared.exe tunnel --url tcp://localhost:1433
```

### Option 2: Reload PATH in Current Session

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
cloudflared tunnel --url tcp://localhost:1433
```

### Option 3: Restart PowerShell

1. Close current PowerShell window
2. Open new PowerShell window
3. Run: `cloudflared tunnel --url tcp://localhost:1433`

### Option 4: Verify Installation

Check if cloudflared exists:

```powershell
Test-Path C:\cloudflared\cloudflared.exe
```

If it returns `False`, reinstall:
```powershell
.\install-cloudflared.ps1
```

## Run Quick Tunnel

Once PATH is fixed, run:

```powershell
cloudflared tunnel --url tcp://localhost:1433
```

You should see output like:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at:                                         |
|  tcp://abc123.trycloudflare.com:1433                                                      |
+--------------------------------------------------------------------------------------------+
```

**Copy the hostname** (e.g., `abc123.trycloudflare.com`) for Vercel!

