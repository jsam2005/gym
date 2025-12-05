# Gym Management System - Backend

Backend API with ESSL K30 Pro biometric integration for time-based door access control.

## Features

- 🔐 **Biometric Access Control** - ESSL K30 Pro fingerprint integration
- ⏰ **Time-Based Access** - Door opens only during registered package hours
- 📊 **Real-time Monitoring** - Live access logs via WebSocket
- 👥 **Client Management** - Complete CRUD for gym members
- 📦 **Package Management** - Subscription and payment tracking
- 🤖 **Automated Jobs** - Daily checks for expired packages
- 📱 **REST API** - Full-featured API for frontend

## Prerequisites

- Node.js 18+ and npm
- ESSL K30 Pro biometric device (optional for development)
- Microsoft SQL Server with eTimeTrack Lite/Tracklie database (for bridge mode)

## Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your values:
   - `ESSL_DEVICE_IP` - IP address of your ESSL K30 Pro device
   - `ESSL_DEVICE_PORT` - Device port (default: 4370)
   - `ESSL_DEVICE_PASSWORD` - Device password (default: 0)

3. **Start development server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Clients
- `POST /api/clients` - Create new client
- `GET /api/clients` - Get all clients (with filters)
- `GET /api/clients/:id` - Get client by ID
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `GET /api/clients/stats` - Get client statistics

### Biometric Access Control
- `GET /api/biometric/device/test` - Test ESSL device connection
- `POST /api/biometric/register` - Register client on device
- `POST /api/biometric/enroll` - Enroll fingerprint
- `PUT /api/biometric/schedule` - Update access schedule
- `PUT /api/biometric/toggle/:clientId` - Enable/disable access
- `DELETE /api/biometric/client/:clientId` - Remove from device
- `GET /api/biometric/logs` - Get all access logs
- `GET /api/biometric/logs/:clientId` - Get client access logs
- `GET /api/biometric/dashboard` - Get access dashboard data
- `POST /api/biometric/access-attempt` - Webhook for device (called by ESSL)

### Settings
- `GET /api/settings/profile` - Get profile settings
- `PUT /api/settings/profile` - Update profile
- `POST /api/settings/profile/photo` - Upload profile photo
- `POST /api/settings/password/change` - Change password
- `PUT /api/settings/notifications` - Update notifications
- `GET /api/settings/gym` - Get gym settings
- `PUT /api/settings/gym` - Update gym info

### Health Check
- `GET /api/health` - Server health status
- `GET /api/etimetrack/status` - Bridge status & diagnostics
- `GET /api/etimetrack/test-connection` - Test SQL connectivity
- `POST /api/etimetrack/manual-sync` - Force log sync from eTimeTrack
- `POST /api/etimetrack/clients/:id/sync` - Push a single member to eTimeTrack

## ESSL K30 Pro Integration

### Device Setup

1. **Connect device to network:**
   - Connect ESSL K30 Pro to your LAN
   - Note the device IP address (e.g., 192.168.1.100)
   - Configure device port (default: 4370)

2. **Configure webhook:**
   - In ESSL device settings, set webhook URL to:
     ```
     http://YOUR_SERVER_IP:5000/api/biometric/access-attempt
     ```
   - This allows the device to notify your server when someone scans their fingerprint

3. **Test connection:**
   ```bash
   curl http://localhost:5000/api/biometric/device/test
   ```

### How It Works

1. **Client Registration:**
   - Admin creates a client in the system
   - Client is assigned a package with start/end dates
   - Default access schedule is created (Mon-Sat, 6 AM - 10 PM)

2. **Fingerprint Enrollment:**
   - Admin initiates enrollment via API
   - Client places finger on ESSL device 3 times
   - Fingerprint template is stored on device

3. **Access Validation:**
   - Client scans fingerprint on device
   - Device sends user ID to server via webhook
   - Server checks:
     - ✅ Package not expired
     - ✅ Access is active
     - ✅ No pending payments
     - ✅ Current time within allowed schedule
   - Server responds with allow/deny + door open command
   - Device opens door if allowed (3 seconds)

4. **Automatic Expiry:**
   - Cron job runs daily at 1 AM
   - Checks for expired packages
   - Automatically disables access on device
   - Sends expiry notifications

### Development Mode

When `NODE_ENV=development`, the system works without actual ESSL device:
- All device operations are simulated
- Logs show "[DEV MODE] simulated" for device calls
- Webhook still works for testing

### Access Schedule Format

```javascript
{
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
  startTime: '06:00', // HH:MM format
  endTime: '22:00',   // HH:MM format
  enabled: true
}
```

