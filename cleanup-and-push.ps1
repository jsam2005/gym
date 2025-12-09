# Cleanup unwanted files and push to GitHub

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleaning Up and Pushing to GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Files to KEEP (local API solution)
$keepFiles = @(
    "local-api-server.js",
    "start-local-api.ps1",
    "expose-local-api.ps1",
    "UPDATE_VERCEL_BACKEND.md",
    "LOCAL_API_SOLUTION.md"
)

# Delete unwanted tunnel-related files
Write-Host "Deleting unwanted tunnel files..." -ForegroundColor Yellow

$filesToDelete = @(
    # Bore files
    "retry-bore-with-timeout.ps1",
    "start-bore.ps1",
    "install-bore.ps1",
    "install-bore-binary.ps1",
    "download-bore-manual.ps1",
    "add-bore-exclusion.ps1",
    "fix-bore-antivirus.ps1",
    "BORE_READY.md",
    "BORE_RUNNING.md",
    "BORE_TIMEOUT_FIX.md",
    "QUICK_BORE_SETUP.md",
    "MANUAL_BORE_INSTALL.md",
    "ANTIVIRUS_FIX.md",
    "BROWSER_DOWNLOAD.md",
    
    # Cloudflare files
    "simple-cloudflare-setup.ps1",
    "start-cloudflare-tcp.ps1",
    "setup-cloudflare-tcp-tunnel.ps1",
    "CLOUDFLARE_QUICK.md",
    "CLOUDFLARE_TCP_ISSUE.md",
    
    # localhost.run files
    "start-localhost-run.ps1",
    "start-localhost-run-with-key.ps1",
    "LOCALHOST_RUN_GUIDE.md",
    "LOCALHOST_RUN_LIMITATION.md",
    "FIXED_LOCALHOST_RUN.md",
    
    # ngrok files
    "install-ngrok.ps1",
    "setup-ngrok.ps1",
    "get-ngrok-hostname.ps1",
    "START_NGROK.md",
    "NGROK_READY.md",
    
    # Serveo files
    "start-serveo.ps1",
    "START_SERVEO_NOW.md",
    "SERVE_SETUP_COMPLETE.md",
    "QUICK_SERVE_SETUP.md",
    
    # Other tunnel docs
    "FINAL_SOLUTIONS.md",
    "BEST_SOLUTIONS.md",
    "SIMPLE_TUNNEL_SOLUTIONS.md",
    "SIMPLE_PRODUCTION_SETUP.md",
    "ALTERNATIVES_NO_CARD.md",
    "YOUR_REQUIREMENTS.md",
    "QUICK_START.md",
    "QUICK_FIX_NOW.md",
    "NEXT_STEPS.md",
    "CLEANUP_COMPLETE.md",
    
    # Old deployment docs
    "VERCEL_DEPLOYMENT.md",
    "VERCEL_ENV_VARIABLES.md",
    "VERCEL_TROUBLESHOOTING.md",
    "VERCEL_500_FIX.md",
    "UPDATE_VERCEL_NOW.md",
    "URGENT_FIX_500.md",
    "QUICK_FIX_500.md",
    "FIX_500_ERRORS.md",
    "FIX_500_19_ERROR.md",
    "FIX_FUNCTION_CRASH.md",
    "DIAGNOSE_500_ERRORS.md",
    "CHECK_VERCEL_LOGS.md",
    "CHECK_VERCEL_LOGS_NOW.md",
    "CRASH_FIX_DEPLOYED.md",
    "DEPLOYMENT_SUCCESS.md",
    "TROUBLESHOOT_500_ERROR.md",
    "IMMEDIATE_FIX.md",
    
    # Other unwanted scripts
    "check-vercel-config.ps1",
    "setup-vercel-env.ps1",
    "prepare-git-push.ps1",
    "cleanup-unwanted-files.ps1",
    "deploy-to-iis.ps1",
    
    # Other unwanted docs
    "DEPLOY_TO_RENDER.md",
    "FINAL_RECOMMENDATION.md",
    "FINAL_SOLUTION.md",
    "QUICK_SOLUTION.md",
    "STATUS_CHECK.md"
)

$deletedCount = 0
foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  Deleted: $file" -ForegroundColor Gray
        $deletedCount++
    }
}

Write-Host ""
Write-Host "Deleted $deletedCount files" -ForegroundColor Green
Write-Host ""

# Check git status
Write-Host "Checking git status..." -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "Ready to commit and push!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review changes: git status" -ForegroundColor White
Write-Host "  2. Add files: git add ." -ForegroundColor White
Write-Host "  3. Commit: git commit -m 'Cleanup: Remove tunnel files, add local API solution'" -ForegroundColor White
Write-Host "  4. Push: git push origin main" -ForegroundColor White
Write-Host ""

