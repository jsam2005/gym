# Fix Task Scheduler Configuration
# Recreates the task with correct settings

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix Task Scheduler Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Administrator privileges required!" -ForegroundColor Yellow
    Write-Host "   Right-click and select 'Run as Administrator'" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$startScript = Join-Path $scriptDir "START_BACKGROUND.ps1"

# Task name
$taskName = "Start Gym Software (Local)"

Write-Host "📝 Removing old task (if exists)..." -ForegroundColor Yellow

# Remove existing task
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host "📝 Creating new task with correct settings..." -ForegroundColor Yellow

# Verify script exists
if (-not (Test-Path $startScript)) {
    Write-Host ""
    Write-Host "❌ Script not found: $startScript" -ForegroundColor Red
    Write-Host "   Make sure you're running this from the Lovable_gym folder" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Create the action with FULL path
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startScript`""

# Create trigger - at logon
$trigger = New-ScheduledTaskTrigger -AtLogOn

# Create settings with better options
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -MultipleInstances IgnoreNew

# Create principal - run as current user, interactive
$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType Interactive `
    -RunLevel Highest

# Register the task
try {
    Register-ScheduledTask -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Auto-start Gym Management System on Windows boot" | Out-Null
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ Task Created Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Task Details:" -ForegroundColor Cyan
    Write-Host "   Name: $taskName" -ForegroundColor Gray
    Write-Host "   Trigger: At Logon" -ForegroundColor Gray
    Write-Host "   Script: $startScript" -ForegroundColor Gray
    Write-Host "   User: $env:USERDOMAIN\$env:USERNAME" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "🧪 Testing task now..." -ForegroundColor Yellow
    Start-Sleep -Seconds 1
    
    # Test run the task
    Start-ScheduledTask -TaskName $taskName
    Start-Sleep -Seconds 3
    
    Write-Host ""
    Write-Host "✅ Task started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Wait 10-15 seconds for servers to start" -ForegroundColor Gray
    Write-Host "   2. Run: .\CHECK_STATUS.ps1" -ForegroundColor Yellow
    Write-Host "   3. Open: http://localhost:5173" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 To verify task is working:" -ForegroundColor Gray
    Write-Host "   - Open Task Scheduler (Win + R → taskschd.msc)" -ForegroundColor Gray
    Write-Host "   - Find: $taskName" -ForegroundColor Gray
    Write-Host "   - Check 'Last Run Result' should be 0x0" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Error creating task:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}


