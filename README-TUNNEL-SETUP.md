# Cloudflare Tunnel Setup - Complete Guide

## ✅ What's Already Done

1. ✅ Cloudflare Tunnel installed
2. ✅ Tunnel created: `gym-sql-tunnel`
3. ✅ Credentials file retrieved
4. ✅ Config file created: `C:\Users\HP\.cloudflared\config.yml`

## 🎯 Get Hostname for Vercel

You have **3 options** to get a hostname:

### Option 1: Quick Tunnel (Easiest - For Testing)

Run this script:
```powershell
.\get-tunnel-hostname.ps1
```

OR run directly:
```powershell
cloudflared tunnel --url tcp://localhost:1433
```

**Output will show:**
```
tcp://abc123.trycloudflare.com:1433
```

**Copy the hostname** (e.g., `abc123.trycloudflare.com`) and use it in Vercel.

**Note**: Quick tunnels are temporary - hostname changes each time you restart.

---

### Option 2: Configure via Cloudflare Dashboard (Permanent)

1. Go to: https://one.dash.cloudflare.com/
2. Navigate to: **Networks** → **Connectors** → **Cloudflare Tunnels**
3. Click on: **gym-sql-tunnel**
4. Click **"Configure"** tab
5. Under **"Public Hostname"**, click **"Add a public hostname"**
6. Configure:
   - **Subdomain**: `sql-tunnel`
   - **Domain**: Select a domain (or add one to Cloudflare first)
   - **Service Type**: `TCP`
   - **Service**: `localhost:1433`
7. Click **"Save hostname"**
8. Copy the hostname shown

---

### Option 3: Use Named Tunnel (Current Setup)

Your named tunnel is already configured. To get a hostname:

1. Run the tunnel:
   ```powershell
   cloudflared tunnel run gym-sql-tunnel
   ```

2. Check Cloudflare dashboard for assigned hostname
3. OR configure routes in dashboard (see Option 2)

---

## 🚀 After Getting Hostname

### Use in Vercel Environment Variables:

```
ETIME_SQL_SERVER=<your-hostname-here>
ETIME_SQL_DB=etimetracklite1
ETIME_SQL_USER=essl
ETIME_SQL_PASSWORD=<your-sql-password>
ETIME_SQL_INSTANCE=SQLEXPRESS
```

**Example:**
```
ETIME_SQL_SERVER=abc123.trycloudflare.com
```

---

## 📝 Quick Reference

### Files Created:
- `C:\Users\HP\.cloudflared\config.yml` - Tunnel configuration
- `C:\Users\HP\.cloudflared\839ccaf6-e877-4810-896c-b8ddb0846eeb.json` - Credentials

### Scripts Available:
- `get-tunnel-hostname.ps1` - Get hostname via quick tunnel
- `quick-tunnel-test.ps1` - Test quick tunnel
- `setup-tunnel-hostname-api.ps1` - Configure via API (requires domain)

### Commands:
```powershell
# Run named tunnel
cloudflared tunnel run gym-sql-tunnel

# Quick tunnel (temporary hostname)
cloudflared tunnel --url tcp://localhost:1433

# Check tunnel status
cloudflared tunnel info gym-sql-tunnel
```

---

## 🎯 Recommended: Use Quick Tunnel for Now

For immediate testing and deployment:

1. Run: `.\get-tunnel-hostname.ps1`
2. Copy the hostname shown
3. Use it in Vercel environment variables
4. Deploy to Vercel

Later, you can set up a permanent hostname via the dashboard.

---

## Need Help?

See:
- `NEXT_STEPS.md` - Complete deployment guide
- `VERCEL_DEPLOYMENT.md` - Vercel setup details
- `configure-tunnel-routes.md` - Route configuration guide

