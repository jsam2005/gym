import { Router } from 'express';
import {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientStats,
} from '../controllers/clientController.js';

const router = Router();

// Client CRUD
router.post('/', createClient);
router.get('/', getAllClients);
router.get('/stats', getClientStats);
router.get('/:id', getClientById);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;
