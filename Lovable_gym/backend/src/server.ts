import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import clientRoutes from './routes/clientRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import biometricRoutes from './routes/biometricRoutes.js';
import accessLogRoutes from './routes/accessLogRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import directESSLRoutes from './routes/directESSLRoutes.js';
import tracklieRoutes from './routes/tracklieRoutes.js';
import etimetrackRoutes from './routes/etimetrackRoutes.js';
import esslTrackLiteApiRoutes from './routes/esslTrackLiteApiRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startSyncScheduler, setSocketIO as setSyncSchedulerSocketIO } from './services/syncScheduler.js';
import { startAccessControlJob } from './jobs/accessControlJob.js';
import { setSocketIO } from './controllers/biometricController.js';
import { setSocketIO as setDirectESSLSocketIO, handleIClockCData, handleIClockGetRequest } from './controllers/directESSLController.js';
import etimetrackSyncService from './services/etimetrackSyncService.js';
import { findAvailablePort } from './utils/portFinder.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:8083',
      'http://localhost:8084',
      'http://localhost:8085',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true,
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:3000', // Allow the new 'serve' frontend
      'http://localhost:5001', // Allow requests from the backend serving itself
      'http://localhost:5002', // Allow requests from the dev server when port 5001 is busy
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:8083',
      'http://localhost:8084',
      'http://localhost:8085',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
    ];
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      return origin === allowed;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Text parser for iClock protocol (must be after JSON/URL encoded)
app.use(express.text({ type: ['text/plain', 'text/html', 'application/x-www-form-urlencoded'] }));
app.use(morgan('dev'));

// Make io available to routes
app.set('io', io);

// Pass Socket.IO to biometric controller for real-time updates
setSocketIO(io);
// Pass Socket.IO to direct ESSL controller for real-time updates
setDirectESSLSocketIO(io);
// Pass Socket.IO to sync scheduler for emitting new log events
setSyncSchedulerSocketIO(io);

// Routes
// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Gym Management API',
    version: '1.0.0',
    endpoints: {
      clients: '/api/clients',
      packages: '/api/packages',
      dashboard: '/api/dashboard',
      biometric: '/api/biometric',
      billing: '/api/billing',
      health: '/api/health'
    }
  });
});

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

// iClock protocol endpoints (must be at root level for device compatibility)
// Device calls these directly: /iclock/cdata.aspx and /iclock/getrequest.aspx
app.get('/iclock/cdata.aspx', handleIClockCData);
app.post('/iclock/cdata.aspx', handleIClockCData);
app.get('/iclock/getrequest.aspx', handleIClockGetRequest);
app.post('/iclock/getrequest.aspx', handleIClockGetRequest);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const esslDeviceService = (await import('./services/esslDeviceService.js')).default;
    const deviceStatus = esslDeviceService.getConnectionStatus();
    
    res.json({ 
      status: 'OK', 
      message: 'Server is running', 
      timestamp: new Date(),
      device: {
        ip: deviceStatus.deviceIp,
        port: deviceStatus.port,
        connected: deviceStatus.connected,
      },
    });
  } catch (error: any) {
    res.json({ 
      status: 'OK', 
      message: 'Server is running', 
      timestamp: new Date(),
      device: { connected: false, error: error.message },
    });
  }
});

// Serve static files from frontend build (for production)
// This will be set up in startServer function

// Error handling
app.use(errorHandler);

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send connection confirmation
  socket.emit('connected', { message: 'Connected to server', socketId: socket.id });
  
  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'Reason:', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

const PREFERRED_PORT = parseInt(process.env.PORT || '5001', 10);

// Connect to database and start server
const startServer = async () => {
  try {
    // Find an available port
    const PORT = await findAvailablePort(PREFERRED_PORT);
    
    if (PORT !== PREFERRED_PORT) {
      console.log(`⚠️  Port ${PREFERRED_PORT} is in use, using port ${PORT} instead`);
    }
    
    // Try to connect to database (optional - won't fail if connection fails)
    await connectDB();
    
    // Setup GymClients table if it doesn't exist
    try {
      const { setupGymClientsTable } = await import('./scripts/setupGymClientsTable.js');
      await setupGymClientsTable();
    } catch (tableError: any) {
      console.warn('⚠️  GymClients table setup skipped:', tableError.message);
    }
    
    // Setup Profile table if it doesn't exist
    try {
      const { setupProfileTable } = await import('./scripts/setupProfileTable.js');
      await setupProfileTable();
    } catch (tableError: any) {
      console.warn('⚠️  Profile table setup skipped:', tableError.message);
    }
    
    // Auto-sync GymClients with Employees on startup
    try {
      const { syncGymClientsForAllEmployees } = await import('./data/gymClientRepository.js');
      console.log('🔄 Auto-syncing GymClients with Employees table...');
      const syncResult = await syncGymClientsForAllEmployees();
      console.log(`✅ Auto-sync completed: ${syncResult.created} created, ${syncResult.skipped} skipped, ${syncResult.errors} errors`);
    } catch (syncError: any) {
      console.warn('⚠️  Auto-sync skipped:', syncError.message);
    }
    
    // Initialize eTimeTrack sync service (only if SQL is available)
    try {
      await etimetrackSyncService.initialize();
    } catch (syncError: any) {
      console.warn('⚠️  eTimeTrack sync service initialization skipped:', syncError.message);
    }
    
    // Setup frontend static file serving (if frontend is built)
    const fs = await import('fs');
    const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
    
    // Serve uploads directory as static files
    const uploadsPath = path.join(__dirname, '..', '..', 'uploads');
    try {
      await fs.promises.access(uploadsPath);
      app.use('/uploads', express.static(uploadsPath, {
        maxAge: '1y',
        etag: true,
        lastModified: true,
      }));
      console.log('✅ Uploads directory served at /uploads');
    } catch (uploadsError) {
      // Create uploads directory if it doesn't exist
      try {
        await fs.promises.mkdir(uploadsPath, { recursive: true });
        app.use('/uploads', express.static(uploadsPath, {
          maxAge: '1y',
          etag: true,
          lastModified: true,
        }));
        console.log('✅ Created and serving uploads directory at /uploads');
      } catch (mkdirError) {
        console.warn('⚠️  Could not create uploads directory:', mkdirError);
      }
    }
    
    try {
      await fs.promises.access(frontendPath);
      
      // Serve all static files from the frontend build directory
      app.use(express.static(frontendPath, {
        maxAge: '1y',
        etag: true,
        lastModified: true,
      }));

      // For any request that is not an API call, send the index.html file.
      // This is the catch-all for client-side routing.
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/iclock') || req.path.startsWith('/uploads')) {
          return next(); // Skip if it's an API, iClock, or uploads call
        }
        res.sendFile(path.join(frontendPath, 'index.html'));
      });
      
      console.log('✅ Frontend static files enabled');
    } catch (frontendError) {
      console.log('ℹ️  Frontend dist not found - API-only mode');
    }
    
    httpServer.listen(PORT, async () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API: http://localhost:${PORT}/api`);
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      
      // Save port to file for tunnel script
      try {
        const portFile = path.join(__dirname, '..', '..', '..', 'CURRENT_PORT.txt');
        await fs.promises.writeFile(portFile, PORT.toString(), 'utf-8');
      } catch (err) {
        // Ignore errors writing port file
      }
      
      // Start background jobs (they will handle SQL connection errors gracefully)
      try {
        startSyncScheduler();
        startAccessControlJob();
      } catch (jobError: any) {
        console.warn('⚠️  Some background jobs failed to start:', jobError.message);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io };

