# Vercel Environment Variable Setup

## Current Tunnel URL

```
https://appreciation-caps-dodge-pairs.trycloudflare.com
```

## Required Environment Variable

**Name:** `VITE_API_URL`  
**Value:** `https://appreciation-caps-dodge-pairs.trycloudflare.com/api`  
**Environments:** Production, Preview, Development (select all)

## How to Set in Vercel

1. Go to **vercel.com**
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://appreciation-caps-dodge-pairs.trycloudflare.com/api`
   - **Environments:** Check all (Production, Preview, Development)
6. Click **Save**

## After Setting

**IMPORTANT:** You must redeploy for the environment variable to take effect:

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger auto-deploy

## Verify It's Working

After redeploy, check:
1. Open your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Open browser console (F12)
3. Check Network tab
4. API calls should go to: `https://appreciation-caps-dodge-pairs.trycloudflare.com/api`

## If Tunnel URL Changes

If you restart the tunnel and get a new URL:
1. Update `VITE_API_URL` in Vercel with new URL
2. Redeploy frontend

## Troubleshooting

### Still seeing localhost errors?
- ✅ Check environment variable is set correctly
- ✅ Check you selected all environments (Production, Preview, Development)
- ✅ Make sure you redeployed after setting the variable
- ✅ Check tunnel is still running

### Build succeeded but API calls fail?
- ✅ Verify tunnel is running
- ✅ Test tunnel URL directly: `https://appreciation-caps-dodge-pairs.trycloudflare.com/api/health`
- ✅ Check backend is running on port 5001



