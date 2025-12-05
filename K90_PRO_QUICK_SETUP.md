# K90 Pro Quick Setup Guide

## Current Screen: Cloud Server Setting ✅
You're on the correct screen! Configure these settings:

### Cloud Server Setting Configuration:

| Setting | Current Value | Change To | Notes |
|---------|---------------|-----------|-------|
| **Server Mode** | `ADMS` | Keep as is | Or change if needed |
| **Enable Domain Name** | `OFF` | Keep `OFF` | We're using IP address |
| **Server Address** | `0.0.0.0` | `192.168.0.5` | ⚠️ **CHANGE THIS** - Your computer's IP |
| **Server Port** | `81` | `5000` | ⚠️ **CHANGE THIS** - Backend port |
| **Enable Proxy Server** | `ON` | `OFF` | ⚠️ **CHANGE THIS** - Turn OFF proxy |
| **Proxy Server IP** | `0.0.0.0` | Leave as is | Not needed |
| **Proxy Server Port** | `0` | Leave as is | Not needed |

### Step-by-Step Configuration:

1. **Select "Server Address"** (use arrow keys or touch)
   - Change from `0.0.0.0` to `192.168.0.5`
   - Press OK/Enter to confirm

2. **Select "Server Port"**
   - Change from `81` to `5000`
   - Press OK/Enter to confirm

3. **Select "Enable Proxy Server"**
   - Change from `ON` to `OFF`
   - Press OK/Enter to confirm

4. **Save Settings**
   - Look for "Save" or "OK" button
   - Press to save all changes

### Important Notes:
- **Server Address** = Your computer's IP where the backend is running
- **Server Port** = Port 5000 (where your backend server is listening)
- The device will send check-in data to: `http://192.168.0.5:5000`
- The webhook endpoint path `/api/direct-essl/webhook` may be configured elsewhere or automatically appended

### After Configuration:
1. **Save** the settings
2. **Restart** the device if prompted
3. **Test** by checking in on the device
4. **Check** your backend console for webhook logs
5. **Verify** check-ins appear on your website

## Menu Structure:

**Menu → System → Communication** contains:
1. **Ethernet** - Network configuration (already set ✅)
2. **PC Connection** - Direct PC connection settings
3. **Cloud Server Setting** - Server/Push configuration (you're here ✅)

## Additional Settings to Check:

After configuring Cloud Server Setting, check if there are other settings:
- Look for "Push Mode" or "Real-time Transmission" in other menus
- Check "PC Connection" for additional push/webhook settings
- Some devices have "Data Transmission" or "Webhook" in System menu

## Testing:

Once configured, perform a check-in on the device. You should see in your backend console:
```
🔐 ESSL Webhook received: { ... }
🔐 Processing: ACCESS_ATTEMPT from user ...
📡 [WEBSOCKET] Emitted new_access_log event
```

Your website will update in real-time! 🎉

