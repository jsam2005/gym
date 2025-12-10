import { io, Socket } from 'socket.io-client';

// WebSocket configuration - Railway supports persistent connections
const isProduction = import.meta.env.MODE === 'production' || import.meta.env.PROD;
// In production, use same origin (Railway serves both frontend and backend)
const WS_URL = import.meta.env.VITE_WS_URL || (isProduction ? '' : 'http://localhost:5000');

let socket: Socket | null = null;

export const initSocket = (): Socket | null => {
  // Skip WebSocket initialization if URL not set
  if (!WS_URL) {
    console.log('⚠️  WebSocket URL not configured');
    return null;
  }

  if (!socket) {
    socket = io(WS_URL, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      timeout: 20000,
      forceNew: true
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};



