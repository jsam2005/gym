import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  createGymSettings,
  createUser,
  getGymSettings as fetchGymSettings,
  getUser,
  updateGymSettings as updateGymSettingsRecord,
  updateUserNotifications,
  updateUserPassword,
  updateUserProfile,
} from '../data/settingsRepository.js';

/**
 * Get user profile settings
 */
export const getProfileSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    let user = await getUser();
    
    if (!user) {
      const defaultPassword = await bcrypt.hash('admin123', 10);
      user = await createUser({
        name: 'Vikram R',
        email: 'vikram@gmail.com',
        phone: '7958694675',
        passwordHash: defaultPassword,
        role: 'admin',
        notifications: {
          newMemberSignUps: true,
          classCancellations: false,
        },
      });
    }

    const { passwordHash, ...profileData } = user;
    res.json({
      success: true,
      data: profileData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update user profile information
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone } = req.body;

    // Validate input
    if (!name || !email || !phone) {
      res.status(400).json({
        success: false,
        error: 'Name, email, and phone are required',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
      return;
    }

    // Phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      res.status(400).json({
        success: false,
        error: 'Invalid phone number. Must be 10 digits',
      });
      return;
    }

    const user = await getUser();
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const updated = await updateUserProfile({ name, email, phone });
    const { passwordHash, ...profileData } = updated ?? {};

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profileData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Change password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        error: 'All password fields are required',
      });
      return;
    }

    const user = await getUser();
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
      return;
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        error: 'New passwords do not match',
      });
      return;
    }

    // Password strength validation
    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long',
      });
      return;
    }

    // Hash and save new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(passwordHash);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update notification settings
 */
export const updateNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { newMemberSignUps, classCancellations } = req.body;

    if (typeof newMemberSignUps !== 'boolean' || typeof classCancellations !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'Invalid notification settings format',
      });
      return;
    }

    const user = await getUser();
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const updated = await updateUserNotifications({
      newMemberSignUps,
      classCancellations,
    });

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: updated?.notifications,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get gym settings
 */
export const getGymSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    let gymSettings = await fetchGymSettings();
    
    if (!gymSettings) {
      gymSettings = await createGymSettings({
        gymName: 'FitStudio',
        gymEmail: 'contact@fitstudio.com',
        gymPhone: '+91 98765 43210',
        gymAddress: '123 Fitness Street, Gym City',
      });
    }

    res.json({
      success: true,
      data: gymSettings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update gym information
 */
export const updateGymInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gymName, gymEmail, gymPhone, gymAddress } = req.body;

    // Validate input
    if (!gymName || !gymEmail || !gymPhone || !gymAddress) {
      res.status(400).json({
        success: false,
        error: 'All gym fields are required',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(gymEmail)) {
      res.status(400).json({
        success: false,
        error: 'Invalid gym email format',
      });
      return;
    }

    const updated = await updateGymSettingsRecord({
        gymName,
        gymEmail,
        gymPhone,
        gymAddress,
      });

    res.json({
      success: true,
      message: 'Gym information updated successfully',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Upload profile photo
 */
export const uploadProfilePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      res.status(400).json({
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, and GIF are allowed',
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 5MB',
      });
      return;
    }

    // In production, upload to cloud storage (AWS S3, Cloudinary, etc.)
    const photoUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        photoUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

