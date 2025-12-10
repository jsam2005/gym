# Gym Management System

Full-stack gym management system with biometric integration.

## 🚀 Quick Start

### Option 1: Fully Local (Frontend + Backend Local)

```powershell
.\START_LOCAL.ps1
```

This will:
- Install all dependencies automatically
- Start backend server on `http://localhost:5000`
- Start frontend server on `http://localhost:5173`

**Access the app:** Open `http://localhost:5173` in your browser

### Option 2: Vercel Frontend + Local Backend (Recommended)

**For Production:**
1. **Start local backend + tunnel:**
   ```powershell
   .\START_WITH_TUNNEL.ps1
   ```

2. **Deploy frontend to Vercel:**
   - Push code to GitHub
   - Connect Vercel to your repo
   - Set root directory to `frontend`
   - Set `VITE_API_URL` environment variable to your tunnel URL

See `VERCEL_FRONTEND_SETUP.md` for complete guide.

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `.\START_LOCAL.ps1` | Start both frontend & backend locally |
| `.\START_WITH_TUNNEL.ps1` | Start backend + tunnel for Vercel |
| `.\STOP.ps1` | Stop all running servers |
| `.\RESTART.ps1` | Restart all servers |
| `.\UPDATE.ps1` | Update code & dependencies |

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `.\START_LOCAL.ps1` | Start backend and frontend servers |
| `.\STOP.ps1` | Stop all running servers |
| `.\RESTART.ps1` | Restart all servers |
| `.\UPDATE.ps1` | Pull code, update dependencies, rebuild |

---

## 📖 Documentation

- `LOCAL_SETUP.md` - Complete local hosting guide
- `VERCEL_FRONTEND_SETUP.md` - Vercel frontend + local backend setup
- `CHECK_GYMCLIENTS_DATA.sql` - SQL queries for checking data
- `VIEW_GYMCLIENTS_DATA.sql` - SQL queries for viewing data
- `ADD_BILLING_DATE_COLUMN.sql` - Database migration script

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

