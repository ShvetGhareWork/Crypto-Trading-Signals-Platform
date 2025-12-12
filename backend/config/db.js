const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * MongoDB connection with retry logic and error handling
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  const connect = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        // Mongoose 6+ no longer needs these options, but keeping for compatibility
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      logger.info(`Database Name: ${conn.connection.name}`);

      // Connection event listeners
      mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB connection error: ${err.message}`);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected successfully');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed due to app termination');
        process.exit(0);
      });

    } catch (error) {
      logger.error(`MongoDB connection failed: ${error.message}`);
      
      retries += 1;
      if (retries < maxRetries) {
        logger.info(`Retrying connection... Attempt ${retries}/${maxRetries}`);
        setTimeout(connect, 5000); // Retry after 5 seconds
      } else {
        logger.error('Max retries reached. Exiting application.');
        process.exit(1);
      }
    }
  };

  await connect();
};

module.exports = connectDB;
