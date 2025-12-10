import { Router } from 'express';
import {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientStats,
  syncClientToDevice,
} from '../controllers/clientController.js';

const router = Router();

// Client CRUD
router.post('/', createClient);
router.get('/', getAllClients);
router.get('/stats', getClientStats);

// Device sync (must come before /:id to avoid route conflict)
router.post('/:id/sync-device', syncClientToDevice);

// Client by ID routes (must come after specific routes)
router.get('/:id', getClientById);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;
