# Windows Service Setup (Client Machine)

This guide uses the project scripts to run backend as a stable Windows Service.

## 1) Prerequisites

- Install Node.js 18+ (LTS recommended)
- Install NSSM (Non-Sucking Service Manager)
  - Download: https://nssm.cc/download
  - Extract to one of:
    - `C:\tools\nssm\win64\nssm.exe`
    - `C:\nssm\win64\nssm.exe`
    - `C:\Program Files\nssm\win64\nssm.exe`
- Keep project at a simple path (recommended):
  - `C:\software\gym\Lovable_gym`

## 2) Configure backend environment

Edit:
- `C:\software\gym\Lovable_gym\backend\.env`

Minimum keys:

```env
PORT=5001
FRONTEND_URL=http://localhost:5001
SQL_DISABLED=true
USE_API_ONLY=true
```

If SQL is available, set:

```env
SQL_DISABLED=false
USE_API_ONLY=false
ETIME_SQL_SERVER=YOUR_SERVER
ETIME_SQL_DB=YOUR_DB
ETIME_SQL_USER=YOUR_USER
ETIME_SQL_PASSWORD=YOUR_PASSWORD
```

## 3) Create service (one command)

Open PowerShell as Administrator:

```powershell
cd "C:\software\gym\Lovable_gym"
.\SETUP_WINDOWS_SERVICE.ps1
```

This script will:
- install backend dependencies
- build backend (`dist/server.js`)
- create/recreate service `Gym Management Backend`
- set startup type to automatic
- configure service logs in `logs\backend-out.log` and `logs\backend-err.log`
- start the service

## 4) Verify

```powershell
cd "C:\software\gym\Lovable_gym"
.\CHECK_WINDOWS_SERVICE.ps1
```

Then open:
- `http://localhost:5001/api/health`
- `http://localhost:5001`

## 5) Update flow (after new code)

```powershell
cd "C:\software\gym\Lovable_gym"
.\UPDATE.ps1
.\SETUP_WINDOWS_SERVICE.ps1
```

`SETUP_WINDOWS_SERVICE.ps1` safely recreates and restarts service with latest build.

## 6) Remove service

```powershell
cd "C:\software\gym\Lovable_gym"
.\REMOVE_WINDOWS_SERVICE.ps1
```

## Troubleshooting

- Service not running:
  - check `logs\backend-err.log`
  - run:
    - `sc query "Gym Management Backend"`
    - `Get-Content "C:\software\gym\Lovable_gym\logs\backend-err.log" -Tail 100`
- If `nssm` not found:
  - place `nssm.exe` in one of the supported paths above
  - or add nssm to PATH
- If port 5001 blocked:
  - open firewall for TCP 5001
