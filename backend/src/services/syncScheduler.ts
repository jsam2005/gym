import cron from 'node-cron';
import etimetrackSyncService from './etimetrackSyncService.js';
import tracklieService from './tracklieService.js';
import {
  getClientByEsslId,
  incrementAccessAttempt,
  updateClientByEsslId,
} from '../data/clientRepository.js';

type ProcessedLog = {
  userId?: string | null;
  timestamp: Date;
  accessGranted: boolean;
  reason: string;
  biometricType: 'fingerprint';
  deviceId?: string | null;
  source: 'direct-device' | 'etimetrack';
};

let lastCheckTime = new Date();
let lastEtimetrackSyncTime = new Date(Date.now() - 10 * 60 * 1000);
let ioInstance: any = null;

export const setSocketIO = (io: any) => {
  ioInstance = io;
};

const emitAccessEvent = async (log: ProcessedLog) => {
  const timestamp = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
  const userId = log.userId?.toString();
  const client = userId ? await getClientByEsslId(userId) : null;

  if (client) {
    await incrementAccessAttempt(client.id, timestamp.toISOString());
    if (log.accessGranted) {
    await updateClientByEsslId(userId!, { lastAccessTime: timestamp.toISOString() });
            }
  }

  if (ioInstance) {
    ioInstance.emit('access_attempt', {
      userId,
      clientName: client ? `${client.firstName} ${client.lastName}` : 'Unknown',
      allowed: log.accessGranted,
      reason: log.reason,
      timestamp,
      biometricType: log.biometricType,
    });
  }
};

async function fetchLogsFromEtimetrack(): Promise<ProcessedLog[]> {
  try {
    const since = lastEtimetrackSyncTime;
    const records = await etimetrackSyncService.fetchAttendanceSince(since);

    if (records.length > 0) {
      const lastRecord = records[records.length - 1];
      const ts = lastRecord.timestamp instanceof Date ? lastRecord.timestamp : new Date(lastRecord.timestamp);
      lastEtimetrackSyncTime = new Date(ts.getTime() + 1000);
    }

    return records.map((record) => ({
      userId: record.userId ?? undefined,
      timestamp: record.timestamp instanceof Date ? record.timestamp : new Date(record.timestamp),
      accessGranted: true,
      reason: 'eTimeTrack Punch',
      biometricType: 'fingerprint',
      deviceId: record.deviceId || 'ETIMETRACK',
      source: 'etimetrack',
    }));
  } catch (error: any) {
    console.error('❌ Error fetching eTimeTrack logs:', error.message);
    return [];
  }
}

async function collectLogsFromPreferredSource(): Promise<ProcessedLog[]> {
  // Skip SQL operations if SQL is disabled
  if (process.env.SQL_DISABLED === 'true' || process.env.USE_API_ONLY === 'true') {
    return [];
  }

  if (etimetrackSyncService.isEnabled()) {
    try {
    const sqlLogs = await fetchLogsFromEtimetrack();
    if (sqlLogs.length > 0) {
      return sqlLogs;
    }
    } catch (error: any) {
      // Silently fail if SQL is not available
      console.debug('⚠️  eTimeTrack sync skipped (SQL not available)');
    }
  }

  try {
    const start = lastCheckTime;
    const logs = await tracklieService.getAttendanceLogs(start, undefined, 200);
    lastCheckTime = new Date();
    return logs.map((log) => ({
      // DeviceLogs uses UserId (nvarchar(50)) which matches EmployeeCodeInDevice in Employees table
      userId: (log.UserId || log.PIN || log.UserID || log.BadgeNumber || log.EmployeeID || log.UserPin || log.EmployeeCodeInDevice)?.toString(),
      // DeviceLogs uses LogDate (datetime) field
      timestamp: log.LogDate ? new Date(log.LogDate) : (log.DateTime ? new Date(log.DateTime) : new Date()),
      accessGranted: true,
      reason: 'ESSL Device Check-in',
      biometricType: 'fingerprint',
      deviceId: log.DeviceId || log.DeviceIP || log.IPAddress || undefined,
      source: 'direct-device',
    }));
  } catch (error: any) {
    // Silently return empty array if SQL is not available
    if (error.message?.includes('disabled') || error.message?.includes('not connected')) {
      return [];
    }
    console.error('❌ Error fetching device logs:', error.message);
    return [];
  }
}

const processLogs = async (logs: ProcessedLog[]) => {
  for (const log of logs) {
    try {
      await emitAccessEvent(log);
    } catch (error: any) {
      console.error(`❌ Error processing log for user ${log.userId}:`, error.message);
    }
  }
};

export const manualSync = async () => {
  try {
    const deviceLogs = await collectLogsFromPreferredSource();
    if (deviceLogs.length === 0) {
      return { success: true, message: 'No new logs found', synced: 0 };
    }

    await processLogs(deviceLogs);
    return { success: true, message: `Processed ${deviceLogs.length} log(s)`, synced: deviceLogs.length };
  } catch (error: any) {
    console.error('❌ Error in manual sync:', error.message);
    throw error;
  }
};

export const startSyncScheduler = () => {
  // Skip scheduler if SQL is disabled
  if (process.env.SQL_DISABLED === 'true' || process.env.USE_API_ONLY === 'true') {
    console.log('⚠️  Sync scheduler disabled (SQL_DISABLED=true, using API mode)');
    return;
  }

  console.log('🕒 Starting device sync scheduler...');

  cron.schedule('*/30 * * * * *', async () => {
    try {
      const deviceLogs = await collectLogsFromPreferredSource();
      if (deviceLogs.length === 0) {
        if (!etimetrackSyncService.isEnabled()) {
          lastCheckTime = new Date();
        }
        return;
      }

      await processLogs(deviceLogs);
    } catch (error: any) {
      console.error('❌ Error syncing device logs:', error.message);
    }
  });

  console.log('✅ Device sync scheduler started (runs every 30 seconds)');
};
