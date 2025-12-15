import { Request, Response } from 'express';
import {
  createClient as createClientRecord,
  getClientByEsslId,
  getClientById,
  getClientStats as fetchClientStats,
  incrementAccessAttempt,
  updateClient as updateClientRecord,
  updateClientByEsslId,
} from '../data/clientRepository.js';
import esslDeviceService from '../services/esslDeviceService.js';
import { Server as SocketServer } from 'socket.io';
import tracklieService from '../services/tracklieService.js';
import { ClientEntity } from '../types/domain.js';

let io: SocketServer;

export const setSocketIO = (socketIO: SocketServer) => {
  io = socketIO;
};

const isValidGuid = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
};

const mapTracklieLog = (log: any) => {
  // Simple mapping - only UserId, UserName, Check-in Time
  const userId = log.UserId || log.PIN || log.UserID || log.BadgeNumber || log.EmployeeID || log.UserPin;
  
  // Use LogDateFormatted if available (formatted in SQL as string), otherwise use LogDate
  // SQL Server datetime has no timezone - format it as-is without conversion
  let timestampStr: string;
  if (log.LogDateFormatted) {
    // SQL formatted string (yyyy-MM-ddTHH:mm:ss.fff) - use as-is, no timezone conversion
    // Remove any trailing Z if present
    timestampStr = log.LogDateFormatted.replace(/Z$/, '');
  } else {
    const dateField = log.LogDate || log.DateTime || log.Time || log.CheckTime || log.PunchTime || log.Timestamp;
    if (dateField instanceof Date) {
      // Format Date object directly - use local time components (not UTC)
      // SQL Server datetime is stored in server's local timezone
      const year = dateField.getFullYear();
      const month = String(dateField.getMonth() + 1).padStart(2, '0');
      const day = String(dateField.getDate()).padStart(2, '0');
      const hours = String(dateField.getHours()).padStart(2, '0');
      const minutes = String(dateField.getMinutes()).padStart(2, '0');
      const seconds = String(dateField.getSeconds()).padStart(2, '0');
      const ms = String(dateField.getMilliseconds()).padStart(3, '0');
      timestampStr = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
    } else if (dateField) {
      // Parse and format - treat as local time (SQL Server has no timezone)
      const date = new Date(dateField);
      // Use local time components, not UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const ms = String(date.getMilliseconds()).padStart(3, '0');
      timestampStr = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      timestampStr = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
    }
  }

  // Ensure unique ID - DeviceLogId is the primary key from SQL Server
  const uniqueId = log.DeviceLogId 
    ? `devicelog-${log.DeviceLogId}` 
    : log.ID 
      ? `id-${log.ID}` 
      : log.Id 
        ? `id-${log.Id}` 
        : log.TransactionID 
          ? `txn-${log.TransactionID}` 
          : log.LogID 
            ? `log-${log.LogID}` 
            : `${userId || 'unknown'}-${timestampStr}-${Date.now()}`;

  return {
    id: uniqueId,
    userId: userId?.toString(),
    esslUserId: userId?.toString(),
    employeeName: log.EmployeeName || null,
    timestamp: timestampStr,
    accessGranted: true,
  };
};

const buildDefaultSchedule = () => [
  { day: 'monday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'tuesday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'wednesday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'thursday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'friday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'saturday', startTime: '08:00', endTime: '20:00', enabled: true },
  { day: 'sunday', startTime: '08:00', endTime: '20:00', enabled: true },
];

const convertESSLScheduleToWebsite = (deviceSchedule: any[] = []) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  if (deviceSchedule && deviceSchedule.length > 0) {
    return deviceSchedule.map((schedule) => ({
      day: days[schedule.weekday] || 'monday',
      startTime: schedule.startTime || '06:00',
      endTime: schedule.endTime || '22:00',
      enabled: schedule.enabled !== false,
    }));
  }

  return buildDefaultSchedule();
};

/**
 * Test ESSL device connection
 */
