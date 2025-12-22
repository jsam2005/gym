# 🐳 Docker Setup Guide - Gym Management System

This guide will help you host your Gym Management System using Docker on your local computer.

## 📋 Prerequisites

Before starting, make sure you have:

1. **Docker Desktop** installed
   - Download from: https://www.docker.com/products/docker-desktop/
   - Make sure Docker Desktop is running (you'll see a Docker icon in your system tray)

2. **SQL Server** (if using database)
   - Make sure SQL Server is installed and running on your host machine
   - The Docker container will connect to SQL Server on your host machine

---

## 🚀 Quick Start

### Step 1: Navigate to Project Folder
Open PowerShell or Command Prompt and go to your project folder:
```powershell
cd C:\eTimeTrackLiteWeb\eTimeTrackLiteWeb\Lovable_gym
```

### Step 2: Configure Environment Variables

Create or update `backend/.env` file with your database settings:

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

**Important Notes:**
- If your SQL Server is on the host machine, Docker will use `host.docker.internal` to connect
- The `docker-compose.yml` automatically sets `ETIME_SQL_SERVER=host.docker.internal\SQLEXPRESS`
- If your SQL Server instance name is different, update it in `docker-compose.yml`

### Step 3: Build and Start Docker Containers

```powershell
docker-compose up --build
```

This will:
- ✅ Build both backend and frontend Docker images
- ✅ Start both containers
- ✅ Backend will be available on `http://localhost:5001`
- ✅ Frontend will be available on `http://localhost:5173`

### Step 4: Access Your Website

Open your web browser and go to:
```
http://localhost:5173
```

**Backend API:** `http://localhost:5001/api`

---

## 🔧 Docker Commands

### Start Containers (in foreground)
```powershell
docker-compose up
```

### Start Containers (in background/detached mode)
```powershell
docker-compose up -d
```

### Build and Start (rebuild images)
```powershell
docker-compose up --build
```

### Stop Containers
```powershell
docker-compose down
```

### Stop and Remove Volumes
```powershell
docker-compose down -v
```

### View Running Containers
```powershell
docker-compose ps
```

### View Logs
```powershell
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend

# Follow logs (real-time)
docker-compose logs -f
```

### Restart Containers
```powershell
docker-compose restart
```

### Rebuild After Code Changes
```powershell
docker-compose up --build
```

---

## 📁 Project Structure

```
Lovable_gym/
├── docker-compose.yml      # Docker Compose configuration
├── backend/
│   ├── Dockerfile          # Backend Docker image
│   ├── .env               # Backend environment variables
│   └── src/               # Backend source code
├── frontend/
│   ├── Dockerfile          # Frontend Docker image
│   ├── nginx.conf         # Nginx configuration
│   └── src/               # Frontend source code
```

---

## ⚙️ Configuration

### Backend Configuration

**File:** `Lovable_gym/backend/.env`

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

### Docker Compose Configuration

**File:** `Lovable_gym/docker-compose.yml`

The compose file automatically:
- Sets `ETIME_SQL_SERVER=host.docker.internal\SQLEXPRESS` to connect to host SQL Server
- Maps ports: `5001:5001` (backend) and `5173:80` (frontend)
- Links frontend to backend

**To customize SQL Server connection:**

If your SQL Server is on a different machine or has a different instance name:

1. **Edit `docker-compose.yml`:**
   ```yaml
   environment:
     - ETIME_SQL_SERVER=host.docker.internal\YOUR_INSTANCE_NAME
   ```

2. **Or use IP address:**
   ```yaml
   environment:
     - ETIME_SQL_SERVER=192.168.1.100\SQLEXPRESS
   ```

3. **Remove the override** if you want to use `.env` file value:
   ```yaml
   # Comment out or remove this line:
   # - ETIME_SQL_SERVER=host.docker.internal\SQLEXPRESS
   ```

### Frontend Configuration

The frontend is built and served using Nginx. The API base URL is configured in:
- `Lovable_gym/frontend/src/lib/api.ts`

For Docker, make sure the API URL points to:
```typescript
const API_BASE_URL = 'http://localhost:5001/api';
```

Or use environment variable (if configured):
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
```

---

## 🔄 Development Workflow

### Making Code Changes

1. **Edit your code** in `backend/src/` or `frontend/src/`

2. **Rebuild and restart:**
   ```powershell
   docker-compose up --build
   ```

3. **Or restart specific service:**
   ```powershell
   docker-compose restart backend
   docker-compose restart frontend
   ```

### Hot Reload (Development Mode)

For development with hot reload, you can:

1. **Run backend in dev mode:**
   ```powershell
   cd backend
   npm run dev
   ```

2. **Run frontend in dev mode:**
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Use Docker only for production builds**

Or modify `docker-compose.yml` to use development mode (not recommended for production).

---

## 🌐 Accessing from Other Devices on Your Network

### Step 1: Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
```
Look for **IPv4 Address** (e.g., `192.168.1.100`)

### Step 2: Update Docker Compose Ports

Edit `docker-compose.yml` to expose ports on all interfaces:

```yaml
services:
  backend:
    ports:
      - "0.0.0.0:5001:5001"  # Changed from "5001:5001"
  
  frontend:
    ports:
      - "0.0.0.0:5173:80"     # Changed from "5173:80"
```

### Step 3: Update Backend CORS

Make sure backend allows connections from your network IP. Check `backend/src/server.ts`:

```typescript
origin: [
  'http://localhost:5173',
  'http://YOUR_IP:5173',  // Add your IP
  // ... other origins
]
```

### Step 4: Access from Other Devices

On other devices, open browser and go to:
```
http://YOUR_IP:5173
```

Example: `http://192.168.1.100:5173`

### Step 5: Windows Firewall

Allow ports 5001 and 5173 in Windows Firewall:

1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port `5001` → Next
6. Select "Allow the connection" → Next
7. Check all profiles → Next
8. Name it "Docker Backend" → Finish

Repeat for port `5173` (name it "Docker Frontend")

---

## 🐛 Troubleshooting

### Docker Desktop Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
1. Start Docker Desktop
2. Wait for it to fully start (whale icon in system tray)
3. Try again: `docker-compose up`

### Port Already in Use

**Error:** `Bind for 0.0.0.0:5001 failed: port is already allocated`

**Solution:**
1. **Find what's using the port:**
   ```powershell
   netstat -ano | findstr :5001
   ```

2. **Stop the process:**
   ```powershell
   taskkill /PID <process_id> /F
   ```

3. **Or change the port in `docker-compose.yml`:**
   ```yaml
   ports:
     - "5002:5001"  # Use 5002 instead of 5001
   ```

### Database Connection Error

**Error:** `Cannot connect to SQL Server`

**Solution:**

1. **Verify SQL Server is running:**
   - Check SQL Server Configuration Manager
   - Verify SQL Server service is running

2. **Check SQL Server allows remote connections:**
   - Open SQL Server Management Studio
   - Right-click server → Properties → Connections
   - Check "Allow remote connections to this server"

3. **Verify SQL Server Browser is running:**
   - Services → SQL Server Browser → Start

4. **Check TCP/IP is enabled:**
   - SQL Server Configuration Manager
   - SQL Server Network Configuration → Protocols
   - Enable TCP/IP

5. **Update `docker-compose.yml` with correct instance:**
   ```yaml
   environment:
     - ETIME_SQL_SERVER=host.docker.internal\YOUR_INSTANCE_NAME
   ```

6. **Test connection from container:**
   ```powershell
   docker-compose exec backend sh
   # Inside container, test connection
   ```

### Container Keeps Restarting

**Check logs:**
```powershell
docker-compose logs backend
docker-compose logs frontend
```

**Common causes:**
- Database connection error
- Missing environment variables
- Port conflicts
- Build errors

### Frontend Can't Connect to Backend

**Solution:**

1. **Check backend is running:**
   ```powershell
   docker-compose ps
   ```

2. **Check backend logs:**
   ```powershell
   docker-compose logs backend
   ```

3. **Verify API URL in frontend:**
   - Check `frontend/src/lib/api.ts`
   - Should be `http://localhost:5001/api`

4. **Check CORS settings:**
   - Verify backend allows frontend origin
   - Check `backend/src/server.ts` CORS configuration

### Build Errors

**Error:** `npm install` fails in Docker

**Solution:**

1. **Clear Docker cache:**
   ```powershell
   docker system prune -a
   ```

2. **Rebuild without cache:**
   ```powershell
   docker-compose build --no-cache
   ```

3. **Check Dockerfile syntax:**
   - Verify all paths are correct
   - Check file permissions

### Images Not Updating After Code Changes

**Solution:**

1. **Rebuild images:**
   ```powershell
   docker-compose up --build
   ```

2. **Or force rebuild:**
   ```powershell
   docker-compose build --no-cache
   docker-compose up
   ```

### Docker Volume Issues

**Clear volumes:**
```powershell
docker-compose down -v
docker volume prune
```

---

## 📊 Useful Docker Commands

### View Container Status
```powershell
docker-compose ps
```

### View Resource Usage
```powershell
docker stats
```

### Execute Command in Container
```powershell
# Backend container
docker-compose exec backend sh

# Frontend container
docker-compose exec frontend sh
```

### View Container Details
```powershell
docker-compose ps
docker inspect <container_name>
```

### Remove All Containers and Images
```powershell
docker-compose down
docker system prune -a
```

### List Images
```powershell
docker images
```

### List Containers
```powershell
docker ps -a
```

---

## 🔐 Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files to Git
   - Use Docker secrets for production
   - Keep database passwords secure

2. **Network Security:**
   - Use Docker networks for internal communication
   - Expose only necessary ports
   - Configure firewall rules

3. **Image Security:**
   - Keep base images updated
   - Scan images for vulnerabilities
   - Use specific image tags (not `latest`)

---

## 🚀 Production Deployment Tips

1. **Use specific image tags:**
   ```yaml
   image: node:20-alpine  # Not node:latest
   ```

2. **Set resource limits:**
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '1'
             memory: 1G
   ```

3. **Use Docker secrets for sensitive data**

4. **Enable health checks:**
   ```yaml
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:5001/api/health"]
     interval: 30s
     timeout: 10s
     retries: 3
   ```

5. **Use reverse proxy (Nginx/Traefik) for SSL**

---

## 📝 Quick Reference

| Action | Command |
|--------|---------|
| Start | `docker-compose up` |
| Start (background) | `docker-compose up -d` |
| Build & Start | `docker-compose up --build` |
| Stop | `docker-compose down` |
| Restart | `docker-compose restart` |
| View Logs | `docker-compose logs -f` |
| View Status | `docker-compose ps` |
| Rebuild | `docker-compose build --no-cache` |

---

## 💡 Tips

1. **Keep Docker Desktop running** while using the application
2. **Check logs regularly** for errors: `docker-compose logs -f`
3. **Use `docker-compose up -d`** to run in background
4. **Rebuild after code changes:** `docker-compose up --build`
5. **Clean up regularly:** `docker system prune` (removes unused images/containers)
6. **Backup your `.env` file** before making changes

---

## 📞 Need Help?

1. Check Docker Desktop is running
2. Verify SQL Server is accessible
3. Check `docker-compose logs` for errors
4. Verify `.env` file configuration
5. Review troubleshooting section above

---

**Happy Docker Hosting! 🐳🎉**

