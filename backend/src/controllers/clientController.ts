import { Request, Response } from 'express';
import {
  createClient as createClientRecord,
  deleteClient as deleteClientRecord,
  getClientById as fetchClientById,
  getClientStats as fetchClientStats,
  getClients as fetchClients,
  updateClient as updateClientRecord,
} from '../data/clientRepository.js';
import esslDeviceService from '../services/esslDeviceService.js';
import etimetrackSyncService from '../services/etimetrackSyncService.js';
import { ClientEntity } from '../types/domain.js';

const ensureEmergencyContact = (contact: any = {}): ClientEntity['emergencyContact'] => ({
  name: contact.name || 'Emergency Contact',
  phone: contact.phone || '0000000000',
  relation: contact.relation || 'Family',
});

const defaultAccessSchedule = () => [
  { day: 'monday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'tuesday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'wednesday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'thursday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'friday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'saturday', startTime: '06:00', endTime: '22:00', enabled: true },
  { day: 'sunday', startTime: '06:00', endTime: '22:00', enabled: false },
];

const normalizeClientPayload = (input: any): Partial<ClientEntity> => {
  const clientData = { ...input };
  clientData.dateOfBirth = clientData.dateOfBirth ? new Date(clientData.dateOfBirth) : new Date();
  clientData.gender = clientData.gender || 'other';
  clientData.address = clientData.address || 'Not provided';
  clientData.emergencyContact = ensureEmergencyContact(clientData.emergencyContact);
  clientData.packageStartDate = clientData.packageStartDate ? new Date(clientData.packageStartDate) : new Date();
  clientData.packageEndDate = clientData.packageEndDate
    ? new Date(clientData.packageEndDate)
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  clientData.packageType = clientData.packageType || 'general';
  clientData.packageAmount = Number(clientData.packageAmount || 0);
  clientData.amountPaid = Number(clientData.amountPaid || 0);
  clientData.pendingAmount = clientData.packageAmount - clientData.amountPaid;

  if (clientData.amountPaid >= clientData.packageAmount) {
    clientData.paymentStatus = 'paid';
    clientData.pendingAmount = 0;
  } else if (clientData.amountPaid > 0) {
    clientData.paymentStatus = 'partial';
  } else {
    clientData.paymentStatus = 'pending';
  }

  clientData.accessSchedule =
    Array.isArray(clientData.accessSchedule) && clientData.accessSchedule.length > 0
      ? clientData.accessSchedule
      : defaultAccessSchedule();

  clientData.isAccessActive = clientData.isAccessActive ?? false;
  clientData.status = clientData.status || 'active';
  clientData.fingerprintEnrolled = clientData.fingerprintEnrolled ?? false;

  return clientData;
};

/**
 * Create a new client
 */
export const createClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const normalizedPayload = normalizeClientPayload(req.body);
    const client = await createClientRecord(normalizedPayload);

    if (etimetrackSyncService.isEnabled()) {
      etimetrackSyncService
        .syncClient(client)
        .catch((syncError: any) => console.error('⚠️ eTimeTrack sync failed:', syncError.message));
    }

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      client,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all clients
 */
export const getAllClients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const result = await fetchClients({
      status: status as string | undefined,
      search: search as string | undefined,
      page: Number(page),
      limit: Number(limit),
    });

    res.json({
      success: true,
      clients: result.clients,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get client by ID
 */
export const getClientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const client = await fetchClientById(id);

    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    res.json({
      success: true,
      client,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update client
 */
export const updateClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingClient = await fetchClientById(id);
    if (!existingClient) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    if (updates.amountPaid !== undefined || updates.packageAmount !== undefined) {
      const packageAmount = updates.packageAmount ?? existingClient.packageAmount;
      const amountPaid = updates.amountPaid ?? existingClient.amountPaid;
      updates.pendingAmount = packageAmount - amountPaid;

      if (amountPaid >= packageAmount) {
        updates.paymentStatus = 'paid';
        updates.pendingAmount = 0;
      } else if (amountPaid > 0) {
        updates.paymentStatus = 'partial';
      } else {
        updates.paymentStatus = 'pending';
      }
    }

    const client = await updateClientRecord(id, updates);
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    if (updates.accessSchedule && client.esslUserId) {
      await esslDeviceService.setUserAccessSchedule(client.esslUserId, updates.accessSchedule);
    }

    if (etimetrackSyncService.isEnabled()) {
      etimetrackSyncService
        .syncClient(client)
        .catch((syncError: any) => console.error('⚠️ eTimeTrack sync failed:', syncError.message));
    }

    res.json({
      success: true,
      message: 'Client updated successfully',
      client,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete client
 */
export const deleteClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const client = await fetchClientById(id);
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    if (client.esslUserId) {
      await esslDeviceService.deleteUser(client.esslUserId);
      if (etimetrackSyncService.isEnabled()) {
        etimetrackSyncService
          .disableClient(client.esslUserId)
          .catch((syncError: any) => console.error('⚠️ eTimeTrack disable failed:', syncError.message));
      }
    }

    await deleteClientRecord(id);

    res.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get client statistics
 */
export const getClientStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await fetchClientStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
