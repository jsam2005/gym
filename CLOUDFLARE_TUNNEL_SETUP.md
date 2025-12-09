# Cloudflare Tunnel Setup Guide

This guide will help you set up Cloudflare Tunnel to connect your cloud-hosted backend to your local SQL Server database and middleware.

## Architecture Overview

- **Frontend**: Vercel (Cloud)
- **Backend**: Render (Cloud)
- **Database**: Local SQL Server (exposed via Cloudflare Tunnel)
- **Middleware**: Local eSSL eTimeTrackLite (stays local)

## Prerequisites

1. A Cloudflare account (free)
2. A domain name (optional, but recommended)
3. Local SQL Server running
4. GitHub account with private repository

---

## Step 1: Setup Cloudflare Tunnel on Local Server

### 1.1 Install Cloudflare Tunnel (Windows)

**Option A: Using winget (Recommended)**
```powershell
# Run PowerShell as Administrator
winget install Cloudflare.cloudflared
```

**Option B: Manual Download**
1. Download from: https://github.com/cloudflare/cloudflared/releases
2. Download `cloudflared-windows-amd64.exe`
3. Rename to `cloudflared.exe`
4. Place in `C:\cloudflared\` or add to PATH

### 1.2 Authenticate Cloudflare Tunnel

```powershell
# Open PowerShell
cloudflared tunnel login
```

This will:
- Open your browser
- Ask you to login to Cloudflare
- Authorize the tunnel
- Save credentials to `C:\Users\<YourUser>\.cloudflared\`

### 1.3 Create a Tunnel

```powershell
cloudflared tunnel create gym-sql-tunnel
```

**Important**: Note the Tunnel ID that appears (e.g., `abc123-def456-ghi789`)

### 1.4 Configure Tunnel

Create config file: `C:\Users\<YourUser>\.cloudflared\config.yml`

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: C:\Users\<YourUser>\.cloudflared\<TUNNEL_ID>.json

ingress:
  # Expose SQL Server (port 1433)
  - hostname: sql-tunnel.yourdomain.com
    service: tcp://localhost:1433
  
  # Catch-all rule (must be last)
  - service: http_status:404
```

**If you don't have a domain**, Cloudflare will assign a random hostname. You can use that instead.

### 1.5 Setup DNS (Optional but Recommended)

If you have a domain in Cloudflare:

```powershell
cloudflared tunnel route dns gym-sql-tunnel sql-tunnel.yourdomain.com
```

This creates a DNS record pointing to your tunnel.

### 1.6 Test Tunnel

```powershell
cloudflared tunnel run gym-sql-tunnel
```

You should see:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
|  https://sql-tunnel.yourdomain.com                                                         |
+--------------------------------------------------------------------------------------------+
```

**Keep this window open** - the tunnel must stay running.

### 1.7 Run Tunnel as Windows Service (Recommended)

**Option A: Using Cloudflare Service**

```powershell
# Install as service
cloudflared service install

# Start service
net start cloudflared
```

**Option B: Using Task Scheduler**

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Cloudflare Tunnel"
4. Trigger: "When the computer starts"
5. Action: "Start a program"
6. Program: `C:\cloudflared\cloudflared.exe`
7. Arguments: `tunnel run gym-sql-tunnel`
8. Start in: `C:\cloudflared\`

**Option C: Create Batch File**

Create `C:\cloudflared\start-tunnel.bat`:
```batch
@echo off
cd C:\cloudflared
cloudflared tunnel run gym-sql-tunnel
pause
```

---

## Step 2: Configure SQL Server

### 2.1 Enable TCP/IP

1. Open **SQL Server Configuration Manager**
2. Go to **SQL Server Network Configuration** → **Protocols for SQLEXPRESS**
3. Right-click **TCP/IP** → **Enable**
4. Right-click **TCP/IP** → **Properties**
5. Go to **IP Addresses** tab
6. Scroll to **IPAll**
7. Set **TCP Port** to `1433` (or note the port if different)
8. Click **OK**
9. Restart SQL Server service

### 2.2 Start SQL Server Browser

1. Open **Services** (services.msc)
2. Find **SQL Server Browser**
3. Right-click → **Start**
4. Right-click → **Properties** → Set to **Automatic**

### 2.3 Configure Firewall

1. Open **Windows Firewall**
2. Allow port **1433** (TCP) for SQL Server
3. Allow SQL Server Browser (UDP port 1434)

### 2.4 Test Local Connection

Test in SQL Server Management Studio:
- Server: `localhost\SQLEXPRESS` (or your instance name)
- Authentication: SQL Server Authentication
- Login: `essl`
- Password: your password

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Push Code to GitHub

```bash
# Make sure your repo is private
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 3.2 Connect to Vercel

1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click **New Project**
4. Import your **private** GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3.3 Set Environment Variables

In Vercel dashboard → Project Settings → Environment Variables:

