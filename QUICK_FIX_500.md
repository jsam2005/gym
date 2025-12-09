# Quick Fix for 500 Error

## 🔴 Root Cause
**iisnode is NOT installed** - IIS cannot run Node.js without it.

## ✅ Quick Solution

### 1. Install iisnode (REQUIRED)

**Download:**
- Go to: https://github.com/Azure/iisnode/releases/latest
- Download: `iisnode-full-v0.2.26-x64.msi` (or latest x64 version)

**Install:**
- Right-click the `.msi` file → **Run as administrator**
- Follow installation wizard
- Click Finish

### 2. Restart IIS

**Run PowerShell as Administrator:**
```powershell
iisreset
```

### 3. Test Website

Open: `http://localhost:86`

---

## ✅ Verification Checklist

After installing iisnode:

- [ ] `C:\Program Files\iisnode` folder exists
- [ ] IIS Manager → Server → Modules → See "iisnode"
- [ ] IIS restarted (`iisreset`)
- [ ] Website loads at `http://localhost:86`

---

## 📝 Notes

- **iisnode** is a native IIS module that allows IIS to run Node.js applications
- Without it, IIS cannot execute `dist/server.js`
- Installation requires Administrator privileges
- After installation, IIS must be restarted

---

## 🆘 Still Not Working?

If website still shows 500 error after installing iisnode:

1. **Check Event Viewer:**
   - Windows Key → "Event Viewer"
   - Windows Logs → Application
   - Look for errors with "gym" or "iisnode"

2. **Test Node.js directly:**
   ```powershell
   cd C:\inetpub\wwwroot\gym
   node dist/server.js
   ```
   - If this works, the issue is IIS configuration
   - If this fails, fix the Node.js errors first

3. **Verify Application Pool:**
   - IIS Manager → Application Pools
   - Your pool → .NET CLR Version = "No Managed Code"
   - Your pool → Status = "Started"



## 🔴 Root Cause
**iisnode is NOT installed** - IIS cannot run Node.js without it.

## ✅ Quick Solution

### 1. Install iisnode (REQUIRED)

**Download:**
- Go to: https://github.com/Azure/iisnode/releases/latest
- Download: `iisnode-full-v0.2.26-x64.msi` (or latest x64 version)

**Install:**
- Right-click the `.msi` file → **Run as administrator**
- Follow installation wizard
- Click Finish

### 2. Restart IIS

**Run PowerShell as Administrator:**
```powershell
iisreset
```

### 3. Test Website

Open: `http://localhost:86`

---

## ✅ Verification Checklist

After installing iisnode:

- [ ] `C:\Program Files\iisnode` folder exists
- [ ] IIS Manager → Server → Modules → See "iisnode"
- [ ] IIS restarted (`iisreset`)
- [ ] Website loads at `http://localhost:86`

---

## 📝 Notes

- **iisnode** is a native IIS module that allows IIS to run Node.js applications
- Without it, IIS cannot execute `dist/server.js`
- Installation requires Administrator privileges
- After installation, IIS must be restarted

---

## 🆘 Still Not Working?

If website still shows 500 error after installing iisnode:

1. **Check Event Viewer:**
   - Windows Key → "Event Viewer"
   - Windows Logs → Application
   - Look for errors with "gym" or "iisnode"

2. **Test Node.js directly:**
   ```powershell
   cd C:\inetpub\wwwroot\gym
   node dist/server.js
   ```
   - If this works, the issue is IIS configuration
   - If this fails, fix the Node.js errors first

3. **Verify Application Pool:**
   - IIS Manager → Application Pools
   - Your pool → .NET CLR Version = "No Managed Code"
   - Your pool → Status = "Started"





