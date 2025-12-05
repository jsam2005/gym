# Post-Migration Guide

## After ESSL User Migration

Once you've successfully migrated your ESSL K30 Pro users to the website, follow these steps to complete the setup:

## 1. Review Migrated Users

1. **Go to "All Clients" page** in your website
2. **Look for users with placeholder data:**
   - Email: `[userId]@gym.local`
   - Phone: `0000000000`
   - Address: `To be updated`
   - Emergency Contact: `To be updated`

## 2. Update Client Information

For each migrated user, update the following:

### Required Updates:
- **Email**: Replace placeholder with real email
- **Phone**: Update with actual phone number
- **Date of Birth**: Set correct birth date
- **Address**: Add real address
- **Emergency Contact**: Update with real contact details

### Package Information:
- **Package Type**: Verify or update package type
- **Package Amount**: Set correct monthly/yearly fee
- **Payment Status**: Update based on actual payments
- **Package End Date**: Set correct expiry date

## 3. Verify Access Schedules

1. **Check each client's access schedule:**
   - Default: Mon-Sat, 6 AM - 10 PM
   - Update if different hours needed
   - Disable Sunday if gym closed

2. **Test access control:**
   - Scan fingerprint on ESSL device
   - Verify access granted/denied based on schedule
   - Check real-time notifications in website

## 4. Configure ESSL Device Webhook

**On your ESSL K30 Pro device:**

1. **Press Menu button**
2. **Enter admin password** (default: `0`)
3. **Navigate to:** System → Network → Push Settings
4. **Configure:**
   - **Enable Push:** YES
   - **Server IP:** `192.168.0.6` (your computer's IP)
   - **Server Port:** `5000`
   - **URL:** `http://192.168.0.6:5000/api/biometric/access-attempt`
   - **Method:** POST
   - **Format:** JSON

## 5. Test Complete System

### Test 1: Device Connection
1. Go to **Biometric Access** page
2. Click **"Test Connection"**
3. Should show "Connected and ready"

### Test 2: Access Control
1. **Scan fingerprint** on ESSL device
2. **Check website** for real-time notification
3. **Verify access log** appears in "Access Logs" tab

### Test 3: Schedule Updates
1. **Edit client schedule** in website
2. **Change time slots** or days
3. **Save changes**
4. **Test access** with fingerprint - new schedule should be enforced

## 6. Ongoing Management

### Adding New Clients:
1. **Add via website** (Clients → Add Client)
2. **Register on device** (Biometric Access → Register)
3. **Enroll fingerprint** (Biometric Access → Enroll)
4. **Enable access** (Toggle switch ON)

### Managing Existing Clients:
- **All changes made via website**
- **Website automatically syncs to ESSL device**
- **Access validation happens via webhook**

## 7. Troubleshooting

### Device Not Connecting:
- Check ESSL device IP is `192.168.0.13`
- Verify computer IP is `192.168.0.6`
- Test: `ping 192.168.0.13`

### Access Denied When Should Be Granted:
1. Check client package expiry date
2. Verify access schedule (time slots)
3. Ensure access is enabled (toggle ON)
4. Check for pending payments

### Real-Time Notifications Not Working:
- Verify backend is running on port 5000
- Check webhook URL in ESSL device
- Ensure firewall allows incoming connections

## 8. Success Indicators

✅ **System is working correctly when:**
- Device shows "Connected and ready"
- Fingerprint scan triggers webhook
- Website shows real-time notification
- Access granted/denied based on schedule
- Access logs appear immediately
- Schedule changes sync to device

## 9. Next Steps

Once everything is working:
1. **Train staff** on website usage
2. **Document procedures** for daily operations
3. **Set up regular backups** of database
4. **Monitor access logs** for any issues
5. **Plan for future expansions** (additional devices, features)

## Support

If you encounter issues:
1. Check backend logs for errors
2. Verify network connectivity
3. Test webhook manually with curl
4. Review ESSL device settings
5. Contact technical support if needed

---

**Your gym management system is now fully integrated with ESSL K30 Pro biometric access control!** 🎉

