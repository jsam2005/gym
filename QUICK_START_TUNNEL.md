# Quick Start: Cloudflare Tunnel

## Problem: Tunnel URL Not Accessible

If you see `DNS_PROBE_FINISHED_NXDOMAIN` error, the tunnel is not running.

**Quick tunnel URLs expire when you stop the tunnel!**

## Solution: Start the Tunnel

### Option 1: Use Startup Script (Easiest)

```powershell
.\start-production.ps1
```

This script will:
- Start local API server on port 3001
- Start Cloudflare tunnel
- Show you the tunnel URL
- Monitor both processes

### Option 2: Manual Start (Two Terminals)

**Terminal 1 - Start Local API Server:**
```powershell
cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
node local-api-server.js
```

Wait for: `✅ Connected to local SQL Server`

**Terminal 2 - Start Cloudflare Tunnel:**
```powershell
cloudflared tunnel --url http://localhost:3001
```

You'll see output like:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
|  https://NEW-RANDOM-NAME.trycloudflare.com                                                 |
+--------------------------------------------------------------------------------------------+
```

## Copy the New Tunnel URL

1. Copy the URL from Terminal 2 (e.g., `https://new-name.trycloudflare.com`)
2. Test it: Open in browser → `https://new-name.trycloudflare.com/health`
3. Should see: `{"status":"ok","database":"connected",...}`

## Update Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `LOCAL_API_URL` with the NEW tunnel URL
3. Redeploy your project

## Important Notes

- **Quick tunnel URLs change every time** you restart the tunnel
- For production, use a **named tunnel** (see `CLOUDFLARE_TUNNEL_SETUP.md`)
- Keep both terminals running (or use `start-production.ps1`)
- If tunnel stops, you'll need to restart and update Vercel with new URL

## Troubleshooting

### Tunnel Not Starting
- Check if local API server is running: `curl http://localhost:3001/health`
- Make sure port 3001 is not in use
- Check firewall settings

### Can't Access Tunnel URL
- Wait 30-60 seconds after starting tunnel
- Check tunnel is still running (don't close Terminal 2)
- Try accessing `/health` endpoint first

### Need Stable URL?
Create a named tunnel:
```powershell
cloudflared tunnel create gym-api-tunnel
cloudflared tunnel run gym-api-tunnel
```

