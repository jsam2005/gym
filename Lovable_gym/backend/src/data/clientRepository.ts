import sql from 'mssql';
import { runQuery, stringifyJson, parseJson, mapPagination } from './sqlHelpers.js';
import { AccessScheduleEntry, ClientEntity, ClientListResult, ClientStats, EmergencyContact } from '../types/domain.js';

// Query from Employees table (ESSL TrackLite) instead of Clients table
// Join with EmployeesBio to check for fingerprint enrollment
const baseSelect = `
SELECT
  CAST(e.EmployeeId AS NVARCHAR(36)) AS id,
  e.EmployeeId,
  e.EmployeeName,
  e.EmployeeCode,
  e.EmployeeCodeInDevice,
  e.ContactNo AS Phone,
  e.Email,
  e.DOB AS DateOfBirth,
  e.Gender,
  e.ResidentialAddress AS Address,
  e.Status,
  e.EmployeePhoto AS Photo,
  e.DOJ AS CreatedAt,
  e.DOR AS UpdatedAt,
  gc.TotalAmount AS GymTotalAmount,
  gc.AmountPaid AS GymAmountPaid,
  gc.PendingAmount AS GymPendingAmount,
  gc.RemainingDate AS GymRemainingDate,
  gc.PackageType AS GymPackageType,
  gc.Months AS GymMonths,
  gc.PaymentMode AS GymPaymentMode,
  gc.Trainer AS GymTrainer,
  gc.PreferredTimings AS GymPreferredTimings,
  gc.BloodGroup AS GymBloodGroup,
  COALESCE(gc.BillingDate, gc.CreatedAt) AS GymBillingDate,
  gc.UpdatedAt AS GymLastUpdated,
  CASE WHEN eb.EmployeeBioId IS NOT NULL THEN 1 ELSE 0 END AS HasBiometric
FROM Employees e
LEFT JOIN EmployeesBio eb ON e.EmployeeId = eb.EmployeeId
OUTER APPLY (
  SELECT TOP 1
    gc.TotalAmount,
    gc.AmountPaid,
    gc.PendingAmount,
    gc.RemainingDate,
    gc.PackageType,
    gc.Months,
    gc.PaymentMode,
    gc.Trainer,
    gc.PreferredTimings,
    gc.BloodGroup,
    gc.BillingDate,
    gc.CreatedAt,
    gc.UpdatedAt
  FROM GymClients gc
  WHERE gc.EmployeeId = e.EmployeeId
  ORDER BY COALESCE(gc.BillingDate, gc.CreatedAt) DESC, gc.UpdatedAt DESC
) gc
`;

// Helper function to split EmployeeName into firstName and lastName
const splitName = (fullName: string | null | undefined): { firstName: string; lastName: string } => {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: 'Unknown', lastName: '' };
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  const lastName = parts.pop() || '';
  const firstName = parts.join(' ');
  return { firstName, lastName };
};

