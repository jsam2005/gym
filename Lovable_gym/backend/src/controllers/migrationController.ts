import { Request, Response } from 'express';
import {
  createClient as createClientRecord,
  getClientByEsslId,
} from '../data/clientRepository.js';
import esslDeviceService from '../services/esslDeviceService.js';

/**
 * Migrate ESSL users to website database
 */
export const migrateESSLUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔄 Starting ESSL user migration...');
    
    // Fetch all users from device
    const esslUsers = await esslDeviceService.getAllUsers();
    
    if (esslUsers.length === 0) {
      res.json({ 
        success: true, 
        message: 'No users found on device', 
        migrated: 0,
        skipped: 0,
        total: 0,
        errors: []
      });
      return;
    }

    let migrated = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (const esslUser of esslUsers) {
      try {
        const existing = esslUser.userId ? await getClientByEsslId(esslUser.userId) : null;
        
        if (existing) {
          console.log(`⏭️ Skipping existing user: ${esslUser.name} (${esslUser.userId})`);
          skipped++;
          continue;
        }

        // Fetch user's schedule from device
        const deviceSchedule = await esslDeviceService.getUserSchedule(esslUser.userId);
        
        // Convert device schedule to website format
        const accessSchedule = convertESSLScheduleToWebsite(deviceSchedule);

        // Create client in database
        const [firstName, ...lastNameParts] = esslUser.name.split(' ');
        
        await createClientRecord({
          firstName: firstName || 'Unknown',
          lastName: lastNameParts.join(' ') || 'User',
          email: `${esslUser.userId}@gym.local`, // Placeholder email
          phone: '0000000000', // Placeholder phone
          dateOfBirth: new Date('2000-01-01').toISOString(), // Placeholder DOB
          gender: 'other',
          address: 'To be updated',
          emergencyContact: {
            name: 'To be updated',
            phone: '0000000000',
            relation: 'Other'
          },
          packageType: 'Monthly',
          packageStartDate: new Date().toISOString(),
          packageEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          packageAmount: 0,
          amountPaid: 0,
          pendingAmount: 0,
          paymentStatus: 'pending',
          esslUserId: esslUser.userId,
          fingerprintEnrolled: true, // Already enrolled on device
          accessSchedule: accessSchedule,
          isAccessActive: esslUser.enabled !== false,
          status: 'active'
        });

        console.log(`✅ Migrated user: ${esslUser.name} (${esslUser.userId})`);
        migrated++;
      } catch (err: any) {
        console.error(`❌ Error migrating user ${esslUser.userId}:`, err.message);
        errors.push({ userId: esslUser.userId, name: esslUser.name, error: err.message });
      }
    }

    console.log(`🎉 Migration completed: ${migrated} migrated, ${skipped} skipped, ${errors.length} errors`);

    res.json({
      success: true,
      message: 'Migration completed',
      migrated,
      skipped,
      total: esslUsers.length,
      errors
    });
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Convert ESSL device schedule format to website format
 */
function convertESSLScheduleToWebsite(deviceSchedule: any[]): any[] {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // If device has schedule, convert it
  if (deviceSchedule && deviceSchedule.length > 0) {
    return deviceSchedule.map(schedule => ({
      day: days[schedule.weekday] || 'monday',
      startTime: schedule.startTime || '06:00',
      endTime: schedule.endTime || '22:00',
      enabled: schedule.enabled !== false
    }));
  }
  
  // Default schedule (Mon-Sat, 6 AM - 10 PM)
  return [
    { day: 'monday', startTime: '06:00', endTime: '22:00', enabled: true },
    { day: 'tuesday', startTime: '06:00', endTime: '22:00', enabled: true },
    { day: 'wednesday', startTime: '06:00', endTime: '22:00', enabled: true },
    { day: 'thursday', startTime: '06:00', endTime: '22:00', enabled: true },
    { day: 'friday', startTime: '06:00', endTime: '22:00', enabled: true },
    { day: 'saturday', startTime: '06:00', endTime: '22:00', enabled: true },
    { day: 'sunday', startTime: '06:00', endTime: '22:00', enabled: false }
  ];
}

