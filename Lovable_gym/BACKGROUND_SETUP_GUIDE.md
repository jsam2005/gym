# Background Setup Guide

This guide will help you set up the Gym Management System to run in the background and automatically start when you turn on your computer.

## 🎯 What This Does

- Runs your application silently in the background
- Allows you to use your computer for other tasks
- Automatically starts when Windows boots
- Keeps your site accessible at `http://localhost:5173`

## 📋 Step-by-Step Setup

### Step 1: Start the Application in Background

1. Open PowerShell in the `Lovable_gym` folder
2. Run:
   ```powershell
   .\START_BACKGROUND.ps1
   ```
3. Wait for the message "✅ Application Started!"
4. Open your browser and go to: `http://localhost:5173`

### Step 2: Setup Auto-Start on Boot

1. **Right-click** on `SETUP_AUTO_START.ps1`
2. Select **"Run as Administrator"**
3. Wait for the success message

Now your application will automatically start every time you:
- Turn on your computer
- Log in to Windows

### Step 3: Verify It's Working

Run this command to check status:
```powershell
.\CHECK_STATUS.ps1
```

You should see:
- ✅ Backend Server: Running
- ✅ Frontend Server: Running
- Your site URL: `http://localhost:5173`

## 🔧 Useful Commands

### Check Status
```powershell
.\CHECK_STATUS.ps1
```
Shows if the app is running and provides access URLs.

### Stop the Application
```powershell
.\STOP_BACKGROUND.ps1
```
Stops all background processes.

### Disable Auto-Start
```powershell
# Run as Administrator
.\DISABLE_AUTO_START.ps1
```
Removes the auto-start feature.

## 🌐 Accessing from Other Devices

Once running, you can access your site from other devices on your network:

1. Run `.\CHECK_STATUS.ps1` to see your local IP address
2. On other devices, open: `http://YOUR_IP_ADDRESS:5173`
   - Example: `http://192.168.1.100:5173`

**Note:** Make sure Windows Firewall allows connections on port 5173 and 5001.

## 📝 Logs

Logs are saved in the `logs` folder:
- `logs/backend.log` - Backend server logs
- `logs/frontend.log` - Frontend server logs

## ❓ Troubleshooting

### Application Not Starting
1. Check if Node.js is installed: `node --version`
2. Check status: `.\CHECK_STATUS.ps1`
3. Check logs in the `logs` folder

### Auto-Start Not Working
1. Make sure you ran `SETUP_AUTO_START.ps1` as Administrator
2. Check Task Scheduler:
   - Press `Win + R`, type `taskschd.msc`
   - Look for task: `GymManagementSystem_AutoStart`

### Port Already in Use
If you see "port already in use" errors:
1. Stop the application: `.\STOP_BACKGROUND.ps1`
2. Wait a few seconds
3. Start again: `.\START_BACKGROUND.ps1`

## 🔄 Restart After Updates

If you update the code:
1. Stop: `.\STOP_BACKGROUND.ps1`
2. Update: `.\UPDATE.ps1`
3. Start: `.\START_BACKGROUND.ps1`

The auto-start will continue working after restarts.
















