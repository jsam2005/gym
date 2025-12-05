import axios from 'axios';
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




