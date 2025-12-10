# Cloudflare Tunnel Setup Guide

This guide will help you set up Cloudflare Tunnel to expose your local API server (connecting to MSSQL DB and middleware) to your Vercel-hosted gym website.

## Prerequisites

- Cloudflare account (free)
- Local API server running on port 3001
- Windows PowerShell (for scripts)

## Step 1: Install Cloudflare Tunnel

### Option A: Using winget (Windows 10/11)
```powershell
winget install --id Cloudflare.cloudflared
```

### Option B: Manual Installation
1. Download `cloudflared-windows-amd64.exe` from: https://github.com/cloudflare/cloudflared/releases/latest
2. Rename to `cloudflared.exe`
3. Place in `C:\cloudflared\` or add to PATH

## Step 2: Authenticate Cloudflare Tunnel

1. Open PowerShell
2. Run:
```powershell
cloudflared tunnel login
```
3. This will open your browser - log in to Cloudflare
4. Select your domain (or create one if you don't have one)
5. Authorization will complete automatically

## Step 3: Quick Tunnel (For Testing)

For quick testing, use a temporary tunnel:

```powershell
cloudflared tunnel --url http://localhost:3001
```

This will give you a URL like: `https://random-name.trycloudflare.com`

**Note:** This URL changes each time. For production, use a named tunnel (Step 4).

## Step 4: Named Tunnel (For Production)

### Create Named Tunnel

```powershell
cloudflared tunnel create gym-api-tunnel
```

This creates a persistent tunnel named `gym-api-tunnel`.

### Get Tunnel ID

```powershell
cloudflared tunnel list
```

Note the Tunnel ID (UUID format).

### Create Configuration File

Create `C:\Users\<YourUsername>\.cloudflared\config.yml`:

```yaml
tunnel: <TUNNEL_ID_FROM_ABOVE>
credentials-file: C:\Users\<YourUsername>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: gym-api.yourdomain.com  # Replace with your domain
    service: http://localhost:3001
  - service: http_status:404
```

### Route DNS (If you have a domain)

```powershell
cloudflared tunnel route dns gym-api-tunnel gym-api.yourdomain.com
```

### Run Named Tunnel

```powershell
cloudflared tunnel run gym-api-tunnel
```

## Step 5: Update Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/Update:
   - `LOCAL_API_URL` = `https://your-tunnel-url.run.app` (or your custom domain)
   - `USE_API_ONLY` = `true`
   - `SQL_DISABLED` = `true`

## Step 6: Test Connection

1. Start local API server: `node local-api-server.js`
2. Start Cloudflare tunnel: `cloudflared tunnel run gym-api-tunnel`
3. Test tunnel endpoint: `curl https://your-tunnel-url.run.app/health`
4. Deploy to Vercel and test API calls

## Step 7: Auto-Start on Boot (Windows)

Use the provided `start-production.ps1` script or create a Windows Task Scheduler job:

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: "When the computer starts"
4. Action: Start a program
5. Program: `powershell.exe`
6. Arguments: `-File "C:\path\to\start-production.ps1"`

## Troubleshooting

### Tunnel Not Connecting
- Check if local API server is running: `curl http://localhost:3001/health`
- Verify tunnel is running: Check Cloudflare dashboard
- Check firewall settings

### Vercel Can't Reach Tunnel
- Verify `LOCAL_API_URL` is set correctly in Vercel
- Check tunnel URL is accessible: `curl https://your-tunnel-url.run.app/health`
- Ensure tunnel is running continuously

### Tunnel URL Changes
- Use named tunnel instead of quick tunnel
- Set up custom domain for stable URL

## Security Notes

- Cloudflare Tunnel uses encrypted connections
- No need to expose ports on your firewall
- Tunnel authenticates with Cloudflare (secure)
- Local API server should still use authentication if handling sensitive data

## Cost

Cloudflare Tunnel is **completely free** for unlimited tunnels and bandwidth.

## Next Steps

1. Set up monitoring (UptimeRobot) to alert if tunnel goes down
2. Configure custom domain for professional URL
3. Set up auto-restart script for reliability
4. Test all API endpoints through tunnel

