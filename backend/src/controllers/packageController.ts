import { Request, Response } from 'express';
import {
  createPackage as createPackageRecord,
  deactivatePackage as deactivatePackageRecord,
  getActivePackages,
  getPackageById as fetchPackageById,
  updatePackage as updatePackageRecord,
} from '../data/packageRepository.js';

/**
 * Get all packages
 */
export const getAllPackages = async (req: Request, res: Response): Promise<void> => {
  try {
    const packages = await getActivePackages();
    res.json({ success: true, data: packages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get package by ID
 */
export const getPackageById = async (req: Request, res: Response): Promise<void> => {
  try {
    const pkg = await fetchPackageById(req.params.id);
    if (!pkg) {
      res.status(404).json({ success: false, error: 'Package not found' });
      return;
    }
    res.json({ success: true, data: pkg });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Create new package
 */
export const createPackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, duration, amount, timingSlot, accessSchedule, features } = req.body;

    const pkg = await createPackageRecord({
      name,
      description,
      duration,
      amount,
      timingSlot,
      accessSchedule,
      features: features || [],
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: pkg,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, error: 'Package name already exists' });
      return;
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update package
 */
export const updatePackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const pkg = await updatePackageRecord(req.params.id, req.body);

    if (!pkg) {
      res.status(404).json({ success: false, error: 'Package not found' });
      return;
    }

    res.json({ success: true, message: 'Package updated successfully', data: pkg });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete package
 */
export const deletePackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await deactivatePackageRecord(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Package not found' });
      return;
    }

    res.json({ success: true, message: 'Package deactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};



