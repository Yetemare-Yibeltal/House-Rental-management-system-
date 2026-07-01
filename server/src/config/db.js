const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      logger.info(`MongoDB connected: ${conn.connection.host}`);
      logger.info(`Database name: ${conn.connection.name}`);

      // Handle connection events after initial connect
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

      break; // Connection successful, exit retry loop
    } catch (error) {
      retries += 1;
      logger.error(
        `MongoDB connection failed (attempt ${retries}/${maxRetries}): ${error.message}`
      );

      if (retries === maxRetries) {
        logger.error('Max retries reached. Could not connect to MongoDB. Exiting...');
        process.exit(1);
      }

      // Wait 5 seconds before retrying
      logger.info('Retrying in 5 seconds...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

module.exports = connectDB;
