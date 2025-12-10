# Deploy Frontend to Vercel - Step by Step

## Prerequisites
- ✅ Backend running locally on port 5000
- ✅ Vercel account (free at vercel.com)
- ✅ GitHub repository with your code

---

## Step 1: Expose Local Backend

Your backend needs to be accessible from the internet. Choose one method:

### Method 1: Cloudflare Tunnel (Easiest)

```powershell
# Option A: Use the script (starts backend + tunnel)
.\START_WITH_TUNNEL.ps1

# Option B: Manual (if backend already running)
cloudflared tunnel --url http://localhost:5000
```

**Copy the tunnel URL** (e.g., `https://xxxxx.trycloudflare.com`)

### Method 2: ngrok

```powershell
ngrok http 5000
```

**Copy the ngrok URL** (e.g., `https://xxxxx.ngrok.io`)

### Method 3: localhost.run

```powershell
ssh -R 80:localhost:5000 ssh.localhost.run
```

**Copy the URL** (e.g., `https://xxxxx.localhost.run`)

---

## Step 2: Deploy Frontend to Vercel

### Via Vercel Dashboard (Recommended)

1. **Go to vercel.com** and sign in

2. **Click "New Project"**

3. **Import your GitHub repository**
   - Select your gym repository
   - Click "Import"

4. **Configure Project Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend` ⚠️ **IMPORTANT!**
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

5. **Set Environment Variable:**
   - Click "Environment Variables"
   - Add new variable:
     - **Name:** `VITE_API_URL`
     - **Value:** `https://your-tunnel-url.trycloudflare.com/api`
     - Replace `your-tunnel-url` with your actual tunnel URL from Step 1
     - Select "Production", "Preview", and "Development"
     - Click "Save"

6. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your frontend will be live!

### Via Vercel CLI (Alternative)

```powershell
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variable
vercel env add VITE_API_URL
# Enter: https://your-tunnel-url.trycloudflare.com/api
# Select: Production, Preview, Development

# Deploy to production
vercel --prod
```

---

## Step 3: Verify Deployment

1. **Visit your Vercel URL** (e.g., `https://your-app.vercel.app`)

2. **Check Browser Console** (F12) for any API errors

3. **Test API Connection:**
   - Open browser console
   - Check Network tab
   - Verify API calls are going to your tunnel URL

---

## Step 4: Keep Backend + Tunnel Running

**Important:** Your backend and tunnel must be running whenever someone accesses your Vercel frontend.

### Daily Workflow:

```powershell
# Terminal 1: Start backend (if not already running)
cd backend
npm run dev

# Terminal 2: Start tunnel
cloudflared tunnel --url http://localhost:5000
# Copy the URL

# If tunnel URL changed:
# 1. Go to Vercel Dashboard → Settings → Environment Variables
# 2. Update VITE_API_URL with new tunnel URL
# 3. Redeploy (or it will auto-redeploy on next push)
```

---

## Troubleshooting

### Frontend Can't Connect to Backend

1. **Check tunnel is running:**
   - Verify tunnel URL is accessible in browser
   - Test: Open tunnel URL in browser, should see backend response

2. **Check Vercel environment variable:**
   - Go to Vercel → Settings → Environment Variables
   - Verify `VITE_API_URL` is set correctly
   - Make sure it includes `/api` at the end
   - Redeploy after changing

3. **Check backend is running:**
   - Verify backend is on port 5000
   - Test: `http://localhost:5000/api/health`

4. **Check CORS:**
   - Backend should allow requests from your Vercel domain
   - Check `backend/src/server.ts` for CORS configuration

### Tunnel URL Changed

If tunnel URL changes (happens with quick tunnels):

1. Get new tunnel URL
2. Update `VITE_API_URL` in Vercel
3. Redeploy frontend

**Tip:** Use Cloudflare Named Tunnel for permanent URL (see VERCEL_FRONTEND_SETUP.md)

### Build Fails on Vercel

1. Check Vercel build logs
2. Verify `frontend/package.json` has all dependencies
3. Check `frontend/vercel.json` configuration
4. Ensure root directory is set to `frontend`

---

## Quick Reference

| Task | Command/URL |
|------|-------------|
| **Start Backend + Tunnel** | `.\START_WITH_TUNNEL.ps1` |
| **Vercel Dashboard** | vercel.com |
| **Update Env Var** | Vercel → Settings → Environment Variables |
| **Redeploy** | Vercel → Deployments → Redeploy |

---

## Next Steps

1. ✅ Backend running locally
2. ✅ Tunnel running (exposing backend)
3. ✅ Frontend deployed to Vercel
4. ✅ Environment variable set
5. 🎉 Your app is live!

**Remember:** Keep backend and tunnel running for your app to work!

