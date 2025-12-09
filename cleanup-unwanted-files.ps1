# Remove Unwanted Files from Git Tracking
# This removes files that shouldn't be in the repository

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Unwanted Files from Git" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Files to remove from git (but keep locally)
$filesToRemove = @(
    # Temporary PowerShell scripts
    "authenticate-with-token.ps1",
    "download-certificate.ps1",
    "download-credentials-final.ps1",
    "fix-tunnel-auth.ps1",
    "get-credentials-with-account.ps1",
    "get-tcp-hostname.ps1",
    "get-tunnel-credentials.ps1",
    "get-tunnel-hostname.ps1",
    "quick-tunnel-test.ps1",
    "run-quick-tunnel-no-config.ps1",
    "run-quick-tunnel.ps1",
    "run-tunnel-and-get-hostname.ps1",
    "setup-tunnel-hostname-api.ps1",
    "configure-tunnel-routes-api.ps1",
    "create-config-manual.ps1",
    "fix-tunnel-config.ps1",
    "prepare-git-push.ps1",
    
    # Old setup guides
    "ACCESS_LOGS_FIX.md",
    "COMPLETE_SYNC_GUIDE.md",
    "COMPLETE_USER_CREATION_GUIDE.md",
    "FIX_500_19_ERROR.md",
    "FIX-CLOUDFLARED-PATH.md",
    "IIS_FINAL_SETUP.md",
    "IIS_NEXT_STEPS.md",
    "IIS_SETUP_GUIDE.md",
    "IMMEDIATE_FIX.md",
    "INSTALL_IISNODE.md",
    "QUICK_FIX_500.md",
    "QUICK_IIS_SETUP.md",
    "REFRESH_BUTTON_FIX.md",
    "STATUS_CHECK.md",
    "TROUBLESHOOT_500_ERROR.md",
    "TRACKLIE_SQL_SETUP.md",
    
    # Other unwanted files
    "deploy-to-iis.ps1"
)

Write-Host "Removing unwanted files from git tracking..." -ForegroundColor Yellow
Write-Host ""

$removedCount = 0
foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        # Remove from git but keep file locally
        git rm --cached $file -q 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   Removed from git: $file" -ForegroundColor Green
            $removedCount++
        }
    }
}

Write-Host ""
Write-Host "Removed $removedCount files from git tracking" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files are still on your local disk but won't be tracked by git." -ForegroundColor Gray
Write-Host ""
Write-Host "Next: Commit and push the cleanup" -ForegroundColor Yellow
Write-Host "git commit -m 'Remove unwanted files from tracking'" -ForegroundColor White
Write-Host "git push" -ForegroundColor White
Write-Host ""

$commit = Read-Host "Commit and push now? (y/n)"
if ($commit -eq "y") {
    git commit -m "Remove unwanted files from git tracking"
    git push
    Write-Host ""
    Write-Host "Cleanup complete!" -ForegroundColor Green
}

