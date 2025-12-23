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
  preferredTimings?: string;
  paymentMode?: string;
  isTrainer?: boolean;
}

let gymClientsTableExists: boolean | null = null;
let isTrainerColumnAvailable = false;

const ensureTrainerColumn = async (): Promise<boolean> => {
  if (gymClientsTableExists === false) {
    return false;
  }

  try {
    const pool = await ensurePool();
    if (gymClientsTableExists === null) {
      const tableCheck = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'GymClients' AND TABLE_SCHEMA = 'dbo'
      `);
      gymClientsTableExists = tableCheck.recordset.length > 0;
    }

    if (!gymClientsTableExists) {
      return false;
    }

    if (!isTrainerColumnAvailable) {
      const columnCheck = await pool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'GymClients' 
          AND TABLE_SCHEMA = 'dbo'
          AND COLUMN_NAME = 'IsTrainer'
      `);

      if (columnCheck.recordset.length === 0) {
        await pool.request().query(`
          ALTER TABLE dbo.GymClients 
          ADD IsTrainer BIT NOT NULL CONSTRAINT DF_GymClients_IsTrainer DEFAULT(0);
        `);
      }

      isTrainerColumnAvailable = true;
    }

    return true;
  } catch (error: any) {
    console.warn(`⚠️ Could not ensure IsTrainer column on GymClients table: ${error.message}`);
    return false;
  }
};

/**
 * Create a new gym client record (website-specific additional info)
 */
