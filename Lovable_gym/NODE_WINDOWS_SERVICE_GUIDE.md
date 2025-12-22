# Node-Windows Service Setup Guide

## ✅ Setup Complete!

Your Gym Management System is now running as a **Windows Service** that will automatically start when your computer boots.

---

## 📋 Service Details

- **Service Name:** `Gym Management Backend` (internal: `gymmanagementbackend.exe`)
- **Status:** ✅ Running
- **Auto-Start:** ✅ Enabled (starts with Windows)
- **Backend URL:** http://localhost:5001
- **Frontend URL:** http://localhost:5001 (served by backend)

---

## 🚀 Access Your Application

Simply open your browser and go to:
```
http://localhost:5001
```

The service runs in the background, so you can use your computer for other tasks without interruption.

---

## 🔄 What Happens on Reboot

When you turn on your computer:
1. Windows starts automatically
2. The **Gym Management Backend** service starts automatically
3. Your application is available at `http://localhost:5001`
4. No manual intervention needed!

---

## 🛠️ Managing the Service

### View Service Status

**Option 1: PowerShell**
```powershell
Get-Service -Name "*Gym*"
```

**Option 2: Services GUI**
1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find **"Gym Management Backend"**
4. View status, start, stop, or restart

### Stop the Service

**Option 1: PowerShell (as Administrator)**
```powershell
Stop-Service -Name "gymmanagementbackend.exe"
```

**Option 2: Services GUI**
- Right-click **"Gym Management Backend"** → **Stop**

### Start the Service

**Option 1: PowerShell (as Administrator)**
```powershell
Start-Service -Name "gymmanagementbackend.exe"
```

**Option 2: Services GUI**
- Right-click **"Gym Management Backend"** → **Start**

### Restart the Service

**Option 1: PowerShell (as Administrator)**
```powershell
Restart-Service -Name "gymmanagementbackend.exe"
```

**Option 2: Services GUI**
- Right-click **"Gym Management Backend"** → **Restart**

### View Service Logs

The service logs are written to:
```
C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\backend\logs\
```

Check these files for any errors or debugging information.

---

## 🗑️ Uninstall the Service

If you want to remove the Windows service:

1. **Open PowerShell as Administrator**

2. **Navigate to backend directory:**
   ```powershell
   cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\backend
   ```

3. **Uninstall the service:**
   ```powershell
   npm run uninstall-service
   ```

The service will be removed from Windows, but your code and configuration remain intact.

---

## 🔧 Troubleshooting

### Service Won't Start

1. **Check if port 5001 is in use:**
   ```powershell
   netstat -ano | findstr :5001
   ```
   If another process is using the port, stop it or the service will use the next available port.

2. **Check service logs:**
   - Navigate to: `C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\backend\logs\`
   - Check `output.log` and `error.log` files

3. **Verify backend is built:**
   ```powershell
   cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\backend
   npm run build
   ```

### Application Not Accessible

1. **Check service status:**
   ```powershell
   Get-Service -Name "*Gym*"
   ```
   Should show `Status: Running`

2. **Test backend directly:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:5001/api" -UseBasicParsing
   ```

3. **Check Windows Firewall:**
   - Ensure port 5001 is allowed (usually automatic for localhost)

### Service Starts but Crashes

1. **Check error logs:**
   - `C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\backend\logs\error.log`

2. **Verify database connection:**
   - Check `backend\.env` file for correct SQL Server settings
   - The service will still run even if SQL is disabled (graceful degradation)

3. **Reinstall the service:**
   ```powershell
   cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\backend
   npm run uninstall-service
   npm run install-service
   ```

---

## 📝 Updating the Application

If you make code changes:

1. **Rebuild the application:**
   ```powershell
   cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
   
   # Build frontend
   cd frontend
   npm run build
   
   # Build backend
   cd ..\backend
   npm run build
   ```

2. **Restart the service:**
   ```powershell
   Restart-Service -Name "gymmanagementbackend.exe"
   ```

Or use the Services GUI to restart.

---

## 🎯 Benefits of Windows Service

✅ **Automatic startup** - No manual intervention needed  
✅ **Background operation** - Runs silently, doesn't interfere with other work  
✅ **Auto-recovery** - Windows can automatically restart the service if it crashes  
✅ **System integration** - Managed like any other Windows service  
✅ **No Docker required** - Direct Node.js execution, lower overhead  
✅ **Persistent** - Survives reboots and user logouts  

---

## 📞 Quick Reference

| Action | Command |
|--------|---------|
| Check status | `Get-Service -Name "*Gym*"` |
| Start service | `Start-Service -Name "gymmanagementbackend.exe"` |
| Stop service | `Stop-Service -Name "gymmanagementbackend.exe"` |
| Restart service | `Restart-Service -Name "gymmanagementbackend.exe"` |
| Uninstall | `cd backend; npm run uninstall-service` |
| View logs | Check `backend\logs\` directory |

---

**Your application is now running as a Windows service and will start automatically on every boot!** 🎉