// Map Employees table columns to ClientEntity structure
const mapClient = (row: any): ClientEntity => {
  const { firstName, lastName } = splitName(row.EmployeeName);
  const status = row.Status?.toLowerCase() === 'active' ? 'active' : 
                 row.Status?.toLowerCase() === 'inactive' ? 'inactive' :
                 row.Status?.toLowerCase() === 'suspended' ? 'suspended' : 'active';

  const packageAmount = Number(row.GymTotalAmount ?? 0) || 0;
  const amountPaid = Number(row.GymAmountPaid ?? 0) || 0;
  const pendingAmountRaw = row.GymPendingAmount;
  const pendingAmount =
    pendingAmountRaw !== null && pendingAmountRaw !== undefined
      ? Number(pendingAmountRaw) || 0
      : Math.max(0, packageAmount - amountPaid);

  let paymentStatus: ClientEntity['paymentStatus'] = 'pending';
  if (packageAmount > 0 && pendingAmount <= 0) {
    paymentStatus = 'paid';
  } else if (amountPaid > 0) {
    paymentStatus = 'partial';
  }

  const billingDate = row.GymBillingDate ? new Date(row.GymBillingDate) : null;
  const remainingDate = row.GymRemainingDate ? new Date(row.GymRemainingDate) : null;
  const dob = row.DateOfBirth ? new Date(row.DateOfBirth) : null;

  const normalizedGender = ((): ClientEntity['gender'] => {
    const g = (row.Gender ?? '').toString().toLowerCase().trim();
    if (g === 'm' || g === 'male') return 'male';
    if (g === 'f' || g === 'female') return 'female';
    return 'other';
  })();
  
  return {
    id: row.id || String(row.EmployeeId || ''),
    firstName: firstName,
    lastName: lastName,
    email: (row.Email ?? '').toString(),
    phone: (row.Phone ?? '').toString(),
    dateOfBirth: dob && !Number.isNaN(dob.getTime()) ? dob.toISOString() : '',
    gender: normalizedGender,
    address: (row.Address ?? '').toString(),
    emergencyContact: {
      name: '',
      phone: '',
      relation: '',
    },
    packageType: (row.GymPackageType ?? '').toString(),
    months: row.GymMonths !== null && row.GymMonths !== undefined ? Number(row.GymMonths) : undefined,
    // Use GymClients.CreatedAt as package/billing start date if present
    packageStartDate: billingDate && !Number.isNaN(billingDate.getTime()) ? billingDate.toISOString() : '',
    // Use GymClients.RemainingDate as package end date if present
    packageEndDate: remainingDate && !Number.isNaN(remainingDate.getTime()) ? remainingDate.toISOString() : '',
    packageAmount,
    amountPaid,
    pendingAmount,
    paymentStatus,
    esslUserId: row.EmployeeCodeInDevice || row.EmployeeCode || null, // Device ID (EmployeeCodeInDevice)
    fingerprintEnrolled: Boolean(row.HasBiometric),
    accessSchedule: [],
    isAccessActive: false, // Empty/default
    lastAccessTime: null, // Empty
    accessAttempts: 0, // Empty
    status: status, // ✅ Only field we care about
    photo: row.Photo ?? null,
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : '',
    // Prefer GymClients.UpdatedAt if present, otherwise Employees.DOR
    updatedAt: row.GymLastUpdated
      ? new Date(row.GymLastUpdated).toISOString()
      : (row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : ''),
  };
};

export const createClient = async (data: Partial<ClientEntity>): Promise<ClientEntity> => {
  // Read-only: Employees are managed by ESSL TrackLite, not created via API
  throw new Error('Cannot create client. Employees are managed by ESSL TrackLite. Use ESSL TrackLite to add employees.');
};

