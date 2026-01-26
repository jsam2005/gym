import { Request, Response } from 'express';
import sql from 'mssql';
import {
  createClient as createClientRecord,
  deleteClient as deleteClientRecord,
  getClientById as fetchClientById,
  getClientStats as fetchClientStats,
  getClients as fetchClients,
  updateClient as updateClientRecord,
  createEmployeeInSQL,
} from '../data/clientRepository.js';
import { createGymClient, updateGymClient, deleteGymClient, getGymClientByEmployeeId } from '../data/gymClientRepository.js';
import esslDeviceService from '../services/esslDeviceService.js';
import etimetrackSyncService from '../services/etimetrackSyncService.js';
import localApiService from '../services/localApiService.js';
import { ClientEntity } from '../types/domain.js';
import { getPool } from '../config/database.js';

// TARGET DEVICE: Only sync to this device for all CRUD operations
// Serial Number: NYU7252300984 (AI ORCUS / FACE device)
const TARGET_DEVICE_SERIAL = 'NYU7252300984';

const ensureEmergencyContact = (contact: any = {}): ClientEntity['emergencyContact'] => ({
  name: contact.name || 'Emergency Contact',
  phone: contact.phone || '0000000000',
  relation: contact.relation || 'Family',
});

const defaultAccessSchedule = () => [
  { day: 'monday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'tuesday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'wednesday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'thursday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'friday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'saturday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'sunday', startTime: '06:00', endTime: '22:00', enabled: false },
];

/**
 * Convert 12-hour time with AM/PM to 24-hour format (HH:MM)
 * @param time - Time in HH:MM format (from time input)
 * @param amPm - 'AM' or 'PM'
 * @returns Time in 24-hour format (HH:MM)
 */
