import { Request, Response } from 'express';
import tracklieService from '../services/tracklieService.js';

/**
 * Get access logs from Tracklie SQL Server
 */
export const getAccessLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, startDate, endDate, limit = 100, pin } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    const limitNum = limit ? parseInt(limit as string) : parseInt('100');

    // Get logs from Tracklie
    let logs = await tracklieService.getAttendanceLogs(start, end, limitNum);

    // Filter by PIN if provided
    if (pin) {
      logs = logs.filter(
        (log) =>
          (log.PIN || log.UserID || log.BadgeNumber || log.EmployeeID || '').toString() ===
          pin.toString()
      );
    }

    // Map Tracklie format to your API format
    const mappedLogs = logs.map((log) => {
      const userId = log.PIN || log.UserID || log.BadgeNumber || log.EmployeeID || log.UserPin;
      const dateField = log.DateTime || log.Time || log.CheckTime || log.PunchTime || log.Timestamp;
      const timestamp = dateField ? new Date(dateField) : new Date();
      const verify = log.Verify || log.VerifyMode || 1;
      const status = log.Status || log.InOut || 0;

      return {
        id: log.ID || log.Id || log.TransactionID || log.LogID,
        esslUserId: userId?.toString(),
        timestamp: timestamp.toISOString(),
        accessGranted: true, // Tracklie logs are successful accesses
        reason: `Check-${status === 0 ? 'In' : 'Out'} via ${verify === 1 ? 'Fingerprint' : 'Other'}`,
        biometricType: verify === 1 ? 'fingerprint' : 'fingerprint',
        deviceIp: log.DeviceIP || log.IPAddress || null,
        status: status,
        verify: verify,
        rawData: log, // Include raw data for reference
      };
    });

    res.json({
      success: true,
      count: mappedLogs.length,
      data: mappedLogs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
