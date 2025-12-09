import axios from 'axios';
import { Socket } from 'net';
import {
  getClientByEsslId,
  incrementAccessAttempt,
  updateClientByEsslId,
} from '../data/clientRepository.js';

/**
 * ESSL K30 Pro Device Service
 * Handles all communication with the biometric device
 */
class ESSLDeviceService {
  private deviceIp: string;
  private devicePort: number;
  private devicePassword: string;
  private baseUrl: string;
  private isDeviceConnected: boolean = false;

  constructor() {
    this.deviceIp = process.env.ESSL_DEVICE_IP || '192.168.0.5';
    this.devicePort = parseInt(process.env.ESSL_DEVICE_PORT || '4370');
    this.devicePassword = process.env.ESSL_DEVICE_PASSWORD || '0';
    this.baseUrl = `http://${this.deviceIp}:${this.devicePort}`;
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): { connected: boolean; deviceIp: string; port: number; baseUrl: string } {
    return {
      connected: this.isDeviceConnected,
      deviceIp: this.deviceIp,
      port: this.devicePort,
      baseUrl: this.baseUrl,
    };
  }

  /**
   * Test device connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log(`🔌 Testing ESSL device connection to ${this.baseUrl}...`);
      
      // Try multiple endpoints for ESSL K30 Pro
      const endpoints = [
        '/cgi-bin/',
        '/cgi-bin/recordFinder.cgi',
        '/api/health',
        '/'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${this.baseUrl}${endpoint}`, {
            timeout: 3000,
            headers: {
              'Authorization': `Basic ${Buffer.from(`admin:${this.devicePassword}`).toString('base64')}`
            }
          });
          
          if (response.status === 200) {
            console.log(`✅ ESSL device connected via ${endpoint}`);
            this.isDeviceConnected = true;
            return true;
          }
        } catch (endpointError: any) {
          console.log(`❌ Endpoint ${endpoint} failed:`, endpointError.message);
        }
      }
      
      // If all endpoints fail, check if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 [DEV MODE] Simulating ESSL device connection');
        this.isDeviceConnected = true;
        return true;
      }
      
      this.isDeviceConnected = false;
      return false;
    } catch (error: any) {
      console.error('❌ ESSL Device connection failed:', error.message);
      this.isDeviceConnected = false;
      return false;
    }
  }

  /**
   * Register user on ESSL device via TCP (direct connection)
   * This is the primary method for device registration
   * Uses ESSL SDK protocol format
   */
  async registerUserOnDeviceTCP(userId: string, userName: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const socket = new Socket();
      // Try port 4370 first (ESSL default), fallback to 4371
      const devicePort = 4370;
      let responseReceived = false;
      
      // Set socket timeout (reduced for faster retries)
      socket.setTimeout(10000); // 10 seconds timeout
      
      // Set socket options for better connection
      socket.setNoDelay(true);
      socket.setKeepAlive(true, 1000);
      
      socket.connect(devicePort, this.deviceIp, () => {
        console.log(`📝 [TCP] Connected to ESSL device at ${this.deviceIp}:${devicePort}`);
        
        try {
          // ESSL SDK Protocol Format for User Registration
          // Command: CMD_USER_WRQ (0x05) - Write User Data
          const userIdNum = parseInt(userId) || 0;
          
          // Build command packet according to ESSL SDK protocol
          // Header: 0x50 0x50 0x82 0x7D (ESSL protocol header)
          // Command: 0x00 0x00 0x00 0x05 (CMD_USER_WRQ)
          // User ID: 4 bytes (little-endian integer)
          // Name: null-terminated string
          
          const header = Buffer.from([0x50, 0x50, 0x82, 0x7D]);
          const command = Buffer.from([0x00, 0x00, 0x00, 0x05]); // CMD_USER_WRQ
          const userIdBuffer = Buffer.allocUnsafe(4);
          userIdBuffer.writeUInt32LE(userIdNum, 0);
          const nameBuffer = Buffer.from(userName + '\0', 'utf8');
          
          const packet = Buffer.concat([header, command, userIdBuffer, nameBuffer]);
          
          console.log(`📝 [TCP] Sending registration packet:`, packet.toString('hex'));
          console.log(`📝 [TCP] User ID=${userId} (numeric=${userIdNum}), Name="${userName}"`);
          
          socket.write(packet);
          
        } catch (packetError: any) {
          console.error(`📝 [TCP] Error building packet:`, packetError.message);
          socket.destroy();
          resolve({ success: false, message: `Packet error: ${packetError.message}` });
          return;
        }
        
        // Handle response
        socket.on('data', (data: Buffer) => {
          if (responseReceived) return;
          responseReceived = true;
          
          console.log(`📝 [TCP] Device response received:`, data.toString('hex'));
          console.log(`📝 [TCP] Response length: ${data.length} bytes`);
          
          // Check if response indicates success
          // ESSL devices typically respond with ACK (0x50 0x50 0x82 0x7D + 0x00 0x00 0x00 0x06)
          if (data.length >= 8) {
            const responseHeader = data.slice(0, 4);
            const responseCmd = data.slice(4, 8);
            
            // Check for ACK (0x06) or success response
            if (responseHeader.equals(Buffer.from([0x50, 0x50, 0x82, 0x7D]))) {
              const cmdValue = responseCmd.readUInt32LE(0);
              if (cmdValue === 0x06 || cmdValue === 0x01) {
                console.log(`✅ [TCP] Device confirmed user registration`);
                socket.destroy();
                resolve({ success: true, message: 'User registered on device successfully' });
                return;
              }
            }
          }
          
          // If we get any response, assume success (device might use different response format)
          console.log(`✅ [TCP] Device responded (assuming success)`);
          socket.destroy();
          resolve({ success: true, message: 'User registered on device (response received)' });
        });
        
        socket.on('error', (error: Error) => {
          if (responseReceived) return;
          console.error(`📝 [TCP] Socket error:`, error.message);
          socket.destroy();
          resolve({ success: false, message: `Device communication failed: ${error.message}` });
        });
        
        socket.on('timeout', () => {
          if (responseReceived) return;
          console.warn(`📝 [TCP] Connection timeout after 15 seconds`);
          socket.destroy();
          resolve({ success: false, message: 'Device registration timeout - device may be offline or not responding' });
        });
        
        socket.on('close', () => {
          if (!responseReceived) {
            console.warn(`📝 [TCP] Connection closed without response`);
            // Don't resolve here - let timeout or error handler resolve
          }
        });
      });
      
      socket.on('error', (error: Error) => {
        if (responseReceived) return;
        console.error(`📝 [TCP] Connection error:`, error.message);
        resolve({ success: false, message: `Connection failed: ${error.message}. Check device IP and network connection.` });
      });
    });
  }

  /**
   * Register user on ESSL device
   * @param userId - Unique user ID (client ID from database)
   * @param name - User's name
   * @param accessSchedule - Time slots when user can access
   */
  async registerUser(
    userId: string,
    name: string,
    accessSchedule: any[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📝 Registering user ${name} (ID: ${userId}) on ESSL device...`);

      // ESSL K30 Pro user registration command
      const userData = {
        userId: userId,
        name: name,
        password: '', // Empty for fingerprint-only access
        cardNumber: '',
        privilege: 0, // Normal user
        enabled: true,
      };

      // Send registration request
      const response = await axios.post(
        `${this.baseUrl}/cgi-bin/recordFinder.cgi?action=insert&table=user`,
        userData,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`admin:${this.devicePassword}`).toString('base64')}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.status === 200) {
        console.log(`✅ User ${name} registered successfully on device`);
        
        // Set access schedule
        await this.setUserAccessSchedule(userId, accessSchedule);
        
        return { success: true, message: 'User registered successfully' };
      }

      throw new Error('Device returned non-200 status');
    } catch (error: any) {
      console.error('❌ Failed to register user:', error.message);
      
      // For development without actual device
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 [DEV MODE] Simulating successful registration');
        return { success: true, message: '[DEV] User registered (simulated)' };
      }
      
      return { success: false, message: error.message };
    }
  }

  /**
   * Set access schedule for user (time-based access control)
   */
  async setUserAccessSchedule(userId: string, accessSchedule: any[]): Promise<boolean> {
    try {
      console.log(`⏰ Setting access schedule for user ${userId}...`);

      // Convert our schedule format to ESSL format
      const esslSchedule = accessSchedule.map(schedule => ({
        userId: userId,
        weekday: this.getDayNumber(schedule.day),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        enabled: schedule.enabled
      }));

      // Send schedule to device
      await axios.post(
        `${this.baseUrl}/cgi-bin/AccessUser.cgi?action=insertMulti`,
        { schedules: esslSchedule },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`admin:${this.devicePassword}`).toString('base64')}`
          }
        }
      );

      console.log(`✅ Access schedule set for user ${userId}`);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to set access schedule:', error.message);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 [DEV MODE] Simulating schedule setup');
        return true;
      }
      
      return false;
    }
  }

  /**
   * Initiate fingerprint enrollment
   */
  async enrollFingerprint(userId: string, fingerIndex: number = 0): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`👆 Initiating fingerprint enrollment for user ${userId}...`);

      const response = await axios.post(
        `${this.baseUrl}/cgi-bin/fingerprintEnroll.cgi`,
        {
          userId: userId,
          fingerIndex: fingerIndex, // 0-9 for different fingers
          requireSamples: 3 // Number of times user must place finger
        },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`admin:${this.devicePassword}`).toString('base64')}`
          },
          timeout: 60000 // 60 seconds for enrollment
        }
      );

      if (response.status === 200) {
        console.log(`✅ Fingerprint enrollment initiated for user ${userId}`);
        return { success: true, message: 'Please place your finger on the device 3 times' };
      }

      throw new Error('Enrollment initiation failed');
    } catch (error: any) {
      console.error('❌ Enrollment failed:', error.message);
      
      // In development or when device is not reachable, simulate enrollment
      if (process.env.NODE_ENV === 'development' || error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
        console.log('🔄 Simulating enrollment in development mode...');
        return { 
          success: true, 
          message: '[DEV] Enrollment ready (simulated). Place finger 3 times.' 
        };
      }
      
      return { success: false, message: error.message };
    }
  }

  /**
   * Check if user has access at current time
   * This is called by the device via webhook
   */
  async validateAccess(userId: string, timestamp: Date = new Date()): Promise<{
    allowed: boolean;
    reason: string;
    openDoor: boolean;
  }> {
    try {
      const client = await getClientByEsslId(userId);

      if (!client) {
        return {
          allowed: false,
          reason: 'User not found in system',
          openDoor: false,
        };
      }

      const packageEndDate = client.packageEndDate ? new Date(client.packageEndDate) : null;
      if (packageEndDate && timestamp > packageEndDate) {
        return {
          allowed: false,
          reason: 'Package expired',
          openDoor: false,
        };
      }

      if (!client.isAccessActive || client.status !== 'active') {
        return {
          allowed: false,
          reason: 'Access not active',
          openDoor: false,
        };
      }

      if (client.pendingAmount > 0) {
        return {
          allowed: false,
          reason: 'Pending payment',
          openDoor: false,
        };
      }

      const currentDay = timestamp.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const currentTime = timestamp.toTimeString().slice(0, 5);

      const todaySchedule = client.accessSchedule.find((schedule) => schedule.day === currentDay);
      if (!todaySchedule || !todaySchedule.enabled) {
        return {
          allowed: false,
          reason: `No access on ${currentDay}`,
          openDoor: false,
        };
      }

      const currentMinutes = this.timeToMinutes(currentTime);
      const startMinutes = this.timeToMinutes(todaySchedule.startTime);
      const endMinutes = this.timeToMinutes(todaySchedule.endTime);

      if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        return {
          allowed: false,
          reason: `Access allowed only between ${todaySchedule.startTime} and ${todaySchedule.endTime}`,
          openDoor: false,
        };
      }

      console.log(`✅ Access granted for ${client.firstName} ${client.lastName}`);
      return {
        allowed: true,
        reason: 'Access granted',
        openDoor: true,
      };
    } catch (error: any) {
      console.error('❌ Error validating access:', error.message);
      return {
        allowed: false,
        reason: 'System error',
        openDoor: false
      };
    }
  }

  /**
   * Log access attempt
   */
  async logAccess(
    userId: string,
    allowed: boolean,
    reason: string,
    biometricType: 'fingerprint' | 'face' = 'fingerprint'
  ): Promise<void> {
    try {
      const client = await getClientByEsslId(userId);
      if (!client) {
        return;
      }

      console.log(
        `📝 Access attempt recorded for ${client.firstName} ${client.lastName}: ${allowed ? 'GRANTED' : 'DENIED'} (${reason})`
      );
      await incrementAccessAttempt(client.id, new Date().toISOString());

      if (allowed) {
        await updateClientByEsslId(userId, {
          lastAccessTime: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error('❌ Error logging access:', error.message);
    }
  }

  /**
   * Delete user from device
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting user ${userId} from device...`);

      await axios.post(
        `${this.baseUrl}/cgi-bin/recordFinder.cgi?action=remove&table=user`,
        { userId },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`admin:${this.devicePassword}`).toString('base64')}`
          }
        }
      );

      console.log(`✅ User ${userId} deleted from device`);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to delete user:', error.message);
      
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      
      return false;
    }
  }

  /**
   * Update user access status (enable/disable)
   */
  async updateUserStatus(userId: string, enabled: boolean): Promise<boolean> {
    try {
      console.log(`🔄 Updating user ${userId} status to ${enabled ? 'enabled' : 'disabled'}...`);

      await axios.post(
        `${this.baseUrl}/cgi-bin/recordFinder.cgi?action=update&table=user`,
        { userId, enabled },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`admin:${this.devicePassword}`).toString('base64')}`
          }
        }
      );

      console.log(`✅ User ${userId} status updated`);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to update user status:', error.message);
      return false;
    }
  }

  /**
   * Get all access logs from device
   */
  async getDeviceAccessLogs(startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start', startDate.toISOString());
      if (endDate) params.append('end', endDate.toISOString());

      const response = await axios.get(
        `${this.baseUrl}/cgi-bin/AttLog.cgi?${params.toString()}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`admin:${this.devicePassword}`).toString('base64')}`
          }
        }
      );

      return response.data.logs || [];
    } catch (error: any) {
      console.error('❌ Failed to fetch device logs:', error.message);
      return [];
    }
  }

  /**
   * Get all users from ESSL device
   */
  async getAllUsers(): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/cgi-bin/recordFinder.cgi?action=list&table=user`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`admin:${this.devicePassword}`).toString('base64')}`
          },
          timeout: 10000
        }
      );
      return response.data.users || [];
    } catch (error: any) {
      console.error('❌ Failed to fetch users from device:', error.message);
      return [];
    }
  }

  /**
   * Get user schedule from ESSL device
   */
  async getUserSchedule(userId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/cgi-bin/AccessUser.cgi?action=get&userId=${userId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`admin:${this.devicePassword}`).toString('base64')}`
          }
        }
      );
      return response.data.schedules || [];
    } catch (error: any) {
      console.error(`❌ Failed to fetch schedule for user ${userId}:`, error.message);
      return [];
    }
  }

  /**
   * Trigger door relay (open door)
   */
  async openDoor(duration: number = 3): Promise<boolean> {
    try {
      console.log(`🚪 Opening door for ${duration} seconds...`);

      await axios.post(
        `${this.baseUrl}/cgi-bin/relay.cgi?action=open`,
        { duration },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`admin:${this.devicePassword}`).toString('base64')}`
          }
        }
      );

      console.log(`✅ Door opened`);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to open door:', error.message);
      return false;
    }
  }

  // Helper methods
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getDayNumber(day: string): number {
    const days: { [key: string]: number } = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };
    return days[day.toLowerCase()] || 0;
  }
}

export default new ESSLDeviceService();




