import { Request, Response } from 'express';
import tracklieService from '../services/tracklieService.js';

/**
 * Get access logs from Tracklie SQL Server
 */
export const getAccessLogs = async (req: Request, res: Response): Promise<void> => {
      try {
        const { date, startDate, endDate, limit = 500, deviceId = '20' } = req.query;

        console.log('📥 Backend: getAccessLogs called with params:', { date, startDate, endDate, limit, deviceId });

        // Parse dates - prefer 'date' parameter (YYYY-MM-DD format) to avoid timezone issues
        let start: Date | undefined;
        let end: Date | undefined;

        if (date) {
          // Parse YYYY-MM-DD string
          // Use the date string directly for SQL comparison to avoid timezone issues
          const dateStr = date as string;
          const [year, month, day] = dateStr.split('-').map(Number);
          
          // Create dates in local timezone for the exact date
          // Start: Beginning of selected date (00:00:00)
          start = new Date(year, month - 1, day, 0, 0, 0, 0);
          
          // End: Beginning of next day (00:00:00) - exclusive comparison
          end = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
          
          console.log('📅 Parsed date parameter:', { 
            dateStr, 
            start: start.toISOString(), 
            end: end.toISOString(),
            startLocal: `${year}-${month}-${day} 00:00:00`,
            endLocal: `${year}-${month}-${day + 1} 00:00:00`
          });
        } else if (startDate) {
          start = new Date(startDate as string);
          console.log('📅 Parsed startDate:', start.toISOString());
        } else {
          // Default to today in IST
          const now = new Date();
          // Get IST date (UTC+5:30)
          const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
          const istNow = new Date(now.getTime() + istOffset);
          start = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
          start.setUTCHours(start.getUTCHours() - 5);
          start.setUTCMinutes(start.getUTCMinutes() - 30);
          console.log('📅 Using default startDate (today IST):', start.toISOString());
        }

        if (!end) {
          if (endDate) {
            end = new Date(endDate as string);
            // Set to end of day
            end.setHours(23, 59, 59, 999);
            console.log('📅 Parsed endDate:', end.toISOString());
          } else if (!date) {
            // Default to end of today in IST
            const now = new Date();
            const istOffset = 5.5 * 60 * 60 * 1000;
            const istNow = new Date(now.getTime() + istOffset);
            end = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + 1, 0, 0, 0, 0));
            end.setUTCHours(end.getUTCHours() - 5);
            end.setUTCMinutes(end.getUTCMinutes() - 30);
            console.log('📅 Using default endDate (end of today IST):', end.toISOString());
          }
        }

    const limitNum = parseInt(limit as string, 10);
    const deviceIdNum = deviceId ? parseInt(deviceId as string, 10) : undefined;

    console.log('🔍 Calling tracklieService.getAttendanceLogs with:', { start, end, limitNum, deviceIdNum });

    // If date parameter is provided, use it directly for exact date matching
    let logs;
    if (date) {
      const dateStr = date as string;
      // getAttendanceLogsByDate expects: (dateStr, deviceId, limit)
      const deviceIdForQuery = deviceIdNum || 20; // Default to 20 if not provided
      logs = await tracklieService.getAttendanceLogsByDate(dateStr, deviceIdForQuery, limitNum);
    } else {
      // Get logs from Tracklie using the working method
      logs = await tracklieService.getAttendanceLogs(start, end, limitNum, deviceIdNum);
    }

    console.log('📊 tracklieService returned', logs.length, 'logs');

    // Map to match frontend table format
    const mappedLogs = logs.map((log) => {
      // Use formatted date from SQL if available, otherwise format it
      let logTimeStr: string;
      if (log.LogDateFormatted) {
        // Use the formatted date string directly from SQL (no timezone conversion)
        logTimeStr = log.LogDateFormatted;
      } else {
        // Fallback: format the date without timezone conversion
        const logDate = new Date(log.LogDate);
        // Get local date components to avoid timezone conversion
        const year = logDate.getFullYear();
        const month = String(logDate.getMonth() + 1).padStart(2, '0');
        const day = String(logDate.getDate()).padStart(2, '0');
        const hours = String(logDate.getHours()).padStart(2, '0');
        const minutes = String(logDate.getMinutes()).padStart(2, '0');
        const seconds = String(logDate.getSeconds()).padStart(2, '0');
        logTimeStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      
      return {
        id: log.DeviceLogId,
        user_name: log.EmployeeName || 'Unknown',
        user_id: log.UserId,
        log_time: logTimeStr, // Use formatted string directly (YYYY-MM-DD HH:mm:ss)
        status: 'Granted',
        device_id: log.DeviceId,
      };
    });

    console.log('✅ Sending response with', mappedLogs.length, 'mapped logs');

    res.json({
      success: true,
      count: mappedLogs.length,
      data: mappedLogs,
    });
  } catch (error: any) {
    console.error('❌ Error in getAccessLogs:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Create access log - This will insert into Tracklie database
 * Note: Tracklie typically manages its own logs, but we can add if needed
 */
export const createAccessLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { esslUserId, accessGranted, reason, deviceId, biometricType } = req.body;

    // Tracklie manages its own logs, so we just return success
    // If you need to insert, you would need to know the exact table structure
    res.status(201).json({
      success: true,
      message: 'Access log should be created by Tracklie device',
      note: 'Tracklie manages attendance logs automatically from device',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get access statistics from Tracklie
 */
export const getAccessStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const stats = await tracklieService.getAttendanceStats(start, end);

    res.json({
      success: true,
      data: {
        totalAttempts: stats.totalLogs,
        grantedCount: stats.totalLogs, // Tracklie logs are all successful
        deniedCount: 0, // Tracklie doesn't track denied attempts
        successRate: 100,
        uniqueUsers: stats.uniqueUsers,
        dateRange: stats.dateRange,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get users from Tracklie
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await tracklieService.getUsers();
    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get user by PIN
 */
export const getUserByPin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pin } = req.params;
    const user = await tracklieService.getUserByPin(pin);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Test Tracklie connection
 */
export const testConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const connected = await tracklieService.testConnection();
    res.json({
      success: connected,
      message: connected ? 'Connected to Tracklie SQL Server' : 'Failed to connect',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Legacy endpoints - kept for compatibility but may not work the same way
export const cleanupOldLogs = async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: 'Tracklie manages its own log retention. Use Tracklie settings to configure cleanup.',
  });
};

export const resetAccessLogs = async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: 'Cannot reset Tracklie logs via API. Use Tracklie interface to manage logs.',
  });
};

export const deleteAllAccessLogs = async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: 'Cannot delete Tracklie logs via API. Use Tracklie interface to manage logs.',
  });
};

export const manualCheckIn = async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: 'Check-ins are managed by Tracklie device. Use the device to check in.',
  });
};

export const manualSync = async (req: Request, res: Response): Promise<void> => {
  try {
    // Force refresh from Tracklie
    const logs = await tracklieService.getAttendanceLogs(undefined, undefined, 10);
    res.json({
      success: true,
      message: 'Synced from Tracklie',
      count: logs.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const testESSLDeviceCommunication = async (req: Request, res: Response): Promise<void> => {
  try {
    const connected = await tracklieService.testConnection();
    res.json({
      success: connected,
      message: connected
        ? 'Connected to Tracklie SQL Server - Device logs are being recorded'
        : 'Failed to connect to Tracklie SQL Server',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
