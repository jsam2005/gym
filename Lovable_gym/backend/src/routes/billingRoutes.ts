import { Router } from 'express';
import {
  getBillingClients,
  getPendingAndOverdueClients,
  getPaymentHistory,
  getUpcomingPayments,
  getBillingSummary,
} from '../controllers/billingController.js';

const router = Router();

router.get('/clients', getBillingClients);
router.get('/pending-overdue', getPendingAndOverdueClients);
router.get('/payments', getPaymentHistory);
router.get('/upcoming', getUpcomingPayments);
router.get('/summary', getBillingSummary);

export default router;



