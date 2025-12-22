// Windows service installer for Gym Management Backend using node-windows (CommonJS)
const path = require('path');
const { Service } = require('node-windows');

const backendDir = __dirname ? path.join(__dirname, '..') : path.resolve('..');
const scriptPath = path.join(backendDir, 'dist', 'server.js');

const svc = new Service({
  name: 'Gym Management Backend',
  description: 'Gym Management System Backend API Server',
  script: scriptPath,
  nodeOptions: [],
  wait: 1,
  grow: 0,
});

svc.on('install', () => {
  console.log('Service installed successfully.');
  svc.start();
});

svc.on('alreadyinstalled', () => {
  console.log('Service is already installed.');
});

svc.on('start', () => {
  console.log('Service started.');
});

svc.on('error', (err) => {
  console.error('Service error:', err);
});

svc.install();