export const testDeviceConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const isConnected = await esslDeviceService.testConnection();
    
    res.json({
      success: isConnected,
      message: isConnected ? 'Device connected successfully' : 'Device connection failed',
      timestamp: new Date()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Register client on ESSL device
 */
export const registerClientOnDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.body;
    
    if (!isValidGuid(clientId)) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid client ID format. Must be a valid GUID.',
      });
      return;
    }
    
    const client = await getClientById(clientId);
    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }

    // Generate unique ESSL user ID if not exists
    const esslUserId = client.esslUserId || `GYM${Date.now().toString().slice(-8)}`;

    // Register on device using direct TCP connection
    try {
      console.log(`📝 [TCP] Registering user ${esslUserId} (${client.firstName} ${client.lastName}) via direct TCP connection`);
      
      // Send actual TCP command to ESSL device to register user
      const { Socket } = await import('net');
      const socket = new Socket();
      
      const registrationCommand = new Promise((resolve, reject) => {
        socket.connect(4371, process.env.ESSL_DEVICE_IP || '192.168.0.5', () => {
          console.log(`📝 [TCP] Connected to ESSL device for registration`);
          
          // Send ESSL registration command to device
          // ESSL Protocol: CMD_ADD_USER (0x01) + user_id + user_name
          const userIdBytes = Buffer.from(esslUserId, 'ascii');
          const userNameBytes = Buffer.from(`${client.firstName} ${client.lastName}`, 'ascii');
          const command = Buffer.concat([
            Buffer.from([0x50, 0x50, 0x82, 0x7D]),  // ESSL Header
            Buffer.from([0x00, 0x00, 0x00, 0x01]),  // CMD_ADD_USER
            userIdBytes,  // User ID
            userNameBytes,  // User Name
            Buffer.from([0x00, 0x00])    // Footer
          ]);
          
          socket.write(command);
          console.log(`📝 [TCP] Sent registration command for user ${esslUserId}`);
          
          // Wait for device response
          socket.on('data', (data) => {
            console.log(`📝 [TCP] Device response:`, data.toString('hex'));
            socket.destroy();
            resolve(true);
          });
          
          socket.on('error', (error) => {
            console.error(`📝 [TCP] Registration command failed:`, error.message);
            socket.destroy();
            reject(error);
          });
          
          // Timeout after 10 seconds
          setTimeout(() => {
            socket.destroy();
            reject(new Error('Registration command timeout'));
          }, 10000);
        });
        
        socket.on('error', (error) => {
          console.error(`📝 [TCP] Connection failed:`, error.message);
          reject(error);
        });
      });
      
      try {
        await registrationCommand;
        console.log(`📝 [TCP] Registration command sent successfully.`);
      } catch (tcpError: any) {
        console.log(`📝 [TCP] Registration command failed (device may be offline): ${tcpError.message}`);
        // Continue with registration even if TCP command fails
      }
      
      // Update client record
      const updatedClient = await updateClientRecord(clientId, {
        esslUserId,
        isAccessActive: true,
      });
      
      res.json({
        success: true,
        message: 'Client registered successfully (device communication attempted)',
        esslUserId: esslUserId,
        client: updatedClient,
      });
    } catch (error: any) {
      console.error(`📝 [TCP] Registration failed:`, error.message);
      res.status(500).json({
        success: false,
        message: `Registration failed: ${error.message}`
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Enroll fingerprint for client
 */
export const enrollFingerprint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, fingerIndex = 0 } = req.body;
    
    if (!isValidGuid(clientId)) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid client ID format. Must be a valid GUID.',
      });
      return;
    }
    
    const client = await getClientById(clientId);
    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }

    if (!client.esslUserId) {
      res.status(400).json({ 
        success: false, 
        message: 'Client not registered on device. Please register first.' 
      });
      return;
    }

    // Enroll fingerprint using ESSL TCP protocol
    try {
      console.log(`🔐 [ESSL] Starting fingerprint enrollment for user ${client.esslUserId} (${client.firstName} ${client.lastName})`);
      
      const deviceIp = process.env.ESSL_DEVICE_IP || '192.168.0.5';
      const { Socket } = await import('net');
      
      // ESSL TCP enrollment command
      const enrollmentCommand = new Promise((resolve, reject) => {
        const socket = new Socket();
        
        socket.connect(4371, deviceIp, () => {
          console.log(`🔐 [ESSL] Connected to ESSL device at ${deviceIp}:4371`);
          
          // ESSL enrollment command format
          const userId = client.esslUserId as string;
          const fingerId = fingerIndex;
          
          // ESSL protocol: CMD_ENROLL_USER (0x50) + user_id + finger_index
          const command = Buffer.concat([
            Buffer.from([0x50, 0x50, 0x82, 0x7D]),  // ESSL Header
            Buffer.from([0x00, 0x00, 0x00, 0x50]),  // CMD_ENROLL_USER
            Buffer.from(userId, 'ascii'),           // User ID
            Buffer.from([fingerId]),                // Finger index
            Buffer.from([0x00, 0x00])               // Footer
          ]);
          
          socket.write(command);
          console.log(`🔐 [ESSL] Sent enrollment command for user ${userId}, finger ${fingerId}`);
          
          // Wait for device response
          socket.on('data', (data) => {
            console.log(`🔐 [ESSL] Device response:`, data.toString('hex'));
            socket.destroy();
            resolve(true);
          });
          
          socket.on('error', (error) => {
            console.error(`🔐 [ESSL] Socket error:`, error.message);
            socket.destroy();
            reject(error);
          });
          
          // Timeout after 10 seconds
          setTimeout(() => {
            socket.destroy();
            reject(new Error('Enrollment command timeout'));
          }, 10000);
        });
        
        socket.on('error', (error) => {
          console.error(`🔐 [ESSL] Connection failed:`, error.message);
          reject(error);
        });
      });
      
      try {
        await enrollmentCommand;
        console.log(`🔐 [ESSL] Enrollment command sent successfully. Device should now show scanning page.`);
        
        res.json({
          success: true,
          message: 'Fingerprint enrollment initiated. Your ESSL device should now display the scanning page.',
          requiresDeviceScan: true
        });
      } catch (tcpError: any) {
        console.log(`🔐 [ESSL] TCP enrollment failed: ${tcpError.message}`);
        
        res.json({
          success: true,
          message: 'Fingerprint enrollment initiated. Please manually enroll on your ESSL device using user ID: ' + client.esslUserId,
          requiresDeviceScan: true,
          manualEnrollment: true,
          userId: client.esslUserId
        });
      }
    } catch (error: any) {
      console.error(`🔐 [TCP] Enrollment failed:`, error.message);
      res.status(500).json({
        success: false,
        message: `Enrollment failed: ${error.message}`
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update client access schedule
 */
export const updateAccessSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, accessSchedule } = req.body;
    
    if (!isValidGuid(clientId)) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid client ID format. Must be a valid GUID.',
      });
      return;
    }
    
    const client = await getClientById(clientId);
    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }

    // Validate schedule format
    if (!Array.isArray(accessSchedule) || accessSchedule.length === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid access schedule format' 
      });
      return;
    }

    await updateClientRecord(clientId, { accessSchedule });

    // Update device if client is registered
    if (client.esslUserId) {
      await esslDeviceService.setUserAccessSchedule(client.esslUserId, accessSchedule);
    }

    res.json({
      success: true,
      message: 'Access schedule updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Webhook endpoint for device access attempts
 * ESSL device calls this when someone scans fingerprint
 */
export const handleAccessAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, timestamp, biometricType = 'fingerprint' } = req.body;
    
    console.log(`🔐 Access attempt by user ${userId} at ${timestamp}`);

    // Validate access
    const validation = await esslDeviceService.validateAccess(
      userId,
      timestamp ? new Date(timestamp) : new Date()
    );

    const client = userId ? await getClientByEsslId(userId) : null;
    if (client) {
      await incrementAccessAttempt(client.id, new Date().toISOString());
    }

    // Open door if allowed
    if (validation.openDoor) {
      await esslDeviceService.openDoor(3); // Open for 3 seconds
    }

    // Emit real-time update to frontend
    if (io) {
      io.emit('access_attempt', {
        userId,
        clientName: client ? `${client.firstName} ${client.lastName}` : 'Unknown',
        allowed: validation.allowed,
        reason: validation.reason,
        timestamp: new Date(),
        biometricType
      });
    }

    // Respond to device
    res.json({
      allowed: validation.allowed,
      reason: validation.reason,
      openDoor: validation.openDoor,
      doorOpenDuration: validation.openDoor ? 3 : 0
    });
  } catch (error: any) {
    console.error('❌ Error handling access attempt:', error.message);
    res.status(500).json({
      allowed: false,
      reason: 'System error',
      openDoor: false
    });
  }
};

