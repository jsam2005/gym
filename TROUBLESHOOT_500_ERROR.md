# Troubleshooting 500 Internal Server Error

## Common Causes & Solutions

### 1. iisnode Not Installed

**Check:**
```powershell
Test-Path "C:\Program Files\iisnode"
```

**Solution:**
- Download and install iisnode: https://github.com/Azure/iisnode/releases
- Install the `.msi` file
- Restart IIS: `iisreset` (run as Administrator)

### 2. Node.js Path Not Found

**Check:**
```powershell
node --version
where.exe node
```

**Solution:**
- Ensure Node.js is installed and in PATH
- Restart IIS after installing Node.js

### 3. Missing .env File

**Check:**
```powershell
Test-Path "C:\inetpub\wwwroot\gym\.env"
```

**Solution:**
- Copy `.env` from `backend` folder to `C:\inetpub\wwwroot\gym\`
- Ensure it has all required variables

### 4. Application Pool Configuration

**Check in IIS Manager:**
- Application Pool → `.NET CLR Version` should be `No Managed Code`
- Application Pool → `Start Mode` should be `AlwaysRunning`

### 5. Permissions Issue

**Solution:**
- Right-click `C:\inetpub\wwwroot\gym` → Properties → Security
- Ensure `IIS_IUSRS` has Read & Execute permissions
- Ensure `IIS AppPool\GymManagementPool` has Read & Execute permissions

### 6. Port Already in Use

**Check:**
```powershell
netstat -ano | findstr :86
```

**Solution:**
- Change port in IIS binding
- Or stop the process using port 86

### 7. Check Detailed Error Logs

**Location:**
- `C:\inetpub\wwwroot\gym\iisnode\` (if exists)
- Windows Event Viewer → Windows Logs → Application

### 8. Test Server.js Directly

**Run:**
```powershell
cd C:\inetpub\wwwroot\gym
node dist/server.js
```

**Expected:** Server should start without errors

**If errors appear:** Fix the errors shown in console

---

## Quick Fix Steps

1. **Enable detailed errors in web.config:**
   - Set `devErrorsEnabled="true"` (already done)
   - Restart IIS: `iisreset` (as Administrator)

2. **Check Event Viewer:**
   - Open Event Viewer
   - Windows Logs → Application
   - Look for errors related to "gym" or "iisnode"

3. **Verify iisnode installation:**
   - Open IIS Manager
   - Server → Modules
   - Look for "iisnode" module

4. **Test Node.js directly:**
   ```powershell
   cd C:\inetpub\wwwroot\gym
   node dist/server.js
   ```

5. **Check Application Pool:**
   - IIS Manager → Application Pools → Your Pool
   - Ensure it's "Started" (not Stopped)

---

## Next Steps

After checking the above, share:
1. Any errors from `node dist/server.js`
2. Errors from Event Viewer
3. Whether iisnode is installed
4. Application Pool status



## Common Causes & Solutions

### 1. iisnode Not Installed

**Check:**
```powershell
Test-Path "C:\Program Files\iisnode"
```

**Solution:**
- Download and install iisnode: https://github.com/Azure/iisnode/releases
- Install the `.msi` file
- Restart IIS: `iisreset` (run as Administrator)

### 2. Node.js Path Not Found

**Check:**
```powershell
node --version
where.exe node
```

**Solution:**
- Ensure Node.js is installed and in PATH
- Restart IIS after installing Node.js

### 3. Missing .env File

**Check:**
```powershell
Test-Path "C:\inetpub\wwwroot\gym\.env"
```

**Solution:**
- Copy `.env` from `backend` folder to `C:\inetpub\wwwroot\gym\`
- Ensure it has all required variables

### 4. Application Pool Configuration

**Check in IIS Manager:**
- Application Pool → `.NET CLR Version` should be `No Managed Code`
- Application Pool → `Start Mode` should be `AlwaysRunning`

### 5. Permissions Issue

**Solution:**
- Right-click `C:\inetpub\wwwroot\gym` → Properties → Security
- Ensure `IIS_IUSRS` has Read & Execute permissions
- Ensure `IIS AppPool\GymManagementPool` has Read & Execute permissions

### 6. Port Already in Use

**Check:**
```powershell
netstat -ano | findstr :86
```

**Solution:**
- Change port in IIS binding
- Or stop the process using port 86

### 7. Check Detailed Error Logs

**Location:**
- `C:\inetpub\wwwroot\gym\iisnode\` (if exists)
- Windows Event Viewer → Windows Logs → Application

### 8. Test Server.js Directly

**Run:**
```powershell
cd C:\inetpub\wwwroot\gym
node dist/server.js
```

**Expected:** Server should start without errors

**If errors appear:** Fix the errors shown in console

---

## Quick Fix Steps

1. **Enable detailed errors in web.config:**
   - Set `devErrorsEnabled="true"` (already done)
   - Restart IIS: `iisreset` (as Administrator)

2. **Check Event Viewer:**
   - Open Event Viewer
   - Windows Logs → Application
   - Look for errors related to "gym" or "iisnode"

3. **Verify iisnode installation:**
   - Open IIS Manager
   - Server → Modules
   - Look for "iisnode" module

4. **Test Node.js directly:**
   ```powershell
   cd C:\inetpub\wwwroot\gym
   node dist/server.js
   ```

5. **Check Application Pool:**
   - IIS Manager → Application Pools → Your Pool
   - Ensure it's "Started" (not Stopped)

---

## Next Steps

After checking the above, share:
1. Any errors from `node dist/server.js`
2. Errors from Event Viewer
3. Whether iisnode is installed
4. Application Pool status





