import { Request, Response } from 'express';
import { getClientById } from '../data/clientRepository.js';
import etimetrackSyncService from '../services/etimetrackSyncService.js';
import { manualSync } from '../services/syncScheduler.js';
import etimetrackRealtimeService from '../services/etimetrackRealtimeService.js';

const toDate = (value?: string): Date | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export const getEtimetrackStatus = (req: Request, res: Response): void => {
  res.json({
    success: true,
    status: etimetrackSyncService.getStatus(),
  });
};

export const triggerEtimetrackManualSync = async (req: Request, res: Response): Promise<void> => {
  if (!etimetrackSyncService.isEnabled()) {
    res.status(400).json({
      success: false,
      message: 'eTimeTrack integration is disabled. Set ETIMETRACK_ENABLED=true in environment variables.',
    });
    return;
  }

  const result = await manualSync();
  res.json({
    success: true,
    result,
  });
};

export const syncClientWithEtimetrack = async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;

  const client = await getClientById(clientId);
  if (!client) {
    res.status(404).json({
      success: false,
      message: 'Client not found',
    });
    return;
  }

  if (!etimetrackSyncService.isEnabled()) {
    res.status(400).json({
      success: false,
      message: 'eTimeTrack integration is disabled. Enable ETIMETRACK_ENABLED to use this endpoint.',
    });
    return;
  }

  await etimetrackSyncService.syncClient(client);
  res.json({
    success: true,
    message: `Client ${client.firstName} ${client.lastName} synced to eTimeTrack`,
  });
};

export const testEtimetrackConnection = async (req: Request, res: Response): Promise<void> => {
  if (!etimetrackSyncService.isEnabled()) {
    res.status(400).json({
      success: false,
      message: 'eTimeTrack integration is disabled.',
    });
    return;
  }

  const ok = await etimetrackSyncService.testConnection();
  res.json({
    success: ok,
    message: ok ? 'Connected to eTimeTrack SQL successfully' : 'Failed to connect to eTimeTrack SQL',
  });
};

export const getEtimetrackRealtimeLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, limit, userId } = req.query;

    let parsedLimit: number | undefined;
    if (typeof limit === 'string') {
      const numericLimit = Number.parseInt(limit, 10);
      if (!Number.isNaN(numericLimit)) {
        parsedLimit = numericLimit;
      }
    }

    const logs = await etimetrackRealtimeService.fetchLogs({
      startDate: toDate(startDate as string | undefined),
      endDate: toDate(endDate as string | undefined),
      limit: parsedLimit,
      userId: userId as string | undefined,
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



