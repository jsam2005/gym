import { Request, Response } from 'express';
import { getPool, isSqlDisabled } from '../config/database.js';
import sql from 'mssql';
import { getClientStats as fetchClientStats } from '../data/clientRepository.js';
import localApiService from '../services/localApiService.js';

/**
 * Get comprehensive dashboard statistics
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // If SQL is disabled, use local API service
    if (isSqlDisabled()) {
      try {
        const stats = await localApiService.getDashboardStats();
        res.json({
          success: true,
          data: stats,
        });
        return;
      } catch (apiError: any) {
        console.error('❌ Local API error:', apiError.message);
        res.status(503).json({
          success: false,
          error: 'Unable to fetch dashboard stats from local API',
          message: apiError.message,
        });
        return;
      }
    }

    const pool = await getPool();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get client stats
    const clientStats = await fetchClientStats();

    // Get billing stats from GymClients
    let billingStats = {
      totalBillings: 0,
      pendingAmount: 0,
      thisMonthCollections: 0,
      totalSales: 0,
    };

    try {
      const billingResult = await pool.request()
        .input('StartOfMonth', sql.DateTime, startOfMonth)
        .query(`
          SELECT 
            COUNT(*) as totalBillings,
            ISNULL(SUM(PendingAmount), 0) as pendingAmount,
            ISNULL(SUM(AmountPaid), 0) as totalSales,
            ISNULL(SUM(CASE WHEN CreatedAt >= @StartOfMonth THEN AmountPaid ELSE 0 END), 0) as thisMonthCollections
          FROM GymClients
          WHERE TotalAmount IS NOT NULL
        `);
      
      if (billingResult.recordset[0]) {
        const row = billingResult.recordset[0];
        billingStats = {
          totalBillings: row.totalBillings || 0,
          pendingAmount: parseFloat(row.pendingAmount || 0),
          thisMonthCollections: parseFloat(row.thisMonthCollections || 0),
          totalSales: parseFloat(row.totalSales || 0),
        };
      }
    } catch (error: any) {
      console.warn('⚠️ Could not fetch billing stats (GymClients table may not exist):', error.message);
    }

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
        WHERE EmployeeName NOT LIKE 'del_%'
          AND LOWER(Status) NOT IN ('deleted', 'delete')
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
        allClients: clientStats.totalClients,
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

