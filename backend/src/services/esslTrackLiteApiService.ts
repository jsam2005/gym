import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * ESSL TrackLite API Client Service
 * Connects to ESSL TrackLite server via REST API instead of direct SQL connection
 */
class ESSLTrackLiteApiService {
  private apiClient: AxiosInstance;
  private baseUrl: string;
  private username: string;
  private password: string;
  private isConnected: boolean = false;

  constructor() {
    // Parse server from connection string or use environment variable
    // Connection string format: "Data Source=JSAM\SQLEXPRESS;..."
    const connectionString = process.env.ESSL_TRACKLITE_CONNECTION_STRING || '';
    let server = process.env.ESSL_TRACKLITE_SERVER || 
                 process.env.ESSL_TRACKLITE_API_URL || 
                 'localhost';
    
    // Extract server name from connection string if provided
    if (connectionString) {
      const dataSourceMatch = connectionString.match(/Data Source=([^;]+)/i);
      if (dataSourceMatch) {
        const dataSource = dataSourceMatch[1].trim();
        // Remove instance name (e.g., JSAM\SQLEXPRESS -> JSAM)
        server = dataSource.split('\\')[0];
      }
    }
    
    const port = process.env.ESSL_TRACKLITE_PORT || '80';
    
    // Remove http:// if already present
    const cleanServer = server.replace(/^https?:\/\//, '');
    this.baseUrl = `http://${cleanServer}:${port}`;
    
    this.username = process.env.ESSL_TRACKLITE_USERNAME || 'essl';
    this.password = process.env.ESSL_TRACKLITE_PASSWORD || 'essl';

    // Create axios instance with authentication
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      auth: {
        username: this.username,
        password: this.password,
      },
    });

