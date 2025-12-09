# Vercel Environment Variables Configuration

Based on your `.env` file, here are the exact values to set in Vercel:

## Required Environment Variables

Set these in **Vercel Dashboard → Settings → Environment Variables**:

### Database Connection (via Cloudflare Tunnel)

```
ETIME_SQL_SERVER=reasoning-virtual-downloadable-edt.trycloudflare.com
```

**⚠️ IMPORTANT:** Quick tunnels generate NEW hostnames each restart. If you restart the tunnel, update this value in Vercel!

**Important:** This should be your Cloudflare Tunnel hostname, NOT `JSAM\SQLEXPRESS`

```
ETIME_SQL_DB=etimetracklite1
ETIME_SQL_USER=essl
ETIME_SQL_PASSWORD=essl
ETIME_SQL_INSTANCE=SQLEXPRESS
```

### SQL Configuration

```
SQL_DISABLED=false
USE_API_ONLY=false
ETIMETRACK_ENABLED=true
```

### Frontend Configuration

```
VITE_API_URL=https://gym-zeta-teal.vercel.app
FRONTEND_URL=https://gym-zeta-teal.vercel.app
```

### Other Variables

```
NODE_ENV=production
JWT_SECRET=<generate-a-secure-random-string>
PORT=5000
```

### Optional: ESSL Device Configuration

```
ESSL_DEVICE_IP=192.168.0.5
ESSL_DEVICE_PORT=4370
ESSL_DEVICE_PASSWORD=<your-device-password>
```

---

## Complete List for Copy-Paste

Copy these into Vercel Environment Variables:

```
ETIME_SQL_SERVER=reasoning-virtual-downloadable-edt.trycloudflare.com
ETIME_SQL_DB=etimetracklite1
ETIME_SQL_USER=essl
ETIME_SQL_PASSWORD=essl
ETIME_SQL_INSTANCE=SQLEXPRESS
SQL_DISABLED=false
USE_API_ONLY=false
ETIMETRACK_ENABLED=true
VITE_API_URL=https://gym-zeta-teal.vercel.app
FRONTEND_URL=https://gym-zeta-teal.vercel.app
NODE_ENV=production
JWT_SECRET=<generate-a-secure-random-string>
PORT=5000
```

**Replace:**
- `<generate-a-secure-random-string>` with a random string (e.g., use: `openssl rand -base64 32`)
- `reasoning-virtual-downloadable-edt.trycloudflare.com` with your current tunnel hostname (if it changed)

**⚠️ NOTE:** Quick tunnels generate NEW hostnames each restart. Always check your tunnel output for the current hostname!

---

## Important Notes

1. **Tunnel Hostname Changes**: Quick tunnels generate new hostnames each restart. If you restart the tunnel, update `ETIME_SQL_SERVER` in Vercel.

2. **Tunnel Must Be Running**: The Cloudflare Tunnel MUST be running on your local server for Vercel to connect.

3. **After Setting Variables**: Vercel will auto-redeploy, or you can manually trigger a redeploy.

---

## Verify Configuration

After setting variables, check:

1. **Debug Endpoint:**
   ```
   https://gym-zeta-teal.vercel.app/api/debug
   ```
   Should show all environment variables are set.

2. **Health Endpoint:**
   ```
   https://gym-zeta-teal.vercel.app/api/health
   ```
   Should show database is configured.

3. **Check Logs:**
   - Vercel Dashboard → Deployments → Latest → Functions → Logs
   - Look for database connection messages

---

## Generate JWT Secret

Run this to generate a secure JWT secret:

```powershell
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Or use an online generator: https://www.grc.com/passwords.htm

