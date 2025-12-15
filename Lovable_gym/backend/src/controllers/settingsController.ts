import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  createProfile,
  getProfile,
  updateProfile as updateProfileRecord,
  updateProfilePassword,
} from '../data/profileRepository.js';

/**
 * Get profile settings
 */
export const getProfileSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    let profile = await getProfile();
    
    if (!profile) {
      const defaultPassword = await bcrypt.hash('admin123', 10);
      profile = await createProfile({
        gymName: 'FitStudio',
        gymAddress: '123 Fitness Street, Gym City',
        ownerName: 'Vikram R',
        ownerPhone: '7958694675',
        additionalContact: null,
        photo: null,
        passwordHash: defaultPassword,
      });
    }

    const { passwordHash, ...profileData } = profile;
    res.json({
      success: true,
      data: profileData,
    });
  } catch (error: any) {
    console.error('❌ Error getting profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update profile information
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gymName, gymAddress, ownerName, ownerPhone, additionalContact, photo } = req.body;

    // Validate required fields
    if (!gymName || !gymAddress || !ownerName || !ownerPhone) {
      res.status(400).json({
        success: false,
        error: 'Gym name, address, owner name, and owner phone are required',
      });
      return;
    }

    const profile = await getProfile();
    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
      return;
    }

    const updated = await updateProfileRecord({
      gymName,
      gymAddress,
      ownerName,
      ownerPhone,
      additionalContact: additionalContact || null,
      photo: photo || null,
    });
    
    if (!updated) {
      res.status(500).json({
        success: false,
        error: 'Failed to update profile',
      });
      return;
    }

    const { passwordHash, ...profileData } = updated;

    console.log('✅ Profile updated successfully:', { gymName: profileData.gymName, ownerName: profileData.ownerName });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profileData,
    });
  } catch (error: any) {
    console.error('❌ Error updating profile:', error);
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

    const profile = await getProfile();
    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
      return;
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, profile.passwordHash);
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
    await updateProfilePassword(passwordHash);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update notification settings (removed - not needed in simplified profile)
 */
export const updateNotifications = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({
    success: false,
    error: 'Notifications feature not available in simplified profile',
  });
};

/**
 * Get gym settings (alias for getProfileSettings)
 */
export const getGymSettings = async (req: Request, res: Response): Promise<void> => {
  await getProfileSettings(req, res);
};

/**
 * Update gym information (alias for updateProfile)
 */
export const updateGymInfo = async (req: Request, res: Response): Promise<void> => {
  await updateProfile(req, res);
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

    // Save photo URL to profile
    const photoUrl = `/uploads/${req.file.filename}`;
    const profile = await getProfile();
    if (profile) {
      await updateProfileRecord({ photo: photoUrl });
    }

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        photoUrl,
      },
    });
  } catch (error: any) {
    console.error('❌ Error uploading photo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
