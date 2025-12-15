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
    
    // First, try to get all tables to see what exists (without logging all tables)
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
            console.log(`✅ Found attendance table: ${table}`);
            return table;
          } catch (e) {
            // Table exists but might be empty or have permission issues
            // Only log if in debug mode
            if (process.env.NODE_ENV === 'development') {
              console.log(`⚠️  Table ${table} exists but query failed:`, (e as Error).message);
            }
            continue;
          }
        }
      }
    } catch (e) {
      // Only log errors in development mode
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Could not list tables, trying direct queries:', (e as Error).message);
      }
    }
    
    // Fallback: try direct queries (silently)
    for (const table of possibleTables) {
      try {
        const result = await pool.request().query(`SELECT TOP 1 * FROM ${table}`);
        console.log(`✅ Found attendance table: ${table}`);
        return table;
      } catch (e) {
        // Table doesn't exist, try next (silently)
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
   * Simple: Get logs by date only (YYYY-MM-DD format)
   */
  async getAttendanceLogsByDate(dateStr: string, deviceId: number, limit: number = 500): Promise<any[]> {
    // Use API if enabled
    if (this.isApiMode()) {
      try {
        const date = new Date(dateStr);
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const logs = await esslTrackLiteApiService.getAttendanceLogs({
          startDate: date,
          endDate: tomorrow,
          limit,
        });
        return logs;
      } catch (error: any) {
        console.warn('⚠️  Error fetching logs via API:', error.message);
        return [];
      }
    }

    try {
      const pool = await this.ensurePool();
      
      // Find table - check monthly table for the selected date
      const date = new Date(dateStr);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthlyTable = `DeviceLogs_${month}_${year}`;
      
      console.log(`🔍 Looking for logs on date: ${dateStr} (month: ${month}, year: ${year})`);
      console.log(`🔍 Checking for monthly table: ${monthlyTable}`);
      
      // Check if monthly table exists
      let logTable = 'DeviceLogs';
      try {
        const checkResult = await pool.request().query(`
          SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME = '${monthlyTable}'
        `);
        if (checkResult.recordset.length > 0) {
          logTable = monthlyTable;
          console.log(`✅ Using monthly table: ${logTable}`);
        } else {
          // Try to find any monthly table that might have data
          console.log(`⚠️  Monthly table ${monthlyTable} not found, checking all DeviceLogs tables...`);
          const allTablesResult = await pool.request().query(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME LIKE 'DeviceLogs%'
            ORDER BY TABLE_NAME DESC
          `);
          const availableTables = allTablesResult.recordset.map((r: any) => r.TABLE_NAME);
          console.log(`📋 Available tables: ${availableTables.join(', ')}`);
          
          // Use main table if monthly doesn't exist
          if (availableTables.includes('DeviceLogs')) {
            logTable = 'DeviceLogs';
            console.log(`✅ Using main table: ${logTable}`);
          } else if (availableTables.length > 0) {
            // Use the most recent monthly table as fallback
            logTable = availableTables[0];
            console.log(`⚠️  Using fallback table: ${logTable}`);
          }
        }
      } catch (e) {
        console.log(`⚠️  Error checking monthly table, using default: ${logTable}`);
      }

      // Simple query: Get logs for this exact date, this device
      // Use direct date string comparison to avoid timezone issues
      // Format: YYYY-MM-DD
      const query = `
        SELECT TOP ${limit}
          dl.DeviceLogId,
          dl.UserId,
          dl.DeviceId,
          dl.LogDate,
          FORMAT(dl.LogDate, 'yyyy-MM-dd HH:mm:ss') AS LogDateFormatted,
          e.EmployeeName
        FROM ${logTable} dl
        LEFT JOIN Employees e ON dl.UserId = e.EmployeeCodeInDevice
        WHERE CAST(dl.LogDate AS DATE) = CAST('${dateStr}' AS DATE)
          AND dl.DeviceId = ${deviceId || 20}
        ORDER BY dl.LogDate DESC
      `;

      console.log(`📝 Executing query on table: ${logTable}`);
      console.log(`📝 Date string: ${dateStr}`);
      console.log(`📝 Query: Get logs for exact date ${dateStr} for DeviceId ${deviceId}`);
      
      // Also check what dates exist in the table
      const dateCheckQuery = `
        SELECT DISTINCT CAST(LogDate AS DATE) AS LogDateOnly, COUNT(*) AS Count
        FROM ${logTable}
        WHERE DeviceId = ${deviceId}
        GROUP BY CAST(LogDate AS DATE)
        ORDER BY LogDateOnly DESC
      `;
      try {
        const dateCheck = await pool.request().query(dateCheckQuery);
        console.log(`📅 Available dates in ${logTable} for DeviceId ${deviceId}:`, 
          dateCheck.recordset.map((r: any) => `${r.LogDateOnly.toISOString().split('T')[0]} (${r.Count} logs)`).join(', '));
      } catch (e) {
        console.log(`⚠️  Could not check available dates`);
      }
      
      // Execute query directly with date string (no parameters needed for exact date match)
      const result = await pool.request().query(query);
      
      console.log(`✅ Query returned ${result.recordset.length} rows from ${logTable}`);
      
      // If no results, log diagnostic information
      if (result.recordset.length === 0) {
        console.log(`⚠️  No logs found for date ${dateStr} in table ${logTable} for DeviceId ${deviceId}`);
        try {
          // Check what dates are actually available
          const dateCheckQuery = `
            SELECT DISTINCT 
              CAST(LogDate AS DATE) AS LogDateOnly, 
              COUNT(*) AS Count
            FROM ${logTable}
            WHERE DeviceId = ${deviceId || 20}
            GROUP BY CAST(LogDate AS DATE)
            ORDER BY LogDateOnly DESC
          `;
          const dateCheck = await pool.request().query(dateCheckQuery);
          if (dateCheck.recordset.length > 0) {
            console.log(`📅 Available dates in ${logTable} for DeviceId ${deviceId || 20}:`, 
              dateCheck.recordset.map((r: any) => {
                const dateStr = r.LogDateOnly.toISOString ? r.LogDateOnly.toISOString().split('T')[0] : String(r.LogDateOnly);
                return `${dateStr} (${r.Count} logs)`;
              }).join(', '));
          } else {
            console.log(`⚠️  No dates found in ${logTable} for DeviceId ${deviceId || 20}`);
          }
        } catch (e) {
          console.log(`⚠️  Could not check available dates:`, e);
        }
      }

      // If no results and we used monthly table, also check main DeviceLogs table
      if (result.recordset.length === 0 && logTable !== 'DeviceLogs') {
        console.log(`⚠️  No results in ${logTable}, checking main DeviceLogs table...`);
        const mainQuery = `
          SELECT TOP ${limit}
            dl.DeviceLogId,
            dl.UserId,
            dl.DeviceId,
            dl.LogDate,
            FORMAT(dl.LogDate, 'yyyy-MM-dd HH:mm:ss') AS LogDateFormatted,
            e.EmployeeName
          FROM DeviceLogs dl
          LEFT JOIN Employees e ON dl.UserId = e.EmployeeCodeInDevice
          WHERE CAST(dl.LogDate AS DATE) = CAST('${dateStr}' AS DATE)
            AND dl.DeviceId = ${deviceId || 20}
          ORDER BY dl.LogDate DESC
        `;
        try {
          const mainResult = await pool.request().query(mainQuery);
          console.log(`✅ Main DeviceLogs table returned ${mainResult.recordset.length} rows`);
          if (mainResult.recordset.length > 0) {
            return mainResult.recordset;
          }
        } catch (e) {
          console.log(`⚠️  Error querying main DeviceLogs table:`, e);
        }
      }

      return result.recordset;
    } catch (error: any) {
      console.error('❌ Error fetching logs by date:', error.message);
      console.error('❌ Error stack:', error.stack);
      throw error; // Re-throw so controller can handle it
    }
  }

  /**
   * Get all attendance logs from Tracklie
   */
  async getAttendanceLogs(
    startDate?: Date,
    endDate?: Date,
    limit?: number,
    deviceId?: string | number
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
      console.log(`🔍 getAttendanceLogs called: startDate=${startDate?.toISOString()}, endDate=${endDate?.toISOString()}, limit=${limit}, deviceId=${deviceId}`);
      
      const tableName = await this.findAttendanceTable();
      if (!tableName) {
        console.warn('⚠️  No attendance table found. Returning empty array.');
        return [];
      }
      const pool = await this.ensurePool();

      // Check if monthly table exists for the date range
      let monthlyTable: string | null = null;
      if (startDate) {
        const month = startDate.getMonth() + 1;
        const year = startDate.getFullYear();
        const monthlyTableName = `${tableName}_${month}_${year}`;
        try {
          const checkResult = await pool.request().query(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = '${monthlyTableName}'
          `);
          if (checkResult.recordset.length > 0) {
            monthlyTable = monthlyTableName;
            console.log(`✅ Found monthly table: ${monthlyTable}`);
          }
        } catch (e) {
          console.log(`⚠️  Error checking monthly table`);
        }
      }

      // Build query conditions using CAST AS DATE to avoid timezone issues
      const dateField = 'LogDate';
      const conditions: string[] = [];
      
      // Determine effective end date (use provided endDate or default to same day as startDate)
      const effectiveEndDate = endDate || (startDate ? new Date(startDate) : null);
      if (effectiveEndDate && startDate) {
        effectiveEndDate.setDate(effectiveEndDate.getDate() + 1);
        effectiveEndDate.setHours(0, 0, 0, 0);
      }
      
      // Use CAST AS DATE for exact date matching to avoid timezone issues
      if (startDate) {
        // Use parameterized query with date comparison
        // SQL CAST AS DATE will extract just the date part for comparison
        conditions.push(`CAST(dl.${dateField} AS DATE) >= CAST(@startDate AS DATE)`);
      }
      if (effectiveEndDate) {
        // For end date, we want to include the entire day, so use < next day
        // SQL CAST AS DATE will extract just the date part for comparison
        conditions.push(`CAST(dl.${dateField} AS DATE) < CAST(@endDate AS DATE)`);
      }
      if (deviceId !== undefined && deviceId !== null) {
        conditions.push(`dl.DeviceId = @deviceId`);
      }
      const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

      // Build base query template
      const baseQuery = `
        SELECT TOP ${limit || 1000}
          dl.DeviceLogId,
          dl.UserId,
          dl.DeviceId,
          dl.LogDate,
          FORMAT(dl.LogDate, 'yyyy-MM-ddTHH:mm:ss.fff') AS LogDateFormatted,
          e.EmployeeName
        FROM {TABLE} dl
        LEFT JOIN Employees e ON dl.UserId = e.EmployeeCodeInDevice
        ${whereClause}
        ORDER BY dl.${dateField} DESC
      `;

      // Prepare request parameters
      const prepareRequest = (req: sql.Request) => {
        if (startDate) {
          // Use the date as-is (already set to start of day)
          // SQL CAST AS DATE will extract just the date part for comparison
          req.input('startDate', sql.DateTime, startDate);
        }
        if (effectiveEndDate) {
          // End date is start of next day (exclusive comparison)
          req.input('endDate', sql.DateTime, effectiveEndDate);
        }
        if (deviceId !== undefined && deviceId !== null) {
          const deviceIdNum = typeof deviceId === 'string' ? parseInt(deviceId, 10) : Number(deviceId);
          if (!isNaN(deviceIdNum)) {
            req.input('deviceId', sql.Int, deviceIdNum);
          }
        }
      };

      // Try monthly table first if it exists
      if (monthlyTable) {
        try {
          const monthlyQuery = baseQuery.replace('{TABLE}', monthlyTable);
          const monthlyRequest = pool.request();
          prepareRequest(monthlyRequest);
          const monthlyResult = await monthlyRequest.query(monthlyQuery);
          console.log(`✅ Monthly table ${monthlyTable} returned ${monthlyResult.recordset.length} rows`);
          if (monthlyResult.recordset.length > 0) {
            return monthlyResult.recordset;
          }
        } catch (e) {
          console.log(`⚠️  Error querying monthly table ${monthlyTable}:`, e);
        }
      }

      // Query main table
      const mainQuery = baseQuery.replace('{TABLE}', tableName);
      const mainRequest = pool.request();
      prepareRequest(mainRequest);
      const mainResult = await mainRequest.query(mainQuery);
      console.log(`✅ Main table ${tableName} returned ${mainResult.recordset.length} rows`);

      // If main table has results, return them
      if (mainResult.recordset.length > 0) {
        return mainResult.recordset;
      }

      // If main table has no results but monthly table exists, try monthly table again (in case of date range issues)
      if (mainResult.recordset.length === 0 && monthlyTable) {
        try {
          const monthlyQuery = baseQuery.replace('{TABLE}', monthlyTable);
          const monthlyRequest = pool.request();
          prepareRequest(monthlyRequest);
          const monthlyResult = await monthlyRequest.query(monthlyQuery);
          console.log(`✅ Re-checking monthly table ${monthlyTable} returned ${monthlyResult.recordset.length} rows`);
          return monthlyResult.recordset;
        } catch (e) {
          console.log(`⚠️  Error re-checking monthly table:`, e);
        }
      }

      return mainResult.recordset;
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

