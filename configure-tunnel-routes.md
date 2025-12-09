# Configure Cloudflare Tunnel Routes

Your config file is correct, but for a **named tunnel** (not a quick tunnel), you need to configure routes in the Cloudflare dashboard to get a hostname.

## Current Config Status

Your `config.yml` is correctly configured for TCP tunneling:
```yaml
tunnel: 839ccaf6-e877-4810-896c-b8ddb0846eeb
credentials-file: C:\Users\HP\.cloudflared\839ccaf6-e877-4810-896c-b8ddb0846eeb.json

ingress:
  - service: tcp://localhost:1433
  - service: http_status:404
```

## Option 1: Configure Routes in Cloudflare Dashboard (Recommended)

### Step 1: Go to Cloudflare Dashboard

1. Go to: https://one.dash.cloudflare.com/
2. Navigate to: **Networks** → **Connectors** → **Cloudflare Tunnels**
3. Click on your tunnel: **gym-sql-tunnel**

### Step 2: Configure Public Hostname

1. Click on **"Configure"** tab
2. Under **"Public Hostname"** section:
   - **Subdomain**: `sql-tunnel` (or any name you want)
   - **Domain**: Select a domain you own, OR use Cloudflare's free subdomain
   - **Service Type**: `TCP`
   - **Service URL**: `localhost:1433`
3. Click **"Save hostname"**

### Step 3: Get the Hostname

After saving, you'll see a hostname like:
- `sql-tunnel.yourdomain.com` (if you have a domain)
- OR Cloudflare will assign one

**Copy this hostname** - you'll need it for Vercel!

---

## Option 2: Use Quick Tunnel (Temporary - For Testing)

If you want a quick hostname for testing, you can use a quick tunnel:

```powershell
# This creates a temporary tunnel with a random hostname
cloudflared tunnel --url tcp://localhost:1433
```

This will give you output like:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at:                                         |
|  tcp://abc123.trycloudflare.com:1433                                                      |
+--------------------------------------------------------------------------------------------+
```

**Note**: Quick tunnels are temporary and change each time you restart.

---

## Option 3: Update Config with Hostname (If You Have a Domain)

If you have a domain in Cloudflare, update your config:

```yaml
tunnel: 839ccaf6-e877-4810-896c-b8ddb0846eeb
credentials-file: C:\Users\HP\.cloudflared\839ccaf6-e877-4810-896c-b8ddb0846eeb.json

ingress:
  # Expose SQL Server (port 1433) via TCP
  - hostname: sql-tunnel.yourdomain.com
    service: tcp://localhost:1433
  # Catch-all rule (must be last)
  - service: http_status:404
```

Then setup DNS:
```powershell
cloudflared tunnel route dns gym-sql-tunnel sql-tunnel.yourdomain.com
```

---

## Recommended: Use Dashboard Configuration

**Best approach**: Use Option 1 (Dashboard configuration) because:
- ✅ Permanent hostname
- ✅ Works with named tunnels
- ✅ Easy to manage
- ✅ No need to update config file

---

## After Getting Hostname

Once you have the hostname (from dashboard or quick tunnel), use it in Vercel:

**Vercel Environment Variables:**
```
ETIME_SQL_SERVER=<your-tunnel-hostname>
ETIME_SQL_DB=etimetracklite1
ETIME_SQL_USER=essl
ETIME_SQL_PASSWORD=<your-password>
```

**Example:**
```
ETIME_SQL_SERVER=sql-tunnel.yourdomain.com
# OR
ETIME_SQL_SERVER=abc123.trycloudflare.com
```

---

## Current Status

Your config file is **correct** and ready to use. You just need to:
1. Configure routes in Cloudflare dashboard (Option 1) - **Recommended**
2. OR use quick tunnel for testing (Option 2)
3. Get the hostname
4. Use it in Vercel environment variables

