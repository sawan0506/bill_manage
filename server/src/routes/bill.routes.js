import { Router } from 'express';
import {
  createBill,
  listBills,
  getBillById,
  downloadInvoicePdf,
  getInvoiceWhatsAppLink,
  cancelBill,
  processSalesReturn
} from '../controllers/bill.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  createBillSchema,
  cancelBillSchema
} from '../validators/bill.validator.js';

const router = Router();

// Staff and Admin can view and create bills
router.get('/', authenticate, listBills);
router.post('/', authenticate, validate(createBillSchema), createBill);
router.get('/:id', authenticate, getBillById);
router.get('/:id/pdf', authenticate, downloadInvoicePdf);
router.get('/:id/whatsapp', authenticate, getInvoiceWhatsAppLink);

// Sales Return / Credit Note
router.post('/:id/return', authenticate, processSalesReturn);

// Admin-only cancellation
router.post('/:id/cancel', authenticate, requireAdmin, validate(cancelBillSchema), cancelBill);

export default router;
