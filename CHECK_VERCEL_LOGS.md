# Check Vercel Logs - Critical Step

## ⚠️ You're Still Getting 500 Errors

To fix this, we need to see the **actual error** from Vercel logs.

## Step 1: Check Vercel Function Logs

**Go to Vercel Dashboard:**

1. Open: https://vercel.com/dashboard
2. Click on your project: **gym**
3. Go to: **Deployments** → **Latest Deployment**
4. Click: **Functions** tab
5. Find: `/api/serverless` function
6. Click: **View Function Logs** or **Logs** tab

**Look for:**
- Red error messages
- Database connection errors
- "Cannot find module" errors
- "ETIME_SQL_SERVER" related errors
- Any stack traces

**Copy the error message** and share it.

## Step 2: Test Debug Endpoint

**Open in browser:**
```
https://gym-zeta-teal.vercel.app/api/debug
```

**What to check:**
- Does it return JSON?
- Is `ETIME_SQL_SERVER` showing `"***set***"` or `"not set"`?
- What values are shown?

## Step 3: Verify Environment Variables

**In Vercel Dashboard:**
1. Go to: **Settings** → **Environment Variables**
2. Verify these are set:

```
ETIME_SQL_SERVER=reasoning-virtual-downloadable-edt.trycloudflare.com
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
- Make sure `ETIME_SQL_SERVER` matches your current tunnel hostname
- Check if variables are set for **Production** environment (not just Preview)

## Step 4: Check Deployment Status

**In Vercel Dashboard:**
1. Go to: **Deployments**
2. Check the latest deployment:
   - Is it **Ready** or **Building**?
   - Any build errors?
   - Check build logs

## Common Issues

### Issue 1: Environment Variable Not Set
**Symptom:** Debug endpoint shows `"not set"`
**Fix:** Add/update environment variables in Vercel

### Issue 2: Wrong Hostname
**Symptom:** Database connection timeout
**Fix:** Update `ETIME_SQL_SERVER` to match current tunnel hostname

### Issue 3: Tunnel Not Running
**Symptom:** Connection refused errors
**Fix:** Start tunnel: `.\start-quick-tunnel.ps1`

### Issue 4: Build Failed
**Symptom:** Deployment shows errors
**Fix:** Check build logs for TypeScript/import errors

### Issue 5: Module Not Found
**Symptom:** "Cannot find module" in logs
**Fix:** Backend might not be built - check if `backend/dist` exists

## What to Share

Please share:
1. **Vercel function logs** (from Step 1)
2. **Debug endpoint output** (from Step 2)
3. **Environment variables status** (from Step 3)
4. **Deployment status** (from Step 4)

This will help identify the exact issue!

