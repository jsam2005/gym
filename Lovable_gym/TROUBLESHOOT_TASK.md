# Troubleshooting: Task Scheduler Not Running Site

If your Task Scheduler task is set up but the site is not running, follow these steps:

## 🔍 Quick Diagnosis

### Step 1: Run Debug Script
```powershell
.\DEBUG_TASK.ps1
```
This will check:
- ✅ If task exists
- ✅ Task status
- ✅ Script path correctness
- ✅ Node.js availability
- ✅ Last run result

### Step 2: Check Current Status
```powershell
.\CHECK_STATUS.ps1
```
This shows if servers are actually running.

---

## 🛠️ Common Issues & Fixes

### Issue 1: Task Action Path is Wrong

**Symptom:** Task exists but script path is incorrect

**Fix:**
1. Run: `.\FIX_TASK.ps1` (as Administrator)
2. This recreates the task with correct paths

**Or manually:**
1. Open Task Scheduler (`Win + R` → `taskschd.msc`)
2. Find your task
3. Right-click → Properties → Actions tab
4. Edit the action:
   - **Program/script:** `powershell.exe`
   - **Add arguments:** `-ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\FULL\PATH\TO\Lovable_gym\START_BACKGROUND.ps1"`
   - Use the FULL path, not relative path!

### Issue 2: Task is Disabled

**Symptom:** Task exists but shows as "Disabled"

**Fix:**
1. Open Task Scheduler
2. Find your task
3. Right-click → Enable

**Or via PowerShell:**
```powershell
Enable-ScheduledTask -TaskName "GymManagementSystem_AutoStart"
```

### Issue 3: Task Runs But Fails Silently

**Symptom:** Task shows "Last Run Result" with error code (not 0x0)

**Check:**
1. Open Task Scheduler
2. Find your task
3. Check "Last Run Result" column
4. If not 0x0, check Event Viewer:
   - `Win + R` → `eventvwr.msc`
   - Windows Logs → Application
   - Filter by "Task Scheduler"

**Common Error Codes:**
- `0x1` = General error (check script path)
- `0x2` = File not found (script doesn't exist)
- `0x80070002` = System cannot find file
- `0x80070005` = Access denied

**Fix:**
- Verify script path exists
- Run script manually to test: `.\START_BACKGROUND.ps1`
- Check if Node.js is in PATH

### Issue 4: Node.js Not in PATH

**Symptom:** Script runs but Node.js not found

**Check:**
```powershell
node --version
```

**Fix:**
1. Install Node.js: https://nodejs.org/
2. Or add Node.js to system PATH
3. Restart computer after adding to PATH

### Issue 5: Working Directory Wrong

**Symptom:** Script runs but can't find files

**Fix:**
1. In Task Scheduler, edit task
2. Actions tab → Edit
3. Add "Start in" field:
   - `C:\FULL\PATH\TO\Lovable_gym`
4. Or use full paths in script

### Issue 6: Task Runs But Servers Don't Start

**Symptom:** Task executes successfully but site not accessible

**Check:**
1. Run: `.\CHECK_STATUS.ps1`
2. Check logs: `logs\backend.log` and `logs\frontend.log`
3. Check if ports are in use:
   ```powershell
   netstat -ano | findstr :5173
   netstat -ano | findstr :5001
   ```

**Fix:**
- Stop any existing instances: `.\STOP_BACKGROUND.ps1`
- Test script manually: `.\START_BACKGROUND.ps1`
- Check firewall settings

---

## 🔧 Quick Fix (Recommended)

**Run this to fix everything:**
```powershell
# Run as Administrator
.\FIX_TASK.ps1
```

This will:
1. Remove old task
2. Create new task with correct settings
3. Test the task
4. Show you the status

---

## 🧪 Manual Testing

### Test 1: Run Script Manually
```powershell
.\START_BACKGROUND.ps1
```
If this works, the script is fine. The issue is with Task Scheduler.

### Test 2: Run Task Manually
```powershell
Start-ScheduledTask -TaskName "GymManagementSystem_AutoStart"
```
Wait 15 seconds, then check: `.\CHECK_STATUS.ps1`

### Test 3: Check Task Details
```powershell
Get-ScheduledTask -TaskName "GymManagementSystem_AutoStart" | Format-List *
Get-ScheduledTaskInfo -TaskName "GymManagementSystem_AutoStart"
```

---

## 📋 Verify Task Configuration

Your task should have:

**General Tab:**
- ✅ Run whether user is logged on or not (OR Run only when user is logged on)
- ✅ Run with highest privileges
- ✅ Configure for: Windows Vista/Server 2008

**Triggers Tab:**
- ✅ At log on (for your user)

**Actions Tab:**
- ✅ Program: `powershell.exe`
- ✅ Arguments: `-ExecutionPolicy Bypass -WindowStyle Hidden -File "FULL_PATH_TO_START_BACKGROUND.ps1"`

**Settings Tab:**
- ✅ Allow task to be run on demand
- ✅ Run task as soon as possible after a scheduled start is missed
- ✅ If the task fails, restart every: 1 minute
- ✅ Attempt to restart up to: 3 times

---

## 🎯 Step-by-Step Fix

1. **Stop any running instances:**
   ```powershell
   .\STOP_BACKGROUND.ps1
   ```

2. **Test script manually:**
   ```powershell
   .\START_BACKGROUND.ps1
   ```
   Wait 15 seconds, then: `.\CHECK_STATUS.ps1`
   If this works, continue. If not, fix script issues first.

3. **Fix the task:**
   ```powershell
   # Run as Administrator
   .\FIX_TASK.ps1
   ```

4. **Test the task:**
   ```powershell
   Start-ScheduledTask -TaskName "GymManagementSystem_AutoStart"
   ```
   Wait 15 seconds, then: `.\CHECK_STATUS.ps1`

5. **Verify auto-start:**
   - Restart your computer
   - Wait 30 seconds after login
   - Run: `.\CHECK_STATUS.ps1`

---

## 📞 Still Not Working?

1. **Check Event Viewer:**
   - `Win + R` → `eventvwr.msc`
   - Windows Logs → Application
   - Look for errors around task execution time

2. **Check Logs:**
   - `logs\backend.log`
   - `logs\frontend.log`

3. **Check Task History:**
   - Task Scheduler → Your Task → History tab
   - Look for error messages

4. **Try Alternative Method:**
   - Use Startup Folder method (see AUTO_START_METHODS.md)
   - Or use NSSM Windows Service (see SETUP_NSSM_SERVICE.ps1)


