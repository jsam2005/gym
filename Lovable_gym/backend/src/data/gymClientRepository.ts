

import sql from 'mssql';
import { runQuery, ensurePool } from './sqlHelpers.js';

export interface GymClientData {
  employeeId: number;
  employeeCodeInDevice: string;
  bloodGroup?: string;
  months?: number;
  trainer?: string;
  packageType?: string;
  totalAmount?: number;
  amountPaid?: number;
  pendingAmount?: number;
  remainingDate?: Date;
  billingDate?: Date;
  isTrainer?: boolean;
  preferredTimings?: string;
  paymentMode?: string;
}

/**
 * Create a new gym client record (website-specific additional info)
 */
export const createGymClient = async (data: GymClientData): Promise<void> => {
  const pool = await ensurePool();
  
  await runQuery(async (request) => {
    request.input('EmployeeId', sql.Int, data.employeeId);
    request.input('EmployeeCodeInDevice', sql.NVarChar(50), data.employeeCodeInDevice);
    request.input('BloodGroup', sql.NVarChar(10), data.bloodGroup || null);
    request.input('Months', sql.Int, data.months || null);
    request.input('Trainer', sql.NVarChar(100), data.trainer || null);
    request.input('PackageType', sql.NVarChar(50), data.packageType || null);
    request.input('TotalAmount', sql.Decimal(10, 2), data.totalAmount || null);
    request.input('AmountPaid', sql.Decimal(10, 2), data.amountPaid || null);
    request.input('PendingAmount', sql.Decimal(10, 2), data.pendingAmount || null);
    request.input('RemainingDate', sql.DateTime, data.remainingDate || null);
    request.input('BillingDate', sql.DateTime2, data.billingDate || null);
    request.input('IsTrainer', sql.Bit, data.isTrainer ?? false);
    request.input('PreferredTimings', sql.NVarChar(50), data.preferredTimings || null);
    request.input('PaymentMode', sql.NVarChar(50), data.paymentMode || null);
    
    return request.query(`
      INSERT INTO GymClients (
        EmployeeId, EmployeeCodeInDevice, BloodGroup, Months, Trainer,
        PackageType, TotalAmount, AmountPaid, PendingAmount, RemainingDate,
        BillingDate, PreferredTimings, PaymentMode, IsTrainer, CreatedAt, UpdatedAt
      )
      VALUES (
        @EmployeeId, @EmployeeCodeInDevice, @BloodGroup, @Months, @Trainer,
        @PackageType, @TotalAmount, @AmountPaid, @PendingAmount, @RemainingDate,
        COALESCE(@BillingDate, GETDATE()), @PreferredTimings, @PaymentMode, @IsTrainer, GETDATE(), GETDATE()
      )
    `);
  });
};

/**
 * Get gym client by EmployeeId
 */
