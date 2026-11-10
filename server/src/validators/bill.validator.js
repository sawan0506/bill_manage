import { z } from 'zod';

const billItemInputSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than zero'),
  discountType: z.enum(['percentage', 'amount']).default('amount'),
  discountValue: z.number().min(0).default(0)
});

export const createBillSchema = z.object({
  customerId: z.string().optional().nullable(),
  customerName: z.string().trim().min(1, 'Customer name is required'),
  customerPhone: z.string().trim().min(10, 'Customer phone is required'),
  customerAddress: z.string().trim().optional().default(''),
  customerGstin: z.string().trim().optional().default(''),
  items: z.array(billItemInputSchema).min(1, 'Please add at least one item to the bill'),
  paymentMode: z.enum(['Cash', 'UPI', 'Card', 'Credit', 'Partial']).default('Cash'),
  paidAmount: z.number().min(0).default(0),
  isInterState: z.boolean().default(false),
  notes: z.string().trim().optional().default(''),
  idempotencyKey: z.string().optional()
});

export const cancelBillSchema = z.object({
  reason: z.string().trim().min(5, 'Please enter a clear reason for cancellation (min 5 characters)')
});
