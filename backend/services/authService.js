const jwt = require('jsonwebtoken');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Authentication Service
 * Handles JWT token generation, verification, and blacklisting
 */

/**
 * Generate access token (short-lived)
 * @param {Object} user - User object
 * @returns {string} JWT access token
 */
const generateAccessToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    type: 'access',
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    issuer: 'crypto-signals-api',
    audience: 'crypto-signals-client',
  });
};

/**
 * Generate refresh token (long-lived)
 * @param {Object} user - User object
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    type: 'refresh',
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: 'crypto-signals-api',
    audience: 'crypto-signals-client',
  });
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object containing both tokens
 */
const generateTokenPair = (user) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @param {string} type - Token type ('access' or 'refresh')
 * @returns {Promise<Object>} Decoded token payload
 * @throws {Error} If token is invalid or blacklisted
 */
const verifyToken = async (token, type = 'access') => {
  try {
    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new Error('Token has been revoked');
    }

    // Verify token signature and expiry
    const secret = type === 'access' ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET;
    const decoded = jwt.verify(token, secret, {
      issuer: 'crypto-signals-api',
      audience: 'crypto-signals-client',
    });

    // Verify token type matches
    if (decoded.type !== type) {
      throw new Error(`Invalid token type. Expected ${type}, got ${decoded.type}`);
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw error;
    }
  }
};

/**
 * Blacklist a token (add to Redis with TTL)
 * @param {string} token - Token to blacklist
 * @param {number} expiresIn - Token expiry time in seconds
 * @returns {Promise<boolean>} Success status
 */
const blacklistToken = async (token, expiresIn = 900) => {
  try {
    const key = `blacklist:${token}`;
    await cache.set(key, true, expiresIn);
    logger.info('Token blacklisted successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to blacklist token: ${error.message}`);
    return false;
  }
};

/**
 * Check if token is blacklisted
 * @param {string} token - Token to check
 * @returns {Promise<boolean>} True if blacklisted
 */
const isTokenBlacklisted = async (token) => {
  try {
    const key = `blacklist:${token}`;
    const result = await cache.get(key);
    return result !== null;
  } catch (error) {
    logger.error(`Failed to check token blacklist: ${error.message}`);
    return false; // Fail open to avoid blocking valid tokens
  }
};

/**
 * Extract token from request headers or cookies
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null
 */
const extractToken = (req) => {
  // Check Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.substring(7);
  }

  // Check cookies (httpOnly)
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

/**
 * Extract refresh token from request
 * @param {Object} req - Express request object
 * @returns {string|null} Refresh token or null
 */
const extractRefreshToken = (req) => {
  // Check cookies first (preferred method)
  if (req.cookies && req.cookies.refreshToken) {
    return req.cookies.refreshToken;
  }

  // Check request body as fallback
  if (req.body && req.body.refreshToken) {
    return req.body.refreshToken;
  }

  return null;
};

/**
 * Get token expiry time in seconds
 * @param {string} token - JWT token
 * @returns {number} Seconds until expiry
 */
const getTokenExpiry = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return 900; // Default 15 minutes
    }
    const now = Math.floor(Date.now() / 1000);
    return Math.max(decoded.exp - now, 0);
  } catch (error) {
    return 900;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  blacklistToken,
  isTokenBlacklisted,
  extractToken,
  extractRefreshToken,
  getTokenExpiry,
};
