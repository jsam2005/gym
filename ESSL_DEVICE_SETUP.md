# ESSL K30 Pro Device Setup Guide

## 🔧 Device Configuration

### 1. Network Configuration
- **IP Address**: Configure ESSL device to use static IP (`192.168.1.19`)
- **Port**: `4370` (default ESSL port)
- **Gateway**: Your router's IP address
- **DNS**: Your router's DNS or `8.8.8.8`

### 2. Webhook Configuration
Configure the ESSL device to send webhooks to your website:

```
Webhook URL: http://192.168.1.20:5000/api/direct-essl/webhook
Method: POST
Content-Type: application/json
```

### 3. Device Settings
- **Admin Password**: `0` (default)
- **Time Zone**: Set to your local timezone
- **Network Protocol**: HTTP/HTTPS
- **Real-time Events**: Enable webhook notifications

## 📡 Data Flow Architecture

### What ESSL Device Stores:
- ✅ **Fingerprint templates** (biometric data)
- ✅ **User ID** (e.g., `GYM12345678`)
- ❌ **No package information**
- ❌ **No payment status**
- ❌ **No access schedules**

### What Your Website Provides:
- ✅ **Package expiry validation**
- ✅ **Payment status checking**
- ✅ **Time-based access control**
- ✅ **Client status validation**
- ✅ **Access logging**
- ✅ **Real-time monitoring**

## 🔄 Access Control Flow

```
1. Client scans fingerprint on ESSL device
2. ESSL device recognizes fingerprint → gets user ID
3. ESSL device sends webhook to your website:
   POST /api/direct-essl/webhook
   {
     "userId": "GYM12345678",
     "timestamp": "2024-01-15T10:30:00Z",
     "biometricType": "fingerprint"
   }
4. Your website validates:
   - Package expiry
   - Payment status
   - Access schedule
   - Client status
5. Website responds to ESSL device:
   {
     "allowed": true/false,
     "reason": "Access granted/denied reason",
     "openDoor": true/false,
     "doorOpenDuration": 3
   }
6. ESSL device opens/closes door based on response
7. Website logs access attempt
8. Real-time update sent to frontend dashboard
```

## 🛠 API Endpoints

### Device Management
- `GET /api/direct-essl/test-direct` - Test direct connection
- `GET /api/direct-essl/health` - Health check
- `POST /api/direct-essl/webhook` - ESSL device webhook

### Biometric Operations
- `GET /api/biometric/device/test` - Test device connection
- `POST /api/biometric/register` - Register client on device
- `POST /api/biometric/enroll` - Enroll fingerprint
- `PUT /api/biometric/schedule` - Update access schedule
- `PUT /api/biometric/toggle/:clientId` - Enable/disable access
- `DELETE /api/biometric/client/:clientId` - Remove from device

### Monitoring
- `GET /api/biometric/logs` - Get access logs
- `GET /api/biometric/dashboard` - Get dashboard stats

## 🔧 Environment Variables

```env
# ESSL Device Configuration
ESSL_DEVICE_IP=192.168.1.19
ESSL_DEVICE_PORT=4370
ESSL_DEVICE_PASSWORD=0

# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/gym_management
```

## 📊 Real-time Updates

The system uses Socket.IO for real-time communication:

### Frontend Events:
- `access_attempt` - When someone scans fingerprint
- `fingerprint_enrolled` - When enrollment completes
- `device_status` - Device online/offline status

### Backend Events:
- `connect` - Client connected to server
- `disconnect` - Client disconnected

## 🚀 Testing the Setup

### 1. Test Device Connection
```bash
# Test direct connection
curl http://localhost:5000/api/direct-essl/test-direct

# Test regular connection
curl http://localhost:5000/api/biometric/device/test
```

### 2. Test Webhook
```bash
# Simulate ESSL device webhook
curl -X POST http://localhost:5000/api/direct-essl/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "GYM12345678",
    "timestamp": "2024-01-15T10:30:00Z",
    "biometricType": "fingerprint"
  }'
```

### 3. Monitor Real-time Updates
Open the BiometricAccess page in your browser and watch for real-time notifications when access attempts occur.

## 🔍 Troubleshooting

### Common Issues:

1. **Device Not Connecting**
   - Check network connectivity
   - Verify IP address and port
   - Test with direct connection endpoint

2. **Webhook Not Working**
   - Ensure ESSL device can reach your server
   - Check firewall settings
   - Verify webhook URL is correct

3. **Access Denied**
   - Check package expiry date
   - Verify payment status
   - Confirm access schedule
   - Check client status

4. **Real-time Updates Not Working**
   - Check Socket.IO connection
   - Verify CORS settings
   - Check browser console for errors

## 📈 Monitoring Dashboard

The BiometricAccess page provides:
- Real-time device status
- Access attempt statistics
- Client enrollment status
- Live access logs
- Dashboard analytics

## 🎯 Best Practices

1. **Regular Backups**: Backup your database regularly
2. **Network Security**: Use VPN or secure network for device communication
3. **Monitoring**: Set up alerts for device offline status
4. **Testing**: Regularly test access control functionality
5. **Updates**: Keep device firmware updated

## 📞 Support

For technical support:
- Check device logs in the dashboard
- Monitor real-time access attempts
- Verify webhook responses
- Test device connectivity

