import { Router } from 'express';
import {
  listCustomers,
  getCustomerById,
  getCustomerLedger,
  createCustomer,
  updateCustomer,
  getWhatsAppReminderLink
} from '../controllers/customer.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCustomerSchema,
  updateCustomerSchema
} from '../validators/customer.validator.js';

const router = Router();

router.get('/', authenticate, listCustomers);
router.get('/:id', authenticate, getCustomerById);
router.get('/:id/ledger', authenticate, getCustomerLedger);
router.get('/:id/whatsapp-reminder', authenticate, getWhatsAppReminderLink);

router.post('/', authenticate, validate(createCustomerSchema), createCustomer);
router.put('/:id', authenticate, validate(updateCustomerSchema), updateCustomer);

export default router;
