import { Router } from 'express';
import { listAuditLogs } from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = Router();

router.get('/', authenticate, requireAdmin, listAuditLogs);

export default router;
