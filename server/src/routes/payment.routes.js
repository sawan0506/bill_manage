import { Router } from 'express';
import { recordPayment, listPayments } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createPaymentSchema } from '../validators/payment.validator.js';

const router = Router();

router.get('/', authenticate, listPayments);
router.post('/', authenticate, validate(createPaymentSchema), recordPayment);

export default router;
