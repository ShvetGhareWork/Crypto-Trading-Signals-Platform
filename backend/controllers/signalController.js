const TradingSignal = require('../models/TradingSignal');
const { cache } = require('../config/redis');
const { NotFoundError, AuthorizationError } = require('../utils/AppError');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * Cache key generators
 */
const getCacheKey = {
  signal: (id) => `signal:${id}`,
  signalsList: (page, limit, filters) => {
    const filterHash = JSON.stringify(filters);
    return `signals:page:${page}:limit:${limit}:filters:${filterHash}`;
  },
  allSignals: () => 'signals:*',
};

/**
 * @route   POST /api/v1/signals
 * @desc    Create new trading signal (Admin only)
 * @access  Private/Admin
 */
const createSignal = asyncHandler(async (req, res) => {
  const { title, description, signalType, cryptocurrency, targetPrice, confidence, expiresAt } = req.body;

  const signal = await TradingSignal.create({
    title,
    description,
    signalType,
    cryptocurrency,
    targetPrice,
    confidence,
    expiresAt,
    createdBy: req.user._id,
  });

  // Populate creator info
  await signal.populate('createdBy', 'name email');

  // Invalidate cache
  await cache.delPattern(getCacheKey.allSignals());

  logger.info(`Signal created by ${req.user.email}: ${signal.title}`);

  return successResponse(res, 201, 'Signal created successfully', { signal });
});

/**
 * @route   GET /api/v1/signals
 * @desc    Get all signals with pagination and filters
 * @access  Private
 */
const getSignals = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    signalType,
    cryptocurrency,
    minConfidence,
    status = 'active',
    sortBy = 'createdAt',
    order = 'desc',
  } = req.query;

  // Build filter object
  const filters = { status };

  if (signalType) filters.signalType = signalType;
  if (cryptocurrency) filters.cryptocurrency = new RegExp(cryptocurrency, 'i');
  if (minConfidence) filters.confidence = { $gte: parseInt(minConfidence, 10) };

  // Build sort object
  const sortOrder = order === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  // Check cache
  const cacheKey = getCacheKey.signalsList(page, limit, { filters, sort });
  const cachedData = await cache.get(cacheKey);

  if (cachedData) {
    logger.debug('Cache hit for signals list');
    return paginatedResponse(
      res,
      200,
      'Signals retrieved successfully (cached)',
      cachedData.signals,
      cachedData.pagination
    );
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const total = await TradingSignal.countDocuments(filters);
  const totalPages = Math.ceil(total / limit);

  // Fetch signals
  const signals = await TradingSignal.find(filters)
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit, 10));

  // Pagination metadata
  const pagination = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  // Cache the result (5 minutes TTL)
  const cacheTTL = parseInt(process.env.CACHE_TTL_SIGNALS, 10) || 300;
  await cache.set(cacheKey, { signals, pagination }, cacheTTL);

  return paginatedResponse(res, 200, 'Signals retrieved successfully', signals, pagination);
});

/**
 * @route   GET /api/v1/signals/:id
 * @desc    Get single signal by ID
 * @access  Private
 */
const getSignalById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check cache
  const cacheKey = getCacheKey.signal(id);
  const cachedSignal = await cache.get(cacheKey);

  if (cachedSignal) {
    logger.debug(`Cache hit for signal: ${id}`);
    return successResponse(res, 200, 'Signal retrieved successfully (cached)', {
      signal: cachedSignal,
    });
  }

  // Fetch from database
  const signal = await TradingSignal.findById(id).populate('createdBy', 'name email');

  if (!signal) {
    throw new NotFoundError('Signal not found');
  }

  // Cache the result (10 minutes TTL)
  const cacheTTL = parseInt(process.env.CACHE_TTL_SIGNAL_DETAIL, 10) || 600;
  await cache.set(cacheKey, signal, cacheTTL);

  return successResponse(res, 200, 'Signal retrieved successfully', { signal });
});

/**
 * @route   PUT /api/v1/signals/:id
 * @desc    Update signal (Admin only)
 * @access  Private/Admin
 */
const updateSignal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, signalType, cryptocurrency, targetPrice, confidence, status, expiresAt } = req.body;

  const signal = await TradingSignal.findById(id);

  if (!signal) {
    throw new NotFoundError('Signal not found');
  }

  // Update fields
  if (title) signal.title = title;
  if (description !== undefined) signal.description = description;
  if (signalType) signal.signalType = signalType;
  if (cryptocurrency) signal.cryptocurrency = cryptocurrency;
  if (targetPrice) signal.targetPrice = targetPrice;
  if (confidence) signal.confidence = confidence;
  if (status) signal.status = status;
  if (expiresAt) signal.expiresAt = expiresAt;

  await signal.save();
  await signal.populate('createdBy', 'name email');

  // Invalidate cache
  await cache.del(getCacheKey.signal(id));
  await cache.delPattern(getCacheKey.allSignals());

  logger.info(`Signal updated by ${req.user.email}: ${signal.title}`);

  return successResponse(res, 200, 'Signal updated successfully', { signal });
});

/**
 * @route   DELETE /api/v1/signals/:id
 * @desc    Delete signal (Admin only)
 * @access  Private/Admin
 */
const deleteSignal = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const signal = await TradingSignal.findById(id);

  if (!signal) {
    throw new NotFoundError('Signal not found');
  }

  await signal.deleteOne();

  // Invalidate cache
  await cache.del(getCacheKey.signal(id));
  await cache.delPattern(getCacheKey.allSignals());

  logger.info(`Signal deleted by ${req.user.email}: ${signal.title}`);

  return successResponse(res, 200, 'Signal deleted successfully');
});

/**
 * @route   GET /api/v1/signals/analytics/summary
 * @desc    Get analytics summary (Admin only)
 * @access  Private/Admin
 */
const getAnalytics = asyncHandler(async (req, res) => {
  // Aggregation pipeline for analytics
  const analytics = await TradingSignal.aggregate([
    {
      $facet: {
        totalStats: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: {
                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
              },
              expired: {
                $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] },
              },
              avgConfidence: { $avg: '$confidence' },
            },
          },
        ],
        byType: [
          {
            $group: {
              _id: '$signalType',
              count: { $sum: 1 },
              avgConfidence: { $avg: '$confidence' },
            },
          },
        ],
        byCryptocurrency: [
          {
            $group: {
              _id: '$cryptocurrency',
              count: { $sum: 1 },
              avgConfidence: { $avg: '$confidence' },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        highConfidence: [
          {
            $match: { confidence: { $gte: 80 }, status: 'active' },
          },
          { $count: 'count' },
        ],
      },
    },
  ]);

  const result = {
    total: analytics[0].totalStats[0]?.total || 0,
    active: analytics[0].totalStats[0]?.active || 0,
    expired: analytics[0].totalStats[0]?.expired || 0,
    avgConfidence: Math.round(analytics[0].totalStats[0]?.avgConfidence || 0),
    byType: analytics[0].byType,
    topCryptocurrencies: analytics[0].byCryptocurrency,
    highConfidenceCount: analytics[0].highConfidence[0]?.count || 0,
  };

  return successResponse(res, 200, 'Analytics retrieved successfully', { analytics: result });
});

module.exports = {
  createSignal,
  getSignals,
  getSignalById,
  updateSignal,
  deleteSignal,
  getAnalytics,
};
