# ESSL Device Configuration Guide

## 🎯 Goal: Make ESSL Device Check-ins Show on Website

Your ESSL device needs to be configured to send data to your backend when you check in.

## 📋 Step-by-Step Configuration

### Step 1: Access ESSL Device Settings

1. **On your ESSL device**, navigate to:
   - Menu → System → Communication
   - OR Menu → Settings → Server
   - OR Menu → Network → Server Settings

### Step 2: Configure Server Settings

Set these values on your ESSL device:

| Setting | Value | Description |
|---------|-------|-------------|
| **Server IP** | `192.168.1.100` | Your computer's IP address |
| **Server Port** | `5000` | Backend server port |
| **Protocol** | `HTTP` | Use HTTP protocol |
| **URL Path** | `/api/direct-essl/webhook` | Webhook endpoint |

### Step 3: Enable Real-time Transmission

Enable these options on your ESSL device:

- ✅ **Real-time data transmission**
- ✅ **Send access logs immediately**
- ✅ **Include user ID and timestamp**
- ✅ **Include biometric type**
- ✅ **Send on check-in/check-out**

### Step 4: Test Configuration

1. **Check in on your ESSL device**
2. **Check your website**: `http://localhost:5174`
3. **Look for new entries** in the access logs table

## 🔧 Alternative: Manual Trigger Method

If you can't configure the ESSL device automatically:

### Method 1: Run Script After Each Check-in
```bash
node trigger_checkin.js
```

### Method 2: Use Desktop Shortcut
- Double-click `checkin_trigger.bat` after each ESSL check-in

### Method 3: Use Web Interface
- Open `http://localhost:3000`
- Click "👤 Simulate Check-in" button

## 🧪 Testing Your Setup

### Test 1: Manual Simulation
```bash
node simulate_checkins.js 3 2000
```

### Test 2: Check Website
- Open: `http://localhost:5174`
- Look for new access log entries
- Check for real-time updates

### Test 3: Verify Backend
```bash
# Check if backend is receiving data
curl http://localhost:5000/api/access-logs
```

## 🎯 Expected Results

After configuration, when you check in on your ESSL device:

1. **ESSL device** sends data to your backend
2. **Backend** receives and processes the data
3. **Website** shows the check-in in real-time
4. **Access logs table** updates automatically

## 🚨 Troubleshooting

### If ESSL device doesn't send data:
1. **Check network connection** between device and computer
2. **Verify IP addresses** are correct
3. **Test webhook endpoint**: `http://localhost:3000`
4. **Use manual trigger** as backup

### If website doesn't show updates:
1. **Check backend is running**: `http://localhost:5000`
2. **Check frontend is running**: `http://localhost:5174`
3. **Refresh the page** to see updates
4. **Check browser console** for errors

## 📞 Support

If you need help:
1. **Use the web interface**: `http://localhost:3000`
2. **Run the monitor script**: `node monitor_essl_device.js`
3. **Check system status**: `http://localhost:3000` → System Status

## 🎉 Success Indicators

You'll know it's working when:
- ✅ ESSL device check-ins appear on website
- ✅ Real-time updates work
- ✅ Access logs table shows new entries
- ✅ No manual intervention needed










