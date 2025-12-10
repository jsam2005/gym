# Quick Tunnel Setup Guide

Since localhost.run requires SSH keys, here are easier alternatives:

---

## Option 1: Cloudflare Tunnel (Recommended - Free, No SSH)

### Install:
```powershell
.\INSTALL_CLOUDFLARED.ps1
```

Or manually:
- Download: https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
- Rename to `cloudflared.exe`
- Place in `C:\Windows\` or add to PATH

### Use:
```powershell
cloudflared tunnel --url http://localhost:5000
```

**Copy the URL** (e.g., `https://xxxxx.trycloudflare.com`)

---

## Option 2: ngrok (Simple - Free with limitations)

### Install:
1. Download: https://ngrok.com/download
2. Extract `ngrok.exe`
3. Place in any folder (or add to PATH)

### Use:
```powershell
ngrok http 5000
```

**Copy the URL** (e.g., `https://xxxxx.ngrok.io`)

**Note:** Free ngrok URLs change every time you restart.

---

## Option 3: localhost.run (Requires SSH Key)

If you want to use localhost.run, you need to generate an SSH key first:

```powershell
# Generate SSH key (if you don't have one)
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Copy public key
cat ~/.ssh/id_rsa.pub

# Add to localhost.run (follow their instructions)
# Then use:
ssh -R 80:localhost:5000 ssh.localhost.run
```

---

## Quick Start (Recommended: Cloudflare Tunnel)

1. **Install Cloudflare Tunnel:**
   ```powershell
   .\INSTALL_CLOUDFLARED.ps1
   ```

2. **Start Tunnel:**
   ```powershell
   .\START_TUNNEL_ONLY.ps1
   ```
   Or manually:
   ```powershell
   cloudflared tunnel --url http://localhost:5000
   ```

3. **Copy the tunnel URL** (e.g., `https://xxxxx.trycloudflare.com`)

4. **Use in Vercel:**
   - Set `VITE_API_URL` = `https://xxxxx.trycloudflare.com/api`

---

## Comparison

| Feature | Cloudflare Tunnel | ngrok | localhost.run |
|---------|------------------|-------|---------------|
| **Free** | ✅ | ✅ (limited) | ✅ |
| **SSH Required** | ❌ | ❌ | ✅ |
| **Installation** | Easy | Easy | Medium |
| **URL Changes** | Yes (quick tunnel) | Yes (free) | No (with key) |
| **HTTPS** | ✅ | ✅ | ✅ |

**Recommendation:** Use **Cloudflare Tunnel** - it's free, easy, and no SSH setup needed!

