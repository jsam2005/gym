import { Request, Response } from 'express';
import esslTrackLiteApiService from '../services/esslTrackLiteApiService.js';

/**
 * ESSL TrackLite API Controller
 * Handles all API requests to ESSL TrackLite server
 */

/**
 * Test connection to ESSL TrackLite API
 */
export const testConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const isConnected = await esslTrackLiteApiService.testConnection();
    const status = esslTrackLiteApiService.getConnectionStatus();
    
    res.json({
      success: isConnected,
      message: isConnected 
        ? 'Successfully connected to ESSL TrackLite API' 
        : 'Failed to connect to ESSL TrackLite API',
      connection: status,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get connection status
 */
export const getStatus = (req: Request, res: Response): void => {
  try {
    const status = esslTrackLiteApiService.getConnectionStatus();
    res.json({
      success: true,
      connection: status,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all users from ESSL TrackLite
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await esslTrackLiteApiService.getUsers();
    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user by PIN/UserID
 */
export const getUserByPin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pin } = req.params;
    const user = await esslTrackLiteApiService.getUserByPin(pin);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get attendance logs from ESSL TrackLite
 */
export const getAttendanceLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, limit, userId } = req.query;
    
    const params: any = {};
    if (startDate) {
      params.startDate = new Date(startDate as string);
    }
    if (endDate) {
      params.endDate = new Date(endDate as string);
    }
    if (limit) {
      params.limit = parseInt(limit as string, 10);
    }
    if (userId) {
      params.userId = userId as string;
    }
    
    const logs = await esslTrackLiteApiService.getAttendanceLogs(params);
    
    res.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get attendance statistics
 */
export const getAttendanceStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    const params: any = {};
    if (startDate) {
      params.startDate = new Date(startDate as string);
    }
    if (endDate) {
      params.endDate = new Date(endDate as string);
    }
    
    const stats = await esslTrackLiteApiService.getAttendanceStats(params);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create or update user in ESSL TrackLite
 */
export const upsertUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData = req.body;
    const result = await esslTrackLiteApiService.upsertUser(userData);
    
    res.json({
      success: true,
      message: 'User created/updated successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete user from ESSL TrackLite
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const deleted = await esslTrackLiteApiService.deleteUser(userId);
    
    res.json({
      success: deleted,
      message: deleted ? 'User deleted successfully' : 'User not found',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

