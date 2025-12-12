const { AppError } = require('../utils/AppError');
const { errorResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Global Error Handling Middleware
 * Catches all errors and returns consistent error responses
 * Must be the last middleware in the chain
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error
  logger.error(`Error: ${error.message}`, {
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.userId || 'unauthenticated',
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = 'Validation failed';
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return errorResponse(res, 400, message, { errors });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    return errorResponse(res, 409, message, {
      field,
      value: err.keyValue[field],
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    return errorResponse(res, 400, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Invalid token', { code: 'INVALID_TOKEN' });
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Token has expired', { code: 'TOKEN_EXPIRED' });
  }

  // Custom AppError
  if (err.isOperational) {
    return errorResponse(res, err.statusCode || 500, err.message);
  }

  // Programming or unknown errors - don't leak details in production
  const statusCode = error.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message || 'Something went wrong';

  return errorResponse(res, statusCode, message, {
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
};

/**
 * 404 Not Found Handler
 * Catches all requests to undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const message = `Route not found: ${req.method} ${req.originalUrl}`;
  logger.warn(message);
  return errorResponse(res, 404, message, {
    availableRoutes: {
      auth: '/api/v1/auth',
      signals: '/api/v1/signals',
      docs: '/api-docs',
    },
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