/**
 * Get access logs for a client
 */
export const getClientAccessLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;
    
    if (!isValidGuid(clientId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid client ID format. Must be a valid GUID.',
      });
      return;
    }

    const client = await getClientById(clientId);
    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }

    if (!client.esslUserId) {
      res.status(400).json({
        success: false,
        message: 'Client does not have an associated ESSL user ID.',
      });
      return;
    }

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    const limitNum = Math.max(1, Number(limit) || 100);

    const logs = await tracklieService.getAttendanceLogs(start, end, limitNum * 2);
    const filtered = logs
      .filter((log) => {
        const userId = log.PIN || log.UserID || log.BadgeNumber || log.EmployeeID || log.UserPin;
        return userId?.toString() === client.esslUserId;
      })
      .slice(0, limitNum)
      .map(mapTracklieLog);

    res.json({
      success: true,
      count: filtered.length,
      logs: filtered,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all access logs (for admin dashboard)
 */
export const getAllAccessLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, limit = 500, deviceId } = req.query;
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    const limitNum = Math.max(1, Number(limit) || 500);
    const deviceIdNum = deviceId ? Number(deviceId) : 20; // Default to FACE device (20)

    const logs = await tracklieService.getAttendanceLogs(start, end, limitNum, deviceIdNum);
    const mappedLogs = logs.map(mapTracklieLog);

    // Calculate today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayLogs = await tracklieService.getAttendanceLogs(today, tomorrow, 10000, deviceIdNum);
    const todayMapped = todayLogs.map(mapTracklieLog);
    const todayCount = todayMapped.length;
    const uniqueUsersToday = new Set(todayMapped.map(log => log.userId || log.esslUserId)).size;

    res.json({
      success: true,
      statistics: {
        todayCount: todayCount,
        uniqueUsersToday: uniqueUsersToday,
      },
      logs: mappedLogs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Toggle client access (enable/disable)
 */
export const toggleClientAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;
    const { enabled } = req.body;
    
    if (!isValidGuid(clientId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid client ID format. Must be a valid GUID.',
      });
      return;
    }

    const client = await getClientById(clientId);
    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }

    await updateClientRecord(clientId, { isAccessActive: enabled });

    // Update device
    if (client.esslUserId) {
      await esslDeviceService.updateUserStatus(client.esslUserId, enabled);
    }

    res.json({
      success: true,
      message: `Access ${enabled ? 'enabled' : 'disabled'} for ${client.firstName} ${client.lastName}`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete client from device
 */
export const deleteClientFromDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;
    
    if (!isValidGuid(clientId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid client ID format. Must be a valid GUID.',
      });
      return;
    }

    const client = await getClientById(clientId);
    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }

    if (client.esslUserId) {
      const deleted = await esslDeviceService.deleteUser(client.esslUserId);
      
      if (deleted) {
        await updateClientRecord(clientId, {
          isAccessActive: false,
          fingerprintEnrolled: false,
        });
        
        res.json({
          success: true,
          message: 'Client deleted from device successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete client from device'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Client not registered on device'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Migrate users from ESSL device to database
 */
export const migrateUsersFromDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔄 Starting user migration from ESSL device...');
    
    // Get all users from device
    const deviceUsers = await esslDeviceService.getAllUsers();
    
    if (deviceUsers.length === 0) {
      res.json({
        success: true,
        message: 'No users found on device',
        migrated: 0,
        users: []
      });
      return;
    }
    
    let migrated = 0;
    const results = [];
    
    for (const deviceUser of deviceUsers) {
      try {
        const existingClient = deviceUser.userId ? await getClientByEsslId(deviceUser.userId) : null;
        
        if (existingClient) {
          console.log(`⚠️ User ${deviceUser.userId} already exists in database`);
          results.push({
            userId: deviceUser.userId,
            name: deviceUser.name,
            status: 'already_exists',
            message: 'User already in database'
          });
          continue;
        }
        
        const deviceSchedule = await esslDeviceService.getUserSchedule(deviceUser.userId);
        const accessSchedule = convertESSLScheduleToWebsite(deviceSchedule);
        const [firstName, ...lastNameParts] = (deviceUser.name || 'Unknown User').split(' ');
        await createClientRecord({
          firstName: firstName || 'Unknown',
          lastName: lastNameParts.join(' ') || 'User',
          esslUserId: deviceUser.userId,
          email: `${deviceUser.userId}@migrated.local`,
          phone: '0000000000',
          dateOfBirth: new Date('2000-01-01').toISOString(),
          gender: 'other',
          address: 'To be updated',
          emergencyContact: {
            name: 'To be updated',
            phone: '0000000000',
            relation: 'Other',
          },
          packageStartDate: new Date().toISOString(),
          packageEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          packageType: 'migrated',
          packageAmount: 0,
          amountPaid: 0,
          pendingAmount: 0,
          paymentStatus: 'pending',
          isAccessActive: deviceUser.enabled !== false,
          status: 'active',
          accessSchedule,
          fingerprintEnrolled: true,
        });
        migrated++;
        
        console.log(`✅ Migrated user: ${deviceUser.name} (${deviceUser.userId})`);
        
        results.push({
          userId: deviceUser.userId,
          name: deviceUser.name,
          status: 'migrated',
          message: 'Successfully migrated to database'
        });
        
      } catch (userError: any) {
        console.error(`❌ Error migrating user ${deviceUser.userId}:`, userError.message);
        results.push({
          userId: deviceUser.userId,
          name: deviceUser.name,
          status: 'error',
          message: userError.message
        });
      }
    }
    
    console.log(`✅ Migration completed: ${migrated} users migrated`);
    
    res.json({
      success: true,
      message: `Migration completed: ${migrated} users migrated`,
      migrated,
      total: deviceUsers.length,
      users: results
    });
    
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get real-time access dashboard data
 */
export const getAccessDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Return empty dashboard if SQL is disabled
    if (process.env.SQL_DISABLED === 'true' || process.env.USE_API_ONLY === 'true') {
      const clientStats = await fetchClientStats();
      res.json({
        success: true,
        dashboard: {
          todayStats: {
            totalAttempts: 0,
            granted: 0,
            denied: 0,
            successRate: 0,
          },
          clientStats: {
            activeClients: clientStats.activeClients,
            enrolledClients: clientStats.enrolledClients,
            enrollmentRate: clientStats.enrollmentRate,
          },
          recentAttempts: [],
          lastHourAttempts: 0,
        },
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLogs = await tracklieService.getAttendanceLogs(today, tomorrow, 200, 20);
    const mappedToday = todayLogs.map(mapTracklieLog);
    const recentAttempts = mappedToday.slice(0, 10);

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const lastHourLogs = await tracklieService.getAttendanceLogs(hourAgo, undefined, 200, 20);

    const clientStats = await fetchClientStats();

    res.json({
      success: true,
      dashboard: {
        todayStats: {
          totalAttempts: mappedToday.length,
          granted: mappedToday.length,
          denied: 0,
          successRate: mappedToday.length > 0 ? 100 : 0,
        },
        clientStats: {
          activeClients: clientStats.activeClients,
          enrolledClients: clientStats.enrolledClients,
          enrollmentRate: clientStats.enrollmentRate,
        },
        recentAttempts,
        lastHourAttempts: lastHourLogs.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Dashboard error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
