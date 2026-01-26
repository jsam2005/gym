import { Request, Response } from 'express';
import { isSqlDisabled } from '../config/database.js';
import { syncGymClientsForAllEmployees } from '../data/gymClientRepository.js';

/**
 * Sync GymClients records for all employees
 * Creates GymClients records for employees that don't have one
 */
export const syncGymClients = async (req: Request, res: Response): Promise<void> => {
  try {
    if (isSqlDisabled()) {
      res.status(503).json({
        success: false,
        error: 'SQL is disabled. Cannot sync GymClients.',
        message: 'Enable SQL connection to sync data.',
      });
      return;
    }

    console.log('🔄 Starting GymClients sync...');
    const result = await syncGymClientsForAllEmployees();
    
    res.json({
      success: true,
      message: `Sync completed: ${result.created} created, ${result.skipped} skipped, ${result.errors} errors`,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Sync error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to sync GymClients',
    });
  }
};
