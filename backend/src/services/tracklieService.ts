import sql from 'mssql';
import connectDB, { getPool } from '../config/database.js';
import esslTrackLiteApiService from './esslTrackLiteApiService.js';

/**
 * Tracklie Service
 * Handles database operations via API (preferred) or direct SQL connection
 */
class TracklieService {
  private pool: sql.ConnectionPool | null = null;
  private useApi: boolean | null = null; // Lazy initialization

  /**
   * Check if API mode is enabled (lazy check to ensure env vars are loaded)
   */
  private isApiMode(): boolean {
    if (this.useApi === null) {
      // Check if API mode is enabled
      this.useApi = process.env.SQL_DISABLED === 'true' || 
                    process.env.USE_API_ONLY === 'true' ||
                    process.env.ESSL_TRACKLITE_USE_API === 'true';
      
      if (this.useApi) {
        console.log('📡 Tracklie Service: Using API mode (ESSL TrackLite API)');
      } else {
        console.log('💾 Tracklie Service: Using direct SQL connection');
      }
    }
    return this.useApi;
  }

  private async ensurePool(): Promise<sql.ConnectionPool> {
    // Skip if SQL is disabled (using API mode)
    if (this.isApiMode()) {
      throw new Error('SQL Server is disabled. Using API mode instead.');
    }

    if (this.pool) {
      return this.pool;
    }
    try {
      this.pool = getPool();
      return this.pool;
    } catch {
      await connectDB();
      this.pool = getPool();
      return this.pool;
    }
  }

  /**
   * Find attendance log table name
   */
  async findAttendanceTable(): Promise<string | null> {
    const possibleTables = [
      'DeviceLogs', // ✅ Primary table - Raw device logs
      'AttendanceLogs', // ✅ Processed attendance (daily summaries)
      'TransactionLog',
      'AttLog',
      'CheckInOut',
      'CHECKINOUT',
      'TRANSLOG',
      'AttTransaction',
      'iclock_transaction',
      'AttLogs',
      'AttendanceLog',
      'Logs',
      'DeviceTransaction',
    ];

    const pool = await this.ensurePool();
    
    // First, try to get all tables to see what exists
    try {
      const tablesResult = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `);
      const allTables = tablesResult.recordset.map((row: any) => row.TABLE_NAME);
      console.log(`📋 Available tables in database: ${allTables.join(', ')}`);
      
      // Check if any of our candidate tables exist
      for (const table of possibleTables) {
        if (allTables.includes(table)) {
          try {
            const result = await pool.request().query(`SELECT TOP 1 * FROM ${table}`);
            console.log(`✅ Found attendance table: ${table}`);
            return table;
          } catch (e) {
            // Table exists but might be empty or have permission issues
            console.log(`⚠️  Table ${table} exists but query failed:`, (e as Error).message);
            continue;
          }
        }
      }
    } catch (e) {
      console.warn('⚠️  Could not list tables, trying direct queries:', (e as Error).message);
    }
    
    // Fallback: try direct queries
    for (const table of possibleTables) {
      try {
        const result = await pool.request().query(`SELECT TOP 1 * FROM ${table}`);
        console.log(`✅ Found attendance table: ${table}`);
        return table;
      } catch (e) {
        // Table doesn't exist, try next
        continue;
      }
    }

    console.warn('⚠️  Could not find attendance log table. Available tables may not match expected names.');
    console.warn('💡 Run this query to see all tables:');
    console.warn('   SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\'');
    return null; // Return null instead of throwing
  }

  /**
   * Find user/employee table name
   */
  async findUserTable(): Promise<string | null> {
    const possibleTables = ['Employees', 'UserInfo', 'Employee', 'USERINFO', 'Users', 'User', 'EmployeeInfo'];

    const pool = await this.ensurePool();
    
    // First, try to get all tables
    try {
      const tablesResult = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `);
      const allTables = tablesResult.recordset.map((row: any) => row.TABLE_NAME);
      
      // Check if any of our candidate tables exist
      for (const table of possibleTables) {
        if (allTables.includes(table)) {
          try {
            const result = await pool.request().query(`SELECT TOP 1 * FROM ${table}`);
            console.log(`✅ Found user table: ${table}`);
            return table;
          } catch (e) {
            continue;
          }
        }
      }
    } catch (e) {
      // Fallback to direct queries
    }
    
