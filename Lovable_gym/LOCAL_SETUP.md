# Local Hosting Setup Guide

This guide explains how to run your Gym Management System locally and how to apply updates.

## 🚀 Quick Start

### First Time Setup

1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/
   - Version 18 or higher recommended

2. **Start the Application**
   ```powershell
   .\START_LOCAL.ps1
   ```
   This will:
   - Install all dependencies
   - Start backend server on `http://localhost:5000`
   - Start frontend server on `http://localhost:5173`

3. **Access the Application**
   - Open browser: `http://localhost:5173`
   - Backend API: `http://localhost:5000/api`

---

## 📋 Available Commands

### Start Application
```powershell
.\START_LOCAL.ps1
```
Starts both backend and frontend servers in separate windows.

### Stop Application
```powershell
.\STOP.ps1
```
Stops all running servers.

### Restart Application
```powershell
.\RESTART.ps1
```
Stops existing servers and starts fresh.

### Update & Apply Changes
```powershell
.\UPDATE.ps1
```
- Pulls latest code from Git (if Git is available)
- Updates all dependencies
- Rebuilds backend and frontend
- **Note:** After running UPDATE, restart with `.\RESTART.ps1`

---

## 🔄 Applying Updates

### Method 1: Using UPDATE Script (Recommended)

1. **Pull latest code and update:**
   ```powershell
   .\UPDATE.ps1
   ```

2. **Restart the application:**
   ```powershell
   .\RESTART.ps1
   ```

### Method 2: Manual Update

1. **Update code manually** (copy new files, etc.)

2. **Update dependencies:**
   ```powershell
   # Root
   npm install
   
   # Backend
   cd backend
   npm install
   npm run build
   
   # Frontend
   cd ../frontend
   npm install
   npm run build
   ```

3. **Restart:**
   ```powershell
   cd ..
   .\RESTART.ps1
   ```

### Method 3: Using Git (if repository is connected)

1. **Pull latest changes:**
   ```powershell
   git pull
   ```

2. **Update and restart:**
   ```powershell
   .\UPDATE.ps1
   .\RESTART.ps1
   ```

---

## ⚙️ Configuration

### Backend Configuration
Edit `backend/.env` file:
```env
ETIME_SQL_SERVER=JSAM\SQLEXPRESS
ETIME_SQL_DB=etimetracklite1
ETIME_SQL_USER=essl
ETIME_SQL_PASSWORD=essl
SQL_DISABLED=false
USE_API_ONLY=false
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Frontend Configuration
Frontend automatically connects to `http://localhost:5000/api` in development mode.
No configuration needed unless you change the backend port.

---

## 🛠️ Troubleshooting

### Port Already in Use
If ports 5000 or 5173 are already in use:
```powershell
.\STOP.ps1
.\START_LOCAL.ps1
```

### Dependencies Issues
If you encounter dependency errors:
```powershell
# Clean install
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force backend/node_modules
Remove-Item -Recurse -Force frontend/node_modules

# Reinstall
.\UPDATE.ps1
```

### Build Errors
If build fails:
1. Check Node.js version: `node --version` (should be 18+)
2. Check if all files are present
3. Try manual build:
   ```powershell
   cd backend
   npm install
   npm run build
   
   cd ../frontend
   npm install
   npm run build
   ```

### Database Connection Issues
1. Verify SQL Server is running
2. Check `backend/.env` configuration
3. Ensure SQL Server Browser service is running
4. Verify TCP/IP is enabled in SQL Server Configuration Manager

---

## 📁 Project Structure

```
Lovable_gym/
├── backend/          # Node.js/Express backend
│   ├── src/         # Source code
│   ├── dist/        # Compiled code
│   └── .env         # Backend configuration
├── frontend/         # React frontend
│   ├── src/         # Source code
│   └── dist/        # Built frontend
├── START_LOCAL.ps1   # Start script
├── STOP.ps1          # Stop script
├── RESTART.ps1       # Restart script
└── UPDATE.ps1        # Update script
```

---

## 💡 Tips

- **Keep servers running:** Don't close the PowerShell windows while using the app
- **Check logs:** Watch the PowerShell windows for errors
- **Regular updates:** Run `.\UPDATE.ps1` regularly to get latest changes
- **Backup:** Keep backups of your `backend/.env` file
- **Database:** Ensure your SQL Server is running before starting the app

---

## 🎯 Common Workflows

### Daily Use
```powershell
.\START_LOCAL.ps1
# Use the app...
.\STOP.ps1
```

### After Code Update
```powershell
.\UPDATE.ps1
.\RESTART.ps1
```

### Quick Restart
```powershell
.\RESTART.ps1
```

---

## 📞 Need Help?

1. Check the PowerShell windows for error messages
2. Verify all prerequisites are installed
3. Ensure SQL Server is running and accessible
4. Check `backend/.env` configuration



