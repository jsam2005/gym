import { Router } from 'express';
import {
  getEtimetrackStatus,
  triggerEtimetrackManualSync,
  syncClientWithEtimetrack,
  testEtimetrackConnection,
  getEtimetrackRealtimeLogs,
} from '../controllers/etimetrackController.js';

const router = Router();

router.get('/status', getEtimetrackStatus);
router.get('/test-connection', testEtimetrackConnection);
router.get('/logs/realtime', getEtimetrackRealtimeLogs);
router.post('/manual-sync', triggerEtimetrackManualSync);
router.post('/clients/:clientId/sync', syncClientWithEtimetrack);

export default router;



