# Background Startup Script
# Runs the application silently in the background

$ErrorActionPreference = "Continue"

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Gym Management System" -ForegroundColor Cyan
Write-Host "  (Running in Background)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    Write-Host "💡 Install Node.js: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if already running by checking ports
$backendPort = 5001
$frontendPort = 5173

$backendRunning = $false
$frontendRunning = $false

try {
    $backendTest = Test-NetConnection -ComputerName localhost -Port $backendPort -WarningAction SilentlyContinue -InformationLevel Quiet -ErrorAction SilentlyContinue
    $backendRunning = $backendTest
} catch {
    $backendRunning = $false
}

try {
    $frontendTest = Test-NetConnection -ComputerName localhost -Port $frontendPort -WarningAction SilentlyContinue -InformationLevel Quiet -ErrorAction SilentlyContinue
    $frontendRunning = $frontendTest
} catch {
    $frontendRunning = $false
}

if ($backendRunning -or $frontendRunning) {
    Write-Host "⚠️  Application is already running!" -ForegroundColor Yellow
    Write-Host "   Use STOP_BACKGROUND.ps1 to stop it first" -ForegroundColor Gray
    exit 1
}

# Create logs directory
$logsDir = Join-Path $scriptDir "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing root dependencies..." -ForegroundColor Gray
    npm install --silent 2>&1 | Out-Null
}

if (-not (Test-Path "backend\node_modules")) {
    Write-Host "   Installing backend dependencies..." -ForegroundColor Gray
    Set-Location backend
    npm install --silent 2>&1 | Out-Null
    Set-Location ..
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "   Installing frontend dependencies..." -ForegroundColor Gray
    Set-Location frontend
    npm install --silent 2>&1 | Out-Null
    Set-Location ..
}

Write-Host ""
Write-Host "🚀 Starting servers in background..." -ForegroundColor Yellow

# Start backend
$backendLog = Join-Path $logsDir "backend.log"
$backendScriptPath = Join-Path $env:TEMP "gym_backend_start.ps1"

# Create backend script
$backendScript = @"
`$ErrorActionPreference = 'Continue'
Set-Location '$scriptDir\backend'
`$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
`$logFile = '$backendLog'
npm run dev 2>&1 | Tee-Object -FilePath `$logFile -Append
"@

$backendScript | Out-File -FilePath $backendScriptPath -Encoding UTF8 -Force

# Start backend process
Start-Process powershell.exe -ArgumentList "-WindowStyle","Hidden","-ExecutionPolicy","Bypass","-NoExit","-File","`"$backendScriptPath`"" -WindowStyle Hidden | Out-Null

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend
$frontendLog = Join-Path $logsDir "frontend.log"
$frontendScriptPath = Join-Path $env:TEMP "gym_frontend_start.ps1"

# Create frontend script
$frontendScript = @"
`$ErrorActionPreference = 'Continue'
Set-Location '$scriptDir\frontend'
`$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
`$logFile = '$frontendLog'
npm run dev 2>&1 | Tee-Object -FilePath `$logFile -Append
"@

$frontendScript | Out-File -FilePath $frontendScriptPath -Encoding UTF8 -Force

# Start frontend process
Start-Process powershell.exe -ArgumentList "-WindowStyle","Hidden","-ExecutionPolicy","Bypass","-NoExit","-File","`"$frontendScriptPath`"" -WindowStyle Hidden | Out-Null

# Wait for servers to start and verify
Write-Host "   Waiting for servers to start..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# Verify servers are running
$backendStarted = $false
$frontendStarted = $false

for ($i = 1; $i -le 10; $i++) {
    Start-Sleep -Seconds 2
    try {
        $backendTest = Test-NetConnection -ComputerName localhost -Port $backendPort -WarningAction SilentlyContinue -InformationLevel Quiet -ErrorAction SilentlyContinue
        if ($backendTest) { $backendStarted = $true }
    } catch {}
    
    try {
        $frontendTest = Test-NetConnection -ComputerName localhost -Port $frontendPort -WarningAction SilentlyContinue -InformationLevel Quiet -ErrorAction SilentlyContinue
        if ($frontendTest) { $frontendStarted = $true }
    } catch {}
    
    if ($backendStarted -and $frontendStarted) { break }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
if ($backendStarted -and $frontendStarted) {
    Write-Host "  ✅ Application Started Successfully!" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Application Starting..." -ForegroundColor Yellow
    if (-not $backendStarted) {
        Write-Host "  ⚠️  Backend may still be starting..." -ForegroundColor Yellow
    }
    if (-not $frontendStarted) {
        Write-Host "  ⚠️  Frontend may still be starting..." -ForegroundColor Yellow
    }
}
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Access your website at:" -ForegroundColor Cyan
Write-Host "   http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Backend API at:" -ForegroundColor Cyan
Write-Host "   http://localhost:5001/api" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Logs are saved in: $logsDir" -ForegroundColor Gray
Write-Host ""
if (-not ($backendStarted -and $frontendStarted)) {
    Write-Host "💡 If servers don't start, check logs:" -ForegroundColor Gray
    Write-Host "   Get-Content $logsDir\backend.log -Tail 20" -ForegroundColor Yellow
    Write-Host "   Get-Content $logsDir\frontend.log -Tail 20" -ForegroundColor Yellow
    Write-Host ""
}
Write-Host "💡 To stop the application, run:" -ForegroundColor Gray
Write-Host "   .\STOP_BACKGROUND.ps1" -ForegroundColor Yellow
Write-Host ""
