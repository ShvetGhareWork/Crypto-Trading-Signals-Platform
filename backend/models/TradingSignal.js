const mongoose = require('mongoose');

/**
 * Trading Signal Schema
 * Represents crypto trading signals with confidence levels and status
 */
const tradingSignalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Signal title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    signalType: {
      type: String,
      required: [true, 'Signal type is required'],
      enum: {
        values: ['BUY', 'SELL', 'HOLD'],
        message: 'Signal type must be BUY, SELL, or HOLD',
      },
    },
    cryptocurrency: {
      type: String,
      required: [true, 'Cryptocurrency is required'],
      trim: true,
      minlength: [2, 'Cryptocurrency name must be at least 2 characters'],
      maxlength: [50, 'Cryptocurrency name cannot exceed 50 characters'],
    },
    targetPrice: {
      type: Number,
      required: [true, 'Target price is required'],
      min: [0, 'Target price must be positive'],
    },
    confidence: {
      type: Number,
      required: [true, 'Confidence level is required'],
      min: [1, 'Confidence must be at least 1'],
      max: [100, 'Confidence cannot exceed 100'],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'expired'],
        message: 'Status must be either active or expired',
      },
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      default: function () {
        // Signals expire after 7 days by default
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
tradingSignalSchema.index({ signalType: 1 });
tradingSignalSchema.index({ cryptocurrency: 1 });
tradingSignalSchema.index({ createdAt: -1 });
tradingSignalSchema.index({ status: 1 });
tradingSignalSchema.index({ confidence: -1 });
// Compound index for common queries
tradingSignalSchema.index({ status: 1, createdAt: -1 });
tradingSignalSchema.index({ signalType: 1, status: 1 });

/**
 * Virtual: Time until expiry
 */
tradingSignalSchema.virtual('timeToExpiry').get(function () {
  if (!this.expiresAt) return null;
  const now = new Date();
  const diff = this.expiresAt - now;
  return diff > 0 ? Math.floor(diff / 1000) : 0; // Return seconds
});

/**
 * Virtual: Is expired
 */
tradingSignalSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

/**
 * Pre-save hook: Auto-update status based on expiry
 */
tradingSignalSchema.pre('save', function (next) {
  if (this.expiresAt && new Date() > this.expiresAt) {
    this.status = 'expired';
  }
  next();
});

/**
 * Static method: Get active signals with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of signals
 */
tradingSignalSchema.statics.getActiveSignals = function (filters = {}) {
  const query = { status: 'active', ...filters };
  return this.find(query).populate('createdBy', 'name email').sort({ createdAt: -1 });
};

/**
 * Static method: Get signals by type
 * @param {string} type - Signal type (BUY, SELL, HOLD)
 * @returns {Promise<Array>} Array of signals
 */
tradingSignalSchema.statics.getByType = function (type) {
  return this.find({ signalType: type, status: 'active' })
    .populate('createdBy', 'name email')
    .sort({ confidence: -1, createdAt: -1 });
};

/**
 * Static method: Get high confidence signals
 * @param {number} minConfidence - Minimum confidence level (default: 80)
 * @returns {Promise<Array>} Array of signals
 */
tradingSignalSchema.statics.getHighConfidence = function (minConfidence = 80) {
  return this.find({
    confidence: { $gte: minConfidence },
    status: 'active',
  })
    .populate('createdBy', 'name email')
    .sort({ confidence: -1, createdAt: -1 });
};

/**
 * Instance method: Mark signal as expired
 */
tradingSignalSchema.methods.markExpired = async function () {
  this.status = 'expired';
  await this.save();
};

const TradingSignal = mongoose.model('TradingSignal', tradingSignalSchema);

module.exports = TradingSignal;
