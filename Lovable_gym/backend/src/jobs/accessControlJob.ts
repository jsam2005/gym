import cron from 'node-cron';
import {
  getExpiredActiveClients,
  getExpiringClients,
  updateClient as updateClientRecord,
} from '../data/clientRepository.js';
import esslDeviceService from '../services/esslDeviceService.js';

/**
 * Cron job to check expired packages and disable access
 * Runs every day at 1 AM
 */
export const startAccessControlJob = () => {
  console.log('🕒 Starting access control cron job...');

  // Run every day at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('⏰ Running daily access control check...');
    
    try {
      const now = new Date();
      
      // Find all clients with expired packages that still have active access
      const expiredClients = await getExpiredActiveClients(now);

      console.log(`📋 Found ${expiredClients.length} clients with expired packages`);

      for (const client of expiredClients) {
        console.log(`🔒 Disabling access for ${client.firstName} ${client.lastName} (expired: ${client.packageEndDate})`);
        
        // Update client status
        await updateClientRecord(client.id, {
          status: 'expired',
          isAccessActive: false,
        });

        // Disable on ESSL device
        if (client.esslUserId) {
          await esslDeviceService.updateUserStatus(client.esslUserId, false);
        }
      }

      // Find clients whose packages are about to expire (within 7 days)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const expiringClients = await getExpiringClients(now, sevenDaysFromNow);

      console.log(`⚠️ Found ${expiringClients.length} clients with packages expiring soon`);
      
      // Here you can add notification logic (email, SMS, etc.)
      for (const client of expiringClients) {
        const packageEnd = client.packageEndDate ? new Date(client.packageEndDate) : now;
        const daysLeft = Math.ceil((packageEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`⚠️ ${client.firstName} ${client.lastName}'s package expires in ${daysLeft} days`);
        // TODO: Send notification
      }

      console.log('✅ Access control check completed');
    } catch (error: any) {
      console.error('❌ Error in access control job:', error.message);
    }
  });

  console.log('✅ Access control cron job started (runs daily at 1:00 AM)');
};

/**
 * Manual trigger for testing
 */
export const runAccessControlCheckNow = async (): Promise<{
  expiredCount: number;
  expiringCount: number;
}> => {
  console.log('🔄 Running manual access control check...');
  
  try {
    const now = new Date();
    
    const expiredClients = await getExpiredActiveClients(now);

    for (const client of expiredClients) {
      await updateClientRecord(client.id, {
        status: 'expired',
        isAccessActive: false,
      });

      if (client.esslUserId) {
        await esslDeviceService.updateUserStatus(client.esslUserId, false);
      }
    }

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringClients = await getExpiringClients(now, sevenDaysFromNow);

    return {
      expiredCount: expiredClients.length,
      expiringCount: expiringClients.length
    };
  } catch (error: any) {
    console.error('❌ Error in manual access control check:', error.message);
    throw error;
  }
};



















