# Next Steps - Cloudflare Tunnel Setup Complete! 🎉

## ✅ What We've Completed

1. ✅ Installed Cloudflare Tunnel
2. ✅ Created tunnel: `gym-sql-tunnel`
3. ✅ Retrieved credentials file
4. ✅ Created config file
5. ✅ Tunnel is running

## 🔍 Step 1: Verify Tunnel is Working

### Check Tunnel Output

In the PowerShell window where you ran `cloudflared tunnel run gym-sql-tunnel`, you should see:

```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at:                                         |
|  tcp://<hostname>.trycloudflare.com:1433                                                  |
+--------------------------------------------------------------------------------------------+
```

**IMPORTANT**: Copy the hostname (e.g., `abc123.trycloudflare.com`) - you'll need it for Vercel!

### If You Don't See Output

Check if the tunnel is running:
```powershell
Get-Process cloudflared -ErrorAction SilentlyContinue
```

If it's running, check the logs or restart it to see the output.

---

## 🚀 Step 2: Deploy Frontend to Vercel

### 2.1 Push Code to GitHub (Private Repo)

```bash
# Make sure your code is committed
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2.2 Connect to Vercel

1. Go to: https://vercel.com
2. Sign up/Login with GitHub
3. Click **New Project**
4. Import your **private** GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2.3 Set Environment Variables

In Vercel dashboard → **Settings** → **Environment Variables**:

- `VITE_API_URL` = `https://your-project.vercel.app` (you'll get this after first deploy)

### 2.4 Deploy

Click **Deploy**. Vercel will build and deploy your frontend.

**Note**: Save the Vercel URL (e.g., `https://your-app.vercel.app`) - you'll need it for backend configuration.

---

## 🔧 Step 3: Deploy Backend to Vercel

### 3.1 Update vercel.json (Already Done)

The `vercel.json` file is already configured at the root of your project.

### 3.2 Set Environment Variables in Vercel

In Vercel dashboard → **Settings** → **Environment Variables**, add:

#### Database Connection (via Cloudflare Tunnel):
```
ETIME_SQL_SERVER=<tunnel-hostname-from-step-1>
ETIME_SQL_DB=etimetracklite1
ETIME_SQL_USER=essl
ETIME_SQL_PASSWORD=<your-sql-password>
ETIME_SQL_INSTANCE=SQLEXPRESS
SQL_DISABLED=false
USE_API_ONLY=false
```

#### Other Variables:
```
NODE_ENV=production
JWT_SECRET=<generate-a-secure-random-string>
FRONTEND_URL=<your-vercel-frontend-url>
```

**Important**: 
- Replace `<tunnel-hostname-from-step-1>` with the hostname from Step 1 (e.g., `abc123.trycloudflare.com`)
- Replace `<your-sql-password>` with your actual SQL Server password
- Replace `<your-vercel-frontend-url>` with your frontend URL from Step 2

### 3.3 Deploy

Vercel will automatically detect the `vercel.json` and deploy both frontend and backend.

---

## ✅ Step 4: Verify Deployment

### 4.1 Test Backend API

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

### 4.2 Test Database Connection

Check Vercel logs:
1. Go to Vercel dashboard
2. Your project → **Deployments** → Click latest deployment
3. Click **Functions** tab
4. Check logs for database connection messages

You should see:
```
✅ Connected to SQL Server (Tracklie / eTimeTrack)
```

### 4.3 Test Frontend

Visit your Vercel URL and test the application.

---

## 🔄 Step 5: Keep Tunnel Running

### Option A: Keep PowerShell Window Open

The tunnel must stay running. Keep the PowerShell window open.

### Option B: Run as Windows Service (Recommended)

Create a batch file to run tunnel on startup:

1. Create `C:\cloudflared\start-tunnel.bat`:
```batch
@echo off
cd C:\cloudflared
cloudflared tunnel run gym-sql-tunnel
```

2. Add to Windows Startup:
   - Press `Win + R`
   - Type: `shell:startup`
   - Create shortcut to the batch file

### Option C: Use Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Cloudflare Tunnel"
4. Trigger: "When the computer starts"
5. Action: "Start a program"
6. Program: `C:\cloudflared\cloudflared.exe`
7. Arguments: `tunnel run gym-sql-tunnel`

---

## 📋 Quick Checklist

- [ ] Tunnel is running and showing hostname
- [ ] Code pushed to GitHub (private repo)
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] Tunnel hostname added to `ETIME_SQL_SERVER`
- [ ] Frontend URL added to `FRONTEND_URL`
- [ ] Test API endpoint (`/api/health`)
- [ ] Test database connection (check logs)
- [ ] Test frontend application
- [ ] Setup tunnel to run automatically (Windows Service/Task Scheduler)

---

## 🆘 Troubleshooting

### Tunnel Not Connecting

- Check SQL Server is running: `Get-Service MSSQL*`
- Check SQL Server Browser is running: `Get-Service SQLBrowser`
- Verify firewall allows port 1433
- Test local connection: `sqlcmd -S localhost\SQLEXPRESS -U essl -P <password>`

### Backend Can't Connect to Database

- Verify tunnel hostname in Vercel environment variables
- Check tunnel is running (keep PowerShell window open)
- Verify SQL Server credentials are correct
- Check Vercel logs for connection errors

### Frontend Can't Connect to Backend

- Verify `VITE_API_URL` is set correctly in Vercel
- Check CORS settings in backend
- Verify backend URL is correct

---

## 🎉 Success!

Once everything is working:
- Your frontend is live on Vercel
- Your backend is live on Vercel
- Your local SQL Server is accessible via Cloudflare Tunnel
- Changes auto-deploy on every `git push`

---

## 📚 Reference Files

- `VERCEL_DEPLOYMENT.md` - Full deployment guide
- `CLOUDFLARE_TUNNEL_SETUP.md` - Tunnel setup details
- `vercel.json` - Vercel configuration
- `api/serverless.js` - Backend serverless function

---

**Need Help?** Check the logs or refer to the troubleshooting section above.

