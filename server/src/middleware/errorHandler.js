import { logger } from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    stack: err.stack,
    ip: req.ip,
    user: req.user?._id
  });

  // Handle Mongoose Duplicate Key Error (e.g. unique username, phone, or invoice)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'record';
    return res.status(409).json({
      success: false,
      message: `A entry with this ${field} already exists. Please use a different value.`
    });
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const firstKey = Object.keys(err.errors)[0];
    const friendlyMsg = err.errors[firstKey]?.message || 'Please check the required fields.';
    return res.status(400).json({
      success: false,
      message: friendlyMsg
    });
  }

  // Handle Invalid ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid record identifier specified.'
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid session token. Please log in again.'
    });
  }

  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const friendlyMessage =
    statusCode === 500
      ? 'An unexpected error occurred. Please try again or contact the administrator.'
      : err.message || 'Operation failed.';

  res.status(statusCode).json({
    success: false,
    message: friendlyMessage
  });
};
