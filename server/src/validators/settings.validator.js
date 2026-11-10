import { z } from 'zod';

export const updateSettingsSchema = z.object({
  shopName: z.string().trim().min(2, 'Shop name is required'),
  tagline: z.string().trim().optional().default(''),
  address: z.string().trim().min(2, 'Address is required'),
  phone: z.string().trim().min(10, 'Phone is required'),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  gstin: z.string().trim().optional().default(''),
  state: z.string().trim().default('Delhi'),
  stateCode: z.string().trim().default('07'),
  invoicePrefix: z.string().trim().min(1).max(6).default('INV'),
  enableGst: z.boolean().default(true),
  defaultGstRate: z.number().min(0).max(100).default(18),
  termsAndConditions: z.string().trim().optional().default(''),
  bankName: z.string().trim().optional().default(''),
  bankAccountNumber: z.string().trim().optional().default(''),
  ifscCode: z.string().trim().optional().default(''),
  upiId: z.string().trim().optional().default(''),
  currencySymbol: z.string().trim().default('₹')
});
