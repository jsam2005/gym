import { Request, Response } from 'express';
import { getPool, isSqlDisabled } from '../config/database.js';
import sql from 'mssql';
import { getGymClientByEmployeeId } from '../data/gymClientRepository.js';
import localApiService from '../services/localApiService.js';

/**
 * Get all billing clients with their payment information
 */
export const getBillingClients = async (req: Request, res: Response): Promise<void> => {
  try {
    // If SQL is disabled, use local API service
    if (isSqlDisabled()) {
      try {
        const clients = await localApiService.getBillingClients();
        res.json({
          success: true,
          data: clients,
        });
        return;
      } catch (apiError: any) {
        console.error('❌ Local API error:', apiError.message);
        res.status(503).json({
          success: false,
          error: 'Unable to fetch billing clients from local API',
          message: apiError.message,
        });
        return;
      }
    }

    const pool = await getPool();
    
    // Check if GymClients table exists
    let tableExists = false;
    try {
      const tableCheck = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'GymClients' AND TABLE_SCHEMA = 'dbo'
      `);
      tableExists = tableCheck.recordset.length > 0;
    } catch (error: any) {
      console.warn('⚠️ Could not check GymClients table:', error.message);
    }
    
    if (!tableExists) {
      res.json({
        success: true,
        data: [],
        message: 'GymClients table does not exist yet',
      });
      return;
    }

    let result;
    try {
      result = await pool.request().query(`
        SELECT 
          e.EmployeeId,
          e.EmployeeName,
          e.ContactNo,
          e.Email,
          e.EmployeeCodeInDevice,
          gc.TotalAmount,
          gc.AmountPaid,
          gc.PendingAmount,
          gc.RemainingDate,
          gc.PackageType,
          gc.Months,
          gc.PaymentMode,
          gc.Trainer,
          gc.PreferredTimings,
          gc.CreatedAt as BillingDate,
          gc.UpdatedAt as LastUpdated
        FROM Employees e
        LEFT JOIN GymClients gc ON e.EmployeeId = gc.EmployeeId
        WHERE e.EmployeeName NOT LIKE 'del_%'
          AND LOWER(e.Status) NOT IN ('deleted', 'delete')
        ORDER BY 
          CASE WHEN gc.CreatedAt IS NOT NULL THEN gc.CreatedAt ELSE e.DOJ END DESC
      `);
    } catch (queryError: any) {
      // If query fails (e.g., table structure issue), return empty array
      console.warn('⚠️ Query failed, returning empty data:', queryError.message);
      res.json({
        success: true,
        data: [],
        message: 'No billing data available',
      });
      return;
    }

    const clients = result.recordset.map((row: any) => {
      const remainingDate = row.RemainingDate ? new Date(row.RemainingDate) : null;
      const now = new Date();
      const daysRemaining = remainingDate 
        ? Math.ceil((remainingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      const months = row.Months || 0;
      const monthsRemaining = remainingDate && daysRemaining && daysRemaining > 0
        ? Math.ceil(daysRemaining / 30)
        : null;

      const totalAmount = parseFloat(row.TotalAmount || 0);
      const amountPaid = parseFloat(row.AmountPaid || 0);
      const pendingAmount = row.PendingAmount !== null && row.PendingAmount !== undefined 
        ? parseFloat(row.PendingAmount) 
        : (totalAmount > 0 ? (totalAmount - amountPaid) : 0);

      return {
        id: row.EmployeeId,
        deviceId: row.EmployeeCodeInDevice || '', // User ID for display (same as clients page)
        esslUserId: row.EmployeeCodeInDevice || '', // Alias for deviceId
        name: row.EmployeeName || 'Unknown',
        contact: row.ContactNo || '',
        email: row.Email || '',
        status: remainingDate && remainingDate > now ? 'active' : 'inactive',
        billingDate: row.BillingDate ? new Date(row.BillingDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : 'N/A',
        duration: months > 0 ? `${months} month${months > 1 ? 's' : ''}` : 'N/A',
        amount: totalAmount,
        totalAmount: totalAmount, // Alias for amount
        amountPaid: amountPaid,
        balance: pendingAmount,
        pendingAmount: pendingAmount, // Explicit pending amount field
        remainingDuration: monthsRemaining !== null && monthsRemaining > 0
          ? `${monthsRemaining} month${monthsRemaining !== 1 ? 's' : ''}`
          : remainingDate && remainingDate <= now ? 'Expired' : 'N/A',
        paymentMode: row.PaymentMode || 'N/A',
        packageType: row.PackageType || 'N/A',
        trainer: row.Trainer || 'N/A',
        timings: row.PreferredTimings || 'N/A',
        remainingDate: remainingDate,
        daysRemaining: daysRemaining,
        lastUpdated: row.LastUpdated ? new Date(row.LastUpdated).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : 'N/A',
      };
    });

    res.json({
      success: true,
      data: clients,
    });
  } catch (error: any) {
    console.error('❌ Billing clients error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get pending and overdue clients
 */
export const getPendingAndOverdueClients = async (req: Request, res: Response): Promise<void> => {
  try {
    // If SQL is disabled, use local API service
    if (isSqlDisabled()) {
      try {
        const data = await localApiService.getPendingAndOverdueClients();
        res.json({
          success: true,
          data: data,
        });
        return;
      } catch (apiError: any) {
        console.error('❌ Local API error:', apiError.message);
        res.status(503).json({
          success: false,
          error: 'Unable to fetch pending/overdue clients from local API',
          message: apiError.message,
        });
        return;
      }
    }

    const pool = await getPool();
    const now = new Date();

    // Check if GymClients table exists
    let tableExists = false;
    try {
      const tableCheck = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'GymClients' AND TABLE_SCHEMA = 'dbo'
      `);
      tableExists = tableCheck.recordset.length > 0;
    } catch (error: any) {
      console.warn('⚠️ Could not check GymClients table:', error.message);
    }

    if (!tableExists) {
      res.json({
        success: true,
        data: {
          pending: [],
          overdue: [],
          totalPending: 0,
          totalOverdue: 0,
          totalPendingAmount: 0,
          totalOverdueAmount: 0,
        },
      });
      return;
    }

    let result;
    try {
      result = await pool.request()
        .input('Now', sql.DateTime, now)
        .query(`
          SELECT 
            e.EmployeeId,
            e.EmployeeName,
            e.ContactNo,
            gc.PendingAmount,
            gc.RemainingDate,
            gc.PackageType,
            CASE 
              WHEN gc.RemainingDate IS NOT NULL AND gc.RemainingDate < @Now THEN 'overdue'
              WHEN gc.PendingAmount IS NOT NULL AND gc.PendingAmount > 0 THEN 'pending'
              ELSE 'none'
            END as status
          FROM Employees e
          LEFT JOIN GymClients gc ON e.EmployeeId = gc.EmployeeId
          WHERE e.EmployeeName NOT LIKE 'del_%'
            AND LOWER(e.Status) NOT IN ('deleted', 'delete')
            AND gc.PendingAmount IS NOT NULL
            AND gc.PendingAmount > 0
          ORDER BY 
            CASE WHEN gc.RemainingDate IS NOT NULL AND gc.RemainingDate < @Now THEN 0 ELSE 1 END,
            gc.RemainingDate ASC
        `);
    } catch (queryError: any) {
      console.warn('⚠️ Query failed, returning empty data:', queryError.message);
      res.json({
        success: true,
        data: {
          pending: [],
          overdue: [],
          totalPending: 0,
          totalOverdue: 0,
          totalPendingAmount: 0,
          totalOverdueAmount: 0,
        },
      });
      return;
    }

    const clients = result.recordset.map((row: any) => {
      const remainingDate = row.RemainingDate ? new Date(row.RemainingDate) : null;
      const daysRemaining = remainingDate 
        ? Math.ceil((remainingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: row.EmployeeId,
        name: row.EmployeeName || 'Unknown',
        contact: row.ContactNo || '',
        pendingAmount: parseFloat(row.PendingAmount || 0),
        remainingDate: remainingDate,
        daysRemaining: daysRemaining,
        status: row.status,
        packageType: row.PackageType || 'N/A',
      };
    });

    const pending = clients.filter(c => c.status === 'pending');
    const overdue = clients.filter(c => c.status === 'overdue');

    res.json({
      success: true,
      data: {
        pending,
        overdue,
        totalPending: pending.length,
        totalOverdue: overdue.length,
        totalPendingAmount: pending.reduce((sum, c) => sum + c.pendingAmount, 0),
        totalOverdueAmount: overdue.reduce((sum, c) => sum + c.pendingAmount, 0),
      },
    });
  } catch (error: any) {
    console.error('❌ Pending/overdue clients error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    // If SQL is disabled, use local API service
    if (isSqlDisabled()) {
      try {
        const history = await localApiService.getPaymentHistory();
        res.json({
          success: true,
          data: history,
        });
        return;
      } catch (apiError: any) {
        console.error('❌ Local API error:', apiError.message);
        res.status(503).json({
          success: false,
          error: 'Unable to fetch payment history from local API',
          message: apiError.message,
        });
        return;
      }
    }

    const pool = await getPool();
    
    // Check if GymClients table exists
    let tableExists = false;
    try {
      const tableCheck = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'GymClients' AND TABLE_SCHEMA = 'dbo'
      `);
      tableExists = tableCheck.recordset.length > 0;
    } catch (error: any) {
      console.warn('⚠️ Could not check GymClients table:', error.message);
    }

    if (!tableExists) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    // For now, we'll derive payment history from GymClients
    // In a full system, you'd have a separate Payments table
    let result;
    try {
      result = await pool.request().query(`
        SELECT 
          e.EmployeeId,
          e.EmployeeName,
          gc.AmountPaid,
          gc.PaymentMode,
          gc.CreatedAt as PaymentDate,
          CASE 
            WHEN gc.PendingAmount IS NOT NULL AND gc.PendingAmount > 0 THEN 'pending'
            ELSE 'completed'
          END as status
        FROM Employees e
        LEFT JOIN GymClients gc ON e.EmployeeId = gc.EmployeeId
        WHERE e.EmployeeName NOT LIKE 'del_%'
          AND LOWER(e.Status) NOT IN ('deleted', 'delete')
          AND gc.AmountPaid IS NOT NULL
          AND gc.AmountPaid > 0
        ORDER BY 
          CASE WHEN gc.CreatedAt IS NOT NULL THEN gc.CreatedAt ELSE e.DOJ END DESC
      `);
    } catch (queryError: any) {
      console.warn('⚠️ Query failed, returning empty data:', queryError.message);
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    const payments = result.recordset.map((row: any, index: number) => ({
      id: index + 1,
      clientName: row.EmployeeName || 'Unknown',
      amount: parseFloat(row.AmountPaid || 0),
      method: row.PaymentMode || 'Cash',
      date: row.PaymentDate ? new Date(row.PaymentDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) : 'N/A',
      status: row.status,
    }));

    res.json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    console.error('❌ Payment history error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get upcoming payments (clients with pending amounts and future due dates)
 */
export const getUpcomingPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    // If SQL is disabled, use local API service
    if (isSqlDisabled()) {
      try {
        const payments = await localApiService.getUpcomingPayments();
        res.json({
          success: true,
          data: payments,
        });
        return;
      } catch (apiError: any) {
        console.error('❌ Local API error:', apiError.message);
        res.status(503).json({
          success: false,
          error: 'Unable to fetch upcoming payments from local API',
          message: apiError.message,
        });
        return;
      }
    }

    const pool = await getPool();
    const now = new Date();

    // Check if GymClients table exists
    let tableExists = false;
    try {
      const tableCheck = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'GymClients' AND TABLE_SCHEMA = 'dbo'
      `);
      tableExists = tableCheck.recordset.length > 0;
    } catch (error: any) {
      console.warn('⚠️ Could not check GymClients table:', error.message);
    }

    if (!tableExists) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    let result;
    try {
      result = await pool.request()
        .input('Now', sql.DateTime, now)
        .query(`
          SELECT 
            e.EmployeeId,
            e.EmployeeName,
            gc.PendingAmount,
            gc.RemainingDate
        FROM Employees e
        LEFT JOIN GymClients gc ON e.EmployeeId = gc.EmployeeId
        WHERE e.EmployeeName NOT LIKE 'del_%'
          AND LOWER(e.Status) NOT IN ('deleted', 'delete')
          AND gc.PendingAmount IS NOT NULL
          AND gc.PendingAmount > 0
          AND gc.RemainingDate IS NOT NULL
          AND gc.RemainingDate >= @Now
        ORDER BY gc.RemainingDate ASC
      `);
    } catch (queryError: any) {
      console.warn('⚠️ Query failed, returning empty data:', queryError.message);
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    const payments = result.recordset.map((row: any) => {
      const dueDate = row.RemainingDate ? new Date(row.RemainingDate) : null;
      const daysLeft = dueDate 
        ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: row.EmployeeId,
        clientName: row.EmployeeName || 'Unknown',
        amount: parseFloat(row.PendingAmount || 0),
        dueDate: dueDate ? dueDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : 'N/A',
        daysLeft: daysLeft,
      };
    });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    console.error('❌ Upcoming payments error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get billing summary (KPIs)
 */
export const getBillingSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    // If SQL is disabled, use local API service
    if (isSqlDisabled()) {
      try {
        const summary = await localApiService.getBillingSummary();
        res.json({
          success: true,
          data: summary,
        });
        return;
      } catch (apiError: any) {
        console.error('❌ Local API error:', apiError.message);
        res.status(503).json({
          success: false,
          error: 'Unable to fetch billing summary from local API',
          message: apiError.message,
        });
        return;
      }
    }

    const pool = await getPool();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Check if GymClients table exists
    let tableExists = false;
    try {
      const tableCheck = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'GymClients' AND TABLE_SCHEMA = 'dbo'
      `);
      tableExists = tableCheck.recordset.length > 0;
    } catch (error: any) {
      console.warn('⚠️ Could not check GymClients table:', error.message);
    }

    if (!tableExists) {
      res.json({
        success: true,
        data: {
          totalBillings: 0,
          pendingAmount: 0,
          thisMonthCollections: 0,
        },
      });
      return;
    }

    let result;
    try {
      result = await pool.request()
        .input('StartOfMonth', sql.DateTime, startOfMonth)
        .query(`
          SELECT 
            COUNT(*) as totalBillings,
            ISNULL(SUM(gc.TotalAmount), 0) as totalAmount,
            ISNULL(SUM(gc.PendingAmount), 0) as pendingAmount,
            ISNULL(SUM(gc.AmountPaid), 0) as totalPaid,
            ISNULL(SUM(CASE WHEN gc.CreatedAt >= @StartOfMonth THEN gc.AmountPaid ELSE 0 END), 0) as thisMonthCollections
          FROM Employees e
          LEFT JOIN GymClients gc ON e.EmployeeId = gc.EmployeeId
          WHERE e.EmployeeName NOT LIKE 'del_%'
            AND LOWER(e.Status) NOT IN ('deleted', 'delete')
            AND (gc.TotalAmount IS NOT NULL OR gc.AmountPaid IS NOT NULL OR gc.PendingAmount IS NOT NULL)
        `);
    } catch (queryError: any) {
      console.warn('⚠️ Query failed, returning zero values:', queryError.message);
      res.json({
        success: true,
        data: {
          totalBillings: 0,
          pendingAmount: 0,
          thisMonthCollections: 0,
        },
      });
      return;
    }

    const row = result.recordset[0];
    const summary = {
      totalBillings: parseInt(row.totalBillings || 0), // Count of billing records
      totalAmount: parseFloat(row.totalAmount || 0), // Total package amounts
      totalPaid: parseFloat(row.totalPaid || 0), // Total amount paid
      pendingAmount: parseFloat(row.pendingAmount || 0),
      thisMonthCollections: parseFloat(row.thisMonthCollections || 0),
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('❌ Billing summary error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

