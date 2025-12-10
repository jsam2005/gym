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

    // All fields are optional - use defaults if not provided
    const pkg = await createPackageRecord({
      name: name ? name.trim() : 'Unnamed Package',
      description: description ? description.trim() : '',
      duration: duration ? parseInt(duration) : 30,
      amount: amount ? parseFloat(amount) : 0,
      timingSlot: timingSlot || 'morning',
      accessSchedule: accessSchedule || {
        startTime: '06:00',
        endTime: '22:00',
      },
      features: features || [],
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: pkg,
    });
  } catch (error: any) {
    console.error('❌ Create package error:', error);
    
    // Check for duplicate name error (SQL Server unique constraint violation)
    if (error.message?.includes('UNIQUE') || error.message?.includes('duplicate') || error.message?.includes('already exists')) {
      res.status(400).json({ 
        success: false, 
        error: 'Package name already exists. Please choose a different name.' 
      });
      return;
    }

    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create package' 
    });
  }
};

/**
 * Update package
 */
export const updatePackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      res.status(400).json({ 
        success: false, 
        error: 'Package ID is required' 
      });
      return;
    }

    // Prepare updates object
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name.trim();
    if (updates.description !== undefined) updateData.description = updates.description.trim();
    if (updates.duration !== undefined) updateData.duration = parseInt(updates.duration);
    if (updates.amount !== undefined) updateData.amount = parseFloat(updates.amount);
    if (updates.timingSlot !== undefined) updateData.timingSlot = updates.timingSlot;
    if (updates.accessSchedule !== undefined) updateData.accessSchedule = updates.accessSchedule;
    if (updates.features !== undefined) updateData.features = updates.features;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    const pkg = await updatePackageRecord(id, updateData);

    if (!pkg) {
      res.status(404).json({ 
        success: false, 
        error: 'Package not found' 
      });
      return;
    }

    res.json({ 
      success: true, 
      message: 'Package updated successfully', 
      data: pkg 
    });
  } catch (error: any) {
    console.error('❌ Update package error:', error);
    
    // Check for duplicate name error
    if (error.message?.includes('UNIQUE') || error.message?.includes('duplicate')) {
      res.status(400).json({ 
        success: false, 
        error: 'Package name already exists. Please choose a different name.' 
      });
      return;
    }

    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update package' 
    });
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



