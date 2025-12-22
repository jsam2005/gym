# 🔄 Docker Auto-Start Guide

This guide explains how to configure your Docker containers to automatically start when you boot your computer.

## ❓ Why Auto-Start?

When you shut down your computer, Docker containers stop. When you turn it back on, the containers won't automatically start unless you configure them to do so.

## 🚀 Quick Setup

### Method 1: Using the Setup Script (Recommended)

1. **Open PowerShell as Administrator:**
   - Right-click on PowerShell
   - Select "Run as Administrator"

2. **Navigate to project folder:**
   ```powershell
   cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
   ```

3. **Run the setup script:**
   ```powershell
   .\DOCKER_AUTO_START.ps1
   ```

4. **Done!** The containers will now start automatically when you boot your computer.

### Method 2: Manual Setup

1. **Open Task Scheduler:**
   - Press `Win + R`
   - Type `taskschd.msc` and press Enter

2. **Create Basic Task:**
   - Click "Create Basic Task" in the right panel
   - Name: `GymManagement-Docker-AutoStart`
   - Description: `Auto-start Gym Management System Docker containers`

3. **Set Trigger:**
   - Select "When the computer starts"

4. **Set Action:**
   - Select "Start a program"
   - Program: `powershell.exe`
   - Arguments: `-NoProfile -ExecutionPolicy Bypass -File "C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\docker-auto-start.ps1"`

5. **Finish:**
   - Check "Open the Properties dialog" and click Finish
   - In Properties:
     - Check "Run whether user is logged on or not"
     - Check "Run with highest privileges"
     - Click OK

## ✅ Verify Auto-Start

1. **Check Task Scheduler:**
   - Open Task Scheduler
   - Look for `GymManagement-Docker-AutoStart` in the task list
   - Status should show "Ready"

2. **Test the task:**
   - Right-click the task → "Run"
   - Check if containers start: `docker-compose ps`

3. **Reboot test:**
   - Restart your computer
   - After boot, check: `docker-compose ps`
   - Containers should be running

## 🛑 Disable Auto-Start

If you want to disable auto-start:

1. **Using the script:**
   ```powershell
   # Run PowerShell as Administrator
   .\DOCKER_DISABLE_AUTO_START.ps1
   ```

2. **Using Task Scheduler:**
   - Open Task Scheduler
   - Find `GymManagement-Docker-AutoStart`
   - Right-click → "Disable" or "Delete"

3. **Using PowerShell:**
   ```powershell
   # Run as Administrator
   Unregister-ScheduledTask -TaskName "GymManagement-Docker-AutoStart"
   ```

## 📋 Requirements

### Docker Desktop Auto-Start

Docker Desktop must also be configured to start on boot:

1. **Open Docker Desktop**
2. **Go to Settings** (gear icon)
3. **General tab**
4. **Check "Start Docker Desktop when you log in"**
5. **Click "Apply & Restart"**

**Important:** The scheduled task will wait for Docker Desktop to start, but it's better to ensure Docker Desktop starts first.

### Startup Order

The ideal startup order is:
1. Windows boots
2. Docker Desktop starts (if configured)
3. Scheduled task runs
4. Docker containers start

## 🔧 Troubleshooting

### Containers Don't Start on Boot

1. **Check Docker Desktop:**
   - Make sure Docker Desktop is running
   - Check if it's configured to auto-start

2. **Check Task Scheduler:**
   - Open Task Scheduler
   - Find your task
   - Check "Last Run Result" - should be "0x0" (success)
   - If there's an error, check the task history

3. **Check Task Logs:**
   - In Task Scheduler, select your task
   - Click "History" tab
   - Look for errors

4. **Manual Test:**
   ```powershell
   # Test the startup script manually
   cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
   .\docker-auto-start.ps1
   ```

### Task Runs But Containers Don't Start

1. **Check Docker is running:**
   ```powershell
   docker ps
   ```

2. **Check docker-compose:**
   ```powershell
   cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
   docker-compose ps
   ```

3. **Check logs:**
   ```powershell
   docker-compose logs
   ```

### Task Fails with Permission Error

1. **Run Task Scheduler as Administrator**
2. **Edit the task:**
   - Right-click → Properties
   - General tab
   - Check "Run whether user is logged on or not"
   - Check "Run with highest privileges"
   - Click OK

### Docker Desktop Not Starting

1. **Check Windows Services:**
   - Press `Win + R`
   - Type `services.msc`
   - Find "Docker Desktop Service"
   - Set Startup type to "Automatic"

2. **Check Docker Desktop Settings:**
   - Open Docker Desktop
   - Settings → General
   - Enable "Start Docker Desktop when you log in"

## 💡 Alternative: Docker Desktop Restart Policy

You can also configure Docker containers to restart automatically using Docker's restart policy:

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    restart: unless-stopped
    # ... other settings
  
  frontend:
    restart: unless-stopped
    # ... other settings
```

However, this only works if Docker Desktop is already running. The scheduled task ensures Docker Desktop starts first.

## 📝 Summary

| Method | Pros | Cons |
|--------|------|------|
| Scheduled Task | Works even if Docker Desktop isn't auto-starting | Requires admin privileges |
| Docker Desktop Auto-Start | Simple, built-in | Only works if Docker Desktop starts |
| Both | Most reliable | Requires both to be configured |

**Recommended:** Use both methods for maximum reliability.

---

**After setup, your containers will automatically start every time you boot your computer! 🎉**

