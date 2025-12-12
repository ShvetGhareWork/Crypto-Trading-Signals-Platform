const User = require('../models/User');
const { verifyToken, extractToken } = require('../services/authService');
const { AuthenticationError } = require('../utils/AppError');
const { errorResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request object
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractToken(req);

    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    // Verify token
    const decoded = await verifyToken(token, 'access');

    // Find user by ID from token payload
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    next();
  } catch (error) {
    logger.error(`Authentication failed: ${error.message}`);

    // Handle specific JWT errors
    if (error.message === 'Token has expired') {
      return errorResponse(res, 401, 'Access token has expired. Please refresh your token.', {
        code: 'TOKEN_EXPIRED',
      });
    }

    if (error.message === 'Token has been revoked') {
      return errorResponse(res, 401, 'Token has been revoked. Please login again.', {
        code: 'TOKEN_REVOKED',
      });
    }

    if (error.message === 'Invalid token') {
      return errorResponse(res, 401, 'Invalid access token', {
        code: 'INVALID_TOKEN',
      });
    }

    // Generic authentication error
    return errorResponse(
      res,
      error.statusCode || 401,
      error.message || 'Authentication failed',
      { code: 'AUTHENTICATION_FAILED' }
    );
  }
};

/**
 * Optional Authentication Middleware
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next();
    }

    const decoded = await verifyToken(token, 'access');
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');

    if (user && user.isActive) {
      req.user = user;
      req.userId = user._id;
      req.userRole = user.role;
    }

    next();
  } catch (error) {
    logger.warn(`Optional authentication failed: ${error.message}`);
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate,
};
