import express from 'express';
import { discoverDatabase, testConnection } from '../controllers/tracklieController.js';

const router = express.Router();

// Test connection
router.get('/test', testConnection);

// Discover database structure
router.get('/discover', discoverDatabase);

export default router;