export const getClients = async (params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ClientListResult> => {
  // Return empty result if SQL is disabled
  if (process.env.SQL_DISABLED === 'true' || process.env.USE_API_ONLY === 'true') {
    const { pageNumber, pageSize } = mapPagination(params.page, params.limit);
    return {
      clients: [],
      total: 0,
      page: pageNumber,
      limit: pageSize,
      pages: 0,
    };
  }

  const { pageNumber, pageSize, offset } = mapPagination(params.page, params.limit);

  try {
    const result = await runQuery(async (request) => {
    request.input('Limit', sql.Int, pageSize);
    request.input('Offset', sql.Int, offset);

    const whereClauses: string[] = [];
    
    // Always exclude deleted employees
    // ESSL TrackLite marks deleted employees with 'del_' prefix in name or Status = 'Deleted'
    whereClauses.push("(COALESCE(e.EmployeeName, '') NOT LIKE 'del_%' AND COALESCE(LOWER(e.Status), '') NOT IN ('deleted', 'delete'))");
    
    if (params.status) {
      // Map frontend status to Employees.Status
      const statusMap: Record<string, string> = {
        'active': 'active',
        'inactive': 'inactive',
        'expired': 'inactive',
        'suspended': 'suspended'
      };
      const sqlStatus = statusMap[params.status.toLowerCase()] || params.status;
      request.input('StatusFilter', sql.NVarChar(20), sqlStatus);
      whereClauses.push('e.Status = @StatusFilter');
    }
    if (params.search) {
      request.input('Search', sql.NVarChar(200), `%${params.search}%`);
    }
    if (params.search) {
      whereClauses.push('(e.EmployeeName LIKE @Search OR e.Email LIKE @Search OR e.ContactNo LIKE @Search OR e.EmployeeCode LIKE @Search)');
    }

    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      WITH ClientData AS (
        ${baseSelect}
        ${where}
      )
      SELECT *
      FROM ClientData
      ORDER BY
        CASE
          WHEN EmployeeCodeInDevice IS NOT NULL
            AND EmployeeCodeInDevice <> ''
            AND EmployeeCodeInDevice NOT LIKE '%[^0-9]%'
          THEN CAST(EmployeeCodeInDevice AS INT)
        END ASC,
        EmployeeCodeInDevice ASC,
        EmployeeId ASC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

      SELECT COUNT(*) AS Total
      FROM Employees e
      LEFT JOIN EmployeesBio eb ON e.EmployeeId = eb.EmployeeId
      ${where};
    `;

    return request.query(query);
  });

  const recordsets = result.recordsets as sql.IRecordSet<any>[] | undefined;
  const rawClients = recordsets?.[0]?.map(mapClient) ?? [];
  
  // Remove duplicates based on EmployeeId (id field) - in case of data issues
  const uniqueClients = rawClients.filter((client, index, self) => 
    index === self.findIndex((c) => c.id === client.id)
  );
  
  const clients = uniqueClients;
  const totalRow = recordsets?.[1]?.[0] as { Total?: number } | undefined;
  const total = Number(totalRow?.Total || 0);

    return {
      clients,
      total,
      page: pageNumber,
      limit: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  } catch (error: any) {
    if (error.message?.includes('SQL_DISABLED')) {
      const { pageNumber, pageSize } = mapPagination(params.page, params.limit);
      return {
        clients: [],
        total: 0,
        page: pageNumber,
        limit: pageSize,
        pages: 0,
      };
    }
    throw error;
  }
};

export const getClientById = async (id: string): Promise<ClientEntity | null> => {
  if (process.env.SQL_DISABLED === 'true' || process.env.USE_API_ONLY === 'true') {
    return null;
  }

  try {
    const employeeId = parseInt(id, 10);
    if (Number.isNaN(employeeId)) {
      return null;
    }
    const result = await runQuery((request) => {
      request.input('EmployeeId', sql.Int, employeeId);
      return request.query(`
        ${baseSelect} 
        WHERE e.EmployeeId = @EmployeeId
        AND COALESCE(e.EmployeeName, '') NOT LIKE 'del_%'
        AND COALESCE(LOWER(e.Status), '') NOT IN ('deleted', 'delete')
      `);
    });

    if (!result.recordset[0]) {
      return null;
    }

    return mapClient(result.recordset[0]);
  } catch (error: any) {
    if (error.message?.includes('SQL_DISABLED')) {
      return null;
    }
    throw error;
  }
};

export const getClientByEsslId = async (esslUserId: string): Promise<ClientEntity | null> => {
  if (process.env.SQL_DISABLED === 'true' || process.env.USE_API_ONLY === 'true') {
    return null;
  }

  try {
    const result = await runQuery((request) => {
      request.input('EmployeeCodeInDevice', sql.NVarChar(50), esslUserId);
      return request.query(`${baseSelect} WHERE EmployeeCodeInDevice = @EmployeeCodeInDevice`);
    });

    if (!result.recordset[0]) {
      return null;
    }

    return mapClient(result.recordset[0]);
  } catch (error: any) {
    if (error.message?.includes('SQL_DISABLED')) {
      return null;
    }
    throw error;
  }
};

const applyClientUpdateFields = (request: sql.Request, updates: Partial<ClientEntity>) => {
  const fields: string[] = [];

  const setField = (
    column: string,
    param: string,
    type: sql.ISqlTypeFactoryWithNoParams | sql.ISqlTypeFactoryWithLength | sql.ISqlTypeFactory,
    value: any
  ) => {
    if (value === undefined) return;
    fields.push(`${column} = @${param}`);
    request.input(param, type as sql.ISqlType, value);
  };

  setField('FirstName', 'FirstName', sql.NVarChar(100), updates.firstName);
  setField('LastName', 'LastName', sql.NVarChar(100), updates.lastName);
  setField('Email', 'Email', sql.NVarChar(200), updates.email);
  setField('Phone', 'Phone', sql.NVarChar(50), updates.phone);
  setField('DateOfBirth', 'DateOfBirth', sql.DateTime2, updates.dateOfBirth);
  setField('Gender', 'Gender', sql.NVarChar(10), updates.gender);
  setField('Address', 'Address', sql.NVarChar(sql.MAX), updates.address);
  setField('EmergencyContactJson', 'EmergencyContactJson', sql.NVarChar(sql.MAX), stringifyJson(updates.emergencyContact));
  setField('PackageType', 'PackageType', sql.NVarChar(100), updates.packageType);
  setField('PackageStartDate', 'PackageStartDate', sql.DateTime2, updates.packageStartDate);
  setField('PackageEndDate', 'PackageEndDate', sql.DateTime2, updates.packageEndDate);
  setField('PackageAmount', 'PackageAmount', sql.Decimal(18, 2), updates.packageAmount);
  setField('AmountPaid', 'AmountPaid', sql.Decimal(18, 2), updates.amountPaid);
  setField('PendingAmount', 'PendingAmount', sql.Decimal(18, 2), updates.pendingAmount);
  setField('PaymentStatus', 'PaymentStatus', sql.NVarChar(20), updates.paymentStatus);
  setField('EsslUserId', 'EsslUserId', sql.NVarChar(50), updates.esslUserId);
  setField('FingerprintEnrolled', 'FingerprintEnrolled', sql.Bit, updates.fingerprintEnrolled);
  setField('AccessScheduleJson', 'AccessScheduleJson', sql.NVarChar(sql.MAX), stringifyJson(updates.accessSchedule));
  setField('IsAccessActive', 'IsAccessActive', sql.Bit, updates.isAccessActive);
  setField('LastAccessTime', 'LastAccessTime', sql.DateTime2, updates.lastAccessTime);
  setField('AccessAttempts', 'AccessAttempts', sql.Int, updates.accessAttempts);
  setField('Status', 'Status', sql.NVarChar(20), updates.status);
  setField('Photo', 'Photo', sql.NVarChar(sql.MAX), updates.photo);

  return fields;
};

const runClientUpdate = async (conditionSql: string, request: sql.Request, fields: string[]) => {
  const query = `
    UPDATE Clients
    SET ${fields.join(', ')}, UpdatedAt = SYSUTCDATETIME()
    WHERE ${conditionSql};
    ${baseSelect} WHERE ${conditionSql};
  `;

  const result = await request.query(query);
  return result.recordset?.[0] ? mapClient(result.recordset[0]) : null;
};

export const updateClient = async (id: string, updates: Partial<ClientEntity>): Promise<ClientEntity | null> => {
  if (process.env.SQL_DISABLED === 'true' || process.env.USE_API_ONLY === 'true') {
    throw new Error('SQL is disabled. Cannot update employee.');
  }

  const employeeId = parseInt(id, 10);
  if (Number.isNaN(employeeId)) {
    return null;
  }

  const result = await runQuery(async (request) => {
    request.input('EmployeeId', sql.Int, employeeId);

    const fields: string[] = [];
    const setField = (
      column: string,
      param: string,
      type: sql.ISqlTypeFactoryWithNoParams | sql.ISqlTypeFactoryWithLength | sql.ISqlTypeFactory,
      value: any
    ) => {
      if (value === undefined) return;
      fields.push(`${column} = @${param}`);
      request.input(param, type as sql.ISqlType, value);
    };

    // Update name by combining firstName + lastName when provided
    if (updates.firstName !== undefined || updates.lastName !== undefined) {
      const first = (updates.firstName ?? '').toString().trim();
      const last = (updates.lastName ?? '').toString().trim();
      const full = `${first} ${last}`.trim();
      setField('EmployeeName', 'EmployeeName', sql.NVarChar(200), full.length > 0 ? full : null);
    }

    setField('ContactNo', 'ContactNo', sql.NVarChar(50), updates.phone);
    setField('Email', 'Email', sql.NVarChar(200), updates.email);
    setField('DOB', 'DOB', sql.DateTime, updates.dateOfBirth ? new Date(updates.dateOfBirth) : undefined);
    setField('Gender', 'Gender', sql.NVarChar(10), updates.gender);
    setField('ResidentialAddress', 'ResidentialAddress', sql.NVarChar(sql.MAX), updates.address);
    setField('Status', 'Status', sql.NVarChar(20), updates.status ? updates.status.toString() : undefined);
    setField('EmployeePhoto', 'EmployeePhoto', sql.NVarChar(sql.MAX), updates.photo);

    if (fields.length === 0) {
      // Nothing to update, just return current row
      return request.query(`
        ${baseSelect}
        WHERE e.EmployeeId = @EmployeeId
          AND COALESCE(e.EmployeeName, '') NOT LIKE 'del_%'
          AND COALESCE(LOWER(e.Status), '') NOT IN ('deleted', 'delete')
      `);
    }

    // Note: Employees.DOR is used by some installs as a "retirement" date; we avoid touching it.
    const query = `
      UPDATE Employees
      SET ${fields.join(', ')}, DOC = GETDATE()
      WHERE EmployeeId = @EmployeeId;

      ${baseSelect}
      WHERE e.EmployeeId = @EmployeeId
        AND COALESCE(e.EmployeeName, '') NOT LIKE 'del_%'
        AND COALESCE(LOWER(e.Status), '') NOT IN ('deleted', 'delete');
    `;
    return request.query(query);
  });

  return result.recordset?.[0] ? mapClient(result.recordset[0]) : null;
};

export const updateClientByEsslId = async (
  esslUserId: string,
  updates: Partial<ClientEntity>
): Promise<ClientEntity | null> => {
  // Read-only: Employees are managed by ESSL TrackLite, not updated via API
  // This is a no-op since we're reading from Employees table
  // Just return the existing client if found, but don't update
  console.log(`Update attempt for employee with esslUserId ${esslUserId} - employees are managed by ESSL TrackLite`);
  
  // Return the client if it exists, but don't update
  return await getClientByEsslId(esslUserId);
};

export const deleteClient = async (id: string): Promise<boolean> => {
  // Read-only: Employees are managed by ESSL TrackLite
  throw new Error('Cannot delete employee. Employees are managed by ESSL TrackLite. Use ESSL TrackLite to remove employees.');
};

export const getClientStats = async (): Promise<ClientStats> => {
  if (process.env.SQL_DISABLED === 'true' || process.env.USE_API_ONLY === 'true') {
    return {
      totalClients: 0,
      activeClients: 0,
      inactiveClients: 0,
      expiredClients: 0,
      suspendedClients: 0,
      enrolledClients: 0,
      accessActiveClients: 0,
      enrollmentRate: 0,
      revenue: {
        total: 0,
        paid: 0,
        pending: 0,
      },
    };
  }

  try {
    const result = await runQuery((request) => {
      return request.query(`
      SELECT
        COUNT(*) AS TotalClients,
        SUM(CASE WHEN LOWER(Status) = 'active' THEN 1 ELSE 0 END) AS ActiveClients,
        SUM(CASE WHEN LOWER(Status) = 'inactive' THEN 1 ELSE 0 END) AS InactiveClients,
        SUM(CASE WHEN LOWER(Status) = 'inactive' THEN 1 ELSE 0 END) AS ExpiredClients,
        SUM(CASE WHEN LOWER(Status) = 'suspended' THEN 1 ELSE 0 END) AS SuspendedClients,
        (SELECT COUNT(DISTINCT e.EmployeeId) 
         FROM Employees e 
         INNER JOIN EmployeesBio eb ON e.EmployeeId = eb.EmployeeId
         WHERE e.EmployeeName NOT LIKE 'del_%' AND LOWER(e.Status) NOT IN ('deleted', 'delete')) AS EnrolledClients,
        SUM(CASE WHEN LOWER(Status) = 'active' THEN 1 ELSE 0 END) AS AccessActiveClients,
        0 AS TotalRevenue,
        0 AS PaidRevenue,
        0 AS PendingRevenue
      FROM Employees e
      WHERE e.EmployeeName NOT LIKE 'del_%'
      AND LOWER(e.Status) NOT IN ('deleted', 'delete');
    `);
  });

    const row = result.recordset[0];
    const total = Number(row.TotalClients || 0);

    return {
      totalClients: total,
      activeClients: Number(row.ActiveClients || 0),
      inactiveClients: Number(row.InactiveClients || 0),
      expiredClients: Number(row.ExpiredClients || 0),
      suspendedClients: Number(row.SuspendedClients || 0),
      enrolledClients: Number(row.EnrolledClients || 0),
      accessActiveClients: Number(row.AccessActiveClients || 0),
      enrollmentRate: total > 0 ? Number(((Number(row.EnrolledClients || 0) / total) * 100).toFixed(1)) : 0,
      revenue: {
        total: Number(row.TotalRevenue || 0),
        paid: Number(row.PaidRevenue || 0),
        pending: Number(row.PendingRevenue || 0),
      },
    };
  } catch (error: any) {
    if (error.message?.includes('SQL_DISABLED')) {
      return {
        totalClients: 0,
        activeClients: 0,
        inactiveClients: 0,
        expiredClients: 0,
        suspendedClients: 0,
        enrolledClients: 0,
        accessActiveClients: 0,
        enrollmentRate: 0,
        revenue: {
          total: 0,
          paid: 0,
          pending: 0,
        },
      };
    }
    throw error;
  }
};

export const incrementAccessAttempt = async (id: string, timestamp: string) => {
  // Read-only: Access attempts are tracked in DeviceLogs, not in Employees table
  // This is a no-op since we're reading from Employees table
  console.log(`Access attempt logged for employee ${id} at ${timestamp}`);
};

export const getExpiredActiveClients = async (referenceDate: Date): Promise<ClientEntity[]> => {
  // Employees don't have package expiration - return empty array
  return [];
};

export const getExpiringClients = async (startDate: Date, endDate: Date): Promise<ClientEntity[]> => {
  // Employees don't have package expiration - return empty array
  return [];
};

/**
 * Create a new employee in the Employees table
 * Returns the created employeeId and employeeCodeInDevice
 */
export const createEmployeeInSQL = async (data: {
  employeeName: string;
  contactNo?: string;
  email?: string;
  gender?: string;
  address?: string;
}): Promise<{ employeeId: number; employeeCodeInDevice: string }> => {
  if (process.env.SQL_DISABLED === 'true' || process.env.USE_API_ONLY === 'true') {
    throw new Error('SQL is disabled. Cannot create employee.');
  }

  try {
    const result = await runQuery(async (request) => {
      request.input('EmployeeName', sql.NVarChar(200), data.employeeName);
      request.input('ContactNo', sql.NVarChar(50), data.contactNo || null);
      request.input('Email', sql.NVarChar(200), data.email || null);
      request.input('Gender', sql.NVarChar(10), data.gender || null);
      request.input('ResidentialAddress', sql.NVarChar(sql.MAX), data.address || null);
      
      // Get the next EmployeeCode (usually max + 1)
      const codeResult = await request.query(`
        SELECT ISNULL(MAX(CAST(EmployeeCode AS INT)), 0) + 1 AS NextCode
        FROM Employees
        WHERE ISNUMERIC(EmployeeCode) = 1
      `);
      
      const nextCode = codeResult.recordset[0]?.NextCode || 1;
      const employeeCode = String(nextCode);
      const employeeCodeInDevice = employeeCode; // Use same code for device
      
      request.input('EmployeeCode', sql.NVarChar(50), employeeCode);
      request.input('EmployeeCodeInDevice', sql.NVarChar(50), employeeCodeInDevice);
      request.input('Status', sql.NVarChar(20), 'Active');
      request.input('CompanyId', sql.Int, 1);
      request.input('DepartmentId', sql.Int, 1);
      request.input('CategoryId', sql.Int, 1);
      request.input('EmployementType', sql.NVarChar(50), 'Permanent');
      request.input('DOJ', sql.DateTime, new Date());
      request.input('DOR', sql.DateTime, new Date('3000-01-01')); // Far future date for active
      request.input('DOC', sql.DateTime, new Date());
      
      return request.query(`
        INSERT INTO Employees (
          EmployeeName, EmployeeCode, EmployeeCodeInDevice, ContactNo, Email,
          Gender, ResidentialAddress, Status, CompanyId, DepartmentId, CategoryId,
          EmployementType, DOJ, DOR, DOC
        )
        OUTPUT INSERTED.EmployeeId, INSERTED.EmployeeCodeInDevice
        VALUES (
          @EmployeeName, @EmployeeCode, @EmployeeCodeInDevice, @ContactNo, @Email,
          @Gender, @ResidentialAddress, @Status, @CompanyId, @DepartmentId, @CategoryId,
          @EmployementType, @DOJ, @DOR, @DOC
        )
      `);
    });

    const inserted = result.recordset[0];
    if (!inserted) {
      throw new Error('Failed to create employee - no record returned');
    }

    return {
      employeeId: inserted.EmployeeId,
      employeeCodeInDevice: inserted.EmployeeCodeInDevice || String(inserted.EmployeeId),
    };
  } catch (error: any) {
    console.error('❌ Error creating employee:', error.message);
    throw error;
  }
};



