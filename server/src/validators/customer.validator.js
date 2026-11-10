import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Customer name is required'),
  phone: z
    .string()
    .trim()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Invalid phone number'),
  address: z.string().trim().optional().default(''),
  gstin: z.string().trim().optional().default(''),
  notes: z.string().trim().optional().default('')
});

export const updateCustomerSchema = createCustomerSchema.partial();
