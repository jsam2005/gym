# Check Application Status
# Shows if the application is running and provides access URLs

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Gym Management System - Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check for running processes
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
$backendRunning = $false
$frontendRunning = $false

foreach ($process in $nodeProcesses) {
    try {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $($process.Id)" -ErrorAction SilentlyContinue
        if ($proc) {
            $commandLine = $proc.CommandLine
            
            if ($commandLine -and (
                $commandLine -like "*$scriptDir\backend*" -or 
                $commandLine -like "*backend*dev*" -or
                $commandLine -like "*tsx*backend*"
            )) {
                $backendRunning = $true
            }
            if ($commandLine -and (
                $commandLine -like "*$scriptDir\frontend*" -or 
                $commandLine -like "*frontend*dev*" -or
                $commandLine -like "*vite*"
            )) {
                $frontendRunning = $true
            }
        }
    } catch {
        # Ignore errors
    }
}

# Check if ports are listening
$backendPort = 5001
$frontendPort = 5173

$backendPortOpen = $false
$frontendPortOpen = $false

try {
    $backendConnection = Test-NetConnection -ComputerName localhost -Port $backendPort -WarningAction SilentlyContinue -InformationLevel Quiet
    $backendPortOpen = $backendConnection
} catch {
    $backendPortOpen = $false
}

try {
    $frontendConnection = Test-NetConnection -ComputerName localhost -Port $frontendPort -WarningAction SilentlyContinue -InformationLevel Quiet
    $frontendPortOpen = $frontendConnection
} catch {
    $frontendPortOpen = $false
}

# Display status
Write-Host "Backend Server:" -ForegroundColor Cyan
if ($backendRunning -or $backendPortOpen) {
    Write-Host "   Status: ✅ Running" -ForegroundColor Green
    Write-Host "   URL:    http://localhost:$backendPort/api" -ForegroundColor Yellow
} else {
    Write-Host "   Status: ❌ Not Running" -ForegroundColor Red
}

Write-Host ""
Write-Host "Frontend Server:" -ForegroundColor Cyan
if ($frontendRunning -or $frontendPortOpen) {
    Write-Host "   Status: ✅ Running" -ForegroundColor Green
    Write-Host "   URL:    http://localhost:$frontendPort" -ForegroundColor Yellow
} else {
    Write-Host "   Status: ❌ Not Running" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($backendPortOpen -and $frontendPortOpen) {
    Write-Host ""
    Write-Host "🌐 Your site is live at:" -ForegroundColor Green
    Write-Host "   http://localhost:$frontendPort" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host ""
    Write-Host "💡 You can access this from other devices on your network using:" -ForegroundColor Gray
    $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" }).IPAddress | Select-Object -First 1
    if ($ipAddress) {
        $networkUrl = "http://${ipAddress}:${frontendPort}"
        Write-Host "   $networkUrl" -ForegroundColor Yellow -BackgroundColor Black
    }
} else {
    Write-Host ""
    Write-Host "💡 To start the application, run:" -ForegroundColor Gray
    Write-Host "   .\START_BACKGROUND.ps1" -ForegroundColor Yellow
}

Write-Host ""

