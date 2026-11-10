import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../config/logger.js';

export const logAudit = async ({
  action,
  resourceType,
  resourceId = '',
  req = null,
  user = null,
  details = {}
}) => {
  try {
    const performedBy = user?._id || req?.user?._id || null;
    const performedByName = user?.name || req?.user?.name || 'System';
    const performedByRole = user?.role || req?.user?.role || '';
    const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '';
    const userAgent = req?.headers['user-agent'] || '';

    await AuditLog.create({
      action,
      resourceType,
      resourceId: String(resourceId),
      performedBy,
      performedByName,
      performedByRole,
      ipAddress,
      userAgent,
      details,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error(`Failed to record audit log: ${err.message}`, { action, resourceType });
  }
};
