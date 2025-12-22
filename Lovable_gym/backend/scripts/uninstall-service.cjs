// Windows service uninstaller for Gym Management Backend using node-windows (CommonJS)
const { Service } = require('node-windows');

const svc = new Service({
  name: 'Gym Management Backend',
  script: 'dist/server.js',
});

svc.on('uninstall', () => {
  console.log('Service uninstalled successfully.');
});

svc.on('error', (err) => {
  console.error('Service error:', err);
});

svc.uninstall();







