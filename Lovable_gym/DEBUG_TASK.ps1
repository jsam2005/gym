# Debug Task Scheduler Configuration
# Checks and fixes common issues with auto-start task

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Debug Task Scheduler" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$taskName = "Start Gym Software (Local)"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$startScript = Join-Path $scriptDir "START_BACKGROUND.ps1"

# Check if task exists
Write-Host "1. Checking if task exists..." -ForegroundColor Yellow
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if (-not $task) {
    Write-Host "   ❌ Task '$taskName' not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Creating task now..." -ForegroundColor Yellow
    
    # Check if running as Administrator
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if (-not $isAdmin) {
        Write-Host "   ⚠️  Need Administrator rights to create task" -ForegroundColor Yellow
        Write-Host "   Run this script as Administrator" -ForegroundColor Gray
        exit 1
    }
    
    # Create the task
    $action = New-ScheduledTaskAction -Execute "powershell.exe" `
        -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startScript`""
    
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 1)
    
    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive
    
    Register-ScheduledTask -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Auto-start Gym Management System on Windows boot" | Out-Null
    
    Write-Host "   ✅ Task created!" -ForegroundColor Green
} else {
    Write-Host "   ✅ Task found: $taskName" -ForegroundColor Green
}

Write-Host ""
Write-Host "2. Checking task status..." -ForegroundColor Yellow
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($task) {
    $state = $task.State
    Write-Host "   Status: $state" -ForegroundColor $(if ($state -eq "Ready") { "Green" } else { "Yellow" })
    
    if ($state -ne "Ready") {
        Write-Host "   ⚠️  Task is not ready. Enabling..." -ForegroundColor Yellow
        Enable-ScheduledTask -TaskName $taskName
    }
}

Write-Host ""
Write-Host "3. Checking task action..." -ForegroundColor Yellow
$taskInfo = Get-ScheduledTaskInfo -TaskName $taskName -ErrorAction SilentlyContinue
$taskDetails = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($taskDetails) {
    $action = $taskDetails.Actions[0]
    Write-Host "   Execute: $($action.Execute)" -ForegroundColor Gray
    Write-Host "   Arguments: $($action.Arguments)" -ForegroundColor Gray
    
    # Check if script path is correct
    if ($action.Arguments -notlike "*$startScript*") {
        Write-Host "   ⚠️  Script path might be incorrect!" -ForegroundColor Yellow
        Write-Host "   Expected: $startScript" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "4. Checking if script exists..." -ForegroundColor Yellow
if (Test-Path $startScript) {
    Write-Host "   ✅ Script found: $startScript" -ForegroundColor Green
} else {
    Write-Host "   ❌ Script not found: $startScript" -ForegroundColor Red
    Write-Host "   This is the problem! Script path is incorrect." -ForegroundColor Red
}

Write-Host ""
Write-Host "5. Checking Node.js..." -ForegroundColor Yellow
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if ($nodePath) {
    Write-Host "   ✅ Node.js found: $($nodePath.Source)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js not found in PATH!" -ForegroundColor Red
    Write-Host "   Task will fail without Node.js" -ForegroundColor Red
}

Write-Host ""
Write-Host "6. Testing script manually..." -ForegroundColor Yellow
Write-Host "   Run this command to test:" -ForegroundColor Gray
Write-Host "   powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startScript`"" -ForegroundColor Yellow

Write-Host ""
Write-Host "7. Checking last run result..." -ForegroundColor Yellow
if ($taskInfo) {
    $lastResult = $taskInfo.LastTaskResult
    $lastRun = $taskInfo.LastRunTime
    
    if ($lastRun) {
        Write-Host "   Last Run: $lastRun" -ForegroundColor Gray
        Write-Host "   Last Result: $lastResult" -ForegroundColor $(if ($lastResult -eq 0) { "Green" } else { "Red" })
        
        if ($lastResult -ne 0) {
            Write-Host ""
            Write-Host "   ❌ Task failed with error code: $lastResult" -ForegroundColor Red
            Write-Host "   Check Event Viewer for details:" -ForegroundColor Yellow
            Write-Host "   Win + R → eventvwr.msc → Windows Logs → Application" -ForegroundColor Gray
        }
    } else {
        Write-Host "   Task has never run" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Recommended Actions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Test the script manually first:" -ForegroundColor Yellow
Write-Host "   .\START_BACKGROUND.ps1" -ForegroundColor White
Write-Host ""

Write-Host "2. If script works, run the task manually:" -ForegroundColor Yellow
Write-Host "   Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host ""

Write-Host "3. Check if app is running:" -ForegroundColor Yellow
Write-Host "   .\CHECK_STATUS.ps1" -ForegroundColor White
Write-Host ""

Write-Host "4. View task in Task Scheduler:" -ForegroundColor Yellow
Write-Host "   Win + R → taskschd.msc" -ForegroundColor White
Write-Host "   Look for: $taskName" -ForegroundColor Gray
Write-Host ""

Write-Host "5. Check Event Viewer for errors:" -ForegroundColor Yellow
Write-Host "   Win + R → eventvwr.msc" -ForegroundColor White
Write-Host "   Windows Logs → Application" -ForegroundColor Gray
Write-Host "   Filter by: Task Scheduler" -ForegroundColor Gray
Write-Host ""


