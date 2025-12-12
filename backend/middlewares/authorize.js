const { AuthorizationError } = require('../utils/AppError');
const { errorResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Role-Based Authorization Middleware Factory
 * Creates middleware that checks if user has required role(s)
 * 
 * Usage:
 * router.post('/admin-only', authenticate, authorize(['admin']), handler);
 * router.get('/user-or-admin', authenticate, authorize(['user', 'admin']), handler);
 * 
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
const authorize = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated first
      if (!req.user || !req.userRole) {
        throw new AuthorizationError('Authentication required for authorization');
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.userRole)) {
        // Log unauthorized access attempt
        logger.warn(
          `Unauthorized access attempt - User: ${req.user.email}, Role: ${req.userRole}, Required: ${allowedRoles.join(', ')}, Path: ${req.path}`
        );

        throw new AuthorizationError(
          `Access denied. Required role(s): ${allowedRoles.join(' or ')}`
        );
      }

      // Log admin actions for audit trail
      if (req.userRole === 'admin') {
        logger.info(
          `Admin action - User: ${req.user.email}, Method: ${req.method}, Path: ${req.path}, IP: ${req.ip}`
        );
      }

      next();
    } catch (error) {
      return errorResponse(
        res,
        error.statusCode || 403,
        error.message || 'Access denied',
        { code: 'AUTHORIZATION_FAILED' }
      );
    }
  };
};

/**
 * Check if user is admin
 * Shorthand for authorize(['admin'])
 */
const isAdmin = authorize(['admin']);

/**
 * Check if user is the resource owner or admin
 * Useful for endpoints where users can only access their own resources
 * 
 * Usage:
 * router.get('/users/:id', authenticate, isOwnerOrAdmin('id'), handler);
 * 
 * @param {string} paramName - Name of the route parameter containing user ID
 * @returns {Function} Express middleware function
 */
const isOwnerOrAdmin = (paramName = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const resourceUserId = req.params[paramName];
      const currentUserId = req.userId.toString();

      // Allow if user is admin or owns the resource
      if (req.userRole === 'admin' || currentUserId === resourceUserId) {
        return next();
      }

      logger.warn(
        `Unauthorized resource access - User: ${req.user.email}, Attempted: ${resourceUserId}, Path: ${req.path}`
      );

      throw new AuthorizationError('You can only access your own resources');
    } catch (error) {
      return errorResponse(
        res,
        error.statusCode || 403,
        error.message || 'Access denied',
        { code: 'AUTHORIZATION_FAILED' }
      );
    }
  };
};

module.exports = {
  authorize,
  isAdmin,
  isOwnerOrAdmin,
};