    for (const table of possibleTables) {
      try {
        const result = await pool.request().query(`
          SELECT TOP 1 * FROM ${table}
        `);
        console.log(`✅ Found user table: ${table}`);
        return table;
      } catch (e) {
        continue;
      }
    }

    console.warn('⚠️  Could not find user table in Tracklie database');
    return null; // Return null instead of throwing
  }

  /**
   * Get all attendance logs from Tracklie
   */
  async getAttendanceLogs(
    startDate?: Date,
    endDate?: Date,
    limit?: number,
    deviceId?: number
  ): Promise<any[]> {
    // Use API if enabled
    if (this.isApiMode()) {
      try {
        const logs = await esslTrackLiteApiService.getAttendanceLogs({
          startDate,
          endDate,
          limit,
        });
        // If API returns empty array, it means ESSL TrackLite doesn't have REST API
        // Log a helpful message but don't throw error
        if (logs.length === 0) {
          console.warn('⚠️  No data from ESSL TrackLite API. ESSL TrackLite uses SQL Server directly, not REST API.');
        }
        return logs;
      } catch (error: any) {
        console.warn('⚠️  Error fetching logs via API:', error.message);
        return [];
      }
    }

    try {
      const tableName = await this.findAttendanceTable();
      if (!tableName) {
        console.warn('⚠️  No attendance table found. Returning empty array.');
        return [];
      }
      const pool = await this.ensurePool();

      // Determine which monthly table to use based on date
      let logTable = tableName;
      if (startDate) {
        const month = startDate.getMonth() + 1;
        const year = startDate.getFullYear();
        const monthlyTable = `${tableName}_${month}_${year}`;
        // Check if monthly table exists
        try {
          const checkResult = await pool.request().query(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = '${monthlyTable}'
          `);
          if (checkResult.recordset.length > 0) {
            logTable = monthlyTable;
          }
        } catch (e) {
          // Use default table
        }
      }

      // Build simple query - only UserId, UserName, LogDate
      // Format LogDate as string directly in SQL to preserve exact time (no timezone conversion)
      const dateField = 'LogDate';
      let query = `
        SELECT TOP ${limit || 1000}
          dl.UserId,
          dl.LogDate,
          FORMAT(dl.LogDate, 'yyyy-MM-ddTHH:mm:ss.fff') AS LogDateFormatted,
          e.EmployeeName
        FROM ${logTable} dl
        LEFT JOIN Employees e ON dl.UserId = e.EmployeeCodeInDevice
      `;
      
      const conditions: string[] = [];

      if (startDate) {
        conditions.push(`dl.${dateField} >= @startDate`);
      }
      if (endDate) {
        conditions.push(`dl.${dateField} <= @endDate`);
      }
      if (deviceId !== undefined) {
        conditions.push(`dl.DeviceId = @deviceId`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY dl.${dateField} DESC`;

      const request = pool.request();
      if (startDate) {
        // Convert to local date without timezone conversion
        // SQL Server datetime has no timezone, so we use the date as-is
        const localStart = new Date(startDate);
        request.input('startDate', sql.DateTime, localStart);
      }
      if (endDate) {
        // Convert to local date without timezone conversion
        const localEnd = new Date(endDate);
        request.input('endDate', sql.DateTime, localEnd);
      }
      if (deviceId !== undefined) {
        request.input('deviceId', sql.Int, deviceId);
      }

      const result = await request.query(query);
      return result.recordset;
    } catch (error: any) {
      console.error('❌ Error fetching attendance logs:', error.message);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Get attendance log by ID
   */
  async getAttendanceLogById(id: number): Promise<any | null> {
    try {
      const tableName = await this.findAttendanceTable();
      if (!tableName) {
        return null;
      }
      const pool = await this.ensurePool();

      // Try common ID field names - prioritize DeviceLogId for DeviceLogs table
      const idFields = ['DeviceLogId', 'AttendanceLogId', 'ID', 'Id', 'TransactionID', 'LogID', 'AutoID'];

      for (const idField of idFields) {
        try {
          const request = pool.request();
          request.input('id', sql.Int, id);
          const result = await request.query(`
            SELECT TOP 1 * FROM ${tableName} WHERE ${idField} = @id
          `);
          if (result.recordset.length > 0) {
            return result.recordset[0];
          }
        } catch (e) {
          continue;
        }
      }

      return null;
    } catch (error: any) {
      console.error('❌ Error fetching attendance log:', error.message);
      return null;
    }
  }

  /**
   * Get users/employees from Tracklie
   */
  async getUsers(): Promise<any[]> {
    // Use API if enabled
    if (this.isApiMode()) {
      try {
        return await esslTrackLiteApiService.getUsers();
      } catch (error: any) {
        console.error('❌ Error fetching users via API:', error.message);
        return [];
      }
    }

    try {
      const tableName = await this.findUserTable();
      if (!tableName) {
        console.warn('⚠️  No user table found. Returning empty array.');
        return [];
      }
      const pool = await this.ensurePool();
      // Use EmployeeName for Employees table, fallback to Name for other tables
      const nameField = tableName === 'Employees' ? 'EmployeeName' : 'Name';
      const result = await pool.request().query(`
        SELECT * FROM ${tableName} ORDER BY ${nameField}
      `);
      return result.recordset;
    } catch (error: any) {
      console.error('❌ Error fetching users:', error.message);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Get user by PIN/UserID
   */
  async getUserByPin(pin: string): Promise<any | null> {
    // Use API if enabled
    if (this.isApiMode()) {
      try {
        return await esslTrackLiteApiService.getUserByPin(pin);
      } catch (error: any) {
        console.error('❌ Error fetching user via API:', error.message);
        return null;
      }
    }
    
    try {
      const tableName = await this.findUserTable();
      if (!tableName) {
        return null;
      }
      const pool = await this.ensurePool();

      // Try common PIN/UserID field names
      // For Employees table: EmployeeCodeInDevice matches UserId in DeviceLogs
      // For other tables: try common field names
      const pinFields = tableName === 'Employees' 
        ? ['EmployeeCodeInDevice', 'EmployeeCode', 'EmployeeId', 'PIN', 'Pin', 'UserID', 'BadgeNumber']
        : ['PIN', 'Pin', 'UserID', 'UserID', 'BadgeNumber', 'EmployeeID', 'EmployeeCodeInDevice'];

      // Try each field
      for (const field of pinFields) {
        try {
          const request = pool.request();
          request.input('pin', sql.NVarChar, pin);
          const result = await request.query(`
            SELECT TOP 1 * FROM ${tableName} WHERE ${field} = @pin
          `);
          if (result.recordset.length > 0) {
            return result.recordset[0];
          }
        } catch (e) {
          continue;
        }
      }

      return null;
    } catch (error: any) {
      console.error('❌ Error fetching user:', error.message);
      return null;
    }
  }

  /**
   * Get attendance statistics
   */
  async getAttendanceStats(startDate?: Date, endDate?: Date): Promise<any> {
    // Use API if enabled
    if (this.isApiMode()) {
      try {
        return await esslTrackLiteApiService.getAttendanceStats({
          startDate,
          endDate,
        });
      } catch (error: any) {
        console.error('❌ Error fetching stats via API:', error.message);
        // Fallback to calculating from logs
      }
    }
    
    try {
      const logs = await this.getAttendanceLogs(startDate, endDate, 10000);

      const total = logs.length;
      // DeviceLogs uses UserId field (nvarchar(50)) which matches EmployeeCodeInDevice in Employees table
      const uniqueUsers = new Set(
        logs.map((log) => log.UserId || log.PIN || log.UserID || log.BadgeNumber || log.EmployeeID || log.EmployeeCodeInDevice)
      ).size;

      return {
        totalLogs: total,
        uniqueUsers: uniqueUsers,
        dateRange: {
          start: startDate || null,
          end: endDate || null,
        },
      };
    } catch (error: any) {
      console.error('❌ Error getting stats:', error.message);
      return {
        totalLogs: 0,
        uniqueUsers: 0,
        dateRange: {
          start: startDate || null,
          end: endDate || null,
        },
      }; // Return empty stats instead of throwing
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    // Test API connection if enabled
    if (this.isApiMode()) {
      return await esslTrackLiteApiService.testConnection();
    }

    try {
      const pool = await this.ensurePool();
      const result = await pool.request().query('SELECT 1 as test');
      return result.recordset.length > 0;
    } catch (error: any) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
  }
}

const tracklieService = new TracklieService();
export default tracklieService;

