/**
 * Local API Server
 * Runs on your local machine and connects to local DB and middleware
 * Expose this via HTTP tunnel (localhost.run, ngrok, or Cloudflare)
 */

const express = require('express');
const cors = require('cors');
const sql = require('mssql');
require('dotenv').config({ path: './backend/.env' });

const app = express();
const PORT = process.env.LOCAL_API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
let pool = null;

const connectDB = async () => {
  try {
    const config = {
      server: process.env.ETIME_SQL_SERVER?.split('\\')[0] || 'localhost',
      database: process.env.ETIME_SQL_DB || 'etimetracklite1',
      user: process.env.ETIME_SQL_USER || 'essl',
      password: process.env.ETIME_SQL_PASSWORD || 'essl',
      options: {
        instanceName: process.env.ETIME_SQL_SERVER?.includes('\\') 
          ? process.env.ETIME_SQL_SERVER.split('\\')[1] 
          : process.env.ETIME_SQL_INSTANCE || 'SQLEXPRESS',
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    pool = await sql.connect(config);
    console.log('✅ Connected to local SQL Server');
    console.log(`   Server: ${config.server}\\${config.options.instanceName}`);
    console.log(`   Database: ${config.database}`);
  } catch (error) {
    console.error('❌ Failed to connect to SQL Server:', error.message);
    pool = null;
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: pool ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Database query endpoint
app.post('/api/query', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { query, params } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const request = pool.request();
    
    // Add parameters if provided
    if (params) {
      Object.keys(params).forEach(key => {
        request.input(key, params[key]);
      });
    }

    const result = await request.query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get clients
app.get('/api/clients', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ 
        success: false,
        error: 'Database not connected' 
      });
    }

    const { status } = req.query;
    const request = pool.request();
    
    let query = `
      SELECT TOP 100 
        e.EmployeeId AS ClientID,
        e.EmployeeName AS ClientName,
        e.ContactNo AS Phone,
        e.Email,
        e.Status,
        e.DOJ AS CreatedDate
      FROM Employees e
      WHERE e.EmployeeName NOT LIKE 'del_%'
        AND LOWER(e.Status) NOT IN ('deleted', 'delete')
    `;
    
    if (status) {
      request.input('StatusFilter', sql.NVarChar(20), status);
      query += ` AND e.Status = @StatusFilter`;
    }
    
    query += ` ORDER BY e.EmployeeName ASC`;

    const result = await request.query(query);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get clients by status
app.get('/api/clients', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const status = req.query.status || 'active';
    const request = pool.request();
    request.input('status', sql.VarChar, status);

    const result = await request.query(`
      SELECT TOP 100 
        ClientID, 
        ClientName, 
        Phone, 
        Email, 
        Status,
        CreatedDate
      FROM Clients
      WHERE Status = @status
      ORDER BY CreatedDate DESC
    `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Biometric dashboard
app.get('/api/biometric/dashboard', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const request = pool.request();
    
    // Get today's attendance count
    const todayResult = await request.query(`
      SELECT COUNT(*) as count
      FROM AttendanceLogs
      WHERE CAST(LogDate AS DATE) = CAST(GETDATE() AS DATE)
    `);

    // Get total members
    const membersResult = await request.query(`
      SELECT COUNT(*) as count
      FROM Clients
      WHERE Status = 'active'
    `);

    res.json({
      success: true,
      data: {
        todayAttendance: todayResult.recordset[0]?.count || 0,
        totalMembers: membersResult.recordset[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Biometric logs
app.get('/api/biometric/logs', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { limit = 500, startDate, endDate, deviceId } = req.query;
    const request = pool.request();
    
    let query = `
      SELECT TOP ${limit}
        LogID,
        UserID,
        LogDate,
        DeviceID,
        InOut,
        VerifyMode
      FROM AttendanceLogs
      WHERE 1=1
    `;

    if (startDate) {
      request.input('startDate', sql.DateTime, new Date(startDate));
      query += ` AND LogDate >= @startDate`;
    }
    if (endDate) {
      request.input('endDate', sql.DateTime, new Date(endDate));
      query += ` AND LogDate <= @endDate`;
    }
    if (deviceId) {
      request.input('deviceId', sql.Int, parseInt(deviceId));
      query += ` AND DeviceID = @deviceId`;
    }

    query += ` ORDER BY LogDate DESC`;

    const result = await request.query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy to ESSL middleware (if needed)
app.get('/api/essl/*', async (req, res) => {
  try {
    const path = req.path.replace('/api/essl', '');
    const esslUrl = process.env.ESSL_API_URL || 'http://localhost:8080';
    
    // Forward request to ESSL middleware
    const axios = require('axios');
    const response = await axios.get(`${esslUrl}${path}`, {
      timeout: 5000,
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('ESSL proxy error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log('');
    console.log('========================================');
    console.log('Local API Server Running!');
    console.log('========================================');
    console.log(`Port: ${PORT}`);
    console.log(`Database: ${pool ? 'Connected' : 'Disconnected'}`);
    console.log('');
    console.log('Endpoints:');
    console.log(`  GET  /health`);
    console.log(`  GET  /api/clients`);
    console.log(`  GET  /api/biometric/dashboard`);
    console.log(`  GET  /api/biometric/logs`);
    console.log(`  POST /api/query`);
    console.log('');
    console.log('Expose this server via HTTP tunnel:');
    console.log('  - localhost.run: ssh -R 80:localhost:3001 ssh.localhost.run');
    console.log('  - ngrok: ngrok http 3001');
    console.log('  - Cloudflare: cloudflared tunnel --url http://localhost:3001');
    console.log('');
    console.log('========================================');
  });
};

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  if (pool) {
    await pool.close();
    console.log('Database connection closed');
  }
  process.exit(0);
});

