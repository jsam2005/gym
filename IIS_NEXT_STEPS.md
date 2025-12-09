# IIS Configuration - Next Steps

## Current Status
✅ Application created: `gym`  
✅ Physical path: `C:\inetpub\wwwroot\gym`  
⚠️ Application Pool: `DefaultAppPool` (needs to be changed)  
⚠️ Port: `86` (you can keep this or change to 80/5000)

---

## Step-by-Step Configuration

### Step 1: Create New Application Pool (If Not Exists)

1. In IIS Manager, click **Application Pools** (left pane)
2. Right-click → **Add Application Pool...**
3. Configure:
   - **Name**: `GymManagementPool`
   - **.NET CLR version**: `No Managed Code`
   - **Managed pipeline mode**: `Integrated`
   - Click **OK**

### Step 2: Configure Application Pool Settings

1. Select **GymManagementPool**
2. Right-click → **Advanced Settings**
3. Set these values:
   - **Start Mode**: `AlwaysRunning`
   - **Idle Timeout**: `00:00:00` (0 minutes - never idle)
   - Click **OK**

### Step 3: Update Your Application

1. In IIS Manager, go to **Sites** → **gym**
2. Right-click → **Manage Application** → **Basic Settings...**
3. Click **Select...** next to Application pool
4. Choose **GymManagementPool**
5. Check **Enable Preload**
6. Click **OK**

### Step 4: Verify Port Binding

1. Select **gym** site
2. Right-click → **Edit Bindings...**
3. Check the port (currently `86`)
   - You can keep `86` or change to `80` or `5000`
   - Click **OK**

### Step 5: Test Your Website

1. Select **gym** site
2. In **Actions** pane, click **Browse *:86 (http)**
   - Or manually open: `http://localhost:86`

---

## Expected Result

✅ Website loads at `http://localhost:86`  
✅ API works at `http://localhost:86/api/health`  
✅ Frontend displays correctly  
✅ No errors in browser console

---

## Troubleshooting

### If website shows 500 Error:

1. Check `C:\inetpub\wwwroot\gym\iisnode\` for error logs
2. Verify Node.js is installed: Open PowerShell → `node --version`
3. Check `.env` file exists in `C:\inetpub\wwwroot\gym\`
4. Verify iisnode is installed

### If website doesn't load:

1. Check Application Pool is **Started** (not Stopped)
2. Verify port `86` is not blocked by firewall
3. Try accessing `http://localhost:86/api/health` directly

---

## Network Access

To access from other computers:

1. Get your server IP: `ipconfig` (look for IPv4 Address)
2. Open firewall for port `86`:
   - Windows Firewall → Inbound Rules → New Rule
   - Port → TCP → `86` → Allow
3. Access from network: `http://YOUR_SERVER_IP:86`

---

## Auto-Start Verification

After restarting your computer:
1. Wait 1-2 minutes
2. Open `http://localhost:86`
3. Website should load automatically ✅



## Current Status
✅ Application created: `gym`  
✅ Physical path: `C:\inetpub\wwwroot\gym`  
⚠️ Application Pool: `DefaultAppPool` (needs to be changed)  
⚠️ Port: `86` (you can keep this or change to 80/5000)

---

## Step-by-Step Configuration

### Step 1: Create New Application Pool (If Not Exists)

1. In IIS Manager, click **Application Pools** (left pane)
2. Right-click → **Add Application Pool...**
3. Configure:
   - **Name**: `GymManagementPool`
   - **.NET CLR version**: `No Managed Code`
   - **Managed pipeline mode**: `Integrated`
   - Click **OK**

### Step 2: Configure Application Pool Settings

1. Select **GymManagementPool**
2. Right-click → **Advanced Settings**
3. Set these values:
   - **Start Mode**: `AlwaysRunning`
   - **Idle Timeout**: `00:00:00` (0 minutes - never idle)
   - Click **OK**

### Step 3: Update Your Application

1. In IIS Manager, go to **Sites** → **gym**
2. Right-click → **Manage Application** → **Basic Settings...**
3. Click **Select...** next to Application pool
4. Choose **GymManagementPool**
5. Check **Enable Preload**
6. Click **OK**

### Step 4: Verify Port Binding

1. Select **gym** site
2. Right-click → **Edit Bindings...**
3. Check the port (currently `86`)
   - You can keep `86` or change to `80` or `5000`
   - Click **OK**

### Step 5: Test Your Website

1. Select **gym** site
2. In **Actions** pane, click **Browse *:86 (http)**
   - Or manually open: `http://localhost:86`

---

## Expected Result

✅ Website loads at `http://localhost:86`  
✅ API works at `http://localhost:86/api/health`  
✅ Frontend displays correctly  
✅ No errors in browser console

---

## Troubleshooting

### If website shows 500 Error:

1. Check `C:\inetpub\wwwroot\gym\iisnode\` for error logs
2. Verify Node.js is installed: Open PowerShell → `node --version`
3. Check `.env` file exists in `C:\inetpub\wwwroot\gym\`
4. Verify iisnode is installed

### If website doesn't load:

1. Check Application Pool is **Started** (not Stopped)
2. Verify port `86` is not blocked by firewall
3. Try accessing `http://localhost:86/api/health` directly

---

## Network Access

To access from other computers:

1. Get your server IP: `ipconfig` (look for IPv4 Address)
2. Open firewall for port `86`:
   - Windows Firewall → Inbound Rules → New Rule
   - Port → TCP → `86` → Allow
3. Access from network: `http://YOUR_SERVER_IP:86`

---

## Auto-Start Verification

After restarting your computer:
1. Wait 1-2 minutes
2. Open `http://localhost:86`
3. Website should load automatically ✅





