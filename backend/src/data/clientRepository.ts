import sql from 'mssql';
import { runQuery, stringifyJson, parseJson, mapPagination, ensurePool } from './sqlHelpers.js';
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
  CASE WHEN eb.EmployeeBioId IS NOT NULL THEN 1 ELSE 0 END AS HasBiometric
FROM Employees e
LEFT JOIN EmployeesBio eb ON e.EmployeeId = eb.EmployeeId
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
// STEP 1: Only map name, id, and status - leave others empty
const mapClient = (row: any): ClientEntity => {
  const { firstName, lastName } = splitName(row.EmployeeName);
  const status = row.Status?.toLowerCase() === 'active' ? 'active' : 
                 row.Status?.toLowerCase() === 'inactive' ? 'inactive' :
                 row.Status?.toLowerCase() === 'suspended' ? 'suspended' : 'active';
  
  return {
    id: row.id || String(row.EmployeeId || ''),
    firstName: firstName,
    lastName: lastName,
    email: '', // Empty for now
    phone: '', // Empty for now
    dateOfBirth: new Date('1900-01-01').toISOString(), // Empty/default
    gender: 'other' as const, // Empty/default
    address: '', // Empty for now
    emergencyContact: {
      name: '',
      phone: '',
      relation: '',
    },
    packageType: '', // Empty
    packageStartDate: new Date().toISOString(), // Default
    packageEndDate: new Date().toISOString(), // Default
    packageAmount: 0, // Empty
    amountPaid: 0, // Empty
    pendingAmount: 0, // Empty
    paymentStatus: 'pending' as const, // Default
    esslUserId: row.EmployeeCodeInDevice || row.EmployeeCode || null, // Device ID (EmployeeCodeInDevice)
    fingerprintEnrolled: false, // Empty/default
    accessSchedule: [], // Empty
    isAccessActive: false, // Empty/default
    lastAccessTime: null, // Empty
    accessAttempts: 0, // Empty
    status: status, // ✅ Only field we care about
    photo: null, // Empty for now
    createdAt: new Date().toISOString(), // Default
    updatedAt: new Date().toISOString(), // Default
  };
};

export const createClient = async (data: Partial<ClientEntity>): Promise<ClientEntity> => {
  // Read-only: Employees are managed by ESSL TrackLite, not created via API
  throw new Error('Cannot create client. Employees are managed by ESSL TrackLite. Use ESSL TrackLite to add employees.');
};

/**
 * Create employee in SQL Server Employees table
 * This is used when adding users from the website
 */
