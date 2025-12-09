# Quick IIS Setup - Single Application

## ✅ Your Setup: One Folder, One Application

Both frontend and backend are now configured to run as **one IIS application**.

---

## 🚀 Quick Start (5 Steps)

### Step 1: Build Applications
```powershell
cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
npm run build
```

### Step 2: Deploy to IIS
```powershell
.\deploy-to-iis.ps1
```

This copies everything to: `C:\inetpub\wwwroot\gym`

### Step 3: Create IIS Website

1. Open **IIS Manager**
2. **Sites** → Right-click → **Add Website**
3. Configure:
   - **Name**: `GymManagement`
   - **Application Pool**: Create new `GymManagementPool`
   - **Path**: `C:\inetpub\wwwroot\gym`
   - **Port**: `80` (or `5000`)
   - Click **OK**

### Step 4: Configure Application Pool

1. Select **GymManagementPool**
2. **Advanced Settings**:
   - **.NET CLR Version**: `No Managed Code`
   - **Start Mode**: `AlwaysRunning`
   - **Idle Timeout**: `0`

### Step 5: Test

Open browser: `http://localhost` or `http://YOUR_SERVER_IP`

---

## 📋 What's Included

✅ Backend API (serves `/api/*`)  
✅ Frontend (serves everything else)  
✅ Single port (80 or 5000)  
✅ Auto-start on boot  
✅ One IIS site to manage  

---

## 🔧 Configuration

Edit `.env` in `C:\inetpub\wwwroot\gym\`:

```env
PORT=5000
NODE_ENV=production
ETIMETRACK_SQL_SERVER=JSAM\SQLEXPRESS
ETIMETRACK_SQL_DATABASE=etimetracklite1
ETIMETRACK_SQL_USER=essl
ETIMETRACK_SQL_PASSWORD=essl
ESSL_DEVICE_IP=192.168.0.5
FRONTEND_URL=http://YOUR_SERVER_IP
```

---

## ✅ Done!

Your website is now accessible at:
- **Local**: `http://localhost`
- **Network**: `http://YOUR_SERVER_IP`

No commands needed - it starts automatically! 🎉





