# K90 Pro Device Setup Guide

## Current Status
- ✅ Device IP: `192.168.0.4`
- ✅ Device Port: `4370`
- ✅ Your Computer IP: `192.168.0.5` (WiFi adapter)
- ✅ Backend Server: Running on port `5000`
- ✅ Webhook Endpoint: Ready at `/api/direct-essl/webhook`
- ✅ Full Webhook URL: `http://192.168.0.5:5000/api/direct-essl/webhook`

## Problem
The device is rejecting TCP pull commands. The K90 Pro supports **Push Data** mode, which is the recommended approach.

## Solution: Configure Device for Push Mode

### Step 1: Find Your Computer's IP Address

Your computer needs to be on the same network as the device (192.168.0.x).

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (should be 192.168.0.x)

**Or check:**
- Open Network Settings
- Find your active network connection
- Note the IPv4 address (e.g., 192.168.0.100)

### Step 2: Configure K90 Pro Device

1. **Access Device Menu:**
   - On the K90 Pro device, navigate to: **Menu → System → Communication → Cloud Server Setting**

2. **Configure Cloud Server Settings:**
   - **Server Address:** Change from `0.0.0.0` to `192.168.0.5` (Your computer's IP on WiFi)
   - **Server Port:** Change from `81` to `5000`
   - **Enable Proxy Server:** Change from `ON` to `OFF`
   - **Server Mode:** Keep as `ADMS` (or adjust if needed)
   - **Enable Domain Name:** Keep as `OFF`

3. **Note about URL Path:**
   - The device may automatically append the webhook path
   - Or you may need to configure it in "PC Connection" settings
   - Full URL should be: `http://192.168.0.5:5000/api/direct-essl/webhook`

3. **Enable Push Mode:**
   - Enable **"Real-time data transmission"**
   - Enable **"Send access logs immediately"**
   - Enable **"Push on check-in/check-out"**
   - Set **"Push Mode"** to **ON**

4. **Save Settings:**
   - Save and restart the device if prompted

### Step 3: Test the Setup

1. **Check in on the device** (scan fingerprint)
2. **Check backend console** - You should see:
   ```
   🔐 ESSL Webhook received: { userId: '...', timestamp: '...', ... }
   🔐 Processing: ACCESS_ATTEMPT from user ...
   📡 [WEBSOCKET] Emitted new_access_log event
   ```
3. **Check website** - The check-in should appear in real-time

### Step 4: Verify Webhook is Working

Test the webhook endpoint manually:
```bash
curl -X POST http://localhost:5000/api/direct-essl/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "1",
    "timestamp": "2025-11-18T16:00:00Z",
    "type": "CHECK_IN",
    "biometricType": "fingerprint"
  }'
```

## Alternative: Manual Check-in (For Testing)

If push mode doesn't work immediately, you can manually trigger check-ins:

```bash
POST http://localhost:5000/api/access-logs/checkin
Body: { "esslUserId": "YOUR_USER_ID" }
```

## Troubleshooting

### Device can't reach server
- Check firewall: Allow port 5000
- Verify IP address is correct
- Ensure device and computer are on same network (192.168.0.x)

### Webhook not receiving data
- Check device logs for connection errors
- Verify URL format: `http://IP:PORT/api/direct-essl/webhook`
- Test webhook endpoint manually (see Step 4)

### Check-ins not appearing
- Verify client exists with matching `esslUserId`
- Check backend console for errors
- Ensure WebSocket connection is active (check browser console)

## Current Webhook Endpoint

**URL:** `http://192.168.0.5:5000/api/direct-essl/webhook`

**Expected Data Format:**
```json
{
  "user_id": "1",
  "timestamp": "2025-11-18T16:00:00Z",
  "type": "CHECK_IN",
  "biometricType": "fingerprint"
}
```

The endpoint accepts flexible formats and will process the data automatically.

