import express from 'express';
import {
  testConnection,
  getStatus,
  getUsers,
  getUserByPin,
  getAttendanceLogs,
  getAttendanceStats,
  upsertUser,
  deleteUser,
} from '../controllers/esslTrackLiteApiController.js';
import {
  importTrackLiteUsers,
  getTrackLiteUsers,
} from '../controllers/esslTrackLiteSyncController.js';

const router = express.Router();

/**
 * ESSL TrackLite API Routes
 * All endpoints connect to ESSL TrackLite server via REST API
 */

// Connection
router.get('/test', testConnection);
router.get('/status', getStatus);

// Users
router.get('/users', getUsers);
router.get('/users/:pin', getUserByPin);
router.post('/users', upsertUser);
router.put('/users/:userId', upsertUser);
router.delete('/users/:userId', deleteUser);

// Attendance Logs
router.get('/attendance', getAttendanceLogs);
router.get('/attendance/stats', getAttendanceStats);

// Sync/Import
router.get('/users/preview', getTrackLiteUsers);
router.post('/users/import', importTrackLiteUsers);

export default router;