Example: Client can access Monday-Friday 6 AM to 10 PM, Saturday 8 AM to 8 PM, Sunday closed.

## Database Schema

### Client Schema
- Personal info (name, email, phone, DOB, gender, address)
- Emergency contact
- Package details (type, dates, amount, payment status)
- Access control (ESSL user ID, fingerprint status, schedule)
- Status tracking

### Access Log Schema
- Client reference
- Timestamp
- Access granted (yes/no)
- Reason
- Biometric type

### User Schema (Admin/Staff)
- Name, email, phone
- Password (hashed)
- Role (admin/staff/client)
- Notification preferences

### Gym Settings Schema
- Gym name, email, phone, address

## Background Jobs

### Access Control Job (Daily at 1 AM)
- Finds expired packages
- Disables access on device
- Updates client status
- Sends expiry warnings (7 days before)

### Sync Scheduler (Every 5 minutes)
- Syncs device logs with database
- Updates access statistics
- Checks device connectivity

## WebSocket Events

### Server to Client:
- `access_attempt` - Real-time access log
- `fingerprint_enrolled` - Fingerprint enrollment complete
- `client_updated` - Client data changed
- `device_status` - Device connection status

### Client to Server:
- `subscribe_access_logs` - Subscribe to real-time logs
- `unsubscribe_access_logs` - Unsubscribe

## Production Deployment

1. **Set environment to production:**
   ```bash
   NODE_ENV=production
   ```

2. **Build TypeScript:**
   ```bash
   npm run build
   ```

3. **Start server:**
   ```bash
   npm start
   ```

4. **Use process manager (PM2):**
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name gym-api
   pm2 startup
   pm2 save
   ```

## Security Considerations

- Set strong `JWT_SECRET` in production
- Use HTTPS for webhook communication
- Whitelist ESSL device IP in firewall
- Enable MongoDB authentication
- Use environment variables for sensitive data
- Implement rate limiting for API endpoints

## Troubleshooting

### Device not connecting:
- Check device IP and port
- Verify network connectivity
- Check device password
- Ensure webhook URL is correct

### Door not opening:
- Check access validation logs
- Verify client package not expired
- Check current time against schedule
- Ensure no pending payments

### Fingerprint enrollment failing:
- Ensure client registered on device first
- Check device has free memory
- Verify device connectivity
- Try different finger

## Support

For issues with:
- **ESSL K30 Pro Device:** Contact ESSL support
- **Backend API:** Check logs in console
- **Database:** Check MongoDB connection

## License

MIT

## eTimeTrack Integration

The backend can mirror all member updates and attendance logs through an existing eTimeTrack Lite (or Tracklie) installation so you do not have to touch the device directly.

1. **Environment Variables**

   Add the following (you can reuse the values from `iclock/Settings.txt`):

   ```
   ETIMETRACK_ENABLED=true
   ETIMETRACK_SQL_SERVER=JSAM\SQLEXPRESS
   ETIMETRACK_SQL_DATABASE=etimetracklite1
   ETIMETRACK_SQL_USER=essl
   ETIMETRACK_SQL_PASSWORD=<sql-password>
   ```

   The previous `TRACKLIE_SQL_*` variables still work as backups if you already have them set.

Data Source=JSAM\SQLEXPRESS;Integrated Security=True;Persist Security Info=False;Pooling=False;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Application Name="SQL Server Management Studio";Command Timeout=0   A ready-to-use file with your values lives at `backend/config/etimetrack.env`; copy its contents into your runtime `.env` or source it before launching:

   ```bash
   set -a && source config/etimetrack.env && npm run dev
   ```

2. **What it Does**
   - Mirrors every client create/update/delete into the `USERINFO` table (and related columns) so eTimeTrack pushes the records to your devices.
   - Stores schedule summaries in the user notes for quick auditing.
   - Pulls punch logs from whichever attendance table exists (`CHECKINOUT`, `iclock_transaction`, etc.) and streams them into the gym dashboard in real time.
   - Exposes `/api/etimetrack/*` endpoints so you can monitor the bridge, run manual syncs, or resync a single member.

3. **Verification**
   - Hit `GET /api/etimetrack/status` – it will list the detected user/log tables.
   - Create a member in the gym UI, then confirm it appears in `iclock/Employeelist.csv` or directly inside SQL `USERINFO`.
   - Use `POST /api/etimetrack/manual-sync` after doing a test punch on the device; the log should show up immediately on the gym dashboard.

4. **Failover**
   - Set `ETIMETRACK_ENABLED=false` to revert to the legacy direct-device TCP mode.
   - All new AccessLog entries record a `source` field (`direct-device` vs `etimetrack`) so you always know which path produced the data.
