# IIS Final Setup Steps

## ✅ Deployment Complete!

Your files have been deployed to: `C:\inetpub\wwwroot\gym`

---

## 🎯 Final IIS Configuration Steps

### Step 1: Install Prerequisites (If Not Already Installed)

1. **URL Rewrite Module**: [Download](https://www.iis.net/downloads/microsoft/url-rewrite)
2. **iisnode for Node.js**: [Download](https://github.com/Azure/iisnode/releases)

### Step 2: Create IIS Website

1. Open **IIS Manager** (type `inetmgr` in Run dialog)
2. Expand your server name
3. Right-click **Sites** → **Add Website**
4. Fill in:
   - **Site name**: `GymManagement`
   - **Application pool**: Click "Select" → Create new pool named `GymManagementPool`
   - **Physical path**: `C:\inetpub\wwwroot\gym`
   - **Binding**:
     - Type: `http`
     - IP address: `All Unassigned` (or your server IP)
     - Port: `80` (or `5000` if 80 is in use)
     - Host name: (leave empty)
   - Click **OK**

### Step 3: Configure Application Pool

1. In IIS Manager, click **Application Pools**
2. Select **GymManagementPool**
3. Right-click → **Advanced Settings**
4. Set these values:
   - **.NET CLR Version**: `No Managed Code`
   - **Managed Pipeline Mode**: `Integrated`
   - **Start Mode**: `AlwaysRunning`
   - **Idle Timeout**: `00:00:00` (0 minutes - never idle)
   - Click **OK**

### Step 4: Enable Auto-Start

1. Select **GymManagement** website
2. Right-click → **Manage Website** → **Advanced Settings**
3. Set **Preload Enabled**: `True`
4. Click **OK**

### Step 5: Configure Environment Variables

1. Edit `.env` file in `C:\inetpub\wwwroot\gym\.env`
2. Ensure these are set correctly:
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

### Step 6: Configure Windows Firewall

1. Open **Windows Firewall with Advanced Security**
2. **Inbound Rules** → **New Rule**
3. **Port** → **Next**
4. **TCP** → Enter ports: `80, 5000` → **Next**
5. **Allow the connection** → **Next**
6. Check all profiles → **Next**
7. Name: `Gym Management System` → **Finish**

### Step 7: Get Your Server IP

```powershell
ipconfig
```

Note your **IPv4 Address** (e.g., `192.168.1.100`)

### Step 8: Test Your Website

1. **Local**: Open `http://localhost` or `http://localhost:80`
2. **Network**: Open `http://YOUR_SERVER_IP` from another computer

---

## ✅ Success Checklist

- [ ] Website accessible at `http://YOUR_SERVER_IP`
- [ ] API responds at `http://YOUR_SERVER_IP/api/health`
- [ ] Frontend loads correctly
- [ ] Can access from other computers on network
- [ ] Auto-starts when computer boots (test by restarting)

---

## 🔧 Troubleshooting

### Website shows 500 Error

**Check:**
1. IIS Manager → Sites → GymManagement → Browse
2. Check `C:\inetpub\wwwroot\gym\iisnode\` for error logs
3. Verify Node.js is installed: `node --version`
4. Check `.env` file exists and has correct values
5. Verify iisnode is installed

### Can't Access from Network

**Check:**
1. Windows Firewall rules are enabled
2. IIS binding is set to `All Unassigned` or your IP
3. Port is not blocked by antivirus
4. Try accessing from another computer on same network

### Frontend Shows Blank Page

**Check:**
1. Browser console (F12) for errors
2. Verify `web.config` exists in `C:\inetpub\wwwroot\gym\`
3. Check IIS logs: `C:\inetpub\logs\LogFiles\`

---

## 📁 File Structure in IIS

```
C:\inetpub\wwwroot\gym\
├── dist\                    # Backend compiled files
│   └── server.js           # Main server file
├── node_modules\            # Backend dependencies
├── package.json             # Backend package.json
├── web.config              # IIS configuration
├── .env                    # Environment variables
├── index.html              # Frontend entry point
└── assets\                 # Frontend assets (JS, CSS)
    ├── index-*.js
    └── index-*.css
```

---

## 🎉 Done!

Your gym management system is now hosted in IIS and will:
- ✅ Start automatically when computer boots
- ✅ Be accessible via `http://YOUR_SERVER_IP`
- ✅ Work seamlessly for remote clients
- ✅ Require no manual commands





