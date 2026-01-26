import net from 'net';

/**
 * Find an available port starting from the preferred port
 * @param preferredPort - The preferred port to use
 * @returns Promise<number> - An available port number
 */
export async function findAvailablePort(preferredPort: number = 5001): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(preferredPort, () => {
      const port = (server.address() as net.AddressInfo)?.port;
      server.close(() => {
        resolve(port || preferredPort);
      });
    });
    
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try next port
        findAvailablePort(preferredPort + 1)
          .then(resolve)
          .catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Check if a port is available
 * @param port - Port number to check
 * @returns Promise<boolean> - True if port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}























