import { AuditLog } from '../models/AuditLog.js';

export const listAuditLogs = async (req, res, next) => {
  try {
    const { action = '', resourceType = '', page = 1, limit = 50 } = req.query;

    const query = {};
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

    const [logs, totalCount] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};
