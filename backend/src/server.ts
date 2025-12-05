import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import clientRoutes from './routes/clientRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import biometricRoutes from './routes/biometricRoutes.js';
import accessLogRoutes from './routes/accessLogRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import directESSLRoutes from './routes/directESSLRoutes.js';
import tracklieRoutes from './routes/tracklieRoutes.js';
import etimetrackRoutes from './routes/etimetrackRoutes.js';
import esslTrackLiteApiRoutes from './routes/esslTrackLiteApiRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startSyncScheduler, setSocketIO as setSyncSchedulerSocketIO } from './services/syncScheduler.js';
import { startAccessControlJob } from './jobs/accessControlJob.js';
import { setSocketIO } from './controllers/biometricController.js';
import { handleIClockCData, handleIClockGetRequest } from './controllers/directESSLController.js';
import etimetrackSyncService from './services/etimetrackSyncService.js';

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
app.use(helmet());
app.use(compression());
app.use(cors({
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
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Text parser for iClock protocol (must be after JSON/URL encoded)
app.use(express.text({ type: ['text/plain', 'text/html', 'application/x-www-form-urlencoded'] }));
app.use(morgan('dev'));

// Make io available to routes
app.set('io', io);

// Pass Socket.IO to biometric controller for real-time updates
setSocketIO(io);
// Pass Socket.IO to sync scheduler for emitting new log events
setSyncSchedulerSocketIO(io);

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

const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
  try {
    // Try to connect to database (optional - won't fail if connection fails)
    await connectDB();
    
    // Initialize eTimeTrack sync service (only if SQL is available)
    try {
      await etimetrackSyncService.initialize();
    } catch (syncError: any) {
      console.warn('⚠️  eTimeTrack sync service initialization skipped:', syncError.message);
    }
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API: http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      
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

