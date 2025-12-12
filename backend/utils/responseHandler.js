/**
 * Standardized API response handler
 * Ensures consistent response format across all endpoints
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {any} data - Response data
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null,
  });
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {any} error - Error details (only in development)
 */
const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', error = null) => {
  const response = {
    success: false,
    message,
    data: null,
    error: process.env.NODE_ENV === 'development' ? error : null,
  };

  return res.status(statusCode).json(response);
};

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination metadata
 */
const paginatedResponse = (res, statusCode = 200, message = 'Success', data = [], pagination = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      total: pagination.total || 0,
      totalPages: pagination.totalPages || 0,
      hasNextPage: pagination.hasNextPage || false,
      hasPrevPage: pagination.hasPrevPage || false,
    },
    error: null,
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};
