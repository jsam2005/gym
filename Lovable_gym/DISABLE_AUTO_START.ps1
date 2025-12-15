# Disable Auto-Start
# Removes the scheduled task that auto-starts the application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Disable Auto-Start" -ForegroundColor Cyan
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

# Task name
$taskName = "Start Gym Software (Local)"

# Check if task exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    try {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host ""
        Write-Host "✅ Auto-start disabled successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "The application will no longer start automatically on boot." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "💡 To re-enable auto-start, run:" -ForegroundColor Gray
        Write-Host "   .\SETUP_AUTO_START.ps1" -ForegroundColor Yellow
        Write-Host ""
    } catch {
        Write-Host ""
        Write-Host "❌ Error removing scheduled task:" -ForegroundColor Red
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "ℹ️  Auto-start is not currently enabled" -ForegroundColor Yellow
    Write-Host ""
}


