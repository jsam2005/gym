# Check status of Gym backend Windows service

$serviceName = "Gym Management Backend"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$logsDir = Join-Path $scriptDir "logs"
$stderrLog = Join-Path $logsDir "backend-err.log"
$stdoutLog = Join-Path $logsDir "backend-out.log"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Windows Service Status (Backend)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "Service not found: $serviceName" -ForegroundColor Red
    exit 1
}

Write-Host "Service: $serviceName" -ForegroundColor Cyan
Write-Host "Status:  $($service.Status)" -ForegroundColor Yellow
Write-Host ""

if ($service.Status -eq "Running") {
    Write-Host "Health check URL: http://localhost:5001/api/health" -ForegroundColor Green
    Write-Host "App URL:         http://localhost:5001" -ForegroundColor Green
} else {
    Write-Host "Service is not running." -ForegroundColor Red
}

Write-Host ""
Write-Host "Logs:" -ForegroundColor Cyan
Write-Host "  Stdout: $stdoutLog" -ForegroundColor Gray
Write-Host "  Stderr: $stderrLog" -ForegroundColor Gray
