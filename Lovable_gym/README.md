# Gym Management System

Full-stack gym management system with biometric integration.

## 🚀 Quick Start

### Option 1: Run in Background (Recommended for Always-On)

Run the application in the background so you can use your computer for other tasks:

```powershell
.\START_BACKGROUND.ps1
```

This will:
- Install all dependencies automatically
- Start backend server on `http://localhost:5001`
- Start frontend server on `http://localhost:5173`
- Run silently in the background (no windows)

**Access the app:** Open `http://localhost:5173` in your browser

**Auto-Start on Boot:** To make it start automatically when you turn on your PC:
```powershell
# Run as Administrator
.\SETUP_AUTO_START.ps1
```

### Option 2: Fully Local (Frontend + Backend Local)

```powershell
.\START_LOCAL.ps1
```

This will:
- Install all dependencies automatically
- Start backend server on `http://localhost:5001`
- Start frontend server on `http://localhost:5173`
- Open terminal windows (for debugging)

**Access the app:** Open `http://localhost:5173` in your browser

### Option 2: Vercel Frontend + Local Backend (Recommended)

**For Production:**
1. **Start local backend + tunnel:**
   ```powershell
   .\START_WITH_TUNNEL.ps1
   ```
   This uses localhost.run tunnel (free, no account required)

2. **Copy the tunnel URL** displayed in the terminal (format: `https://xxxxx.localhost.run`)

3. **Update Vercel:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Set `VITE_API_URL` = `https://xxxxx.localhost.run/api`
   - Redeploy your frontend

**Note:** Tunnel URL may change each restart. Just copy the new URL and update Vercel.

---

## 📋 Available Commands

### Background Mode (Recommended)
| Command | Description |
|---------|-------------|
| `.\START_BACKGROUND.ps1` | Start app in background (no windows) |
| `.\STOP_BACKGROUND.ps1` | Stop background app |
| `.\CHECK_STATUS.ps1` | Check if app is running and get URLs |
| `.\SETUP_AUTO_START.ps1` | Setup auto-start on Windows boot (Run as Admin) |
| `.\DISABLE_AUTO_START.ps1` | Disable auto-start (Run as Admin) |
| `.\FIX_TASK.ps1` | Fix Task Scheduler configuration (Run as Admin) |
| `.\DEBUG_TASK.ps1` | Debug Task Scheduler issues |

### Development Mode
| Command | Description |
|---------|-------------|
| `.\START_LOCAL.ps1` | Start both frontend & backend locally (with windows) |
| `.\STOP.ps1` | Stop all running servers |
| `.\STOP_ALL.ps1` | Stop all running servers and tunnels |
| `.\RESTART.ps1` | Restart all servers |
| `.\UPDATE.ps1` | Update code & dependencies |

---

## 📖 Documentation

- `BACKGROUND_SETUP_GUIDE.md` - **Quick guide: Run in background & auto-start** ⭐
- `TROUBLESHOOT_TASK.md` - Troubleshooting Task Scheduler issues
- `LOCAL_SETUP.md` - Complete local hosting guide

## 📁 Project Structure

```
Lovable_gym/
├── backend/          # Node.js/Express backend
│   ├── src/         # Source code
│   └── dist/        # Compiled code
├── frontend/         # React frontend
│   ├── src/         # Source code
│   └── dist/        # Built frontend
├── START_LOCAL.ps1   # Start script
├── STOP.ps1          # Stop script
├── RESTART.ps1       # Restart script
├── UPDATE.ps1        # Update script
└── LOCAL_SETUP.md    # Complete setup guide

## Features

- ✅ Client Management
- ✅ Package Management
- ✅ Billing & Payments
- ✅ Dashboard with Real-time Stats
- ✅ Biometric Device Integration
- ✅ Access Control & Scheduling