export const createGymClient = async (data: GymClientData): Promise<void> => {
  const pool = await ensurePool();
  const hasTrainerColumn = await ensureTrainerColumn();
  
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
    request.input('BillingDate', sql.DateTime, data.billingDate || null);
    request.input('PreferredTimings', sql.NVarChar(50), data.preferredTimings || null);
    request.input('PaymentMode', sql.NVarChar(50), data.paymentMode || null);
    if (hasTrainerColumn) {
      request.input('IsTrainer', sql.Bit, data.isTrainer ? 1 : 0);
    }
    
    return request.query(`
      INSERT INTO GymClients (
        EmployeeId, EmployeeCodeInDevice, BloodGroup, Months, Trainer,
        PackageType, TotalAmount, AmountPaid, PendingAmount, RemainingDate, BillingDate,
        PreferredTimings, PaymentMode${hasTrainerColumn ? ', IsTrainer' : ''}, CreatedAt, UpdatedAt
      )
      VALUES (
        @EmployeeId, @EmployeeCodeInDevice, @BloodGroup, @Months, @Trainer,
        @PackageType, @TotalAmount, @AmountPaid, @PendingAmount, @RemainingDate, @BillingDate,
        @PreferredTimings, @PaymentMode${hasTrainerColumn ? ', @IsTrainer' : ''}, GETDATE(), GETDATE()
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
    const hasTrainerColumn = await ensureTrainerColumn();
    
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
      // Check if BillingDate column exists before querying
      const columnCheck = await pool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'GymClients' 
        AND COLUMN_NAME = 'BillingDate'
      `);
      
      const hasBillingDate = columnCheck.recordset.length > 0;
      
      const selectFields = hasBillingDate 
        ? `EmployeeId, EmployeeCodeInDevice, BloodGroup, Months, Trainer, PackageType,
           TotalAmount, AmountPaid, PendingAmount, RemainingDate, BillingDate,
           PreferredTimings, PaymentMode${hasTrainerColumn ? ', IsTrainer' : ''}`
        : `EmployeeId, EmployeeCodeInDevice, BloodGroup, Months, Trainer, PackageType,
           TotalAmount, AmountPaid, PendingAmount, RemainingDate,
           PreferredTimings, PaymentMode${hasTrainerColumn ? ', IsTrainer' : ''}`;
      
      return request.query(`
        SELECT ${selectFields}
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
      bloodGroup: row.BloodGroup,
      months: row.Months,
      trainer: row.Trainer,
      packageType: row.PackageType,
      totalAmount: row.TotalAmount ? parseFloat(row.TotalAmount) : undefined,
      amountPaid: row.AmountPaid ? parseFloat(row.AmountPaid) : undefined,
      pendingAmount: row.PendingAmount ? parseFloat(row.PendingAmount) : undefined,
      remainingDate: row.RemainingDate ? new Date(row.RemainingDate) : undefined,
      billingDate: row.BillingDate ? new Date(row.BillingDate) : undefined, // Will be undefined if column doesn't exist
      preferredTimings: row.PreferredTimings,
      paymentMode: row.PaymentMode,
      isTrainer: hasTrainerColumn ? Boolean(row.IsTrainer) : undefined,
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
 * Update gym client record (UPSERT - creates if doesn't exist, updates if exists)
 */
export const updateGymClient = async (employeeId: number, updates: Partial<GymClientData>): Promise<void> => {
  const pool = await ensurePool();
  const hasTrainerColumn = await ensureTrainerColumn();
  
  // First, check if record exists
  const existingRecord = await getGymClientByEmployeeId(employeeId);
  
  // Get EmployeeCodeInDevice from Employees table if not provided
  let employeeCodeInDevice = updates.employeeCodeInDevice;
  if (!employeeCodeInDevice && existingRecord) {
    employeeCodeInDevice = existingRecord.employeeCodeInDevice;
  } else if (!employeeCodeInDevice) {
    // Fetch from Employees table
    try {
      const empResult = await pool.request()
        .input('EmployeeId', sql.Int, employeeId)
        .query('SELECT EmployeeCodeInDevice FROM Employees WHERE EmployeeId = @EmployeeId');
      if (empResult.recordset[0]) {
        employeeCodeInDevice = empResult.recordset[0].EmployeeCodeInDevice;
      }
    } catch (error: any) {
      console.warn(`⚠️ Could not fetch EmployeeCodeInDevice: ${error.message}`);
    }
  }
  
  if (!employeeCodeInDevice) {
    throw new Error('EmployeeCodeInDevice is required but not found');
  }
  
  // If record doesn't exist, create it
  if (!existingRecord) {
    await createGymClient({
      employeeId,
      employeeCodeInDevice,
      bloodGroup: updates.bloodGroup,
      months: updates.months,
      trainer: updates.trainer,
      packageType: updates.packageType,
      totalAmount: updates.totalAmount,
      amountPaid: updates.amountPaid,
      pendingAmount: updates.pendingAmount,
      remainingDate: updates.remainingDate,
      billingDate: updates.billingDate,
      preferredTimings: updates.preferredTimings,
      paymentMode: updates.paymentMode,
      isTrainer: updates.isTrainer,
    });
    return; // Record created, we're done
  }
  
  // Record exists, update it
  const updateFields: string[] = [];
  const updateParams: { [key: string]: any } = {};
  
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
  // Check if BillingDate column exists
  const columnCheck = await pool.request().query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'GymClients' 
    AND COLUMN_NAME = 'BillingDate'
  `);
  const hasBillingDateColumn = columnCheck.recordset.length > 0;
  
  if (updates.billingDate !== undefined) {
    updateParams['BillingDate'] = updates.billingDate || null;
    if (hasBillingDateColumn) {
      updateFields.push('BillingDate = @BillingDate');
    } else {
      console.warn('⚠️ BillingDate column does not exist. Please run ADD_BILLING_DATE_COLUMN.sql');
    }
  }
  if (updates.preferredTimings !== undefined) {
    updateParams['PreferredTimings'] = updates.preferredTimings || null;
    updateFields.push('PreferredTimings = @PreferredTimings');
  }
  if (updates.paymentMode !== undefined) {
    updateParams['PaymentMode'] = updates.paymentMode || null;
    updateFields.push('PaymentMode = @PaymentMode');
  }
  if (hasTrainerColumn && updates.isTrainer !== undefined) {
    updateParams['IsTrainer'] = updates.isTrainer ? 1 : 0;
    updateFields.push('IsTrainer = @IsTrainer');
  }
  
  if (updateFields.length === 0) {
    return; // No updates
  }
  
  updateFields.push('UpdatedAt = GETDATE()');
  
  await runQuery(async (request) => {
    request.input('EmployeeId', sql.Int, employeeId);
    
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
    if (hasBillingDateColumn && updateParams['BillingDate'] !== undefined) {
      request.input('BillingDate', sql.DateTime, updateParams['BillingDate']);
    }
    if (updateParams['PreferredTimings'] !== undefined) {
      request.input('PreferredTimings', sql.NVarChar(50), updateParams['PreferredTimings']);
    }
    if (updateParams['PaymentMode'] !== undefined) {
      request.input('PaymentMode', sql.NVarChar(50), updateParams['PaymentMode']);
    }
    if (hasTrainerColumn && updateParams['IsTrainer'] !== undefined) {
      request.input('IsTrainer', sql.Bit, updateParams['IsTrainer']);
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

