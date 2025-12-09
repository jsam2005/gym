# Local API Server Solution - Much Simpler!

## ✅ New Approach

**Instead of tunneling the database directly, we:**
1. **Create a local API server** that connects to your local DB and middleware
2. **Expose it via HTTP tunnel** (much easier than TCP!)
3. **Vercel backend calls this local API** instead of connecting to DB directly

## 🚀 Setup Steps

### Step 1: Start Local API Server

```powershell
.\start-local-api.ps1
```

**This will:**
- ✅ Install dependencies (express, mssql, etc.)
- ✅ Connect to your local SQL Server
- ✅ Start API server on port 3001
- ✅ Provide endpoints for your Vercel backend

### Step 2: Expose via HTTP Tunnel

**In a NEW PowerShell window:**

```powershell
.\expose-local-api.ps1
```

**Or manually:**
```powershell
ssh -i $env:USERPROFILE\.ssh\localhost_run -R 80:localhost:3001 ssh.localhost.run
```

**You'll get:** `http://XXXXX.localhost.run`

### Step 3: Update Vercel Backend

**In Vercel, set environment variable:**
```
LOCAL_API_URL=http://XXXXX.localhost.run
USE_API_ONLY=true
```

**Update your Vercel backend to call the local API instead of connecting to DB directly.**

## 📋 Available Endpoints

**Your local API provides:**
- `GET /health` - Health check
- `GET /api/clients` - Get clients
- `GET /api/clients?status=active` - Get clients by status
- `GET /api/biometric/dashboard` - Dashboard data
- `GET /api/biometric/logs` - Attendance logs
- `POST /api/query` - Custom SQL queries
- `GET /api/essl/*` - Proxy to ESSL middleware

## ✅ Advantages

- ✅ **HTTP tunneling** (much easier than TCP)
- ✅ **localhost.run works** (we saw it works for HTTP)
- ✅ **No database tunneling** needed
- ✅ **Simpler setup**
- ✅ **More secure** (API layer instead of direct DB access)

## 🔧 Update Vercel Backend

**Modify your Vercel backend routes to call the local API:**

```javascript
// Instead of direct DB connection
const response = await fetch(`${process.env.LOCAL_API_URL}/api/clients`);
const data = await response.json();
```

## ✅ That's It!

**This is much simpler than TCP tunneling!** 🎉

