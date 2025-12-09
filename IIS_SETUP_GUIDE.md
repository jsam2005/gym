# IIS Setup Guide - Gym Management System

## Single Application Setup (Frontend + Backend)

This guide will help you host both frontend and backend in **one IIS application**.

---

## Prerequisites

1. **Node.js** installed (v18 or higher)
2. **IIS** enabled on Windows
3. **URL Rewrite Module** for IIS: [Download here](https://www.iis.net/downloads/microsoft/url-rewrite)
4. **iisnode** for Node.js: [Download here](https://github.com/Azure/iisnode/releases)

---

## Step 1: Build Applications

```powershell
cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
npm run build
```

This will build both frontend and backend.

---

## Step 2: Deploy to IIS Folder

### Option A: Use PowerShell Script (Recommended)

```powershell
cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
.\deploy-to-iis.ps1
```

### Option B: Manual Copy

1. Create folder: `C:\inetpub\wwwroot\gym`
2. Copy entire `backend` folder contents to `C:\inetpub\wwwroot\gym\`
3. Copy all files from `frontend\dist` to `C:\inetpub\wwwroot\gym\`
4. Ensure `.env` file is in `C:\inetpub\wwwroot\gym\`

---

## Step 3: Configure IIS Manager

### 3.1 Create Website

1. Open **IIS Manager**
2. Right-click **Sites** → **Add Website**
3. Configure:
   - **Site name**: `GymManagement`
   - **Application pool**: Create new `GymManagementPool`
   - **Physical path**: `C:\inetpub\wwwroot\gym`
   - **Binding**:
     - Type: `http`
     - IP address: `All Unassigned` (or your server IP)
     - Port: `80` (or `5000` if 80 is taken)
     - Host name: (leave empty for local access)
   - Click **OK**

### 3.2 Configure Application Pool

1. Select **Application Pools** → **GymManagementPool**
2. Right-click → **Advanced Settings**
3. Configure:
   - **.NET CLR Version**: `No Managed Code`
   - **Managed Pipeline Mode**: `Integrated`
   - **Start Mode**: `AlwaysRunning`
   - **Idle Timeout**: `0` (never idle)
   - Click **OK**

### 3.3 Enable Auto-Start

1. Select **GymManagement** website
2. Right-click → **Manage Website** → **Advanced Settings**
3. Set **Preload Enabled**: `True`
4. Click **OK**

---

## Step 4: Configure Environment Variables

1. Edit `.env` file in `C:\inetpub\wwwroot\gym\`
2. Ensure these are set:
   ```env
   PORT=5000
   NODE_ENV=production
   ETIMETRACK_SQL_SERVER=JSAM\SQLEXPRESS
   ETIMETRACK_SQL_DATABASE=etimetracklite1
   ETIMETRACK_SQL_USER=essl
   ETIMETRACK_SQL_PASSWORD=essl
   ESSL_DEVICE_IP=192.168.0.5
   ESSL_DEVICE_PORT=4370
   FRONTEND_URL=http://YOUR_SERVER_IP
   ```

Replace `YOUR_SERVER_IP` with your actual server IP address.

---

## Step 5: Configure Windows Firewall

1. Open **Windows Firewall with Advanced Security**
2. **Inbound Rules** → **New Rule**
3. Select **Port** → **Next**
4. Select **TCP** → Enter ports: `80, 5000` → **Next**
5. Select **Allow the connection** → **Next**
6. Check all profiles → **Next**
7. Name: `Gym Management System` → **Finish**

---

## Step 6: Get Your Server IP

```powershell
ipconfig
```

Note your **IPv4 Address** (e.g., `192.168.1.100`)

---

## Step 7: Test Your Setup

### Local Access:
- Frontend: `http://localhost`
- API: `http://localhost/api/health`

### Network Access:
- Frontend: `http://YOUR_SERVER_IP`
- API: `http://YOUR_SERVER_IP/api/health`

Replace `YOUR_SERVER_IP` with your actual IP.

---

## Step 8: Verify Auto-Start

1. **Restart your computer**
2. Wait 1-2 minutes
3. Open browser: `http://YOUR_SERVER_IP`
4. Website should load automatically ✅

---

## Troubleshooting

### Issue: Website shows 500 Error

**Solution:**
1. Check `C:\inetpub\wwwroot\gym\iisnode\` for error logs
2. Verify Node.js is installed: `node --version`
3. Check `.env` file exists and has correct values
4. Verify iisnode is installed correctly

### Issue: API calls fail

**Solution:**
1. Check backend is running: `http://YOUR_SERVER_IP/api/health`
2. Verify CORS settings in `server.ts`
3. Check browser console for errors

### Issue: Frontend shows blank page

**Solution:**
1. Check browser console (F12) for errors
2. Verify `web.config` exists in IIS folder
3. Check IIS logs: `C:\inetpub\logs\LogFiles\`

### Issue: Can't access from network

**Solution:**
1. Verify Windows Firewall rules
2. Check IIS binding (should be `All Unassigned` or your IP)
3. Ensure port is not blocked by antivirus
4. Try accessing from another computer on same network

---

## File Structure in IIS

```
C:\inetpub\wwwroot\gym\
├── dist\                    # Backend compiled files
│   └── server.js           # Main server file
├── node_modules\            # Backend dependencies
├── package.json             # Backend package.json
├── web.config              # IIS configuration
├── .env                    # Environment variables
├── index.html              # Frontend entry point
├── assets\                 # Frontend assets (JS, CSS)
│   ├── index-*.js
│   └── index-*.css
└── ... (other frontend files)
```

---

## Maintenance

### Update Application:

1. Build new version: `npm run build`
2. Run deployment script: `.\deploy-to-iis.ps1`
3. Restart IIS site or application pool

### View Logs:

- **IIS Logs**: `C:\inetpub\logs\LogFiles\`
- **Node.js Logs**: `C:\inetpub\wwwroot\gym\iisnode\`
- **Application Logs**: Check Windows Event Viewer

### Restart Application:

1. IIS Manager → Select **GymManagement** site
2. Right-click → **Restart**
   OR
3. Select **GymManagementPool** → Right-click → **Recycle**

---

## Success Checklist

- ✅ Website accessible at `http://YOUR_SERVER_IP`
- ✅ API responds at `http://YOUR_SERVER_IP/api/health`
- ✅ Frontend loads correctly
- ✅ Can access from other computers on network
- ✅ Auto-starts when computer boots
- ✅ No manual commands needed

---

## Support

If you encounter issues:
1. Check IIS Manager → Sites → GymManagement → Browse
2. Check Application Pool status
3. Review error logs
4. Verify all prerequisites are installed





