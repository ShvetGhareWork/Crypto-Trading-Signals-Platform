const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/AppError');
const { errorResponse } = require('../utils/responseHandler');

/**
 * Validation result handler
 * Checks for validation errors and returns formatted error response
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return errorResponse(res, 400, 'Validation failed', {
      errors: formattedErrors,
    });
  }

  next();
};

/**
 * User Registration Validation Rules
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Name must be between 3 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    ),

  handleValidationErrors,
];

/**
 * User Login Validation Rules
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password').notEmpty().withMessage('Password is required'),

  handleValidationErrors,
];

/**
 * Trading Signal Creation/Update Validation Rules
 */
const signalValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('signalType')
    .notEmpty()
    .withMessage('Signal type is required')
    .isIn(['BUY', 'SELL', 'HOLD'])
    .withMessage('Signal type must be BUY, SELL, or HOLD'),

  body('cryptocurrency')
    .trim()
    .notEmpty()
    .withMessage('Cryptocurrency is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Cryptocurrency name must be between 2 and 50 characters'),

  body('targetPrice')
    .notEmpty()
    .withMessage('Target price is required')
    .isFloat({ min: 0 })
    .withMessage('Target price must be a positive number'),

  body('confidence')
    .notEmpty()
    .withMessage('Confidence level is required')
    .isInt({ min: 1, max: 100 })
    .withMessage('Confidence must be between 1 and 100'),

  body('status')
    .optional()
    .isIn(['active', 'expired'])
    .withMessage('Status must be either active or expired'),

  handleValidationErrors,
];

/**
 * Pagination Query Validation
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  handleValidationErrors,
];

/**
 * Signal Filter Validation
 */
const signalFilterValidation = [
  query('signalType')
    .optional()
    .isIn(['BUY', 'SELL', 'HOLD'])
    .withMessage('Signal type must be BUY, SELL, or HOLD'),

  query('cryptocurrency')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Cryptocurrency name must be between 2 and 50 characters'),

  query('minConfidence')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Minimum confidence must be between 1 and 100')
    .toInt(),

  query('status')
    .optional()
    .isIn(['active', 'expired'])
    .withMessage('Status must be either active or expired'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'confidence', 'targetPrice'])
    .withMessage('Sort by must be createdAt, confidence, or targetPrice'),

  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),

  handleValidationErrors,
];

/**
 * MongoDB ObjectId Validation
 */
const objectIdValidation = (paramName = 'id') => [
  param(paramName)
    .notEmpty()
    .withMessage(`${paramName} is required`)
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage(`Invalid ${paramName} format`),

  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  signalValidation,
  paginationValidation,
  signalFilterValidation,
  objectIdValidation,
  handleValidationErrors,
};
