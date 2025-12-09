# PowerShell script to deploy Gym Management System to IIS
# This script copies backend and frontend to a single IIS folder

Write-Host "Deploying Gym Management System to IIS..." -ForegroundColor Green

# Configuration
$IIS_FOLDER = "C:\inetpub\wwwroot\gym"
$BACKEND_SOURCE = ".\backend"
$FRONTEND_DIST = ".\frontend\dist"

# Check if folders exist
if (-not (Test-Path $BACKEND_SOURCE)) {
    Write-Host "Backend folder not found: $BACKEND_SOURCE" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $FRONTEND_DIST)) {
    Write-Host "Frontend dist folder not found. Building frontend..." -ForegroundColor Yellow
    cd frontend
    npm run build
    cd ..
    if (-not (Test-Path $FRONTEND_DIST)) {
        Write-Host "Frontend build failed!" -ForegroundColor Red
        exit 1
    }
}

# Create IIS folder if it doesn't exist
if (-not (Test-Path $IIS_FOLDER)) {
    Write-Host "Creating IIS folder: $IIS_FOLDER" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $IIS_FOLDER -Force | Out-Null
}

# Copy backend files (excluding source files and node_modules)
Write-Host "Copying backend files..." -ForegroundColor Cyan
$backendFiles = @(
    "dist",
    "node_modules",
    "package.json",
    "package-lock.json",
    "web.config",
    ".env"
)

foreach ($item in $backendFiles) {
    $sourcePath = Join-Path $BACKEND_SOURCE $item
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $IIS_FOLDER $item
        if (Test-Path $destPath) {
            Remove-Item -Path $destPath -Recurse -Force -ErrorAction SilentlyContinue
        }
        Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
    }
}

# Copy frontend dist files
Write-Host "Copying frontend files..." -ForegroundColor Cyan
Copy-Item -Path "$FRONTEND_DIST\*" -Destination $IIS_FOLDER -Recurse -Force

# Ensure .env file exists (copy from backend if available)
if (Test-Path "$BACKEND_SOURCE\.env") {
    Write-Host "Copying .env file..." -ForegroundColor Cyan
    Copy-Item -Path "$BACKEND_SOURCE\.env" -Destination "$IIS_FOLDER\.env" -Force
} else {
    Write-Host "Warning: .env file not found. Please create it manually in $IIS_FOLDER" -ForegroundColor Yellow
}

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Files deployed to: $IIS_FOLDER" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open IIS Manager" -ForegroundColor White
Write-Host "2. Create a new website pointing to: $IIS_FOLDER" -ForegroundColor White
Write-Host "3. Set Application Pool to No Managed Code" -ForegroundColor White
Write-Host "4. Configure port 80 or 5000" -ForegroundColor White
Write-Host "5. Ensure iisnode is installed" -ForegroundColor White