    // Add request interceptor for logging
    this.apiClient.interceptors.request.use(
      (config) => {
        console.log(`📡 [ESSL TrackLite API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ [ESSL TrackLite API] Request error:', error.message);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => {
        return response;
      },
      (error: AxiosError) => {
        if (error.response) {
          console.error(`❌ [ESSL TrackLite API] ${error.response.status}: ${error.response.statusText}`);
        } else if (error.request) {
          console.error('❌ [ESSL TrackLite API] No response received:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Test connection to ESSL TrackLite server
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log(`🔌 Testing ESSL TrackLite API connection to ${this.baseUrl}...`);
      
      // Try common API endpoints
      const endpoints = [
        '/api/health',
        '/api/status',
        '/api/test',
        '/api/ping',
        '/Health',
        '/Status',
        '/',
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.apiClient.get(endpoint, { timeout: 5000 });
          if (response.status === 200 || response.status === 401) {
            // 401 means server is reachable but auth might be needed
            console.log(`✅ ESSL TrackLite server reachable at ${endpoint}`);
            this.isConnected = true;
            return true;
          }
        } catch (endpointError: any) {
          // Continue to next endpoint
          continue;
        }
      }

      // If all endpoints fail, try a simple GET request
      try {
        const response = await this.apiClient.get('/', { timeout: 5000 });
        this.isConnected = response.status === 200;
        return this.isConnected;
      } catch (error: any) {
        // ESSL TrackLite doesn't have a REST API - it's a desktop app using SQL Server
        console.warn('⚠️  ESSL TrackLite REST API not available.');
        console.warn('💡 ESSL TrackLite is a desktop application that uses SQL Server directly.');
        console.warn('💡 To access data, configure direct SQL connection in .env:');
        console.warn('   SQL_DISABLED=false');
        console.warn('   ETIME_SQL_SERVER=JSAM\\SQLEXPRESS');
        console.warn('   ETIME_SQL_DB=etimetracklite1');
        this.isConnected = false;
        return false;
      }
    } catch (error: any) {
      console.warn('⚠️  ESSL TrackLite API connection test failed:', error.message);
      console.warn('💡 ESSL TrackLite doesn\'t have a REST API. Use direct SQL connection instead.');
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    baseUrl: string;
    username: string;
  } {
    return {
      connected: this.isConnected,
      baseUrl: this.baseUrl,
      username: this.username,
    };
  }

  /**
   * Get all users/employees from ESSL TrackLite
   */
  async getUsers(): Promise<any[]> {
    try {
      const endpoints = [
        '/api/users',
        '/api/employees',
        '/api/members',
        '/Users',
        '/Employees',
        '/api/UserInfo',
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.apiClient.get(endpoint);
          if (response.data && Array.isArray(response.data)) {
            return response.data;
          }
          if (response.data?.data && Array.isArray(response.data.data)) {
            return response.data.data;
          }
        } catch (error: any) {
          continue;
        }
      }

      // ESSL TrackLite doesn't have a REST API
      console.warn('⚠️  ESSL TrackLite REST API not available. Use direct SQL connection instead.');
      return []; // Return empty array instead of throwing error
    } catch (error: any) {
      console.warn('⚠️  Could not fetch users from ESSL TrackLite API:', error.message);
      return []; // Return empty array instead of throwing error
    }
  }

  /**
   * Get user by PIN/UserID
   */
  async getUserByPin(pin: string): Promise<any | null> {
    try {
      const endpoints = [
        `/api/users/${pin}`,
        `/api/employees/${pin}`,
        `/api/members/${pin}`,
        `/Users/${pin}`,
        `/Employees/${pin}`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.apiClient.get(endpoint);
          if (response.data) {
            return response.data?.data || response.data;
          }
        } catch (error: any) {
          if (error.response?.status === 404) {
            return null;
          }
          continue;
        }
      }

      return null;
    } catch (error: any) {
      console.error('❌ Error fetching user from ESSL TrackLite API:', error.message);
      return null;
    }
  }

  /**
   * Get attendance logs from ESSL TrackLite
   */
  async getAttendanceLogs(params?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    userId?: string;
  }): Promise<any[]> {
    try {
      const queryParams: any = {};
      if (params?.startDate) {
        queryParams.startDate = params.startDate.toISOString();
      }
      if (params?.endDate) {
        queryParams.endDate = params.endDate.toISOString();
      }
      if (params?.limit) {
        queryParams.limit = params.limit;
      }
      if (params?.userId) {
        queryParams.userId = params.userId;
      }

      const endpoints = [
        '/api/attendance',
        '/api/logs',
        '/api/attendance-logs',
        '/api/checkinout',
        '/Attendance',
        '/Logs',
        '/CheckInOut',
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.apiClient.get(endpoint, { params: queryParams });
          if (response.data && Array.isArray(response.data)) {
            return response.data;
          }
          if (response.data?.data && Array.isArray(response.data.data)) {
            return response.data.data;
          }
        } catch (error: any) {
          continue;
        }
      }

      // ESSL TrackLite doesn't have a REST API - it uses SQL Server directly
      console.warn('⚠️  ESSL TrackLite REST API not available. ESSL TrackLite is a desktop application that uses SQL Server directly.');
      console.warn('💡 To access data, use direct SQL connection instead of API mode.');
      console.warn('💡 Set SQL_DISABLED=false and configure SQL connection in .env file.');
      return []; // Return empty array instead of throwing error
    } catch (error: any) {
      console.warn('⚠️  Could not fetch attendance logs from ESSL TrackLite API:', error.message);
      return []; // Return empty array instead of throwing error
    }
  }

  /**
   * Create or update user in ESSL TrackLite
   */
  async upsertUser(userData: {
    userId: string;
    name: string;
    pin?: string;
    cardNumber?: string;
    department?: string;
    status?: string;
    [key: string]: any;
  }): Promise<any> {
    try {
      const endpoints = [
        '/api/users',
        '/api/employees',
        '/api/members',
        '/Users',
        '/Employees',
      ];

      for (const endpoint of endpoints) {
        try {
          // Try POST first (create)
          const response = await this.apiClient.post(endpoint, userData);
          if (response.data) {
            return response.data?.data || response.data;
          }
        } catch (postError: any) {
          // If POST fails, try PUT (update)
          if (postError.response?.status === 409 || postError.response?.status === 400) {
            try {
              const putEndpoint = `${endpoint}/${userData.userId || userData.pin}`;
              const putResponse = await this.apiClient.put(putEndpoint, userData);
              if (putResponse.data) {
                return putResponse.data?.data || putResponse.data;
              }
            } catch (putError: any) {
              continue;
            }
          }
          continue;
        }
      }

      throw new Error('Could not find users endpoint for upsert');
    } catch (error: any) {
      console.error('❌ Error upserting user in ESSL TrackLite API:', error.message);
      throw error;
    }
  }

  /**
   * Delete user from ESSL TrackLite
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const endpoints = [
        `/api/users/${userId}`,
        `/api/employees/${userId}`,
        `/api/members/${userId}`,
        `/Users/${userId}`,
        `/Employees/${userId}`,
      ];

      for (const endpoint of endpoints) {
        try {
          await this.apiClient.delete(endpoint);
          return true;
        } catch (error: any) {
          if (error.response?.status === 404) {
            return true; // Already deleted
          }
          continue;
        }
      }

      throw new Error('Could not find users endpoint for delete');
    } catch (error: any) {
      console.error('❌ Error deleting user from ESSL TrackLite API:', error.message);
      throw error;
    }
  }

  /**
   * Get attendance statistics
   */
  async getAttendanceStats(params?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params?.startDate) {
        queryParams.startDate = params.startDate.toISOString();
      }
      if (params?.endDate) {
        queryParams.endDate = params.endDate.toISOString();
      }

      const endpoints = [
        '/api/attendance/stats',
        '/api/logs/stats',
        '/api/statistics',
        '/Attendance/Stats',
        '/Logs/Stats',
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.apiClient.get(endpoint, { params: queryParams });
          if (response.data) {
            return response.data?.data || response.data;
          }
        } catch (error: any) {
          continue;
        }
      }

      // If stats endpoint doesn't exist, calculate from logs
      const logs = await this.getAttendanceLogs(params);
      const uniqueUsers = new Set(
        logs.map((log: any) => log.userId || log.pin || log.userID || log.PIN)
      ).size;

      return {
        totalLogs: logs.length,
        uniqueUsers: uniqueUsers,
        dateRange: {
          start: params?.startDate || null,
          end: params?.endDate || null,
        },
      };
    } catch (error: any) {
      console.error('❌ Error fetching attendance stats from ESSL TrackLite API:', error.message);
      throw error;
    }
  }
}

export default new ESSLTrackLiteApiService();

