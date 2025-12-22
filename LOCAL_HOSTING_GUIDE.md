# 🏋️ Local Hosting Guide - Gym Management System

This guide will help you host your Gym Management System website on your local computer.

## 📋 Prerequisites

Before starting, make sure you have:

1. **Node.js** (Version 18 or higher)
   - Download from: https://nodejs.org/
   - Check installation: Open PowerShell and run `node --version`

2. **SQL Server** (if using database)
   - Make sure SQL Server is installed and running
   - Verify your database connection settings in `Lovable_gym/backend/.env`

3. **PowerShell** (Windows)
   - Usually pre-installed on Windows

---

## 🚀 Quick Start (Easiest Method)

### Step 1: Navigate to Project Folder
Open PowerShell and go to your project folder:
```powershell
cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
```

### Step 2: Start the Application
Run the startup script:
```powershell
.\START_LOCAL.ps1
```

This will:
- ✅ Install all required dependencies (if not already installed)
- ✅ Start the backend server on port **5001**
- ✅ Start the frontend server on port **5173**
- ✅ Open two PowerShell windows (one for backend, one for frontend)

### Step 3: Access Your Website
Open your web browser and go to:
```
http://localhost:5173
```

**Backend API:** `http://localhost:5001/api`

---

## 🔧 Manual Setup (Alternative Method)

If the PowerShell script doesn't work, you can start manually:

### Step 1: Install Dependencies

**Root folder:**
```powershell
cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
npm install
```

**Backend:**
```powershell
cd backend
npm install
cd ..
```

**Frontend:**
```powershell
cd frontend
npm install
cd ..
```

### Step 2: Start Backend Server

Open **Terminal 1** (PowerShell):
```powershell
cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\backend
npm run dev
```

Wait for: `✅ Server running on port 5001`

### Step 3: Start Frontend Server

Open **Terminal 2** (PowerShell):
```powershell
cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym\frontend
npm run dev
```

Wait for: `Local: http://localhost:5173/`

### Step 4: Access Your Website

Open browser: **http://localhost:5173**

---

## ⚙️ Configuration

### Backend Configuration

Edit `Lovable_gym/backend/.env` file:

```env
# SQL Server Configuration
ETIME_SQL_SERVER=JSAM\SQLEXPRESS
ETIME_SQL_DB=etimetracklite1
ETIME_SQL_USER=essl
ETIME_SQL_PASSWORD=essl

# Server Settings
SQL_DISABLED=false
USE_API_ONLY=false
PORT=5001
FRONTEND_URL=http://localhost:5173
```

**Important:** Update these values according to your SQL Server setup!

### Frontend Configuration

The frontend automatically connects to `http://localhost:5001/api` in development mode.

If you change the backend port, update `Lovable_gym/frontend/src/lib/api.ts`:
```typescript
const API_BASE_URL = 'http://localhost:5001/api';
```

---

## 🛑 Stopping the Server

### Method 1: Using Script
```powershell
.\STOP.ps1
```

### Method 2: Manual Stop
- Close both PowerShell windows (backend and frontend)
- Or press `Ctrl+C` in each terminal window

---

## 🔄 Restarting the Server

### Method 1: Using Script
```powershell
.\RESTART.ps1
```

### Method 2: Manual Restart
1. Stop both servers (close terminals or use `Ctrl+C`)
2. Run `.\START_LOCAL.ps1` again

---

## 📱 Accessing from Other Devices on Your Network

To access your website from other devices (phones, tablets, other computers) on the same network:

### Step 1: Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
```
Look for **IPv4 Address** (e.g., `192.168.1.100`)

### Step 2: Update Frontend Configuration

Edit `Lovable_gym/frontend/vite.config.ts` (or create it if it doesn't exist):

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,
  }
})
```

### Step 3: Update Backend CORS

The backend should already allow connections from your network. Check `Lovable_gym/backend/src/server.ts`:

```typescript
app.use(cors({
  origin: ['http://localhost:5173', 'http://YOUR_IP:5173'],
  credentials: true
}));
```

Replace `YOUR_IP` with your actual IP address (e.g., `192.168.1.100`).

