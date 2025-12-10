import { Request, Response } from 'express';
import { io } from '../server.js';
import {
  getClientByEsslId,
  incrementAccessAttempt,
  updateClientByEsslId,
} from '../data/clientRepository.js';
import esslDeviceService from '../services/esslDeviceService.js';

/**
 * Direct ESSL Communication Controller
 * Handles direct communication with ESSL device via Ethernet
 * Bypasses trial software limitations
 */

/**
 * Get device connection status
 */
export const getDeviceStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = esslDeviceService.getConnectionStatus();
    const isConnected = await esslDeviceService.testConnection();
    
    res.json({
      success: true,
      connected: isConnected,
      device: {
        ip: status.deviceIp,
        port: status.port,
        baseUrl: status.baseUrl,
      },
      lastChecked: new Date().toISOString(),
      message: isConnected 
        ? 'Device is connected and reachable' 
        : 'Device is not connected or unreachable',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      connected: false,
      message: error.message,
    });
  }
};

/**
 * Webhook endpoint for ESSL device to send data
 * ESSL device will POST data to this endpoint
 */
export const handleESSLWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔐 ESSL Webhook received:', req.body);
    
    const { 
      userId, 
      timestamp, 
      eventType, 
      biometricType = 'fingerprint',
      deviceId,
      data,
      // ESSL specific fields
      user_id,
      time,
      type,
      result
    } = req.body;
    
    // Handle ESSL device data (flexible format)
    const actualUserId = userId || user_id;
    const actualTimestamp = timestamp || time;
    const actualEventType = eventType || type;
    const actualBiometricType = biometricType || 'fingerprint';
    
    console.log(`🔐 Processing: ${actualEventType} from user ${actualUserId}`);
    
    // Handle different event types
    switch (actualEventType) {
      case 'ENROLLMENT_COMPLETE':
      case 'enrollment_complete':
      case 'FINGERPRINT_ENROLLED':
      case 'fingerprint_enrolled':
        await handleEnrollmentComplete(actualUserId, actualTimestamp);
        break;
      case 'ACCESS_ATTEMPT':
      case 'access_attempt':
      case 'ATTENDANCE':
      case 'CHECK_IN':
      case 'check_in':
      case 'FINGERPRINT_SCAN':
      case 'fingerprint_scan':
        await handleAccessAttempt(actualUserId, actualTimestamp, actualBiometricType);
        break;
      case 'FINGERPRINT_ENROLLED':
      case 'fingerprint_enrolled':
      case 'ENROLLMENT':
        await handleFingerprintEnrolled(actualUserId, data);
        break;
      case 'USER_REGISTERED':
      case 'user_registered':
      case 'REGISTRATION':
        await handleUserRegistered(actualUserId, data);
        break;
      case 'DEVICE_STATUS':
      case 'device_status':
      case 'STATUS':
        await handleDeviceStatus(data);
        break;
      default:
        console.log(`📡 Unknown event type: ${actualEventType}`);
        // Try to handle as access attempt if it has user_id
        if (actualUserId) {
          console.log(`🔄 Treating as access attempt for user: ${actualUserId}`);
          await handleAccessAttempt(actualUserId, actualTimestamp, actualBiometricType);
        }
    }
    
    // Respond to ESSL device with proper format
    res.json({
      success: true,
      message: 'Data received successfully',
      timestamp: new Date().toISOString(),
      status: 'processed'
    });
    
  } catch (error: any) {
    console.error('❌ ESSL Webhook error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Handle access attempt from ESSL device
 */
async function handleAccessAttempt(userId: string, timestamp: string, biometricType: string) {
  try {
    console.log(`🔐 Processing access attempt for user: ${userId}`);
    
    const client = await getClientByEsslId(userId);
    
    if (!client) {
      console.log(`❌ Client not found for ESSL user ID: ${userId}`);
      if (io) {
        io.emit('access_attempt', {
          userId,
          clientName: 'Unknown User',
          allowed: false,
          reason: `User not found in system (ESSL ID: ${userId})`,
          timestamp: new Date(),
          biometricType,
        });
      }
      return;
    }
    
    const currentTime = timestamp ? new Date(timestamp) : new Date();
    const validation = await esslDeviceService.validateAccess(userId, currentTime);
    await incrementAccessAttempt(client.id, currentTime.toISOString());

    if (validation.openDoor) {
      await esslDeviceService.openDoor(3);
    }

    if (io) {
      io.emit('access_attempt', {
        userId,
        clientName: `${client.firstName} ${client.lastName}`,
        allowed: validation.allowed,
        reason: validation.reason,
        timestamp: currentTime,
        biometricType,
      });
    }
    
    console.log(
      `✅ Access attempt processed: ${client.firstName} ${client.lastName} - ${
        validation.allowed ? 'GRANTED' : 'DENIED'
      } (${validation.reason})`
    );
    
    return {
      allowed: validation.allowed,
      reason: validation.reason,
      openDoor: validation.openDoor,
      doorOpenDuration: validation.openDoor ? 3 : 0,
    };
  } catch (error: any) {
    console.error('❌ Error handling access attempt:', error.message);
    if (io) {
      io.emit('access_attempt', {
        userId,
        clientName: 'System Error',
        allowed: false,
        reason: 'System error occurred',
        timestamp: new Date(),
        biometricType,
      });
    }
    
    return {
      allowed: false,
      reason: 'System error',
      openDoor: false,
      doorOpenDuration: 0,
    };
  }
}

/**
 * Handle fingerprint enrollment completion
 */
async function handleFingerprintEnrolled(userId: string, data: any) {
  try {
    const client = await getClientByEsslId(userId);
    if (client) {
      await updateClientByEsslId(userId, { fingerprintEnrolled: true });
      
      console.log(`✅ Fingerprint enrolled for: ${client.firstName} ${client.lastName}`);
      
      // Send real-time update
      if (io) {
        io.emit('fingerprint_enrolled', {
          userId,
          name: `${client.firstName} ${client.lastName}`,
          timestamp: new Date()
        });
      }
    }
  } catch (error: any) {
    console.error('❌ Error handling fingerprint enrollment:', error.message);
  }
}

/**
 * Handle user registration on device
 */
async function handleUserRegistered(userId: string, data: any) {
  try {
    const client = await getClientByEsslId(userId);
    if (client) {
      await updateClientByEsslId(userId, { isAccessActive: true });
      
      console.log(`✅ User registered on device: ${client.firstName} ${client.lastName}`);
    }
  } catch (error: any) {
    console.error('❌ Error handling user registration:', error.message);
  }
}

/**
 * Handle device status updates
 */
async function handleDeviceStatus(data: any) {
  try {
    console.log(`📊 Device status update:`, data);
    
    // Send device status to frontend
    if (io) {
      io.emit('device_status', {
        status: 'online',
        data: data,
        timestamp: new Date()
      });
    }
  } catch (error: any) {
    console.error('❌ Error handling device status:', error.message);
  }
}


/**
 * Convert time string to minutes
 */

/**
 * Test direct connection to ESSL device
 */
export const testDirectConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { Socket } = await import('net');
    
    const testConnection = () => {
      return new Promise((resolve, reject) => {
        const socket = new Socket();
        
        socket.setTimeout(5000);
        
        const devicePort = parseInt(process.env.ESSL_DEVICE_PORT || '4370');
        const deviceIp = process.env.ESSL_DEVICE_IP || '192.168.0.5';
        socket.connect(devicePort, deviceIp, () => {
          console.log('✅ Direct TCP connection to ESSL device successful');
          socket.destroy();
          resolve(true);
        });
        
        socket.on('error', (err: any) => {
          console.log('❌ Direct TCP connection failed:', err.message);
          reject(err);
        });
        
        socket.on('timeout', () => {
          console.log('⏰ Connection timeout');
          socket.destroy();
          reject(new Error('Connection timeout'));
        });
      });
    };
    
    await testConnection();
    
    res.json({
      success: true,
      message: 'Direct connection to ESSL device successful',
      deviceIp: process.env.ESSL_DEVICE_IP || '192.168.0.5',
      port: parseInt(process.env.ESSL_DEVICE_PORT || '4370'),
      connectionType: 'Ethernet Direct'
    });
    
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    const isConnectionError = errorMessage.includes('ECONNREFUSED') || 
                              errorMessage.includes('ETIMEDOUT') || 
                              errorMessage.includes('ENETUNREACH');
    
    if (isConnectionError) {
      res.status(503).json({
        success: false,
        message: `Cannot connect to ESSL device at ${process.env.ESSL_DEVICE_IP || '192.168.0.5'}:${process.env.ESSL_DEVICE_PORT || '4370'}`,
        error: errorMessage,
        troubleshooting: {
          deviceIp: process.env.ESSL_DEVICE_IP || '192.168.0.5',
          port: process.env.ESSL_DEVICE_PORT || '4370',
          suggestions: [
            'Check if the device is powered on and connected to the network',
            'Verify the device IP address in device settings',
            'Ensure the device and server are on the same network',
            'Check firewall settings - port 4370 should be open',
            'Try pinging the device IP address',
            'Update ESSL_DEVICE_IP in your .env file if the IP has changed'
          ]
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }
};

/**
 * Handle iClock protocol - cdata.aspx endpoint
 * This is the main endpoint for receiving attendance data from ESSL/ZKTeco devices
 */
export const handleIClockCData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { SN, table, OpStamp } = req.query;
    const deviceSerial = SN as string || 'UNKNOWN';
    
    console.log(`\n📡 [ICLOCK] Received ${req.method} from device: ${deviceSerial}`);
    console.log(`   Table: ${table}, OpStamp: ${OpStamp}`);
    console.log(`   URL: ${req.url}`);
    console.log(`   Headers:`, JSON.stringify(req.headers, null, 2));
    
    // iClock protocol sends data in POST body
    if (req.method === 'POST' && table === 'OPERLOG') {
      // OPERLOG contains attendance/operation logs
      let body = req.body;
      
      // iClock data format: tab-separated or specific format
      // Try to parse the body - it can be string, buffer, or object
      let dataString = '';
      
      if (typeof body === 'string') {
        dataString = body;
      } else if (Buffer.isBuffer(body)) {
        dataString = body.toString('utf-8');
      } else if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
        // If it's an object, try to extract data
        dataString = JSON.stringify(body);
      }
      
      console.log(`   📦 [ICLOCK] Body type: ${typeof body}, Length: ${dataString.length}`);
      console.log(`   📦 [ICLOCK] Data (first 500 chars): ${dataString.substring(0, 500)}`);
      
      // Parse iClock OPERLOG format
      // Format is typically: PIN\tDateTime\tStatus\tVerify\tWorkCode
      // Or: PIN,DateTime,Status,Verify,WorkCode (comma-separated)
      const lines = dataString.split(/\r?\n/).filter(line => line.trim().length > 0);
      
      console.log(`   📊 [ICLOCK] Found ${lines.length} line(s) to process`);
      
      let processedCount = 0;
      
      for (const line of lines) {
        try {
          // Try tab-separated first (standard iClock format)
          let parts = line.split('\t');
          
          // If no tabs, try comma-separated
          if (parts.length < 2) {
            parts = line.split(',');
          }
          
          // If still no separators, try space-separated
          if (parts.length < 2) {
            parts = line.split(/\s+/);
          }
          
          if (parts.length >= 2) {
            const pin = parts[0].trim(); // User PIN/ID
            const dateTime = parts[1].trim(); // DateTime string
            
            if (pin && dateTime && pin !== 'PIN' && !isNaN(Number(pin))) {
              console.log(`\n   📝 [ICLOCK] Processing attendance log:`);
              console.log(`      PIN/User ID: ${pin}`);
              console.log(`      DateTime: ${dateTime}`);
              console.log(`      ⚠️ Make sure you have a client with esslUserId = "${pin}" in your database!`);
              
              // Parse datetime (iClock format: YYYYMMDDHHmmss or YYYY-MM-DD HH:MM:SS)
              let timestamp: Date;
              try {
                // Try iClock format: YYYYMMDDHHmmss (14 digits)
                if (/^\d{14}$/.test(dateTime)) {
                  const year = parseInt(dateTime.substring(0, 4));
                  const month = parseInt(dateTime.substring(4, 6)) - 1; // Month is 0-indexed
                  const day = parseInt(dateTime.substring(6, 8));
                  const hour = parseInt(dateTime.substring(8, 10));
                  const minute = parseInt(dateTime.substring(10, 12));
                  const second = parseInt(dateTime.substring(12, 14));
                  timestamp = new Date(year, month, day, hour, minute, second);
                } else {
                  // Try standard date parsing
                  timestamp = new Date(dateTime);
                }
                
                if (isNaN(timestamp.getTime())) {
                  console.log(`   ⚠️ [ICLOCK] Invalid timestamp, using current time`);
                  timestamp = new Date();
                }
              } catch (e) {
                console.log(`   ⚠️ [ICLOCK] Error parsing timestamp: ${e}, using current time`);
                timestamp = new Date();
              }
              
              // Process as access attempt
              await handleAccessAttempt(pin, timestamp.toISOString(), 'fingerprint');
              processedCount++;
            }
          }
        } catch (lineError: any) {
          console.log(`   ⚠️ [ICLOCK] Error parsing line "${line}": ${lineError.message}`);
        }
      }
      
      if (processedCount > 0) {
        console.log(`   ✅ [ICLOCK] Successfully processed ${processedCount} attendance record(s)`);
      } else if (lines.length > 0) {
        console.log(`   ⚠️ [ICLOCK] No valid records found in ${lines.length} line(s)`);
      }
      
      // iClock protocol response: "OK" or "OK:OpStamp"
      // OpStamp tells device which records we've processed
      const newOpStamp = Date.now();
      res.setHeader('Content-Type', 'text/plain');
      res.send(`OK:${newOpStamp}`);
      return;
    }
    
    // For GET requests or other tables, respond with OK
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
    
  } catch (error: any) {
    console.error('❌ [ICLOCK] Error handling cdata:', error.message);
    console.error('   Stack:', error.stack);
    res.setHeader('Content-Type', 'text/plain');
    res.status(500).send('ERROR');
  }
};

/**
 * Handle iClock protocol - getrequest.aspx endpoint
 * Device requests commands/configuration from server
 */
export const handleIClockGetRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { SN, INFO } = req.query;
    const deviceSerial = SN as string || 'UNKNOWN';
    
    console.log(`\n📥 [ICLOCK] Device request from: ${deviceSerial}`);
    if (INFO) {
      console.log(`   Device Info: ${INFO}`);
    }
    
    // iClock protocol: Server can send commands to device
    // For now, just respond with empty (no commands)
    // Format: CMD:COMMAND or empty string for no commands
    res.send('');
    
  } catch (error: any) {
    console.error('❌ [ICLOCK] Error handling getrequest:', error.message);
    res.status(500).send('ERROR');
  }
};

/**
 * Handle fingerprint enrollment completion
 */
async function handleEnrollmentComplete(userId: string, timestamp: string) {
  try {
    console.log(`✅ Fingerprint enrollment confirmed for user ${userId}`);
    
    const client = await getClientByEsslId(userId);
    
    if (client) {
      await updateClientByEsslId(userId, { fingerprintEnrolled: true });
      
      if (io) {
        io.emit('fingerprint_enrolled', {
          clientId: client.id,
          esslUserId: client.esslUserId,
          name: `${client.firstName} ${client.lastName}`
        });
      }
      
      console.log(`✅ Client ${client.firstName} ${client.lastName} fingerprint enrollment completed`);
    } else {
      console.log(`❌ Client not found for ESSL user ID: ${userId}`);
    }
  } catch (error: any) {
    console.error('❌ Error handling enrollment completion:', error.message);
  }
}
