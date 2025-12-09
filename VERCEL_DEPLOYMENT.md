# Vercel Deployment Guide - Full Stack (Frontend + Backend)

This guide will help you deploy both frontend and backend to Vercel with Cloudflare Tunnel for local database connection.

## Architecture Overview

- **Frontend**: Vercel (Static Site)
- **Backend**: Vercel (Serverless Functions)
- **Database**: Local SQL Server (exposed via Cloudflare Tunnel)
- **Middleware**: Local eSSL eTimeTrackLite (stays local)

## Prerequisites

1. A Cloudflare account (free)
2. A domain name (optional, but recommended)
3. Local SQL Server running
4. GitHub account with **private** repository
5. Vercel account (free)

---

## Step 1: Setup Cloudflare Tunnel (Local Server)

### 1.1 Install Cloudflare Tunnel

**Option A: Using Installation Script (Easiest - Recommended)**

1. **Run the installation script:**
   ```powershell
   # Right-click PowerShell and select "Run as Administrator"
   # Navigate to your project directory
   cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
   
   # Run the script
   .\install-cloudflared.ps1
   ```

   The script will:
   - Download cloudflared automatically
   - Install to `C:\cloudflared\`
   - Add to system PATH
   - Verify installation

**Option B: Manual Download**

1. **Download Cloudflare Tunnel:**
   - Go to: https://github.com/cloudflare/cloudflared/releases/latest
   - Download: `cloudflared-windows-amd64.exe` (or `cloudflared-windows-386.exe` for 32-bit)
   - Save to: `C:\cloudflared\cloudflared.exe`

2. **Add to PATH:**
   ```powershell
   # Run PowerShell as Administrator
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\cloudflared", [EnvironmentVariableTarget]::Machine)
   
   # Restart PowerShell or reload PATH:
   $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
   ```

3. **Verify Installation:**
   ```powershell
   cloudflared --version
   ```

**Option C: Using winget (if available)**
```powershell
# Check if winget is available
winget --version

# If available, install:
winget install Cloudflare.cloudflared
```

**Option D: Using Chocolatey (if installed)**
```powershell
choco install cloudflared
```

**Option E: Using Scoop (if installed)**
```powershell
scoop install cloudflared
```

**See `CLOUDFLARE_TUNNEL_INSTALL.md` for detailed installation instructions.**

### 1.2 Authenticate

```powershell
cloudflared tunnel login
```

### 1.3 Create Tunnel

```powershell
cloudflared tunnel create gym-sql-tunnel
```

**Note the Tunnel ID** (e.g., `abc123-def456-ghi789`)

### 1.4 Configure Tunnel

Create `C:\Users\<YourUser>\.cloudflared\config.yml`:

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: C:\Users\<YourUser>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: sql-tunnel.yourdomain.com
    service: tcp://localhost:1433
  - service: http_status:404
```

### 1.5 Setup DNS (Optional)

```powershell
cloudflared tunnel route dns gym-sql-tunnel sql-tunnel.yourdomain.com
```

### 1.6 Run Tunnel

```powershell
cloudflared tunnel run gym-sql-tunnel
```

**Keep this running** or setup as Windows Service.

---

## Step 2: Configure SQL Server

### 2.1 Enable TCP/IP

1. Open **SQL Server Configuration Manager**
2. **SQL Server Network Configuration** → **Protocols for SQLEXPRESS**
3. Right-click **TCP/IP** → **Enable**
4. Right-click **TCP/IP** → **Properties** → **IP Addresses** → **IPAll**
5. Set **TCP Port** to `1433`
6. **OK** → Restart SQL Server service

### 2.2 Start SQL Server Browser

1. Open **Services** (services.msc)
2. Find **SQL Server Browser**
3. Right-click → **Start** → Set to **Automatic**

### 2.3 Configure Firewall

Allow port **1433** (TCP) in Windows Firewall.

---

## Step 3: Prepare Code for Deployment

### 3.1 Ensure Code is in GitHub (Private Repo)

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 3.2 Verify File Structure

Your repository should have:
```
Lovable_gym/
├── api/
│   └── serverless.js          # Vercel serverless function
├── backend/
│   ├── src/
│   ├── dist/                  # Built backend
│   └── package.json
├── frontend/
│   ├── src/
│   ├── dist/                  # Built frontend
│   └── package.json
├── vercel.json                # Vercel configuration
└── package.json
```

---

## Step 4: Deploy to Vercel

### 4.1 Connect GitHub to Vercel

1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Authorize Vercel to access your **private** repositories

### 4.2 Create New Project

1. Click **New Project**
2. Import your **private** GitHub repository
3. Vercel will auto-detect configuration

### 4.3 Configure Build Settings

Vercel should auto-detect from `vercel.json`, but verify:

