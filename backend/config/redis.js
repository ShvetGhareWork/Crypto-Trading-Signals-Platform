const logger = require('../utils/logger');

let redisClient = null;

/**
 * Initialize Redis client (OPTIONAL)
 * Application works without Redis - caching is disabled if unavailable
 * @returns {Promise<Object|null>} Redis client instance or null
 */
const connectRedis = async () => {
  // Skip Redis if URL not configured
  if (!process.env.REDIS_URL || process.env.REDIS_URL === 'none') {
    logger.info('Redis: Skipped (not configured). Application running without cache.');
    return null;
  }

  try {
    const redis = require('redis');
    
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: () => {
          logger.warn('Redis: Connection failed, disabling cache');
          return false; // Don't retry
        },
      },
    });

    // Event listeners
    redisClient.on('error', (err) => {
      logger.warn(`Redis Error: ${err.message}. Continuing without cache.`);
      redisClient = null;
    });

    redisClient.on('ready', () => {
      logger.info('Redis: Connected and ready (caching enabled)');
    });

    await redisClient.connect();

    // Graceful shutdown
    process.on('SIGINT', async () => {
      if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
        logger.info('Redis connection closed due to app termination');
      }
    });

    return redisClient;
  } catch (error) {
    logger.warn(`Redis unavailable: ${error.message}. Application running without cache.`);
    return null;
  }
};

/**
 * Get Redis client instance
 * @returns {Object|null} Redis client or null if not connected
 */
const getRedisClient = () => redisClient;

/**
 * Cache helper methods
 */
const cacheHelpers = {
  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    if (!redisClient || !redisClient.isOpen) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Cache GET error for key ${key}: ${error.message}`);
      return null;
    }
  },

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = 300) {
    if (!redisClient || !redisClient.isOpen) return false;
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache SET error for key ${key}: ${error.message}`);
      return false;
    }
  },

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    if (!redisClient || !redisClient.isOpen) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache DEL error for key ${key}: ${error.message}`);
      return false;
    }
  },

  /**
   * Delete all keys matching pattern
   * @param {string} pattern - Key pattern (e.g., 'signals:*')
   * @returns {Promise<boolean>} Success status
   */
  async delPattern(pattern) {
    if (!redisClient || !redisClient.isOpen) return false;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      logger.error(`Cache DEL pattern error for ${pattern}: ${error.message}`);
      return false;
    }
  },

  /**
   * Flush all cache
   * @returns {Promise<boolean>} Success status
   */
  async flush() {
    if (!redisClient || !redisClient.isOpen) return false;
    try {
      await redisClient.flushAll();
      logger.info('Cache flushed successfully');
      return true;
    } catch (error) {
      logger.error(`Cache FLUSH error: ${error.message}`);
      return false;
    }
  },
};

module.exports = {
  connectRedis,
  getRedisClient,
  cache: cacheHelpers,
};
