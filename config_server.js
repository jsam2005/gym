/**
 * ESSL Device Configuration Server
 * Simple web server to serve the configuration interface
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/essl_device_config.html' : req.url;
    filePath = path.join(__dirname, filePath);
    
    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <head><title>404 Not Found</title></head>
                        <body>
                            <h1>404 - File Not Found</h1>
                            <p>The requested file was not found.</p>
                            <a href="/">Go to ESSL Configuration</a>
                        </body>
                    </html>
                `);
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('🚀 ESSL Device Configuration Server');
    console.log('=====================================');
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log('📱 Open this URL in your browser to configure your ESSL device');
    console.log('=====================================');
    console.log('');
    console.log('📋 Configuration Steps:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Test device connection');
    console.log('3. Configure webhook settings');
    console.log('4. Set up your ESSL device with the provided settings');
    console.log('5. Test real-time updates');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down configuration server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});










