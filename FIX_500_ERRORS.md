# Fixing 500 Errors on Vercel

## Issues Fixed

✅ **Frontend API URLs** - Fixed hardcoded `localhost:5000` references  
✅ **WebSocket Connections** - Disabled in production (Vercel serverless doesn't support persistent connections)  
✅ **Database Port** - Ensured port 1433 is used for Cloudflare Tunnel connections  

## Current Status

Your Vercel deployment is getting 500 errors because:

1. **Database Connection Failing** - The Cloudflare Tunnel hostname might not be set correctly in Vercel
2. **Tunnel Not Running** - The tunnel must be running on your local machine for Vercel to connect

## Step-by-Step Fix

### Step 1: Get Your Tunnel Hostname

Run this script:
```powershell
.\get-tunnel-hostname.ps1
```

Or manually start a quick tunnel:
```powershell
C:\cloudflared\cloudflared.exe tunnel --url tcp://localhost:1433
```

**Copy the hostname** (e.g., `abc123.trycloudflare.com`)

### Step 2: Update Vercel Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

**Update/Create these variables:**

```
ETIME_SQL_SERVER=<your-tunnel-hostname>
ETIME_SQL_DB=etimetracklite1
ETIME_SQL_USER=essl
ETIME_SQL_PASSWORD=essl
ETIME_SQL_INSTANCE=SQLEXPRESS
SQL_DISABLED=false
USE_API_ONLY=false
FRONTEND_URL=https://gym-zeta-teal.vercel.app
NODE_ENV=production
```

**Important:** Replace `<your-tunnel-hostname>` with the hostname from Step 1.

### Step 3: Keep Tunnel Running

The tunnel MUST be running continuously. Options:

**Option A: Quick Tunnel (Temporary)**
```powershell
C:\cloudflared\cloudflared.exe tunnel --url tcp://localhost:1433
```
⚠️ Hostname changes each restart - you'll need to update Vercel each time.

**Option B: Named Tunnel (Permanent)**
1. Configure hostname in Cloudflare Dashboard (see `README-TUNNEL-SETUP.md`)
2. Run named tunnel:
```powershell
C:\cloudflared\cloudflared.exe tunnel run gym-sql-tunnel
```

**Option C: Run as Windows Service (Recommended)**
See `README-TUNNEL-SETUP.md` for instructions to run tunnel as a service.

### Step 4: Verify Configuration

After updating Vercel environment variables:

1. **Check Debug Endpoint:**
   ```
   https://gym-zeta-teal.vercel.app/api/debug
   ```
   Should show all variables are set.

2. **Check Health Endpoint:**
   ```
   https://gym-zeta-teal.vercel.app/api/health
   ```
   Should show database connection status.

3. **Check Vercel Logs:**
   - Vercel Dashboard → Deployments → Latest → Functions → Logs
   - Look for database connection messages

### Step 5: Test API Endpoints

Try these endpoints:
- `https://gym-zeta-teal.vercel.app/api/clients`
- `https://gym-zeta-teal.vercel.app/api/biometric/dashboard`

## Common Issues

### Issue: "Cannot connect to SQL Server"
**Solution:**
- Verify tunnel is running: `Get-Process cloudflared`
- Check tunnel hostname matches Vercel `ETIME_SQL_SERVER`
- Ensure SQL Server is running locally
- Check SQL Server Browser service is running

### Issue: "Connection timeout"
**Solution:**
- Tunnel might not be running
- Hostname might be wrong
- SQL Server might not be accessible on localhost:1433

### Issue: "500 errors persist"
**Solution:**
1. Check Vercel logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure tunnel is running and accessible
4. Test database connection locally first

## Next Steps

1. ✅ Get tunnel hostname
2. ✅ Update Vercel environment variables
3. ✅ Start tunnel (keep it running)
4. ✅ Wait for Vercel to redeploy
5. ✅ Test endpoints
6. ✅ Check logs if issues persist

## Files Changed

- `frontend/src/lib/api.ts` - Fixed API URL for production
- `frontend/src/lib/socket.ts` - Disabled WebSocket in production
- `frontend/src/pages/BiometricAccess.tsx` - Fixed hardcoded localhost URLs
- `backend/src/config/database.ts` - Ensured port 1433 for tunnel connections

