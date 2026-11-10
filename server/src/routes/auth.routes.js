import { Router } from 'express';
import {
  login,
  refresh,
  logout,
  me,
  changePassword,
  listUsers,
  createUser,
  toggleUserStatus
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { authLimiter, authSlowDown } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  loginSchema,
  createUserSchema,
  changePasswordSchema
} from '../validators/auth.validator.js';

const router = Router();

// Public auth routes with rate limiting
router.post('/login', authLimiter, authSlowDown, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Authenticated user routes
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

// Admin-only user management
router.get('/users', authenticate, requireAdmin, listUsers);
router.post('/users', authenticate, requireAdmin, validate(createUserSchema), createUser);
router.patch('/users/:id/toggle', authenticate, requireAdmin, toggleUserStatus);

export default router;