### Step 4: Access from Other Devices

On other devices, open browser and go to:
```
http://YOUR_IP:5173
```

Example: `http://192.168.1.100:5173`

---

## 🏗️ Building for Production (Optional)

If you want to build the application for production:

### Build Backend
```powershell
cd Lovable_gym\backend
npm run build
```

### Build Frontend
```powershell
cd Lovable_gym\frontend
npm run build
```

### Run Production Build

**Backend:**
```powershell
cd Lovable_gym\backend
npm start
```

**Frontend:** The built files will be in `Lovable_gym/frontend/dist/`. The backend serves these automatically if configured.

---

## 🐛 Troubleshooting

### Port Already in Use

If you see "Port 5001 already in use" or "Port 5173 already in use":

1. **Find and stop the process:**
   ```powershell
   # Find process using port 5001
   netstat -ano | findstr :5001
   
   # Find process using port 5173
   netstat -ano | findstr :5173
   ```

2. **Kill the process:**
   ```powershell
   taskkill /PID <process_id> /F
   ```

3. **Or use the stop script:**
   ```powershell
   .\STOP.ps1
   ```

### Node.js Not Found

If you see "node is not recognized":
- Install Node.js from https://nodejs.org/
- Restart PowerShell after installation
- Verify: `node --version`

### Database Connection Error

If you see database connection errors:

1. **Check SQL Server is running:**
   - Open SQL Server Configuration Manager
   - Verify SQL Server service is running

2. **Verify database settings:**
   - Check `Lovable_gym/backend/.env` file
   - Ensure database name, username, and password are correct

3. **Test connection:**
   - Try connecting with SQL Server Management Studio (SSMS)

### Dependencies Installation Failed

If `npm install` fails:

1. **Clear npm cache:**
   ```powershell
   npm cache clean --force
   ```

2. **Delete node_modules:**
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Recurse -Force backend\node_modules
   Remove-Item -Recurse -Force frontend\node_modules
   ```

3. **Reinstall:**
   ```powershell
   .\UPDATE.ps1
   ```

### Frontend Not Connecting to Backend

1. **Check backend is running:**
   - Verify `http://localhost:5001/api` is accessible
   - Check backend terminal for errors

2. **Check CORS settings:**
   - Verify backend allows frontend origin
   - Check `Lovable_gym/backend/src/server.ts`

3. **Check API URL:**
   - Verify `Lovable_gym/frontend/src/lib/api.ts` has correct URL

---

## 📝 Available Scripts

### Root Level (`Lovable_gym/`)
- `npm run dev` - Start both backend and frontend
- `npm run build` - Build both for production
- `npm run install:all` - Install all dependencies

### Backend (`Lovable_gym/backend/`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

### Frontend (`Lovable_gym/frontend/`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### PowerShell Scripts (`Lovable_gym/`)
- `.\START_LOCAL.ps1` - Start application
- `.\STOP.ps1` - Stop application
- `.\RESTART.ps1` - Restart application
- `.\UPDATE.ps1` - Update dependencies and rebuild

---

## 💡 Tips

1. **Keep terminals open:** Don't close the PowerShell windows while using the app
2. **Check logs:** Watch the terminal windows for errors
3. **Regular updates:** Run `.\UPDATE.ps1` to get latest changes
4. **Backup:** Keep backups of your `backend/.env` file
5. **Database:** Ensure SQL Server is running before starting the app
6. **Firewall:** If accessing from other devices, allow ports 5001 and 5173 in Windows Firewall

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Start | `.\START_LOCAL.ps1` |
| Stop | `.\STOP.ps1` |
| Restart | `.\RESTART.ps1` |
| Update | `.\UPDATE.ps1` |
| Access Website | `http://localhost:5173` |
| Backend API | `http://localhost:5001/api` |

---

## 📞 Need Help?

1. Check the PowerShell windows for error messages
2. Verify all prerequisites are installed
3. Ensure SQL Server is running and accessible
4. Check `backend/.env` configuration
5. Review the troubleshooting section above

---

**Happy Hosting! 🎉**

