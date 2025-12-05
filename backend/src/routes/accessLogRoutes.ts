import { Router } from 'express';
import { getAllAccessLogs, getClientAccessLogs } from '../controllers/biometricController.js';
import {
  getAccessLogs,
  createAccessLog,
  getAccessStats,
  cleanupOldLogs,
  resetAccessLogs,
  deleteAllAccessLogs,
  manualCheckIn,
  manualSync,
  testESSLDeviceCommunication,
  getUsers,
  getUserByPin,
  testConnection,
} from '../controllers/accessLogController.js';

const router = Router();

// Test connection
router.get('/test-connection', testConnection);

// Access logs routes
router.get('/', getAccessLogs);
router.post('/', createAccessLog);
router.post('/checkin', manualCheckIn);
router.post('/sync', manualSync);
router.get('/stats', getAccessStats);
router.delete('/cleanup', cleanupOldLogs);
router.post('/reset', resetAccessLogs);
router.delete('/all', deleteAllAccessLogs);
router.get('/test-device', testESSLDeviceCommunication);

// Tracklie users
router.get('/users', getUsers);
router.get('/users/:pin', getUserByPin);

// Legacy routes (aliased from biometric controller)
router.get('/all', getAllAccessLogs);
router.get('/:clientId', getClientAccessLogs);

export default router;
