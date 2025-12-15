# Steps to Create Auto-Start Task

Follow these steps to set up your Gym Management System to start automatically when Windows boots.

## 🚀 Quick Method (Recommended)

### Step 1: Test the Script First

Make sure the script works manually:

```powershell
cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
.\START_BACKGROUND.ps1
```

Wait 20 seconds, then check:
```powershell
.\CHECK_STATUS.ps1
```

If both servers show ✅ Running, proceed to Step 2.

### Step 2: Create the Task (Run as Administrator)

**Right-click** on PowerShell and select **"Run as Administrator"**, then run:

```powershell
cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
.\SETUP_AUTO_START.ps1
```

This will automatically create the task for you.

### Step 3: Verify

1. **Test the task manually:**
   ```powershell
   Start-ScheduledTask -TaskName "Start Gym Software (Local)"
   ```
   Wait 20 seconds, then check:
   ```powershell
   .\CHECK_STATUS.ps1
   ```

2. **Restart your computer** to test auto-start
   - After restart, wait 30 seconds
   - Run: `.\CHECK_STATUS.ps1`
   - Both servers should be running

---

## 📋 Manual Method (Alternative)

If the automatic method doesn't work, create the task manually:

### Step 1: Open Task Scheduler

1. Press `Win + R`
2. Type: `taskschd.msc`
3. Press Enter

### Step 2: Create Basic Task

1. In the right panel, click **"Create Basic Task..."**
2. **Name:** `Start Gym Software (Local)`
3. **Description:** `Auto-start Gym Management System on Windows boot`
4. Click **Next**

### Step 3: Set Trigger

1. Select **"When I log on"**
2. Click **Next**

### Step 4: Set Action

1. Select **"Start a program"**
2. Click **Next**
3. **Program/script:** `powershell.exe`
4. **Add arguments:** 
   ```
   -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\START_BACKGROUND.ps1"
   ```
   ⚠️ **Important:** Replace the path with your actual path!
5. **Start in (optional):** `C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym`
6. Click **Next**

### Step 5: Finish Setup

1. Check **"Open the Properties dialog for this task when I click Finish"**
2. Click **Finish**

### Step 6: Configure Advanced Settings

In the Properties dialog:

**General Tab:**
- ✅ Check **"Run whether user is logged on or not"**
- ✅ Check **"Run with highest privileges"**
- **Configure for:** Windows Vista/Server 2008

**Settings Tab:**
- ✅ Check **"Allow task to be run on demand"**
- ✅ Check **"Run task as soon as possible after a scheduled start is missed"**
- ✅ Check **"If the task fails, restart every:"** → Set to `1 minute`
- **Attempt to restart up to:** `3 times`
- **Stop the task if it runs longer than:** Unchecked (or set to unlimited)

**Conditions Tab:**
- ✅ Check **"Start the task only if the computer is on AC power"** (uncheck if you want it on battery too)
- ✅ Check **"Wake the computer to run this task"** (optional)

Click **OK**

### Step 7: Test

1. Right-click the task → **Run**
2. Wait 20 seconds
3. Check status: `.\CHECK_STATUS.ps1`

---

## 🔧 Troubleshooting

### Task Not Running?

1. **Check if task exists:**
   ```powershell
   Get-ScheduledTask -TaskName "Start Gym Software (Local)"
   ```

2. **Check last run result:**
   - Open Task Scheduler
   - Find your task
   - Check "Last Run Result" column
   - Should be `0x0` (success)

3. **Check Event Viewer:**
   - `Win + R` → `eventvwr.msc`
   - Windows Logs → Application
   - Filter by "Task Scheduler"
   - Look for errors

4. **Run debug script:**
   ```powershell
   .\DEBUG_TASK.ps1
   ```

5. **Fix the task:**
   ```powershell
   # Run as Administrator
   .\FIX_TASK.ps1
   ```

### Script Path Issues?

Make sure the path in Task Scheduler matches your actual folder:
- Current path: `C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym`
- Update if different!

### Node.js Not Found?

The task might not find Node.js. The script handles this, but if it fails:
1. Make sure Node.js is installed
2. Add Node.js to System PATH
3. Restart computer after adding to PATH

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Task exists in Task Scheduler
- [ ] Task status is "Ready" (not "Disabled")
- [ ] Script path is correct
- [ ] Task runs manually (Right-click → Run)
- [ ] Servers start after manual run (`CHECK_STATUS.ps1` shows both running)
- [ ] Task runs on computer restart
- [ ] Site accessible at `http://localhost:5173` after restart

---

## 🎯 Quick Commands Reference

```powershell
# Test script manually
.\START_BACKGROUND.ps1

# Check status
.\CHECK_STATUS.ps1

# Create task (as Admin)
.\SETUP_AUTO_START.ps1

# Fix task (as Admin)
.\FIX_TASK.ps1

# Debug task
.\DEBUG_TASK.ps1

# Disable auto-start (as Admin)
.\DISABLE_AUTO_START.ps1

# Run task manually
Start-ScheduledTask -TaskName "Start Gym Software (Local)"
```

---

**That's it!** Your application will now start automatically every time you turn on your computer. 🎉

