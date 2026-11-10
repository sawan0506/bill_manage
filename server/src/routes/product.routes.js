import { Router } from 'express';
import {
  listProducts,
  searchAutocomplete,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  deactivateProduct,
  bulkImportCsv
} from '../controllers/product.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
  stockAdjustmentSchema
} from '../validators/product.validator.js';

const router = Router();

// Staff & Admin can list and search products
router.get('/', authenticate, listProducts);
router.get('/autocomplete', authenticate, searchAutocomplete);
router.get('/:id', authenticate, getProductById);

// Admin-only operations (add, edit, stock adjust, deactivate, import)
router.post('/', authenticate, requireAdmin, validate(createProductSchema), createProduct);
router.put('/:id', authenticate, requireAdmin, validate(updateProductSchema), updateProduct);
router.patch('/:id/stock', authenticate, requireAdmin, validate(stockAdjustmentSchema), adjustStock);
router.delete('/:id', authenticate, requireAdmin, deactivateProduct);
router.post('/import-csv', authenticate, requireAdmin, bulkImportCsv);

export default router;
