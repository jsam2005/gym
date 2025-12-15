# Stop All Running Servers and Tunnels

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stopping All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop Node.js processes (backend)
Write-Host "🛑 Stopping backend servers..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ Stopped $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No Node.js processes found" -ForegroundColor Gray
}

# Stop cloudflared processes (tunnel)
Write-Host "🛑 Stopping cloudflared tunnels..." -ForegroundColor Yellow
$cloudflaredProcesses = Get-Process -Name cloudflared -ErrorAction SilentlyContinue
if ($cloudflaredProcesses) {
    $cloudflaredProcesses | Stop-Process -Force
    Write-Host "✅ Stopped $($cloudflaredProcesses.Count) cloudflared process(es)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No cloudflared processes found" -ForegroundColor Gray
}

# Stop SSH processes (localhost.run tunnel)
Write-Host "🛑 Stopping SSH tunnels..." -ForegroundColor Yellow
$sshProcesses = Get-Process -Name ssh -ErrorAction SilentlyContinue | Where-Object { 
    try {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
        $cmdLine -like "*ssh.localhost.run*"
    } catch {
        $false
    }
}
if ($sshProcesses) {
    $sshProcesses | Stop-Process -Force
    Write-Host "✅ Stopped $($sshProcesses.Count) SSH tunnel process(es)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No SSH tunnel processes found" -ForegroundColor Gray
}

# Stop tsx processes (TypeScript execution)
Write-Host "🛑 Stopping TypeScript processes..." -ForegroundColor Yellow
$tsxProcesses = Get-Process -Name tsx -ErrorAction SilentlyContinue
if ($tsxProcesses) {
    $tsxProcesses | Stop-Process -Force
    Write-Host "✅ Stopped $($tsxProcesses.Count) tsx process(es)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No tsx processes found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ All services stopped" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"

