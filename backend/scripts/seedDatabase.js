require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const TradingSignal = require('../models/TradingSignal');
const logger = require('../utils/logger');

/**
 * Seed database with mock data
 * Creates admin user, regular users, and trading signals
 */

const mockUsers = [
  {
    name: 'Admin User',
    email: 'admin@cryptosignals.com',
    password: 'Admin@123',
    role: 'admin',
  },
  {
    name: 'John Trader',
    email: 'john@example.com',
    password: 'User@123',
    role: 'user',
  },
  {
    name: 'Sarah Crypto',
    email: 'sarah@example.com',
    password: 'User@123',
    role: 'user',
  },
];

const mockSignals = [
  {
    title: 'BTC Buy Signal - Strong Uptrend Detected',
    description:
      'Technical indicators show bullish momentum with RSI at 65 and MACD crossover. Volume increasing steadily.',
    signalType: 'BUY',
    cryptocurrency: 'Bitcoin (BTC)',
    targetPrice: 98500,
    confidence: 87,
    status: 'active',
  },
  {
    title: 'ETH Accumulation Zone - Long-term Hold',
    description:
      'Ethereum showing strong support at $3,800. Institutional accumulation detected. Good entry point for long-term holders.',
    signalType: 'BUY',
    cryptocurrency: 'Ethereum (ETH)',
    targetPrice: 4200,
    confidence: 92,
    status: 'active',
  },
  {
    title: 'SOL Sell Signal - Overbought Territory',
    description:
      'Solana RSI above 80, showing overbought conditions. Recommend taking profits at current levels.',
    signalType: 'SELL',
    cryptocurrency: 'Solana (SOL)',
    targetPrice: 180,
    confidence: 78,
    status: 'active',
  },
  {
    title: 'ADA Hold Position - Consolidation Phase',
    description:
      'Cardano in consolidation phase. Wait for breakout confirmation before taking action.',
    signalType: 'HOLD',
    cryptocurrency: 'Cardano (ADA)',
    targetPrice: 0.65,
    confidence: 65,
    status: 'active',
  },
  {
    title: 'BNB Strong Buy - Binance Ecosystem Growth',
    description:
      'BNB showing strong fundamentals with increasing DEX volume and ecosystem adoption. Technical breakout confirmed.',
    signalType: 'BUY',
    cryptocurrency: 'Binance Coin (BNB)',
    targetPrice: 650,
    confidence: 85,
    status: 'active',
  },
  {
    title: 'XRP Caution - Regulatory Uncertainty',
    description:
      'Ripple facing regulatory headwinds. Recommend holding current positions but avoid new entries.',
    signalType: 'HOLD',
    cryptocurrency: 'Ripple (XRP)',
    targetPrice: 0.75,
    confidence: 55,
    status: 'active',
  },
  {
    title: 'MATIC Buy Signal - Layer 2 Momentum',
    description:
      'Polygon showing strong adoption metrics. Network activity increasing with new partnerships announced.',
    signalType: 'BUY',
    cryptocurrency: 'Polygon (MATIC)',
    targetPrice: 1.2,
    confidence: 80,
    status: 'active',
  },
  {
    title: 'DOGE Sell Recommendation - Meme Cycle Ending',
    description:
      'Dogecoin showing weakening momentum. Social sentiment declining. Recommend profit-taking.',
    signalType: 'SELL',
    cryptocurrency: 'Dogecoin (DOGE)',
    targetPrice: 0.08,
    confidence: 70,
    status: 'active',
  },
  {
    title: 'LINK Accumulation Alert - Oracle Demand Rising',
    description:
      'Chainlink oracle services seeing increased demand. Strong fundamentals with technical support at $18.',
    signalType: 'BUY',
    cryptocurrency: 'Chainlink (LINK)',
    targetPrice: 22,
    confidence: 88,
    status: 'active',
  },
  {
    title: 'AVAX Hold - Awaiting Network Upgrade',
    description:
      'Avalanche network upgrade scheduled. Recommend holding positions until post-upgrade price action.',
    signalType: 'HOLD',
    cryptocurrency: 'Avalanche (AVAX)',
    targetPrice: 45,
    confidence: 72,
    status: 'active',
  },
  {
    title: 'DOT Expired Signal - Previous Buy Recommendation',
    description: 'Previous buy signal for Polkadot has expired. Target reached.',
    signalType: 'BUY',
    cryptocurrency: 'Polkadot (DOT)',
    targetPrice: 8.5,
    confidence: 75,
    status: 'expired',
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB connected for seeding');

    // Clear existing data
    await User.deleteMany({});
    await TradingSignal.deleteMany({});
    logger.info('Existing data cleared');

    // Create users
    const createdUsers = await User.create(mockUsers);
    logger.info(`${createdUsers.length} users created`);

    // Get admin user for signal creation
    const adminUser = createdUsers.find((user) => user.role === 'admin');

    // Create signals (all created by admin)
    const signalsWithCreator = mockSignals.map((signal) => ({
      ...signal,
      createdBy: adminUser._id,
    }));

    const createdSignals = await TradingSignal.create(signalsWithCreator);
    logger.info(`${createdSignals.length} trading signals created`);

    // Display credentials
    console.log('\n========================================');
    console.log('DATABASE SEEDED SUCCESSFULLY');
    console.log('========================================\n');
    console.log('Admin Credentials:');
    console.log('Email: admin@cryptosignals.com');
    console.log('Password: Admin@123\n');
    console.log('User Credentials:');
    console.log('Email: john@example.com');
    console.log('Password: User@123\n');
    console.log('Email: sarah@example.com');
    console.log('Password: User@123\n');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();
