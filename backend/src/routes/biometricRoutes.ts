import { Router } from 'express';
import {
  testDeviceConnection,
  registerClientOnDevice,
  enrollFingerprint,
  updateAccessSchedule,
  handleAccessAttempt,
  getClientAccessLogs,
  getAllAccessLogs,
  toggleClientAccess,
  deleteClientFromDevice,
  getAccessDashboard,
  migrateUsersFromDevice,
} from '../controllers/biometricController.js';
import { migrateESSLUsers } from '../controllers/migrationController.js';

const router = Router();

// Device management
router.get('/device/test', testDeviceConnection);

// Migration
router.post('/migrate', migrateESSLUsers);
router.post('/migrate-users', migrateUsersFromDevice);

// Client biometric registration
router.post('/register', registerClientOnDevice);
router.post('/enroll', enrollFingerprint);
router.put('/schedule', updateAccessSchedule);
router.put('/toggle/:clientId', toggleClientAccess);
router.delete('/client/:clientId', deleteClientFromDevice);

// Access logs
router.get('/logs', getAllAccessLogs);
router.get('/logs/:clientId', getClientAccessLogs);
router.get('/dashboard', getAccessDashboard);

// Webhook from ESSL device (called when fingerprint is scanned)
router.post('/access-attempt', handleAccessAttempt);

export default router;
