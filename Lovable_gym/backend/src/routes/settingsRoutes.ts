import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getProfileSettings,
  updateProfile,
  changePassword,
  updateNotifications,
  getGymSettings,
  updateGymInfo,
  uploadProfilePhoto,
} from '../controllers/settingsController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Profile routes
router.get('/profile', getProfileSettings);
router.put('/profile', updateProfile);
router.post('/profile/photo', upload.single('photo'), uploadProfilePhoto);

// Password routes
router.post('/password/change', changePassword);

// Notification routes
router.put('/notifications', updateNotifications);

// Gym information routes
router.get('/gym', getGymSettings);
router.put('/gym', updateGymInfo);

export default router;



















