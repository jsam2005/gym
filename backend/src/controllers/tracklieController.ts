import { Request, Response } from 'express';
import { getPool } from '../config/database.js';
import sql from 'mssql';

/**
 * Discover Tracklie database structure
 */
export const discoverDatabase = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = getPool();

    // Get all tables
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    const tables = tablesResult.recordset.map((row) => row.TABLE_NAME);

    // Try to find attendance and user tables
    const attendanceTables = [
      'TransactionLog',
      'AttLog',
      'CheckInOut',
      'TRANSLOG',
      'AttTransaction',
      'iclock_transaction',
      'AttLogs',
    ];

    const userTables = ['UserInfo', 'Employee', 'USERINFO', 'Users', 'User'];

    const foundAttendanceTable = attendanceTables.find((table) => tables.includes(table));
    const foundUserTable = userTables.find((table) => tables.includes(table));

    // Get sample data from found tables
    let attendanceSample: any = null;
    let userSample: any = null;
    let attendanceColumns: string[] = [];
    let userColumns: string[] = [];

    if (foundAttendanceTable) {
      try {
        const result = await pool.request().query(`SELECT TOP 1 * FROM ${foundAttendanceTable}`);
        if (result.recordset.length > 0) {
          attendanceSample = result.recordset[0];
          attendanceColumns = Object.keys(attendanceSample);
        }
      } catch (e) {
        // Ignore
      }
    }

    if (foundUserTable) {
      try {
        const result = await pool.request().query(`SELECT TOP 1 * FROM ${foundUserTable}`);
        if (result.recordset.length > 0) {
          userSample = result.recordset[0];
          userColumns = Object.keys(userSample);
        }
      } catch (e) {
        // Ignore
      }
    }

    res.json({
      success: true,
      data: {
        allTables: tables,
        attendanceTable: foundAttendanceTable || null,
        userTable: foundUserTable || null,
        attendanceColumns,
        userColumns,
        attendanceSample,
        userSample,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Test SQL Server connection
 */
export const testConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT @@VERSION as version, DB_NAME() as databaseName');
    
    res.json({
      success: true,
      message: 'Connected to SQL Server',
      data: {
        version: result.recordset[0]?.version,
        database: result.recordset[0]?.databaseName,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


