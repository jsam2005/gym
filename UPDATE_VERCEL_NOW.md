# ⚠️ URGENT: Update Vercel with New Hostname

## 🎯 Your Current Tunnel Hostname

**NEW Hostname:**
```
reasoning-virtual-downloadable-edt.trycloudflare.com
```

**Status:** ✅ Tunnel is running and connected!

## 🔧 Update Vercel NOW

### Step 1: Go to Vercel Dashboard

1. Open: https://vercel.com/dashboard
2. Click on your project: **gym**
3. Go to: **Settings** → **Environment Variables**

### Step 2: Update ETIME_SQL_SERVER

1. Find the variable: `ETIME_SQL_SERVER`
2. Click **Edit** (pencil icon)
3. Change the value to:
   ```
   reasoning-virtual-downloadable-edt.trycloudflare.com
   ```
4. Click **Save**

### Step 3: Verify All Variables

Make sure these are ALL set:

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

### Step 4: Wait for Redeploy

- Vercel will automatically redeploy after you save
- Wait 1-2 minutes for deployment to complete

### Step 5: Test

After redeploy, test these URLs:

1. **Debug endpoint:**
   ```
   https://gym-zeta-teal.vercel.app/api/debug
   ```
   Should show: `ETIME_SQL_SERVER: "***set***"`

2. **Health endpoint:**
   ```
   https://gym-zeta-teal.vercel.app/api/health
   ```
   Should show: `connectionStatus: "connected"`

3. **API endpoint:**
   ```
   https://gym-zeta-teal.vercel.app/api/clients
   ```
   Should return data (not 500 error)

## ⚠️ Important Notes

### Hostname Changes Each Restart

**Every time you restart the tunnel, you get a NEW hostname!**

**Solutions:**

1. **Keep tunnel running** - Don't restart it
2. **Update Vercel** - When hostname changes, update Vercel immediately
3. **Use named tunnel** - For permanent hostname (set up later)

### Current Status

✅ Tunnel: Running  
✅ Connection: Registered  
✅ Hostname: `reasoning-virtual-downloadable-edt.trycloudflare.com`  
⏳ Vercel: Needs update  

## 🚀 After Update

Once you update Vercel and it redeploys:
- 500 errors should stop
- API endpoints should work
- Database connection should succeed

## 📝 Quick Reference

**Current Hostname:**
```
reasoning-virtual-downloadable-edt.trycloudflare.com
```

**Vercel Variable to Update:**
```
ETIME_SQL_SERVER=reasoning-virtual-downloadable-edt.trycloudflare.com
```

**Keep Tunnel Running!** Don't close the PowerShell window.

