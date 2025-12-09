// Vercel serverless function wrapper for Express app
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Debug endpoint - Define FIRST before any middleware that might fail
app.get('/api/debug', (req, res) => {
  try {
    const env = {
      ETIME_SQL_SERVER: process.env.ETIME_SQL_SERVER ? '***set***' : 'not set',
      ETIME_SQL_DB: process.env.ETIME_SQL_DB || 'not set',
      ETIME_SQL_USER: process.env.ETIME_SQL_USER || 'not set',
      ETIME_SQL_PASSWORD: process.env.ETIME_SQL_PASSWORD ? '***set***' : 'not set',
      SQL_DISABLED: process.env.SQL_DISABLED || 'not set',
      USE_API_ONLY: process.env.USE_API_ONLY || 'not set',
      LOCAL_API_URL: process.env.LOCAL_API_URL ? '***set***' : 'not set',
      FRONTEND_URL: process.env.FRONTEND_URL || 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set',
    };
    
    res.json({
      success: true,
      env,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
    });
  }
});

// Health endpoint - Define early
app.get('/api/health', (req, res) => {
  try {
    res.json({ 
      status: 'OK', 
      message: 'Server is running', 
      timestamp: new Date().toISOString(),
      platform: 'Vercel Serverless',
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Server error', 
      error: error.message,
    });
  }
});

// Middleware (with error handling)
try {
  app.use(helmet());
} catch (e) { console.warn('Helmet failed:', e.message); }

try {
  app.use(compression());
} catch (e) { console.warn('Compression failed:', e.message); }

try {
  app.use(cors({
    origin: [
      process.env.FRONTEND_URL || '*',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
  }));
} catch (e) { console.warn('CORS failed:', e.message); }

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: ['text/plain', 'text/html', 'application/x-www-form-urlencoded'] }));

try {
  app.use(morgan('dev'));
} catch (e) { console.warn('Morgan failed:', e.message); }


// Initialize database connection (non-blocking) - moved after routes to prevent crashes
// This will be called lazily when routes are loaded

// Lazy load routes - only load when needed
let routesLoaded = false;
let routeLoadError = null;

const loadRoutes = async () => {
  if (routesLoaded) return true;
  if (routeLoadError) throw routeLoadError;
  
  try {
    const [
      { default: clientRoutes },
      { default: packageRoutes },
      { default: biometricRoutes },
      { default: accessLogRoutes },
      { default: settingsRoutes },
      { default: directESSLRoutes },
      { default: tracklieRoutes },
      { default: etimetrackRoutes },
      { default: esslTrackLiteApiRoutes },
      { errorHandler },
      { handleIClockCData, handleIClockGetRequest }
    ] = await Promise.all([
      import('../backend/dist/routes/clientRoutes.js'),
      import('../backend/dist/routes/packageRoutes.js'),
      import('../backend/dist/routes/biometricRoutes.js'),
      import('../backend/dist/routes/accessLogRoutes.js'),
      import('../backend/dist/routes/settingsRoutes.js'),
      import('../backend/dist/routes/directESSLRoutes.js'),
      import('../backend/dist/routes/tracklieRoutes.js'),
      import('../backend/dist/routes/etimetrackRoutes.js'),
      import('../backend/dist/routes/esslTrackLiteApiRoutes.js'),
      import('../backend/dist/middleware/errorHandler.js'),
      import('../backend/dist/controllers/directESSLController.js')
    ]);

    app.use('/api/clients', clientRoutes);
    app.use('/api/packages', packageRoutes);
    app.use('/api/biometric', biometricRoutes);
    app.use('/api/access-logs', accessLogRoutes);
    app.use('/api/settings', settingsRoutes);
    app.use('/api/direct-essl', directESSLRoutes);
    app.use('/api/tracklie', tracklieRoutes);
    app.use('/api/etimetrack', etimetrackRoutes);
    app.use('/api/essl-tracklite', esslTrackLiteApiRoutes);

    app.get('/iclock/cdata.aspx', handleIClockCData);
    app.post('/iclock/cdata.aspx', handleIClockCData);
    app.get('/iclock/getrequest.aspx', handleIClockGetRequest);
    app.post('/iclock/getrequest.aspx', handleIClockGetRequest);

    app.use(errorHandler);
    
    routesLoaded = true;
    return true;
  } catch (error) {
    routeLoadError = error;
    console.error('Error loading routes:', error);
    throw error;
  }
};

// Middleware to load routes on first API request (except debug/health)
app.use(async (req, res, next) => {
  // Skip route loading for debug and health endpoints
  const skipPaths = ['/api/debug', '/api/health', '/debug', '/health'];
  if (skipPaths.includes(req.path) || req.path.startsWith('/api/debug') || req.path.startsWith('/api/health')) {
    return next();
  }
  
  try {
    await loadRoutes();
    next();
  } catch (error) {
    console.error('Route loading error:', error);
    res.status(500).json({
      success: false,
      message: 'Routes failed to load',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
});

// Enhanced error handling
app.use((err, req, res, next) => {
  console.error('API Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
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
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

export default app;
