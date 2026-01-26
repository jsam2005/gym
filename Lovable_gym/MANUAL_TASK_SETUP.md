# Manual Steps to Create Auto-Start Task

Follow these step-by-step instructions to manually create the Task Scheduler task.

## 📋 Prerequisites

1. Make sure your script works manually first:
   ```powershell
   cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
   .\START_BACKGROUND.ps1
   ```
   Wait 20 seconds, then check:
   ```powershell
   .\CHECK_STATUS.ps1
   ```
   If both servers show ✅ Running, proceed.

2. **Note your exact folder path:**
   ```
   C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
   ```
   (Replace with your actual path if different)

---

## 🚀 Step-by-Step Instructions

### Step 1: Open Task Scheduler

1. Press **`Win + R`** (Windows key + R)
2. Type: **`taskschd.msc`**
3. Press **Enter**

### Step 2: Create Basic Task

1. In the **right panel**, click **"Create Basic Task..."**
2. A wizard will open

### Step 3: Name and Description

1. **Name:** Type: `Start Gym Software (Local)`
2. **Description:** Type: `Auto-start Gym Management System on Windows boot`
3. Click **Next**

### Step 4: Set Trigger (When to Run)

1. Select: **"When I log on"**
2. Click **Next**

### Step 5: Set Action (What to Run)

1. Select: **"Start a program"**
2. Click **Next**

### Step 6: Configure Program

Fill in these fields:

**Program/script:**
```
powershell.exe
```

**Add arguments (optional):**
```
-ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\START_BACKGROUND.ps1"
```

⚠️ **IMPORTANT:** Replace `C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym` with your actual folder path!

**Start in (optional):**
```
C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
```

⚠️ **IMPORTANT:** Use the same path as above!

3. Click **Next**

### Step 7: Finish Setup

1. ✅ **Check the box:** "Open the Properties dialog for this task when I click Finish"
2. Click **Finish**

### Step 8: Configure Advanced Settings

A Properties dialog will open. Configure these tabs:

#### General Tab:

1. ✅ Check: **"Run whether user is logged on or not"**
   - OR check: **"Run only when user is logged on"** (if you prefer)
2. ✅ Check: **"Run with highest privileges"**
3. **Configure for:** Select **"Windows Vista™, Windows Server™ 2008"**
4. Click **OK** (or go to next tab)

#### Triggers Tab:

1. Your trigger should show: **"At log on"**
2. Double-click it to edit if needed
3. Make sure it's **Enabled**
4. Click **OK**

#### Actions Tab:

1. Your action should show:
   - **Program:** `powershell.exe`
   - **Arguments:** `-ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\START_BACKGROUND.ps1"`
   - **Start in:** `C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym`
2. Verify the paths are correct
3. Click **OK**

#### Settings Tab:

1. ✅ Check: **"Allow task to be run on demand"**
2. ✅ Check: **"Run task as soon as possible after a scheduled start is missed"**
3. ✅ Check: **"If the task fails, restart every:"**
   - Set to: **1 minute**
4. **Attempt to restart up to:** Set to **3 times**
5. **Stop the task if it runs longer than:** Leave **unchecked** (or set to unlimited)
6. Click **OK**

#### Conditions Tab (Optional):

1. Uncheck: **"Start the task only if the computer is on AC power"** (if you want it to run on battery too)
2. Other settings can stay as default
3. Click **OK**

#### History Tab:

- Leave as default (usually disabled)

### Step 9: Save and Close

1. Click **OK** to close the Properties dialog
2. Your task is now created!

---

## ✅ Verify the Task

### Check Task Exists:

1. In Task Scheduler, look in the **Task Scheduler Library**
2. Find: **"Start Gym Software (Local)"**
3. Status should be: **"Ready"** (not "Disabled")

### Test the Task Manually:

1. **Right-click** on the task
2. Select **"Run"**
3. Wait 20 seconds
4. Check status:
   ```powershell
   cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
   .\CHECK_STATUS.ps1
   ```
5. Both servers should show ✅ Running

### Check Last Run Result:

1. In Task Scheduler, look at the **"Last Run Result"** column
2. Should show: **"0x0"** (success)
3. If it shows an error code, see Troubleshooting below

---

## 🧪 Test Auto-Start

1. **Restart your computer**
2. **Log in** to Windows
3. **Wait 30 seconds** after login
4. Check status:
   ```powershell
   cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
   .\CHECK_STATUS.ps1
   ```
5. Both servers should be running
6. Open browser: `http://localhost:5173`

---

## 🔧 Troubleshooting

### Task Not Running?

1. **Check if task is enabled:**
   - In Task Scheduler, find your task
   - Right-click → **Enable** (if it shows "Disabled")

2. **Check last run result:**
   - Look at "Last Run Result" column
   - If not "0x0", check Event Viewer:
     - `Win + R` → `eventvwr.msc`
     - Windows Logs → Application
     - Filter by "Task Scheduler"

3. **Verify script path:**
   - Right-click task → Properties → Actions tab
   - Make sure the path is correct
   - Use **full path**, not relative path

4. **Check if script works manually:**
   ```powershell
   cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
   .\START_BACKGROUND.ps1
   ```
   If this doesn't work, fix the script first.

### Script Path Issues?

**Common mistakes:**
- ❌ Using relative paths
- ❌ Missing quotes around path with spaces
- ❌ Wrong folder path

**Correct format:**
```
-ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\FULL\PATH\TO\Lovable_gym\START_BACKGROUND.ps1"
```

### Node.js Not Found?

The task might not find Node.js. Solutions:

1. **Add Node.js to System PATH:**
   - Search "Environment Variables" in Windows
   - Edit System Environment Variables
   - Add Node.js path to PATH variable
   - Restart computer

2. **Or use full path to Node.js in script** (advanced)

### Port Already in Use?

If ports 5001 or 5173 are already in use:

1. Stop existing instances:
   ```powershell
   .\STOP_BACKGROUND.ps1
   ```
2. Wait 10 seconds
3. Try again

---

## 📝 Quick Reference

**Task Name:** `Start Gym Software (Local)`

**Program:** `powershell.exe`

**Arguments:**
```
-ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\START_BACKGROUND.ps1"
```

**Start in:**
```
C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
```

**Trigger:** At log on

**Settings:**
- Run with highest privileges: ✅
- Restart if fails: ✅ (1 minute, 3 times)

---

## 🎯 Summary

After completing these steps:

1. ✅ Task is created in Task Scheduler
2. ✅ Task runs on Windows logon
3. ✅ Application starts automatically
4. ✅ Site accessible at `http://localhost:5173`

**To disable auto-start later:**
- Open Task Scheduler
- Find the task
- Right-click → **Disable**

**To delete the task:**
- Open Task Scheduler
- Find the task
- Right-click → **Delete**

---

That's it! Your application will now start automatically every time you turn on your computer. 🎉















