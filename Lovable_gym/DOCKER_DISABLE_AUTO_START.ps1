# Docker Auto-Start Disable Script
# This script removes the auto-start scheduled task

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Disable Docker Auto-Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script requires administrator privileges" -ForegroundColor Red
    Write-Host "💡 Please run PowerShell as Administrator" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

$taskName = "GymManagement-Docker-AutoStart"

# Check if task exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if (-not $existingTask) {
    Write-Host "ℹ️  Task '$taskName' not found" -ForegroundColor Yellow
    Write-Host "   Auto-start is not configured" -ForegroundColor Gray
    Read-Host "Press Enter to exit"
    exit 0
}

Write-Host "📋 Found task: $taskName" -ForegroundColor Yellow
Write-Host ""

$response = Read-Host "Do you want to remove the auto-start task? (Y/N)"
if ($response -eq 'Y' -or $response -eq 'y') {
    try {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "✅ Auto-start task removed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "💡 Containers will no longer start automatically on boot" -ForegroundColor Yellow
        Write-Host "   You can still start them manually with: docker-compose up -d" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Error removing task: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️  Task removal cancelled" -ForegroundColor Gray
}

Write-Host ""
Read-Host "Press Enter to exit"

