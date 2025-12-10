/**
 * Local API Service
 * Proxies requests to local API server (running on user's machine)
 * Used when USE_API_ONLY=true or LOCAL_API_URL is set
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

class LocalApiService {
  private apiClient: AxiosInstance | null = null;
  private baseUrl: string | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.baseUrl = process.env.LOCAL_API_URL || null;
    this.isEnabled = !!this.baseUrl && (
      process.env.USE_API_ONLY === 'true' || 
      process.env.SQL_DISABLED === 'true'
    );

    if (this.isEnabled && this.baseUrl) {
      this.apiClient = axios.create({
        baseURL: this.baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Error handling
      this.apiClient.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
          if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            console.error(`❌ Local API server not reachable at ${this.baseUrl}`);
            console.error('💡 Make sure local API server is running and exposed via tunnel');
          }
          return Promise.reject(error);
        }
      );

      console.log(`📡 Local API Service enabled: ${this.baseUrl}`);
    } else {
      console.log('💾 Local API Service disabled (using direct SQL connection)');
    }
  }

  /**
   * Check if local API is enabled
   */
  isApiEnabled(): boolean {
    return this.isEnabled && this.apiClient !== null;
  }

  /**
   * Get clients
   */
  async getClients(params?: { status?: string }): Promise<any[]> {
    if (!this.isApiEnabled()) {
      throw new Error('Local API is not enabled');
    }

    try {
      const response = await this.apiClient!.get('/api/clients', { params });
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      console.error('Local API getClients error:', error.message);
      throw error;
    }
  }

  /**
   * Get biometric dashboard
   */
  async getBiometricDashboard(): Promise<any> {
    if (!this.isApiEnabled()) {
      throw new Error('Local API is not enabled');
    }

    try {
      const response = await this.apiClient!.get('/api/biometric/dashboard');
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      console.error('Local API getBiometricDashboard error:', error.message);
      throw error;
    }
  }

  /**
   * Get biometric logs
   */
  async getBiometricLogs(params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
    deviceId?: string;
  }): Promise<any[]> {
    if (!this.isApiEnabled()) {
      throw new Error('Local API is not enabled');
    }

    try {
      const response = await this.apiClient!.get('/api/biometric/logs', { params });
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      console.error('Local API getBiometricLogs error:', error.message);
      throw error;
    }
  }

  /**
   * Execute custom query
   */
  async executeQuery(query: string, params?: Record<string, any>): Promise<any[]> {
    if (!this.isApiEnabled()) {
      throw new Error('Local API is not enabled');
    }

    try {
      const response = await this.apiClient!.post('/api/query', { query, params });
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      console.error('Local API executeQuery error:', error.message);
      throw error;
    }
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(): Promise<any> {
    if (!this.isApiEnabled()) {
      throw new Error('Local API is not enabled');
    }

    try {
      const response = await this.apiClient!.get('/api/dashboard/stats');
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      console.error('Local API getDashboardStats error:', error.message);
      throw error;
    }
  }

  /**
   * Get billing clients
   */
  async getBillingClients(): Promise<any[]> {
    if (!this.isApiEnabled()) {
      throw new Error('Local API is not enabled');
    }

    try {
      const response = await this.apiClient!.get('/api/billing/clients');
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      console.error('Local API getBillingClients error:', error.message);
      throw error;
    }
  }

  /**
   * Get pending and overdue clients
   */
  async getPendingAndOverdueClients(): Promise<any> {
    if (!this.isApiEnabled()) {
      throw new Error('Local API is not enabled');
    }

    try {
      const response = await this.apiClient!.get('/api/billing/pending-overdue');
      return response.data.success ? response.data.data : { pending: [], overdue: [] };
    } catch (error: any) {
      console.error('Local API getPendingAndOverdueClients error:', error.message);
      throw error;
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(): Promise<any[]> {
    if (!this.isApiEnabled()) {
      throw new Error('Local API is not enabled');
    }

    try {
      const response = await this.apiClient!.get('/api/billing/payments');
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      console.error('Local API getPaymentHistory error:', error.message);
      throw error;
    }
  }

  /**
   * Get upcoming payments
   */
  async getUpcomingPayments(): Promise<any[]> {
    if (!this.isApiEnabled()) {
      throw new Error('Local API is not enabled');
    }

    try {
      const response = await this.apiClient!.get('/api/billing/upcoming');
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      console.error('Local API getUpcomingPayments error:', error.message);
      throw error;
    }
  }

  /**
   * Get billing summary
   */
  async getBillingSummary(): Promise<any> {
    if (!this.isApiEnabled()) {
      throw new Error('Local API is not enabled');
    }

    try {
      const response = await this.apiClient!.get('/api/billing/summary');
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      console.error('Local API getBillingSummary error:', error.message);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isApiEnabled()) {
      return false;
    }

    try {
      const response = await this.apiClient!.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default new LocalApiService();


