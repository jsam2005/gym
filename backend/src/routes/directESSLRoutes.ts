import express from 'express';
import { handleESSLWebhook, testDirectConnection, handleIClockCData, handleIClockGetRequest, getDeviceStatus } from '../controllers/directESSLController.js';

const router = express.Router();

/**
 * Direct ESSL Routes
 * Bypasses trial software and connects directly via Ethernet
 */

// Webhook endpoint for ESSL device to send data
router.post('/webhook', handleESSLWebhook);

// iClock protocol endpoints (ZKTeco/ESSL standard protocol)
router.get('/iclock/cdata.aspx', handleIClockCData);
router.post('/iclock/cdata.aspx', handleIClockCData);
router.get('/iclock/getrequest.aspx', handleIClockGetRequest);
router.post('/iclock/getrequest.aspx', handleIClockGetRequest);

// Get device connection status
router.get('/status', getDeviceStatus);

// Test direct connection to ESSL device
router.get('/test-direct', testDirectConnection);

// Health check for direct connection
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Direct ESSL connection endpoint active',
    deviceIp: process.env.ESSL_DEVICE_IP || '192.168.0.5',
    port: parseInt(process.env.ESSL_DEVICE_PORT || '4370'),
    connectionType: 'Ethernet Direct'
  });
});

export default router;

