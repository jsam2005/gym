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


// Dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ 
        success: false,
        error: 'Database not connected' 
      });
    }

    const request = pool.request();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get client stats from Employees table
    const clientStatsResult = await request.query(`
      SELECT 
        COUNT(*) as totalClients,
        SUM(CASE WHEN LOWER(Status) = 'active' OR Status = 'Working' THEN 1 ELSE 0 END) as activeClients,
        SUM(CASE WHEN LOWER(Status) IN ('inactive', 'suspended') THEN 1 ELSE 0 END) as inactiveClients
      FROM Employees
      WHERE EmployeeName NOT LIKE 'del_%'
        AND LOWER(Status) NOT IN ('deleted', 'delete')
    `);

    const clientStats = clientStatsResult.recordset[0] || {};
    
    // Get billing stats from GymClients
    let billingStats = {
      totalBillings: 0,
      pendingAmount: 0,
      thisMonthCollections: 0,
      totalSales: 0,
    };

    try {
      const billingResult = await request
        .input('StartOfMonth', sql.DateTime, startOfMonth)
        .query(`
          SELECT 
            COUNT(*) as totalBillings,
            ISNULL(SUM(PendingAmount), 0) as pendingAmount,
            ISNULL(SUM(AmountPaid), 0) as totalSales,
            ISNULL(SUM(CASE WHEN CreatedAt >= @StartOfMonth THEN AmountPaid ELSE 0 END), 0) as thisMonthCollections
          FROM GymClients
          WHERE TotalAmount IS NOT NULL
        `);
      
      if (billingResult.recordset[0]) {
        const row = billingResult.recordset[0];
        billingStats = {
          totalBillings: row.totalBillings || 0,
          pendingAmount: parseFloat(row.pendingAmount || 0),
          thisMonthCollections: parseFloat(row.thisMonthCollections || 0),
          totalSales: parseFloat(row.totalSales || 0),
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch billing stats:', error.message);
    }

    // Get pending and overdue clients
    let pendingClients = 0;
    let overdueClients = 0;

    try {
      const pendingResult = await request
        .input('Now', sql.DateTime, now)
        .query(`
          SELECT 
            COUNT(CASE WHEN PendingAmount > 0 AND RemainingDate >= @Now THEN 1 END) as pending,
            COUNT(CASE WHEN PendingAmount > 0 AND RemainingDate < @Now THEN 1 END) as overdue
          FROM GymClients
          WHERE PendingAmount IS NOT NULL AND PendingAmount > 0
        `);
      
      if (pendingResult.recordset[0]) {
        pendingClients = pendingResult.recordset[0].pending || 0;
        overdueClients = pendingResult.recordset[0].overdue || 0;
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch pending/overdue stats:', error.message);
    }

    // Get monthly growth data (last 12 months)
    const monthlyGrowth = [];
    try {
      const growthResult = await request.query(`
        SELECT 
          FORMAT(DOJ, 'MMM') as month,
          COUNT(*) as value
        FROM Employees
        WHERE EmployeeName NOT LIKE 'del_%'
          AND LOWER(Status) NOT IN ('deleted', 'delete')
          AND DOJ >= DATEADD(MONTH, -12, GETDATE())
        GROUP BY FORMAT(DOJ, 'MMM'), YEAR(DOJ), MONTH(DOJ)
        ORDER BY YEAR(DOJ), MONTH(DOJ)
      `);

      monthlyGrowth.push(...growthResult.recordset.map((row) => ({
        month: row.month,
        value: row.value || 0,
      })));
      
      // If no data, provide empty structure
      if (monthlyGrowth.length === 0) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthlyGrowth.push(...months.map(m => ({ month: m, value: 0 })));
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch growth data:', error.message);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      monthlyGrowth.push(...months.map(m => ({ month: m, value: 0 })));
    }

    // Calculate renewal clients (clients with RemainingDate within 30 days)
    let renewalClients = 0;
    try {
      const renewalResult = await request
        .input('Now', sql.DateTime, now)
        .input('ThirtyDays', sql.DateTime, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000))
        .query(`
          SELECT COUNT(*) as count
          FROM GymClients
          WHERE RemainingDate IS NOT NULL
            AND RemainingDate >= @Now
            AND RemainingDate <= @ThirtyDays
        `);
      
      renewalClients = renewalResult.recordset[0]?.count || 0;
    } catch (error) {
      console.warn('⚠️ Could not fetch renewal clients:', error.message);
    }

    res.json({
      success: true,
      data: {
        // Primary KPIs
        allClients: parseInt(clientStats.totalClients || 0),
        activeClients: parseInt(clientStats.activeClients || 0),
        inactiveClients: parseInt(clientStats.inactiveClients || 0),
        renewalClients: renewalClients,
        
        // Secondary KPIs
        totalBillings: billingStats.totalBillings,
        totalSales: billingStats.totalSales,
        pendingAmount: billingStats.pendingAmount,
        thisMonthCollections: billingStats.thisMonthCollections,
        
        // Pending and Overdue
        pendingClients: pendingClients,
        overdueClients: overdueClients,
        
        // Growth chart data
        monthlyGrowth: monthlyGrowth,
      },
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
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
    console.log(`  GET  /api/dashboard/stats`);
    console.log(`  GET  /api/biometric/dashboard`);
    console.log(`  GET  /api/biometric/logs`);
    console.log(`  POST /api/query`);
    console.log('');
    console.log('Expose this server via HTTP tunnel:');
    console.log('  - Cloudflare (Recommended): cloudflared tunnel --url http://localhost:3001');
    console.log('  - Or use: start-production.ps1 (starts both server and tunnel)');
    console.log('');
    console.log('========================================');
    console.log('💡 For production, use Cloudflare Tunnel:');
    console.log('   1. Run: cloudflared tunnel login');
    console.log('   2. Run: cloudflared tunnel create gym-api-tunnel');
    console.log('   3. Run: cloudflared tunnel run gym-api-tunnel');
    console.log('   4. Or use: start-production.ps1');
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

