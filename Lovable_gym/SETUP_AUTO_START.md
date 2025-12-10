# Setup Auto-Start for Backend + Tunnel

This guide shows you how to automatically start your backend and tunnel when Windows starts.

## Method 1: Windows Startup Folder (Easiest)

### Step 1: Create Startup Script

The script `START_BACKEND_AND_TUNNEL.ps1` is already created.

### Step 2: Add to Startup Folder

1. **Press `Win + R`** to open Run dialog
2. Type: `shell:startup`
3. Press Enter (opens Startup folder)

### Step 3: Create Shortcut

1. **Right-click** in the Startup folder
2. Select **New → Shortcut**
3. Browse to: `C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\START_BACKEND_AND_TUNNEL.ps1`
4. Click **Next** → **Finish**

### Step 4: Configure Shortcut

1. **Right-click** the shortcut → **Properties**
2. In **Target**, change to:
   ```
   powershell.exe -ExecutionPolicy Bypass -File "C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\START_BACKEND_AND_TUNNEL.ps1"
   ```
3. **Start in:** `C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym`
4. Click **OK**

### Step 5: Test

1. Restart your computer
2. Both backend and tunnel should start automatically
3. Check for two PowerShell windows:
   - One running backend
   - One running tunnel

---

## Method 2: Task Scheduler (More Control)

### Step 1: Open Task Scheduler

1. Press `Win + R`
2. Type: `taskschd.msc`
3. Press Enter

### Step 2: Create Basic Task

1. Click **Create Basic Task** (right panel)
2. **Name:** `Gym Management Auto-Start`
3. **Description:** `Start backend and tunnel on Windows startup`
4. Click **Next**

### Step 3: Set Trigger

1. Select **When the computer starts**
2. Click **Next**

### Step 4: Set Action

1. Select **Start a program**
2. Click **Next**
3. **Program/script:** `powershell.exe`
4. **Add arguments:**
   ```
   -ExecutionPolicy Bypass -File "C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\START_BACKEND_AND_TUNNEL.ps1"
   ```
5. **Start in:** `C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym`
6. Click **Next**

### Step 5: Finish

1. Check **Open the Properties dialog...**
2. Click **Finish**

### Step 6: Configure Properties

1. In **General** tab:
   - Check **Run whether user is logged on or not**
   - Check **Run with highest privileges**
2. In **Conditions** tab:
   - Uncheck **Start the task only if the computer is on AC power** (if you want it on battery too)
3. Click **OK**

---

## Method 3: Batch File (Alternative)

Create `START_AUTO.bat` in Startup folder:

```batch
@echo off
cd /d C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
powershell.exe -ExecutionPolicy Bypass -File "START_BACKEND_AND_TUNNEL.ps1"
```

---

## Verification

After setup, verify it works:

1. **Restart your computer**
2. Check for two PowerShell windows:
   - Backend window (showing server logs)
   - Tunnel window (showing tunnel URL)
3. Test backend: `http://localhost:5001/api/health`
4. Copy tunnel URL and verify it works

---

## Troubleshooting

### Script doesn't run on startup

- Check PowerShell execution policy:
  ```powershell
  Get-ExecutionPolicy
  ```
- If Restricted, run:
  ```powershell
  Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### Backend doesn't start

- Check if port 5001 is free
- Verify Node.js is installed
- Check backend folder path is correct

### Tunnel doesn't start

- Verify cloudflared is installed
- Check if backend is running first
- Verify tunnel can access port 5001

### Windows asks for password

- In Task Scheduler, check "Run whether user is logged on or not"
- Or use Startup folder method (doesn't require password)

---

## Disable Auto-Start

### If using Startup Folder:
- Delete the shortcut from Startup folder

### If using Task Scheduler:
- Open Task Scheduler
- Find "Gym Management Auto-Start"
- Right-click → **Disable**

---

## Manual Start (If Auto-Start Disabled)

```powershell
.\START_BACKEND_AND_TUNNEL.ps1
```

Or use individual scripts:
```powershell
# Backend only
cd backend
npm run dev

# Tunnel only
.\START_TUNNEL_ONLY.ps1
```



