# Fix 500 Errors on Vercel - Quick Guide

## ✅ Tunnel Status: RUNNING

Your tunnel is running! Now let's fix the 500 errors.

## Most Common Cause: Hostname Mismatch

**Quick tunnels generate NEW hostnames each restart!**

If you restarted the tunnel, you have a **NEW hostname** that Vercel doesn't know about.

## Quick Fix Steps

### Step 1: Get Current Hostname

**Option A: Check tunnel output window**
- Look for: `Your quick Tunnel has been created! Visit it at:`
- Copy the hostname shown (e.g., `abc123.trycloudflare.com`)

**Option B: Restart tunnel to see hostname**
```powershell
.\start-quick-tunnel.ps1
```
Copy the hostname from the output.

### Step 2: Update Vercel Environment Variable

1. Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**
2. Find: `ETIME_SQL_SERVER`
3. Update to: `<your-current-hostname>` (from Step 1)
4. Click **Save**
5. Vercel will auto-redeploy

### Step 3: Verify All Variables Are Set

Make sure these are set in Vercel:

```
ETIME_SQL_SERVER=<current-hostname>
ETIME_SQL_DB=etimetracklite1
ETIME_SQL_USER=essl
ETIME_SQL_PASSWORD=essl
ETIME_SQL_INSTANCE=SQLEXPRESS
SQL_DISABLED=false
USE_API_ONLY=false
FRONTEND_URL=https://gym-zeta-teal.vercel.app
NODE_ENV=production
```

### Step 4: Check Vercel Logs

**After redeploy, check logs:**
1. Vercel Dashboard → Deployments → Latest
2. Click **Functions** tab
3. Click **View Function Logs**
4. Look for database connection messages

### Step 5: Test Endpoints

**Test debug endpoint:**
```
https://gym-zeta-teal.vercel.app/api/debug
```
Should show all variables are set.

**Test health endpoint:**
```
https://gym-zeta-teal.vercel.app/api/health
```
Should show database connection status.

## If Still Getting 500 Errors

### Check These:

1. **Tunnel is running?**
   ```powershell
   Get-Process -Name "cloudflared"
   ```
   Should show running process.

2. **SQL Server is running?**
   ```powershell
   Get-Service -Name "MSSQL*"
   ```
   SQL Server (SQLEXPRESS) should be Running.

3. **SQL Server Browser is running?**
   ```powershell
   Get-Service -Name "SQLBrowser"
   ```
   Should be Running (required for named instances).

4. **Check Vercel logs** for specific error messages.

## Permanent Solution (Later)

For a permanent hostname that doesn't change:

1. Set up named tunnel via Cloudflare Dashboard
2. Configure permanent hostname
3. Use that hostname in Vercel

**For now, quick tunnel works - just update Vercel when hostname changes!**

