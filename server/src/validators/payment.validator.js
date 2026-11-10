import { z } from 'zod';

export const createPaymentSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  billId: z.string().optional().nullable(),
  amount: z.number().min(0.5, 'Payment amount must be at least ₹0.50'),
  paymentMode: z.enum(['Cash', 'UPI', 'Card', 'Bank Transfer']).default('Cash'),
  transactionRef: z.string().trim().optional().default(''),
  notes: z.string().trim().optional().default('')
});
