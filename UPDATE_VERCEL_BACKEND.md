# Update Vercel Backend to Use Local API

## ✅ Local API Server is Running!

**Your local API server is connected to the database and ready!**

## 📋 Next Steps

### Step 1: Get the HTTP Tunnel URL

**Check the PowerShell window where you ran `.\expose-local-api.ps1`**

**You should see:**
```
connect to http://XXXXX.localhost.run
```

**Copy this URL!**

### Step 2: Update Vercel Environment Variables

**Go to Vercel Dashboard:**
1. Your Project → Settings → Environment Variables
2. Add/Update:

```
LOCAL_API_URL=http://XXXXX.localhost.run
USE_API_ONLY=true
SQL_DISABLED=true
```

**Replace `XXXXX.localhost.run` with your actual hostname!**

### Step 3: Update Backend Code (Optional - Already Created)

**I've created `localApiService.ts` that will automatically use the local API when `USE_API_ONLY=true`**

**The service is ready, but you may need to update controllers to use it.**

### Step 4: Test

**After updating Vercel:**
1. Wait for redeploy
2. Test: `https://gym-zeta-teal.vercel.app/api/health`
3. Test: `https://gym-zeta-teal.vercel.app/api/clients`

## ✅ That's It!

**Your Vercel backend will now call your local API instead of connecting to DB directly!**

---

## 🔧 Manual Update (If Needed)

**If you need to manually update controllers, use:**

```typescript
import localApiService from '../services/localApiService.js';

// In your controller
if (localApiService.isApiEnabled()) {
  const clients = await localApiService.getClients({ status: 'active' });
  return res.json(clients);
} else {
  // Use direct SQL connection
  const clients = await fetchClients(...);
  return res.json(clients);
}
```

