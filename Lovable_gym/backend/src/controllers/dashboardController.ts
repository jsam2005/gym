import { Request, Response } from 'express';
import { getPool, isSqlDisabled } from '../config/database.js';
import sql from 'mssql';
import { getClientStats as fetchClientStats, getClients as fetchClientsList } from '../data/clientRepository.js';
import { getGymClientsAggregateStats } from '../data/billingMetricsRepository.js';
import localApiService from '../services/localApiService.js';
import { normalizeLocalApiClientsForList } from '../utils/localApiClientsNormalize.js';

/**
 * Get comprehensive dashboard statistics
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // If SQL is disabled, use local API service
    if (isSqlDisabled()) {
      try {
        const stats = await localApiService.getDashboardStats();
        // Keep allClients aligned with /clients list rules in API-only mode.
        try {
          const localClients = await localApiService.getClients();
          const normalized = normalizeLocalApiClientsForList(localClients);
          if (stats && typeof stats === 'object') {
            stats.allClients = normalized.length;
          }
        } catch (countError: any) {
          console.warn('⚠️ Could not normalize local allClients count:', countError.message);
        }
        res.json({
          success: true,
          data: stats,
        });
        return;
      } catch (apiError: any) {
        console.error('❌ Local API error:', apiError.message);
        console.error('❌ Local API error details:', {
          code: apiError.code,
          response: apiError.response?.data,
          status: apiError.response?.status,
          config: apiError.config?.url,
        });
        res.status(503).json({
          success: false,
          error: 'Unable to fetch dashboard stats from local API',
          message: apiError.message,
          details: process.env.NODE_ENV !== 'production' ? {
            code: apiError.code,
            status: apiError.response?.status,
            url: apiError.config?.url,
          } : undefined,
        });
        return;
      }
    }

    const pool = await getPool();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [clientStats, billingStats, rosterMeta] = await Promise.all([
      fetchClientStats(),
      getGymClientsAggregateStats(startOfMonth),
      fetchClientsList({ page: 1, limit: 1 }),
    ]);

    // Get pending and overdue clients
    let pendingClients = 0;
    let overdueClients = 0;

    try {
      const pendingResult = await pool.request()
        .input('Now', sql.DateTime, now)
        .query(`
          SELECT 
            COUNT(CASE WHEN PendingAmount > 0 AND RemainingDate >= @Now THEN 1 END) as pending,
            COUNT(CASE WHEN PendingAmount > 0 AND RemainingDate < @Now THEN 1 END) as overdue
          FROM GymClients
          WHERE PendingAmount IS NOT NULL AND PendingAmount > 0
        `);
      
      if (pendingResult.recordset[0]) {
        pendingClients = pendingResult.recordset[0].pending || 0;
        overdueClients = pendingResult.recordset[0].overdue || 0;
      }
    } catch (error: any) {
      console.warn('⚠️ Could not fetch pending/overdue stats:', error.message);
    }

    // Get monthly growth data (last 12 months)
    const monthlyGrowth: { month: string; value: number }[] = [];
    try {
      const growthResult = await pool.request().query(`
        SELECT 
          FORMAT(DOJ, 'MMM') as month,
          COUNT(*) as value
        FROM Employees
        WHERE COALESCE(EmployeeName, '') NOT LIKE 'del_%'
          AND COALESCE(LOWER(Status), '') NOT IN ('deleted', 'delete')
          AND DOJ >= DATEADD(MONTH, -12, GETDATE())
        GROUP BY FORMAT(DOJ, 'MMM'), YEAR(DOJ), MONTH(DOJ)
        ORDER BY YEAR(DOJ), MONTH(DOJ)
      `);

      monthlyGrowth.push(...growthResult.recordset.map((row: any) => ({
        month: row.month,
        value: row.value || 0,
      })));
      
      // If no data, provide empty structure
      if (monthlyGrowth.length === 0) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthlyGrowth.push(...months.map(m => ({ month: m, value: 0 })));
      }
    } catch (error: any) {
      console.warn('⚠️ Could not fetch growth data:', error.message);
      // Fallback to empty data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      monthlyGrowth.push(...months.map(m => ({ month: m, value: 0 })));
    }

    // Calculate renewal clients (clients with RemainingDate within 30 days)
    let renewalClients = 0;
    try {
      const renewalResult = await pool.request()
        .input('Now', sql.DateTime, now)
        .input('ThirtyDays', sql.DateTime, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000))
        .query(`
          SELECT COUNT(*) as count
          FROM GymClients
          WHERE RemainingDate IS NOT NULL
            AND RemainingDate >= @Now
            AND RemainingDate <= @ThirtyDays
        `);
      
      renewalClients = renewalResult.recordset[0]?.count || 0;
    } catch (error: any) {
      console.warn('⚠️ Could not fetch renewal clients:', error.message);
    }

    res.json({
      success: true,
      data: {
        // Primary KPIs
        allClients: rosterMeta.total,
        activeClients: clientStats.activeClients,
        inactiveClients: clientStats.inactiveClients,
        renewalClients: renewalClients,
        
        // Secondary KPIs
        totalBillings: billingStats.totalBillings,
        totalSales: billingStats.totalSales,
        pendingAmount: billingStats.pendingAmount,
        thisMonthCollections: billingStats.thisMonthCollections,
        
        // Pending and Overdue
        pendingClients: pendingClients,
        overdueClients: overdueClients,
        
        // Growth chart data
        monthlyGrowth: monthlyGrowth,
      },
    });
  } catch (error: any) {
    console.error('❌ Dashboard stats error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

