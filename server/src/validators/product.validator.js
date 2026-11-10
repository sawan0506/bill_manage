import { z } from 'zod';
import { CATEGORIES, UNITS } from '../models/Product.js';

export const createProductSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required'),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid category' })
  }),
  brand: z.string().trim().optional().default(''),
  sizeModel: z.string().trim().optional().default(''),
  unit: z.enum(UNITS, {
    errorMap: () => ({ message: 'Please select a valid unit' })
  }).default('piece'),
  purchasePrice: z
    .number({ invalid_type_error: 'Purchase price must be a number' })
    .min(0, 'Purchase price cannot be negative'),
  sellingPrice: z
    .number({ invalid_type_error: 'Selling price must be a number' })
    .min(0, 'Selling price cannot be negative'),
  gstRate: z.number().min(0).max(100).default(18),
  hsnCode: z.string().trim().optional().default(''),
  stockQuantity: z.number().min(0, 'Stock cannot be negative').default(0),
  lowStockLevel: z.number().min(0).default(5),
  itemCode: z.string().trim().optional().default('')
});

export const updateProductSchema = createProductSchema.partial();

export const stockAdjustmentSchema = z.object({
  quantity: z.number({ invalid_type_error: 'Adjustment quantity must be a number' }),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  reason: z.string().trim().min(3, 'Please provide a reason for the stock change')
});
