# Tracklie SQL Server Integration Setup

## Overview
Your website now connects directly to eSSL Tracklie's SQL Server database instead of MongoDB. All access logs are read directly from Tracklie's database.

## Configuration

### 1. Environment Variables
Add these to your `.env` file in the `backend` directory:

```env
# Tracklie SQL Server Configuration
TRACKLIE_SQL_SERVER=localhost
TRACKLIE_SQL_DATABASE=eTimeTrackLite
TRACKLIE_SQL_USER=essl
TRACKLIE_SQL_PASSWORD=essl
```

**Note:** Adjust these values based on your Tracklie installation:
- `TRACKLIE_SQL_SERVER`: Usually `localhost` or `localhost\SQLEXPRESS`
- `TRACKLIE_SQL_DATABASE`: Check Tracklie settings for database name (commonly `eTimeTrackLite`)
- `TRACKLIE_SQL_USER`: Your SQL Server username (default: `essl`)
- `TRACKLIE_SQL_PASSWORD`: Your SQL Server password (default: `essl`)

### 2. SQL Server Authentication
Make sure SQL Server is configured to allow SQL Server Authentication (not just Windows Authentication).

## Testing the Connection

### Step 1: Test Connection
```bash
GET http://localhost:5000/api/tracklie/test
```

Expected response:
```json
{
  "success": true,
  "message": "Connected to SQL Server",
  "data": {
    "version": "Microsoft SQL Server ...",
    "database": "eTimeTrackLite"
  }
}
```

### Step 2: Discover Database Structure
```bash
GET http://localhost:5000/api/tracklie/discover
```

This will show you:
- All tables in the database
- Which table contains attendance logs
- Which table contains user/employee data
- Sample data structure

### Step 3: Get Access Logs
```bash
GET http://localhost:5000/api/access-logs
```

Optional query parameters:
- `startDate`: Filter from date (ISO format)
- `endDate`: Filter to date (ISO format)
- `limit`: Number of records (default: 100)
- `pin`: Filter by user PIN/ID

Example:
```
GET http://localhost:5000/api/access-logs?startDate=2024-01-01&endDate=2024-12-31&limit=50
```

### Step 4: Get Users
```bash
GET http://localhost:5000/api/access-logs/users
```

### Step 5: Get User by PIN
```bash
GET http://localhost:5000/api/access-logs/users/123
```

## API Endpoints

### Access Logs
- `GET /api/access-logs` - Get all access logs from Tracklie
- `GET /api/access-logs/stats` - Get statistics
- `GET /api/access-logs/users` - Get all users from Tracklie
- `GET /api/access-logs/users/:pin` - Get user by PIN
- `GET /api/access-logs/test-connection` - Test SQL Server connection

### Tracklie Discovery
- `GET /api/tracklie/test` - Test SQL Server connection
- `GET /api/tracklie/discover` - Discover database structure

## How It Works

1. **Direct Database Connection**: Your website connects directly to Tracklie's SQL Server database
2. **No Data Duplication**: Data is read directly from Tracklie - no syncing needed
3. **Real-time Access**: As soon as someone checks in on the device, the data is available in Tracklie's database
4. **Automatic Updates**: Tracklie manages all attendance logs automatically

## Common Table Names

Tracklie typically uses these table names:
- **Attendance Logs**: `TransactionLog`, `AttLog`, `CheckInOut`, `TRANSLOG`
- **Users/Employees**: `UserInfo`, `Employee`, `USERINFO`

The service automatically detects the correct table names.

## Troubleshooting

### Connection Failed
1. Check SQL Server is running
2. Verify credentials in `.env` file
3. Ensure SQL Server Authentication is enabled
4. Check firewall settings

### Tables Not Found
1. Run `/api/tracklie/discover` to see all available tables
2. Check Tracklie database name is correct
3. Verify you're connected to the correct database

### No Data Returned
1. Check if there are any attendance logs in Tracklie
2. Verify date filters are correct
3. Check Tracklie device is connected and recording logs

## Next Steps

1. Configure `.env` file with your SQL Server credentials
2. Test connection: `GET /api/tracklie/test`
3. Discover database: `GET /api/tracklie/discover`
4. Start using the API endpoints to fetch access logs


