// Vercel serverless function wrapper for Express app
// This file handles all API routes and iClock routes

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import clientRoutes from '../backend/dist/routes/clientRoutes.js';
import packageRoutes from '../backend/dist/routes/packageRoutes.js';
import biometricRoutes from '../backend/dist/routes/biometricRoutes.js';
import accessLogRoutes from '../backend/dist/routes/accessLogRoutes.js';
import settingsRoutes from '../backend/dist/routes/settingsRoutes.js';
import directESSLRoutes from '../backend/dist/routes/directESSLRoutes.js';
import tracklieRoutes from '../backend/dist/routes/tracklieRoutes.js';
import etimetrackRoutes from '../backend/dist/routes/etimetrackRoutes.js';
import esslTrackLiteApiRoutes from '../backend/dist/routes/esslTrackLiteApiRoutes.js';
import { errorHandler } from '../backend/dist/middleware/errorHandler.js';
import { handleIClockCData, handleIClockGetRequest } from '../backend/dist/controllers/directESSLController.js';
import connectDB from '../backend/dist/config/database.js';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || '*',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: ['text/plain', 'text/html', 'application/x-www-form-urlencoded'] }));
app.use(morgan('dev'));

// Initialize database connection (non-blocking)
connectDB().catch(err => {
  console.warn('Database connection warning:', err.message);
});

// Routes
app.use('/api/clients', clientRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/biometric', biometricRoutes);
app.use('/api/access-logs', accessLogRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/direct-essl', directESSLRoutes);
app.use('/api/tracklie', tracklieRoutes);
app.use('/api/etimetrack', etimetrackRoutes);
app.use('/api/essl-tracklite', esslTrackLiteApiRoutes);

// iClock protocol endpoints
app.get('/iclock/cdata.aspx', handleIClockCData);
app.post('/iclock/cdata.aspx', handleIClockCData);
app.get('/iclock/getrequest.aspx', handleIClockGetRequest);
app.post('/iclock/getrequest.aspx', handleIClockGetRequest);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    res.json({ 
      status: 'OK', 
      message: 'Server is running', 
      timestamp: new Date(),
      platform: 'Vercel Serverless',
    });
  } catch (error) {
    res.json({ 
      status: 'OK', 
      message: 'Server is running', 
      timestamp: new Date(),
    });
  }
});

// Error handling
app.use(errorHandler);

// Export for Vercel
export default app;

