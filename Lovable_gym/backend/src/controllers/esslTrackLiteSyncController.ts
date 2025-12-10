import { Request, Response } from 'express';
import { createClient as createClientRecord, getClientByEsslId } from '../data/clientRepository.js';
import tracklieService from '../services/tracklieService.js';
import { isSqlDisabled } from '../config/database.js';

/**
 * Import ESSL TrackLite users/employees as clients
 */
export const importTrackLiteUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if SQL is enabled (needed to create clients)
    if (isSqlDisabled()) {
      res.status(400).json({
        success: false,
        message: 'SQL connection is required to import users. Set SQL_DISABLED=false in .env file.',
      });
      return;
    }

    console.log('🔄 Starting ESSL TrackLite user import...');

    // Get all users from TrackLite
    const trackLiteUsers = await tracklieService.getUsers();

    if (trackLiteUsers.length === 0) {
      res.json({
        success: true,
        message: 'No users found in ESSL TrackLite',
        imported: 0,
        skipped: 0,
        total: 0,
        errors: [],
      });
      return;
    }

    let imported = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (const user of trackLiteUsers) {
      try {
        // Extract user ID (try different field names)
        const userId = user.PIN || user.UserID || user.BadgeNumber || user.EmployeeID || user.Id || user.userId;
        const userName = user.Name || user.EmployeeName || user.UserName || user.name || 'Unknown User';
        const phone = user.Phone || user.PhoneNumber || user.Mobile || '';
        const email = user.Email || user.EmailAddress || `${userId}@tracklite.local`;

        if (!userId) {
          console.warn(`⚠️ Skipping user without ID:`, userName);
          skipped++;
          continue;
        }

        // Check if client already exists
        const existing = await getClientByEsslId(userId.toString());
        if (existing) {
          console.log(`⏭️ Skipping existing user: ${userName} (${userId})`);
          skipped++;
          continue;
        }

        // Parse name
        const nameParts = userName.split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || 'User';

        // Create client
        await createClientRecord({
          firstName,
          lastName,
          email: email || `${userId}@tracklite.local`,
          phone: phone || '0000000000',
          dateOfBirth: new Date('2000-01-01').toISOString(),
          gender: user.Gender || 'other',
          address: user.Address || 'To be updated',
          emergencyContact: {
            name: 'To be updated',
            phone: '0000000000',
            relation: 'Other',
          },
          packageType: 'Monthly',
          packageStartDate: new Date().toISOString(),
          packageEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          packageAmount: 0,
          amountPaid: 0,
          pendingAmount: 0,
          paymentStatus: 'pending',
          esslUserId: userId.toString(),
          fingerprintEnrolled: false, // Will be enrolled later
          accessSchedule: [
            { day: 'monday', startTime: '06:00', endTime: '22:00', enabled: true },
            { day: 'tuesday', startTime: '06:00', endTime: '22:00', enabled: true },
            { day: 'wednesday', startTime: '06:00', endTime: '22:00', enabled: true },
            { day: 'thursday', startTime: '06:00', endTime: '22:00', enabled: true },
            { day: 'friday', startTime: '06:00', endTime: '22:00', enabled: true },
            { day: 'saturday', startTime: '08:00', endTime: '20:00', enabled: true },
            { day: 'sunday', startTime: '08:00', endTime: '20:00', enabled: true },
          ],
          isAccessActive: true,
          status: 'active',
        });

        console.log(`✅ Imported: ${userName} (${userId})`);
        imported++;
      } catch (err: any) {
        console.error(`❌ Error importing user:`, err.message);
        errors.push({
          userId: user.PIN || user.UserID || 'unknown',
          name: user.Name || user.EmployeeName || 'Unknown',
          error: err.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Import completed: ${imported} imported, ${skipped} skipped`,
      imported,
      skipped,
      total: trackLiteUsers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('❌ Error importing TrackLite users:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get TrackLite users (for preview before import)
 */
export const getTrackLiteUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await tracklieService.getUsers();
    
    res.json({
      success: true,
      users: users.map((user: any) => ({
        id: user.PIN || user.UserID || user.BadgeNumber || user.EmployeeID || user.Id,
        name: user.Name || user.EmployeeName || user.UserName || 'Unknown',
        phone: user.Phone || user.PhoneNumber || user.Mobile || '',
        email: user.Email || user.EmailAddress || '',
        department: user.Department || user.Dept || '',
      })),
      count: users.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