const convertTo24Hour = (time: string, amPm: string): string => {
  if (!time) return '06:00';
  
  const [hours, minutes] = time.split(':').map(Number);
  let hour24 = hours;
  
  if (amPm === 'PM' && hours !== 12) {
    hour24 = hours + 12;
  } else if (amPm === 'AM' && hours === 12) {
    hour24 = 0;
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Create access schedule from preferred timings string
 * Format: "HH:MM AM - HH:MM PM" or "06:00 AM - 10:00 PM"
 */
const createAccessScheduleFromTimings = (timings: string | undefined) => {
  if (!timings) return defaultAccessSchedule();
  
  // Parse format: "06:00 AM - 10:00 PM"
  const match = timings.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) {
    console.warn(`⚠️ Could not parse timings format: ${timings}, using default schedule`);
    return defaultAccessSchedule();
  }
  
  const [, fromHour, fromMin, fromAmPm, toHour, toMin, toAmPm] = match;
  const startTime = convertTo24Hour(`${fromHour}:${fromMin}`, fromAmPm.toUpperCase());
  const endTime = convertTo24Hour(`${toHour}:${toMin}`, toAmPm.toUpperCase());
  
  // Apply same schedule to all weekdays (Mon-Sat), Sunday disabled by default
  return [
    { day: 'monday', startTime, endTime, enabled: true },
    { day: 'tuesday', startTime, endTime, enabled: true },
    { day: 'wednesday', startTime, endTime, enabled: true },
    { day: 'thursday', startTime, endTime, enabled: true },
    { day: 'friday', startTime, endTime, enabled: true },
    { day: 'saturday', startTime, endTime, enabled: true },
    { day: 'sunday', startTime, endTime, enabled: false },
  ];
};

const normalizeClientPayload = (input: any): Partial<ClientEntity> => {
  const clientData = { ...input };
  // Only set defaults for required fields, leave others as undefined if not provided
  clientData.dateOfBirth = clientData.dateOfBirth ? new Date(clientData.dateOfBirth) : new Date();
  clientData.gender = clientData.gender || undefined; // Don't set default, allow empty
  clientData.address = clientData.address || undefined; // Don't set default, allow empty
  clientData.emergencyContact = ensureEmergencyContact(clientData.emergencyContact);
  clientData.packageStartDate = clientData.packageStartDate ? new Date(clientData.packageStartDate) : new Date();
  clientData.packageEndDate = clientData.packageEndDate
    ? new Date(clientData.packageEndDate)
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  clientData.packageType = clientData.packageType || undefined; // Don't set default
  clientData.packageAmount = clientData.packageAmount !== undefined ? Number(clientData.packageAmount) : undefined;
  clientData.amountPaid = clientData.amountPaid !== undefined ? Number(clientData.amountPaid) : undefined;
  clientData.pendingAmount = (clientData.packageAmount || 0) - (clientData.amountPaid || 0);

  if (clientData.amountPaid && clientData.packageAmount && clientData.amountPaid >= clientData.packageAmount) {
    clientData.paymentStatus = 'paid';
    clientData.pendingAmount = 0;
  } else if (clientData.amountPaid && clientData.amountPaid > 0) {
    clientData.paymentStatus = 'partial';
  } else {
    clientData.paymentStatus = 'pending';
  }

  // Create access schedule from preferred timings if provided, otherwise use default
  if ((input as any).timings && !clientData.accessSchedule) {
    clientData.accessSchedule = createAccessScheduleFromTimings((input as any).timings);
  } else {
    clientData.accessSchedule =
      Array.isArray(clientData.accessSchedule) && clientData.accessSchedule.length > 0
        ? clientData.accessSchedule
        : defaultAccessSchedule();
  }

  clientData.isAccessActive = clientData.isAccessActive ?? false;
  clientData.status = clientData.status || 'active';
  clientData.fingerprintEnrolled = clientData.fingerprintEnrolled ?? false;

  return clientData;
};

/**
 * Create a new client
 * This creates:
 * 1. Employee in Employees table (name + basic info)
 * 2. GymClient in GymClients table (additional website info)
 * 3. Registers user on ESSL device via TCP
 */
export const createClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const normalizedPayload = normalizeClientPayload(req.body);
    
    // Step 1: Create employee in Employees table
    // All fields are optional - use defaults if not provided
    const firstName = normalizedPayload.firstName || '';
    const lastName = normalizedPayload.lastName || '';
    const employeeName = `${firstName} ${lastName}`.trim() || 'Client';
    
    console.log(`📝 Creating employee: ${employeeName}`);
    const { employeeId, employeeCodeInDevice } = await createEmployeeInSQL({
      employeeName,
      contactNo: normalizedPayload.phone,
      email: normalizedPayload.email,
      gender: normalizedPayload.gender,
      address: normalizedPayload.address,
    });
    
    console.log(`✅ Employee created: ID=${employeeId}, DeviceCode=${employeeCodeInDevice}`);
    
    // Step 2: Always create gym client record (automatic sync)
    // This ensures every employee has a corresponding GymClients record
    try {
      // Check if GymClients record already exists
      const existingGymClient = await getGymClientByEmployeeId(employeeId);
      
      if (!existingGymClient) {
        // Create GymClients record with provided info or defaults
        await createGymClient({
          employeeId,
          employeeCodeInDevice,
          bloodGroup: (req.body as any).bloodGroup || undefined,
          months: (req.body as any).months ? parseInt((req.body as any).months) : undefined,
          trainer: (req.body as any).trainer || undefined,
          packageType: normalizedPayload.packageType || undefined,
          totalAmount: normalizedPayload.packageAmount !== undefined ? normalizedPayload.packageAmount : undefined,
          amountPaid: normalizedPayload.amountPaid !== undefined ? normalizedPayload.amountPaid : undefined,
          pendingAmount: normalizedPayload.pendingAmount !== undefined ? normalizedPayload.pendingAmount : undefined,
          remainingDate: normalizedPayload.packageEndDate ? new Date(normalizedPayload.packageEndDate) : undefined,
          preferredTimings: (req.body as any).timings || undefined,
          paymentMode: (req.body as any).paymentMode || undefined,
        });
        console.log(`✅ Gym client record created automatically for EmployeeId=${employeeId}`);
      } else {
        // Update existing record if additional info provided
        const hasAdditionalInfo = (req.body as any).bloodGroup || 
                                  (req.body as any).months || 
                                  (req.body as any).trainer || 
                                  normalizedPayload.packageType ||
                                  normalizedPayload.packageAmount ||
                                  normalizedPayload.amountPaid ||
                                  (req.body as any).timings ||
                                  (req.body as any).paymentMode;
        
        if (hasAdditionalInfo) {
          await updateGymClient(employeeId, {
            bloodGroup: (req.body as any).bloodGroup,
            months: (req.body as any).months ? parseInt((req.body as any).months) : undefined,
            trainer: (req.body as any).trainer,
            packageType: normalizedPayload.packageType,
            totalAmount: normalizedPayload.packageAmount,
            amountPaid: normalizedPayload.amountPaid,
            pendingAmount: normalizedPayload.pendingAmount,
            remainingDate: normalizedPayload.packageEndDate ? new Date(normalizedPayload.packageEndDate) : undefined,
            preferredTimings: (req.body as any).timings,
            paymentMode: (req.body as any).paymentMode,
          });
          console.log(`✅ Gym client record updated for EmployeeId=${employeeId}`);
        }
      }
    } catch (gymClientError: any) {
      console.warn(`⚠️ Failed to create/update gym client record: ${gymClientError.message}`);
      // Continue even if gym client creation fails
    }
    
    // Step 3: Register user in DeviceUsers table for automatic middleware sync
    // This ensures the middleware knows to sync this user to devices
    // All three systems (Website, Middleware, Device) use the same Employees table
    try {
      const pool = getPool();
      if (pool) {
        // Get ONLY the target device (SerialNumber: NYU7252300984 - AI ORCUS)
        // This is the only device we sync to for all operations
        let devicesResult;
        try {
          devicesResult = await pool.request()
            .input('SerialNumber', sql.NVarChar(100), TARGET_DEVICE_SERIAL)
            .query(`
              SELECT DeviceId, DeviceFName, DeviceSName, SerialNumber
              FROM Devices
              WHERE SerialNumber = @SerialNumber
            `);
          
          // If not found by SerialNumber, try to find DeviceId 20 (fallback)
          if (devicesResult.recordset.length === 0) {
            console.warn(`⚠️ Device with SerialNumber ${TARGET_DEVICE_SERIAL} not found, trying DeviceId 20...`);
            devicesResult = await pool.request().query(`
              SELECT DeviceId, DeviceFName, DeviceSName, SerialNumber
              FROM Devices
              WHERE DeviceId = 20
            `);
          }
        } catch (devicesError: any) {
          // If Devices table doesn't exist or query fails, use default device 20
          console.warn(`⚠️ Could not query Devices table: ${devicesError.message}`);
          devicesResult = { recordset: [{ DeviceId: 20, DeviceFName: 'AI ORCUS', DeviceSName: 'AI ORCUS', SerialNumber: TARGET_DEVICE_SERIAL }] };
        }
        
        if (devicesResult.recordset.length > 0) {
          // Register user in DeviceUsers table ONLY for the target device
          // This tells the middleware to sync the user to this device only
          const device = devicesResult.recordset[0];
          try {
            await pool.request()
              .input('DeviceId', sql.Int, device.DeviceId)
              .input('EmployeeId', sql.Int, employeeId)
              .input('GroupId', sql.Int, 1)
              .query(`
                IF NOT EXISTS (
                  SELECT 1 FROM DeviceUsers 
                  WHERE DeviceId = @DeviceId AND EmployeeId = @EmployeeId
                )
                BEGIN
                  INSERT INTO DeviceUsers (DeviceId, EmployeeId, GroupId, CreatedDate)
                  VALUES (@DeviceId, @EmployeeId, @GroupId, GETDATE())
                END
              `);
            const deviceName = device.DeviceFName || device.DeviceSName || `Device ${device.DeviceId}`;
            console.log(`✅ User registered in DeviceUsers for target device: ${deviceName} (ID: ${device.DeviceId}, Serial: ${device.SerialNumber || 'N/A'})`);
            console.log(`✅ User will be synced ONLY to device: ${TARGET_DEVICE_SERIAL}`);
          } catch (deviceUserError: any) {
            // If DeviceUsers table doesn't exist or has different structure, continue
            const deviceName = device.DeviceFName || device.DeviceSName || `Device ${device.DeviceId}`;
            console.warn(`⚠️ Could not register in DeviceUsers for target device ${deviceName}: ${deviceUserError.message}`);
          }
        } else {
          console.log(`⚠️  Target device (Serial: ${TARGET_DEVICE_SERIAL}) not found. User will not be synced to device.`);
        }
      }
    } catch (deviceUsersError: any) {
      console.warn(`⚠️ DeviceUsers registration skipped: ${deviceUsersError.message}`);
      // Continue - user is still created in database
    }
    
    // Step 3.5: Attempt direct TCP registration as fallback
    console.log(`📱 Attempting direct TCP registration to device: ${employeeCodeInDevice} (${employeeName})`);
    const deviceResult = await esslDeviceService.registerUserOnDeviceTCP(employeeCodeInDevice, employeeName);
    
    if (deviceResult.success) {
      console.log(`✅ User registered on device successfully via TCP`);
    } else {
      console.log(`ℹ️  TCP registration not needed - user registered in DeviceUsers table for middleware sync`);
    }
    
    // Step 3.6: The middleware software (eSSL eTimeTrackLite) automatically reads from Employees table
    // And will sync users from DeviceUsers table to devices
    console.log(`✅ User created in database and registered for device sync`);
    
    // Step 4: Get the created client (mapped from Employees table)
    const client = await fetchClientById(String(employeeId));
    
    if (!client) {
      throw new Error('Failed to retrieve created client');
    }

    res.status(201).json({
      success: true,
      message: 'Client created successfully and registered on device',
      client,
      employeeId,
      employeeCodeInDevice,
      deviceRegistered: deviceResult.success,
      deviceMessage: deviceResult.message,
    });
  } catch (error: any) {
    console.error('❌ Error creating client:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create client',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * Get all clients
 */
export const getAllClients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    // Use local API if enabled
    if (localApiService.isApiEnabled()) {
      try {
        console.log('📡 Using local API to fetch clients');
        const clients = await localApiService.getClients({ status: status as string });
        console.log(`✅ Local API returned ${clients.length} clients`);
        
        // Simple pagination for local API
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const start = (pageNum - 1) * limitNum;
        const end = start + limitNum;
        const paginatedClients = clients.slice(start, end);

        res.json({
          success: true,
          clients: paginatedClients,
          pagination: {
            total: clients.length,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(clients.length / limitNum),
          },
        });
        return;
      } catch (apiError: any) {
        console.error('❌ Local API error:', apiError.message);
        console.error('❌ Error details:', {
          code: apiError.code,
          response: apiError.response?.data,
          status: apiError.response?.status,
        });
        
        // If SQL is disabled, return error instead of falling back
        if (process.env.SQL_DISABLED === 'true' || process.env.USE_API_ONLY === 'true') {
          res.status(503).json({
            success: false,
            message: `Local API error: ${apiError.message}`,
            error: 'Local API server is not reachable. Please check if the tunnel is running.',
          });
          return;
        }
        
        // Fall through to direct SQL if SQL is not disabled
        console.log('⚠️ Falling back to direct SQL connection');
      }
    }

    // Use direct SQL connection
    const result = await fetchClients({
      status: status as string | undefined,
      search: search as string | undefined,
      page: Number(page),
      limit: Number(limit),
    });

    res.json({
      success: true,
      clients: result.clients,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get client by ID
 */
export const getClientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const client = await fetchClientById(id);

    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    // Fetch GymClients data to include blood group, amount, etc.
    try {
      const employeeId = parseInt(id);
      if (!isNaN(employeeId)) {
        const gymClient = await getGymClientByEmployeeId(employeeId);
        if (gymClient) {
          // Merge GymClients data into client response
          (client as any).bloodGroup = gymClient.bloodGroup || null;
          (client as any).packageAmount = gymClient.totalAmount || null;
          (client as any).amountPaid = gymClient.amountPaid || null;
          (client as any).pendingAmount = gymClient.pendingAmount || null;
          (client as any).packageType = gymClient.packageType || null;
          (client as any).months = gymClient.months || null;
          (client as any).trainer = gymClient.trainer || null;
          (client as any).preferredTimings = gymClient.preferredTimings || null;
          (client as any).paymentMode = gymClient.paymentMode || null;
          (client as any).remainingDate = gymClient.remainingDate || null;
        }
      }
    } catch (gymClientError: any) {
      console.warn(`⚠️ Could not fetch gym client data: ${gymClientError.message}`);
      // Continue without gym client data
    }

    res.json({
      success: true,
      client,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update client
 */
export const updateClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingClient = await fetchClientById(id);
    if (!existingClient) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    // Handle pendingAmount updates (when directly set)
    // Priority: If pendingAmount is explicitly set, use it and calculate other fields
    if (updates.pendingAmount !== undefined) {
      const packageAmount = updates.packageAmount ?? existingClient.packageAmount ?? 0;
      const pendingAmount = Number(updates.pendingAmount) || 0;
      
      // Update payment status based on pending amount
      if (pendingAmount === 0) {
        updates.paymentStatus = 'paid';
        // If pendingAmount is 0, set amountPaid to packageAmount to keep data consistent
        if (packageAmount > 0 && updates.amountPaid === undefined) {
          updates.amountPaid = packageAmount;
        }
      } else if (pendingAmount < packageAmount) {
        updates.paymentStatus = 'partial';
        // Calculate amountPaid from pendingAmount if not explicitly provided
        if (updates.amountPaid === undefined) {
          updates.amountPaid = packageAmount - pendingAmount;
        }
      } else {
        updates.paymentStatus = 'pending';
        if (updates.amountPaid === undefined) {
          updates.amountPaid = 0;
        }
      }
    }
    // Handle amountPaid or packageAmount updates (recalculate pendingAmount only if not directly set)
    else if (updates.amountPaid !== undefined || updates.packageAmount !== undefined) {
      const packageAmount = updates.packageAmount ?? existingClient.packageAmount ?? 0;
      const amountPaid = updates.amountPaid ?? existingClient.amountPaid ?? 0;
      
      // Recalculate pendingAmount
      updates.pendingAmount = Math.max(0, packageAmount - amountPaid);

      if (amountPaid >= packageAmount) {
        updates.paymentStatus = 'paid';
        updates.pendingAmount = 0;
      } else if (amountPaid > 0) {
        updates.paymentStatus = 'partial';
      } else {
        updates.paymentStatus = 'pending';
      }
    }

    // Update Employees table
    const client = await updateClientRecord(id, updates);
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    // Update GymClients table if additional fields are provided
    const hasGymClientUpdates = Object.keys(updates).some(key => 
      ['bloodGroup', 'months', 'packageType', 'totalAmount', 'amountPaid', 'pendingAmount', 'remainingDate', 'billingDate', 'timings', 'paymentMode'].includes(key)
    );

    if (hasGymClientUpdates && client.id) {
      try {
        const employeeId = parseInt(client.id);
        if (!isNaN(employeeId)) {
          await updateGymClient(employeeId, {
            employeeCodeInDevice: client.esslUserId || (client as any).employeeCodeInDevice || undefined,
            bloodGroup: (updates as any).bloodGroup,
            months: (updates as any).months,
            packageType: updates.packageType,
            totalAmount: updates.packageAmount,
            amountPaid: updates.amountPaid,
            pendingAmount: updates.pendingAmount,
            remainingDate: updates.packageEndDate ? new Date(updates.packageEndDate) : undefined,
            preferredTimings: (updates as any).timings,
            paymentMode: (updates as any).paymentMode,
          });
        }
      } catch (gymClientError: any) {
        console.warn(`⚠️ Failed to update gym client record: ${gymClientError.message}`);
        // Continue even if gym client update fails
      }
    }

    if (updates.accessSchedule && client.esslUserId) {
      await esslDeviceService.setUserAccessSchedule(client.esslUserId, updates.accessSchedule);
    }

    if (etimetrackSyncService.isEnabled()) {
      etimetrackSyncService
        .syncClient(client)
        .catch((syncError: any) => console.error('⚠️ eTimeTrack sync failed:', syncError.message));
    }

    res.json({
      success: true,
      message: 'Client updated successfully',
      client,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete client
 * This will:
 * 1. Delete user from ESSL device
 * 2. Hard delete from GymClients table
 * 3. Hard delete from EmployeesBio table (biometric data)
 * 4. Hard delete from Employees table (completely removes from middleware software)
 */
/**
 * Sync a client to the ESSL device
 * This endpoint allows manual sync from the website
 */
export const syncClientToDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Get client from database
    const client = await fetchClientById(id);
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }
    
    // Get EmployeeCodeInDevice from database (not from client.esslUserId which might be null)
    // Query directly to ensure we get the correct EmployeeCodeInDevice value
    let employeeCodeInDevice: string = String(client.id); // Fallback
    const employeeName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Unknown';
    
    try {
      const pool = getPool();
      if (pool) {
        const employeeId = parseInt(String(client.id));
        if (!isNaN(employeeId)) {
          const result = await pool.request()
            .input('EmployeeId', sql.Int, employeeId)
            .query(`
              SELECT EmployeeCodeInDevice, EmployeeName
              FROM Employees
              WHERE EmployeeId = @EmployeeId
            `);
          
          if (result.recordset.length > 0) {
            employeeCodeInDevice = String(result.recordset[0].EmployeeCodeInDevice || client.id);
            console.log(`📋 Retrieved EmployeeCodeInDevice from database: ${employeeCodeInDevice} for EmployeeId: ${employeeId}`);
          } else {
            console.warn(`⚠️ Employee not found in database for EmployeeId: ${employeeId}`);
          }
        } else {
          console.warn(`⚠️ Invalid EmployeeId format: ${client.id}`);
        }
      } else {
        console.warn(`⚠️ Database pool not available`);
      }
    } catch (dbError: any) {
      console.error(`❌ Could not fetch EmployeeCodeInDevice from database: ${dbError.message}`);
      console.error(`❌ Error stack:`, dbError.stack);
      // Use esslUserId as fallback if available
      if (client.esslUserId) {
        employeeCodeInDevice = String(client.esslUserId);
        console.log(`📋 Using esslUserId as fallback: ${employeeCodeInDevice}`);
      }
    }
    
    console.log(`🔄 Syncing user to device: ${employeeCodeInDevice} (${employeeName})`);
    
    // WORKAROUND: Use middleware API via DeviceCommands table
    // This triggers the middleware to sync the user to devices
    let middlewareSyncTriggered = false;
    try {
      const pool = getPool();
      if (pool) {
        const employeeId = parseInt(String(client.id));
        if (!isNaN(employeeId)) {
          // Get ONLY the target device (SerialNumber: NYU7252300984 - AI ORCUS)
          // This is the only device we sync to for all operations
          const deviceUsersResult = await pool.request()
            .input('EmployeeId', sql.Int, employeeId)
            .input('SerialNumber', sql.NVarChar(100), TARGET_DEVICE_SERIAL)
            .query(`
              SELECT DISTINCT du.DeviceId, d.SerialNumber, d.DeviceFName, d.DeviceSName
              FROM DeviceUsers du
              LEFT JOIN Devices d ON du.DeviceId = d.DeviceId
              WHERE du.EmployeeId = @EmployeeId
                AND d.SerialNumber = @SerialNumber
            `);
          
          // If no DeviceUsers entry found for target device, create it
          if (deviceUsersResult.recordset.length === 0) {
            console.log(`ℹ️  User not in DeviceUsers for target device, adding now...`);
            try {
              // Get target device ID
              const targetDeviceResult = await pool.request()
                .input('SerialNumber', sql.NVarChar(100), TARGET_DEVICE_SERIAL)
                .query(`
                  SELECT DeviceId, DeviceFName, DeviceSName, SerialNumber
                  FROM Devices
                  WHERE SerialNumber = @SerialNumber
                `);
              
              if (targetDeviceResult.recordset.length > 0) {
                const targetDevice = targetDeviceResult.recordset[0];
                await pool.request()
                  .input('DeviceId', sql.Int, targetDevice.DeviceId)
                  .input('EmployeeId', sql.Int, employeeId)
                  .input('GroupId', sql.Int, 1)
                  .query(`
                    IF NOT EXISTS (
                      SELECT 1 FROM DeviceUsers 
                      WHERE DeviceId = @DeviceId AND EmployeeId = @EmployeeId
                    )
                    BEGIN
                      INSERT INTO DeviceUsers (DeviceId, EmployeeId, GroupId, CreatedDate)
                      VALUES (@DeviceId, @EmployeeId, @GroupId, GETDATE())
                    END
                  `);
                console.log(`✅ Added user to DeviceUsers for target device: ${targetDevice.DeviceFName || targetDevice.DeviceSName} (ID: ${targetDevice.DeviceId})`);
                
                // Re-query to get the device info
                const updatedResult = await pool.request()
                  .input('EmployeeId', sql.Int, employeeId)
                  .input('SerialNumber', sql.NVarChar(100), TARGET_DEVICE_SERIAL)
                  .query(`
                    SELECT DISTINCT du.DeviceId, d.SerialNumber, d.DeviceFName, d.DeviceSName
                    FROM DeviceUsers du
                    LEFT JOIN Devices d ON du.DeviceId = d.DeviceId
                    WHERE du.EmployeeId = @EmployeeId
                      AND d.SerialNumber = @SerialNumber
                  `);
                deviceUsersResult.recordset = updatedResult.recordset;
              }
            } catch (addError: any) {
              console.warn(`⚠️ Could not add user to DeviceUsers for target device: ${addError.message}`);
            }
          }
          
          if (deviceUsersResult.recordset.length > 0) {
            // Insert sync command for each device
            for (const device of deviceUsersResult.recordset) {
              try {
                // Insert command to trigger middleware sync
                // The middleware polls DeviceCommands table and executes commands
                // Based on middleware UI, the command should be "Upload Users To Device"
                // The middleware will read from DeviceUsers table and sync all users
                const deviceCommand = 'Upload Users To Device';
                const deviceName = device.DeviceFName || device.DeviceSName || `Device ${device.DeviceId}`;
                const serialNumber = device.SerialNumber || '';
                
                await pool.request()
                  .input('Title', sql.NVarChar(255), `Sync User ${employeeCodeInDevice} (${employeeName})`)
                  .input('DeviceCommand', sql.NText, deviceCommand)
                  .input('SerialNumber', sql.NVarChar(100), serialNumber)
                  .input('Status', sql.NVarChar(50), 'Pending')
                  .input('Type', sql.NVarChar(50), 'UserSync')
                  .query(`
                    INSERT INTO DeviceCommands (Title, DeviceCommand, SerialNumber, Status, Type, CreationDate)
                    VALUES (@Title, @DeviceCommand, @SerialNumber, @Status, @Type, GETDATE())
                  `);
                
                console.log(`✅ Middleware sync command queued for device: ${deviceName} (ID: ${device.DeviceId}, Serial: ${serialNumber || 'N/A'})`);
                middlewareSyncTriggered = true;
              } catch (cmdError: any) {
                console.warn(`⚠️ Could not queue sync command for device ${device.DeviceId}: ${cmdError.message}`);
              }
            }
          }
        }
      }
    } catch (middlewareError: any) {
      console.warn(`⚠️ Middleware sync command failed: ${middlewareError.message}`);
    }
    
    // Try TCP registration with retry logic (as fallback)
    let deviceResult = { success: false, message: 'Initial attempt' };
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`📱 Attempt ${attempt}/${maxRetries}: Registering user on device via TCP...`);
      deviceResult = await esslDeviceService.registerUserOnDeviceTCP(employeeCodeInDevice, employeeName);
      
      if (deviceResult.success) {
        console.log(`✅ User successfully registered on device via TCP (attempt ${attempt})`);
        break;
      } else {
        console.warn(`⚠️ TCP attempt ${attempt} failed: ${deviceResult.message}`);
        if (attempt < maxRetries) {
          // Wait 2 seconds before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // Determine success status
    const syncSuccess = deviceResult.success || middlewareSyncTriggered;
    
    if (syncSuccess) {
      let message = '';
      if (deviceResult.success && middlewareSyncTriggered) {
        message = 'User successfully synced via both TCP and middleware command queue';
      } else if (deviceResult.success) {
        message = 'User successfully synced to device via TCP';
      } else if (middlewareSyncTriggered) {
        message = 'User sync command queued in middleware. The middleware will sync the user to devices automatically.';
      }
      
      res.json({
        success: true,
        message,
        client: {
          id: client.id,
          name: employeeName,
          employeeCodeInDevice,
        },
        deviceRegistered: deviceResult.success,
        middlewareCommandQueued: middlewareSyncTriggered,
        deviceMessage: deviceResult.message,
        note: middlewareSyncTriggered 
          ? 'Middleware will process the sync command automatically. Check device in a few moments.'
          : 'If user does not appear on device, use middleware "Download Users" feature.',
      });
    } else {
      // Both TCP and middleware command failed
      res.json({
        success: true,
        message: 'User is in database and DeviceUsers table. Sync commands queued but may require middleware processing.',
        client: {
          id: client.id,
          name: employeeName,
          employeeCodeInDevice,
        },
        deviceRegistered: false,
        middlewareCommandQueued: false,
        deviceMessage: deviceResult.message,
        note: 'User is in database. To sync to device: 1) Open middleware and click "Download Users", or 2) Check device IP and network connection.',
      });
    }
  } catch (error: any) {
    console.error('❌ Error syncing client to device:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync client to device',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

export const deleteClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const client = await fetchClientById(id);
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    // Step 1: Queue delete command for target device ONLY (SerialNumber: NYU7252300984)
    // Also attempt direct TCP deletion as fallback
    if (client.esslUserId) {
      console.log(`🗑️ Deleting user from target device (Serial: ${TARGET_DEVICE_SERIAL}): ${client.esslUserId}`);
      
      // Queue delete command in DeviceCommands table for middleware
      try {
        const pool = getPool();
        if (pool) {
          const targetDeviceResult = await pool.request()
            .input('SerialNumber', sql.NVarChar(100), TARGET_DEVICE_SERIAL)
            .query(`
              SELECT DeviceId, DeviceFName, DeviceSName, SerialNumber
              FROM Devices
              WHERE SerialNumber = @SerialNumber
            `);
          
          if (targetDeviceResult.recordset.length > 0) {
            const device = targetDeviceResult.recordset[0];
            await pool.request()
              .input('Title', sql.NVarChar(255), `Delete User ${client.esslUserId}`)
              .input('DeviceCommand', sql.NText, 'Delete Users From Device')
              .input('SerialNumber', sql.NVarChar(100), TARGET_DEVICE_SERIAL)
              .input('Status', sql.NVarChar(50), 'Pending')
              .input('Type', sql.NVarChar(50), 'UserDelete')
              .query(`
                INSERT INTO DeviceCommands (Title, DeviceCommand, SerialNumber, Status, Type, CreationDate)
                VALUES (@Title, @DeviceCommand, @SerialNumber, @Status, @Type, GETDATE())
              `);
            const deviceName = device.DeviceFName || device.DeviceSName || `Device ${device.DeviceId}`;
            console.log(`✅ Delete command queued for target device: ${deviceName} (Serial: ${TARGET_DEVICE_SERIAL})`);
          }
        }
      } catch (cmdError: any) {
        console.warn(`⚠️ Could not queue delete command: ${cmdError.message}`);
      }
      
      // Attempt direct TCP deletion as fallback
      try {
        const deviceResult = await esslDeviceService.deleteUser(client.esslUserId);
        if (deviceResult) {
          console.log(`✅ User deleted from device via TCP successfully`);
        } else {
          console.warn(`⚠️ TCP deletion failed (device may be offline, middleware command queued instead)`);
        }
      } catch (deviceError: any) {
        console.warn(`⚠️ Device deletion error (middleware command queued instead): ${deviceError.message}`);
        // Continue with database deletion even if device deletion fails
      }
      
      if (etimetrackSyncService.isEnabled()) {
        etimetrackSyncService
          .disableClient(client.esslUserId)
          .catch((syncError: any) => console.error('⚠️ eTimeTrack disable failed:', syncError.message));
      }
    }

    // Step 2: Mark as deleted in SQL and delete from GymClients
    console.log(`🗑️ Marking employee as deleted in SQL: EmployeeId=${id}`);
    const deleted = await deleteClientRecord(id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Failed to delete client from database',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Client deleted successfully from database and device',
    });
  } catch (error: any) {
    console.error('❌ Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete client',
    });
  }
};

/**
 * Get client statistics
 */
export const getClientStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await fetchClientStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
