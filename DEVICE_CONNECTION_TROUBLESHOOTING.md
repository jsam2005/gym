# ESSL Device Connection Troubleshooting

## Error: `ECONNREFUSED 192.168.0.5:4370`

This error means the application cannot connect to your ESSL biometric device.

## Quick Fixes

### 1. Check Device Status
- ✅ Is the device powered on?
- ✅ Is the device connected to your network?
- ✅ Check the device display for any error messages

### 2. Verify Device IP Address
The default IP is `192.168.0.5`. To check/change:

**On the Device:**
1. Go to Menu → System → Network
2. Check the current IP address
3. Note it down

**Update in Backend:**
1. Open `backend/.env` file
2. Update `ESSL_DEVICE_IP` with the correct IP:
   ```
   ESSL_DEVICE_IP=192.168.0.5  # Change to your device's actual IP
   ESSL_DEVICE_PORT=4370
   ```
3. Restart the backend server

### 3. Network Connectivity

**Test Connection:**
```powershell
# Ping the device
ping 192.168.0.5

# Test port connectivity (if you have telnet)
telnet 192.168.0.5 4370
```

**Check Network:**
- ✅ Device and server must be on the same network
- ✅ No VPN blocking local network access
- ✅ Firewall allows port 4370

### 4. Firewall Settings

**Windows Firewall:**
1. Open Windows Defender Firewall
2. Allow port 4370 for inbound/outbound connections
3. Or temporarily disable firewall to test

### 5. Common Issues

| Issue | Solution |
|-------|----------|
| Device IP changed | Update `ESSL_DEVICE_IP` in `.env` |
| Device offline | Power cycle the device |
| Wrong network | Connect device and server to same network |
| Port blocked | Open port 4370 in firewall |
| Device in different subnet | Configure router or use device's actual IP |

## Testing Connection

### Method 1: Via API
```bash
# Test direct connection
curl http://localhost:5000/api/direct-essl/test-direct
```

### Method 2: Check Device Settings
1. Open ESSL device web interface (if available)
2. Check Network → TCP/IP settings
3. Verify IP address matches your `.env` file

## Expected Behavior

- ✅ **Device Online**: Connection successful, can register users
- ⚠️ **Device Offline**: Connection fails gracefully, app continues working
- ✅ **No Crash**: Application should not crash if device is offline

## Configuration

**Environment Variables:**
```env
ESSL_DEVICE_IP=192.168.0.5    # Your device IP
ESSL_DEVICE_PORT=4370         # Default ESSL port
ESSL_DEVICE_PASSWORD=0         # Device password (usually 0)
```

## Still Having Issues?

1. **Check device manual** for network configuration
2. **Contact ESSL support** for device-specific issues
3. **Verify network topology** - device must be reachable from server
4. **Try different port** - some devices use 4371 instead of 4370

---

**Note:** The application will continue to work even if the device is offline. Device connection is only needed for:
- Registering new users on the device
- Enrolling fingerprints
- Real-time access control

Database operations and other features work independently of device connection.

