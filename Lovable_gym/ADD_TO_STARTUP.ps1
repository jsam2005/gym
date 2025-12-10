# Add Gym Management to Windows Startup
# This script creates a shortcut in the Startup folder

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Add to Windows Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$startupScript = Join-Path $scriptDir "START_BACKEND_AND_TUNNEL.ps1"

# Get Startup folder path
$startupFolder = [System.Environment]::GetFolderPath("Startup")

Write-Host "Script location: $startupScript" -ForegroundColor Gray
Write-Host "Startup folder: $startupFolder" -ForegroundColor Gray
Write-Host ""

# Check if script exists
if (-not (Test-Path $startupScript)) {
    Write-Host "❌ START_BACKEND_AND_TUNNEL.ps1 not found!" -ForegroundColor Red
    Write-Host "   Make sure you're running this from the project root.`n" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Create shortcut
$shortcutPath = Join-Path $startupFolder "Gym Management Auto-Start.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)

$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-ExecutionPolicy Bypass -NoExit -File `"$startupScript`""
$shortcut.WorkingDirectory = $scriptDir
$shortcut.Description = "Auto-start Gym Management Backend and Tunnel"
$shortcut.Save()

Write-Host "✅ Shortcut created in Startup folder!" -ForegroundColor Green
Write-Host ""
Write-Host "Shortcut: $shortcutPath" -ForegroundColor Gray
Write-Host ""
Write-Host "The script will run automatically when Windows starts." -ForegroundColor Cyan
Write-Host ""
Write-Host "To test:" -ForegroundColor Yellow
Write-Host "   1. Restart your computer" -ForegroundColor White
Write-Host "   2. Or run manually: .\START_BACKEND_AND_TUNNEL.ps1`n" -ForegroundColor White
Write-Host "To remove:" -ForegroundColor Yellow
Write-Host "   Delete the shortcut from Startup folder`n" -ForegroundColor White

Read-Host "Press Enter to exit"