export const getGymClientByEmployeeId = async (employeeId: number): Promise<GymClientData | null> => {
  try {
    const pool = await ensurePool();
    
    // Check if table exists first
    const tableCheck = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'GymClients' AND TABLE_SCHEMA = 'dbo'
    `);
    
    if (tableCheck.recordset.length === 0) {
      // Table doesn't exist, return null (not an error)
      return null;
    }
    
    const result = await runQuery(async (request) => {
      request.input('EmployeeId', sql.Int, employeeId);
      return request.query(`
        SELECT 
          EmployeeId,
          EmployeeCodeInDevice,
          BloodGroup,
          Months,
          Trainer,
          PackageType,
          TotalAmount,
          AmountPaid,
          PendingAmount,
          RemainingDate,
          BillingDate,
          IsTrainer,
          PreferredTimings,
          PaymentMode
        FROM GymClients
        WHERE EmployeeId = @EmployeeId
      `);
    });
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    const row = result.recordset[0];
    return {
      employeeId: row.EmployeeId,
      employeeCodeInDevice: row.EmployeeCodeInDevice,
      // Return null for empty strings or null values
      bloodGroup: (row.BloodGroup && row.BloodGroup.trim() !== '') ? row.BloodGroup : undefined,
      months: row.Months || undefined,
      trainer: (row.Trainer && row.Trainer.trim() !== '') ? row.Trainer : undefined,
      packageType: (row.PackageType && row.PackageType.trim() !== '') ? row.PackageType : undefined,
      totalAmount: (row.TotalAmount && parseFloat(row.TotalAmount) > 0) ? parseFloat(row.TotalAmount) : undefined,
      amountPaid: (row.AmountPaid && parseFloat(row.AmountPaid) > 0) ? parseFloat(row.AmountPaid) : undefined,
      pendingAmount: (row.PendingAmount !== null && row.PendingAmount !== undefined) ? parseFloat(row.PendingAmount) : undefined,
      remainingDate: row.RemainingDate ? new Date(row.RemainingDate) : undefined,
      billingDate: row.BillingDate ? new Date(row.BillingDate) : undefined,
      isTrainer: row.IsTrainer !== undefined && row.IsTrainer !== null ? Boolean(row.IsTrainer) : undefined,
      preferredTimings: (row.PreferredTimings && row.PreferredTimings.trim() !== '') ? row.PreferredTimings : undefined,
      paymentMode: (row.PaymentMode && row.PaymentMode.trim() !== '') ? row.PaymentMode : undefined,
    };
  } catch (error: any) {
    // If table doesn't exist, return null (not an error)
    if (error.message?.includes('Invalid object name') || error.message?.includes('GymClients')) {
      return null;
    }
    throw error;
  }
};

/**
 * Update gym client record
 */
export const updateGymClient = async (employeeId: number, updates: Partial<GymClientData>): Promise<void> => {
  const pool = await ensurePool();
  
  const updateFields: string[] = [];
  const updateParams: { [key: string]: any } = {};
  
  if (updates.employeeCodeInDevice !== undefined) {
    updateParams['EmployeeCodeInDevice'] = updates.employeeCodeInDevice || null;
    updateFields.push('EmployeeCodeInDevice = @EmployeeCodeInDevice');
  }
  if (updates.bloodGroup !== undefined) {
    updateParams['BloodGroup'] = updates.bloodGroup || null;
    updateFields.push('BloodGroup = @BloodGroup');
  }
  if (updates.months !== undefined) {
    updateParams['Months'] = updates.months || null;
    updateFields.push('Months = @Months');
  }
  if (updates.trainer !== undefined) {
    updateParams['Trainer'] = updates.trainer || null;
    updateFields.push('Trainer = @Trainer');
  }
  if (updates.packageType !== undefined) {
    updateParams['PackageType'] = updates.packageType || null;
    updateFields.push('PackageType = @PackageType');
  }
  if (updates.totalAmount !== undefined) {
    updateParams['TotalAmount'] = updates.totalAmount || null;
    updateFields.push('TotalAmount = @TotalAmount');
  }
  if (updates.amountPaid !== undefined) {
    updateParams['AmountPaid'] = updates.amountPaid || null;
    updateFields.push('AmountPaid = @AmountPaid');
  }
  if (updates.pendingAmount !== undefined) {
    updateParams['PendingAmount'] = updates.pendingAmount || null;
    updateFields.push('PendingAmount = @PendingAmount');
  }
  if (updates.remainingDate !== undefined) {
    updateParams['RemainingDate'] = updates.remainingDate || null;
    updateFields.push('RemainingDate = @RemainingDate');
  }
  if (updates.billingDate !== undefined) {
    updateParams['BillingDate'] = updates.billingDate || null;
    updateFields.push('BillingDate = @BillingDate');
  }
  if (updates.isTrainer !== undefined) {
    updateParams['IsTrainer'] = updates.isTrainer;
    updateFields.push('IsTrainer = @IsTrainer');
  }
  if (updates.preferredTimings !== undefined) {
    updateParams['PreferredTimings'] = updates.preferredTimings || null;
    updateFields.push('PreferredTimings = @PreferredTimings');
  }
  if (updates.paymentMode !== undefined) {
    updateParams['PaymentMode'] = updates.paymentMode || null;
    updateFields.push('PaymentMode = @PaymentMode');
  }
  
  if (updateFields.length === 0) {
    return; // No updates
  }
  
  updateFields.push('UpdatedAt = GETDATE()');
  
  await runQuery(async (request) => {
    request.input('EmployeeId', sql.Int, employeeId);
    // Upsert: ensure a row exists for this employee before updating
    request.input(
      'EmployeeCodeInDeviceFallback',
      sql.NVarChar(50),
      (updates.employeeCodeInDevice || String(employeeId) || '').toString()
    );
    await request.query(`
      IF NOT EXISTS (SELECT 1 FROM GymClients WHERE EmployeeId = @EmployeeId)
      BEGIN
        INSERT INTO GymClients (
          EmployeeId, EmployeeCodeInDevice, BillingDate, IsTrainer, CreatedAt, UpdatedAt
        )
        VALUES (
          @EmployeeId, @EmployeeCodeInDeviceFallback, NULL, 0, GETDATE(), GETDATE()
        )
      END
    `);
    
    if (updateParams['EmployeeCodeInDevice'] !== undefined) {
      request.input('EmployeeCodeInDevice', sql.NVarChar(50), updateParams['EmployeeCodeInDevice']);
    }
    if (updateParams['BloodGroup'] !== undefined) {
      request.input('BloodGroup', sql.NVarChar(10), updateParams['BloodGroup']);
    }
    if (updateParams['Months'] !== undefined) {
      request.input('Months', sql.Int, updateParams['Months']);
    }
    if (updateParams['Trainer'] !== undefined) {
      request.input('Trainer', sql.NVarChar(100), updateParams['Trainer']);
    }
    if (updateParams['PackageType'] !== undefined) {
      request.input('PackageType', sql.NVarChar(50), updateParams['PackageType']);
    }
    if (updateParams['TotalAmount'] !== undefined) {
      request.input('TotalAmount', sql.Decimal(10, 2), updateParams['TotalAmount']);
    }
    if (updateParams['AmountPaid'] !== undefined) {
      request.input('AmountPaid', sql.Decimal(10, 2), updateParams['AmountPaid']);
    }
    if (updateParams['PendingAmount'] !== undefined) {
      request.input('PendingAmount', sql.Decimal(10, 2), updateParams['PendingAmount']);
    }
    if (updateParams['RemainingDate'] !== undefined) {
      request.input('RemainingDate', sql.DateTime, updateParams['RemainingDate']);
    }
    if (updateParams['BillingDate'] !== undefined) {
      request.input('BillingDate', sql.DateTime2, updateParams['BillingDate']);
    }
    if (updateParams['IsTrainer'] !== undefined) {
      request.input('IsTrainer', sql.Bit, updateParams['IsTrainer']);
    }
    if (updateParams['PreferredTimings'] !== undefined) {
      request.input('PreferredTimings', sql.NVarChar(50), updateParams['PreferredTimings']);
    }
    if (updateParams['PaymentMode'] !== undefined) {
      request.input('PaymentMode', sql.NVarChar(50), updateParams['PaymentMode']);
    }
    
    return request.query(`
      UPDATE GymClients
      SET ${updateFields.join(', ')}
      WHERE EmployeeId = @EmployeeId
    `);
  });
};

/**
 * Delete gym client by EmployeeId
 */
export const deleteGymClient = async (employeeId: number): Promise<void> => {
  const pool = await ensurePool();
  
  await runQuery(async (request) => {
    request.input('EmployeeId', sql.Int, employeeId);
    return request.query(`
      DELETE FROM GymClients
      WHERE EmployeeId = @EmployeeId
    `);
  });
};

/**
 * Sync GymClients records for all employees that don't have one
 * Creates minimal GymClients records (with just EmployeeId and EmployeeCodeInDevice)
 * for employees missing from GymClients table
 */
export const syncGymClientsForAllEmployees = async (): Promise<{ created: number; skipped: number; errors: number }> => {
  const pool = await ensurePool();
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  try {
    // Find all employees that don't have GymClients records
    const missingEmployees = await runQuery(async (request) => {
      return request.query(`
        SELECT 
          e.EmployeeId,
          e.EmployeeCodeInDevice,
          e.EmployeeName
        FROM Employees e
        LEFT JOIN GymClients gc ON e.EmployeeId = gc.EmployeeId
        WHERE gc.EmployeeId IS NULL
          AND COALESCE(e.EmployeeName, '') NOT LIKE 'del_%'
          AND COALESCE(LOWER(e.Status), '') NOT IN ('deleted', 'delete')
      `);
    });
    
    console.log(`📋 Found ${missingEmployees.recordset.length} employees without GymClients records`);
    
    // Create GymClients records for each missing employee
    for (const employee of missingEmployees.recordset) {
      try {
        await runQuery(async (request) => {
          request.input('EmployeeId', sql.Int, employee.EmployeeId);
          request.input('EmployeeCodeInDevice', sql.NVarChar(50), employee.EmployeeCodeInDevice || String(employee.EmployeeId) || '');
          
          return request.query(`
            IF NOT EXISTS (SELECT 1 FROM GymClients WHERE EmployeeId = @EmployeeId)
            BEGIN
              INSERT INTO GymClients (
                EmployeeId, 
                EmployeeCodeInDevice, 
                BloodGroup, 
                Months, 
                Trainer,
                PackageType, 
                TotalAmount, 
                AmountPaid, 
                PendingAmount, 
                RemainingDate,
                BillingDate,
                PreferredTimings, 
                PaymentMode, 
                IsTrainer,
                CreatedAt, 
                UpdatedAt
              )
              VALUES (
                @EmployeeId, 
                @EmployeeCodeInDevice, 
                NULL, 
                NULL, 
                NULL,
                NULL, 
                NULL, 
                NULL, 
                NULL, 
                NULL,
                NULL,
                NULL, 
                NULL, 
                0,
                GETDATE(), 
                GETDATE()
              )
            END
          `);
        });
        
        created++;
        console.log(`✅ Created GymClients record for EmployeeId=${employee.EmployeeId} (${employee.EmployeeName})`);
      } catch (error: any) {
        errors++;
        console.error(`❌ Error creating GymClients record for EmployeeId=${employee.EmployeeId}:`, error.message);
      }
    }
    
    return { created, skipped, errors };
  } catch (error: any) {
    console.error('❌ Error syncing GymClients:', error.message);
    throw error;
  }
};

