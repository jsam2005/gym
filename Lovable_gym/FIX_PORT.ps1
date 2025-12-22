# Fix Port Conflict Script
# This script finds and stops processes using ports 5001 and 5173

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fixing Port Conflicts" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to find and kill process on a port
function Stop-ProcessOnPort {
    param(
        [int]$Port
    )
    
    Write-Host "🔍 Checking port $Port..." -ForegroundColor Yellow
    
    try {
        # Find process using the port
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        
        if ($connection) {
            $processId = $connection.OwningProcess | Select-Object -Unique
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                Write-Host "   Found process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
                Write-Host "   Stopping process..." -ForegroundColor Gray
                
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                
                Start-Sleep -Seconds 2
                
                # Verify it's stopped
                $verify = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
                if (-not $verify) {
                    Write-Host "   ✅ Port $Port is now free" -ForegroundColor Green
                } else {
                    Write-Host "   ⚠️  Port $Port may still be in use" -ForegroundColor Yellow
                }
            } else {
                Write-Host "   ℹ️  No process found on port $Port" -ForegroundColor Gray
            }
        } else {
            Write-Host "   ✅ Port $Port is free" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ℹ️  Port $Port is free (or check requires admin rights)" -ForegroundColor Gray
    }
}

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Note: Some operations may require administrator privileges" -ForegroundColor Yellow
    Write-Host ""
}

# Stop processes on ports 5001 and 5173
Write-Host "Checking and freeing ports..." -ForegroundColor Cyan
Write-Host ""

Stop-ProcessOnPort -Port 5001
Stop-ProcessOnPort -Port 5173

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Port Check Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to start Docker
$response = Read-Host "Would you like to start Docker containers now? (Y/N)"
if ($response -eq 'Y' -or $response -eq 'y') {
    Write-Host ""
    Write-Host "🚀 Starting Docker containers..." -ForegroundColor Yellow
    Write-Host ""
    docker-compose up -d
} else {
    Write-Host ""
    Write-Host "💡 To start Docker containers manually, run:" -ForegroundColor Gray
    Write-Host "   docker-compose up -d" -ForegroundColor Yellow
    Write-Host ""
}

Read-Host "Press Enter to exit"

