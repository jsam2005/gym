# Stop Background Application
# Stops all running instances of the application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stopping Gym Management System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "🛑 Stopping servers..." -ForegroundColor Yellow

# Find and stop Node.js processes related to the app
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

$stopped = $false

foreach ($process in $nodeProcesses) {
    try {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $($process.Id)" -ErrorAction SilentlyContinue
        if ($proc) {
            $commandLine = $proc.CommandLine
            
            if ($commandLine -and (
                $commandLine -like "*$scriptDir\backend*" -or 
                $commandLine -like "*$scriptDir\frontend*" -or
                $commandLine -like "*backend*dev*" -or
                $commandLine -like "*frontend*dev*" -or
                $commandLine -like "*vite*" -or
                $commandLine -like "*tsx*"
            )) {
                Write-Host "   Stopping process (PID: $($process.Id))..." -ForegroundColor Gray
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                $stopped = $true
            }
        }
    } catch {
        # Ignore errors
    }
}

# Also stop any PowerShell processes running our background scripts
$psProcesses = Get-Process -Name powershell -ErrorAction SilentlyContinue
foreach ($process in $psProcesses) {
    try {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $($process.Id)" -ErrorAction SilentlyContinue
        if ($proc) {
            $commandLine = $proc.CommandLine
            if ($commandLine -and ($commandLine -like "*gym_backend_start.ps1*" -or $commandLine -like "*gym_frontend_start.ps1*")) {
                Write-Host "   Stopping PowerShell process (PID: $($process.Id))..." -ForegroundColor Gray
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                $stopped = $true
            }
        }
    } catch {
        # Ignore errors
    }
}

if ($stopped) {
    Write-Host ""
    Write-Host "✅ Application stopped successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ℹ️  No running instances found" -ForegroundColor Yellow
}

Write-Host ""

