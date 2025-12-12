const User = require('../models/User');
const {
  generateTokenPair,
  verifyToken,
  blacklistToken,
  extractRefreshToken,
  getTokenExpiry,
} = require('../services/authService');
const {
  ValidationError,
  AuthenticationError,
  ConflictError,
} = require('../utils/AppError');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * Cookie options for JWT tokens
 */
const getCookieOptions = () => ({
  httpOnly: true, // Prevents XSS attacks
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict', // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password, // Will be hashed by pre-save hook
    role: 'user', // Default role
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokenPair(user);

  // Save refresh token to user document
  await user.addRefreshToken(refreshToken);

  // Set tokens in httpOnly cookies
  res.cookie('accessToken', accessToken, {
    ...getCookieOptions(),
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, getCookieOptions());

  logger.info(`New user registered: ${email}`);

  return successResponse(res, 201, 'User registered successfully', {
    user: user.profile,
    tokens: {
      accessToken,
      refreshToken,
    },
  });
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password field
  const user = await User.findByCredentials(email);

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AuthenticationError('Account is deactivated. Please contact support.');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    logger.warn(`Failed login attempt for email: ${email}`);
    throw new AuthenticationError('Invalid email or password');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokenPair(user);

  // Save refresh token to user document
  await user.addRefreshToken(refreshToken);

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Set tokens in httpOnly cookies
  res.cookie('accessToken', accessToken, {
    ...getCookieOptions(),
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, getCookieOptions());

  logger.info(`User logged in: ${email}`);

  return successResponse(res, 200, 'Login successful', {
    user: user.profile,
    tokens: {
      accessToken,
      refreshToken,
    },
  });
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = extractRefreshToken(req);

  if (!refreshToken) {
    throw new AuthenticationError('Refresh token is required');
  }

  // Verify refresh token
  const decoded = await verifyToken(refreshToken, 'refresh');

  // Find user and check if refresh token exists in database
  const user = await User.findById(decoded.userId).select('+refreshTokens');

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  if (!user.refreshTokens.includes(refreshToken)) {
    logger.warn(`Invalid refresh token used for user: ${user.email}`);
    throw new AuthenticationError('Invalid refresh token');
  }

  // Generate new token pair (refresh token rotation)
  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);

  // Remove old refresh token and add new one
  await user.removeRefreshToken(refreshToken);
  await user.addRefreshToken(newRefreshToken);

  // Set new tokens in cookies
  res.cookie('accessToken', accessToken, {
    ...getCookieOptions(),
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', newRefreshToken, getCookieOptions());

  logger.info(`Access token refreshed for user: ${user.email}`);

  return successResponse(res, 200, 'Token refreshed successfully', {
    tokens: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  });
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (blacklist tokens)
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  const refreshToken = extractRefreshToken(req);

  // Blacklist access token
  const accessToken = req.cookies.accessToken || req.headers.authorization?.substring(7);
  if (accessToken) {
    const expiry = getTokenExpiry(accessToken);
    await blacklistToken(accessToken, expiry);
  }

  // Remove refresh token from user document
  if (refreshToken && req.user) {
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (user) {
      await user.removeRefreshToken(refreshToken);
    }
  }

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  logger.info(`User logged out: ${req.user?.email || 'Unknown'}`);

  return successResponse(res, 200, 'Logout successful');
});

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices (remove all refresh tokens)
 * @access  Private
 */
const logoutAll = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+refreshTokens');

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Remove all refresh tokens
  await user.removeAllRefreshTokens();

  // Blacklist current access token
  const accessToken = req.cookies.accessToken || req.headers.authorization?.substring(7);
  if (accessToken) {
    const expiry = getTokenExpiry(accessToken);
    await blacklistToken(accessToken, expiry);
  }

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  logger.info(`User logged out from all devices: ${user.email}`);

  return successResponse(res, 200, 'Logged out from all devices successfully');
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  return successResponse(res, 200, 'User profile retrieved successfully', {
    user: user.profile,
  });
});

/**
 * @route   PUT /api/v1/auth/update-profile
 * @desc    Update user profile (name only)
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  if (name) {
    user.name = name;
  }

  await user.save();

  logger.info(`Profile updated for user: ${user.email}`);

  return successResponse(res, 200, 'Profile updated successfully', {
    user: user.profile,
  });
});

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  logoutAll,
  getMe,
  updateProfile,
};
