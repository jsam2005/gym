import { io, Socket } from 'socket.io-client';

// Disable WebSocket in production (Vercel serverless doesn't support persistent connections)
const isProduction = import.meta.env.MODE === 'production' || import.meta.env.PROD;
const WS_URL = import.meta.env.VITE_WS_URL || (isProduction ? '' : 'http://localhost:5000');

let socket: Socket | null = null;

export const initSocket = (): Socket | null => {
  // Skip WebSocket initialization in production
  if (isProduction || !WS_URL) {
    console.log('⚠️  WebSocket disabled in production (Vercel serverless)');
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