- `VITE_API_URL` = `https://gym-api.onrender.com` (or your backend URL)

### 3.4 Deploy

Click **Deploy**. Vercel will:
- Build your frontend
- Deploy to CDN
- Give you a URL (e.g., `https://your-app.vercel.app`)

**Note**: Save this URL - you'll need it for backend configuration.

---

## Step 4: Deploy Backend to Render

### 4.1 Connect GitHub to Render

1. Go to https://render.com
2. Sign up/Login with GitHub
3. Authorize Render to access your **private** repositories

### 4.2 Create Web Service

1. Click **New** → **Web Service**
2. Connect your GitHub repository
3. Render will auto-detect `render.yaml`

### 4.3 Configure Environment Variables

In Render dashboard → Environment → Environment Variables:

Set these values:

```
ETIME_SQL_SERVER=sql-tunnel.yourdomain.com
ETIME_SQL_DB=etimetracklite1
ETIME_SQL_USER=essl
ETIME_SQL_PASSWORD=<your-sql-password>
ETIME_SQL_INSTANCE=SQLEXPRESS
FRONTEND_URL=https://your-app.vercel.app
```

**Important**: 
- Replace `sql-tunnel.yourdomain.com` with your actual Cloudflare Tunnel hostname
- Replace `your-app.vercel.app` with your actual Vercel URL
- Set your actual SQL password

### 4.4 Deploy

Render will:
- Build your backend
- Deploy to cloud
- Give you a URL (e.g., `https://gym-api.onrender.com`)

---

## Step 5: Update Frontend API URL

After backend is deployed:

1. Go to Vercel dashboard
2. Project Settings → Environment Variables
3. Update `VITE_API_URL` to your Render backend URL
4. Redeploy frontend (or wait for auto-deploy)

---

## Step 6: Verify Deployment

### 6.1 Check Tunnel Status

```powershell
cloudflared tunnel info gym-sql-tunnel
```

### 6.2 Test Backend Connection

Visit: `https://gym-api.onrender.com/api/health`

Should return: `{"status":"ok"}`

### 6.3 Test Database Connection

Check Render logs - you should see:
```
✅ Connected to SQL Server (Tracklie / eTimeTrack)
```

### 6.4 Test Frontend

Visit your Vercel URL and test the application.

---

## Troubleshooting

### Tunnel Connection Issues

**Problem**: Tunnel not connecting
- **Solution**: Check Cloudflare Tunnel is running
- **Solution**: Verify config.yml syntax
- **Solution**: Check credentials file exists

**Problem**: Backend can't connect to database
- **Solution**: Verify tunnel hostname in Render environment variables
- **Solution**: Check SQL Server Browser service is running
- **Solution**: Verify SQL Server allows remote connections
- **Solution**: Check firewall allows port 1433

### SQL Server Connection Issues

**Problem**: Connection timeout
- **Solution**: Increase timeout in database.ts (already done)
- **Solution**: Check SQL Server is running
- **Solution**: Verify SQL Server Browser service is started

**Problem**: Authentication failed
- **Solution**: Verify username/password in Render environment variables
- **Solution**: Check SQL Server authentication mode (Mixed Mode)

### Deployment Issues

**Problem**: Build fails on Render
- **Solution**: Check Render logs for errors
- **Solution**: Verify `render.yaml` syntax
- **Solution**: Ensure all dependencies are in package.json

**Problem**: Frontend can't connect to backend
- **Solution**: Verify `VITE_API_URL` in Vercel
- **Solution**: Check CORS settings in backend
- **Solution**: Verify backend URL is correct

---

## Auto-Deployment Setup

Both Vercel and Render support automatic deployment:

- **Vercel**: Auto-deploys on every push to `main` branch
- **Render**: Auto-deploys on every push to `main` branch (configured in render.yaml)

**To deploy**:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Both platforms will automatically:
1. Detect the push
2. Build the application
3. Deploy to production

---

## Security Best Practices

1. **Never commit secrets**: Use environment variables
2. **Use strong passwords**: For SQL Server and JWT
3. **Keep tunnel running**: Use Windows Service or Task Scheduler
4. **Monitor logs**: Check Render and Vercel logs regularly
5. **Update regularly**: Keep dependencies updated

---

## Cost Summary

- **Vercel**: Free tier (frontend)
- **Render**: Free tier (backend)
- **Cloudflare Tunnel**: Free
- **Total**: $0/month

---

## Support

If you encounter issues:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check Vercel logs: Dashboard → Your Project → Deployments → View Logs
3. Check Cloudflare Tunnel: `cloudflared tunnel info gym-sql-tunnel`
4. Test SQL Server locally first

---

## Next Steps

1. ✅ Setup Cloudflare Tunnel
2. ✅ Deploy Frontend to Vercel
3. ✅ Deploy Backend to Render
4. ✅ Configure Environment Variables
5. ✅ Test Application
6. ✅ Setup Auto-Deployment

Your application is now live! 🎉

