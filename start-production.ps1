# Production Startup Script
# Starts local API server and Cloudflare tunnel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Gym Management - Production Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if cloudflared is installed
$cloudflaredPath = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflaredPath) {
    Write-Host "❌ cloudflared not found in PATH" -ForegroundColor Red
    Write-Host "💡 Install cloudflared first:" -ForegroundColor Yellow
    Write-Host "   winget install --id Cloudflare.cloudflared" -ForegroundColor Gray
    Write-Host "   OR download from: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Gray
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Node.js is installed
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "❌ Node.js not found in PATH" -ForegroundColor Red
    Write-Host "💡 Install Node.js first: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$localApiPath = Join-Path $scriptDir "local-api-server.js"

# Check if local-api-server.js exists
if (-not (Test-Path $localApiPath)) {
    Write-Host "❌ local-api-server.js not found at: $localApiPath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green
Write-Host ""

# Function to start local API server
function Start-LocalApiServer {
    Write-Host "🚀 Starting Local API Server..." -ForegroundColor Yellow
    Write-Host "   Port: 3001" -ForegroundColor Gray
    Write-Host "   File: local-api-server.js" -ForegroundColor Gray
    
    $apiProcess = Start-Process -FilePath "node" `
        -ArgumentList $localApiPath `
        -PassThru `
        -NoNewWindow `
        -RedirectStandardOutput "$scriptDir\api-server.log" `
        -RedirectStandardError "$scriptDir\api-server-error.log"
    
    Start-Sleep -Seconds 3
    
    # Check if process is still running
    if (-not (Get-Process -Id $apiProcess.Id -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Local API Server failed to start" -ForegroundColor Red
        Write-Host "💡 Check logs: api-server-error.log" -ForegroundColor Yellow
        return $null
    }
    
    Write-Host "✅ Local API Server started (PID: $($apiProcess.Id))" -ForegroundColor Green
    return $apiProcess
}

# Function to start Cloudflare tunnel
function Start-CloudflareTunnel {
    param(
        [string]$TunnelName = "gym-api-tunnel"
    )
    
    Write-Host ""
    Write-Host "🌐 Starting Cloudflare Tunnel..." -ForegroundColor Yellow
    Write-Host "   Tunnel: $TunnelName" -ForegroundColor Gray
    Write-Host "   Target: http://localhost:3001" -ForegroundColor Gray
    
    # Check if named tunnel exists
    $tunnelExists = cloudflared tunnel list 2>&1 | Select-String -Pattern $TunnelName
    
    if ($tunnelExists) {
        Write-Host "   Using named tunnel: $TunnelName" -ForegroundColor Gray
        $tunnelProcess = Start-Process -FilePath "cloudflared" `
            -ArgumentList "tunnel", "run", $TunnelName `
            -PassThru `
            -NoNewWindow `
            -RedirectStandardOutput "$scriptDir\tunnel.log" `
            -RedirectStandardError "$scriptDir\tunnel-error.log"
    } else {
        Write-Host "   Named tunnel not found, using quick tunnel" -ForegroundColor Yellow
        Write-Host "   💡 For production, create named tunnel:" -ForegroundColor Gray
        Write-Host "      cloudflared tunnel create $TunnelName" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   ⚠️  IMPORTANT: The tunnel URL will be displayed in this window." -ForegroundColor Yellow
        Write-Host "   Look for a line like: https://xxxxx.trycloudflare.com" -ForegroundColor Yellow
        Write-Host ""
        $tunnelProcess = Start-Process -FilePath "cloudflared" `
            -ArgumentList "tunnel", "--url", "http://localhost:3001" `
            -PassThru `
            -WindowStyle Normal `
            -RedirectStandardOutput "$scriptDir\tunnel.log" `
            -RedirectStandardError "$scriptDir\tunnel-error.log"
    }
    
    Start-Sleep -Seconds 5
    
    # Check if process is still running
    if (-not (Get-Process -Id $tunnelProcess.Id -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Cloudflare Tunnel failed to start" -ForegroundColor Red
        Write-Host "💡 Check logs: tunnel-error.log" -ForegroundColor Yellow
        Write-Host "💡 Make sure you're logged in: cloudflared tunnel login" -ForegroundColor Yellow
        return $null
    }
    
    Write-Host "✅ Cloudflare Tunnel started (PID: $($tunnelProcess.Id))" -ForegroundColor Green
    return $tunnelProcess
}

# Function to monitor processes
function Monitor-Processes {
    param(
        [System.Diagnostics.Process]$ApiProcess,
        [System.Diagnostics.Process]$TunnelProcess
    )
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Monitoring Services..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 Status:" -ForegroundColor Yellow
    Write-Host "   Local API Server: PID $($ApiProcess.Id)" -ForegroundColor Gray
    Write-Host "   Cloudflare Tunnel: PID $($TunnelProcess.Id)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📝 Logs:" -ForegroundColor Yellow
    Write-Host "   API Server: api-server.log" -ForegroundColor Gray
    Write-Host "   Tunnel: tunnel.log" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  Press Ctrl+C to stop all services" -ForegroundColor Yellow
    Write-Host ""
    
    # Monitor loop
    while ($true) {
        $apiRunning = Get-Process -Id $ApiProcess.Id -ErrorAction SilentlyContinue
        $tunnelRunning = Get-Process -Id $TunnelProcess.Id -ErrorAction SilentlyContinue
        
        if (-not $apiRunning) {
            Write-Host "❌ Local API Server stopped unexpectedly!" -ForegroundColor Red
            break
        }
        
        if (-not $tunnelRunning) {
            Write-Host "❌ Cloudflare Tunnel stopped unexpectedly!" -ForegroundColor Red
            break
        }
        
        Start-Sleep -Seconds 10
    }
}

# Main execution
try {
    # Start local API server
    $apiProcess = Start-LocalApiServer
    if (-not $apiProcess) {
        exit 1
    }
    
    # Wait a bit for API server to fully start
    Start-Sleep -Seconds 2
    
    # Start Cloudflare tunnel
    $tunnelProcess = Start-CloudflareTunnel
    if (-not $tunnelProcess) {
        Write-Host ""
        Write-Host "⚠️  Stopping API server..." -ForegroundColor Yellow
        Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
        exit 1
    }
    
    # Monitor both processes
    Monitor-Processes -ApiProcess $apiProcess -TunnelProcess $tunnelProcess
    
} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
} finally {
    Write-Host ""
    Write-Host "🛑 Shutting down services..." -ForegroundColor Yellow
    
    if ($apiProcess) {
        Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Local API Server stopped" -ForegroundColor Green
    }
    
    if ($tunnelProcess) {
        Stop-Process -Id $tunnelProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Cloudflare Tunnel stopped" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
}

