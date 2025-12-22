# Fix Task Error 0x1

Your task is running but showing error code **0x1**. Here's how to fix it:

## 🔍 Issue Identified

From your Task Scheduler screenshot:
- ✅ Task exists: "Start Gym Software (Local)"
- ✅ Task is running
- ❌ **Last Run Result: (0x1)** - This is an error!
- ❌ "Run with highest privileges" is **NOT checked**

## 🛠️ Quick Fix Steps

### Step 1: Enable Highest Privileges

1. In Task Scheduler, **right-click** on "Start Gym Software (Local)"
2. Select **"Properties"**
3. Go to **"General"** tab
4. ✅ **Check:** "Run with highest privileges"
5. Click **OK**

### Step 2: Verify Script Path

1. Still in Properties, go to **"Actions"** tab
2. Click on the action and click **"Edit"**
3. Verify:
   - **Program/script:** `powershell.exe`
   - **Add arguments:** 
     ```
     -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\START_BACKGROUND.ps1"
     ```
   - **Start in:**
     ```
     C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
     ```
4. Make sure paths are **exact** and use **full paths**
5. Click **OK** → **OK**

### Step 3: Test Script Manually First

Before relying on the task, test the script works:

```powershell
cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
.\START_BACKGROUND.ps1
```

Wait 20 seconds, then:
```powershell
.\CHECK_STATUS.ps1
```

If this doesn't work, the script has issues that need to be fixed first.

### Step 4: Check Event Viewer for Details

1. Press `Win + R`
2. Type: `eventvwr.msc`
3. Press Enter
4. Go to: **Windows Logs** → **Application**
5. Look for recent errors from "Task Scheduler"
6. Check the error message - it will tell you what's wrong

### Step 5: Test the Task Again

1. In Task Scheduler, **right-click** the task
2. Select **"End"** (to stop current run)
3. Wait 5 seconds
4. **Right-click** again → **"Run"**
5. Wait 20 seconds
6. Check **"Last Run Result"** - should be **0x0** (success)

## 🔧 Common Causes of Error 0x1

### 1. Script Path Wrong
- **Fix:** Use full absolute path, not relative
- **Example:** `C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\START_BACKGROUND.ps1`

### 2. Script Has Errors
- **Fix:** Test script manually first
- **Check:** Run `.\START_BACKGROUND.ps1` manually and see if it works

### 3. Node.js Not Found
- **Fix:** Add Node.js to System PATH
- **Or:** The script should handle this, but verify Node.js is installed

### 4. Permissions Issue
- **Fix:** Enable "Run with highest privileges"
- **Also:** Make sure "Run whether user is logged on or not" is selected

### 5. Working Directory Wrong
- **Fix:** Set "Start in" field to the script directory
- **Example:** `C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym`

## ✅ Verification Checklist

After fixing:

- [ ] "Run with highest privileges" is checked
- [ ] Script path is correct (full path)
- [ ] "Start in" directory is set correctly
- [ ] Script works when run manually
- [ ] Task "Last Run Result" shows 0x0 (not 0x1)
- [ ] Servers are actually running (check with `.\CHECK_STATUS.ps1`)

## 🎯 Quick Test Commands

```powershell
# 1. Test script manually
cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
.\START_BACKGROUND.ps1

# 2. Wait 20 seconds, then check
.\CHECK_STATUS.ps1

# 3. If working, check logs
Get-Content logs\backend.log -Tail 10
Get-Content logs\frontend.log -Tail 10
```

## 📝 Next Steps

1. **Fix the task** (enable highest privileges, verify paths)
2. **Test script manually** (make sure it works)
3. **Run task again** (should show 0x0)
4. **Verify servers running** (use CHECK_STATUS.ps1)
5. **Restart computer** (test auto-start)

---

**Most Important:** Enable "Run with highest privileges" - this is likely the main issue!









