# Vercel 500 Error Troubleshooting

## Error: GET /api/clients 500 (Internal Server Error)

This error indicates the backend API is failing. Common causes:

### 1. Database Connection Issue (Most Likely)

**Check Environment Variables in Vercel:**

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**
```
ETIME_SQL_SERVER=eds-welcome-floating-prizes.trycloudflare.com
ETIME_SQL_DB=etimetracklite1
ETIME_SQL_USER=essl
ETIME_SQL_PASSWORD=<your-sql-password>
ETIME_SQL_INSTANCE=SQLEXPRESS
SQL_DISABLED=false
USE_API_ONLY=false
FRONTEND_URL=https://gym-zeta-teal.vercel.app
```

**Important:**
- Make sure `ETIME_SQL_SERVER` is set to your Cloudflare Tunnel hostname
- Make sure the tunnel is running on your local server
- Verify SQL password is correct

### 2. Check Vercel Logs

1. Go to Vercel Dashboard
2. Your Project → Deployments → Click latest deployment
3. Click "Functions" tab
4. Click on `/api/serverless` function
5. Check "Logs" tab for errors

**Look for:**
- Database connection errors
- Missing environment variables
- Import/module errors

### 3. Test Database Connection

Visit: `https://gym-zeta-teal.vercel.app/api/health`

Should return:
```json
{
  "status": "OK",
  "message": "Server is running",
  "database": {
    "configured": true,
    "server": "eds-welcome-floating-prizes.trycloudflare.com",
    ...
  }
}
```

If `configured: false`, environment variables are not set correctly.

### 4. Verify Tunnel is Running

**On your local server**, make sure the tunnel is running:

```powershell
# Check if tunnel process is running
Get-Process cloudflared -ErrorAction SilentlyContinue

# If not running, start it:
C:\cloudflared\cloudflared.exe tunnel --url tcp://localhost:1433
```

**Important:** The tunnel MUST be running for Vercel to connect to your database.

### 5. Check SQL Server Configuration

Make sure:
- SQL Server is running
- SQL Server Browser service is started
- Port 1433 is accessible
- Firewall allows connections

### 6. Common Issues and Fixes

#### Issue: "Cannot connect to database"
**Fix:** 
- Verify tunnel hostname in Vercel environment variables
- Make sure tunnel is running
- Check tunnel hostname hasn't changed (quick tunnels change each restart)

#### Issue: "Environment variable not set"
**Fix:**
- Go to Vercel → Settings → Environment Variables
- Add all required variables
- Redeploy after adding variables

#### Issue: "Module not found" or "Import error"
**Fix:**
- Check Vercel build logs
- Make sure `backend/dist` folder exists after build
- Verify build command in `vercel.json`

#### Issue: "Timeout" or "Function timeout"
**Fix:**
- Database connection might be slow via tunnel
- Increase timeout in `vercel.json`:
```json
"functions": {
  "api/serverless.js": {
    "maxDuration": 60
  }
}
```

### 7. Quick Debug Steps

1. **Check Health Endpoint:**
   ```
   https://gym-zeta-teal.vercel.app/api/health
   ```
   This will show if database is configured.

2. **Check Vercel Logs:**
   - Look for specific error messages
   - Check database connection attempts
   - Verify environment variables are loaded

3. **Verify Tunnel:**
   - Is tunnel running on local server?
   - Is hostname correct in Vercel?
   - Can you connect to tunnel from another machine?

4. **Test Locally First:**
   ```bash
   # Set environment variables locally
   $env:ETIME_SQL_SERVER="eds-welcome-floating-prizes.trycloudflare.com"
   $env:ETIME_SQL_DB="etimetracklite1"
   # ... etc
   
   # Test API
   npm run dev
   # Visit: http://localhost:5000/api/clients
   ```

### 8. Update Environment Variables

If you need to update environment variables:

1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Update values
4. **Redeploy** (or wait for auto-deploy)

### 9. Permanent Tunnel Hostname

Quick tunnels change hostname each restart. For production:

1. Configure permanent hostname in Cloudflare dashboard
2. Update `ETIME_SQL_SERVER` in Vercel
3. Redeploy

See `configure-tunnel-routes.md` for instructions.

---

## Next Steps

1. Check `/api/health` endpoint for database config status
2. Review Vercel function logs for specific errors
3. Verify tunnel is running
4. Update environment variables if needed
5. Redeploy if variables were changed

