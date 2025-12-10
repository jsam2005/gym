# Vercel Environment Variables Setup

## Your Tunnel URL

```
LOCAL_API_URL=https://kevin-verified-rocket-paragraph.trycloudflare.com
```

**Note:** Quick tunnel URLs change each time you restart the tunnel. For production, consider creating a named tunnel for a stable URL.

## Steps to Configure Vercel

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Select your gym project

### 2. Navigate to Environment Variables
- Click **Settings** (top menu)
- Click **Environment Variables** (left sidebar)

### 3. Add/Update These Variables

#### Required Variables:

**LOCAL_API_URL**
```
https://kevin-verified-rocket-paragraph.trycloudflare.com
```
- Environment: Production, Preview, Development (select all)
- Click **Save**

**USE_API_ONLY**
```
true
```
- Environment: Production, Preview, Development (select all)
- Click **Save**

**SQL_DISABLED**
```
true
```
- Environment: Production, Preview, Development (select all)
- Click **Save**

#### Keep Existing Variables:

Make sure these are still set:
- `FRONTEND_URL` = Your Vercel app URL
- `NODE_ENV` = `production`
- `JWT_SECRET` = Your secret key

### 4. Redeploy Your Project

After adding environment variables:
1. Go to **Deployments** tab
2. Click **...** (three dots) on latest deployment
3. Click **Redeploy**
4. OR push a new commit to trigger auto-deploy

### 5. Test the Setup

1. Wait for deployment to complete
2. Visit your Vercel app: `https://your-app.vercel.app`
3. Test API endpoints:
   - `/api/health` - Should return OK
   - `/api/clients` - Should fetch clients from local DB
   - `/api/dashboard/stats` - Should show dashboard data

### 6. Monitor Logs

- Go to Vercel Dashboard → Your Project → **Logs**
- Check for any connection errors
- Should see successful API calls to tunnel URL

## Important Notes

⚠️ **Quick Tunnel URLs Expire**
- This URL (`kevin-verified-rocket-paragraph.trycloudflare.com`) will change if you restart the tunnel
- For production, consider creating a **named tunnel** for stable URL
- See `CLOUDFLARE_TUNNEL_SETUP.md` for named tunnel setup

✅ **Keep Tunnel Running**
- The tunnel must be running continuously for Vercel to access your local API
- Use `start-production.ps1` to keep both services running
- Consider setting up auto-start on Windows boot

## Troubleshooting

### Vercel Can't Connect to Tunnel
- Verify tunnel is running: Check PowerShell window
- Test tunnel URL: `curl https://kevin-verified-rocket-paragraph.trycloudflare.com/health`
- Check Vercel logs for connection errors
- Ensure `LOCAL_API_URL` is set correctly (no trailing slash)

### Tunnel URL Changed
- If you restarted tunnel, get new URL: `.\get-tunnel-url.ps1`
- Update `LOCAL_API_URL` in Vercel
- Redeploy project

### API Calls Fail
- Check local API server is running
- Verify database connection in `api-server.log`
- Check tunnel logs for errors
- Verify environment variables are set for correct environment (Production)

## Next Steps

1. ✅ Set up Vercel environment variables (this guide)
2. ✅ Redeploy project
3. ✅ Test API endpoints
4. 🔄 Set up named tunnel for stable URL (optional)
5. 🔄 Configure auto-start on boot (optional)
6. 🔄 Set up monitoring/uptime checks (optional)

