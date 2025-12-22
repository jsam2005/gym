# Docker Auto-Start Setup Script
# This script creates a Windows Task Scheduler task to auto-start Docker containers on boot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Docker Auto-Start Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[ERROR] This script requires administrator privileges" -ForegroundColor Red
    Write-Host "[INFO] Please run PowerShell as Administrator" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Right-click PowerShell -> Run as Administrator" -ForegroundColor Gray
    Read-Host "Press Enter to exit"
    exit 1
}

# Get the current directory
$scriptPath = $PSScriptRoot
$dockerComposePath = Join-Path $scriptPath "docker-compose.yml"

if (-not (Test-Path $dockerComposePath)) {
    Write-Host "[ERROR] docker-compose.yml not found in: $scriptPath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[INFO] Configuration:" -ForegroundColor Yellow
Write-Host "   Script Path: $scriptPath" -ForegroundColor Gray
Write-Host "   Docker Compose: $dockerComposePath" -ForegroundColor Gray
Write-Host ""

# Create PowerShell script that will be executed by Task Scheduler
$startScript = @"
# Auto-start Docker containers
Set-Location '$scriptPath'
docker-compose up -d
"@

$startScriptPath = Join-Path $scriptPath "docker-auto-start.ps1"
$startScript | Out-File -FilePath $startScriptPath -Encoding UTF8

Write-Host "[SUCCESS] Created startup script: docker-auto-start.ps1" -ForegroundColor Green
Write-Host ""

# Task name
$taskName = "GymManagement-Docker-AutoStart"

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "[WARNING] Task '$taskName' already exists" -ForegroundColor Yellow
    $response = Read-Host "Do you want to remove and recreate it? (Y/N)"
    if ($response -eq 'Y' -or $response -eq 'y') {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "[SUCCESS] Removed existing task" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Keeping existing task" -ForegroundColor Gray
        Read-Host "Press Enter to exit"
        exit 0
    }
}

Write-Host ""
Write-Host "[INFO] Creating scheduled task..." -ForegroundColor Yellow

# Create the scheduled task action
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$startScriptPath`""

# Create trigger (on system startup)
$trigger = New-ScheduledTaskTrigger -AtStartup

# Create settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false

# Create principal (run as current user)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive

# Register the task
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Auto-start Gym Management System Docker containers on system boot" `
        -Force | Out-Null
    
    Write-Host "[SUCCESS] Scheduled task created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  [SUCCESS] Auto-Start Configured!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[INFO] Task Details:" -ForegroundColor Cyan
    Write-Host "   Name: $taskName" -ForegroundColor Gray
    Write-Host "   Trigger: On System Startup" -ForegroundColor Gray
    Write-Host "   Action: Start Docker containers" -ForegroundColor Gray
    Write-Host ""
    Write-Host "[INFO] The containers will automatically start when you boot your computer" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[INFO] To manage the task:" -ForegroundColor Gray
    Write-Host "   - View: Task Scheduler -> Task Scheduler Library -> $taskName" -ForegroundColor Gray
    Write-Host "   - Disable: Disable-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host "   - Remove: Unregister-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Error creating scheduled task: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Read-Host "Press Enter to exit"
