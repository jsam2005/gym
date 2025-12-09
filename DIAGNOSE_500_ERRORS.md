# Diagnosing 500 Errors on Vercel

## Current Issue

You're getting 500 errors on all API endpoints:
- `/api/clients` → 500
- `/api/biometric/dashboard` → 500
- `/api/biometric/logs` → 500

## Step-by-Step Diagnosis

### Step 1: Check Vercel Logs

**Go to Vercel Dashboard:**
1. Navigate to: https://vercel.com/dashboard
2. Click on your project: **gym**
3. Go to: **Deployments** → **Latest Deployment**
4. Click: **Functions** tab
5. Click: **View Function Logs**

**Look for:**
- Database connection errors
- Environment variable issues
- SQL Server connection timeouts
- Error messages about missing variables

### Step 2: Verify Environment Variables

**Check Vercel Dashboard:**
1. Go to: **Settings** → **Environment Variables**
2. Verify these are set:

```
ETIME_SQL_SERVER=grass-generators-tiffany-taxation.trycloudflare.com
ETIME_SQL_DB=etimetracklite1
ETIME_SQL_USER=essl
ETIME_SQL_PASSWORD=essl
ETIME_SQL_INSTANCE=SQLEXPRESS
SQL_DISABLED=false
USE_API_ONLY=false
FRONTEND_URL=https://gym-zeta-teal.vercel.app
NODE_ENV=production
```

**Important:** 
- Make sure `ETIME_SQL_SERVER` matches your **current** tunnel hostname
- If you restarted the tunnel, you got a NEW hostname - update Vercel!

### Step 3: Check Tunnel is Running

**On your local machine, verify tunnel is running:**

```powershell
# Check if tunnel process is running
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
```

**If not running, start it:**
```powershell
.\start-quick-tunnel.ps1
```

**Or manually:**
```powershell
C:\cloudflared\cloudflared.exe tunnel --url tcp://localhost:1433
```

**Look for:** `Registered tunnel connection` in the output

### Step 4: Test Debug Endpoint

**Open in browser:**
```
https://gym-zeta-teal.vercel.app/api/debug
```

**Should show:**
```json
{
  "env": {
    "ETIME_SQL_SERVER": "***set***",
    "ETIME_SQL_DB": "etimetracklite1",
    ...
  }
}
```

**If it shows `"not set"`** → Environment variables are not configured correctly in Vercel.

### Step 5: Test Health Endpoint

**Open in browser:**
```
https://gym-zeta-teal.vercel.app/api/health
```

**Should show:**
```json
{
  "status": "OK",
  "database": {
    "configured": true,
    "server": "grass-generators-tiffany-taxation.trycloudflare.com",
    "connectionStatus": "connected"
  }
}
```

**If `connectionStatus` shows `"error: ..."`** → Database connection is failing.

## Common Issues & Solutions

### Issue 1: Tunnel Not Running

**Symptoms:**
- Connection timeout errors
- `connectionStatus: "error: timeout"`

**Solution:**
1. Start tunnel: `.\start-quick-tunnel.ps1`
2. Keep it running
3. Verify hostname matches Vercel `ETIME_SQL_SERVER`

### Issue 2: Wrong Hostname in Vercel

**Symptoms:**
- Connection errors
- Hostname mismatch

**Solution:**
1. Get current tunnel hostname (from tunnel output)
2. Update Vercel: `ETIME_SQL_SERVER=<new-hostname>`
3. Wait for Vercel to redeploy

### Issue 3: SQL Server Not Running Locally

**Symptoms:**
- Connection refused errors
- Timeout errors

**Solution:**
1. Check SQL Server is running:
   ```powershell
   Get-Service -Name "MSSQL*"
   ```
2. Start SQL Server Browser service:
   ```powershell
   Start-Service "SQLBrowser"
   ```
3. Verify SQL Server is listening on port 1433

### Issue 4: Missing Environment Variables

**Symptoms:**
- `ETIME_SQL_SERVER: "not set"` in debug endpoint
- Database not configured

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add all required variables (see Step 2)
3. Redeploy

### Issue 5: Port Not Specified

**Symptoms:**
- Connection works but queries fail
- Port-related errors

**Solution:**
Add to Vercel environment variables:
```
ETIME_SQL_PORT=1433
```

## Quick Test Script

Run this to check everything:

```powershell
.\check-vercel-config.ps1
```

## Next Steps

1. ✅ Check Vercel logs (most important!)
2. ✅ Verify tunnel is running
3. ✅ Check environment variables
4. ✅ Test debug/health endpoints
5. ✅ Fix any issues found

## Still Having Issues?

**Share these details:**
1. Output from: `https://gym-zeta-teal.vercel.app/api/debug`
2. Output from: `https://gym-zeta-teal.vercel.app/api/health`
3. Vercel function logs (from Step 1)
4. Tunnel status (is it running?)

