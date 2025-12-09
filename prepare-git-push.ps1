# Prepare Git Push - Clean and Push to GitHub
# Repository: https://github.com/jsam2005/gym.git

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Prepare Git Push to GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$repoUrl = "https://github.com/jsam2005/gym.git"

# Check if git is initialized
Write-Host "[1/5] Checking git status..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    Write-Host "   Initializing git repository..." -ForegroundColor Gray
    git init
    git branch -M main
}

# Check current remote
$currentRemote = git remote get-url origin -ErrorAction SilentlyContinue
if ($currentRemote) {
    Write-Host "   Current remote: $currentRemote" -ForegroundColor Gray
    if ($currentRemote -ne $repoUrl) {
        Write-Host "   Updating remote URL..." -ForegroundColor Yellow
        git remote set-url origin $repoUrl
    }
} else {
    Write-Host "   Adding remote: $repoUrl" -ForegroundColor Gray
    git remote add origin $repoUrl
}

Write-Host ""
Write-Host "[2/5] Cleaning up unwanted files..." -ForegroundColor Yellow

# Remove files that should be ignored
$filesToRemove = @(
    "monitor.log",
    "backupdata.dat",
    "user.dat",
    "eTimeTrackLiteWeb.zip",
    "strengthscape-admin-main.zip",
    "~`$ioServerNew-Web_API-Manual.docx"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force -ErrorAction SilentlyContinue
        Write-Host "   Removed: $file" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "[3/5] Checking .gitignore..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    Write-Host "   .gitignore exists" -ForegroundColor Green
} else {
    Write-Host "   WARNING: .gitignore not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "[4/5] Staging files..." -ForegroundColor Yellow

# Add all files (gitignore will exclude unwanted ones)
git add .

# Show what will be committed
Write-Host ""
Write-Host "Files staged for commit:" -ForegroundColor Cyan
git status --short | Select-Object -First 20
$totalFiles = (git status --short | Measure-Object).Count
if ($totalFiles -gt 20) {
    Write-Host "... and $($totalFiles - 20) more files" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[5/5] Ready to commit and push" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review changes: git status" -ForegroundColor White
Write-Host "2. Commit: git commit -m 'Prepare for Vercel deployment'" -ForegroundColor White
Write-Host "3. Push: git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "Or run automatically? (y/n)" -ForegroundColor Yellow
$auto = Read-Host

if ($auto -eq "y") {
    Write-Host ""
    Write-Host "Committing..." -ForegroundColor Yellow
    git commit -m "Prepare for Vercel deployment with Cloudflare Tunnel"
    
    Write-Host ""
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push -u origin main
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Push Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Run these commands manually:" -ForegroundColor Cyan
    Write-Host "git commit -m 'Prepare for Vercel deployment'" -ForegroundColor White
    Write-Host "git push -u origin main" -ForegroundColor White
}

Write-Host ""

