# Vercel Environment Variables Setup

After setting up Cloudflare Tunnel, configure these environment variables in Vercel.

## Steps

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project (gym website)
3. Go to **Settings** → **Environment Variables**
4. Add/Update the following variables:

## Required Environment Variables

### For Production (Cloudflare Tunnel)

```
LOCAL_API_URL=https://your-tunnel-url.run.app
```

**OR** if using custom domain:

```
LOCAL_API_URL=https://gym-api.yourdomain.com
```

### Enable API-Only Mode

```
USE_API_ONLY=true
SQL_DISABLED=true
```

### Other Variables (Keep Existing)

```
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
JWT_SECRET=your-secret-key
```

## How to Get Your Tunnel URL

### Option 1: Quick Tunnel (Temporary)
When you run:
```powershell
cloudflared tunnel --url http://localhost:3001
```

You'll see output like:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
|  https://random-name.trycloudflare.com                                                     |
+--------------------------------------------------------------------------------------------+
```

Use that URL for `LOCAL_API_URL`.

### Option 2: Named Tunnel (Production)
1. Create tunnel:
   ```powershell
   cloudflared tunnel create gym-api-tunnel
   ```

2. Check tunnel info:
   ```powershell
   cloudflared tunnel info gym-api-tunnel
   ```

3. If using custom domain, use that URL
4. Otherwise, check tunnel logs for the URL

## Verification

After setting environment variables:

1. **Redeploy** your Vercel project (or push a commit)
2. Test API endpoint: `https://your-app.vercel.app/api/health`
3. Check Vercel logs for any connection errors
4. Verify tunnel is running: `curl https://your-tunnel-url.run.app/health`

## Troubleshooting

### Vercel Can't Connect to Tunnel
- Verify tunnel is running: `cloudflared tunnel run gym-api-tunnel`
- Check tunnel URL is correct in Vercel env vars
- Test tunnel URL directly: `curl https://your-tunnel-url.run.app/health`
- Check Vercel function logs for connection errors

### Environment Variables Not Applied
- Make sure to redeploy after adding env vars
- Check environment scope (Production, Preview, Development)
- Verify variable names are exact (case-sensitive)

### Tunnel URL Changed
- Use named tunnel instead of quick tunnel
- Set up custom domain for stable URL
- Update Vercel env vars if URL changes

