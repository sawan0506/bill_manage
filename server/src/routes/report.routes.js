import { Router } from 'express';
import {
  getDashboardStats,
  getSalesReport,
  getCategorySalesReport,
  getGstReport,
  getProfitReport
} from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = Router();

// Dashboard overview is accessible by staff & admin
router.get('/dashboard', authenticate, getDashboardStats);

// Detailed financial reports strictly Admin only
router.get('/sales', authenticate, requireAdmin, getSalesReport);
router.get('/category-sales', authenticate, requireAdmin, getCategorySalesReport);
router.get('/gst', authenticate, requireAdmin, getGstReport);
router.get('/profit', authenticate, requireAdmin, getProfitReport);

export default router;
