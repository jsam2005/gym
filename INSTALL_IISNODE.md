# Install iisnode - Required for Node.js on IIS

## ❌ Problem
**iisnode is NOT installed** - This is why you're getting a 500 error.

## ✅ Solution: Install iisnode

### Step 1: Download iisnode

1. Go to: https://github.com/Azure/iisnode/releases
2. Download the latest **x64** version (e.g., `iisnode-full-v0.2.26-x64.msi`)
3. Save the file to your Downloads folder

### Step 2: Install iisnode

1. **Right-click** the downloaded `.msi` file
2. Select **"Run as administrator"**
3. Follow the installation wizard:
   - Click **Next**
   - Accept the license
   - Click **Install**
   - Wait for installation to complete
   - Click **Finish**

### Step 3: Verify Installation

**Option A: Check folder exists**
```powershell
Test-Path "C:\Program Files\iisnode"
```
Should return: `True`

**Option B: Check in IIS Manager**
1. Open IIS Manager
2. Select your **server name** (top level)
3. Double-click **Modules**
4. Look for **"iisnode"** in the list

### Step 4: Restart IIS

**Run as Administrator:**
```powershell
iisreset
```

Or in IIS Manager:
1. Right-click your server name
2. Select **Restart**

### Step 5: Test Your Website

1. Open browser: `http://localhost:86`
2. Should now work! ✅

---

## Alternative: Direct Download Links

**Latest x64 version:**
- https://github.com/Azure/iisnode/releases/latest
- Look for file ending in `-x64.msi`

**Recommended version (v0.2.26):**
- Direct: https://github.com/Azure/iisnode/releases/download/v0.2.26/iisnode-full-v0.2.26-x64.msi

---

## After Installation

Once iisnode is installed:
1. ✅ Restart IIS (`iisreset` as Administrator)
2. ✅ Refresh your browser
3. ✅ Website should load at `http://localhost:86`

---

## Still Getting 500 Error?

After installing iisnode, if you still get errors:
1. Check Event Viewer → Application logs
2. Check `C:\inetpub\wwwroot\gym\iisnode\` for log files
3. Verify Application Pool is set to "No Managed Code"
4. Ensure `.env` file exists in `C:\inetpub\wwwroot\gym\`



## ❌ Problem
**iisnode is NOT installed** - This is why you're getting a 500 error.

## ✅ Solution: Install iisnode

### Step 1: Download iisnode

1. Go to: https://github.com/Azure/iisnode/releases
2. Download the latest **x64** version (e.g., `iisnode-full-v0.2.26-x64.msi`)
3. Save the file to your Downloads folder

### Step 2: Install iisnode

1. **Right-click** the downloaded `.msi` file
2. Select **"Run as administrator"**
3. Follow the installation wizard:
   - Click **Next**
   - Accept the license
   - Click **Install**
   - Wait for installation to complete
   - Click **Finish**

### Step 3: Verify Installation

**Option A: Check folder exists**
```powershell
Test-Path "C:\Program Files\iisnode"
```
Should return: `True`

**Option B: Check in IIS Manager**
1. Open IIS Manager
2. Select your **server name** (top level)
3. Double-click **Modules**
4. Look for **"iisnode"** in the list

### Step 4: Restart IIS

**Run as Administrator:**
```powershell
iisreset
```

Or in IIS Manager:
1. Right-click your server name
2. Select **Restart**

### Step 5: Test Your Website

1. Open browser: `http://localhost:86`
2. Should now work! ✅

---

## Alternative: Direct Download Links

**Latest x64 version:**
- https://github.com/Azure/iisnode/releases/latest
- Look for file ending in `-x64.msi`

**Recommended version (v0.2.26):**
- Direct: https://github.com/Azure/iisnode/releases/download/v0.2.26/iisnode-full-v0.2.26-x64.msi

---

## After Installation

Once iisnode is installed:
1. ✅ Restart IIS (`iisreset` as Administrator)
2. ✅ Refresh your browser
3. ✅ Website should load at `http://localhost:86`

---

## Still Getting 500 Error?

After installing iisnode, if you still get errors:
1. Check Event Viewer → Application logs
2. Check `C:\inetpub\wwwroot\gym\iisnode\` for log files
3. Verify Application Pool is set to "No Managed Code"
4. Ensure `.env` file exists in `C:\inetpub\wwwroot\gym\`