export const createEmployeeInSQL = async (employeeData: {
  employeeName: string;
  contactNo?: string;
  email?: string;
  gender?: string;
  address?: string;
}): Promise<{ employeeId: number; employeeCodeInDevice: string }> => {
  const pool = await ensurePool();
  
  // Generate unique EmployeeCodeInDevice (User ID for device)
  // Format: Sequential natural numbers (1, 2, 3, 4, 5, 6, ...)
  // Get all EmployeeCodeInDevice values and find the maximum numeric value
  const allCodesResult = await runQuery(async (request) => {
    return request.query(`
      SELECT EmployeeCodeInDevice
      FROM Employees
      WHERE EmployeeCodeInDevice IS NOT NULL
        AND EmployeeCodeInDevice != ''
        AND EmployeeName NOT LIKE 'del_%'
        AND LOWER(Status) NOT IN ('deleted', 'delete')
    `);
  });
  
  let nextUserId = 1; // Default to 1 if no users exist
  
  if (allCodesResult.recordset.length > 0) {
    // Extract numeric values from EmployeeCodeInDevice
    // Handle formats like "1", "2", "EMP1", "001", etc.
    const numericIds: number[] = [];
    
    for (const row of allCodesResult.recordset) {
      const code = row.EmployeeCodeInDevice?.toString().trim() || '';
      // Extract numeric part (matches any sequence of digits)
      const numericMatch = code.match(/\d+/);
      if (numericMatch) {
        const num = parseInt(numericMatch[0], 10);
        if (!isNaN(num) && num > 0) {
          numericIds.push(num);
        }
      }
    }
    
    if (numericIds.length > 0) {
      // Find the maximum and increment by 1
      nextUserId = Math.max(...numericIds) + 1;
    }
  }
  
  // Use just the number as User ID (natural number format: "6", "7", "8", etc.)
  const employeeCodeInDevice = nextUserId.toString();
  
  let result;
  try {
    // Get default CompanyId (use first company or default to 1)
    let companyId = 1; // Default company ID
    try {
      const companyResult = await runQuery(async (request) => {
        return request.query(`
          SELECT TOP 1 CompanyId 
          FROM Companies 
          ORDER BY CompanyId ASC
        `);
      });
      if (companyResult.recordset.length > 0) {
        companyId = companyResult.recordset[0].CompanyId;
      }
    } catch (companyError: any) {
      console.warn(`⚠️ Could not fetch company, using default CompanyId=1: ${companyError.message}`);
      // Use default companyId = 1
    }
    
    // Get default DepartmentId (use first department or default to 1)
    let departmentId = 1; // Default department ID
    try {
      const departmentResult = await runQuery(async (request) => {
        return request.query(`
          SELECT TOP 1 DepartmentId 
          FROM Departments 
          ORDER BY DepartmentId ASC
        `);
      });
      if (departmentResult.recordset.length > 0) {
        departmentId = departmentResult.recordset[0].DepartmentId;
      }
    } catch (departmentError: any) {
      console.warn(`⚠️ Could not fetch department, using default DepartmentId=1: ${departmentError.message}`);
      // Use default departmentId = 1
    }
    
    // Get default CategoryId (use first category or default to 1)
    let categoryId = 1; // Default category ID
    try {
      const categoryResult = await runQuery(async (request) => {
        return request.query(`
          SELECT TOP 1 CategoryId 
          FROM Categories 
          ORDER BY CategoryId ASC
        `);
      });
      if (categoryResult.recordset.length > 0) {
        categoryId = categoryResult.recordset[0].CategoryId;
      }
    } catch (categoryError: any) {
      console.warn(`⚠️ Could not fetch category, using default CategoryId=1: ${categoryError.message}`);
      // Use default categoryId = 1
    }
    
    result = await runQuery(async (request) => {
      // Convert employeeCodeInDevice to number for NumericCode
      const numericCode = parseInt(employeeCodeInDevice, 10) || 0;
      
      request.input('EmployeeName', sql.NVarChar(255), employeeData.employeeName);
      request.input('EmployeeCode', sql.NVarChar(50), employeeCodeInDevice);
      request.input('EmployeeCodeInDevice', sql.NVarChar(50), employeeCodeInDevice);
      request.input('StringCode', sql.NVarChar(50), ''); // Required field - set to empty string to match existing users (middleware expects empty StringCode)
      request.input('NumericCode', sql.Int, numericCode); // Required field - numeric version of EmployeeCodeInDevice
      request.input('CompanyId', sql.Int, companyId); // Required field - use first company or default to 1
      request.input('DepartmentId', sql.Int, departmentId); // Required field - use first department or default to 1
      request.input('CategoryId', sql.Int, categoryId); // Required field - use first category or default to 1
      request.input('EmployementType', sql.NVarChar(50), 'Permanent'); // Required field - default to 'Permanent'
      request.input('ContactNo', sql.NVarChar(50), employeeData.contactNo || '');
      request.input('Email', sql.NVarChar(255), employeeData.email || '');
      request.input('Gender', sql.NVarChar(10), employeeData.gender || '');
      request.input('ResidentialAddress', sql.NVarChar(sql.MAX), employeeData.address || '');
      // Use 'Working' status to match middleware expectations
      // The middleware "Upload Users" page shows employees with Status = 'Working'
      // Most existing employees use 'Working' instead of 'Active'
      request.input('Status', sql.NVarChar(50), 'Working');
      request.input('DOJ', sql.DateTime, new Date());
      
      // Ensure EmployeeCode matches EmployeeCodeInDevice for middleware compatibility
      // Some middleware queries use EmployeeCode instead of EmployeeCodeInDevice
      
      return request.query(`
        INSERT INTO Employees (
          EmployeeName, EmployeeCode, EmployeeCodeInDevice, StringCode, NumericCode, CompanyId, DepartmentId, CategoryId, EmployementType,
          ContactNo, Email, Gender, ResidentialAddress,
          Status, DOJ
        )
        OUTPUT INSERTED.EmployeeId, INSERTED.EmployeeCodeInDevice
        VALUES (
          @EmployeeName, @EmployeeCode, @EmployeeCodeInDevice, @StringCode, @NumericCode, @CompanyId, @DepartmentId, @CategoryId, @EmployementType,
          @ContactNo, @Email, @Gender, @ResidentialAddress,
          @Status, @DOJ
        )
      `);
    });
  } catch (sqlError: any) {
    console.error('❌ SQL Error creating employee:', sqlError);
    // Provide more detailed error message
    const errorMessage = sqlError.message || sqlError.toString();
    throw new Error(`Failed to create employee in database: ${errorMessage}`);
  }
  
  if (!result || result.recordset.length === 0) {
    throw new Error('Failed to create employee - no record returned');
  }
  
  return {
    employeeId: result.recordset[0].EmployeeId,
    employeeCodeInDevice: result.recordset[0].EmployeeCodeInDevice
  };
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
    whereClauses.push("(e.EmployeeName NOT LIKE 'del_%' AND LOWER(e.Status) NOT IN ('deleted', 'delete'))");
    
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
      ORDER BY EmployeeName ASC
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
    const employeeId = parseInt(id);
    if (isNaN(employeeId)) {
      return null;
    }

    // Get employee data
    const result = await runQuery((request) => {
      request.input('EmployeeId', sql.Int, employeeId);
      return request.query(`
        ${baseSelect} 
        WHERE e.EmployeeId = @EmployeeId
        AND e.EmployeeName NOT LIKE 'del_%'
        AND LOWER(e.Status) NOT IN ('deleted', 'delete')
      `);
    });

    if (!result.recordset[0]) {
      return null;
    }

    const client = mapClient(result.recordset[0]);
    
    // Get GymClients data if exists
    try {
      const { getGymClientByEmployeeId } = await import('./gymClientRepository.js');
      const gymClient = await getGymClientByEmployeeId(employeeId);
      
      if (gymClient) {
        // Merge GymClients data into client
        client.packageType = gymClient.packageType || client.packageType;
        client.packageAmount = gymClient.totalAmount || client.packageAmount;
        client.amountPaid = gymClient.amountPaid || client.amountPaid;
        client.pendingAmount = gymClient.pendingAmount || client.pendingAmount;
        client.packageEndDate = gymClient.remainingDate ? gymClient.remainingDate.toISOString() : client.packageEndDate;
        // Note: bloodGroup, months, trainer, timings, paymentMode are not in ClientEntity
        // They would need to be added to the entity type if needed
      }
    } catch (gymClientError: any) {
      console.warn(`⚠️ Could not fetch GymClients data: ${gymClientError.message}`);
      // Continue without GymClients data
    }

    // Map actual employee data (not just defaults)
    const row = result.recordset[0];
    client.email = row.Email || client.email;
    client.phone = row.Phone || client.phone;
    client.gender = (row.Gender?.toLowerCase() as 'male' | 'female' | 'other') || client.gender;
    client.address = row.Address || client.address;
    client.dateOfBirth = row.DateOfBirth ? new Date(row.DateOfBirth).toISOString() : client.dateOfBirth;
    client.fingerprintEnrolled = row.HasBiometric === 1;

    return client;
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
    return null;
  }

  try {
    const employeeId = parseInt(id);
    if (isNaN(employeeId)) {
      throw new Error('Invalid employee ID');
    }

    // Build update fields for Employees table
    const updateFields: string[] = [];
    
    if (updates.firstName !== undefined || updates.lastName !== undefined) {
      const firstName = updates.firstName || '';
      const lastName = updates.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      updateFields.push('EmployeeName = @EmployeeName');
    }
    
    if (updates.phone !== undefined) {
      updateFields.push('ContactNo = @ContactNo');
    }
    
    if (updates.email !== undefined) {
      updateFields.push('Email = @Email');
    }
    
    if (updates.gender !== undefined) {
      updateFields.push('Gender = @Gender');
    }
    
    if (updates.address !== undefined) {
      updateFields.push('ResidentialAddress = @ResidentialAddress');
    }
    
    if (updates.status !== undefined) {
      updateFields.push('Status = @Status');
    }

    if (updateFields.length === 0) {
      // No fields to update in Employees table, just return the client
      return await getClientById(id);
    }

    const result = await runQuery(async (request) => {
      request.input('EmployeeId', sql.Int, employeeId);
      
      if (updates.firstName !== undefined || updates.lastName !== undefined) {
        const firstName = updates.firstName || '';
        const lastName = updates.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        request.input('EmployeeName', sql.NVarChar(255), fullName);
      }
      
      if (updates.phone !== undefined) {
        request.input('ContactNo', sql.NVarChar(50), updates.phone || '');
      }
      
      if (updates.email !== undefined) {
        request.input('Email', sql.NVarChar(255), updates.email || '');
      }
      
      if (updates.gender !== undefined) {
        request.input('Gender', sql.NVarChar(10), updates.gender || '');
      }
      
      if (updates.address !== undefined) {
        request.input('ResidentialAddress', sql.NVarChar(sql.MAX), updates.address || '');
      }
      
      if (updates.status !== undefined) {
        request.input('Status', sql.NVarChar(50), updates.status);
      }

      const query = `
        UPDATE Employees
        SET ${updateFields.join(', ')}
        WHERE EmployeeId = @EmployeeId
        AND EmployeeName NOT LIKE 'del_%'
        AND LOWER(Status) NOT IN ('deleted', 'delete');
        
        ${baseSelect}
        WHERE e.EmployeeId = @EmployeeId
        AND e.EmployeeName NOT LIKE 'del_%'
        AND LOWER(e.Status) NOT IN ('deleted', 'delete');
      `;

      return request.query(query);
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
  if (process.env.SQL_DISABLED === 'true' || process.env.USE_API_ONLY === 'true') {
    return false;
  }

  try {
    const employeeId = parseInt(id);
    if (isNaN(employeeId)) {
      throw new Error('Invalid employee ID');
    }

    // Get employee info before deletion (for device deletion)
    const employee = await getClientById(id);
    if (!employee) {
      return false;
    }

    // Step 1: Delete from GymClients table first (to avoid foreign key issues)
    try {
      await runQuery(async (request) => {
        request.input('EmployeeId', sql.Int, employeeId);
        return request.query(`
          DELETE FROM GymClients
          WHERE EmployeeId = @EmployeeId;
        `);
      });
      console.log(`✅ Deleted from GymClients table: EmployeeId=${employeeId}`);
    } catch (gymClientError: any) {
      console.warn(`⚠️ Failed to delete from GymClients: ${gymClientError.message}`);
      // Continue even if GymClients deletion fails (might not exist)
    }

    // Step 1.5: Delete from DeviceUsers table ONLY for target device (SerialNumber: NYU7252300984)
    // This ensures we only remove from the target device
    // TARGET DEVICE: Serial Number NYU7252300984 (AI ORCUS / FACE device)
    const TARGET_DEVICE_SERIAL = 'NYU7252300984';
    try {
      await runQuery(async (request) => {
        request.input('EmployeeId', sql.Int, employeeId);
        request.input('SerialNumber', sql.NVarChar(100), TARGET_DEVICE_SERIAL);
        return request.query(`
          DELETE FROM DeviceUsers
          WHERE EmployeeId = @EmployeeId
            AND DeviceId IN (
              SELECT DeviceId FROM Devices WHERE SerialNumber = @SerialNumber
            );
        `);
      });
      console.log(`✅ Deleted from DeviceUsers for target device (Serial: ${TARGET_DEVICE_SERIAL}): EmployeeId=${employeeId}`);
    } catch (deviceUserError: any) {
      console.warn(`⚠️ Failed to delete from DeviceUsers: ${deviceUserError.message}`);
      // Continue even if DeviceUsers deletion fails
    }

    // Step 2: Delete related records that might have foreign key constraints
    // Delete from EmployeesBio (biometric data) if exists
    try {
      await runQuery(async (request) => {
        request.input('EmployeeId', sql.Int, employeeId);
        return request.query(`
          DELETE FROM EmployeesBio
          WHERE EmployeeId = @EmployeeId;
        `);
      });
      console.log(`✅ Deleted from EmployeesBio table: EmployeeId=${employeeId}`);
    } catch (bioError: any) {
      console.warn(`⚠️ Failed to delete from EmployeesBio: ${bioError.message}`);
      // Continue even if EmployeesBio deletion fails
    }

    // Step 3: Actually DELETE the employee from Employees table (hard delete)
    // This will completely remove them from the middleware software
    await runQuery(async (request) => {
      request.input('EmployeeId', sql.Int, employeeId);
      
      return request.query(`
        DELETE FROM Employees
        WHERE EmployeeId = @EmployeeId;
      `);
    });

    console.log(`✅ Hard deleted employee from Employees table: EmployeeId=${employeeId}`);

    return true;
  } catch (error: any) {
    if (error.message?.includes('SQL_DISABLED')) {
      return false;
    }
    // Check if it's a foreign key constraint error
    if (error.message?.includes('FOREIGN KEY') || error.message?.includes('REFERENCE')) {
      console.error(`❌ Cannot delete employee due to foreign key constraints. EmployeeId=${id}`);
      throw new Error('Cannot delete employee: There are related records that must be deleted first. Please contact administrator.');
    }
    throw error;
  }
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



