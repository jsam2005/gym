# Vercel Frontend + Local Backend Setup

This guide explains how to host your frontend on Vercel while keeping your backend, middleware, and database running locally.

## 🎯 Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  Vercel (Cloud) │  ──────▶│  Local Backend   │
│   Frontend Only │         │  Port 5000        │
└─────────────────┘         └──────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │  Local SQL DB    │
                            │  + Middleware    │
                            └──────────────────┘
```

## 📋 Prerequisites

1. **Vercel account** (free at vercel.com)
2. **GitHub repository** (your code)
3. **Local backend running** on port 5000
4. **Tunnel service** to expose local backend (see options below)

---

## 🚀 Setup Steps

### Step 1: Expose Local Backend

Your local backend needs to be accessible from the internet. Choose one option:

#### Option A: Cloudflare Tunnel (Recommended - Free)

1. **Install Cloudflare Tunnel:**
   ```powershell
   # Download from: https://github.com/cloudflare/cloudflared/releases
   # Or use: winget install --id Cloudflare.cloudflared
   ```

2. **Login:**
   ```powershell
   cloudflared tunnel login
   ```

3. **Create Quick Tunnel:**
   ```powershell
   cloudflared tunnel --url http://localhost:5000
   ```
   This will give you a URL like: `https://xxxxx.trycloudflare.com`

4. **Keep this running** - this exposes your local backend

#### Option B: ngrok (Simple - Free with limitations)

1. **Install ngrok:**
   ```powershell
   # Download from: https://ngrok.com/download
   # Or: winget install ngrok
   ```

2. **Start tunnel:**
   ```powershell
   ngrok http 5000
   ```
   This will give you a URL like: `https://xxxxx.ngrok.io`

3. **Keep this running**

#### Option C: localhost.run (SSH-based - Free)

1. **Start tunnel:**
   ```powershell
   ssh -R 80:localhost:5000 ssh.localhost.run
   ```
   This will give you a URL like: `https://xxxxx.localhost.run`

---

### Step 2: Configure Frontend for Vercel

1. **Update Frontend API Configuration**

   The frontend is already configured to use environment variables. You just need to set them in Vercel.

2. **Deploy to Vercel:**

   **Method 1: Via Vercel Dashboard**
   - Go to vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - **Root Directory:** Set to `frontend` (important!)
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

   **Method 2: Via Vercel CLI**
   ```powershell
   npm i -g vercel
   cd frontend
   vercel
   ```

3. **Set Environment Variables in Vercel:**

   Go to your Vercel project → Settings → Environment Variables

   Add:
   ```
   VITE_API_URL=https://your-tunnel-url.trycloudflare.com/api
   ```
   Replace `your-tunnel-url` with your actual tunnel URL from Step 1.

4. **Redeploy:**
   - Go to Deployments tab
   - Click "Redeploy" on latest deployment
   - Or push a new commit to trigger auto-deploy

---

### Step 3: Keep Local Backend Running

Your local backend must be running whenever someone accesses your Vercel frontend.

**Start Local Backend:**
```powershell
cd backend
npm run dev
```

**Keep Tunnel Running:**
```powershell
# Cloudflare Tunnel
cloudflared tunnel --url http://localhost:5000

# OR ngrok
ngrok http 5000

# OR localhost.run
ssh -R 80:localhost:5000 ssh.localhost.run
```

---

## 🔄 Daily Workflow

### Start Everything:
```powershell
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start tunnel
cloudflared tunnel --url http://localhost:5000
# Copy the URL (e.g., https://xxxxx.trycloudflare.com)

# Terminal 3: Update Vercel env var if tunnel URL changed
# Go to Vercel Dashboard → Settings → Environment Variables
# Update VITE_API_URL with new tunnel URL
# Redeploy
```

### Stop Everything:
- Close backend terminal (Ctrl+C)
- Close tunnel terminal (Ctrl+C)

---

## 📝 Important Notes

### Tunnel URLs Change
- **Cloudflare Quick Tunnel:** URL changes every time you restart
- **ngrok Free:** URL changes every time you restart
- **Solution:** Update `VITE_API_URL` in Vercel and redeploy when tunnel restarts

### For Stable URLs:
- Use **Cloudflare Named Tunnel** (permanent URL)
- Use **ngrok Paid** (reserved domain)
- Use **localhost.run** with custom domain

### Security:
- Your local backend is exposed to the internet
- Consider adding authentication/rate limiting
- Use HTTPS tunnels (all options above provide HTTPS)

---

## 🛠️ Troubleshooting

### Frontend Can't Connect to Backend
1. Check tunnel is running
2. Verify `VITE_API_URL` in Vercel matches tunnel URL
3. Check backend is running on port 5000
4. Verify tunnel URL is accessible: Open tunnel URL in browser

### Tunnel URL Changed
1. Get new tunnel URL
2. Update `VITE_API_URL` in Vercel
3. Redeploy frontend

### Backend Not Starting
1. Check port 5000 is not in use: `netstat -ano | findstr :5000`
2. Check SQL Server is running
3. Check `backend/.env` configuration

---

## 🎯 Quick Start Script

Create `START_WITH_TUNNEL.ps1`:

```powershell
# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

Start-Sleep -Seconds 3

# Start Tunnel
Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host "Copy the URL and update VITE_API_URL in Vercel" -ForegroundColor Cyan
cloudflared tunnel --url http://localhost:5000
```

---

## ✅ Benefits

- ✅ Frontend hosted on Vercel (fast, global CDN)
- ✅ Backend stays local (direct DB access)
- ✅ Middleware stays local
- ✅ Database stays local
- ✅ Free hosting for frontend
- ✅ Easy updates (just push to GitHub)

---

## 🔐 Security Recommendations

1. **Add API Authentication** to your backend
2. **Use Rate Limiting** to prevent abuse
3. **Monitor Tunnel Logs** for suspicious activity
4. **Consider VPN** instead of public tunnel for production
5. **Use Environment Variables** for sensitive data

---

## 📞 Need Help?

- Check tunnel is running and accessible
- Verify Vercel environment variables are set
- Check browser console for API errors
- Verify backend logs for incoming requests

