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
    // Import routes one by one to identify which one fails
    console.log('📦 Loading routes...');
    
    let clientRoutes, packageRoutes, biometricRoutes, accessLogRoutes, settingsRoutes;
    let directESSLRoutes, tracklieRoutes, etimetrackRoutes, esslTrackLiteApiRoutes;
    let dashboardRoutes, billingRoutes, errorHandler, handleIClockCData, handleIClockGetRequest;
    
    try {
      console.log('  Loading clientRoutes...');
      ({ default: clientRoutes } = await import('../backend/dist/routes/clientRoutes.js'));
    } catch (e) {
      console.error('❌ Failed to load clientRoutes:', e.message);
      throw new Error(`Failed to load clientRoutes: ${e.message}`);
    }
    
    try {
      console.log('  Loading packageRoutes...');
      ({ default: packageRoutes } = await import('../backend/dist/routes/packageRoutes.js'));
    } catch (e) {
      console.error('❌ Failed to load packageRoutes:', e.message);
      throw new Error(`Failed to load packageRoutes: ${e.message}`);
    }
    
    try {
      console.log('  Loading biometricRoutes...');
      ({ default: biometricRoutes } = await import('../backend/dist/routes/biometricRoutes.js'));
    } catch (e) {
      console.error('❌ Failed to load biometricRoutes:', e.message);
      throw new Error(`Failed to load biometricRoutes: ${e.message}`);
    }
    
    try {
      console.log('  Loading accessLogRoutes...');
      ({ default: accessLogRoutes } = await import('../backend/dist/routes/accessLogRoutes.js'));
    } catch (e) {
      console.error('❌ Failed to load accessLogRoutes:', e.message);
      throw new Error(`Failed to load accessLogRoutes: ${e.message}`);
    }
    
    try {
      console.log('  Loading settingsRoutes...');
      ({ default: settingsRoutes } = await import('../backend/dist/routes/settingsRoutes.js'));
    } catch (e) {
      console.error('❌ Failed to load settingsRoutes:', e.message);
      throw new Error(`Failed to load settingsRoutes: ${e.message}`);
    }
    
    try {
      console.log('  Loading directESSLRoutes...');
      ({ default: directESSLRoutes } = await import('../backend/dist/routes/directESSLRoutes.js'));
    } catch (e) {
      console.error('❌ Failed to load directESSLRoutes:', e.message);
      throw new Error(`Failed to load directESSLRoutes: ${e.message}`);
    }
    
    try {
      console.log('  Loading tracklieRoutes...');
      ({ default: tracklieRoutes } = await import('../backend/dist/routes/tracklieRoutes.js'));
    } catch (e) {
      console.error('❌ Failed to load tracklieRoutes:', e.message);
      throw new Error(`Failed to load tracklieRoutes: ${e.message}`);
    }
    
    try {
      console.log('  Loading etimetrackRoutes...');
      ({ default: etimetrackRoutes } = await import('../backend/dist/routes/etimetrackRoutes.js'));
    } catch (e) {
      console.error('❌ Failed to load etimetrackRoutes:', e.message);
      throw new Error(`Failed to load etimetrackRoutes: ${e.message}`);
    }
    
    try {
      console.log('  Loading esslTrackLiteApiRoutes...');
      ({ default: esslTrackLiteApiRoutes } = await import('../backend/dist/routes/esslTrackLiteApiRoutes.js'));
    } catch (e) {
      console.error('❌ Failed to load esslTrackLiteApiRoutes:', e.message);
      throw new Error(`Failed to load esslTrackLiteApiRoutes: ${e.message}`);
    }
    
    try {
      console.log('  Loading dashboardRoutes...');
      ({ default: dashboardRoutes } = await import('../backend/dist/routes/dashboardRoutes.js'));
    } catch (e) {
      console.error('❌ Failed to load dashboardRoutes:', e.message);
      throw new Error(`Failed to load dashboardRoutes: ${e.message}`);
    }
    
    try {
      console.log('  Loading billingRoutes...');
      ({ default: billingRoutes } = await import('../backend/dist/routes/billingRoutes.js'));
    } catch (e) {
      console.error('❌ Failed to load billingRoutes:', e.message);
      throw new Error(`Failed to load billingRoutes: ${e.message}`);
    }
    
    try {
      console.log('  Loading errorHandler...');
      ({ errorHandler } = await import('../backend/dist/middleware/errorHandler.js'));
    } catch (e) {
      console.error('❌ Failed to load errorHandler:', e.message);
      throw new Error(`Failed to load errorHandler: ${e.message}`);
    }
    
    // Load iClock handlers separately (optional - routes are already in directESSLRoutes)
    let handleIClockCData, handleIClockGetRequest;
    try {
      console.log('  Loading directESSLController (for iClock routes)...');
      const directESSLController = await import('../backend/dist/controllers/directESSLController.js');
      handleIClockCData = directESSLController.handleIClockCData;
      handleIClockGetRequest = directESSLController.handleIClockGetRequest;
    } catch (e) {
      console.warn('⚠️ Could not load directESSLController (iClock routes may not work):', e.message);
      // Create stub handlers if import fails
      handleIClockCData = (req: any, res: any) => {
        res.status(503).json({ error: 'iClock handler not available' });
      };
      handleIClockGetRequest = (req: any, res: any) => {
        res.status(503).json({ error: 'iClock handler not available' });
      };
    }
    
    console.log('✅ All routes loaded successfully');

    app.use('/api/clients', clientRoutes);
    app.use('/api/packages', packageRoutes);
    app.use('/api/biometric', biometricRoutes);
    app.use('/api/access-logs', accessLogRoutes);
    app.use('/api/settings', settingsRoutes);
    app.use('/api/direct-essl', directESSLRoutes);
    app.use('/api/tracklie', tracklieRoutes);
    app.use('/api/etimetrack', etimetrackRoutes);
    app.use('/api/essl-tracklite', esslTrackLiteApiRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/billing', billingRoutes);

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
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
    });
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
    console.error('Route loading error stack:', error.stack);
    console.error('Route loading error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      path: req.path,
    });
    
    // Return a more helpful error message
    const errorMessage = error.message || 'Unknown error';
    const isRouteError = errorMessage.includes('Failed to load');
    
    res.status(500).json({
      success: false,
      message: isRouteError ? 'Routes failed to load' : 'Server error',
      error: errorMessage,
      path: req.path,
      // Include more details in development
      ...(process.env.NODE_ENV !== 'production' && {
        stack: error.stack,
        details: {
          name: error.name,
          code: error.code,
        },
      }),
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
  // Don't crash - log and continue
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't crash - log and continue
});

// Wrap app export in try-catch to prevent module initialization crashes
try {
  export default app;
} catch (error) {
  console.error('Failed to export app:', error);
  // Create a minimal app that at least responds to requests
  const fallbackApp = express();
  fallbackApp.use(express.json());
  fallbackApp.get('*', (req, res) => {
    res.status(500).json({
      success: false,
      message: 'Server initialization failed',
      error: error.message,
    });
  });
  export default fallbackApp;
}
