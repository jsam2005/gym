# Complete User Synchronization Guide

## 🎯 Overview

When you add a user from your website, the system automatically synchronizes the user across **three systems**:

1. **Website (SQL Database)** - Stores user data
2. **Middleware Software (eSSL eTimeTrackLite)** - Reads from SQL automatically
3. **ESSL Biometric Device** - Receives user registration via TCP

---

## 📋 How It Works

### When You Add a User from Website:

#### Step 1: SQL Database (Website) ✅
- User is created in `Employees` table
- Additional info stored in `GymClients` table
- **Status**: ✅ **Automatic - Always Works**

#### Step 2: Middleware Software (eSSL eTimeTrackLite) ✅
- Middleware software reads directly from `Employees` table
- User appears automatically in middleware
- **Status**: ✅ **Automatic - No Action Needed**
- **Note**: Refresh the middleware software to see new users

#### Step 3: ESSL Biometric Device 📱
- System attempts TCP registration on port 4370
- Uses ESSL SDK protocol (CMD_USER_WRQ)
- **Status**: ⚠️ **May require device sync**

---

## 🔧 Device Registration Methods

### Method 1: Direct TCP Registration (Automatic)
- **Port**: 4370 (ESSL default)
- **Protocol**: ESSL SDK
- **Command**: CMD_USER_WRQ (0x05)
- **Status**: Attempted automatically when adding user

### Method 2: Middleware Sync (Manual)
If direct TCP fails, the middleware software can sync users to the device:

1. Open **eSSL eTimeTrackLite** middleware
2. Go to **Device Management**
3. Select your device
4. Click **"Download Users"** or **"Sync Users"**
5. Device will receive all users from the database

### Method 3: Manual Device Registration
If both methods fail:

1. Open **eSSL eTimeTrackLite** middleware
2. Go to **Employees List**
3. Find the new user
4. Click **"Register"** button next to the user
5. Device will receive the user registration

---

## ✅ Verification Checklist

After adding a user, verify in all three systems:

### 1. Website ✅
- Go to **"All Clients"** page
- User should appear immediately
- Check User ID (e.g., `6`, `7`, `8`)

### 2. Middleware Software ✅
- Open **eSSL eTimeTrackLite**
- Go to **Employees List**
- **Refresh the page** (F5 or click Refresh button)
- User should appear with correct User ID

### 3. ESSL Device 📱
- Check device user list
- User should appear with User ID and Name
- If not visible:
  - Try **Method 2** (Middleware Sync) above
  - Or **Method 3** (Manual Registration) above

---

## 🔍 Troubleshooting

### Issue: User appears in website but not in middleware

**Solution**:
1. Refresh the middleware software (F5)
2. Check if user exists in SQL:
   ```sql
   SELECT * FROM Employees WHERE EmployeeCodeInDevice = '6';
   ```
3. Verify middleware is connected to the same database

### Issue: User appears in middleware but not on device

**Solution**:
1. Check device connection in middleware
2. Go to **Device Management** → Select device → **"Download Users"**
3. Or manually register: **Employees List** → Click **"Register"** button

### Issue: TCP registration fails

**Possible Causes**:
- Device is offline
- Wrong device IP address
- Firewall blocking port 4370
- Device not configured for TCP communication

**Solution**:
1. Check device IP in `.env` file: `ESSL_DEVICE_IP=192.168.0.5`
2. Ping device: `ping 192.168.0.5`
3. Use middleware sync instead (Method 2)

---

## 📝 Current Implementation

### User Creation Flow:

```
Website Form Submit
    ↓
1. Create in Employees table (SQL)
    ↓
2. Create in GymClients table (SQL)
    ↓
3. Attempt TCP registration to device
    ↓
4. Return success response
```

### Automatic Synchronization:

- **Website ↔ SQL**: ✅ Direct (immediate)
- **SQL ↔ Middleware**: ✅ Automatic (reads from SQL)
- **SQL ↔ Device**: ⚠️ TCP attempt (may need manual sync)

---

## 🎯 Best Practice

### Recommended Workflow:

1. **Add user from website** ✅
2. **Verify in website** (should appear immediately)
3. **Open middleware software** and **refresh** (F5)
4. **Verify in middleware** (should appear after refresh)
5. **Sync device from middleware**:
   - Go to **Device Management**
   - Click **"Download Users"** or **"Sync Users"**
6. **Verify on device** (user should appear)

---

## 🔐 Important Notes

1. **User ID Format**: Sequential natural numbers (6, 7, 8, ...)
2. **Database**: All data stored in SQL Server
3. **Middleware**: Reads directly from SQL (no API needed)
4. **Device**: May need manual sync if TCP fails
5. **Deletion**: Hard delete removes from all systems

---

## 📞 Support

If users don't appear in device:
1. Check device connection status in middleware
2. Use middleware's sync function
3. Verify device IP and network connectivity
4. Check middleware logs for errors

---

## ✅ Summary

- ✅ **Website**: Always works (direct SQL)
- ✅ **Middleware**: Always works (reads from SQL)
- ⚠️ **Device**: May need manual sync via middleware

The system is designed to work automatically, but device sync may require using the middleware software's built-in sync function.




