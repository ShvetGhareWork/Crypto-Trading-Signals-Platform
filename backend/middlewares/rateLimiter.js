const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Rate limiter configuration based on environment
 * Development: More lenient for testing
 * Production: Strict for security
 */

/**
 * Authentication routes rate limiter
 * Prevents brute force attacks on login/register
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' 
    ? parseInt(process.env.RATE_LIMIT_AUTH_PROD, 10) || 5
    : parseInt(process.env.RATE_LIMIT_AUTH_DEV, 10) || 100,
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests
  skipFailedRequests: false, // Count failed requests
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for auth - IP: ${req.ip}, Path: ${req.path}`);
    return errorResponse(
      res,
      429,
      'Too many authentication attempts. Please try again after 15 minutes.',
      {
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: '15 minutes',
      }
    );
  },
});

/**
 * General API routes rate limiter
 * Prevents API abuse
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production'
    ? parseInt(process.env.RATE_LIMIT_API_PROD, 10) || 100
    : parseInt(process.env.RATE_LIMIT_API_DEV, 10) || 1000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for API - IP: ${req.ip}, Path: ${req.path}`);
    return errorResponse(
      res,
      429,
      'Too many requests. Please try again after 15 minutes.',
      {
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: '15 minutes',
      }
    );
  },
});

/**
 * Strict rate limiter for sensitive operations
 * e.g., password reset, email verification
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many attempts, please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Strict rate limit exceeded - IP: ${req.ip}, Path: ${req.path}`);
    return errorResponse(
      res,
      429,
      'Too many attempts. Please try again after 1 hour.',
      {
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: '1 hour',
      }
    );
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
  strictLimiter,
};
