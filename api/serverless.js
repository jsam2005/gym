// Vercel serverless function wrapper for Express app
// This file handles all API routes and iClock routes

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

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
(async () => {
  try {
    const { default: connectDB } = await import('../backend/dist/config/database.js');
    await connectDB();
  } catch (err) {
    console.error('Database connection error (non-fatal):', err.message);
  }
})();

// Debug endpoint - always available
app.get('/api/debug', (req, res) => {
  res.json({
    env: {
      ETIME_SQL_SERVER: process.env.ETIME_SQL_SERVER ? '***set***' : 'not set',
      ETIME_SQL_DB: process.env.ETIME_SQL_DB || 'not set',
      ETIME_SQL_USER: process.env.ETIME_SQL_USER || 'not set',
      ETIME_SQL_PASSWORD: process.env.ETIME_SQL_PASSWORD ? '***set***' : 'not set',
      SQL_DISABLED: process.env.SQL_DISABLED || 'not set',
      USE_API_ONLY: process.env.USE_API_ONLY || 'not set',
      FRONTEND_URL: process.env.FRONTEND_URL || 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set',
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check - always available
app.get('/api/health', async (req, res) => {
  try {
    const dbConfig = {
      server: process.env.ETIME_SQL_SERVER || 'not set',
      database: process.env.ETIME_SQL_DB || 'not set',
      user: process.env.ETIME_SQL_USER || 'not set',
      sqlDisabled: process.env.SQL_DISABLED || 'not set',
      useApiOnly: process.env.USE_API_ONLY || 'not set',
    };
    
    let dbStatus = 'unknown';
    try {
      const { getPool } = await import('../backend/dist/config/database.js');
      const pool = getPool();
      dbStatus = pool.connected ? 'connected' : 'not connected';
    } catch (dbError) {
      dbStatus = `error: ${dbError.message}`;
    }
    
    res.json({ 
      status: 'OK', 
      message: 'Server is running', 
      timestamp: new Date(),
      platform: 'Vercel Serverless',
      database: {
        configured: !!process.env.ETIME_SQL_SERVER,
        server: dbConfig.server,
        database: dbConfig.database,
        sqlDisabled: dbConfig.sqlDisabled,
        useApiOnly: dbConfig.useApiOnly,
        connectionStatus: dbStatus,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        frontendUrl: process.env.FRONTEND_URL || 'not set',
      },
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Server error', 
      timestamp: new Date(),
      error: error.message,
    });
  }
});

// Load routes dynamically with error handling
let routesLoaded = false;
const loadRoutes = async () => {
  if (routesLoaded) return true;
  
  try {
    const clientRoutes = (await import('../backend/dist/routes/clientRoutes.js')).default;
    const packageRoutes = (await import('../backend/dist/routes/packageRoutes.js')).default;
    const biometricRoutes = (await import('../backend/dist/routes/biometricRoutes.js')).default;
    const accessLogRoutes = (await import('../backend/dist/routes/accessLogRoutes.js')).default;
    const settingsRoutes = (await import('../backend/dist/routes/settingsRoutes.js')).default;
    const directESSLRoutes = (await import('../backend/dist/routes/directESSLRoutes.js')).default;
    const tracklieRoutes = (await import('../backend/dist/routes/tracklieRoutes.js')).default;
    const etimetrackRoutes = (await import('../backend/dist/routes/etimetrackRoutes.js')).default;
    const esslTrackLiteApiRoutes = (await import('../backend/dist/routes/esslTrackLiteApiRoutes.js')).default;
    const { errorHandler } = await import('../backend/dist/middleware/errorHandler.js');
    const { handleIClockCData, handleIClockGetRequest } = await import('../backend/dist/controllers/directESSLController.js');

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

    // Error handler middleware
    app.use(errorHandler);
    
    routesLoaded = true;
    return true;
  } catch (routeError) {
    console.error('Error loading routes:', routeError);
    console.error('Stack:', routeError.stack);
    return false;
  }
};

// Middleware to load routes on first request
app.use(async (req, res, next) => {
  // Skip for debug and health endpoints
  if (req.path === '/api/debug' || req.path === '/api/health') {
    return next();
  }
  
  const loaded = await loadRoutes();
  if (!loaded && !routesLoaded) {
    return res.status(500).json({
      success: false,
      message: 'Routes failed to load. Check server logs.',
      path: req.path,
    });
  }
  next();
});

// Enhanced error handling
app.use((err, req, res, next) => {
  console.error('API Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
  
  if (!res.headersSent) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
      path: req.path,
    });
  }
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Export for Vercel
export default app;
