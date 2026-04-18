import sql from 'mssql';
import { getPool } from '../config/database.js';

/** Aggregates over all GymClients rows (same definition as dashboard KPIs). */
export interface GymClientsAggregateStats {
  totalBillings: number;
  totalSales: number;
  pendingAmount: number;
  thisMonthCollections: number;
}

const emptyAggregates = (): GymClientsAggregateStats => ({
  totalBillings: 0,
  totalSales: 0,
  pendingAmount: 0,
  thisMonthCollections: 0,
});

export async function gymClientsTableExists(): Promise<boolean> {
  try {
    const pool = await getPool();
    const tableCheck = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'GymClients' AND TABLE_SCHEMA = 'dbo'
    `);
    return tableCheck.recordset.length > 0;
  } catch {
    return false;
  }
}

/**
 * Single source of truth for GymClients totals (matches dashboard secondary KPIs).
 */
export async function getGymClientsAggregateStats(startOfMonth: Date): Promise<GymClientsAggregateStats> {
  const exists = await gymClientsTableExists();
  if (!exists) {
    return emptyAggregates();
  }

  try {
    const pool = await getPool();
    const billingResult = await pool
      .request()
      .input('StartOfMonth', sql.DateTime, startOfMonth)
      .query(`
        SELECT
          COUNT(*) AS totalBillings,
          ISNULL(SUM(PendingAmount), 0) AS pendingAmount,
          ISNULL(SUM(AmountPaid), 0) AS totalSales,
          ISNULL(SUM(CASE WHEN CreatedAt >= @StartOfMonth THEN AmountPaid ELSE 0 END), 0) AS thisMonthCollections
        FROM GymClients
        WHERE TotalAmount IS NOT NULL
      `);

    const row = billingResult.recordset[0];
    if (!row) {
      return emptyAggregates();
    }

    return {
      totalBillings: row.totalBillings || 0,
      pendingAmount: parseFloat(row.pendingAmount || 0),
      thisMonthCollections: parseFloat(row.thisMonthCollections || 0),
      totalSales: parseFloat(row.totalSales || 0),
    };
  } catch (error: any) {
    console.warn('⚠️ Could not fetch GymClients aggregate stats:', error.message);
    return emptyAggregates();
  }
}