- **Framework Preset**: Other
- **Root Directory**: `./` (root)
- **Build Command**: `cd backend && npm install && npm run build && cd ../frontend && npm install && npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: (leave empty, handled in build)

### 4.4 Set Environment Variables

In Vercel dashboard → **Settings** → **Environment Variables**, add:

#### Backend/Database Variables:
```
ETIME_SQL_SERVER=sql-tunnel.yourdomain.com
ETIME_SQL_DB=etimetracklite1
ETIME_SQL_USER=essl
ETIME_SQL_PASSWORD=<your-sql-password>
ETIME_SQL_INSTANCE=SQLEXPRESS
SQL_DISABLED=false
USE_API_ONLY=false
```

#### Frontend Variables:
```
VITE_API_URL=https://your-project.vercel.app
```

#### Other Variables:
```
NODE_ENV=production
JWT_SECRET=<generate-a-secure-random-string>
FRONTEND_URL=https://your-project.vercel.app
```

**Important**: 
- Replace `sql-tunnel.yourdomain.com` with your actual Cloudflare Tunnel hostname
- Replace `your-project.vercel.app` with your actual Vercel URL (you'll get this after first deploy)
- Set your actual SQL password

### 4.5 Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Note your deployment URL (e.g., `https://your-project.vercel.app`)

### 4.6 Update Frontend API URL

After first deployment:

1. Go to **Settings** → **Environment Variables**
2. Update `VITE_API_URL` to your Vercel URL
3. **Redeploy** (or wait for auto-deploy on next push)

---

## Step 5: Verify Deployment

### 5.1 Test Backend API

Visit: `https://your-project.vercel.app/api/health`

Should return:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "...",
  "platform": "Vercel Serverless"
}
```

### 5.2 Test Frontend

Visit: `https://your-project.vercel.app`

Should load your React app.

### 5.3 Test Database Connection

Check Vercel logs:
1. Go to **Deployments** → Click latest deployment
2. Click **Functions** tab
3. Check logs for database connection messages

You should see:
```
✅ Connected to SQL Server (Tracklie / eTimeTrack)
```

---

## Step 6: Auto-Deployment Setup

Vercel automatically deploys on every push to `main` branch.

**To deploy updates:**
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will:
1. Detect the push
2. Build frontend and backend
3. Deploy to production
4. Update your site automatically

---

## Troubleshooting

### Build Fails

**Problem**: Build command fails
- **Solution**: Check Vercel build logs
- **Solution**: Ensure all dependencies are in package.json
- **Solution**: Verify Node.js version (18+)

**Problem**: Backend build fails
- **Solution**: Check `backend/package.json` scripts
- **Solution**: Verify TypeScript compilation
- **Solution**: Check for TypeScript errors

**Problem**: Frontend build fails
- **Solution**: Check `frontend/package.json` scripts
- **Solution**: Verify Vite configuration
- **Solution**: Check for build errors

### Runtime Issues

**Problem**: API routes return 404
- **Solution**: Verify `vercel.json` rewrites configuration
- **Solution**: Check `api/serverless.js` exists
- **Solution**: Verify routes are exported correctly

**Problem**: Database connection fails
- **Solution**: Verify Cloudflare Tunnel is running
- **Solution**: Check environment variables in Vercel
- **Solution**: Verify SQL Server is accessible
- **Solution**: Check tunnel hostname is correct

**Problem**: Frontend can't connect to backend
- **Solution**: Verify `VITE_API_URL` environment variable
- **Solution**: Check CORS settings
- **Solution**: Verify API routes are working

### Socket.io Issues

**Note**: Socket.io may have limitations in serverless environments. Real-time features might not work perfectly. Consider:
- Using polling instead of websockets
- Using a separate service for real-time features
- Using Vercel's Edge Functions for better WebSocket support (if available)

---

## Important Notes

### Serverless Limitations

1. **Socket.io**: May not work perfectly in serverless (cold starts, connection limits)
2. **Long-running processes**: Not supported (use external services)
3. **File uploads**: Use Vercel Blob or external storage
4. **Background jobs**: Use external cron services or Vercel Cron

### Database Connection

- Cloudflare Tunnel must be running continuously
- Consider using a VPS or always-on service for the tunnel
- Monitor tunnel connection status

### Environment Variables

- Never commit secrets to GitHub
- Use Vercel environment variables
- Different values for Production, Preview, Development

---

## Cost Summary

- **Vercel**: Free tier (100GB bandwidth, 100GB build minutes)
- **Cloudflare Tunnel**: Free
- **Total**: $0/month (for small-medium traffic)

---

## Next Steps

1. ✅ Setup Cloudflare Tunnel
2. ✅ Configure SQL Server
3. ✅ Deploy to Vercel
4. ✅ Set Environment Variables
5. ✅ Test Application
6. ✅ Setup Auto-Deployment

Your application is now live on Vercel! 🎉

---

## Support

If you encounter issues:
1. Check Vercel logs: Dashboard → Deployments → Logs
2. Check Cloudflare Tunnel: `cloudflared tunnel info gym-sql-tunnel`
3. Test SQL Server locally first
4. Verify environment variables are set correctly

